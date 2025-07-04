import { getAuth } from '../config/firebase.js';
import User from '../models/user.model.js';
import { logger } from '../utils/logger.js';
import { success, error as errorResponse } from '../utils/apiResponse.js';
import AppError from '../utils/AppError.js';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

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

/**
 * Sign JWT token
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
const signToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Create and send JWT token
 * @param {Object} user - User object
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 */
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + config.jwt.cookieExpires * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  // Remove password from output
  user.password = undefined;

  res.cookie('jwt', token, cookieOptions);

  success(res, {
    token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: user.role,
    },
  }, 'Authentication successful', statusCode);
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;
    logger.info(`Registration attempt for email: ${email}`);

    // 1) Check if email already exists
    try {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        logger.warn(`Registration failed: Email ${email} already in use`);
        return errorResponse(res, 'Email already in use', 400);
      }
    } catch (emailCheckError) {
      logger.error(`Error checking for existing user: ${emailCheckError.message}`);
      return errorResponse(res, 'Error checking user registration', 500);
    }

    // 2) Create user in Firebase Auth
    let firebaseUser;
    try {
      const auth = getAuthInstance();
      logger.info(`Creating Firebase user for email: ${email}`);
      firebaseUser = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: false,
        disabled: false,
      });
      logger.info(`Firebase user created with UID: ${firebaseUser.uid}`);
    } catch (firebaseError) {
      logger.error(`Firebase user creation error:`, {
        message: firebaseError.message,
        code: firebaseError.code,
        stack: firebaseError.stack
      });
      return errorResponse(res, `Error creating user: ${firebaseError.message}`, 500);
    }

    // 3) Create user in Firestore
    try {
      const userData = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || displayName,
        emailVerified: firebaseUser.emailVerified || false,
        metadata: {
          creationTime: firebaseUser.metadata.creationTime,
          lastSignInTime: firebaseUser.metadata.lastSignInTime,
          lastRefreshTime: new Date().toISOString(),
        },
        role: 'user',
      };

      logger.info(`Creating Firestore user record for UID: ${firebaseUser.uid}`);
      const user = await User.create(userData);
      logger.info(`Firestore user record created with ID: ${user.id}`);

      // 4) Generate JWT token
      createSendToken(user, 201, res);
      logger.info(`Registration successful for email: ${email}`);
      
    } catch (dbError) {
      // Clean up Firebase auth user if Firestore creation fails
      logger.error(`Firestore user creation error, cleaning up Firebase user`, {
        error: dbError.message,
        firebaseUid: firebaseUser.uid
      });
      
      try {
        await auth.deleteUser(firebaseUser.uid);
        logger.info(`Cleaned up Firebase user after Firestore error: ${firebaseUser.uid}`);
      } catch (cleanupError) {
        logger.error(`Error cleaning up Firebase user: ${cleanupError.message}`);
      }
      
      return errorResponse(res, `Error creating user record: ${dbError.message}`, 500);
    }
  } catch (err) {
    logger.error(`Unexpected registration error:`, {
      message: err.message,
      stack: err.stack,
      requestBody: req.body
    });
    errorResponse(res, 'An unexpected error occurred during registration', 500);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    // 1) Check if ID token exists
    if (!idToken) {
      return errorResponse(res, 'Please provide an ID token', 400);
    }

    // 2) Verify ID token with Firebase
    let firebaseUser;
    try {
      const auth = getAuthInstance();
      const decodedToken = await auth.verifyIdToken(idToken);
      
      // Get the user's record
      firebaseUser = await auth.getUser(decodedToken.uid);
      
    } catch (error) {
      logger.error(`Login error: ${error.message}`);
      
      if (error.code === 'auth/id-token-expired' || 
          error.code === 'auth/id-token-revoked' ||
          error.code === 'auth/argument-error') {
        return errorResponse(res, 'Invalid or expired token', 401);
      }
      return errorResponse(res, 'Error during login', 500);
    }

    // 3) Get user from Firestore
    let user = await User.findByFirebaseUid(firebaseUser.uid);
    
    // If user doesn't exist in Firestore but exists in Firebase Auth (edge case)
    if (!user) {
      const userData = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || '',
        emailVerified: firebaseUser.emailVerified || false,
        metadata: {
          creationTime: firebaseUser.metadata.creationTime,
          lastSignInTime: firebaseUser.metadata.lastSignInTime,
          lastRefreshTime: new Date().toISOString(),
        },
        role: 'user',
      };
      user = await User.create(userData);
    }

    // 4) Update last login time
    await user.update({
      'metadata.lastSignInTime': firebaseUser.metadata.lastSignInTime,
      'metadata.lastRefreshTime': new Date().toISOString(),
    });

    // 5) If everything ok, send token to client
    createSendToken(user, 200, res);
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    errorResponse(res, 'Error during login', 500);
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   GET /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    // Clear the JWT cookie
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    // In a real app, you might want to invalidate the token on the server side
    // or perform additional cleanup
    if (req.user && req.user.firebaseUid) {
      try {
        const auth = getAuthInstance();
        await auth.revokeRefreshTokens(req.user.firebaseUid);
      } catch (firebaseError) {
        logger.warn(`Firebase token revocation failed: ${firebaseError.message}`);
        // Continue with logout even if token revocation fails
      }
    }
    
    success(res, null, 'Successfully logged out');
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    errorResponse(res, 'Error during logout', 500);
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    success(res, user, 'User retrieved successfully');
  } catch (err) {
    logger.error(`Get current user error: ${err.message}`);
    errorResponse(res, 'Error retrieving user', 500);
  }
};

