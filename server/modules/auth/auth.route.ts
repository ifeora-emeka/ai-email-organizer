import { Router } from 'express';
import { AuthController } from './auth.controller';
import { optionalAuth, requireAuth } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { GoogleSignInDto } from './auth.dto';

const router = Router();

router.get('/session', optionalAuth, AuthController.getSession);

router.get('/dependencies', requireAuth, AuthController.getDependencies);

router.post(
  '/google-signin',
  validateBody(GoogleSignInDto),
  AuthController.googleSignIn
);

export { router as authRouter };
