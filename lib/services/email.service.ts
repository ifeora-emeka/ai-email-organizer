import { prisma } from '../prisma'
import { Email, Attachment } from '@prisma/client'

export interface CreateEmailData {
  gmailAccountId: string
  messageId: string
  threadId?: string
  subject?: string
  fromEmail: string
  fromName?: string
  toEmails: string
  ccEmails?: string
  bccEmails?: string
  body?: string
  htmlBody?: string
  receivedAt: Date
  hasAttachments?: boolean
  unsubscribeLink?: string
}

export class EmailService {
  static async createEmail(data: CreateEmailData): Promise<Email> {
    return await prisma.email.create({
      data: {
        gmailAccountId: data.gmailAccountId,
        messageId: data.messageId,
        threadId: data.threadId,
        subject: data.subject,
        fromEmail: data.fromEmail,
        fromName: data.fromName,
        toEmails: data.toEmails,
        ccEmails: data.ccEmails,
        bccEmails: data.bccEmails,
        body: data.body,
        htmlBody: data.htmlBody,
        receivedAt: data.receivedAt,
        hasAttachments: data.hasAttachments || false,
        unsubscribeLink: data.unsubscribeLink
      }
    })
  }

  static async getEmailById(id: string): Promise<Email | null> {
    return await prisma.email.findUnique({
      where: { id },
      include: {
        gmailAccount: true,
        category: true,
        attachments: true
      }
    })
  }

  static async getEmailsByCategory(categoryId: string, limit: number = 50, offset: number = 0): Promise<Email[]> {
    return await prisma.email.findMany({
      where: { categoryId },
      orderBy: { receivedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        gmailAccount: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })
  }

  static async updateEmail(id: string, data: Partial<Email>): Promise<Email> {
    return await prisma.email.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })
  }

  static async categorizeEmail(id: string, categoryId: string, aiSummary?: string, aiConfidence?: number): Promise<Email> {
    return await prisma.email.update({
      where: { id },
      data: {
        categoryId,
        aiSummary,
        aiConfidence,
        updatedAt: new Date()
      }
    })
  }

  static async archiveEmail(id: string): Promise<Email> {
    return await prisma.email.update({
      where: { id },
      data: {
        isArchived: true,
        updatedAt: new Date()
      }
    })
  }

  static async markAsRead(id: string): Promise<Email> {
    return await prisma.email.update({
      where: { id },
      data: {
        isRead: true,
        updatedAt: new Date()
      }
    })
  }

  static async deleteEmail(id: string): Promise<void> {
    await prisma.email.delete({
      where: { id }
    })
  }

  static async bulkDeleteEmails(emailIds: string[]): Promise<void> {
    await prisma.email.deleteMany({
      where: {
        id: {
          in: emailIds
        }
      }
    })
  }

  static async getUncategorizedEmails(gmailAccountId: string, limit: number = 50): Promise<Email[]> {
    return await prisma.email.findMany({
      where: {
        gmailAccountId,
        categoryId: null
      },
      orderBy: { receivedAt: 'desc' },
      take: limit
    })
  }

  static async addAttachment(emailId: string, attachmentData: Omit<Attachment, 'id' | 'emailId' | 'createdAt'>): Promise<Attachment> {
    return await prisma.attachment.create({
      data: {
        emailId,
        ...attachmentData
      }
    })
  }
}
