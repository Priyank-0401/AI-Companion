import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import admin, { db, auth } from './config/firebase-admin.js';
import { logger, requestLogger, errorLogger } from './middleware/logger.js';
import { applySecurityMiddleware } from './middleware/security.js';
import { verifyToken } from './middleware/authMiddleware.js';
import errorHandler from './middleware/errorHandler.js';

// Simple route wrapper for error handling
const wrapRoute = (app) => {
  const methods = ['get', 'post', 'put', 'delete', 'use', 'all'];
  const originalMethods = {};

  methods.forEach(method => {
    originalMethods[method] = app[method].bind(app);
    app[method] = function(path, ...handlers) {
      return originalMethods[method](path, ...handlers);
    };
  });

  return app;
};

// Import API routes
import chatRoutes from './routes/chatHandler.js';
import wellnessRoutes from './routes/wellnessHandler.js';
import journalRoutes from './routes/journalHandler.js';
import settingsRoutes from './routes/settingsHandler.js';
import conversationRoutes from './routes/conversationHandler.js';
import authRoutes from './routes/authHandler.js';

// Initialize Express app
export const app = wrapRoute(express());

// Apply security middleware
applySecurityMiddleware(app);

// Request logging
app.use(requestLogger);

// Compress all responses
app.use(compression());

// Cookie parser
app.use(cookieParser());

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version
  });
});

// API Routes
const routes = [
  // Health check endpoint (public)
  {
    path: '/api/health',
    handler: (req, res) => {
      res.status(200).json({
        status: 'success',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
      });
    }
  },
  // API Routes
  { path: '/api/auth', handler: authRoutes },
  { path: '/api/chat', handler: verifyToken, subHandler: chatRoutes },
  { path: '/api/wellness', handler: verifyToken, subHandler: wellnessRoutes },
  { path: '/api/journal', handler: verifyToken, subHandler: journalRoutes },
  { path: '/api/settings', handler: verifyToken, subHandler: settingsRoutes },
  { path: '/api/conversations', handler: verifyToken, subHandler: conversationRoutes },
  // { path: '/api/journal', handler: verifyToken, subHandler: journalRoutes },
  // { path: '/api/settings', handler: verifyToken, subHandler: settingsRoutes },
  // { path: '/api/conversations', handler: verifyToken, subHandler: conversationRoutes }
];

// Register routes
routes.forEach(route => {
  if (route.handler) {
    if (route.subHandler) {
      // Route with middleware and sub-handler (e.g., auth middleware + router)
      app.use(route.path, route.handler, route.subHandler);
    } else if (typeof route.handler === 'function') {
      // Direct route handler (like our health check)
      app.get(route.path, (req, res, next) => {
        // Use the sanitized query if available
        if (req.sanitizedQuery) {
          req.query = req.sanitizedQuery;
        }
        return route.handler(req, res, next);
      });
    }
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Handle SPA routing - return all non-API requests to React app
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.resolve(__dirname, '../client/build/index.html'));
  });
}

// 404 handler for API routes
app.use('/api', (req, res, next) => {
  // If we get here, no other route matched
  const error = new Error(`Can't find ${req.originalUrl} on this server!`);
  error.statusCode = 404;
  error.isOperational = true;
  next(error);
});

// Log errors
app.use(errorLogger);

// Global error handler
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`UNHANDLED REJECTION! 💥 ${err.name}: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION! 💥 ${err.name}: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Export the Express app as default
export default app;
