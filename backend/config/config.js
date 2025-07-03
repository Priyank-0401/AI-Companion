import path from 'path';
import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenvConfig();

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to parse boolean environment variables
const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return Boolean(value);
};

// Helper to parse number environment variables
const parseNumber = (value, defaultValue) => {
  if (value === undefined || value === null) return defaultValue;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Helper to parse array from comma-separated string
const parseArray = (value, defaultValue = []) => {
  if (!value) return defaultValue;
  if (Array.isArray(value)) return value;
  return value.split(',').map(item => item.trim());
};

const config = {
  // App
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
  app: {
    name: process.env.APP_NAME || 'AI-Companion',
    version: process.env.APP_VERSION || '1.0.0',
    port: parseNumber(process.env.PORT, 3001),
    host: process.env.HOST || '0.0.0.0',
    apiPrefix: process.env.API_PREFIX || '/api',
    secret: process.env.APP_SECRET || 'your-app-secret',
  },

  // Firebase
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? 
      process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : null,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieExpires: parseNumber(process.env.JWT_COOKIE_EXPIRES, 7),
  },

  // Database
  database: {
    // Firebase Firestore is used as the primary database
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseNumber(process.env.REDIS_PORT, 6379),
      password: process.env.REDIS_PASSWORD || '',
    },
  },

  // Ollama
  ollama: {
    host: process.env.OLLAMA_HOST || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama2',
    timeout: parseNumber(process.env.OLLAMA_TIMEOUT, 30000),
  },

  // CORS
  cors: {
    origin: parseArray(process.env.CORS_ORIGIN, ['http://localhost:5173']),
    methods: parseArray(process.env.CORS_METHODS, ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
    allowedHeaders: parseArray(process.env.CORS_ALLOWED_HEADERS, ['Content-Type', 'Authorization']),
    credentials: parseBoolean(process.env.CORS_CREDENTIALS, true),
    maxAge: parseNumber(process.env.CORS_MAX_AGE, 86400),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000), // 15 minutes
    max: parseNumber(process.env.RATE_LIMIT_MAX, 100),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || path.join(process.cwd(), 'logs'),
    file: process.env.LOG_FILE || 'app.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseNumber(process.env.LOG_MAX_FILES, 7),
  },

  // Email
  email: {
    host: process.env.EMAIL_HOST,
    port: parseNumber(process.env.EMAIL_PORT, 587),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || 'AI Companion <noreply@aicompanion.com>',
  },

  // File Uploads
  uploads: {
    dir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
    maxFileSize: parseNumber(process.env.MAX_FILE_SIZE, 5) * 1024 * 1024, // MB to bytes
    allowedFileTypes: parseArray(
      process.env.ALLOWED_FILE_TYPES,
      ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    ),
  },

  // Security Headers
  security: {
    secureHeaders: parseBoolean(process.env.SECURE_HEADERS, true),
    contentSecurityPolicy: process.env.CONTENT_SECURITY_POLICY || "default-src 'self'",
    xssProtection: process.env.XSS_PROTECTION || '1; mode=block',
    xFrameOptions: process.env.X_FRAME_OPTIONS || 'SAMEORIGIN',
    xContentTypeOptions: process.env.X_CONTENT_TYPE_OPTIONS || 'nosniff',
    hsts: {
      enabled: parseBoolean(process.env.HSTS_ENABLED, true),
      maxAge: parseNumber(process.env.HSTS_MAX_AGE, 31536000), // 1 year
      includeSubDomains: parseBoolean(process.env.HSTS_INCLUDE_SUBDOMAINS, true),
      preload: parseBoolean(process.env.HSTS_PRELOAD, true),
    },
  },

  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    maxAge: parseNumber(process.env.SESSION_MAX_AGE, 24 * 60 * 60 * 1000), // 24 hours
  },

  // Features
  features: {
    maintenanceMode: parseBoolean(process.env.FEATURE_MAINTENANCE_MODE, false),
    registration: parseBoolean(process.env.FEATURE_REGISTRATION, true),
    emailVerification: parseBoolean(process.env.FEATURE_EMAIL_VERIFICATION, false),
    rateLimiting: parseBoolean(process.env.FEATURE_RATE_LIMITING, true),
  },

  // Monitoring
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID,
  },

  // External APIs
  apis: {
    weather: {
      apiKey: process.env.WEATHER_API_KEY,
    },
  },
};

// Validate required configuration
const validateConfig = () => {
  const required = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_DATABASE_URL',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0 && !config.isTest) {
    console.error('Missing required environment variables:', missing.join(', '));
    if (config.isProduction) {
      process.exit(1);
    }
  }
};

// Validate configuration on startup
validateConfig();

// Export the config object as default
export default config;
