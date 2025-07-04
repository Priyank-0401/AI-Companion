import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import JournalPage from './pages/JournalPage';
import SettingsPage from './pages/SettingsPage';
import AvatarCallPage from './pages/AvatarCallPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Contexts
import { AuthProvider, useAuth } from './auth/context/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ChatProvider from './contexts/ChatContext/ChatProvider';
import { ConversationProvider } from './contexts/ConversationContext';

import './App.css'

function AppContent() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isHomePage = location.pathname === '/';
  const hideNavbar = false;
  const isDashboardPage = location.pathname === '/dashboard';
  const isSettingsPage = location.pathname === '/settings';
  
  // Prevent body scrolling on specific pages
  useEffect(() => {
    const isChatRoute = location.pathname.startsWith('/chat');
    if (!isHomePage && !isDashboardPage && !isSettingsPage && !isChatRoute) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    };
  }, [isHomePage, isDashboardPage, isSettingsPage, location.pathname]);

  // Redirect authenticated users away from auth pages
  if (isAuthPage && user && !loading) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Toaster position="top-right" />
      {!hideNavbar && <Navbar />}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1"
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          
          {/* Auth Pages */}
          <Route 
            path="/login" 
            element={!user ? <LoginPage /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/signup" 
            element={!user ? <SignupPage /> : <Navigate to="/" replace />} 
          />
          
          {/* Protected Routes */}
          <Route path="/chat" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          
          <Route path="/journal" element={
            <ProtectedRoute>
              <JournalPage />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/avatar-call" element={
            <ProtectedRoute>
              <AvatarCallPage />
            </ProtectedRoute>
          } />
          
          <Route 
            path="/settings/:tab" 
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </motion.main>
      {!isAuthPage && isHomePage && <Footer />}
    </div>
  );
}

// Wrapper component to handle theme application
const ThemeWrapper = ({ children }) => {
  const { theme } = useTheme();

  // Apply theme class to html element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Also set a data-theme attribute for any CSS-in-JS libraries that might need it
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <ThemeWrapper>
            <ChatProvider>
              <ConversationProvider>
                <AppContent />
              </ConversationProvider>
            </ChatProvider>
          </ThemeWrapper>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

// HMR support
if (import.meta.hot) {
  import.meta.hot.accept();
}

export default App;
