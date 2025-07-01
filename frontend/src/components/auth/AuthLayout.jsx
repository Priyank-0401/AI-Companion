import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

const AuthLayout = ({ children, title, subtitle, imageUrl = '/auth-image.png' }) => {
  const { isDark } = useTheme();
  
  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Left Section - Form */}
      <div className="w-full md:w-1/2 lg:w-7/12 xl:w-2/3 p-6 sm:p-8 md:p-12 lg:p-16 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          {/* Logo or App Name */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              <span className={isDark ? 'text-white' : 'text-gray-900'}>Seriva</span>
              <span className="text-indigo-500">.</span>
            </h1>
          </div>
          
          {/* Content */}
          <div className={`p-8 rounded-2xl ${isDark ? 'bg-gray-800/50 backdrop-blur-sm' : 'bg-white shadow-lg'}`}>
            <div className="mb-8 text-center">
              <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {subtitle}
              </p>
            </div>
            
            {children}
          </div>
        </motion.div>
      </div>
      
      {/* Right Section - Image */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 xl:w-1/3 relative overflow-hidden">
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-indigo-900/30 to-purple-900/30' : 'bg-gradient-to-br from-indigo-100 to-purple-100'}`}></div>
        <div className="absolute inset-0 flex items-center justify-center p-12 z-10">
          <div className="text-center">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-indigo-900/20' : 'bg-white shadow-lg'}`}>
              <svg 
                className={`w-16 h-16 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="1.5" 
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5.04 16.71a2.25 2.25 0 00-.33.257l-1.27 1.27a.75.75 0 01-1.06-1.06l1.27-1.27a2.25 2.25 0 01.257-.33L13.59 4.66a2.25 2.25 0 011.591-.659h5.714a.75.75 0 01.75.75v9.75a.75.75 0 01-.75.75h-9.75a.75.75 0 01-.75-.75V14.5a.75.75 0 011.5 0v1.69l3.22-3.22a.75.75 0 011.06 1.06l-3.22 3.22h1.69a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75v-3z"
                />
              </svg>
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Your Wellness Journey Starts Here
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Join thousands finding peace and balance with Seriva
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
