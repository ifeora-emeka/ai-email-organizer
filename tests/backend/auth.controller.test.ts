import request from 'supertest'
import { AuthController } from '../../server/modules/auth/auth.controller'
import { GoogleSignInDto } from '../../server/modules/auth/auth.dto'
import { createMockRequest, createMockResponse, testUser } from './setup'
import { prisma } from '../../lib/prisma'
import { getToken } from 'next-auth/jwt'

// Mock the prisma import
jest.mock('../../lib/prisma')
const mockPrisma = prisma as any

// Mock next-auth/jwt
jest.mock('next-auth/jwt')
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSession', () => {
    it('should return user session when valid token exists', async () => {
      const req = createMockRequest()
      const res = createMockResponse()

      mockGetToken.mockResolvedValue({ sub: testUser.id } as any)
      mockPrisma.user.findUnique.mockResolvedValue(testUser)

      await AuthController.getSession(req as any, res as any)

      expect(mockGetToken).toHaveBeenCalledWith({
        req,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: 'next-auth.session-token'
      })
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: testUser.id }
      })
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: testUser.id,
            email: testUser.email,
            name: testUser.name,
            image: testUser.image
          }
        }
      })
    })

    it('should return 401 when no token exists', async () => {
      const req = createMockRequest()
      const res = createMockResponse()

      mockGetToken.mockResolvedValue(null)

      await AuthController.getSession(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No session found'
      })
    })

    it('should return 401 when user not found', async () => {
      const req = createMockRequest()
      const res = createMockResponse()

      mockGetToken.mockResolvedValue({ sub: testUser.id } as any)
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await AuthController.getSession(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      })
    })

    it('should handle database errors', async () => {
      const req = createMockRequest()
      const res = createMockResponse()

      mockGetToken.mockResolvedValue({ sub: testUser.id } as any)
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

      await AuthController.getSession(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get session'
      })
    })
  })

  describe('getDependencies', () => {
    it('should return user dependencies successfully', async () => {
      const req = createMockRequest({ user: testUser })
      const res = createMockResponse()

      const mockCategories = [
        { id: 'cat1', name: 'Work', description: 'Work emails', color: 'bg-blue-500', userId: testUser.id, createdAt: new Date(), updatedAt: new Date() }
      ]
      const mockGmailAccounts = [
        { id: 'gmail1', email: 'test@gmail.com', name: 'Test Account', isActive: true, lastSync: new Date(), userId: testUser.id, createdAt: new Date(), updatedAt: new Date() }
      ]
      const mockEmailCounts = [
        { categoryId: 'cat1', gmailAccountId: 'gmail1', _count: 5 }
      ]

      mockPrisma.user.findUnique.mockResolvedValue(testUser)
      mockPrisma.category.findMany.mockResolvedValue(mockCategories)
      mockPrisma.gmailAccount.findMany.mockResolvedValue(mockGmailAccounts)
      mockPrisma.email.groupBy.mockResolvedValue(mockEmailCounts)

      await AuthController.getDependencies(req as any, res as any)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: testUser.id,
            email: testUser.email,
            name: testUser.name,
            image: testUser.image
          },
          categories: [{
            id: 'cat1',
            name: 'Work',
            description: 'Work emails',
            color: 'bg-blue-500',
            emailCount: 5
          }],
          gmailAccounts: [{
            id: 'gmail1',
            email: 'test@gmail.com',
            name: 'Test Account',
            isActive: true,
            lastSync: mockGmailAccounts[0].lastSync,
            emailCount: 5
          }]
        }
      })
    })

    it('should return 401 when user not authenticated', async () => {
      const req = createMockRequest({ user: null })
      const res = createMockResponse()

      await AuthController.getDependencies(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      })
    })

    it('should return 401 when user not found in database', async () => {
      const req = createMockRequest({ user: testUser })
      const res = createMockResponse()

      mockPrisma.user.findUnique.mockResolvedValue(null)

      await AuthController.getDependencies(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      })
    })
  })

  describe('googleSignIn', () => {
    it('should create new user when user does not exist', async () => {
      const signInData = {
        googleId: 'google123',
        email: 'newuser@example.com',
        name: 'New User',
        image: 'http://example.com/avatar.jpg'
      }
      const req = createMockRequest({ body: signInData })
      const res = createMockResponse()

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue({
        ...testUser,
        id: signInData.googleId,
        email: signInData.email,
        name: signInData.name,
        image: signInData.image
      })

      await AuthController.googleSignIn(req as any, res as any)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: signInData.email }
      })
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          id: signInData.googleId,
          email: signInData.email,
          name: signInData.name,
          image: signInData.image,
          emailVerified: expect.any(Date)
        }
      })
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { user: expect.any(Object) }
      })
    })

    it('should update existing user when user exists', async () => {
      const signInData = {
        googleId: 'google123',
        email: testUser.email,
        name: 'Updated Name',
        image: 'http://example.com/new-avatar.jpg'
      }
      const req = createMockRequest({ body: signInData })
      const res = createMockResponse()

      const updatedUser = { ...testUser, name: signInData.name, image: signInData.image }

      mockPrisma.user.findUnique.mockResolvedValue(testUser)
      mockPrisma.user.update.mockResolvedValue(updatedUser)

      await AuthController.googleSignIn(req as any, res as any)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: signInData.email }
      })
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: testUser.id },
        data: {
          name: signInData.name,
          image: signInData.image
        }
      })
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { user: updatedUser }
      })
    })

    it('should handle database errors during sign in', async () => {
      const signInData = {
        googleId: 'google123',
        email: 'error@example.com',
        name: 'Error User',
        image: 'http://example.com/avatar.jpg'
      }
      const req = createMockRequest({ body: signInData })
      const res = createMockResponse()

      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

      await AuthController.googleSignIn(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to sign in with Google'
      })
    })
  })

  describe('GoogleSignInDto validation', () => {
    it('should validate correct Google sign-in data', () => {
      const validData = {
        googleId: 'google123',
        email: 'test@example.com',
        name: 'Test User',
        image: 'http://example.com/avatar.jpg'
      }

      const result = GoogleSignInDto.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        googleId: 'google123',
        email: 'invalid-email',
        name: 'Test User'
      }

      const result = GoogleSignInDto.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['email'],
            message: 'Valid email is required'
          })
        )
      }
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        email: 'test@example.com'
        // Missing googleId
      }

      const result = GoogleSignInDto.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['googleId'],
            message: 'Required'
          })
        )
      }
    })

    it('should accept optional fields', () => {
      const validData = {
        googleId: 'google123',
        email: 'test@example.com',
        accessToken: 'token123',
        refreshToken: 'refresh123'
      }

      const result = GoogleSignInDto.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.accessToken).toBe('token123')
        expect(result.data.refreshToken).toBe('refresh123')
      }
    })
  })
})