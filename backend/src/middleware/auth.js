import jwt from 'jsonwebtoken';
import { getAuth, getDb } from '../config/firebase.js';
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

// Helper function to verify Firebase ID token
const verifyFirebaseToken = async (token) => {
  try {
    const auth = getAuthInstance();
    return await auth.verifyIdToken(token);
  } catch (error) {
    logger.error(`Firebase token verification failed: ${error.message}`);
    throw new AppError('Invalid or expired token. Please log in again!', 401);
  }
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

    // 2) Verify Firebase ID token
    const firebaseUser = await verifyFirebaseToken(token);
    
    if (!firebaseUser || !firebaseUser.uid) {
      return next(new AppError('Invalid user data in token', 401));
    }

    // 4) Get Firestore instance
    const db = getDb();
    const usersRef = db.collection('users');
    
    // 5) Check if user exists in Firestore
    const userDoc = await usersRef.doc(firebaseUser.uid).get();
    
    let userData;
    if (!userDoc.exists) {
      // Create new user document if it doesn't exist
      userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.name || firebaseUser.email?.split('@')[0] || 'User',
        photoURL: firebaseUser.picture || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await usersRef.doc(firebaseUser.uid).set(userData);
    } else {
      userData = userDoc.data();
    }

    // 6) Attach user to request object
    req.user = { ...userData, uid: firebaseUser.uid };
    
    // 6) GRANT ACCESS TO PROTECTED ROUTE
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    return next(new AppError('Authentication failed. Please log in again.', 401));
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
      // 2) Verify Firebase token
      try {
        const firebaseUser = await verifyFirebaseToken(req.cookies.jwt);
        
        // 3) Get Firestore instance
        const db = getDb();
        const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
        
        if (!userDoc.exists) {
          return next();
        }

        // 4) Attach user to request
        req.user = { ...userDoc.data(), uid: firebaseUser.uid };
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
