import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, UserCheck, AlertTriangle } from 'lucide-react';

const PrivacyPolicyPage = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const lastUpdated = "August 31, 2025";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Last updated: {lastUpdated}
          </p>
        </motion.div>

        {/* Trust Statement */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-8 shadow-lg border border-gray-100 dark:border-gray-700"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                Your Privacy is Our Priority
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                At Seriva, we understand that your mental wellness journey is deeply personal. This Privacy Policy 
                explains how we collect, use, protect, and respect your personal information. We are committed to 
                maintaining the highest standards of privacy and security.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Information We Collect */}
          <motion.section 
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="flex items-center space-x-4 mb-6">
              <Database className="w-8 h-8 text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Information We Collect
              </h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  Account Information
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Email address (for account creation and authentication)</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Display name (optional, chosen by you)</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Account preferences and settings</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  Conversation Data
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <span>Messages exchanged with Seriva (encrypted and stored securely)</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <span>Conversation history and context for personalized responses</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <span>Voice recordings (processed in real-time, not permanently stored)</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  Journal & Wellness Data
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>Journal entries and reflections</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>Mood tracking data and wellness metrics</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>Usage patterns and session information</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  Technical Information
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <span>Device type, browser information, and IP address</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <span>App performance data and error logs</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <span>Authentication tokens (encrypted)</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* How We Use Your Information */}
          <motion.section 
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="flex items-center space-x-4 mb-6">
              <Eye className="w-8 h-8 text-purple-500" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                How We Use Your Information
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                    Personalized Experience
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    To provide tailored responses and remember your wellness journey
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                    Service Improvement
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    To enhance Seriva's capabilities and user experience
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                    Account Management
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    To maintain your account, provide support, and ensure security
                  </p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                    Safety & Security
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    To protect against fraud, abuse, and security threats
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Data Protection */}
          <motion.section 
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="flex items-center space-x-4 mb-6">
              <Lock className="w-8 h-8 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                How We Protect Your Data
              </h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                  <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                    End-to-End Encryption
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    All conversations and personal data are encrypted in transit and at rest
                  </p>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                  <div className="w-12 h-12 bg-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                    Secure Storage
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Data stored in secure, enterprise-grade cloud infrastructure
                  </p>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                  <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                    Access Controls
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Strict access controls and regular security audits
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  Our Security Promise
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  We use industry-standard security measures including AES-256 encryption, secure authentication protocols, 
                  and regular security assessments. Your data is stored in geographically distributed, secure data centers 
                  with redundant backups and disaster recovery procedures.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Data Sharing */}
          <motion.section 
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="flex items-center space-x-4 mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Data Sharing & Third Parties
              </h2>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                We Do NOT Sell Your Data
              </h3>
              <p className="text-red-700 dark:text-red-300">
                Seriva will never sell, rent, or trade your personal information to third parties for marketing or any other purposes.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  Limited Sharing Scenarios
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <strong className="text-gray-800 dark:text-white">Service Providers:</strong>
                      <span className="text-gray-600 dark:text-gray-300 ml-2">
                        Trusted partners who help us operate our service (hosting, analytics, customer support)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <strong className="text-gray-800 dark:text-white">Legal Requirements:</strong>
                      <span className="text-gray-600 dark:text-gray-300 ml-2">
                        When required by law, court order, or to protect user safety
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <strong className="text-gray-800 dark:text-white">Anonymized Data:</strong>
                      <span className="text-gray-600 dark:text-gray-300 ml-2">
                        Aggregated, non-identifiable usage statistics for service improvement
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Your Rights */}
          <motion.section 
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Your Privacy Rights
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Access Your Data</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Request a copy of all personal data we have about you</p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Update Information</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Correct or update your personal information at any time</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Delete Your Data</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Request deletion of your account and associated data</p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Data Portability</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Export your data in a machine-readable format</p>
                </div>
              </div>
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
                Questions About Your Privacy?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We're here to help. Contact us with any questions about this Privacy Policy or how we handle your data.
              </p>
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-gray-300">
                  <strong>Email:</strong> privacy@seriva.ai
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  <strong>Response Time:</strong> Within 48 hours
                </p>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
