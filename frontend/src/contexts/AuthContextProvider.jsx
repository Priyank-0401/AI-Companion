import { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // If user just signed in and we're on login/signup page, set redirecting state
      if (user && (window.location.pathname === '/login' || window.location.pathname === '/signup')) {
        setIsRedirecting(true);
        // Clear redirecting state after a brief delay to allow navigation to complete
        setTimeout(() => {
          setIsRedirecting(false);
        }, 1000);
      }
    });
    return unsubscribe;
  }, []);

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
    loading,
    isRedirecting
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
