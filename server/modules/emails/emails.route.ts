import { Router } from 'express'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { requireAuth } from '../../middleware/auth.middleware'
import { EmailsController } from './emails.controller'
import { EmailParamsDto, EmailQueryDto, UpdateEmailDto, BulkUpdateEmailDto } from './emails.dto'

const router = Router()

// All routes require authentication
router.use(requireAuth)

// GET /api/emails - Get emails with filtering and pagination
router.get(
  '/',
  validateQuery(EmailQueryDto),
  EmailsController.getEmails
)

// GET /api/emails/:id - Get specific email by ID
router.get(
  '/:id',
  validateParams(EmailParamsDto),
  EmailsController.getEmailById
)

// PUT /api/emails/:id - Update specific email
router.put(
  '/:id',
  validateParams(EmailParamsDto),
  validateBody(UpdateEmailDto),
  EmailsController.updateEmail
)

// PUT /api/emails/bulk - Bulk update emails
router.put(
  '/bulk',
  validateBody(BulkUpdateEmailDto),
  EmailsController.bulkUpdateEmails
)

// DELETE /api/emails/:id - Delete specific email
router.delete(
  '/:id',
  validateParams(EmailParamsDto),
  EmailsController.deleteEmail
)

export { router as emailsRouter }