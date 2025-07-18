import { useEffect, useState, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { signIn, signUp as authSignUp, signInWithGoogle as googleSignIn, getAuthUser, signOut as authSignOut } from '../services/authService';
import { AuthContext } from './auth-context';

// Create a separate provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  const handleAuthStateChanged = useCallback(async (firebaseUser) => {
    try {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
        };
        // console.log('[AuthProvider] Setting user data:', userData);
        setUser(userData); // This should trigger a re-render with the new user
      } else {
        // console.log('[AuthProvider] No user, setting user to null');
        setUser(null);
      }
      setInitialized(true);
    } catch (err) {
      console.error('[AuthProvider] Error in auth state change:', err);
      setError(err);
      setInitialized(true);
    } finally {
      // console.log('[AuthProvider] Auth state update complete, loading:', false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChanged);
    return () => unsubscribe();
  }, [handleAuthStateChanged]);

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
        const { uid, email, displayName, photoURL, emailVerified } = auth.currentUser;
        setUser({
          uid,
          email,
          displayName,
          photoURL,
          emailVerified,
        });
      } catch (error) {
        console.error('Error refreshing user:', error);
        throw error;
      }
    }
    return Promise.resolve();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      const user = await googleSignIn();
      const userData = await getAuthUser(user);
      return userData;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithEmail = useCallback(async (email, password) => {
    try {
      setLoading(true);
      const user = await signIn(email, password);
      return user;
    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email, password, displayName) => {
    try {
      setLoading(true);
      const user = await authSignUp(email, password, displayName);
      return user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await authSignOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user, // Changed from currentUser to user to match what useAuth expects
    loading,
    initialized,
    error,
    signIn: signInWithEmail, // Alias for compatibility
    signInWithEmail,
    signInWithGoogle,
    signUp,
    signOut,
    refreshUser,
  }), [user, loading, initialized, error, signInWithEmail, signInWithGoogle, signUp, signOut, refreshUser]);

  // Debug log the context value
  useEffect(() => {
    // console.log('[AuthProvider] Context value updated:', {
    //   user: user ? { uid: user.uid, email: user.email } : null,
    //   loading,
    //   initialized,
    //   hasError: !!error
    // });
  }, [user, loading, initialized, error]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the AuthContext as default
export default AuthContext;
