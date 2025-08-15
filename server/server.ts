import dotenv from 'dotenv';
import { createApp } from './app';
import { prisma } from '../lib/prisma';

dotenv.config();

const PORT = parseInt(process.env.PORT || '8080');

const initDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    if (process.env.NODE_ENV === 'production') {
      await prisma.$executeRaw`PRAGMA journal_mode=WAL;`;
      await prisma.$executeRaw`PRAGMA foreign_keys=ON;`;
      console.log('✅ Database optimized for production');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

const startServer = async () => {
  try {
    await initDatabase();
    
    const app = await createApp();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check available at: http://localhost:${PORT}/api/v1/health`);
      console.log(`Database: ${process.env.DATABASE_URL}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
