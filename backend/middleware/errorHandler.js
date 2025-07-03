import ApiError from '../utils/ApiError.js';

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Default error response
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error for development
  console.error('Error:', error);

  // Handle specific error types
  // Firestore not found error
  if (err.code === 'not-found' || err.message.includes('No document to update')) {
    const message = 'The requested resource was not found';
    error = new ApiError(404, message);
  }

  // Firestore permission denied
  if (err.code === 'permission-denied' || err.message.includes('PERMISSION_DENIED')) {
    const message = 'You do not have permission to access this resource';
    error = new ApiError(403, message);
  }

  // Firestore invalid argument
  if (err.code === 'invalid-argument' || err.message.includes('INVALID_ARGUMENT')) {
    const message = 'Invalid data provided';
    error = new ApiError(400, message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new ApiError(401, message);
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new ApiError(401, message);
  }

  // CORS errors
  if (err.name === 'CorsError') {
    const message = 'Not allowed by CORS';
    error = new ApiError(403, message);
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

export default errorHandler;
