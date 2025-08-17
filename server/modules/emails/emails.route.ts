import { Router } from 'express'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { requireAuth } from '../../middleware/auth.middleware'
import { EmailsController } from './emails.controller'
import { EmailParamsDto, EmailQueryDto, UpdateEmailDto, BulkUpdateEmailDto, BulkDeleteEmailDto } from './emails.dto'

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
  '/bulk',
  validateBody(BulkDeleteEmailDto),
  EmailsController.bulkDeleteEmails
)

router.delete(
  '/:id',
  validateParams(EmailParamsDto),
  EmailsController.deleteEmail
)

// Unsubscribe routes
router.post(
  '/bulk-unsubscribe',
  EmailsController.bulkUnsubscribe
)

router.post(
  '/:emailId/unsubscribe',
  EmailsController.unsubscribeFromEmail
)

router.get(
  '/:emailId/unsubscribe-status',
  EmailsController.getUnsubscribeStatus
)

router.post(
  '/retry-failed-unsubscribes',
  EmailsController.retryFailedUnsubscribes
)

export { router as emailsRouter }