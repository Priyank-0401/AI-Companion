import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import xss from 'xss-clean';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import config from './config/index.js';
import { errorHandler } from './middleware/error.js';
import { logger } from './utils/logger.js';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// 1) GLOBAL MIDDLEWARES

// Set security HTTP headers
app.use(helmet());

// Development logging
if (config.app.env === 'development') {
  app.use(morgan('dev'));
}

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: [] // Add any parameters that should be allowed to have duplicate values
}));

// Enable CORS
app.use(cors(config.cors));

// Compress all responses
app.use(compression());

// Rate limiting
if (config.features.rateLimiting) {
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use('/api', limiter);
}

// 2) ROUTES
app.get(config.app.apiPrefix, (req, res) => {
  res.status(200).json({
    status: 'success',
    message: `Welcome to ${config.app.name} API v${config.app.version}`,
    environment: config.app.env,
    timestamp: new Date().toISOString(),
    documentation: `${req.protocol}://${req.get('host')}${config.app.apiPrefix}/docs`,
    endpoints: {
      health: `${req.protocol}://${req.get('host')}${config.app.apiPrefix}/health`,
      auth: `${req.protocol}://${req.get('host')}${config.app.apiPrefix}/auth`
    }
  });
});

// Import routes
import healthRouter from './routes/health.routes.js';
import authRouter from './routes/auth.routes.js';

// API routes
const apiPrefix = config.app.apiPrefix;

// Mount health routes
const healthPath = `${apiPrefix}/health`;
logger.info(`Mounting health routes at ${healthPath}`);
app.use(healthPath, healthRouter);

// Mount auth routes
const authPath = `${apiPrefix}/auth`;
logger.info(`Mounting auth routes at ${authPath}`);
app.use(authPath, authRouter);

// Enhanced route debugging
const logRoutes = (router, prefix = '') => {
  router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      const methods = Object.keys(middleware.route.methods).join(',').toUpperCase();
      // For direct routes, use the prefix as is
      logger.info(`Route: ${methods.padEnd(6)} ${prefix}${middleware.route.path}`);
    } else if (middleware.name === 'router' && middleware.handle && middleware.handle.stack) {
      // For mounted routers, get the mount path from the regexp
      let mountPath = '';
      if (middleware.regexp) {
        // Convert the regexp to a string and clean it up
        mountPath = middleware.regexp.toString()
          .replace('/^\\/?', '')    // Remove leading /^\/?
          .replace('(?=\\/|$)/i', '') // Remove the lookahead and flags
          .replace(/\\\//g, '/');    // Unescape forward slashes
        
        // Remove any remaining regex characters
        mountPath = mountPath.replace(/[\^$?*+()\[\]{}\\]/g, '');
      }
      
      // Special case for the root path
      if (mountPath === '') {
        mountPath = '/';
      }
      
      // Recursively log routes with the updated prefix
      logRoutes(middleware.handle, prefix + mountPath);
    } else if (middleware.name === 'router') {
      // Routes registered with app.use()
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods).join(',').toUpperCase();
          logger.info(`Route: ${methods.padEnd(6)} ${prefix}${middleware.path || ''}${handler.route.path}`);
        }
      });
    }
  });
};

// Log all routes
logger.info('Registered Routes:');
logRoutes(app._router);

// More API routes will be mounted here
// app.use(`${config.app.apiPrefix}/users`, require('./routes/user.routes'));
// app.use(`${config.app.apiPrefix}/chat`, require('./routes/chat.routes'));
// app.use(`${config.app.apiPrefix}/wellness`, require('./routes/wellness.routes'));
// app.use(`${config.app.apiPrefix}/journal`, require('./routes/journal.routes'));
// app.use(`${config.app.apiPrefix}/settings`, require('./routes/settings.routes'));

// 3) ERROR HANDLING
// Handle 404 - Route not found
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global error handler
app.use(errorHandler);

export default app;
