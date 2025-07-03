import express from 'express';
import admin from '../config/firebase-admin.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../middleware/logger.js';
import { verifyToken, authorize, roles } from '../middleware/authMiddleware.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password, displayName } = req.body;

    // Validate input
    if (!email || !password) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Please provide email and password',
        true
      );
    }

    try {
      // Create user in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
        emailVerified: false,
        disabled: false,
      });

      // Create user document in Firestore
      await admin.firestore().collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        displayName: displayName || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        role: 'user',
        preferences: {},
      });

      // Generate JWT token
      const token = await admin.auth().createCustomToken(userRecord.uid);

      // Set secure httpOnly cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Send response
      res.status(httpStatus.CREATED).json({
        success: true,
        data: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName || '',
          emailVerified: userRecord.emailVerified,
          token,
        },
      });
    } catch (error) {
      logger.error('Registration error:', error);
      
      if (error.code === 'auth/email-already-exists') {
        throw new ApiError(
          httpStatus.CONFLICT,
          'Email already in use',
          true
        );
      }
      
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Error creating user',
        false
      );
    }
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Please provide email and password',
        true
      );
    }

    try {
      // Sign in with email and password
      const userRecord = await admin.auth().getUserByEmail(email);
      
      // In a real app, you would verify the password here
      // This is a simplified example
      const token = await admin.auth().createCustomToken(userRecord.uid);

      // Set secure httpOnly cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Get user data from Firestore
      const userDoc = await admin
        .firestore()
        .collection('users')
        .doc(userRecord.uid)
        .get();

      if (!userDoc.exists) {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          'User data not found',
          true
        );
      }

      // Send response
      res.status(httpStatus.OK).json({
        success: true,
        data: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userDoc.data().displayName || '',
          role: userDoc.data().role || 'user',
          token,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      
      if (error.code === 'auth/user-not-found') {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          'Invalid credentials',
          true
        );
      }
      
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Error authenticating user',
        false
      );
    }
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user / clear cookie
 * @access  Private
 */
router.post(
  '/logout',
  verifyToken,
  asyncHandler(async (req, res) => {
    // Clear the token cookie
    res.clearCookie('token');
    
    res.status(httpStatus.OK).json({
      success: true,
      message: 'Logged out successfully',
    });
  })
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh-token',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Refresh token is required',
        true
      );
    }

    try {
      // Verify the refresh token
      const decodedToken = await admin.auth().verifyIdToken(refreshToken, true);
      
      // Generate a new access token
      const token = await admin.auth().createCustomToken(decodedToken.uid);

      // Set secure httpOnly cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(httpStatus.OK).json({
        success: true,
        data: { token },
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      
      if (error.code === 'auth/id-token-expired' || 
          error.code === 'auth/argument-error') {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          'Invalid or expired refresh token',
          true
        );
      }
      
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Error refreshing token',
        false
      );
    }
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  verifyToken,
  asyncHandler(async (req, res) => {
    try {
      const userRecord = await admin.auth().getUser(req.user.uid);
      const userDoc = await admin
        .firestore()
        .collection('users')
        .doc(req.user.uid)
        .get();

      if (!userDoc.exists) {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          'User data not found',
          true
        );
      }

      res.status(httpStatus.OK).json({
        success: true,
        data: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userDoc.data().displayName || '',
          role: userDoc.data().role || 'user',
          emailVerified: userRecord.emailVerified,
          createdAt: userDoc.data().createdAt?.toDate() || null,
          updatedAt: userDoc.data().updatedAt?.toDate() || null,
        },
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      
      if (error.code === 'auth/user-not-found') {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          'User not found',
          true
        );
      }
      
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Error fetching user profile',
        false
      );
    }
  })
);

// Export the router as default
export default router;
