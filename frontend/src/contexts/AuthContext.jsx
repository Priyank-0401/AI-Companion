import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut, getIdToken } from 'firebase/auth';
import { auth } from '../config/firebase';

// Export the context so it can be used by the hook
export const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Context Provider Component - named function for Fast Refresh compatibility
export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const updateToken = useCallback(async (user) => {
    if (user) {
      try {
        // Get the ID token and store it in localStorage
        const token = await user.getIdToken();
        localStorage.setItem('authToken', token);
      } catch (error) {
        console.error('Error getting auth token:', error);
        localStorage.removeItem('authToken');
      }
    } else {
      // Clear the token when user logs out
      localStorage.removeItem('authToken');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      await updateToken(user);
      setLoading(false);
    });

    // Set up token refresh every 50 minutes (Firebase tokens expire after 1 hour)
    const refreshInterval = setInterval(async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken(true); // Force refresh
          localStorage.setItem('authToken', token);
        } catch (error) {
          console.error('Error refreshing token:', error);
        }
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [updateToken]);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    currentUser: user, // Add currentUser alias for compatibility
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}