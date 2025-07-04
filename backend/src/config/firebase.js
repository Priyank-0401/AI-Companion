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
  // If already initialized, return the existing instances
  if (isInitialized) {
    return { firebaseApp, db, auth };
  }

  // If initialization is in progress, return the promise
  if (initializationPromise) {
    return initializationPromise;
  }

  // Create a new promise for initialization
  initializationPromise = (async () => {
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
      
      // Reset initialization state
      isInitialized = false;
      initializationPromise = null;
      
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
  })();

  return initializationPromise;
};

// Initialize Firebase services
let isInitialized = false;
let initializationPromise = null;

// Getter functions
const getDb = () => {
  if (!isInitialized) {
    throw new Error('Firebase has not been initialized. Call initializeFirebase() first.');
  }
  if (!db) {
    throw new Error('Firestore instance is not available');
  }
  return db;
};

const getAuth = () => {
  if (!isInitialized) {
    throw new Error('Firebase has not been initialized. Call initializeFirebase() first.');
  }
  return auth;
};

const getFirebaseApp = () => {
  if (!isInitialized) {
    throw new Error('Firebase has not been initialized. Call initializeFirebase() first.');
  }
  return firebaseApp;
};

// Single export object
const firebase = {
  // Direct access to instances (read-only)
  get admin() { return admin; },
  get db() { return db; },
  get auth() { return auth; },
  get firebaseApp() { return firebaseApp; },
  
  // Methods
  getDb,
  getAuth,
  getFirebaseApp,
  initializeFirebase
};

// Export as both default and named exports
export default {
  ...firebase,
  initializeFirebase,
  // Add direct access to instances for backward compatibility
  get admin() { return admin; },
  get db() { return db; },
  get auth() { return auth; },
  get firebaseApp() { return firebaseApp; }
};

export {
  // Core Firebase services
  admin,
  db,
  auth,
  firebaseApp,
  
  // Utility functions
  getDb,
  getAuth,
  getFirebaseApp,
  
  // Initialization
  initializeFirebase
};
