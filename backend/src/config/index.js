import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});

const config = {
  // App Configuration
  app: {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0',
    name: process.env.APP_NAME || 'AI-Companion',
    version: process.env.APP_VERSION || '1.0.0',
    secret: process.env.APP_SECRET,
    apiPrefix: process.env.API_PREFIX || '/api'
  },

  // Firebase Configuration
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? 
      process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : 
      undefined,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    clientId: process.env.FIREBASE_CLIENT_ID,
    authUri: process.env.FIREBASE_AUTH_URI,
    tokenUri: process.env.FIREBASE_TOKEN_URI,
    authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    clientC509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universeDomain: process.env.FIREBASE_UNIVERSE_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieExpires: process.env.JWT_COOKIE_EXPIRES || 7
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: process.env.CORS_ALLOWED_HEADERS?.split(',') || [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'x-request-start',
      'X-Request-Start',
      'X-Requested-With',
      'Accept',
      'Accept-Encoding',
      'Accept-Language',
      'Cache-Control',
      'Connection',
      'DNT',
      'Origin',
      'Referer',
      'User-Agent'
    ],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar', 'x-request-start'],
    credentials: true,
    maxAge: parseInt(process.env.CORS_MAX_AGE) || 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },

  // File Uploads
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) * 1024 * 1024 || 5 * 1024 * 1024, // 5MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/gif']
  },

  // Feature Flags
  features: {
    maintenance: process.env.FEATURE_MAINTENANCE_MODE === 'true',
    registration: process.env.FEATURE_REGISTRATION !== 'false',
    emailVerification: process.env.FEATURE_EMAIL_VERIFICATION === 'true',
    rateLimiting: process.env.FEATURE_RATE_LIMITING !== 'false'
  },

  // Ollama Configuration
  ollama: {
    host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
    model: process.env.OLLAMA_MODEL || 'llama3:latest',
    timeout: parseInt(process.env.OLLAMA_TIMEOUT) || 30000
  }
};

export default config;
