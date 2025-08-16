import { Router } from 'express';
import { authRouter } from './modules/auth/auth.route';
import { categoriesRouter } from './modules/categories/categories.route';
import { gmailRouter } from './modules/gmail/gmail.route';
import { emailsRouter } from './modules/emails/emails.route';

export const apiRoutes = Router();

apiRoutes.get('/health', (req, res) =>
{
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '0.1.0',
    service: 'ai-email-organizer'
  });
});

apiRoutes.get('/ping', (req, res) =>
{
  res.status(200).send('pong');
});

apiRoutes.use('/auth', authRouter);
apiRoutes.use('/categories', categoriesRouter);
apiRoutes.use('/gmail-accounts', gmailRouter);
apiRoutes.use('/emails', emailsRouter);
