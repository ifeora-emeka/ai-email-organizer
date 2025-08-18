import { EmailsController } from '../../server/modules/emails/emails.controller'
import { EmailQueryDto, EmailParamsDto, UpdateEmailDto, BulkUpdateEmailDto, BulkDeleteEmailDto } from '../../server/modules/emails/emails.dto'
import { createMockRequest, createMockResponse, testUser, testEmail, testCategory, testGmailAccount } from './setup'
import { prisma } from '../../lib/prisma'
import { UnsubscribeAgentService } from '../../lib/services/unsubscribe-agent.service'

jest.mock('../../lib/prisma')
jest.mock('../../lib/services/unsubscribe-agent.service')

const mockPrisma = prisma as any
const mockUnsubscribeService = UnsubscribeAgentService as jest.Mocked<typeof UnsubscribeAgentService>

describe('EmailsController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getEmails', () => {
    it('should return paginated emails with default parameters', async () => {
      const req = createMockRequest({
        user: testUser,
        query: {}
      })
      const res = createMockResponse()

      const mockEmails = [
        {
          ...testEmail,
          category: testCategory,
          gmailAccount: testGmailAccount,
          attachments: []
        }
      ]

      mockPrisma.email.findMany.mockResolvedValue(mockEmails)
      mockPrisma.email.count.mockResolvedValue(1)

      await EmailsController.getEmails(req as any, res as any)

      expect(mockPrisma.email.findMany).toHaveBeenCalledWith({
        where: {
          gmailAccount: {
            userId: testUser.id
          }
        },
        orderBy: { receivedAt: 'desc' },
        skip: 0,
        take: 50,
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
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{
          id: testEmail.id,
          subject: testEmail.subject,
          fromEmail: testEmail.fromEmail,
          fromName: testEmail.fromName,
          toEmails: testEmail.toEmails,
          receivedAt: testEmail.receivedAt.toISOString(),
          aiSummary: testEmail.aiSummary,
          body: testEmail.body,
          hasAttachments: testEmail.hasAttachments,
          isRead: testEmail.isRead,
          isArchived: testEmail.isArchived,
          category: testCategory.name,
          categoryId: testEmail.categoryId,
          aiConfidence: testEmail.aiConfidence,
          priority: 'medium',
          gmailAccount: testGmailAccount,
          attachments: []
        }],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1
        }
      })
    })

    it('should filter emails by category ID', async () => {
      const req = createMockRequest({
        user: testUser,
        query: { categoryId: testCategory.id }
      })
      const res = createMockResponse()

      mockPrisma.email.findMany.mockResolvedValue([])
      mockPrisma.email.count.mockResolvedValue(0)

      await EmailsController.getEmails(req as any, res as any)

      expect(mockPrisma.email.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            gmailAccount: {
              userId: testUser.id
            },
            categoryId: testCategory.id
          }
        })
      )
    })

    it('should filter emails by read status', async () => {
      const req = createMockRequest({
        user: testUser,
        query: { isRead: true } // Pass boolean instead of string
      })
      const res = createMockResponse()

      mockPrisma.email.findMany.mockResolvedValue([])
      mockPrisma.email.count.mockResolvedValue(0)

      await EmailsController.getEmails(req as any, res as any)

      expect(mockPrisma.email.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            gmailAccount: {
              userId: testUser.id
            },
            isRead: true
          }
        })
      )
    })

    it('should search emails by text', async () => {
      const req = createMockRequest({
        user: testUser,
        query: { search: 'test subject' }
      })
      const res = createMockResponse()

      mockPrisma.email.findMany.mockResolvedValue([])
      mockPrisma.email.count.mockResolvedValue(0)

      await EmailsController.getEmails(req as any, res as any)

      expect(mockPrisma.email.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            gmailAccount: {
              userId: testUser.id
            },
            OR: [
              { subject: { contains: 'test subject', mode: 'insensitive' } },
              { fromEmail: { contains: 'test subject', mode: 'insensitive' } },
              { fromName: { contains: 'test subject', mode: 'insensitive' } },
              { body: { contains: 'test subject', mode: 'insensitive' } }
            ]
          }
        })
      )
    })

    it('should handle database errors', async () => {
      const req = createMockRequest({ user: testUser, query: {} })
      const res = createMockResponse()

      mockPrisma.email.findMany.mockRejectedValue(new Error('Database error'))

      await EmailsController.getEmails(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get emails'
      })
    })
  })

  describe('getEmailById', () => {
    it('should return email by ID', async () => {
      const req = createMockRequest({
        user: testUser,
        params: { id: testEmail.id }
      })
      const res = createMockResponse()

      const mockEmail = {
        ...testEmail,
        category: testCategory,
        gmailAccount: testGmailAccount,
        attachments: []
      }

      mockPrisma.email.findFirst.mockResolvedValue(mockEmail)

      await EmailsController.getEmailById(req as any, res as any)

      expect(mockPrisma.email.findFirst).toHaveBeenCalledWith({
        where: {
          id: testEmail.id,
          gmailAccount: {
            userId: testUser.id
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
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: testEmail.id,
          subject: testEmail.subject,
          fromEmail: testEmail.fromEmail
        })
      })
    })

    it('should return 404 when email not found', async () => {
      const req = createMockRequest({
        user: testUser,
        params: { id: 'non-existent-id' }
      })
      const res = createMockResponse()

      mockPrisma.email.findFirst.mockResolvedValue(null)

      await EmailsController.getEmailById(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email not found'
      })
    })
  })

  describe('updateEmail', () => {
    it('should update email successfully', async () => {
      const updateData = {
        isRead: true,
        categoryId: testCategory.id
      }
      const req = createMockRequest({
        user: testUser,
        params: { id: testEmail.id },
        body: updateData
      })
      const res = createMockResponse()

      const updatedEmail = {
        ...testEmail,
        ...updateData,
        category: testCategory,
        gmailAccount: testGmailAccount
      }

      mockPrisma.email.findFirst.mockResolvedValue(testEmail)
      mockPrisma.category.findFirst.mockResolvedValue(testCategory)
      mockPrisma.email.update.mockResolvedValue(updatedEmail)

      await EmailsController.updateEmail(req as any, res as any)

      expect(mockPrisma.email.findFirst).toHaveBeenCalledWith({
        where: {
          id: testEmail.id,
          gmailAccount: {
            userId: testUser.id
          }
        }
      })

      expect(mockPrisma.category.findFirst).toHaveBeenCalledWith({
        where: {
          id: testCategory.id,
          userId: testUser.id
        }
      })

      expect(mockPrisma.email.update).toHaveBeenCalledWith({
        where: { id: testEmail.id },
        data: updateData,
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
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: testEmail.id,
          isRead: true,
          isArchived: testEmail.isArchived,
          categoryId: testCategory.id,
          category: testCategory.name
        }
      })
    })

    it('should return 404 when email not found', async () => {
      const req = createMockRequest({
        user: testUser,
        params: { id: 'non-existent-id' },
        body: { isRead: true }
      })
      const res = createMockResponse()

      mockPrisma.email.findFirst.mockResolvedValue(null)

      await EmailsController.updateEmail(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email not found'
      })
    })

    it('should return 400 when category not found', async () => {
      const req = createMockRequest({
        user: testUser,
        params: { id: testEmail.id },
        body: { categoryId: 'non-existent-category' }
      })
      const res = createMockResponse()

      mockPrisma.email.findFirst.mockResolvedValue(testEmail)
      mockPrisma.category.findFirst.mockResolvedValue(null)

      await EmailsController.updateEmail(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Category not found'
      })
    })
  })

  describe('bulkUpdateEmails', () => {
    it('should bulk update emails successfully', async () => {
      const emailIds = [testEmail.id, 'email-2']
      const updates = { isRead: true }
      const req = createMockRequest({
        user: testUser,
        body: { emailIds, updates }
      })
      const res = createMockResponse()

      const existingEmails = [
        { id: testEmail.id },
        { id: 'email-2' }
      ]

      mockPrisma.email.findMany.mockResolvedValue(existingEmails)
      mockPrisma.email.updateMany.mockResolvedValue({ count: 2 })

      await EmailsController.bulkUpdateEmails(req as any, res as any)

      expect(mockPrisma.email.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: emailIds },
          gmailAccount: {
            userId: testUser.id
          }
        },
        select: { id: true }
      })

      expect(mockPrisma.email.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: emailIds }
        },
        data: updates
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          updatedCount: 2,
          emailIds: emailIds
        }
      })
    })

    it('should return 400 when some emails not found', async () => {
      const emailIds = [testEmail.id, 'non-existent-email']
      const req = createMockRequest({
        user: testUser,
        body: { emailIds, updates: { isRead: true } }
      })
      const res = createMockResponse()

      mockPrisma.email.findMany.mockResolvedValue([{ id: testEmail.id }])

      await EmailsController.bulkUpdateEmails(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Emails not found: non-existent-email'
      })
    })
  })

  describe('deleteEmail', () => {
    it('should delete email successfully', async () => {
      const req = createMockRequest({
        user: testUser,
        params: { id: testEmail.id }
      })
      const res = createMockResponse()

      mockPrisma.email.findFirst.mockResolvedValue(testEmail)
      mockPrisma.email.delete.mockResolvedValue(testEmail)

      await EmailsController.deleteEmail(req as any, res as any)

      expect(mockPrisma.email.findFirst).toHaveBeenCalledWith({
        where: {
          id: testEmail.id,
          gmailAccount: {
            userId: testUser.id
          }
        }
      })

      expect(mockPrisma.email.delete).toHaveBeenCalledWith({
        where: { id: testEmail.id }
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: testEmail.id }
      })
    })

    it('should return 404 when email not found', async () => {
      const req = createMockRequest({
        user: testUser,
        params: { id: 'non-existent-id' }
      })
      const res = createMockResponse()

      mockPrisma.email.findFirst.mockResolvedValue(null)

      await EmailsController.deleteEmail(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email not found'
      })
    })
  })

  describe('bulkDeleteEmails', () => {
    it('should bulk delete emails successfully', async () => {
      const emailIds = [testEmail.id, 'email-2']
      const req = createMockRequest({
        user: testUser,
        body: { emailIds }
      })
      const res = createMockResponse()

      const existingEmails = [
        { id: testEmail.id },
        { id: 'email-2' }
      ]

      mockPrisma.email.findMany.mockResolvedValue(existingEmails)
      mockPrisma.email.deleteMany.mockResolvedValue({ count: 2 })

      await EmailsController.bulkDeleteEmails(req as any, res as any)

      expect(mockPrisma.email.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: emailIds }
        }
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          deletedCount: 2,
          deletedEmailIds: emailIds
        }
      })
    })
  })

  describe('DTO Validations', () => {
    describe('EmailQueryDto', () => {
      it('should validate and transform query parameters', () => {
        const validData = {
          limit: '25',
          offset: '10',
          isRead: 'true',
          sortBy: 'subject',
          sortOrder: 'asc',
          search: 'test'
        }

        const result = EmailQueryDto.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual({
            limit: 25,
            offset: 10,
            isRead: true,
            sortBy: 'subject',
            sortOrder: 'asc',
            search: 'test'
          })
        }
      })

      it('should reject invalid sort by field', () => {
        const invalidData = {
          sortBy: 'invalid-field'
        }

        const result = EmailQueryDto.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should reject invalid limit value', () => {
        const invalidData = {
          limit: '0' // Below minimum
        }

        const result = EmailQueryDto.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('UpdateEmailDto', () => {
      it('should validate correct update data', () => {
        const validData = {
          isRead: true,
          isArchived: false,
          categoryId: 'cl9ebqhxk00008ci13z4dg6ot'
        }

        const result = UpdateEmailDto.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validData)
        }
      })

      it('should accept null categoryId', () => {
        const validData = {
          categoryId: null
        }

        const result = UpdateEmailDto.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.categoryId).toBe(null)
        }
      })

      it('should reject invalid categoryId format', () => {
        const invalidData = {
          categoryId: 'invalid-id'
        }

        const result = UpdateEmailDto.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('BulkUpdateEmailDto', () => {
      it('should validate correct bulk update data', () => {
        const validData = {
          emailIds: ['cl9ebqhxk00008ci13z4dg6ot', 'cl9ebqhxk00009ci13z4dg6ot'],
          updates: {
            isRead: true,
            categoryId: 'cl9ebqhxk00010ci13z4dg6ot'
          }
        }

        const result = BulkUpdateEmailDto.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validData)
        }
      })

      it('should reject empty emailIds array', () => {
        const invalidData = {
          emailIds: [],
          updates: { isRead: true }
        }

        const result = BulkUpdateEmailDto.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ['emailIds'],
              message: 'At least one email ID is required'
            })
          )
        }
      })

      it('should reject invalid email ID format in array', () => {
        const invalidData = {
          emailIds: ['valid-cuid', 'invalid-id'],
          updates: { isRead: true }
        }

        const result = BulkUpdateEmailDto.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('BulkDeleteEmailDto', () => {
      it('should validate correct bulk delete data', () => {
        const validData = {
          emailIds: ['cl9ebqhxk00008ci13z4dg6ot', 'cl9ebqhxk00009ci13z4dg6ot']
        }

        const result = BulkDeleteEmailDto.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validData)
        }
      })

      it('should reject empty emailIds array', () => {
        const invalidData = {
          emailIds: []
        }

        const result = BulkDeleteEmailDto.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ['emailIds'],
              message: 'At least one email ID is required'
            })
          )
        }
      })
    })
  })
})