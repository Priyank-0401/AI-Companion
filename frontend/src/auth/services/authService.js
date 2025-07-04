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

const provider = new GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');

export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return await getAuthUser(userCredential.user);
  } catch (error) {
    console.error('Sign in error:', error);
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
    
    return await createUserProfile(userCredential.user, { displayName });
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return await ensureUserProfile(result.user);
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
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
  try {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }
    return await auth.currentUser.getIdToken(forceRefresh);
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw error;
  }
};

export const getAuthUser = async (user) => {
  if (!user) return null;
  
  try {
    const userDoc = await getDoc(getUserDoc(user.uid));
    return userDoc.exists() 
      ? { ...user, ...userDoc.data() }
      : await createUserProfile(user);
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};

const ensureUserProfile = async (user) => {
  const userDoc = await getDoc(getUserDoc(user.uid));
  return userDoc.exists() 
    ? updateUserProfile({ lastLoginAt: serverTimestamp() })
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
