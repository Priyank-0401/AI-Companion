require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
function initializeFirebase() {
  // Only initialize if no apps exist
  if (admin.apps.length === 0) {
    try {
      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL?.replace('@', '%40')}`
      };

      console.log('Initializing Firebase Admin with project:', serviceAccount.project_id);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });

      console.log('Firebase Admin initialized successfully');
      
      // Initialize Firestore with settings
      const db = admin.firestore();
      db.settings({ 
        ignoreUndefinedProperties: true,
        timestampsInSnapshots: true
      });
      
      // Initialize Auth
      const auth = admin.auth();
      
      return { admin, db, auth };
      
    } catch (error) {
      console.error('🔥 Error initializing Firebase Admin:', error);
      throw error; // Let the server fail if Firebase doesn't initialize
    }
  } else {
    // Return existing instances if already initialized
    return {
      admin,
      db: admin.firestore(),
      auth: admin.auth()
    };
  }
}

// Initialize Firebase and get the instances
const firebaseInstances = initializeFirebase();

// Export the initialization function and instances
module.exports = { 
  ...firebaseInstances, // Spread the instances directly
  initializeFirebase // Export the function for explicit initialization if needed
};
