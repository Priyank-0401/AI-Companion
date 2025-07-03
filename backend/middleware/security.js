import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../utils/ApiError.js';
import express from 'express';
import cors from 'cors';
import xss from 'xss';

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https: data:'],
      connectSrc: ["'self'", 'https://*.googleapis.com'],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for some CDNs
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 15552000, includeSubDomains: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'no-referrer' },
  xssFilter: true,
});

// Security middleware for Firestore
const sanitizeFirestore = (req, res, next) => {
  // Create a sanitized copy of query parameters without modifying the original request
  const originalQuery = req.query || {};
  const sanitizedQuery = {};
  let hasInvalidParams = false;

  // Check for potentially dangerous keys
  for (const [key, value] of Object.entries(originalQuery)) {
    if (key.startsWith('$') || key.includes('.')) {
      console.warn(`[Security] Attempted to use potentially unsafe key: ${key}`, {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
      });
      hasInvalidParams = true;
      continue;
    }
    sanitizedQuery[key] = value;
  }

  // If we found invalid parameters, reject the request
  if (hasInvalidParams) {
    return res.status(400).json({
      success: false,
      error: 'Invalid query parameters detected',
    });
  }

  // Attach sanitized query to request for downstream middleware
  req.sanitizedQuery = sanitizedQuery;
  next();
};

// XSS protection middleware
const xssProtection = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    req.body = JSON.parse(JSON.stringify(req.body)); // Create a deep copy
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    });
  }
  
  // Sanitize query parameters
  if (req.query) {
    const sanitizedQuery = {};
    Object.entries(req.query).forEach(([key, value]) => {
      if (typeof value === 'string') {
        sanitizedQuery[key] = xss(value);
      } else {
        sanitizedQuery[key] = value;
      }
    });
    // Store sanitized query in a new property instead of modifying req.query directly
    req.sanitizedQuery = sanitizedQuery;
  }
  
  next();
};

// Rate limiting for brute force protection
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  handler: (req, res, next, options) => {
    return next(
      new ApiError(
        options.message,
        StatusCodes.TOO_MANY_REQUESTS
      )
    );
  },
});

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
};

// Apply all security middleware
const applySecurityMiddleware = (app) => {
  // Trust proxy
  app.set('trust proxy', 1);

  // Security headers
  app.use(securityHeaders);

  // Enable CORS
  app.use(cors(corsOptions));

  // Body parser, reading data from body into req.body
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Data sanitization against XSS
  app.use(xssProtection);
  
  // Firestore security middleware
  app.use(sanitizeFirestore);

  // Rate limiting (applied to API routes only)
  app.use('/api', apiLimiter);
};

export {
  securityHeaders,
  sanitizeFirestore,
  xssProtection,
  apiLimiter,
  corsOptions,
  applySecurityMiddleware
};
