import { motion } from 'framer-motion';
import { MessageCircle, BarChart3, BookOpen, Shield, Users, Zap } from 'lucide-react';

const features = [
  {
    icon: MessageCircle,
    title: 'AI Conversations',
    description: 'Engage in natural, meaningful conversations with our empathetic AI companion that understands and responds to your emotions.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: BarChart3,
    title: 'Mood Tracking',
    description: 'Gain insights into your emotional patterns with beautiful visualizations and personalized recommendations.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: BookOpen,
    title: 'Smart Journaling',
    description: 'Express yourself freely with our intelligent journal that helps you reflect and grow through guided prompts.',
    color: 'from-amber-500 to-orange-500'
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data stays yours. We use end-to-end encryption and never share your personal information.',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    icon: Users,
    title: '24/7 Support',
    description: 'Your AI companion is always available whenever you need someone to talk to, day or night.',
    color: 'from-rose-500 to-pink-500'
  },
  {
    icon: Zap,
    title: 'Mindfulness Tools',
    description: 'Access guided meditations, breathing exercises, and relaxation techniques to reduce stress and anxiety.',
    color: 'from-indigo-500 to-blue-500'
  }
];

const Features = () => {
  return (
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
              className="group relative bg-white dark:bg-gray-800/50 rounded-2xl p-6 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700/50"
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
  );
};

export default Features;
