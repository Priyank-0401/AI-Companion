import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/useTheme';

const Hero = ({ user, scrollToFeatures }) => {
  const { isDark } = useTheme();
  return (
    <section className={`relative py-20 overflow-hidden ${
      isDark 
        ? 'bg-gray-900' 
        : 'bg-gray-50'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              Your Personal <span className="text-indigo-600">AI Wellness</span> Companion
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className={`text-lg md:text-xl mb-8 max-w-xl mx-auto lg:mx-0 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Meet Seriva - your 24/7 AI companion for emotional support, personal growth, and mental wellbeing.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link
                to={user ? "/dashboard" : "/signup"}
                className={`inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 transition-colors duration-200 ${
                  isDark ? 'shadow-lg shadow-indigo-500/20' : ''
                }`}
              >
                {user ? 'Go to Dashboard' : 'Get Started Free'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button
                onClick={scrollToFeatures}
                className={`inline-flex items-center justify-center px-8 py-3 border ${
                  isDark 
                    ? 'border-indigo-400 text-indigo-100 bg-indigo-900/30 hover:bg-indigo-900/50' 
                    : 'border-transparent text-indigo-700 bg-indigo-100 hover:bg-indigo-200'
                } text-base font-medium rounded-md md:py-4 md:text-lg md:px-10 transition-colors duration-200`}
              >
                Learn More
              </button>
            </motion.div>
          </div>
          <motion.div 
            className="relative mt-12 lg:mt-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative max-w-md mx-auto">
              <div className={`absolute inset-0 rounded-3xl transform rotate-6 ${
                isDark ? 'bg-indigo-900/50' : 'bg-indigo-200'
              }`}></div>
              <div className={`relative p-1 rounded-3xl shadow-2xl overflow-hidden ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className={`aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden ${
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <div className={`w-full h-full flex items-center justify-center ${
                    isDark 
                      ? 'bg-gradient-to-br from-indigo-900/30 to-purple-900/30' 
                      : 'bg-gradient-to-br from-indigo-100 to-purple-100'
                  }`}>
                    <div className="text-center p-8">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-400 mx-auto mb-6">
                        <img 
                          src="/avatar-portrait.png" 
                          alt="Seriva AI Companion"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className={`text-xl font-semibold mb-2 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        Meet Seriva
                      </h3>
                      <p className={`mb-4 ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Your AI wellness companion
                      </p>
                      <Link 
                        to={user ? "/avatar-call" : "/login"}
                        className={`inline-block px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                          isDark 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        Talk to Seriva
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
