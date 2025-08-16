import express from 'express';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { apiRoutes } from './routes';

dotenv.config();

const limiter = rateLimit({
  windowMs: parseInt('900000'),
  max: parseInt('100'),
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt('900000') / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const createApp = async () =>
{
  const server = express();

  server.set('trust proxy', 1);

  if (process.env.NODE_ENV === 'development') {
    server.use(cors({
      origin: true, 
      credentials: true,
      methods: [ 'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS' ],
      allowedHeaders: [ 'Content-Type', 'Authorization', 'Cookie', 'X-User-Email', 'Origin', 'Accept' ],
    }));
  } else {
    server.use(cors({
      origin: [ process.env.FRONTEND_URL || 'https://your-domain.com' ],
      credentials: true,
      methods: [ 'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS' ],
      allowedHeaders: [ 'Content-Type', 'Authorization', 'Cookie', 'X-User-Email', 'Origin', 'Accept' ],
    }));
  }

  server.use('/api/v1', limiter);

  server.use('/api/v1', express.json());
  server.use('/api/v1', express.urlencoded({ extended: true }));

  server.use('/api/v1', apiRoutes);

  server.get('/', (req, res) =>
  {
    res.json({
      message: 'AI Email Organizer API',
      version: '1.0.0',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
        categories: '/api/v1/categories',
        gmailAccounts: '/api/v1/gmail-accounts'
      }
    });
  });

  return server;
};
