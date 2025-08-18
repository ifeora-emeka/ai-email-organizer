import { gmail_v1, google } from 'googleapis';
import { prisma } from '../prisma';
import { AIService, EmailContent } from './ai.service';

// Configuration constants
const POLLING_INTERVAL = 30000; // Increased to 30s to reduce API calls
const MAX_MESSAGES_PER_POLL = 5; // Reduced from 10 for better performance
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;
const RATE_LIMIT_DELAY = 1000; // Delay between API calls

// Types for better type safety
interface EmailMetadata
{
    subject?: string;
    from?: string;
    to?: string;
    cc?: string;
    bcc?: string;
    date?: string;
}

interface ProcessingResult
{
    processed: number;
    failed: number;
    errors: string[];
}

export class GmailPollingService
{
    private static pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private static processingLocks: Set<string> = new Set(); // Prevent concurrent processing
    private static rateLimiters: Map<string, number> = new Map(); // Track API rate limits

    static async startPollingForAccount(gmailAccountId: string): Promise<boolean>
    {
        try {
            // Validate account exists first
            const gmailAccount = await this.validateGmailAccount(gmailAccountId);
            if (!gmailAccount) return false;

            // Stop existing polling if any
            this.stopPollingForAccount(gmailAccountId);

            // Start polling with error handling
            const interval = setInterval(async () =>
            {
                if (!this.processingLocks.has(gmailAccountId)) {
                    await this.pollForNewEmails(gmailAccountId);
                }
            }, POLLING_INTERVAL);

            this.pollingIntervals.set(gmailAccountId, interval);

            // Do initial poll with delay to avoid immediate rate limiting
            setTimeout(() => this.pollForNewEmails(gmailAccountId), 1000);

            console.log(`✅ Started polling for Gmail account: ${gmailAccount.email}`);
            return true;

        } catch (error) {
            console.error(`❌ Error starting polling for ${gmailAccountId}:`, error);
            return false;
        }
    }

    static stopPollingForAccount(gmailAccountId: string): void
    {
        const interval = this.pollingIntervals.get(gmailAccountId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(gmailAccountId);
            this.processingLocks.delete(gmailAccountId);
            console.log(`⏹️ Stopped polling for Gmail account: ${gmailAccountId}`);
        }
    }

    static async pollForNewEmails(gmailAccountId: string): Promise<void>
    {
        // Prevent concurrent processing for the same account
        if (this.processingLocks.has(gmailAccountId)) {
            console.log(`⏳ Polling already in progress for account: ${gmailAccountId}`);
            return;
        }

        this.processingLocks.add(gmailAccountId);

        try {
            const gmailAccount = await this.validateGmailAccount(gmailAccountId);
            if (!gmailAccount) return;

            const gmail = await this.createGmailClient(gmailAccount);
            if (!gmail) return;

            // Get unread messages with better query
            const query = this.buildEmailQuery(gmailAccount.lastSync);
            const messages = await this.fetchMessages(gmail, query);

            if (messages.length === 0) {
                await this.updateLastSync(gmailAccountId);
                return;
            }

            console.log(`📧 Found ${messages.length} new messages for ${gmailAccountId}`);

            // Process messages in batches to avoid overwhelming the system
            const results = await this.processMessagesInBatches(gmailAccountId, messages, gmail);

            // Update last sync time
            await this.updateLastSync(gmailAccountId);

            console.log(`✅ Processed ${results.processed} emails, failed: ${results.failed} for account ${gmailAccountId}`);

        } catch (error) {
            console.error(`❌ Error polling emails for account ${gmailAccountId}:`, error);
            await this.handlePollingError(gmailAccountId, error);
        } finally {
            this.processingLocks.delete(gmailAccountId);
        }
    }

    private static async validateGmailAccount(gmailAccountId: string)
    {
        const gmailAccount = await prisma.gmailAccount.findUnique({
            where: { id: gmailAccountId },
            select: {
                id: true,
                email: true,
                accessToken: true,
                refreshToken: true,
                userId: true,
                lastSync: true
            }
        });

        if (!gmailAccount) {
            console.error(`❌ Gmail account ${gmailAccountId} not found`);
            return null;
        }

        return gmailAccount;
    }

