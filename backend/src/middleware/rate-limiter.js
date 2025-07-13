import rateLimit from 'express-rate-limit';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Rate limiter middleware
 * Limits the number of requests from a single IP address
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum number of requests per window
 * @param {string} options.message - Error message when rate limit is exceeded
 * @returns {Function} Express middleware function
 */
export const rateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: config.rateLimit.windowMs || 15 * 60 * 1000, // 15 minutes
    max: config.rateLimit.max || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: options.message,
        status: 'error',
        message: 'Too many requests, please try again later.'
      });
    }
  };

  const finalOptions = { ...defaultOptions, ...options };
  return rateLimit(finalOptions);
};

// Export a default instance with default options
export default rateLimiter();
