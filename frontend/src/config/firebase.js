import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from '@firebase/app-check';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Using environment variables for secure configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate that required Firebase environment variables are loaded
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration missing! Please check your .env file:');
  console.error('Required: VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, etc.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Initialize App Check in production or when explicitly enabled in development
if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_APP_CHECK === 'true') {
  // Self-check for App Check token
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN || true;
  
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY || 'your-recaptcha-v3-site-key'),
    isTokenAutoRefreshEnabled: true,
  });
  
  // Add App Check token to all fetch requests
  const originalFetch = window.fetch;
  window.fetch = async (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    
    try {
      const appCheckToken = await appCheck.getToken();
      if (appCheckToken?.token) {
        headers.append('X-Firebase-AppCheck', appCheckToken.token);
      }
    } catch (error) {
      console.warn('Failed to get App Check token:', error);
    }
    
    return originalFetch(url, {
      ...options,
      headers
    });
  };
}

export { app, auth, db, googleProvider };
