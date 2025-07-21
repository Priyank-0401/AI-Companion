import { motion } from 'framer-motion';
import { Heart, Shield, Brain, Sparkles, MessageCircle, BookOpen, BarChart3, User } from 'lucide-react';

const AboutPage = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const features = [
    {
      icon: User,
      title: "3D Avatar Companion",
      description: "Interact with Seriva through immersive 3D conversations that feel natural and engaging."
    },
    {
      icon: MessageCircle,
      title: "Intelligent Conversations",
      description: "Advanced AI that remembers your journey and provides personalized, empathetic responses."
    },
    {
      icon: BookOpen,
      title: "Smart Journaling",
      description: "Guided journaling experiences that help you process thoughts and track personal growth."
    },
    {
      icon: BarChart3,
      title: "Mood Tracking",
      description: "Visual insights into your emotional patterns to support your wellness journey."
    }
  ];

  const philosophyPoints = [
    {
      icon: Heart,
      title: "Compassionate by Design",
      description: "Built on principles of empathy, understanding, and non-judgmental support."
    },
    {
      icon: Shield,
      title: "Safe Space",
      description: "A secure, private environment where you can express yourself freely without fear."
    },
    {
      icon: Brain,
      title: "Evidence-Based",
      description: "Incorporating techniques from mindfulness, journaling, and cognitive behavioral approaches."
    },
    {
      icon: Sparkles,
      title: "Non-Gamified",
      description: "No badges or streaks - just genuine support for authentic self-reflection."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            About Seriva
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Your compassionate AI companion for mental wellness, designed to provide a safe space for 
            self-reflection, growth, and emotional support.
          </p>
        </motion.div>

        {/* What is Seriva Section */}
        <motion.section 
          className="mb-20"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-6">
              What is Seriva?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Seriva is an innovative AI companion designed to support your mental wellness journey through 
              empathetic conversations, thoughtful journaling, and mindful self-reflection. Our mission is to 
              provide accessible, personalized mental health support that adapts to your unique needs and pace.
            </p>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* Meet the AI Companion Section */}
        <motion.section 
          className="mb-20"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-6">
                  Meet Your AI Companion
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Seriva embodies the qualities of an ideal therapeutic companion: <strong>calm, wise, and endlessly patient</strong>. 
                  She's designed to be a non-judgmental listener who creates a safe space for you to explore your thoughts and feelings.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong>Empathetic Listener:</strong> Understands emotional nuance and responds with genuine care
                    </p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mt-2"></div>
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong>Consistent Support:</strong> Available 24/7 whenever you need someone to talk to
                    </p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2"></div>
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong>Personal Growth Partner:</strong> Helps you discover insights and patterns in your journey
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl p-8 text-center">
                  <div className="w-32 h-32 bg-white rounded-full mx-auto mb-6 flex items-center justify-center">
                    <User className="w-16 h-16 text-blue-500" />
                  </div>
                  <p className="text-white text-lg font-medium">
                    "I'm here to listen, support, and grow with you on your wellness journey."
                  </p>
                  <p className="text-white/80 mt-2">— Seriva</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section 
          className="mb-20"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-6">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Seriva uses advanced AI technology to create natural, meaningful conversations while maintaining 
              the highest standards of privacy and security.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Natural Conversation
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Speak or type with Seriva using natural language. Our AI understands context, emotion, and intent.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Personalized Support
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Seriva remembers your journey and adapts to your unique needs, providing increasingly personalized guidance.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-red-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Secure & Private
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                All conversations are encrypted and stored securely. Your privacy and confidentiality are our top priorities.
              </p>
            </div>
          </div>

          <div className="mt-12 bg-blue-50 dark:bg-gray-800 rounded-2xl p-8 border border-blue-100 dark:border-gray-700">
            <div className="flex items-start space-x-4">
              <Shield className="w-8 h-8 text-blue-500 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  Transparency & Trust
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  We believe in transparent AI. Seriva uses state-of-the-art language models to understand and respond 
                  to your needs, while our secure infrastructure ensures your data remains private and protected.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Wellness Philosophy Section */}
        <motion.section 
          className="mb-20"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-6">
              Our Wellness Philosophy
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              We believe in creating a calm, supportive environment that prioritizes authentic self-reflection over 
              gamification. Our approach is built on evidence-based principles while maintaining the warmth of human connection.
            </p>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            className="grid md:grid-cols-2 gap-8 mb-12"
          >
            {philosophyPoints.map((point, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <point.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                      {point.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-10 border border-amber-100 dark:border-gray-600"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Important Note
              </h3>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
                Seriva is designed as a supportive companion based on evidence-based techniques like journaling and mindfulness. 
                While we provide emotional support and guidance, <strong>Seriva is not a replacement for professional therapy or medical advice</strong>. 
                If you're experiencing a mental health crisis or need professional support, please consult with qualified healthcare providers.
              </p>
            </div>
          </motion.div>
        </motion.section>

        {/* Call to Action */}
        <motion.div 
          className="text-center"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
            Ready to Begin Your Journey?
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have found support, clarity, and growth through their conversations with Seriva.
          </p>
          <div className="space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => window.location.href = '/signup'}
            >
              Get Started Free
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300"
              onClick={() => window.location.href = '/'}
            >
              Learn More
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;
