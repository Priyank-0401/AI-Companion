import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/useTheme';
import { useEffect } from 'react';

const AuthLayout = ({ children, title, subtitle }) => {
  const { isDark } = useTheme();
  
  // Ensure dark mode is properly applied to the body
  useEffect(() => {
    document.body.className = isDark ? 'bg-gray-900' : 'bg-white';
    return () => {
      document.body.className = '';
    };
  }, [isDark]);
  
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-white dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
      <div className="flex min-h-[calc(100vh-5rem)] relative">
        {/* Left Section - Form Area */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-white dark:bg-gray-900 relative z-20"
        >
          <div className="w-full max-w-md">
            {/* Logo and Header */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
                <svg 
                  className="w-6 h-6 text-white" 
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
              <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                Seriva<span className="text-blue-500">.</span>
              </h1>
              <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                {title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            </div>
            
            {/* Form Container */}
            <div className="space-y-6">
              {children}
            </div>
          </div>
        </motion.div>

        {/* Blending Mask - Creates the merge effect */}
        <div 
          className="absolute top-0 bottom-0 w-1/5 h-full z-10 pointer-events-none"
          style={{
            left: 'calc(50% - 8rem)',
            background: isDark
              ? 'linear-gradient(90deg, transparent 0%, #111827 20%, #111827 40%, rgba(17, 24, 39, 0.9) 50%, rgba(17, 24, 39, 0.7) 60%, rgba(17, 24, 39, 0.4) 70%, rgba(17, 24, 39, 0.1) 85%, transparent 100%)'
              : 'linear-gradient(90deg, transparent 0%, #ffffff 20%, #ffffff 40%, rgba(255, 255, 255, 0.9) 50%, rgba(255, 255, 255, 0.7) 60%, rgba(255, 255, 255, 0.4) 70%, rgba(255, 255, 255, 0.1) 85%, transparent 100%)'
          }}
        />

        {/* Right Section - Visual Area */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          className="hidden lg:flex flex-1 relative overflow-hidden"
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${isDark ? '/auth-image-dark.png' : '/auth-image-light.png'})`
            }}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 dark:from-blue-900/40 dark:to-purple-900/40" />
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;