import { Router } from 'express'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { requireAuth } from '../../middleware/auth.middleware'
import { EmailsController } from './emails.controller'
import { EmailParamsDto, EmailQueryDto, UpdateEmailDto, BulkUpdateEmailDto } from './emails.dto'

const router = Router()

router.use(requireAuth)

router.get(
  '/',
  validateQuery(EmailQueryDto),
  EmailsController.getEmails
)

router.get(
  '/:id',
  validateParams(EmailParamsDto),
  EmailsController.getEmailById
)

router.put(
  '/:id',
  validateParams(EmailParamsDto),
  validateBody(UpdateEmailDto),
  EmailsController.updateEmail
)

router.put(
  '/bulk',
  validateBody(BulkUpdateEmailDto),
  EmailsController.bulkUpdateEmails
)

router.delete(
  '/:id',
  validateParams(EmailParamsDto),
  EmailsController.deleteEmail
)

export { router as emailsRouter }