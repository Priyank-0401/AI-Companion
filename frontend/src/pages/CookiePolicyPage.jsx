import { motion } from 'framer-motion';
import { Cookie, Settings, Shield, Info, CheckCircle, XCircle } from 'lucide-react';

const CookiePolicyPage = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const lastUpdated = "August 21, 2025";

  const cookieTypes = [
    {
      type: "Essential Cookies",
      icon: Shield,
      color: "green",
      required: true,
      description: "Necessary for the website to function properly",
      examples: [
        "Authentication tokens to keep you logged in",
        "Security cookies to protect against attacks",
        "Session management for app functionality"
      ]
    },
    {
      type: "Functional Cookies",
      icon: Settings,
      color: "blue",
      required: false,
      description: "Enhance your experience and remember your preferences",
      examples: [
        "Theme preferences (light/dark mode)",
        "Language settings",
        "Accessibility preferences"
      ]
    },
    {
      type: "Analytics Cookies",
      icon: Info,
      color: "purple",
      required: false,
      description: "Help us understand how you use Seriva to improve our service",
      examples: [
        "Page visit tracking (anonymized)",
        "Performance monitoring",
        "Error reporting and debugging"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 pt-20">
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Cookie className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Cookie Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Last updated: {lastUpdated}
          </p>
        </motion.div>

        {/* Introduction */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-8 shadow-lg border border-gray-100 dark:border-gray-700"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                What Are Cookies?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Cookies are small text files that are placed on your device when you visit our website. They help us 
                provide you with a better experience by remembering your preferences and enabling essential functionality.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                This Cookie Policy explains what cookies we use, why we use them, and how you can control them when 
                using Seriva.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Cookie Types */}
        <motion.section 
          className="mb-8"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center">
            Types of Cookies We Use
          </h2>
          
          <div className="space-y-6">
            {cookieTypes.map((category, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-start space-x-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${
                    category.color === 'green' ? 'from-green-400 to-emerald-500' :
                    category.color === 'blue' ? 'from-blue-400 to-indigo-500' :
                    'from-purple-400 to-pink-500'
                  } rounded-2xl flex items-center justify-center flex-shrink-0`}>
                    <category.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                        {category.type}
                      </h3>
                      {category.required ? (
                        <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">Required</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                          <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Optional</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                      {category.description}
                    </p>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Examples:
                      </h4>
                      <ul className="space-y-1">
                        {category.examples.map((example, exampleIndex) => (
                          <li key={exampleIndex} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5"></div>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Cookie Details */}
        <motion.section 
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-8 shadow-lg border border-gray-100 dark:border-gray-700"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Specific Cookies We Use
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Cookie Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Purpose</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Duration</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Type</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 dark:text-gray-300">
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4 font-mono text-sm">auth_token</td>
                  <td className="py-3 px-4">Keep you logged in securely</td>
                  <td className="py-3 px-4">7 days</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs">
                      Essential
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4 font-mono text-sm">theme_pref</td>
                  <td className="py-3 px-4">Remember your theme choice (light/dark)</td>
                  <td className="py-3 px-4">1 year</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                      Functional
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4 font-mono text-sm">session_id</td>
                  <td className="py-3 px-4">Maintain your session across pages</td>
                  <td className="py-3 px-4">Session</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs">
                      Essential
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-sm">analytics_id</td>
                  <td className="py-3 px-4">Anonymous usage analytics (if enabled)</td>
                  <td className="py-3 px-4">2 years</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">
                      Analytics
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Managing Cookies */}
        <motion.section 
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-8 shadow-lg border border-gray-100 dark:border-gray-700"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div className="flex items-center space-x-4 mb-6">
            <Settings className="w-8 h-8 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Managing Your Cookie Preferences
            </h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                Your Choices
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                You have several options for managing cookies when using Seriva:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center space-x-3 mb-3">
                    <CheckCircle className="w-6 h-6 text-blue-500" />
                    <h4 className="font-semibold text-gray-800 dark:text-white">Accept All</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Allow all cookies for the best experience with personalized features and analytics.
                  </p>
                </div>
                
                <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                  <div className="flex items-center space-x-3 mb-3">
                    <Settings className="w-6 h-6 text-purple-500" />
                    <h4 className="font-semibold text-gray-800 dark:text-white">Customize</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Choose which types of cookies you want to allow through your account settings.
                  </p>
                </div>
                
                <div className="p-6 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                  <div className="flex items-center space-x-3 mb-3">
                    <XCircle className="w-6 h-6 text-orange-500" />
                    <h4 className="font-semibold text-gray-800 dark:text-white">Essential Only</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Use only essential cookies. Some features may not work optimally.
                  </p>
                </div>
                
                <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center space-x-3 mb-3">
                    <Settings className="w-6 h-6 text-gray-500" />
                    <h4 className="font-semibold text-gray-800 dark:text-white">Browser Settings</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Control cookies through your browser's privacy settings.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                Browser Cookie Settings
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Most browsers allow you to control cookies through their settings. Here's how to access cookie settings 
                in popular browsers:
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <span><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                    <span><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5"></div>
                    <span><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                    <span><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Third-Party Cookies */}
        <motion.section 
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-8 shadow-lg border border-gray-100 dark:border-gray-700"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Third-Party Services
          </h2>
          
          <div className="space-y-4 text-gray-600 dark:text-gray-300">
            <p className="leading-relaxed">
              Seriva uses minimal third-party services that may set their own cookies:
            </p>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                  Firebase (Google)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Used for authentication and secure data storage. 
                  <a href="https://policies.google.com/privacy" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                    View Google's Privacy Policy
                  </a>
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                  Content Delivery Network (CDN)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Used to deliver website content efficiently. These services may use cookies for performance optimization.
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              We carefully select third-party services that respect user privacy and provide clear opt-out mechanisms.
            </p>
          </div>
        </motion.section>

        {/* Updates */}
        <motion.section 
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-8 shadow-lg border border-gray-100 dark:border-gray-700"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Updates to This Policy
          </h2>
          
          <div className="space-y-4 text-gray-600 dark:text-gray-300">
            <p className="leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for legal reasons. 
              When we make significant changes, we will:
            </p>
            
            <ul className="space-y-2 ml-4">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <span>Update the "Last updated" date at the top of this policy</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <span>Notify you through the app or via email if you have an account</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <span>Request your consent again if legally required</span>
              </li>
            </ul>
          </div>
        </motion.section>

        {/* Contact */}
        <motion.section 
          className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-blue-100 dark:border-blue-800"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Questions About Cookies?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              If you have questions about our use of cookies or this Cookie Policy, we're here to help.
            </p>
            <div className="space-y-2">
              <p className="text-gray-600 dark:text-gray-300">
                <strong>Email:</strong> priyankpahwa41@gmail.com
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <strong>Cookie Preferences:</strong> Manage in your account settings
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-4">
                This Cookie Policy was last updated on {lastUpdated}
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default CookiePolicyPage;
