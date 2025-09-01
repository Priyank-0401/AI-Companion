import { motion } from 'framer-motion';
import { FileText, AlertTriangle, Shield, Users, Gavel, Heart } from 'lucide-react';

const TermsOfServicePage = () => {
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
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Last updated: {lastUpdated}
          </p>
        </motion.div>

        {/* Important Notice */}
        <motion.div 
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-8 mb-8"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-amber-800 dark:text-amber-200 mb-3">
                Important Medical Disclaimer
              </h2>
              <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
                <strong>Seriva is not a substitute for professional medical or mental health care.</strong> While our AI companion 
                provides supportive conversations and wellness tools, it is not designed to diagnose, treat, or replace professional 
                therapy or medical advice. If you are experiencing a mental health crisis or need professional support, please 
                consult qualified healthcare providers or contact emergency services.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Agreement */}
          <motion.section 
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="flex items-center space-x-4 mb-6">
              <Gavel className="w-8 h-8 text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Agreement to Terms
              </h2>
            </div>
            
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <p className="leading-relaxed">
                By accessing and using Seriva ("the Service"), you agree to be bound by these Terms of Service ("Terms"). 
                These Terms constitute a legal agreement between you and Seriva AI regarding your use of our AI companion service.
              </p>
              <p className="leading-relaxed">
                If you do not agree to these Terms, please do not use our Service. We may update these Terms from time to 
                time, and your continued use of the Service constitutes acceptance of any changes.
              </p>
            </div>
          </motion.section>

          {/* Service Description */}
          <motion.section 
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="flex items-center space-x-4 mb-6">
              <Users className="w-8 h-8 text-purple-500" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Description of Service
              </h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  What Seriva Provides
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>AI-powered conversations for emotional support and companionship</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <span>Digital journaling tools and mood tracking features</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>3D avatar interface for immersive interaction</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <span>Wellness insights and progress tracking</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  Service Limitations
                </h3>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <ul className="space-y-2 text-red-700 dark:text-red-300">
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <span>Not a replacement for professional therapy or medical treatment</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <span>Cannot diagnose or treat mental health conditions</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <span>Not equipped to handle emergency situations</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <span>AI responses may not always be accurate or appropriate</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.section>

          {/* User Responsibilities */}
          <motion.section 
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="flex items-center space-x-4 mb-6">
              <Shield className="w-8 h-8 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                User Responsibilities & Acceptable Use
              </h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  Your Responsibilities
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>Provide accurate information when creating your account</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>Keep your account credentials secure and confidential</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>Use the Service for personal, non-commercial purposes only</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>Seek professional help when needed for serious mental health concerns</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  Prohibited Activities
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                    <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Technical Misuse</h4>
                    <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                      <li>• Attempting to hack or break the system</li>
                      <li>• Reverse engineering the AI technology</li>
                      <li>• Overloading servers with excessive requests</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                    <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Content Violations</h4>
                    <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                      <li>• Sharing illegal or harmful content</li>
                      <li>• Harassment or abusive language</li>
                      <li>• Attempting to bypass safety measures</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Privacy & Data */}
          <motion.section 
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Privacy & Data Handling
            </h2>
            
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <p className="leading-relaxed">
                Your privacy is important to us. Our collection, use, and protection of your personal information is 
                governed by our Privacy Policy, which is incorporated into these Terms by reference.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-blue-700 dark:text-blue-300 font-medium">
                  By using Seriva, you consent to the collection and use of your information as described in our 
                  Privacy Policy. Please review it carefully to understand how we handle your data.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Limitation of Liability */}
          <motion.section 
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="flex items-center space-x-4 mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Limitation of Liability
              </h2>
            </div>
            
            <div className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3">
                  Service Disclaimer
                </h3>
                <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
                  Seriva is provided "as is" without warranties of any kind. We do not guarantee that the Service will 
                  be uninterrupted, error-free, or that it will meet your specific needs or expectations.
                </p>
              </div>

              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p className="leading-relaxed">
                  <strong>To the maximum extent permitted by law:</strong>
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                    <span>We are not liable for any indirect, incidental, or consequential damages</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                    <span>Our total liability shall not exceed the amount paid by you for the Service</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                    <span>We are not responsible for decisions made based on AI-generated content</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Account Management */}
          <motion.section 
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Account Management & Termination
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  Your Rights
                </h3>
                <ul className="space-y-2 text-gray600 dark:text-gray-300">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Delete your account at any time</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Export your personal data</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Update your information and preferences</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  Our Rights
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <span>Suspend accounts that violate these Terms</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <span>Modify or discontinue the Service</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <span>Update these Terms as needed</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Governing Law */}
          <motion.section 
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Governing Law & Dispute Resolution
            </h2>
            
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <p className="leading-relaxed">
                These Terms are governed by and construed in accordance with the laws of [Your Jurisdiction], 
                without regard to its conflict of law provisions.
              </p>
              <p className="leading-relaxed">
                Any disputes arising from these Terms or your use of the Service will be resolved through binding 
                arbitration, except where prohibited by law or for disputes that may be brought in small claims court.
              </p>
            </div>
          </motion.section>

          {/* Contact Information */}
          <motion.section 
            className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-blue-100 dark:border-blue-800"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Questions About These Terms?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                If you have questions about these Terms of Service, please don't hesitate to contact us.
              </p>
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-gray-300">
                  <strong>Email:</strong> legal@seriva.ai
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  <strong>Support:</strong> support@seriva.ai
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-4">
                  These Terms are effective as of {lastUpdated}
                </p>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
