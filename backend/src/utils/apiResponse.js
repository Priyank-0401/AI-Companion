/**
 * Success Response
 * @param {Object} res - Express response object
 * @param {*} data - Data to be sent in the response
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    ...(data && { data })
  };
  
  return res.status(statusCode).json(response);
};

/**
 * Error Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} errors - Additional error details
 */
const errorResponse = (res, message = 'An error occurred', statusCode = 500, errors = {}) => {
  const response = {
    success: false,
    message,
    ...(Object.keys(errors).length > 0 && { errors })
  };
  
  return res.status(statusCode).json(response);
};

/**
 * Validation Error Response
 * @param {Object} res - Express response object
 * @param {Object} errors - Validation errors
 * @param {string} message - Error message (default: 'Validation Error')
 */
const validationError = (res, errors, message = 'Validation Error') => {
  return errorResponse(res, message, 400, errors);
};

/**
 * Not Found Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: 'Resource not found')
 */
const notFound = (res, message = 'Resource not found') => {
  return errorResponse(res, message, 404);
};

/**
 * Unauthorized Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: 'Unauthorized')
 */
const unauthorized = (res, message = 'Unauthorized') => {
  return errorResponse(res, message, 401);
};

/**
 * Forbidden Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: 'Forbidden')
 */
const forbidden = (res, message = 'Forbidden') => {
  return errorResponse(res, message, 403);
};

export {
  successResponse as success,
  errorResponse as error,
  validationError,
  notFound,
  unauthorized,
  forbidden
};
