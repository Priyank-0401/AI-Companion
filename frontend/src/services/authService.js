import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';

// Sign up with email and password
export const signUpWithEmail = async (email, password, fullName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update the user's display name
    await updateProfile(user, {
      displayName: fullName
    });

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: fullName,
      createdAt: new Date().toISOString(),
      preferences: {
        theme: 'default',
        notifications: true,
        privacy: 'private'
      }
    });

    return { success: true, user };
  } catch (error) {
    console.error('Error signing up:', error);
    return { success: false, error: error.message };
  }
};

// Sign in with email and password
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Error signing in:', error);
    return { success: false, error: error.message };
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    // First check network connectivity
    if (!navigator.onLine) {
      return { 
        success: false, 
        error: 'No internet connection. Please check your network and try again.' 
      };
    }

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    try {
      // Check if user document exists, create if not
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          provider: 'google',
          preferences: {
            theme: 'default',
            notifications: true,
            privacy: 'private'
          }
        });
      }
    } catch (firestoreError) {
      // If Firestore operations fail but auth succeeded, we still consider the login successful
      console.warn('User authenticated, but Firestore operations failed:', firestoreError);
      
      // The user is still authenticated, we'll just notify about the profile update issue
      if (firestoreError.message.includes('offline') || !navigator.onLine) {
        console.log('Device appears to be offline. Login successful, but profile updates will sync later.');
      }
    }

    return { success: true, user };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    
    // Provide more helpful error messages for common issues
    let errorMessage = error.message;
    
    if (!navigator.onLine || error.message.includes('network') || error.message.includes('offline')) {
      errorMessage = 'Network connection issue. Please check your internet connection and try again.';
    } else if (error.code === 'auth/configuration-not-found') {
      errorMessage = 'Google Sign-In is not configured. Please contact support.';
    } else if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in was cancelled.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error: error.message };
  }
};

// Reset password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};
