import admin from 'firebase-admin';
import config from './index.js';

// Initialize Firebase Admin
const firebaseConfig = {
  credential: admin.credential.cert({
    projectId: config.firebase.projectId,
    clientEmail: config.firebase.clientEmail,
    privateKey: config.firebase.privateKey,
    privateKeyId: config.firebase.privateKeyId,
    clientId: config.firebase.clientId,
    authUri: config.firebase.authUri,
    tokenUri: config.firebase.tokenUri,
    authProviderX509CertUrl: config.firebase.authProviderX509CertUrl,
    clientC509CertUrl: config.firebase.clientC509CertUrl,
    universeDomain: config.firebase.universeDomain
  }),
  databaseURL: config.firebase.databaseURL
};

let firebaseApp = null;
let db = null;
let auth = null;

// Log Firebase configuration (without sensitive data)
console.log('Initializing Firebase with configuration:', {
  projectId: config.firebase.projectId,
  clientEmail: config.firebase.clientEmail,
  privateKey: config.firebase.privateKey ? '***' : 'Not set',
  databaseURL: config.firebase.databaseURL,
  privateKeyId: config.firebase.privateKeyId ? '***' : 'Not set',
  clientId: config.firebase.clientId ? '***' : 'Not set'
});

// Initialize Firebase
const initializeFirebase = async () => {
  try {
    // Check if Firebase app is already initialized
    if (admin.apps.length === 0) {
      firebaseApp = admin.initializeApp(firebaseConfig);
      console.log('Firebase Admin SDK initialized successfully');
    } else {
      firebaseApp = admin.app();
      console.log('Using existing Firebase app instance');
    }
    
    // Initialize Firestore
    db = admin.firestore();
    try {
      await db.listCollections(); // Test the connection
      console.log('Firestore initialized successfully');
    } catch (dbError) {
      console.error('Firestore initialization error:', dbError);
      throw new Error(`Firestore initialization failed: ${dbError.message}`);
    }
    
    // Initialize Auth
    auth = admin.auth();
    console.log('Firebase Auth initialized successfully');
    
    // Mark as initialized
    isInitialized = true;
    
    return { firebaseApp, db, auth };
  } catch (error) {
    console.error('Firebase initialization error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      errorInfo: error.errorInfo || 'No additional error info'
    });
    
    // If there's an error, try to delete the app if it was created
    if (firebaseApp) {
      try {
        await firebaseApp.delete();
        console.log('Cleaned up Firebase app after error');
      } catch (cleanupError) {
        console.error('Error cleaning up Firebase app:', cleanupError);
      }
    }
    
    throw new Error(`Failed to initialize Firebase: ${error.message}`);
  }
};

// Initialize Firebase services
let isInitialized = false;

// Export initialization function and getters for services
const getDb = () => {
  if (!isInitialized) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return db;
};

const getAuth = () => {
  if (!isInitialized) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return auth;
};

const getFirebaseApp = () => {
  if (!isInitialized) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return firebaseApp;
};

// Named exports
export { 
  admin, 
  getDb, 
  getAuth, 
  getFirebaseApp, 
  initializeFirebase 
};

// Default export for backward compatibility
export default {
  get admin() { return admin; },
  get db() { return getDb(); },
  get auth() { return getAuth(); },
  get firebaseApp() { return getFirebaseApp(); },
  initializeFirebase
};
