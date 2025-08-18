import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

jest.mock('../../lib/prisma', () => ({
  prisma: mockDeep<PrismaClient>()
}))

//@ts-ignore
process.env.NODE_ENV = 'test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:8080/api/v1/gmail-accounts/callback'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn()
}))

jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        generateAuthUrl: jest.fn().mockReturnValue('http://test-oauth-url.com'),
        getToken: jest.fn().mockResolvedValue({
          tokens: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            expires_in: 3600
          }
        }),
        setCredentials: jest.fn(),
        credentials: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token'
        }
      }))
    },
    gmail: jest.fn().mockReturnValue({
      users: {
        messages: {
          list: jest.fn().mockResolvedValue({
            data: {
              messages: [
                { id: 'msg1', threadId: 'thread1' },
                { id: 'msg2', threadId: 'thread2' }
              ]
            }
          }),
          get: jest.fn().mockResolvedValue({
            data: {
              id: 'msg1',
              threadId: 'thread1',
              payload: {
                headers: [
                  { name: 'From', value: 'sender@example.com' },
                  { name: 'Subject', value: 'Test Email' },
                  { name: 'Date', value: '2024-01-01T00:00:00Z' }
                ],
                body: {
                  data: Buffer.from('Test email body').toString('base64')
                }
              }
            }
          })
        },
        getProfile: jest.fn().mockResolvedValue({
          data: {
            emailAddress: 'test@example.com',
            messagesTotal: 100,
            threadsTotal: 50
          }
        })
      }
    }),
    people: jest.fn().mockReturnValue({
      people: {
        get: jest.fn().mockResolvedValue({
          data: {
            resourceName: 'people/123',
            emailAddresses: [{ value: 'test@example.com' }],
            names: [{ displayName: 'Test User' }],
            photos: [{ url: 'http://example.com/photo.jpg' }]
          }
        })
      }
    })
  }
}))

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                category: 'Work',
                confidence: 0.9,
                summary: 'Test email summary'
              })
            }
          }]
        })
      }
    }
  }))
}))

jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockImplementation((size: number) => ({
    toString: jest.fn().mockReturnValue('test-random-bytes')
  })),
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('test-hash')
  })
}))

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}

export const testUser = {
  id: 'user-test-id',
  email: 'test@example.com',
  name: 'Test User',
  image: 'http://example.com/avatar.jpg',
  emailVerified: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
}

export const testCategory = {
  id: 'category-test-id',
  name: 'Test Category',
  description: 'Test category description',
  color: 'bg-blue-500',
  userId: testUser.id,
  createdAt: new Date(),
  updatedAt: new Date()
}

export const testGmailAccount = {
  id: 'gmail-account-test-id',
  email: 'test@gmail.com',
  name: 'Test Gmail Account',
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  isActive: true,
  lastSync: new Date(),
  userId: testUser.id,
  createdAt: new Date(),
  updatedAt: new Date()
}

export const testEmail = {
  id: 'email-test-id',
  gmailId: 'gmail-message-id',
  subject: 'Test Email Subject',
  fromEmail: 'sender@example.com',
  fromName: 'Sender Name',
  toEmails: 'test@example.com',
  toEmail: 'test@example.com', // Keep for backward compatibility
  body: 'Test email body content',
  htmlBody: '<p>Test email body content</p>',
  receivedAt: new Date(),
  isRead: false,
  isArchived: false,
  hasAttachments: false,
  aiSummary: 'Test AI summary',
  aiConfidence: 0.8,
  priority: 'medium',
  categoryId: testCategory.id,
  gmailAccountId: testGmailAccount.id,
  createdAt: new Date(),
  updatedAt: new Date()
}

export const createMockRequest = (overrides = {}) => {
  const defaults = {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined // Don't set default user
  }
  return { ...defaults, ...overrides }
}

export const createMockResponse = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.redirect = jest.fn().mockReturnValue(res)
  res.cookie = jest.fn().mockReturnValue(res)
  res.clearCookie = jest.fn().mockReturnValue(res)
  return res
}

// Mock authenticated request middleware
export const mockAuthenticatedRequest = (user = testUser) => ({
  user,
  body: {},
  params: {},
  query: {},
  headers: {}
})

beforeEach(() => {
  jest.clearAllMocks()
  mockReset(require('../../lib/prisma').prisma)
  
  // Reset test objects to prevent state leakage between tests
  testUser.createdAt = new Date()
  testUser.updatedAt = new Date()
  testUser.emailVerified = new Date()
  
  testCategory.createdAt = new Date()
  testCategory.updatedAt = new Date()
  
  testGmailAccount.createdAt = new Date()
  testGmailAccount.updatedAt = new Date()
  testGmailAccount.lastSync = new Date()
  
  testEmail.createdAt = new Date()
  testEmail.updatedAt = new Date()
  testEmail.receivedAt = new Date()
})

beforeAll(() => {
  if (process.env.TEST_VERBOSE !== 'true') {
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'info').mockImplementation(() => {})
  }
})

afterAll(() => {
  jest.restoreAllMocks()
})