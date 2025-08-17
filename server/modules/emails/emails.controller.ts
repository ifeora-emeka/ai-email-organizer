import type { Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { EmailQuery, EmailParams, UpdateEmailData, BulkUpdateEmailData, BulkDeleteEmailData } from './emails.dto';
import { UnsubscribeAgentService } from '../../../lib/services/unsubscribe-agent.service';

export class EmailsController
{
  static async getEmails(req: AuthenticatedRequest & { query: EmailQuery; }, res: Response)
  {
    try {
      const userId = req.user!.id;
      const {
        limit = 50,
        offset = 0,
        categoryId,
        isRead,
        isArchived,
        sortBy = 'receivedAt',
        sortOrder = 'desc',
        search
      } = req.query;

      const where: any = {
        gmailAccount: {
          userId: userId
        }
      };

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      if (isArchived !== undefined) {
        where.isArchived = isArchived;
      }

      if (search) {
        where.OR = [
          { subject: { contains: search, mode: 'insensitive' } },
          { fromEmail: { contains: search, mode: 'insensitive' } },
          { fromName: { contains: search, mode: 'insensitive' } },
          { body: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [ emails, total ] = await Promise.all([
        prisma.email.findMany({
          where,
          orderBy: { [ sortBy ]: sortOrder },
          skip: offset,
          take: limit,
          include: {
            category: true,
            gmailAccount: {
              select: {
                id: true,
                email: true,
                name: true
              }
            },
            attachments: {
              select: {
                id: true,
                filename: true,
                mimeType: true,
                size: true
              }
            }
          }
        }),
        prisma.email.count({ where })
      ]);

      const formattedEmails = emails.map(email => ({
        id: email.id,
        subject: email.subject || '',
        fromEmail: email.fromEmail,
        fromName: email.fromName || email.fromEmail,
        toEmails: email.toEmails,
        receivedAt: email.receivedAt.toISOString(),
        aiSummary: email.aiSummary || '',
        body: email.body || '',
        hasAttachments: email.hasAttachments,
        isRead: email.isRead,
        isArchived: email.isArchived,
        category: email.category?.name || 'Uncategorized',
        categoryId: email.categoryId,
        aiConfidence: email.aiConfidence || 0,
        priority: 'medium' as const,
        gmailAccount: email.gmailAccount,
        attachments: email.attachments
      }));

      res.json({
        success: true,
        data: formattedEmails,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get emails error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get emails'
      });
    }
  }

  static async getEmailById(req: AuthenticatedRequest & { params: EmailParams; }, res: Response)
  {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const email = await prisma.email.findFirst({
        where: {
          id,
          gmailAccount: {
            userId: userId
          }
        },
        include: {
          category: true,
          gmailAccount: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          attachments: true
        }
      });

      if (!email) {
        return res.status(404).json({
          success: false,
          error: 'Email not found'
        });
      }

      const formattedEmail = {
        id: email.id,
        subject: email.subject || '',
        fromEmail: email.fromEmail,
        fromName: email.fromName || email.fromEmail,
        toEmails: email.toEmails,
        ccEmails: email.ccEmails,
        bccEmails: email.bccEmails,
        receivedAt: email.receivedAt.toISOString(),
        aiSummary: email.aiSummary || '',
        body: email.body || '',
        htmlBody: email.htmlBody,
        hasAttachments: email.hasAttachments,
        isRead: email.isRead,
        isArchived: email.isArchived,
        category: email.category?.name || 'Uncategorized',
        categoryId: email.categoryId,
        aiConfidence: email.aiConfidence || 0,
        priority: 'medium' as const,
        unsubscribeLink: email.unsubscribeLink,
        gmailAccount: email.gmailAccount,
        attachments: email.attachments
      };

      res.json({
        success: true,
        data: formattedEmail
      });
    } catch (error) {
      console.error('Get email by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get email'
      });
    }
  }

  static async updateEmail(req: AuthenticatedRequest & { params: EmailParams; body: UpdateEmailData; }, res: Response)
  {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updates = req.body;

      const existingEmail = await prisma.email.findFirst({
        where: {
          id,
          gmailAccount: {
            userId: userId
          }
        }
      });

      if (!existingEmail) {
        return res.status(404).json({
          success: false,
          error: 'Email not found'
        });
      }

      if (updates.categoryId !== undefined) {
        if (updates.categoryId) {
          const category = await prisma.category.findFirst({
            where: {
              id: updates.categoryId,
              userId: userId
            }
          });

          if (!category) {
            return res.status(400).json({
              success: false,
              error: 'Category not found'
            });
          }
        }
      }

      const updatedEmail = await prisma.email.update({
        where: { id },
        data: updates,
        include: {
          category: true,
          gmailAccount: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: {
          id: updatedEmail.id,
          isRead: updatedEmail.isRead,
          isArchived: updatedEmail.isArchived,
          categoryId: updatedEmail.categoryId,
          category: updatedEmail.category?.name || 'Uncategorized'
        }
      });
    } catch (error) {
      console.error('Update email error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update email'
      });
    }
  }

  static async bulkUpdateEmails(req: AuthenticatedRequest & { body: BulkUpdateEmailData; }, res: Response)
  {
    try {
      const userId = req.user!.id;
      const { emailIds, updates } = req.body;

      const existingEmails = await prisma.email.findMany({
        where: {
          id: { in: emailIds },
          gmailAccount: {
            userId: userId
          }
        },
        select: { id: true }
      });

      const foundEmailIds = existingEmails.map(email => email.id);
      const notFoundIds = emailIds.filter((id: string) => !foundEmailIds.includes(id));

      if (notFoundIds.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Emails not found: ${notFoundIds.join(', ')}`
        });
      }

      if (updates.categoryId !== undefined && updates.categoryId) {
        const category = await prisma.category.findFirst({
          where: {
            id: updates.categoryId,
            userId: userId
          }
        });

        if (!category) {
          return res.status(400).json({
            success: false,
            error: 'Category not found'
          });
        }
      }

      await prisma.email.updateMany({
        where: {
          id: { in: emailIds }
        },
        data: updates
      });

      res.json({
        success: true,
        data: {
          updatedCount: emailIds.length,
          emailIds: emailIds
        }
      });
    } catch (error) {
      console.error('Bulk update emails error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to bulk update emails'
      });
    }
  }

  static async deleteEmail(req: AuthenticatedRequest & { params: EmailParams; }, res: Response)
  {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const existingEmail = await prisma.email.findFirst({
        where: {
          id,
          gmailAccount: {
            userId: userId
          }
        }
      });

      if (!existingEmail) {
        return res.status(404).json({
          success: false,
          error: 'Email not found'
        });
      }

      await prisma.email.delete({
        where: { id }
      });

      res.json({
        success: true,
        data: { id }
      });
    } catch (error) {
      console.error('Delete email error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete email'
      });
    }
  }

  static async bulkDeleteEmails(req: AuthenticatedRequest & { body: BulkDeleteEmailData; }, res: Response)
  {
    try {
      const userId = req.user!.id;
      const { emailIds } = req.body;

      // Verify all emails belong to the user
      const existingEmails = await prisma.email.findMany({
        where: {
          id: { in: emailIds },
          gmailAccount: {
            userId: userId
          }
        },
        select: { id: true }
      });

      const foundEmailIds = existingEmails.map(email => email.id);
      const notFoundIds = emailIds.filter((id: string) => !foundEmailIds.includes(id));

      if (notFoundIds.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Emails not found or not accessible: ${notFoundIds.join(', ')}`
        });
      }

      // Delete all emails and their related data (attachments will be cascade deleted)
      const deleteResult = await prisma.email.deleteMany({
        where: {
          id: { in: foundEmailIds }
        }
      });

      res.json({
        success: true,
        data: {
          deletedCount: deleteResult.count,
          deletedEmailIds: foundEmailIds
        }
      });
    } catch (error) {
      console.error('Bulk delete emails error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to bulk delete emails'
      });
    }
  }

  static async bulkUnsubscribe(req: AuthenticatedRequest & { body: { emailIds: string[]; }; }, res: Response)
  {
    try {
      const { emailIds } = req.body;
      const userEmail = req.user?.email;

      if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
        return res.status(400).json({ error: 'Email IDs array is required' });
      }

      const result = await UnsubscribeAgentService.bulkUnsubscribe(emailIds, userEmail);

      res.json({
        message: `Bulk unsubscribe completed. ${result.success} successful, ${result.failed} failed.`,
        ...result,
      });

    } catch (error) {
      console.error('Bulk unsubscribe error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process bulk unsubscribe'
      });
    }
  }

  static async unsubscribeFromEmail(req: AuthenticatedRequest & { params: { emailId: string; }; }, res: Response)
  {
    try {
      const { emailId } = req.params;
      const userEmail = req.user?.email;

      const email = await prisma.email.findUnique({
        where: { id: emailId },
        select: { unsubscribeLink: true },
      });

      if (!email?.unsubscribeLink) {
        return res.status(404).json({
          success: false,
          error: 'No unsubscribe link found for this email'
        });
      }

      const result = await UnsubscribeAgentService.unsubscribeFromEmail(
        emailId,
        email.unsubscribeLink,
        userEmail
      );

      res.json({
        ...result
      });

    } catch (error) {
      console.error('Unsubscribe error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unsubscribe from email'
      });
    }
  }

  static async getUnsubscribeStatus(req: AuthenticatedRequest & { params: { emailId: string; }; }, res: Response)
  {
    try {
      const { emailId } = req.params;

      const status = await UnsubscribeAgentService.getUnsubscribeTaskStatus(emailId);

      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Unsubscribe task not found'
        });
      }

      res.json({
        success: true,
        data: status
      });

    } catch (error) {
      console.error('Get unsubscribe status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get unsubscribe status'
      });
    }
  }

  static async retryFailedUnsubscribes(req: AuthenticatedRequest, res: Response)
  {
    try {
      const userEmail = req.user?.email;

      const result = await UnsubscribeAgentService.retryFailedUnsubscribes(userEmail);

      res.json({
        message: `Retry completed. ${result.success} successful, ${result.failed} failed.`,
        ...result,
      });

    } catch (error) {
      console.error('Retry failed unsubscribes error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retry failed unsubscribes'
      });
    }
  }
}
