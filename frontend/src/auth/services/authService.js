import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  updateEmail as updateFirebaseEmail,
  updatePassword as updateFirebasePassword,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { apiClient } from '../../services/api';

const provider = new GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');

// Token storage keys
const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';

// Store auth data in local storage
const storeAuthData = (token, user) => {
  console.log('Storing auth data in local storage...');
  console.log('Token to store:', token ? 'Token exists' : 'No token');
  console.log('User to store:', user ? 'User exists' : 'No user');
  
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      console.log('Token stored in localStorage');
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      console.log('User data stored in localStorage');
    }
    
    // Verify storage
    console.log('Verifying storage...');
    console.log('Stored token:', localStorage.getItem(TOKEN_KEY) ? 'Exists' : 'Missing');
    console.log('Stored user:', localStorage.getItem(USER_KEY) ? 'Exists' : 'Missing');
  } else {
    console.log('Window is undefined, cannot access localStorage');
  }
};

// Clear auth data from local storage
export const clearAuthData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

// Get stored auth token
export const getStoredToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userData = await getAuthUser(userCredential.user);
    const token = await getAuthToken();
    storeAuthData(token, userData);
    return userData;
  } catch (error) {
    console.error('Sign in error:', error);
    clearAuthData();
    throw error;
  }
};

export const signUp = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    // Send email verification
    await sendEmailVerification(userCredential.user, {
      url: `${window.location.origin}/verify-email`,
    });
    
    const userData = await createUserProfile(userCredential.user, { displayName });
    const token = await getAuthToken();
    storeAuthData(token, userData);
    return userData;
  } catch (error) {
    console.error('Sign up error:', error);
    clearAuthData();
    throw error;
  }
};

