import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/useTheme';
import { useEffect } from 'react';

const AuthLayout = ({ children, title, subtitle }) => {
  const { isDark } = useTheme();
  
  // Ensure dark mode is properly applied to the body
  useEffect(() => {
    document.body.className = isDark ? 'bg-gray-900' : 'bg-gray-50';
    return () => {
      document.body.className = '';
    };
  }, [isDark]);
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-auto"
      >
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
            <svg 
              className="w-8 h-8 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            Seriva<span className="text-indigo-500">.</span>
          </h1>
          <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        </div>
        
        {/* Form Container */}
        <div className="p-8 rounded-2xl bg-white dark:bg-gray-800/50 dark:border dark:border-gray-700 shadow-xl dark:shadow-none backdrop-blur-sm transition-colors duration-200">
          {children}
        </div>
        
        {/* Decorative elements */}
        <div className="fixed top-0 right-0 w-64 h-64 -z-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 dark:opacity-30 animate-blob"></div>
        <div className="fixed bottom-10 left-0 w-64 h-64 -z-10 bg-purple-100 dark:bg-purple-900/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 dark:opacity-30 animate-blob animation-delay-2000"></div>
        <div className={`absolute top-1/2 left-1/2 w-40 h-40 -z-10 ${isDark ? 'bg-pink-900/20' : 'bg-pink-100'} rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000`}></div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
