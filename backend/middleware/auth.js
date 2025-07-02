const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

/**
 * Middleware to verify Firebase ID token
 */
async function verifyToken(req, res, next) {
  // Skip token verification for OPTIONS requests and health check
  if (req.method === 'OPTIONS' || req.url === '/api/health') {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('No token provided');
    return res.writeHead(401, { 'Content-Type': 'application/json' }).end(
      JSON.stringify({ error: 'Unauthorized - No token provided' })
    );
  }

  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.writeHead(401, { 'Content-Type': 'application/json' }).end(
      JSON.stringify({ error: 'Unauthorized - Invalid token' })
    );
  }
}

module.exports = { verifyToken };
