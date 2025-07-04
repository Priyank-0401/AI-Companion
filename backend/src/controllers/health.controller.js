import { success } from '../utils/apiResponse.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { createRequire } from 'module';

// Create require in ES module scope
const require = createRequire(import.meta.url);

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use require for JSON files in ES modules
const { version } = require('../../package.json');

/**
 * @desc    Health check endpoint
 * @route   GET /api/health
 * @access  Public
 */
const healthCheck = (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version,
    environment: process.env.NODE_ENV || 'development',
    database: 'connected', // You can add database connection check here
  };

  success(res, healthData, 'Service is running');
};

export { healthCheck };
