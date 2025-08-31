import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/common/ScrollToTop';
import ScrollToTopButton from './components/common/ScrollToTopButton';

// Pages
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import JournalPage from './pages/JournalPage';
import SettingsPage from './pages/SettingsPage';
import AvatarCallPage from './pages/AvatarCallPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AboutPage from './pages/AboutPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import FeedbackPage from './pages/FeedbackPage';

// Contexts
import { AuthProvider } from './auth/context/AuthContext';
import useAuth from './auth/hooks/useAuth';
import { ThemeProvider, useTheme } from './contexts/useTheme';

import './App.css'

function AppContent() {
  const location = useLocation();
  const { user, loading, initialized } = useAuth();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isHomePage = location.pathname === '/';
  const hideNavbar = false;
  const isDashboardPage = location.pathname === '/dashboard';
  const isSettingsRoute = location.pathname.startsWith('/settings');
  const isJournalRoute = location.pathname.startsWith('/journal');
  
  // Prevent body scrolling on specific pages - must be called unconditionally
  useEffect(() => {
    const isChatRoute = location.pathname.startsWith('/chat');
    const isInformationalPage = ['/about', '/privacy', '/terms', '/cookies', '/feedback'].some(path => location.pathname.startsWith(path));
    
    // Allow scrolling on home, dashboard, chat, auth, informational, journal, and settings pages
    if (isHomePage || isDashboardPage || isChatRoute || isAuthPage || isInformationalPage || isJournalRoute || isSettingsRoute) {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    } else {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    };
  }, [location.pathname, isHomePage, isDashboardPage, isSettingsRoute, isJournalRoute, isAuthPage]);

  // Redirect authenticated users away from auth pages
  if (isAuthPage && user) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Toaster position="top-right" />
      <ScrollToTop />
      <ScrollToTopButton />
      {!hideNavbar && <Navbar />}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 pt-20"
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
          
          {/* Public Information Pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/cookies" element={<CookiePolicyPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
        </Routes>
      </motion.main>
      {!['/login', '/signup', '/chat', '/dashboard', '/journal', '/avatar-call', '/settings'].some(path => location.pathname.startsWith(path)) && <Footer />}
    </div>
  );
}

// Create a client
const queryClient = new QueryClient();


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200">
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </Router>
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// HMR support
if (import.meta.hot) {
  import.meta.hot.accept();
}

export default App;