    private static async createGmailClient(gmailAccount: any): Promise<gmail_v1.Gmail | null>
    {
        try {
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI || 'https://ai-email-organizer-1.onrender.com/api/v1/gmail-accounts/callback'
            );

            oauth2Client.setCredentials({
                access_token: gmailAccount.accessToken,
                refresh_token: gmailAccount.refreshToken
            });

            // Handle token refresh automatically
            oauth2Client.on('tokens', async (tokens) =>
            {
                if (tokens.access_token) {
                    await prisma.gmailAccount.update({
                        where: { id: gmailAccount.id },
                        data: { accessToken: tokens.access_token }
                    });
                }
            });

            return google.gmail({ version: 'v1', auth: oauth2Client });
        } catch (error) {
            console.error(`❌ Failed to create Gmail client for ${gmailAccount.id}:`, error);
            return null;
        }
    }

    private static buildEmailQuery(lastSync?: Date): string
    {
        const baseQuery = 'is:unread in:inbox';

        if (lastSync) {
            // Only get emails newer than last sync
            const lastSyncDate = new Date(lastSync);
            const yesterday = new Date(lastSyncDate.getTime() - 24 * 60 * 60 * 1000);
            const dateString = yesterday.toISOString().split('T')[ 0 ].replace(/-/g, '/');
            return `${baseQuery} after:${dateString}`;
        }

        return baseQuery;
    }

    private static async fetchMessages(gmail: gmail_v1.Gmail, query: string)
    {
        try {
            const response = await gmail.users.messages.list({
                userId: 'me',
                labelIds: [ 'INBOX' ],
                maxResults: MAX_MESSAGES_PER_POLL,
                q: query
            });

            return response.data.messages || [];
        } catch (error) {
            console.error('❌ Error fetching messages:', error);
            return [];
        }
    }

    private static async processMessagesInBatches(
        gmailAccountId: string,
        messages: any[],
        gmail: gmail_v1.Gmail
    ): Promise<ProcessingResult>
    {
        const result: ProcessingResult = { processed: 0, failed: 0, errors: [] };

        for (const message of messages) {
            if (!message.id) continue;

            try {
                // Add delay between API calls to respect rate limits
                await this.rateLimitDelay(gmailAccountId);

                await this.processNewEmail(gmailAccountId, message.id, gmail);
                result.processed++;
            } catch (error) {
                result.failed++;
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                result.errors.push(`Message ${message.id}: ${errorMsg}`);
                console.error(`❌ Failed to process message ${message.id}:`, error);
            }
        }

        return result;
    }

    private static async rateLimitDelay(gmailAccountId: string): Promise<void>
    {
        const lastCall = this.rateLimiters.get(gmailAccountId) || 0;
        const now = Date.now();
        const timeSinceLastCall = now - lastCall;

        if (timeSinceLastCall < RATE_LIMIT_DELAY) {
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastCall));
        }

        this.rateLimiters.set(gmailAccountId, Date.now());
    }

    private static async processNewEmail(
        gmailAccountId: string,
        messageId: string,
        gmail: gmail_v1.Gmail
    ): Promise<void>
    {
        // Check if email already exists (with better error handling)
        const existingEmail = await prisma.email.findUnique({
            where: { messageId },
            select: { id: true }
        });

        if (existingEmail) {
            return; // Skip already processed emails
        }

        // Get Gmail account with categories in a single query
        const gmailAccount = await prisma.gmailAccount.findUnique({
            where: { id: gmailAccountId },
            include: {
                user: {
                    include: {
                        categories: true
                    }
                }
            }
        });

        if (!gmailAccount) {
            throw new Error(`Gmail account ${gmailAccountId} not found`);
        }

        // Get email details from Gmail API
        const messageResponse = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full'
        });

        const message = messageResponse.data;
        const metadata = this.extractEmailMetadata(message.payload?.headers || []);
        const { body, htmlBody, hasAttachments } = this.extractEmailBody(message.payload);

        // Parse sender information more reliably
        const { fromName, fromEmail } = this.parseSenderInfo(metadata.from);

        // Prepare email content for AI processing
        const emailContent: EmailContent = {
            subject: metadata.subject,
            fromEmail,
            fromName: fromName || '',
            body,
            htmlBody
        };

        // Process with AI
        const aiResult = await AIService.categorizeAndSummarizeEmail(
            emailContent,
            gmailAccount.user.categories
        );

        if (!aiResult) {
            throw new Error('AI processing failed');
        }

        // Create email record in transaction for data consistency
        await prisma.$transaction(async (tx) =>
        {
            await tx.email.create({
                data: {
                    gmailAccountId,
                    messageId,
                    threadId: message.threadId,
                    subject: metadata.subject,
                    fromEmail,
                    fromName,
                    toEmails: metadata.to || '',
                    ccEmails: metadata.cc,
                    bccEmails: metadata.bcc,
                    body,
                    htmlBody,
                    receivedAt: metadata.date ? new Date(metadata.date) : new Date(),
                    hasAttachments,
                    aiSummary: aiResult.summary,
                    aiCategory: aiResult.categoryName,
                    aiConfidence: aiResult.confidence,
                    unsubscribeLink: aiResult.unsubscribeLink,
                    categoryId: aiResult.categoryId
                }
            });

            // Remove from processing queue if it exists
            await tx.emailProcessingQueue.deleteMany({
                where: {
                    gmailAccountId,
                    messageId
                }
            });
        });

        // Archive the email (with improved error handling)
        await this.archiveEmail(gmail, messageId);
    }

    private static extractEmailMetadata(headers: any[]): EmailMetadata
    {
        const headerMap = new Map(
            headers.map((h: any) => [ h.name?.toLowerCase(), h.value ])
        );

        return {
            subject: headerMap.get('subject'),
            from: headerMap.get('from'),
            to: headerMap.get('to'),
            cc: headerMap.get('cc'),
            bcc: headerMap.get('bcc'),
            date: headerMap.get('date')
        };
    }

    private static parseSenderInfo(from?: string): { fromName: string | null; fromEmail: string; }
    {
        if (!from) return { fromName: null, fromEmail: '' };

        const match = from.match(/^(.*?)\s*<(.+?)>$/) || [ null, null, from ];
        return {
            fromName: match[ 1 ]?.trim() || null,
            fromEmail: match[ 2 ]?.trim() || from.trim()
        };
    }

    private static extractEmailBody(payload: any):
        {
            body: string;
            htmlBody: string;
            hasAttachments: boolean;
        }
    {
        let body = '';
        let htmlBody = '';
        let hasAttachments = false;

        const extractPart = (part: any): void =>
        {
            if (part.mimeType === 'text/plain' && part.body?.data) {
                body = Buffer.from(part.body.data, 'base64').toString('utf-8');
            } else if (part.mimeType === 'text/html' && part.body?.data) {
                htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
            } else if (part.filename && part.filename.length > 0) {
                hasAttachments = true;
            }

            if (part.parts) {
                part.parts.forEach(extractPart);
            }
        };

        if (payload) {
            extractPart(payload);
        }

        return { body, htmlBody, hasAttachments };
    }

    private static async archiveEmail(gmail: gmail_v1.Gmail, messageId: string): Promise<void>
    {
        try {
            await gmail.users.messages.modify({
                userId: 'me',
                id: messageId,
                requestBody: {
                    removeLabelIds: [ 'INBOX', 'UNREAD' ]
                }
            });
        } catch (error) {
            console.error(`⚠️ Failed to archive email ${messageId}:`, error);
            // Don't throw - archiving failure shouldn't stop email processing
        }
    }

    private static async updateLastSync(gmailAccountId: string): Promise<void>
    {
        try {
            await prisma.gmailAccount.update({
                where: { id: gmailAccountId },
                data: { lastSync: new Date() }
            });
        } catch (error) {
            console.error(`❌ Failed to update last sync for ${gmailAccountId}:`, error);
        }
    }

    private static async handlePollingError(gmailAccountId: string, error: any): Promise<void>
    {
        // Log detailed error information
        console.error(`❌ Polling error for account ${gmailAccountId}:`, {
            message: error?.message,
            code: error?.code,
            stack: error?.stack
        });

        // Handle specific error types
        if (error?.code === 401 || error?.message?.includes('invalid_grant')) {
            console.log(`🔄 Token refresh needed for account ${gmailAccountId}`);
            // Could trigger token refresh logic here
        }
    }

    // Utility methods
    static async stopAllPolling(): Promise<void>
    {
        for (const [ accountId, interval ] of this.pollingIntervals) {
            clearInterval(interval);
        }
        this.pollingIntervals.clear();
        this.processingLocks.clear();
        this.rateLimiters.clear();
        console.log('⏹️ Stopped all Gmail polling');
    }

    static async refreshPolling(gmailAccountId: string): Promise<boolean>
    {
        try {
            this.stopPollingForAccount(gmailAccountId);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
            return await this.startPollingForAccount(gmailAccountId);
        } catch (error) {
            console.error(`❌ Error refreshing polling for ${gmailAccountId}:`, error);
            return false;
        }
    }

    static async manualPoll(gmailAccountId: string): Promise<ProcessingResult>
    {
        try {
            await this.pollForNewEmails(gmailAccountId);
            return { processed: 1, failed: 0, errors: [] };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Manual poll failed:', error);
            return { processed: 0, failed: 1, errors: [ errorMsg ] };
        }
    }

    // Health check method
    static getPollingStatus():
        {
            activeAccounts: number;
            accountIds: string[];
            processingLocks: string[];
        }
    {
        return {
            activeAccounts: this.pollingIntervals.size,
            accountIds: Array.from(this.pollingIntervals.keys()),
            processingLocks: Array.from(this.processingLocks)
        };
    }
}
