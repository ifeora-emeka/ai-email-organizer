import express from 'express';
import next from 'next';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { apiRoutes } from './routes';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

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

export const createApp = async () => {
  await nextApp.prepare();
  
  const server = express();

  server.use(limiter);
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));

  server.use('/api/v1', apiRoutes);

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  return server;
};
