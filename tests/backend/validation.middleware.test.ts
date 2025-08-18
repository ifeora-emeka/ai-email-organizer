import { validateBody, validateQuery, validateParams } from '../../server/middleware/validation.middleware'
import { createMockRequest, createMockResponse } from './setup'
import { z } from 'zod'

describe('Validation Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateBody', () => {
    const testSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Valid email is required'),
      age: z.number().min(18, 'Must be at least 18')
    })

    it('should validate correct body data and call next', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
      }
      const req = createMockRequest({ body: validData })
      const res = createMockResponse()
      const next = jest.fn()

      const middleware = validateBody(testSchema)
      middleware(req as any, res as any, next)

      expect(req.body).toEqual(validData)
      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should return 400 with validation errors for invalid data', () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        age: 16
      }
      const req = createMockRequest({ body: invalidData })
      const res = createMockResponse()
      const next = jest.fn()

      const middleware = validateBody(testSchema)
      middleware(req as any, res as any, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        details: [
          {
            path: 'name',
            message: 'Name is required',
            code: 'too_small'
          },
          {
            path: 'email',
            message: 'Valid email is required',
            code: 'invalid_string'
          },
          {
            path: 'age',
            message: 'Must be at least 18',
            code: 'too_small'
          }
        ]
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 500 for non-Zod errors', () => {
      const maliciousSchema = {
        parse: () => {
          throw new Error('Non-Zod error')
        }
      } as any

      const req = createMockRequest({ body: {} })
      const res = createMockResponse()
      const next = jest.fn()

      const middleware = validateBody(maliciousSchema)
      middleware(req as any, res as any, next)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error'
      })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('validateQuery', () => {
    const querySchema = z.object({
      limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)),
      offset: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(0)).optional(),
      search: z.string().optional()
    })

    it('should validate and transform query parameters', () => {
      const validQuery = {
        limit: '25',
        offset: '10',
        search: 'test'
      }
      const req = createMockRequest({ query: validQuery })
      const res = createMockResponse()
      const next = jest.fn()

      const middleware = validateQuery(querySchema)
      middleware(req as any, res as any, next)

      expect(req.query).toEqual({
        limit: 25,
        offset: 10,
        search: 'test'
      })
      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should return 400 for invalid query parameters', () => {
      const invalidQuery = {
        limit: 'abc', // Should be numeric
        offset: '-1'  // Should be non-negative
      }
      const req = createMockRequest({ query: invalidQuery })
      const res = createMockResponse()
      const next = jest.fn()

      const middleware = validateQuery(querySchema)
      middleware(req as any, res as any, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Query Validation Error',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: 'limit',
            code: 'invalid_string'
          })
        ])
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should handle missing optional parameters', () => {
      const validQuery = {
        limit: '10'
        // offset and search are optional
      }
      const req = createMockRequest({ query: validQuery })
      const res = createMockResponse()
      const next = jest.fn()

      const middleware = validateQuery(querySchema)
      middleware(req as any, res as any, next)

      expect(req.query).toEqual({
        limit: 10
      })
      expect(next).toHaveBeenCalled()
    })
  })

  describe('validateParams', () => {
    const paramsSchema = z.object({
      id: z.string().cuid('Invalid ID format'),
      action: z.enum(['view', 'edit', 'delete']).optional()
    })

    it('should validate correct params', () => {
      const validParams = {
        id: 'cl9ebqhxk00008ci13z4dg6ot',
        action: 'view'
      }
      const req = createMockRequest({ params: validParams })
      const res = createMockResponse()
      const next = jest.fn()

      const middleware = validateParams(paramsSchema)
      middleware(req as any, res as any, next)

      expect(req.params).toEqual(validParams)
      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should return 400 for invalid params', () => {
      const invalidParams = {
        id: 'invalid-id',
        action: 'invalid-action'
      }
      const req = createMockRequest({ params: invalidParams })
      const res = createMockResponse()
      const next = jest.fn()

      const middleware = validateParams(paramsSchema)
      middleware(req as any, res as any, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Params Validation Error',
        details: [
          {
            path: 'id',
            message: 'Invalid ID format',
            code: 'invalid_string'
          },
          {
            path: 'action',
            message: expect.any(String),
            code: 'invalid_enum_value'
          }
        ]
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should handle missing required parameters', () => {
      const invalidParams = {
        // Missing required 'id' parameter
        action: 'view'
      }
      const req = createMockRequest({ params: invalidParams })
      const res = createMockResponse()
      const next = jest.fn()

      const middleware = validateParams(paramsSchema)
      middleware(req as any, res as any, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Params Validation Error',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: 'id',
            code: 'invalid_type'
          })
        ])
      })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('Integration tests', () => {
    it('should work with complex nested schemas', () => {
      const complexSchema = z.object({
        user: z.object({
          name: z.string().min(1),
          email: z.string().email(),
          preferences: z.object({
            theme: z.enum(['light', 'dark']),
            notifications: z.boolean()
          })
        }),
        tags: z.array(z.string()).min(1)
      })

      const validData = {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          preferences: {
            theme: 'dark',
            notifications: true
          }
        },
        tags: ['work', 'urgent']
      }

      const req = createMockRequest({ body: validData })
      const res = createMockResponse()
      const next = jest.fn()

      const middleware = validateBody(complexSchema)
      middleware(req as any, res as any, next)

      expect(req.body).toEqual(validData)
      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should provide detailed error paths for nested validation failures', () => {
      const complexSchema = z.object({
        user: z.object({
          name: z.string().min(1),
          email: z.string().email()
        })
      })

      const invalidData = {
        user: {
          name: '',
          email: 'invalid-email'
        }
      }

      const req = createMockRequest({ body: invalidData })
      const res = createMockResponse()
      const next = jest.fn()

      const middleware = validateBody(complexSchema)
      middleware(req as any, res as any, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        details: [
          {
            path: 'user.name',
            message: expect.any(String),
            code: 'too_small'
          },
          {
            path: 'user.email',
            message: expect.any(String),
            code: 'invalid_string'
          }
        ]
      })
      expect(next).not.toHaveBeenCalled()
    })
  })
})