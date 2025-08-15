import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body)
      req.body = validatedData
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
        
        return res.status(400).json({
          error: 'Validation Error',
          details: errorMessages
        })
      }
      
      return res.status(500).json({
        error: 'Internal Server Error'
      })
    }
  }
}

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query)
      req.query = validatedData as any
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
        
        return res.status(400).json({
          error: 'Query Validation Error',
          details: errorMessages
        })
      }
      
      return res.status(500).json({
        error: 'Internal Server Error'
      })
    }
  }
}

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params)
      req.params = validatedData as any
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
        
        return res.status(400).json({
          error: 'Params Validation Error',
          details: errorMessages
        })
      }
      
      return res.status(500).json({
        error: 'Internal Server Error'
      })
    }
  }
}
