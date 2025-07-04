import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ChatInterface from '../components/chat/ChatInterface';
import ThemeContext from '../contexts/ThemeContext';
import { useAuth } from '../auth/context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Simple loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Error component
const ErrorMessage = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center h-screen text-center p-6">
    <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg max-w-md">
      <h3 className="font-bold text-lg mb-2">Error</h3>
      <p className="mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

const ChatPage = () => {
  const location = useLocation();
  const { theme } = useContext(ThemeContext);
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [currentUser, authLoading, navigate, location]);

  // Handle errors
  const handleError = (err) => {
    console.error('ChatPage error:', err);
    setError(err.message || 'An error occurred. Please try again.');
  };

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={() => window.location.reload()} 
      />
    );
  }

  return (
    <div className={`min-h-screen bg-white dark:bg-gray-900 ${theme === 'dark' ? 'dark' : ''}`}>
      <main className="h-full">
        <ChatInterface />
      </main>
    </div>
  );
};

export default ChatPage;