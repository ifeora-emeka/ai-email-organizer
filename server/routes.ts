import { Router } from 'express';

export const apiRoutes = Router();

apiRoutes.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '0.1.0',
    service: 'ai-email-organizer'
  });
});

apiRoutes.get('/ping', (req, res) => {
  res.status(200).send('pong');
});
