import app from './app.js';
import config from './config/index.js';
import { logger } from './utils/logger.js';
import { initializeFirebase } from './config/firebase.js';

// Initialize Firebase and start server
const startServer = async () => {
  try {
    // Start the server
    const server = app.listen(config.app.port, config.app.host, () => {
      logger.info(`Server running in ${config.app.env} mode`);
      logger.info(`API Base URL: http://${config.app.host}:${config.app.port}${config.app.apiPrefix}`);
      logger.info(`Health Check: http://${config.app.host}:${config.app.port}${config.app.apiPrefix}/health`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
      logger.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle SIGTERM for graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        logger.info('💥 Process terminated!');
      });
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
let server;

// Initialize Firebase and start the server
const initializeAndStart = async () => {
  try {
    // Initialize Firebase first
    await initializeFirebase();
    logger.info('Firebase initialized successfully');
    
    // Then start the server
    server = await startServer();
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
      logger.error(err.name, err.message);
      if (server) {
        server.close(() => process.exit(1));
      } else {
        process.exit(1);
      }
    });

    // Handle SIGTERM for graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
      if (server) {
        server.close(() => {
          logger.info('💥 Process terminated!');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
    
    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error('Error:', err);
  logger.error('Stack:', err.stack);
  
  // Graceful shutdown if server is running
  if (server) {
    server.close(() => {
      logger.info('Server closed due to uncaught exception');
      process.exit(1);
    });
    
    // Force shutdown if server close takes too long
    setTimeout(() => {
      logger.error('Forcing shutdown due to uncaught exception');
      process.exit(1);
    }, 1000).unref();
  } else {
    // If server isn't running, just exit
    process.exit(1);
  }
});

// Start the application
initializeAndStart();

export default server;
