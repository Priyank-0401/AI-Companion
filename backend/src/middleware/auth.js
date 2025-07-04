import jwt from 'jsonwebtoken';
import { getAuth } from '../config/firebase.js';
import AppError from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import config from '../config/index.js';
import User from '../models/user.model.js';

// This will be initialized when first used
let authInstance = null;

const getAuthInstance = () => {
  if (!authInstance) {
    authInstance = getAuth();
    if (!authInstance) {
      throw new Error('Firebase Auth is not initialized');
    }
  }
  return authInstance;
};

// Helper function to verify JWT token
const verifyJwtToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.jwt.secret, (err, decoded) => {
      if (err) {
        reject(new AppError('Invalid token. Please log in again!', 401));
      } else {
        resolve(decoded);
      }
    });
  });
};

// Protect routes - require authentication
const protect = async (req, res, next) => {
  try {
    // 1) Get token from header or cookie
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
      );
    }

    // 2) Verify token
    const decoded = await verifyJwtToken(token);
    
    // 3) Get Firebase Auth instance and verify the token
    try {
      const auth = getAuthInstance();
      await auth.verifyIdToken(token);
    } catch (firebaseError) {
      logger.error(`Firebase token verification failed: ${firebaseError.message}`);
      return next(new AppError('Invalid or expired token. Please log in again!', 401));
    }

    // 3) Check if user still exists (if using database)
    // This is optional if you're using Firebase Auth only
    // If you have a users collection, you can add a check here

    // GRANT ACCESS TO PROTECTED ROUTE
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    return next();
  }
};

// Restrict to certain roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array of allowed roles ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

// Only for rendered pages, no errors!
const isLoggedIn = async (req, res, next) => {
  try {
    // 1) Get token from cookies
    if (req.cookies.jwt) {
      // 2) Verify JWT token
      const decoded = await verifyJwtToken(req.cookies.jwt);

      // 3) Verify Firebase token
      try {
        const auth = getAuthInstance();
        await auth.verifyIdToken(req.cookies.jwt);
      } catch (firebaseError) {
        logger.warn(`Firebase token verification in isLoggedIn failed: ${firebaseError.message}`);
        return next();
      }

      // 4) Check if user still exists in our database
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 5) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    // If there's an error, just continue to the next middleware
    logger.warn(`isLoggedIn middleware error: ${err.message}`);
    return next();
  }
  next();
};

export { protect, restrictTo, isLoggedIn };
