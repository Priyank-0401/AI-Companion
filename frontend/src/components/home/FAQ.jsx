import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Shield, Lock, MessageCircle, Smartphone, Zap } from 'lucide-react';
import { useTheme } from '../../contexts/useTheme';

const faqs = [
  {
    question: 'Is my data private and secure?',
    answer: 'Absolutely. We take your privacy seriously. All conversations are encrypted end-to-end, and we never share your data with third parties. You have full control over your information and can delete it at any time.',
    icon: <Shield className="w-5 h-5 text-indigo-500" />
  },
  {
    question: 'How does the AI understand my emotions?',
    answer: 'Our AI analyzes various cues in your voice and text, including tone, word choice, and conversation patterns, to better understand your emotional state. It then responds with empathy and support tailored to your needs.',
    icon: <MessageCircle className="w-5 h-5 text-purple-500" />
  },
  {
    question: 'Is this a replacement for therapy?',
    answer: 'While our AI companion provides emotional support and can be a helpful tool for mental wellbeing, it is not a replacement for professional therapy or medical advice. We recommend consulting with a licensed professional for serious mental health concerns.',
    icon: <Zap className="w-5 h-5 text-pink-500" />
  },
  {
    question: 'Can I use this on my phone?',
    answer: 'Yes! Our app is fully responsive and works on all devices. You can access your AI companion from your smartphone, tablet, or computer with an internet connection.',
    icon: <Smartphone className="w-5 h-5 text-blue-500" />
  },
  {
    question: 'How much does it cost?',
    answer: 'We offer a free tier with basic features. For access to advanced features like detailed analytics and premium support, we offer a subscription plan. Check our pricing section for more details.',
    icon: <Lock className="w-5 h-5 text-cyan-500" />
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const { isDark } = useTheme();
  
  return (
    <section className={`py-20 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Everything you need to know about our AI Wellness Companion
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg dark:hover:shadow-xl transition-all duration-200 border border-gray-100 dark:border-gray-700/50 hover:-translate-y-0.5"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left focus:outline-none"
                aria-expanded={openIndex === index}
                aria-controls={`faq-${index}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="mr-4">
                      {faq.icon}
                    </span>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {faq.question}
                    </h3>
                  </div>
                  <motion.span
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-gray-400 dark:text-gray-500"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </motion.span>
                </div>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    id={`faq-${index}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-2 bg-white dark:bg-gray-800">
                      <p className="text-gray-600 dark:text-gray-300 pl-10">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700/50 max-w-3xl mx-auto transition-colors duration-200">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Still have questions?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <a
              href="mailto:priyankpahwa41@gmail.com"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-indigo-700 dark:text-indigo-100 bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800/70 transition-colors duration-200"
            >
              Contact Support
              <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
