import { google } from 'googleapis';
import { prisma } from '../prisma';
import { AIService, EmailContent } from './ai.service';

const POLLING_INTERVAL = 10000;

export class GmailPollingService
{
    private static pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

    static async startPollingForAccount(gmailAccountId: string): Promise<boolean>
    {
        try {
            const gmailAccount = await prisma.gmailAccount.findUnique({
                where: { id: gmailAccountId }
            });

            if (!gmailAccount) {
                throw new Error('Gmail account not found');
            }

            this.stopPollingForAccount(gmailAccountId);

            const interval = setInterval(async () =>
            {
                await this.pollForNewEmails(gmailAccountId);
            }, POLLING_INTERVAL);

            this.pollingIntervals.set(gmailAccountId, interval);

            await this.pollForNewEmails(gmailAccountId);

            console.log(`Started polling for Gmail account: ${gmailAccount.email}`);
            return true;

        } catch (error) {
            console.error('Error starting polling:', error);
            return false;
        }
    }

    static stopPollingForAccount(gmailAccountId: string): void
    {
        const interval = this.pollingIntervals.get(gmailAccountId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(gmailAccountId);
            console.log(`Stopped polling for Gmail account: ${gmailAccountId}`);
        }
    }

    static async pollForNewEmails(gmailAccountId: string): Promise<void>
    {
        try {
            const gmailAccount = await prisma.gmailAccount.findUnique({
                where: { id: gmailAccountId }
            });

            if (!gmailAccount) {
                console.log(`Gmail account ${gmailAccountId} not found`);
                return;
            }

            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
            );

            oauth2Client.setCredentials({
                access_token: gmailAccount.accessToken,
                refresh_token: gmailAccount.refreshToken
            });

            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

            const messagesResponse = await gmail.users.messages.list({
                userId: 'me',
                labelIds: [ 'INBOX' ],
                maxResults: 10,
                q: 'is:unread' 
            });

            const messages = messagesResponse.data.messages || [];

            for (const message of messages) {
                if (message.id) {
                    await this.processNewEmail(gmailAccountId, message.id, gmail);
                }
            }

            await prisma.gmailAccount.update({
                where: { id: gmailAccountId },
                data: { lastSync: new Date() }
            });

        } catch (error) {
            console.error(`Error polling for emails in account ${gmailAccountId}:`, error);
        }
    }

    private static async processNewEmail(
        gmailAccountId: string,
        messageId: string,
        gmail: any
    ): Promise<void>
    {
        try {
            const existingEmail = await prisma.email.findUnique({
                where: { messageId }
            });

            if (existingEmail) {
                console.log(`Email ${messageId} already processed`);
                return;
            }

            const gmailAccount = await prisma.gmailAccount.findUnique({
                where: { id: gmailAccountId }
            });

            if (!gmailAccount) {
                throw new Error(`Gmail account ${gmailAccountId} not found`);
            }

            const messageResponse = await gmail.users.messages.get({
                userId: 'me',
                id: messageId,
                format: 'full'
            });

            const message = messageResponse.data;
            const headers = message.payload?.headers || [];

            const subject = headers.find((h: any) => h.name === 'Subject')?.value;
            const from = headers.find((h: any) => h.name === 'From')?.value;
            const to = headers.find((h: any) => h.name === 'To')?.value;
            const cc = headers.find((h: any) => h.name === 'Cc')?.value;
            const bcc = headers.find((h: any) => h.name === 'Bcc')?.value;
            const date = headers.find((h: any) => h.name === 'Date')?.value;

            const fromMatch = from?.match(/(.*?)\s*<(.+?)>/) || [ null, null, from ];
            const fromName = fromMatch[ 1 ]?.trim() || null;
            const fromEmail = fromMatch[ 2 ] || fromMatch[ 0 ];

            const { body, htmlBody, hasAttachments } = this.extractEmailBody(message.payload);

            const categories = await prisma.category.findMany({
                where: { userId: gmailAccount.userId }
            });

            const emailContent: EmailContent = {
                subject,
                fromEmail,
                fromName,
                body,
                htmlBody
            };

            const aiResult = await AIService.categorizeAndSummarizeEmail(emailContent, categories);

            if (!aiResult) {
                throw new Error('AI processing failed');
            }

            const email = await prisma.email.create({
                data: {
                    gmailAccountId,
                    messageId,
                    threadId: message.threadId,
                    subject,
                    fromEmail,
                    fromName,
                    toEmails: to || '',
                    ccEmails: cc || null,
                    bccEmails: bcc || null,
                    body,
                    htmlBody,
                    receivedAt: date ? new Date(date) : new Date(),
                    hasAttachments,
                    aiSummary: aiResult.summary,
                    aiCategory: aiResult.categoryName,
                    aiConfidence: aiResult.confidence,
                    unsubscribeLink: aiResult.unsubscribeLink,
                    categoryId: aiResult.categoryId
                }
            });

            try {
                const labelsResponse = await gmail.users.labels.list({
                    userId: 'me'
                });

                const labels = labelsResponse.data.labels || [];
                const archiveLabel = labels.find((label: any) =>
                    label.id === 'ARCHIVE' ||
                    label.name?.toLowerCase() === 'archive' ||
                    label.id === 'CATEGORY_PERSONAL' 
                );

                if (archiveLabel) {
                    await gmail.users.messages.modify({
                        userId: 'me',
                        id: messageId,
                        requestBody: {
                            removeLabelIds: [ 'INBOX' ],
                            addLabelIds: [ archiveLabel.id! ]
                        }
                    });
                    console.log(`✅ Archived email ${messageId} using label: ${archiveLabel.name || archiveLabel.id}`);
                } else {
                    await gmail.users.messages.modify({
                        userId: 'me',
                        id: messageId,
                        requestBody: {
                            removeLabelIds: [ 'INBOX' ]
                        }
                    });
                    console.log(`✅ Removed from inbox (no archive label found) for email ${messageId}`);
                }
            } catch (archiveError) {
                console.error(`❌ Failed to archive email ${messageId}:`, archiveError);

                try {
                    await gmail.users.messages.modify({
                        userId: 'me',
                        id: messageId,
                        requestBody: {
                            removeLabelIds: [ 'INBOX' ]
                        }
                    });
                    console.log(`✅ Removed from inbox (fallback method) for email ${messageId}`);
                } catch (alternativeError) {
                    console.error(`❌ Alternative archiving also failed for email ${messageId}:`, alternativeError);
                }
            }

            console.log(`✅ Processed email ${messageId} for account ${gmailAccountId}`);

        } catch (error) {
            console.error(`Error processing email ${messageId}:`, error);

            await prisma.emailProcessingQueue.upsert({
                where: {
                    gmailAccountId_messageId: {
                        gmailAccountId,
                        messageId
                    }
                },
                update: {
                    status: 'failed',
                    attempts: { increment: 1 },
                    lastAttempt: new Date(),
                    errorMessage: error instanceof Error ? error.message : 'Unknown error'
                },
                create: {
                    gmailAccountId,
                    messageId,
                    status: 'failed',
                    attempts: 1,
                    lastAttempt: new Date(),
                    errorMessage: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
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

        const extractPart = (part: any) =>
        {
            if (part.mimeType === 'text/plain' && part.body?.data) {
                body = Buffer.from(part.body.data, 'base64').toString('utf-8');
            } else if (part.mimeType === 'text/html' && part.body?.data) {
                htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
            } else if (part.filename) {
                hasAttachments = true;
            }

            if (part.parts) {
                part.parts.forEach(extractPart);
            }
        };

        extractPart(payload);

        return { body, htmlBody, hasAttachments };
    }

    static async stopAllPolling(): Promise<void>
    {
        for (const [ accountId, interval ] of this.pollingIntervals) {
            clearInterval(interval);
        }
        this.pollingIntervals.clear();
        console.log('Stopped all Gmail polling');
    }

    static async refreshPolling(gmailAccountId: string): Promise<boolean>
    {
        try {
            this.stopPollingForAccount(gmailAccountId);
            return await this.startPollingForAccount(gmailAccountId);
        } catch (error) {
            console.error('Error refreshing polling:', error);
            return false;
        }
    }

    static async manualPoll(gmailAccountId: string): Promise<{ processed: number; failed: number; }>
    {
        try {
            await this.pollForNewEmails(gmailAccountId);
            return { processed: 1, failed: 0 };
        } catch (error) {
            console.error('Manual poll failed:', error);
            return { processed: 0, failed: 1 };
        }
    }

    static async testArchiving(gmailAccountId: string): Promise<boolean>
    {
        try {
            const gmailAccount = await prisma.gmailAccount.findUnique({
                where: { id: gmailAccountId }
            });

            if (!gmailAccount) {
                throw new Error('Gmail account not found');
            }

            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
            );

            oauth2Client.setCredentials({
                access_token: gmailAccount.accessToken,
                refresh_token: gmailAccount.refreshToken
            });

            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

            const messagesResponse = await gmail.users.messages.list({
                userId: 'me',
                labelIds: [ 'INBOX' ],
                maxResults: 1
            });

            if (!messagesResponse.data.messages || messagesResponse.data.messages.length === 0) {
                console.log('No emails found in inbox for testing');
                return false;
            }

            const testMessageId = messagesResponse.data.messages[ 0 ].id;
            if (!testMessageId) {
                console.log('No valid message ID found for testing');
                return false;
            }

            console.log(`Testing archiving with message ID: ${testMessageId}`);

            const labelsResponse = await gmail.users.labels.list({
                userId: 'me'
            });

            const labels = labelsResponse.data.labels || [];
            const archiveLabel = labels.find((label: any) =>
                label.id === 'ARCHIVE' ||
                label.name?.toLowerCase() === 'archive' ||
                label.id === 'CATEGORY_PERSONAL'
            );

            if (archiveLabel) {
                await gmail.users.messages.modify({
                    userId: 'me',
                    id: testMessageId,
                    requestBody: {
                        removeLabelIds: [ 'INBOX' ],
                        addLabelIds: [ archiveLabel.id! ]
                    }
                });
                console.log(`✅ Test archived using label: ${archiveLabel.name || archiveLabel.id}`);
            } else {
                await gmail.users.messages.modify({
                    userId: 'me',
                    id: testMessageId,
                    requestBody: {
                        removeLabelIds: [ 'INBOX' ]
                    }
                });
                console.log('✅ Test removed from inbox (no archive label available)');
            }

            console.log('✅ Archiving test successful!');
            return true;

        } catch (error) {
            console.error('❌ Archiving test failed:', error);
            return false;
        }
    }
}