export const signInWithGoogle = async () => {
  console.log('Starting Google sign in...');
  try {
    console.log('Opening Google sign in popup...');
    const result = await signInWithPopup(auth, provider);
    console.log('Google sign in successful, user:', result.user);
    
    // Get the Firebase ID token
    console.log('Getting Firebase ID token...');
    const idToken = await result.user.getIdToken();
    console.log('Firebase ID token retrieved');
    
    // Call backend login endpoint to trigger user creation and encryption setup
    console.log('Calling backend login endpoint...');
    try {
      const backendResponse = await apiClient.post('/api/auth/login', { idToken });
      console.log('Backend login successful:', backendResponse);
      
      // Use the user data from backend response
      const userData = backendResponse.user;
      const token = backendResponse.token;
      
      console.log('Storing auth data from backend response...');
      storeAuthData(token, userData);
      
      // Verify storage after setting
      console.log('Verifying storage after sign in:');
      console.log('localStorage token:', localStorage.getItem(TOKEN_KEY) ? 'Exists' : 'Missing');
      console.log('localStorage user:', localStorage.getItem(USER_KEY) ? 'Exists' : 'Missing');
      
      return userData;
    } catch (backendError) {
      console.error('Backend login error:', backendError);
      // Fallback to previous approach if backend login fails
      console.log('Falling back to Firebase-only authentication...');
      
      console.log('Ensuring user profile...');
      const userData = await ensureUserProfile(result.user);
      console.log('User profile ensured:', userData);
      
      console.log('Getting auth token...');
      const token = await getAuthToken();
      console.log('Auth token retrieved:', token ? 'Token exists' : 'No token');
      
      console.log('Storing auth data...');
      storeAuthData(token, userData);
      
      // Verify storage after setting
      console.log('Verifying storage after sign in:');
      console.log('localStorage token:', localStorage.getItem(TOKEN_KEY) ? 'Exists' : 'Missing');
      console.log('localStorage user:', localStorage.getItem(USER_KEY) ? 'Exists' : 'Missing');
      
      return userData;
    }
  } catch (error) {
    console.error('Google sign in error:', error);
    clearAuthData();
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    clearAuthData();
  } catch (error) {
    console.error('Sign out error:', error);
    clearAuthData();
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/login`,
    });
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

export const updateEmail = async (newEmail) => {
  if (!auth.currentUser) throw new Error('No authenticated user');
  
  try {
    await updateFirebaseEmail(auth.currentUser, newEmail);
    await updateUserProfile({ email: newEmail, emailVerified: false });
  } catch (error) {
    console.error('Update email error:', error);
    throw error;
  }
};

export const updateUserPassword = async (newPassword) => {
  if (!auth.currentUser) throw new Error('No authenticated user');
  
  try {
    await updateFirebasePassword(auth.currentUser, newPassword);
  } catch (error) {
    console.error('Update password error:', error);
    throw error;
  }
};

// Helper functions
const getUserDoc = (userId) => {
  return doc(db, 'users', userId);
};

/**
 * Get the current user's authentication token
 * @param {boolean} [forceRefresh=false] - Whether to force token refresh
 * @returns {Promise<string>} The Firebase ID token
 */
export const getAuthToken = async (forceRefresh = false) => {
  console.log('getAuthToken called, forceRefresh:', forceRefresh);
  
  try {
    console.log('Checking for current user...');
    if (!auth.currentUser) {
      console.log('No current user, checking stored token...');
      const storedToken = getStoredToken();
      console.log('Stored token found:', storedToken ? 'Yes' : 'No');
      if (storedToken) {
        console.log('Returning stored token');
        return storedToken;
      }
      throw new Error('No user is currently signed in');
    }
    
    console.log('Getting ID token from Firebase...');
    const token = await auth.currentUser.getIdToken(forceRefresh);
    console.log('Token retrieved from Firebase');
    
    // Update stored token if it's a new one
    if (typeof window !== 'undefined') {
      console.log('Storing token in localStorage...');
      localStorage.setItem(TOKEN_KEY, token);
      console.log('Token stored in localStorage');
      
      // Verify storage
      const storedToken = localStorage.getItem(TOKEN_KEY);
      console.log('Token verification:', storedToken ? 'Stored successfully' : 'Failed to store');
    }
    
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    clearAuthData();
    throw error;
  }
};

export const getAuthUser = async (user) => {
  if (!user) {
    // Try to get user from local storage if no user provided
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedUser) return JSON.parse(storedUser);
    }
    return null;
  }
  
  try {
    const userDoc = await getDoc(getUserDoc(user.uid));
    const userData = userDoc.exists() 
      ? { 
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          ...userDoc.data() 
        }
      : await createUserProfile(user);
    
    // Store the updated user data
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }
    
    return userData;
  } catch (error) {
    console.error('Get user error:', error);
    clearAuthData();
    throw error;
  }
};

const ensureUserProfile = async (user) => {
  const userDoc = await getDoc(getUserDoc(user.uid));
  return userDoc.exists() 
    ? await updateUserProfile({ lastLoginAt: serverTimestamp() })
    : createUserProfile(user);
};

const createUserProfile = async (user, additionalData = {}) => {
  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: additionalData.displayName || user.displayName || user.email?.split('@')[0] || 'User',
    photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'U')}`,
    emailVerified: user.emailVerified || false,
    providerData: user.providerData?.[0]?.providerId || 'email',
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    preferences: {
      theme: 'light',
      notifications: true,
      ...additionalData.preferences
    },
    ...additionalData
  };

  await setDoc(getUserDoc(user.uid), userData, { merge: true });
  return { ...user, ...userData };
};

export const updateUserProfile = async (updates) => {
  if (!auth.currentUser) throw new Error('No authenticated user');
  
  try {
    const userRef = getUserDoc(auth.currentUser.uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    // Update local auth state if displayName or photoURL changed
    if (updates.displayName || updates.photoURL) {
      await updateProfile(auth.currentUser, {
        displayName: updates.displayName,
        photoURL: updates.photoURL
      });
    }
    
    return await getAuthUser(auth.currentUser);
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};