/**
 * @desc    Update user details
 * @route   PATCH /api/auth/update-me
 * @access  Private
 */
const updateMe = async (req, res, next) => {
  try {
    // 1) Filtered out unwanted fields that are not allowed to be updated
    const filteredBody = {};
    const allowedFields = ['displayName', 'photoURL', 'phoneNumber'];
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredBody[key] = req.body[key];
      }
    });

    // 2) Update user in Firestore
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      }
    );

    // 3) Update user in Firebase Auth if needed
    if (filteredBody.displayName || filteredBody.photoURL) {
      await auth.updateUser(req.user.firebaseUid, {
        displayName: filteredBody.displayName,
        photoURL: filteredBody.photoURL,
      });
    }

    success(res, updatedUser, 'User updated successfully');
  } catch (err) {
    logger.error(`Update user error: ${err.message}`);
    errorResponse(res, 'Error updating user', 500);
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/auth/delete-me
 * @access  Private
 */
const deleteMe = async (req, res, next) => {
  try {
    // 1) Delete user from Firebase Auth
    await auth.deleteUser(req.user.firebaseUid);
    
    // 2) Delete user from Firestore
    await User.findByIdAndDelete(req.user.id);
    
    // 3) Clear cookie
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    
    success(res, null, 'Your account has been deleted');
  } catch (err) {
    logger.error(`Delete user error: ${err.message}`);
    errorResponse(res, 'Error deleting user account', 500);
  }
};

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    // 1) Get user based on POSTed email
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, 'Please provide an email address', 400);
    }

    // 2) Check if user exists in our database
    const user = await User.findByEmail(email);
    if (!user) {
      return errorResponse(res, 'There is no user with that email address', 404);
    }

    // 3) Generate the password reset token in Firebase
    const auth = getAuthInstance();
    const resetToken = await auth.generatePasswordResetLink(email, {
      url: `${config.clientUrl}/reset-password`,
      handleCodeInApp: true,
    });

    // 4) Send email with reset token (in a real app, you would send an email)
    logger.info(`Password reset token for ${email}: ${resetToken}`);
    
    // In a real app, you would send an email here with the reset link
    // await new Email(user, resetToken).sendPasswordReset();

    success(res, { message: 'Password reset link sent to email' });
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    errorResponse(res, 'There was an error sending the password reset email', 500);
  }
};

/**
 * @desc    Reset password
 * @route   PATCH /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
try {
  const { token } = req.params;
  const { password, passwordConfirm } = req.body;

  // 1) Validate passwords match
  if (password !== passwordConfirm) {
    return errorResponse(res, 'Passwords do not match', 400);
  }

  // 2) Verify the reset token with Firebase
  let email;
  try {
    const auth = getAuthInstance();
    // This is a simplified example - in a real app, you'd verify the token
    // and get the email from the token
    email = await auth.verifyPasswordResetCode(token);
    
    // 3) Update password in Firebase
    await auth.confirmPasswordReset(token, password);
  } catch (error) {
    logger.error(`Password reset verification error: ${error.message}`);
    return errorResponse(res, 'Invalid or expired password reset token', 400);
  }

  // 4) Find user by email
  const user = await User.findByEmail(email);
  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  // 5) Update password in our database
  await user.updatePassword(password);

  // 6) Log the user in, send JWT
  createSendToken(user, 200, res);
} catch (error) {
  logger.error(`Reset password error: ${error.message}`);
  errorResponse(res, 'Error resetting password', 500);
}
};


export {
  register,
  login,
  logout,
  getMe,
  updateMe,
  deleteMe,
  forgotPassword,
  resetPassword
};
