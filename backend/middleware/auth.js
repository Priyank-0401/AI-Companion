import admin from '../config/firebase-admin.js';

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Type, Authorization, X-Authenticated-User',
  'Access-Control-Max-Age': 86400 // 24 hours
};

// Setup CORS function
function setupCors(res) {
  if (res.headersSent) return;
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

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
async function verifyToken(req, res, next) {
  // Apply CORS headers
  setupCors(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // Skip token verification for public routes
  if (PUBLIC_ROUTES.some(route => req.path.startsWith(route))) {
    return next();
  }

  try {
    // Get token from Authorization header or cookie
    let token;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      console.warn('No token provided for protected route:', req.path);
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required',
        code: 'MISSING_AUTH_TOKEN'
      });
    }

    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(token, true); // Check for token revocation
    
    // Add the decoded token to the request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      ...decodedToken
    };
    
    // Set user info in response headers for debugging
    res.set('X-Authenticated-User', decodedToken.uid || 'anonymous');
    
    // Continue to the next middleware/route handler
    return next();
    
  } catch (error) {
    console.error('Token verification failed:', error.code, error.message);
    
    // Handle different types of errors
    const errorResponse = {
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_FAILED',
      details: error.code || 'UNKNOWN_ERROR'
    };
    
    if (error.code === 'auth/id-token-expired') {
      errorResponse.error = 'Session expired';
      errorResponse.code = 'TOKEN_EXPIRED';
    } else if (error.code === 'auth/id-token-revoked') {
      errorResponse.error = 'Session revoked';
      errorResponse.code = 'TOKEN_REVOKED';
    }
    
    // Clear any invalid tokens
    res.clearCookie('token');
    
    return res.status(401).json(errorResponse);
  }
};

/**
 * Middleware to require authentication for specific routes
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  next();
};

/**
 * Middleware to require specific roles
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    next();
  };
};

// Export the auth middleware functions and roles
export { verifyToken, requireAuth, requireRole };

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  PREMIUM: 'premium'
};

export { setupCors };
