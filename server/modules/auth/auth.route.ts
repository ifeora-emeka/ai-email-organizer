import { Router } from 'express'
import { AuthController } from './auth.controller'
import { requireAuth, optionalAuth } from '../../middleware/auth.middleware'
import { validateBody } from '../../middleware/validation.middleware'
import { GoogleAuthDto, RefreshTokenDto } from './auth.dto'

const router = Router()

router.get('/session', optionalAuth, AuthController.getSession)

router.post(
  '/google',
  validateBody(GoogleAuthDto),
  AuthController.googleSignIn
)

router.post('/logout', requireAuth, AuthController.signOut)

router.post(
  '/refresh',
  validateBody(RefreshTokenDto),
  AuthController.refreshToken
)

router.get('/profile', requireAuth, AuthController.getProfile)

export { router as authRouter }