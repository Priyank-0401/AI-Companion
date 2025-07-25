import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Activity, MessageSquare, BookOpen, Sparkle, Zap, Heart } from 'lucide-react';
import { useTheme } from '../../contexts/useTheme';

const steps = [
  {
    icon: User,
    title: '3D Avatar Companion',
    description: 'Interact with our lifelike 3D avatar that responds naturally to your emotions and conversations in real-time.',
    color: 'from-blue-500 to-indigo-600',
    iconColor: 'text-blue-500',
    illustration: (
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Ambient glow effects */}
        <div className="absolute w-32 h-32 rounded-full bg-blue-500/20 blur-2xl animate-pulse"></div>
        
        {/* Main avatar container */}
        <div className="relative z-10 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          {/* 3D Avatar Display */}
          <div className="relative w-full aspect-square bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl overflow-hidden">
            
            {/* 3D Avatar */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Avatar head with 3D styling */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 via-indigo-500 to-blue-600 flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  {/* Face */}
                  <div className="relative">
                    {/* Eyes */}
                    <div className="flex space-x-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    </div>
                    {/* Smile */}
                    <div className="w-3 h-1.5 border-b-2 border-white rounded-full"></div>
                  </div>
                </div>
                
                {/* Body */}
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2">
                  <div className="w-10 h-8 rounded-t-xl bg-gradient-to-b from-blue-300 to-blue-500 shadow-md"></div>
                </div>
              </div>
            </div>
            
            {/* Status indicators */}
            <div className="absolute top-2 right-2">
              <div className="bg-green-500 w-3 h-3 rounded-full animate-pulse shadow-lg"></div>
            </div>
            
            <div className="absolute top-2 left-2">
              <Heart className="w-4 h-4 text-pink-500 animate-pulse" />
            </div>
          </div>
          
          {/* Info panel below avatar */}
          <div className="mt-3 text-center">
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Seriva AI</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center mt-1">
              <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
              Active & Ready
            </div>
          </div>
          
          {/* Control buttons */}
          <div className="flex justify-center space-x-2 mt-3">
            <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <MessageSquare className="w-3 h-3" />
            </div>
            <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400">
              <Activity className="w-3 h-3" />
            </div>
            <div className="p-1.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
              <Sparkle className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: Activity,
    title: 'Emotion Detection',
    description: 'Our advanced AI analyzes your voice, facial expressions, and text to understand your emotional state with precision.',
    color: 'from-purple-500 to-pink-500',
    iconColor: 'text-purple-500',
    illustration: (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute w-32 h-32 rounded-full bg-purple-500/10 blur-xl"></div>
        <div className="relative z-10 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 w-full">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Detected Moods</div>
          <div className="space-y-2">
            {[
              { mood: 'Happiness', value: 85, color: 'bg-green-400' },
              { mood: 'Calm', value: 72, color: 'bg-blue-400' },
              { mood: 'Energy', value: 64, color: 'bg-yellow-400' },
              { mood: 'Focus', value: 53, color: 'bg-purple-400' },
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{item.mood}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  },
  {
    icon: MessageSquare,
    title: 'AI Chat & Support',
    description: 'Engage in meaningful conversations with our AI that understands context and provides empathetic responses.',
    color: 'from-green-500 to-teal-500',
    iconColor: 'text-green-500',
    illustration: (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute w-32 h-32 rounded-full bg-green-500/10 blur-xl"></div>
        <div className="relative z-10 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 w-full">
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-blue-500" />
              </div>
              <div className="text-sm bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg rounded-tl-none">
                I've been feeling really stressed about work lately...
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-3 h-3 text-green-500" />
              </div>
              <div className="text-sm bg-green-50 dark:bg-green-900/10 px-3 py-2 rounded-lg rounded-tl-none">
                I understand. Would you like to try a quick breathing exercise to help you relax?
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: BookOpen,
    title: 'Reflective Journaling',
    description: 'Document your thoughts and track your emotional journey with our intelligent journaling system.',
    color: 'from-amber-500 to-orange-500',
    iconColor: 'text-amber-500',
    illustration: (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute w-32 h-32 rounded-full bg-amber-500/10 blur-xl"></div>
        <div className="relative z-10 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Today's Journal</div>
            <div className="text-xs text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">Draft</div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full"></div>
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full w-5/6"></div>
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full w-4/6"></div>
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full w-3/4"></div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <BookOpen className="w-3 h-3 text-amber-500" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">2 min read</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Just now</div>
          </div>
        </div>
      </div>
    )
  }
];

const HowItWorks = () => {
  const { isDark } = useTheme();
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className={`py-20 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200 mb-4">
              Simple & Effective
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Experience emotional support in just a few simple steps
            </p>
          </motion.div>
        </div>

        <div className="lg:hidden mb-12">
          <div className="flex overflow-x-auto pb-4 space-x-4 snap-x snap-mandatory">
            {steps.map((step, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`flex-shrink-0 px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeStep === index
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {step.title}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          {/* Desktop timeline */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-200 to-purple-200 dark:from-indigo-900/30 dark:to-purple-900/30 -ml-px"></div>
          
          <div className="space-y-12 lg:space-y-16">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex flex-col lg:flex-row items-center ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } ${activeStep !== index ? 'hidden lg:flex' : ''}`}
              >
                {/* Content */}
                <div className={`w-full lg:w-1/2 ${
                  index % 2 === 0 ? 'lg:pr-12' : 'lg:pl-12'
                }`}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="inline-block"
                  >
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${step.color} mb-4 text-white`}>
                      <step.icon className="w-6 h-6" />
                    </div>
                  </motion.div>
                  
                  <motion.h3 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="text-xl font-bold text-gray-900 dark:text-white mb-3"
                  >
                    {step.title}
                  </motion.h3>
                  
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-gray-600 dark:text-gray-300 mb-6 lg:mb-0"
                  >
                    {step.description}
                  </motion.p>
                  
                  {index === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="mt-6"
                    >
                      <a 
                        href="/signup" 
                        className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200"
                      >
                        Get Started Now
                        <Zap className="w-4 h-4 ml-2" />
                      </a>
                    </motion.div>
                  )}
                </div>

                {/* Timeline dot */}
                <div className={`hidden lg:flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-900 absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10`}>
                  <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${step.color}`}></div>
                </div>

                {/* Step number for mobile */}
                <div className="lg:hidden absolute -left-2 -top-2 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-lg">
                  {index + 1}
                </div>

                {/* Illustration */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={`w-full lg:w-5/12 mt-8 lg:mt-0 ${
                    index % 2 === 0 ? 'lg:pl-12' : 'lg:pr-12'
                  }`}
                >
                  <div className={`relative bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/50 opacity-90"></div>
                    <div className="relative z-10">
                      {step.illustration}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
          
          {/* Mobile step indicators */}
          <div className="lg:hidden mt-12 flex justify-center space-x-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  activeStep === index 
                    ? 'bg-indigo-600 w-6' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
