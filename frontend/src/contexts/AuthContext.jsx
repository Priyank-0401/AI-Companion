import { createContext, useContext } from 'react';

export const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  isRedirecting: false,
  isAuthenticated: false,
  logout: async () => {},
  refreshUser: async () => {},
  updateToken: async () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContextProvider } from './AuthContextProvider';