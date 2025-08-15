import { Request, Response } from 'express'
import { GmailAccountService } from '../../../lib/services/gmail-account.service'
import { AuthenticatedRequest } from '../../middleware/auth.middleware'
import { CreateGmailAccountData, UpdateGmailAccountData, GmailAccountParams, GmailAccountQuery } from './gmail-accounts.dto'

export class GmailAccountsController {
    static async getGmailAccounts(req: AuthenticatedRequest & { query: GmailAccountQuery }, res: Response) {
        try {
            const userId = req.user!.id
            const { includeStats = false } = req.query

            const gmailAccounts = await GmailAccountService.getGmailAccountsByUserId(userId)

            const response = gmailAccounts.map(account => ({
                id: account.id,
                email: account.email,
                name: account.name,
                isActive: account.isActive,
                lastSync: account.lastSync,
                createdAt: account.createdAt,
                updatedAt: account.updatedAt
            }))

            return res.status(200).json({
                success: true,
                data: { gmailAccounts: response },
                message: 'Gmail accounts retrieved successfully'
            })
        } catch (error) {
            console.error('Error fetching gmail accounts:', error)
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch gmail accounts'
            })
        }
    }

    static async getGmailAccountById(req: AuthenticatedRequest & { params: GmailAccountParams }, res: Response) {
        try {
            const userId = req.user!.id
            const { id } = req.params

            const gmailAccount = await GmailAccountService.getGmailAccountById(id)

            if (!gmailAccount) {
                return res.status(404).json({
                    success: false,
                    error: 'Gmail account not found'
                })
            }

            if (gmailAccount.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied to this gmail account'
                })
            }

            const response = {
                id: gmailAccount.id,
                email: gmailAccount.email,
                name: gmailAccount.name,
                isActive: gmailAccount.isActive,
                lastSync: gmailAccount.lastSync,
                createdAt: gmailAccount.createdAt,
                updatedAt: gmailAccount.updatedAt
            }

            return res.status(200).json({
                success: true,
                data: { gmailAccount: response },
                message: 'Gmail account retrieved successfully'
            })
        } catch (error) {
            console.error('Error fetching gmail account:', error)
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch gmail account'
            })
        }
    }

    static async createGmailAccount(req: AuthenticatedRequest & { body: CreateGmailAccountData }, res: Response) {
        try {
            const userId = req.user!.id
            const { email, name, accessToken, refreshToken, scope } = req.body

            const gmailAccount = await GmailAccountService.createGmailAccount({
                userId,
                email,
                name,
                accessToken,
                refreshToken,
                scope
            })

            const response = {
                id: gmailAccount.id,
                email: gmailAccount.email,
                name: gmailAccount.name,
                isActive: gmailAccount.isActive,
                lastSync: gmailAccount.lastSync,
                createdAt: gmailAccount.createdAt,
                updatedAt: gmailAccount.updatedAt
            }

            return res.status(201).json({
                success: true,
                data: { gmailAccount: response },
                message: 'Gmail account created successfully'
            })
        } catch (error: any) {
            console.error('Error creating gmail account:', error)

            if (error.code === 'P2002') {
                return res.status(409).json({
                    success: false,
                    error: 'Gmail account with this email already exists for this user'
                })
            }

            return res.status(500).json({
                success: false,
                error: 'Failed to create gmail account'
            })
        }
    }

    static async updateGmailAccount(req: AuthenticatedRequest & { params: GmailAccountParams; body: UpdateGmailAccountData }, res: Response) {
        try {
            const userId = req.user!.id
            const { id } = req.params
            const updateData = req.body

            const existingAccount = await GmailAccountService.getGmailAccountById(id)

            if (!existingAccount) {
                return res.status(404).json({
                    success: false,
                    error: 'Gmail account not found'
                })
            }

            if (existingAccount.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied to this gmail account'
                })
            }

            const gmailAccount = await GmailAccountService.updateGmailAccount(id, updateData)

            const response = {
                id: gmailAccount.id,
                email: gmailAccount.email,
                name: gmailAccount.name,
                isActive: gmailAccount.isActive,
                lastSync: gmailAccount.lastSync,
                createdAt: gmailAccount.createdAt,
                updatedAt: gmailAccount.updatedAt
            }

            return res.status(200).json({
                success: true,
                data: { gmailAccount: response },
                message: 'Gmail account updated successfully'
            })
        } catch (error) {
            console.error('Error updating gmail account:', error)
            return res.status(500).json({
                success: false,
                error: 'Failed to update gmail account'
            })
        }
    }

    static async deleteGmailAccount(req: AuthenticatedRequest & { params: GmailAccountParams }, res: Response) {
        try {
            const userId = req.user!.id
            const { id } = req.params

            const existingAccount = await GmailAccountService.getGmailAccountById(id)

            if (!existingAccount) {
                return res.status(404).json({
                    success: false,
                    error: 'Gmail account not found'
                })
            }

            if (existingAccount.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied to this gmail account'
                })
            }

            await GmailAccountService.deleteGmailAccount(id)

            return res.status(200).json({
                success: true,
                message: 'Gmail account deleted successfully'
            })
        } catch (error) {
            console.error('Error deleting gmail account:', error)
            return res.status(500).json({
                success: false,
                error: 'Failed to delete gmail account'
            })
        }
    }

    static async syncGmailAccount(req: AuthenticatedRequest & { params: GmailAccountParams }, res: Response) {
        try {
            const userId = req.user!.id
            const { id } = req.params

            const existingAccount = await GmailAccountService.getGmailAccountById(id)

            if (!existingAccount) {
                return res.status(404).json({
                    success: false,
                    error: 'Gmail account not found'
                })
            }

            if (existingAccount.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied to this gmail account'
                })
            }

            const gmailAccount = await GmailAccountService.updateLastSync(id)

            return res.status(200).json({
                success: true,
                data: { lastSync: gmailAccount.lastSync },
                message: 'Gmail account sync initiated successfully'
            })
        } catch (error) {
            console.error('Error syncing gmail account:', error)
            return res.status(500).json({
                success: false,
                error: 'Failed to sync gmail account'
            })
        }
    }
}
