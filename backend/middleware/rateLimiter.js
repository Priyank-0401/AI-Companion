const rateLimit = require('express-rate-limit');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

// Rate limiting for API routes (slower, more strict)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => {
    next(
      new ApiError(
        httpStatus.TOO_MANY_REQUESTS,
        'Too many requests, please try again later',
        true
      )
    );
  },
});

// Rate limiting for auth routes (faster, less strict)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new ApiError(
        httpStatus.TOO_MANY_REQUESTS,
        'Too many login attempts, please try again later',
        true
      )
    );
  },
});

// Rate limiting for sensitive operations (very strict)
const sensitiveLimiter = new RateLimiterMemory({
  points: 5, // 5 points
  duration: 3600, // Per hour
  blockDuration: 60 * 60, // Block for 1 hour if points are consumed
});

const sensitiveRateLimiter = (req, res, next) => {
  const key = req.ip; // Use IP as the key
  
  sensitiveLimiter.consume(key)
    .then(() => {
      next();
    })
    .catch(() => {
      next(
        new ApiError(
          httpStatus.TOO_MANY_REQUESTS,
          'Too many sensitive operations, please try again later',
          true
        )
      );
    });
};

module.exports = {
  apiLimiter,
  authLimiter,
  sensitiveRateLimiter,
};
