import { logger } from './logger.js';

/**
 * Custom error class for LLM-related errors
 */
class LLMError extends Error {
  constructor(message, type = 'LLM_ERROR', statusCode = 500, details = {}) {
    super(message);
    this.name = 'LLMError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    
    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Format the error as a JSON response
   * @returns {Object} Error response object
   */
  toJSON() {
    return {
      success: false,
      error: {
        type: this.type,
        message: this.message,
        details: this.details,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Log the error
   */
  log() {
    logger.error(`[${this.type}] ${this.message}`, {
      statusCode: this.statusCode,
      details: this.details,
      stack: this.stack
    });
  }
}

/**
 * Error types for common LLM issues
 */
const ERROR_TYPES = {
  // Provider errors
  PROVIDER_NOT_FOUND: 'PROVIDER_NOT_FOUND',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  PROVIDER_AUTH_ERROR: 'PROVIDER_AUTH_ERROR',
  PROVIDER_RATE_LIMIT: 'PROVIDER_RATE_LIMIT',
  
  // Model errors
  MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
  MODEL_UNAVAILABLE: 'MODEL_UNAVAILABLE',
  MODEL_OVERLOADED: 'MODEL_OVERLOADED',
  
  // Request errors
  INVALID_REQUEST: 'INVALID_REQUEST',
  CONTEXT_TOO_LARGE: 'CONTEXT_TOO_LARGE',
  GENERATION_ERROR: 'GENERATION_ERROR',
  
  // Authentication & permissions
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Fallback errors
  FALLBACK_FAILED: 'FALLBACK_FAILED',
  
  // Unknown error
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Map HTTP status codes to error types
 */
const STATUS_CODES = {
  [ERROR_TYPES.PROVIDER_NOT_FOUND]: 404,
  [ERROR_TYPES.PROVIDER_UNAVAILABLE]: 503,
  [ERROR_TYPES.PROVIDER_AUTH_ERROR]: 401,
  [ERROR_TYPES.PROVIDER_RATE_LIMIT]: 429,
  [ERROR_TYPES.MODEL_NOT_FOUND]: 404,
  [ERROR_TYPES.MODEL_UNAVAILABLE]: 503,
  [ERROR_TYPES.MODEL_OVERLOADED]: 503,
  [ERROR_TYPES.INVALID_REQUEST]: 400,
  [ERROR_TYPES.CONTEXT_TOO_LARGE]: 400,
  [ERROR_TYPES.GENERATION_ERROR]: 500,
  [ERROR_TYPES.AUTHENTICATION_ERROR]: 401,
  [ERROR_TYPES.PERMISSION_DENIED]: 403,
  [ERROR_TYPES.RATE_LIMIT_EXCEEDED]: 429,
  [ERROR_TYPES.FALLBACK_FAILED]: 500,
  [ERROR_TYPES.UNKNOWN_ERROR]: 500
};

/**
 * Create a new LLM error
 * @param {string} message - Error message
 * @param {string} type - Error type (from ERROR_TYPES)
 * @param {Object} details - Additional error details
 * @returns {LLMError} Error instance
 */
function createError(message, type = ERROR_TYPES.UNKNOWN_ERROR, details = {}) {
  const statusCode = STATUS_CODES[type] || 500;
  return new LLMError(message, type, statusCode, details);
}

/**
 * Handle LLM errors and send appropriate response
 * @param {Error} error - Error object
 * @param {Object} res - Express response object
 * @param {string} [defaultMessage] - Default error message
 */
function handleError(error, res, defaultMessage = 'An error occurred while processing your request') {
  let llmError;
  
  if (error instanceof LLMError) {
    llmError = error;
  } else if (error.response) {
    // Handle API response errors
    const { status, statusText, data } = error.response;
    
    let type = ERROR_TYPES.UNKNOWN_ERROR;
    let message = statusText || defaultMessage;
    
    if (status === 401) {
      type = ERROR_TYPES.PROVIDER_AUTH_ERROR;
      message = 'Invalid or missing API key';
    } else if (status === 404) {
      type = ERROR_TYPES.MODEL_NOT_FOUND;
      message = 'The requested model was not found';
    } else if (status === 429) {
      type = ERROR_TYPES.RATE_LIMIT_EXCEEDED;
      message = 'Rate limit exceeded. Please try again later.';
    } else if (status >= 500) {
      type = ERROR_TYPES.PROVIDER_UNAVAILABLE;
      message = 'The LLM provider is currently unavailable';
    }
    
    llmError = createError(message, type, {
      statusCode: status,
      response: data
    });
  } else if (error.request) {
    // Handle request errors (no response)
    llmError = createError(
      'The request was made but no response was received',
      ERROR_TYPES.PROVIDER_UNAVAILABLE,
      { originalError: error.message }
    );
  } else {
    // Handle other errors
    llmError = createError(
      error.message || defaultMessage,
      ERROR_TYPES.UNKNOWN_ERROR,
      { originalError: error.stack }
    );
  }
  
  // Log the error
  llmError.log();
  
  // Send error response
  res.status(llmError.statusCode).json(llmError.toJSON());
}

export {
  LLMError,
  ERROR_TYPES,
  createError,
  handleError
};
