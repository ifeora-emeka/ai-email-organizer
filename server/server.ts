import dotenv from 'dotenv';
import { createApp } from './app';

dotenv.config();

const PORT = parseInt(process.env.PORT || '8080');

const startServer = async () => {
  try {
    const app = await createApp();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check available at: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
