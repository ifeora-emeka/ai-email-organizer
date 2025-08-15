import { Router } from 'express'
import { GmailAccountsController } from './gmail-accounts.controller'
import { requireAuth } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { CreateGmailAccountDto, UpdateGmailAccountDto, GmailAccountParamsDto, GmailAccountQueryDto } from './gmail-accounts.dto'

const router = Router()

router.get(
  '/',
  requireAuth,
  validateQuery(GmailAccountQueryDto),
  GmailAccountsController.getGmailAccounts
)

router.get(
  '/:id',
  requireAuth,
  validateParams(GmailAccountParamsDto),
  GmailAccountsController.getGmailAccountById
)

router.post(
  '/',
  requireAuth,
  validateBody(CreateGmailAccountDto),
  GmailAccountsController.createGmailAccount
)

router.put(
  '/:id',
  requireAuth,
  validateParams(GmailAccountParamsDto),
  validateBody(UpdateGmailAccountDto),
  GmailAccountsController.updateGmailAccount
)

router.delete(
  '/:id',
  requireAuth,
  validateParams(GmailAccountParamsDto),
  GmailAccountsController.deleteGmailAccount
)

router.post(
  '/:id/sync',
  requireAuth,
  validateParams(GmailAccountParamsDto),
  GmailAccountsController.syncGmailAccount
)

export { router as gmailAccountsRouter }
