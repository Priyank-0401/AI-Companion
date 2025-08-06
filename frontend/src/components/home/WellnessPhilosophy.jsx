import { motion } from 'framer-motion';
import { Heart, Shield, Zap } from 'lucide-react';
import { useTheme } from '../../contexts/useTheme';

const WellnessPhilosophy = () => {
  const { isDark } = useTheme();
  
  const principles = [
    {
      icon: Heart,
      title: 'Compassionate Support',
      description: 'We believe emotional wellness should be approached with kindness, empathy, and understanding. Seriva provides a safe space where you can express yourself without judgment.'
    },
    {
      icon: Shield,
      title: 'Non-Gamified Experience',
      description: 'Unlike other apps that turn mental health into a game, we focus on genuine self-reflection and personal growth without points, streaks, or competition.'
    },
    {
      icon: Zap,
      title: 'Calm & Intuitive',
      description: 'Our interface is designed to be calming and distraction-free, allowing you to focus on what matters most - your mental wellbeing.'
    }
  ];

  return (
    <section className={`py-20 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Our Wellness Philosophy
          </h2>
          <p className={`text-lg md:text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
            At Seriva, we believe mental wellness should be approached with compassion, authenticity, and respect for your individual journey.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {principles.map((principle, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`rounded-2xl p-8 shadow-lg ${isDark ? 'bg-gray-700' : 'bg-white'}`}
            >
              <div className="flex justify-center mb-6">
                <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                  <principle.icon className="h-8 w-8" />
                </div>
              </div>
              <h3 className={`text-xl font-bold mb-4 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {principle.title}
              </h3>
              <p className={`text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {principle.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mt-16 text-center"
        >
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'} italic`}>
            "We're not just building an app - we're creating a compassionate companion that supports your mental wellness journey with respect, authenticity, and care."
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default WellnessPhilosophy;
