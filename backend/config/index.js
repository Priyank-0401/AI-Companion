const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT) || 3001,
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // Ollama configuration
  ollama: {
    host: process.env.OLLAMA_HOST || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama2',
    timeout: parseInt(process.env.OLLAMA_TIMEOUT) || 30000
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  },

  // Data storage configuration
  storage: {
    dataDir: process.env.DATA_DIR || './data',
    logsDir: process.env.LOGS_DIR || './logs'
  },

  // Security configuration
  security: {
    rateLimit: parseInt(process.env.API_RATE_LIMIT) || 100,
    rateLimitWindow: parseInt(process.env.API_RATE_WINDOW) || 900000, // 15 minutes
    maxRequestSize: process.env.MAX_REQUEST_SIZE || '1mb'
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log'
  }
};

// Validate required configuration
function validateConfig() {
  const required = [
    'server.port',
    'ollama.host'
  ];

  for (const key of required) {
    const value = key.split('.').reduce((obj, k) => obj && obj[k], config);
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }
  }
}

// Export configuration
module.exports = config;
module.exports.validateConfig = validateConfig;
