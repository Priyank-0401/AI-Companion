import admin from '../config/firebase-admin.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';

// List of public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/health',
  '/api/auth/refresh-token',
  '/api/auth/login',
  '/api/auth/signup'
];

/**
 * Middleware to verify Firebase ID token
 */
const verifyToken = async (req, res, next) => {
  // Skip token verification for public routes
  if (PUBLIC_ROUTES.some(route => req.path.startsWith(route))) {
    return next();
  }

  try {
    // Get token from header or cookie
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      // Get token from cookie
      token = req.cookies.token;
    }

    if (!token) {
      return next(
        new ApiError(
          httpStatus.UNAUTHORIZED,
          'Please authenticate to access this resource',
          true
        )
      );
    }

    // Verify token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Add user to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'user',
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return next(
      new ApiError(
        httpStatus.UNAUTHORIZED,
        'Invalid or expired token',
        true
      )
    );
  }
};

/**
 * Middleware to check if user has specific role(s)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new ApiError(
          httpStatus.UNAUTHORIZED,
          'Authentication required',
          true
        )
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          httpStatus.FORBIDDEN,
          `User role ${req.user.role} is not authorized to access this route`,
          true
        )
      );
    }

    next();
  };
};

// Export the middleware functions and roles
export { verifyToken, authorize };

export const roles = {
  USER: 'user',
  ADMIN: 'admin',
  PREMIUM: 'premium',
};
