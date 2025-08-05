import { motion } from 'framer-motion';
import { Lock, Eye, UserX, Shield, Key, Database } from 'lucide-react';
import { useTheme } from '../../contexts/useTheme';

const PrivacyFirst = () => {
  const { isDark } = useTheme();
  
  const privacyFeatures = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'All your conversations and personal data are encrypted both in transit and at rest using industry-standard encryption.'
    },
    {
      icon: Eye,
      title: 'No Data Selling',
      description: 'We never sell, rent, or share your personal data with third parties for marketing or advertising purposes.'
    },
    {
      icon: UserX,
      title: 'No Profiling',
      description: 'Your data is never used to build psychological profiles or target you with personalized advertisements.'
    },
    {
      icon: Shield,
      title: 'You Control Your Data',
      description: 'You have complete control over your data, including the right to access, modify, or delete it at any time.'
    }
  ];

  return (
    <section className={`py-20 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Privacy First
          </h2>
          <p className={`text-lg md:text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
            Your mental wellness journey deserves the highest level of privacy and security.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
          {privacyFeatures.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`rounded-2xl p-6 shadow-lg ${isDark ? 'bg-gray-700' : 'bg-white'}`}
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                  <feature.icon className="h-6 w-6" />
                </div>
              </div>
              <h3 className={`font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {feature.title}
              </h3>
              <p className={`text-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className={`max-w-4xl mx-auto rounded-2xl p-8 ${isDark ? 'bg-gray-700' : 'bg-white'} shadow-lg`}>
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8">
              <div className="p-4 rounded-full bg-indigo-100 text-indigo-600">
                <Key className="h-12 w-12" />
              </div>
            </div>
            <div className="text-center md:text-left">
              <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Your Data, Your Control
              </h3>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                We believe that your mental health data is deeply personal and should remain under your control. 
                Seriva gives you complete transparency about how your data is used and provides you with tools 
                to manage your privacy settings at any time.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                <div className="flex items-center">
                  <Database className="h-5 w-5 text-indigo-600 mr-2" />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Encrypted Storage</span>
                </div>
                <div className="flex items-center">
                  <Lock className="h-5 w-5 text-indigo-600 mr-2" />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Secure Access</span>
                </div>
                <div className="flex items-center">
                  <UserX className="h-5 w-5 text-indigo-600 mr-2" />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>No Third-Party Sharing</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PrivacyFirst;
