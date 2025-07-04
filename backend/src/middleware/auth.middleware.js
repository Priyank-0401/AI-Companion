import { protect } from './auth.js';

/**
 * Authentication middleware that verifies the user is logged in
 * Wraps the protect middleware for consistent naming with the rest of the application
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = (req, res, next) => {
  // Use the existing protect middleware
  return protect(req, res, (error) => {
    if (error) {
      return next(error);
    }
    next();
  });
};

export { authenticate };

// For backward compatibility
export default authenticate;
