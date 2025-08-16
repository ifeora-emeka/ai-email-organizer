import { Router } from 'express'
import { AuthController } from './auth.controller'
import { optionalAuth } from '../../middleware/auth.middleware'
import { validateBody } from '../../middleware/validation.middleware'
import { GoogleSignInDto } from './auth.dto'

const router = Router()

router.get('/session', optionalAuth, AuthController.getSession)

router.post(
  '/google-signin',
  validateBody(GoogleSignInDto),
  AuthController.googleSignIn
)

export { router as authRouter }