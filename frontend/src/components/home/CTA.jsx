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
        </div>
      </div>
      

    </section>
  );
};

export default CTA;
