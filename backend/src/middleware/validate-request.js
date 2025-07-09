import { validationResult } from 'express-validator';
import { ERROR_TYPES, createError } from '../utils/llm-errors.js';

/**
 * Middleware to validate request using express-validator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Format errors for consistent response
    const formattedErrors = errors.array().map(error => ({
      param: error.param,
      message: error.msg,
      location: error.location,
      value: error.value
    }));
    
    // Create a validation error
    const error = createError(
      'Validation failed',
      ERROR_TYPES.INVALID_REQUEST,
      { errors: formattedErrors }
    );
    
    return res.status(400).json({
      success: false,
      error: {
        type: error.type,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  next();
};

export default validateRequest;
