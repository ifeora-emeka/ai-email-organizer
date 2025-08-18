import { requireAuth, optionalAuth } from '../../server/middleware/auth.middleware'
import { createMockRequest, createMockResponse, testUser } from './setup'
import { prisma } from '../../lib/prisma'

// Mock prisma
jest.mock('../../lib/prisma')
const mockPrisma = prisma as any

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('requireAuth', () => {
    it('should authenticate user with valid email header', async () => {
      const req = createMockRequest({
        headers: { 'x-user-email': testUser.email }
      })
      const res = createMockResponse()
      const next = jest.fn()

      mockPrisma.user.findUnique.mockResolvedValue(testUser)

      await requireAuth(req as any, res as any, next)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: testUser.email }
      })
      expect(req.user).toEqual({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        image: testUser.image
      })
      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should return 401 when no email header provided', async () => {
      const req = createMockRequest({
        headers: {}
      })
      const res = createMockResponse()
      const next = jest.fn()

      await requireAuth(req as any, res as any, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 401 when user not found', async () => {
      const req = createMockRequest({
        headers: { 'x-user-email': 'nonexistent@example.com' }
      })
      const res = createMockResponse()
      const next = jest.fn()

      mockPrisma.user.findUnique.mockResolvedValue(null)

      await requireAuth(req as any, res as any, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 500 when database error occurs', async () => {
      const req = createMockRequest({
        headers: { 'x-user-email': testUser.email }
      })
      const res = createMockResponse()
      const next = jest.fn()

      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

      await requireAuth(req as any, res as any, next)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication failed'
      })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('optionalAuth', () => {
    it('should authenticate user when valid email header provided', async () => {
      const req = createMockRequest({
        headers: { 'x-user-email': testUser.email }
      })
      const res = createMockResponse()
      const next = jest.fn()

      mockPrisma.user.findUnique.mockResolvedValue(testUser)

      await optionalAuth(req as any, res as any, next)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: testUser.email }
      })
      expect(req.user).toEqual({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        image: testUser.image
      })
      expect(next).toHaveBeenCalled()
    })

    it('should continue without authentication when no email header provided', async () => {
      const req = createMockRequest({
        headers: {}
      })
      const res = createMockResponse()
      const next = jest.fn()

      await optionalAuth(req as any, res as any, next)

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
      expect(req.user).toBeUndefined()
      expect(next).toHaveBeenCalled()
    })

    it('should continue without authentication when user not found', async () => {
      const req = createMockRequest({
        headers: { 'x-user-email': 'nonexistent@example.com' }
      })
      const res = createMockResponse()
      const next = jest.fn()

      mockPrisma.user.findUnique.mockResolvedValue(null)

      await optionalAuth(req as any, res as any, next)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' }
      })
      expect(req.user).toBeUndefined()
      expect(next).toHaveBeenCalled()
    })

    it('should continue even when database error occurs', async () => {
      const req = createMockRequest({
        headers: { 'x-user-email': testUser.email }
      })
      const res = createMockResponse()
      const next = jest.fn()

      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

      await optionalAuth(req as any, res as any, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })
  })
})