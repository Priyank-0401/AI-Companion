import { useState, useEffect, useCallback, useContext } from 'react';
import { onAuthStateChanged, signOut, getIdToken } from 'firebase/auth';
import { auth } from '../config/firebase';
import { AuthContext } from './AuthContext';

// Helper to get user profile data
const getUserProfile = async (user) => {
  if (!user) return null;
  
  const token = await user.getIdTokenResult();
  
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'U')}&background=6366f1&color=fff`,
    emailVerified: user.emailVerified,
    isAnonymous: user.isAnonymous,
    lastLoginAt: user.metadata?.lastSignInTime,
    createdAt: user.metadata?.creationTime,
    providerData: user.providerData?.[0]?.providerId || 'password',
    claims: token.claims || {}
  };
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthContextProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    loading: true,
    error: null,
    isRedirecting: false
  });

  // Update token in local storage
  const updateToken = useCallback(async (user) => {
    if (!user) {
      localStorage.removeItem('authToken');
      return null;
    }
    
    try {
      const token = await user.getIdToken();
      localStorage.setItem('authToken', token);
      return token;
    } catch (error) {
      console.error('Error updating token:', error);
      localStorage.removeItem('authToken');
      return null;
    }
  }, []);

  // Handle auth state changes
  const handleAuthStateChanged = useCallback(async (user) => {
    try {
      console.log('Auth state changed:', user ? 'User signed in' : 'No user');
      
      if (user) {
        const [userProfile, token] = await Promise.all([
          getUserProfile(user),
          updateToken(user)
        ]);        
        setState(prev => ({
          ...prev,
          user: userProfile,
          loading: false,
          error: null
        }));
        
        // If coming from auth pages, set redirecting state
        if (['/login', '/signup', '/auth'].some(path => 
          window.location.pathname.startsWith(path)
        )) {
          setState(prev => ({ ...prev, isRedirecting: true }));
          setTimeout(() => {
            setState(prev => ({ ...prev, isRedirecting: false }));
          }, 1000);
        }
      } else {
        // No user signed in
        await updateToken(null);
        setState({
          user: null,
          loading: false,
          error: null,
          isRedirecting: false
        });
      }
    } catch (error) {
      console.error('Error in auth state change:', error);
      setState(prev => ({
        ...prev,
        error,
        loading: false,
        isRedirecting: false
      }));
    }
  }, [updateToken]);

  // Initialize auth state from localStorage if available
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token && !auth.currentUser) {
        try {
          // Try to get the current user from Firebase
          await auth.authStateReady();
          
          if (auth.currentUser) {
            // If we have a valid user, update the token and state
            await updateToken(auth.currentUser);
          } else {
            // If no valid user but we have a token, clear it
            localStorage.removeItem('authToken');
            setState(prev => ({
              ...prev,
              loading: false,
              user: null,
              isRedirecting: false
            }));
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          localStorage.removeItem('authToken');
          setState(prev => ({
            ...prev,
            loading: false,
            user: null,
            error: error.message
          }));
        }
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    initializeAuth();
  }, []);

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChanged);
    
    // Set up token refresh every 50 minutes (Firebase tokens expire after 1 hour)
    const refreshInterval = setInterval(async () => {
      if (auth.currentUser) {
        try {
          await updateToken(auth.currentUser);
        } catch (error) {
          console.error('Error refreshing token:', error);
        }
      }
    }, 50 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
      console.log('Auth listener and refresh interval cleared');
    };
  }, [handleAuthStateChanged, updateToken]);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      console.log('Logging out...');
      await signOut(auth);
      // No need to update state here as auth state listener will handle it
      console.log('Logged out successfully');
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      setState(prev => ({ ...prev, error }));
      throw error;
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) return null;
    
    try {
      const [userProfile, token] = await Promise.all([
        getUserProfile(auth.currentUser),
        updateToken(auth.currentUser)
      ]);
      
      setState(prev => ({
        ...prev,
        user: userProfile,
        error: null
      }));
      
      return userProfile;
    } catch (error) {
      console.error('Error refreshing user:', error);
      setState(prev => ({ ...prev, error }));
      throw error;
    }
  }, [updateToken]);

  // Update token function exposed via context
  const updateTokenInContext = useCallback((user) => updateToken(user), [updateToken]);

  // Context value
  const value = {
    user: state.user,
    currentUser: state.user, // For backward compatibility
    loading: state.loading,
    error: state.error,
    isRedirecting: state.isRedirecting,
    isAuthenticated: !!state.user,
    logout,
    refreshUser,
    updateToken: updateTokenInContext
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
