// d:\Projects\AI-Companion\ai-companion-new\frontend\src\config\firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOml90ossDRdWFIMqtoKXJDs-I4V1Pajw",
  authDomain: "ai-companion-agent.firebaseapp.com",
  projectId: "ai-companion-agent",
  storageBucket: "ai-companion-agent.firebasestorage.app",
  messagingSenderId: "779763358854",
  appId: "1:779763358854:web:9257c831e7bc5764634507",
  measurementId: "G-347BS4ENE6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
