import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import Navbar from './components/layout/Navbar'
import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPage'
import DashboardPage from './pages/DashboardPage'
import JournalingPage from './pages/JournalingPage'
import SettingsPage from './pages/SettingsPage'
import AvatarCallPage from './pages/AvatarCallPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Footer from './components/layout/Footer'
import { ChatProvider } from './contexts/ChatContext'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isHomePage = location.pathname === '/';
  const isDashboardPage = location.pathname === '/dashboard';
  const isSettingsPage = location.pathname === '/settings';
  // Prevent body scrolling on all pages except HomePage and Dashboard
  useEffect(() => {
    if (!isHomePage && !isDashboardPage && !isSettingsPage) {
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
  }, [isHomePage, isDashboardPage, isSettingsPage]);
  return (
    <div className="flex flex-col min-h-screen bg-[#222831] text-[#EEEEEE]">
      <Navbar />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={isAuthPage 
          ? "pt-16 flex-grow" 
          : isDashboardPage 
            ? "pt-16 w-full flex-grow" 
            : "pt-16 w-full py-4 flex-grow"
        }
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/avatar-call" 
            element={
              <ProtectedRoute>
                <AvatarCallPage />
              </ProtectedRoute>
            } 
          />          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/journal" 
            element={
              <ProtectedRoute>
                <JournalingPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
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

function App() {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
