import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const CTA = ({ user }) => {
  const { isDark } = useTheme();
  return (
    <section className={`relative py-10 overflow-hidden ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-indigo-600 to-purple-600'
    }`}>
      {/* Background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNNDUgMTVIMTV2MzBoMzBWMjVIMjVWMTVoMjB6IiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjEiLz48L3N2Zz4=')]"></div>
      </div>
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 ${
              isDark ? 'text-white' : 'text-white'
            }`}
          >
            Ready to transform your wellbeing?
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`text-xl mb-10 max-w-2xl mx-auto ${
              isDark ? 'text-gray-300' : 'text-indigo-100'
            }`}
          >
            Join thousands of users who have already started their journey to better mental health with our AI companion.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to={user ? "/dashboard" : "/signup"}
              className={`inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md ${
                isDark 
                  ? 'bg-white text-indigo-700 hover:bg-gray-100 shadow-lg shadow-indigo-500/20' 
                  : 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg'
              } md:py-4 md:text-lg md:px-10 transition-colors duration-200`}
            >
              {user ? 'Go to Dashboard' : 'Get Started Free'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            
            <Link
              to="/features"
              className={`inline-flex items-center justify-center px-8 py-3 border-2 ${
                isDark 
                  ? 'border-indigo-400 text-indigo-100 hover:bg-indigo-900/50' 
                  : 'border-white text-white hover:bg-white/10'
              } text-base font-medium rounded-md md:py-4 md:text-lg md:px-10 transition-colors duration-200`}
            >
              Learn More
            </Link>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-indigo-100"
          >
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${
                    isDark ? 'bg-indigo-500/30 border-indigo-400/30' : 'bg-white/20 border-white/30'
                  } border-2 flex items-center justify-center text-xs font-semibold text-white`}>
                    {i}K+
                  </div>
                ))}
              </div>
              <span className="ml-3">Happy Users</span>
            </div>
            <span className="hidden sm:inline-block h-5 w-px bg-white/30"></span>
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                isDark ? 'bg-yellow-500/30 text-yellow-300' : 'bg-yellow-400/20 text-yellow-300'
              } mr-2`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
              <span>4.9/5 from 1,200+ reviews</span>
            </div>
          </motion.div>
        </div>
      </div>
      

    </section>
  );
};

export default CTA;
