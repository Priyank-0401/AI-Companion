import { motion } from 'framer-motion';
import { MessageCircle, BarChart3, BookOpen, Shield, Users, Zap, X, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: MessageCircle,
    title: 'AI Conversations',
    description: 'Engage in natural, meaningful conversations with our empathetic AI companion that understands and responds to your emotions.',
    color: 'from-blue-500 to-cyan-500',
    detailedDescription: 'Experience two powerful ways to connect with Seriva, your AI therapeutic companion. Choose from text-based conversations for thoughtful exchanges or immersive 3D avatar calls for a more personal connection. Our AI understands context, remembers your conversations, and provides empathetic responses tailored to your emotional state.',
    features: [
      'Natural language processing with emotional intelligence',
      'Persistent conversation memory across sessions',
      '3D avatar with realistic expressions and voice',
      'Text and voice interaction modes',
      'Therapeutic conversation techniques',
      'Crisis detection and appropriate responses'
    ],
    pages: [
      { title: 'Try Text Chat', path: '/chat', description: 'Start a text conversation' },
      { title: 'Meet Avatar Seriva', path: '/avatar-call', description: '3D interactive experience' }
    ]
  },
  {
    icon: BarChart3,
    title: 'Mood Tracking',
    description: 'Gain insights into your emotional patterns with beautiful visualizations and personalized recommendations.',
    color: 'from-purple-500 to-pink-500',
    detailedDescription: 'Monitor your emotional wellbeing with intelligent mood tracking that goes beyond simple ratings. Our system analyzes patterns, identifies triggers, and provides actionable insights to help you understand and improve your mental health over time.',
    features: [
      'Daily mood check-ins with contextual questions',
      'Beautiful data visualizations and trend analysis',
      'Pattern recognition for mood triggers',
      'Personalized insights and recommendations',
      'Weekly and monthly emotional health reports',
      'Integration with journal entries for deeper context'
    ],
    pages: [
      { title: 'View Dashboard', path: '/dashboard', description: 'Access your mood analytics' }
    ]
  },
  {
    icon: BookOpen,
    title: 'Smart Journaling',
    description: 'Express yourself freely with our intelligent journal that helps you reflect and grow through guided prompts.',
    color: 'from-amber-500 to-orange-500',
    detailedDescription: 'Transform your thoughts into insights with our AI-powered journaling platform. Get personalized prompts, emotional analysis of your entries, and structured reflection exercises that promote self-awareness and personal growth.',
    features: [
      'AI-generated personalized writing prompts',
      'Emotional tone analysis of journal entries',
      'Guided reflection exercises and questions',
      'Secure, encrypted storage of all entries',
      'Search and categorization of past entries',
      'Integration with mood tracking for holistic insights'
    ],
    pages: [
      { title: 'Start Journaling', path: '/journal', description: 'Write your first entry' }
    ]
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data stays yours. We use end-to-end encryption and never share your personal information.',
    color: 'from-emerald-500 to-teal-500',
    detailedDescription: 'Your privacy and security are our highest priorities. We implement industry-leading encryption, secure data handling practices, and transparent policies to ensure your personal information and conversations remain completely confidential.',
    features: [
      'End-to-end encryption for all communications',
      'Zero-knowledge architecture - we can\'t see your data',
      'GDPR and HIPAA compliant data practices',
      'No data selling or sharing with third parties',
      'Secure cloud infrastructure with regular audits',
      'User-controlled data deletion and portability'
    ],
    pages: [
      { title: 'Privacy Policy', path: '/privacy', description: 'Read our full privacy policy' }
    ]
  },
  {
    icon: Users,
    title: '24/7 Support',
    description: 'Your AI companion is always available whenever you need someone to talk to, day or night.',
    color: 'from-rose-500 to-pink-500',
    detailedDescription: 'Never feel alone with round-the-clock access to your AI companion. Whether you need someone to talk through a difficult moment, want to celebrate a success, or simply need a listening ear, Seriva is always here for you.',
    features: [
      'Always available - no appointments needed',
      'Instant response to your messages and calls',
      'Crisis support with appropriate resource referrals',
      'Consistent personality and conversation memory',
      'Multiple communication channels (text, voice, video)',
      'Seamless experience across all devices'
    ],
    pages: [
      { title: 'Contact Support', path: '/feedback', description: 'Get help or share feedback' }
    ]
  },
  {
    icon: Zap,
    title: 'Mindfulness Tools',
    description: 'Access guided meditations, breathing exercises, and relaxation techniques to reduce stress and anxiety.',
    color: 'from-indigo-500 to-blue-500',
    detailedDescription: 'Cultivate inner peace and emotional resilience with our comprehensive mindfulness toolkit. From quick breathing exercises to longer meditation sessions, find the perfect practice for any moment and mood.',
    features: [
      'Guided meditation sessions of varying lengths',
      'Breathing exercises for anxiety and stress relief',
      'Progressive muscle relaxation techniques',
      'Mindful movement and body awareness practices',
      'Personalized recommendations based on your needs',
      'Integration with mood tracking for optimal timing'
    ],
    pages: [
      { title: 'Learn More', path: '/about', description: 'Discover our wellness philosophy' }
    ]
  }
];

const Features = () => {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const navigate = useNavigate();

  const openFeatureDialog = (feature) => {
    setSelectedFeature(feature);
  };

  const closeFeatureDialog = () => {
    setSelectedFeature(null);
  };

  const handlePageNavigation = (path) => {
    navigate(path);
    closeFeatureDialog();
  };

  return (
    <>
      <section className="py-20 bg-white dark:bg-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Your Wellness, Our Priority
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Discover how our AI companion supports your mental and emotional wellbeing through innovative features
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative bg-white dark:bg-gray-800/50 rounded-2xl p-6 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700/50 cursor-pointer"
                onClick={() => openFeatureDialog(feature)}
              >
                <div className={`absolute -top-5 left-6 w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="mt-8 text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
                <div className="mt-4">
                  <span className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors">
                    Learn more
                    <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800"
          >
            {/* Header with Gradient Background */}
            <div className={`relative bg-gradient-to-r ${selectedFeature.color} p-6`}>
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                    <selectedFeature.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {selectedFeature.title}
                    </h2>
                    <p className="text-white/80 text-sm">
                      Enhance your wellness journey
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeFeatureDialog}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedFeature.detailedDescription}
                  </p>
                </div>

                {/* Key Features */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${selectedFeature.color} mr-3`}></div>
                    Key Features
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedFeature.features.map((item, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${selectedFeature.color} mt-2 flex-shrink-0`}></div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedFeature.pages && selectedFeature.pages.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${selectedFeature.color} mr-3`}></div>
                      Get Started
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {selectedFeature.pages.map((page, index) => (
                        <button
                          key={index}
                          onClick={() => handlePageNavigation(page.path)}
                          className={`inline-flex items-center px-4 py-2.5 rounded-full text-sm font-medium text-white bg-gradient-to-r ${selectedFeature.color} hover:shadow-lg hover:shadow-current/25 transition-all duration-200 group`}
                        >
                          <span className="mr-2">{page.title}</span>
                          <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 space-y-1">
                      {selectedFeature.pages.map((page, index) => (
                        <p key={index} className="text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium">{page.title}:</span> {page.description}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default Features;
