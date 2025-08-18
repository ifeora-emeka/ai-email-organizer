import { prisma } from "../../../lib/prisma";
import { Request, Response } from "express";
import { google } from "googleapis";
import crypto from 'crypto';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { GmailPollingService } from '../../../lib/services/gmail-pubsub.service';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'https://ai-email-organizer-1.onrender.com/api/v1/gmail-accounts/callback'
);

const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
];

export class GmailController
{

    static async connectGmailAccount(req: AuthenticatedRequest, res: Response)
    {

        const { redirect_uri: clientRedirectUrl } = req.body;

        if (!clientRedirectUrl) {
            return res.status(400).json({
                success: false,
                error: 'Redirect URI is required'
            });
        }

        const csrfToken = crypto.randomBytes(32).toString('hex');
        const metadata = {
            userId: req.user?.id,
            source: req.query.source || 'web',
            redirect_uri: clientRedirectUrl
        };

        const stateData = {
            csrfToken,
            metadata,
            timestamp: Date.now()
        };
        const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

        // Store CSRF token in session for verification
        // @ts-ignore
        // req.session.oauthState = csrfToken;

        const oauthUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            state,
            prompt: 'consent',
            redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'https://ai-email-organizer-1.onrender.com/api/v1/gmail-accounts/callback'
        });



        res.json({
            success: true,
            data: {
                oauthUrl
            }
        });
    }




    static async connectGmailCallback(req: AuthenticatedRequest, res: Response)
    {
        const { code, state, error } = req.query;
        if (error) {
            return res.status(400).json({
                success: false,
                error: error as string
            });
        }




        // Parse state data
        let stateData;
        let metadata: { userId: string, source: string, redirect_uri: string; } = { userId: '', source: '', redirect_uri: '' };

        try {
            stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
            metadata = stateData.metadata || {};
        } catch (parseError) {
            return res.status(400).json({ error: 'Invalid state parameter format' });
        }


        const stateAge = Date.now() - (stateData.timestamp || 0);
        const maxAge = 10 * 60 * 1000; // 10 minutes
        if (stateAge > maxAge) {
            return res.status(400).json({ error: 'OAuth state has expired' });
        }

        let tokens;
        try {

            const tokenResponse = await oauth2Client.getToken({
                code: code as string,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'https://ai-email-organizer-1.onrender.com/api/v1/gmail-accounts/callback'
            });

            tokens = tokenResponse.tokens;
            console.log("Successfully got tokens:", tokens);
            oauth2Client.setCredentials(tokens);
        } catch (tokenError: any) {
            console.error("Token exchange failed:", tokenError);
            return res.status(400).json({
                success: false,
                error: 'Failed to exchange authorization code for tokens',
                details: tokenError.message
            });
        }

        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();

        // Use metadata to determine user ID or create new one
        // @ts-ignore
        const userId = metadata.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const gmailAccount = await prisma.gmailAccount.create({
            data: {
                userId,
                email: userInfo.data.email as string,
                name: userInfo.data.name as string,
                accessToken: tokens.access_token as string,
                refreshToken: tokens.refresh_token as string
            }
        });

        res.redirect(metadata.redirect_uri as string);
    }
    static async getGmailAccounts(req: AuthenticatedRequest, res: Response)
    {
        try {
            const {
                search,
                status,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                page = 1,
                limit = 10
            } = req.query;

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            const where: any = {
                userId: req.user.id
            };

            if (search && typeof search === 'string') {
                where.OR = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } }
                ];
            }

            if (status && typeof status === 'string') {
                if (status === 'active') {
                    where.isActive = true;
                } else if (status === 'inactive') {
                    where.isActive = false;
                }
            }

            // Build orderBy clause for sorting
            const orderBy: any = {};
            const validSortFields = [ 'email', 'name', 'createdAt', 'lastSync' ];
            const validSortOrders = [ 'asc', 'desc' ];

            if (validSortFields.includes(sortBy as string)) {
                orderBy[ sortBy as string ] = validSortOrders.includes(sortOrder as string) ? sortOrder : 'desc';
            } else {
                orderBy.createdAt = 'desc'; // default sorting
            }

            // Pagination
            const pageNum = Math.max(1, parseInt(page as string) || 1);
            const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
            const skip = (pageNum - 1) * limitNum;

            // Get total count for pagination
            const total = await prisma.gmailAccount.count({ where });

            // Get accounts with filtering, sorting, and pagination
            const gmailAccounts = await prisma.gmailAccount.findMany({
                where,
                orderBy,
                skip,
                take: limitNum,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    isActive: true,
                    lastSync: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            // Calculate pagination info
            const totalPages = Math.ceil(total / limitNum);
            const hasNextPage = pageNum < totalPages;
            const hasPrevPage = pageNum > 1;

            res.json({
                success: true,
                data: gmailAccounts,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                    hasNextPage,
                    hasPrevPage
                },
            });
        } catch (error) {
            console.error('Error fetching Gmail accounts:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch Gmail accounts'
            });
        }
    }

    // Polling Methods
    static async startPolling(req: AuthenticatedRequest, res: Response)
    {
        try {
            const { gmailAccountId } = req.params;

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            // Verify the Gmail account belongs to the user
            const gmailAccount = await prisma.gmailAccount.findFirst({
                where: {
                    id: gmailAccountId,
                    userId: req.user.id
                }
            });

            if (!gmailAccount) {
                return res.status(404).json({
                    success: false,
                    error: 'Gmail account not found'
                });
            }

            const success = await GmailPollingService.startPollingForAccount(gmailAccountId);

            if (success) {
                res.json({
                    success: true,
                    message: 'Gmail polling started successfully'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to start Gmail polling'
                });
            }

        } catch (error) {
            console.error('Error starting Gmail polling:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to start Gmail polling'
            });
        }
    }

    static async stopPolling(req: AuthenticatedRequest, res: Response)
    {
        try {
            const { gmailAccountId } = req.params;

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            // Verify the Gmail account belongs to the user
            const gmailAccount = await prisma.gmailAccount.findFirst({
                where: {
                    id: gmailAccountId,
                    userId: req.user.id
                }
            });

            if (!gmailAccount) {
                return res.status(404).json({
                    success: false,
                    error: 'Gmail account not found'
                });
            }

            GmailPollingService.stopPollingForAccount(gmailAccountId);

            res.json({
                success: true,
                message: 'Gmail polling stopped successfully'
            });

        } catch (error) {
            console.error('Error stopping Gmail polling:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to stop Gmail polling'
            });
        }
    }

    // Manual polling for testing
    static async manualPoll(req: AuthenticatedRequest, res: Response)
    {
        try {
            const { gmailAccountId } = req.params;

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            // Verify the Gmail account belongs to the user
            const gmailAccount = await prisma.gmailAccount.findFirst({
                where: {
                    id: gmailAccountId,
                    userId: req.user.id
                }
            });

            if (!gmailAccount) {
                return res.status(404).json({
                    success: false,
                    error: 'Gmail account not found'
                });
            }

            const result = await GmailPollingService.manualPoll(gmailAccountId);

            res.json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('Error with manual poll:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to perform manual poll'
            });
        }
    }


}
