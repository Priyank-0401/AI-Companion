const httpStatus = require('http-status');
const { logger } = require('../middleware/logger');

/**
 * Success response formatter
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Formatted response
 */
const successResponse = (res, data = null, message = 'Success', statusCode = httpStatus.OK) => {
  const response = {
    success: true,
    message,
    data,
  };

  // Remove data if it's null/undefined
  if (data === null || data === undefined) {
    delete response.data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Error response formatter
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Error} error - Error object (for development)
 * @param {string} errorCode - Custom error code
 * @returns {Object} Formatted error response
 */
const errorResponse = (
  res,
  message = 'Internal Server Error',
  statusCode = httpStatus.INTERNAL_SERVER_ERROR,
  error = null,
  errorCode = null
) => {
  const response = {
    success: false,
    message,
    error: {
      code: errorCode || statusCode,
      message,
    },
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && error) {
    response.error.stack = error.stack;
  }

  // Log the error
  logger.error(`[${statusCode}] ${message}`, {
    error: {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    },
    statusCode,
    errorCode,
  });

  return res.status(statusCode).json(response);
};

/**
 * Validation error response formatter
 * @param {Object} res - Express response object
 * @param {Array} errors - Array of validation errors
 * @param {string} message - Error message
 * @returns {Object} Formatted validation error response
 */
const validationError = (
  res,
  errors = [],
  message = 'Validation Error'
) => {
  return res.status(httpStatus.BAD_REQUEST).json({
    success: false,
    message,
    error: {
      code: httpStatus.BAD_REQUEST,
      message,
      details: errors,
    },
  });
};

/**
 * Pagination response formatter
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 * @returns {Object} Formatted paginated response
 */
const paginatedResponse = (
  res,
  data = [],
  pagination = {},
  message = 'Success'
) => {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      page: Number(pagination.page) || 1,
      limit: Number(pagination.limit) || 10,
      total: Number(pagination.total) || 0,
      totalPages: Math.ceil(
        (Number(pagination.total) || 0) / (Number(pagination.limit) || 10)
      ),
    },
  };

  return res.status(httpStatus.OK).json(response);
};

module.exports = {
  successResponse,
  errorResponse,
  validationError,
  paginatedResponse,
};
