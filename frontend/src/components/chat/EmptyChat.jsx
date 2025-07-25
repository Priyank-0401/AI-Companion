import { motion } from 'framer-motion';
import { MessageSquare, Zap, Sun } from 'lucide-react';

const EmptyChat = ({ onStartConversation, onPopulateInput }) => {
  const starterPrompts = [
    {
      icon: MessageSquare,
      text: 'Let\'s talk about my day',
      prompt: 'I want to talk about how my day went.',
    },
    {
      icon: Zap,
      text: 'Give me a mindfulness exercise',
      prompt: 'Can you give me a short mindfulness exercise to help me relax?',
    },
    {
      icon: Sun,
      text: 'Help me feel more positive',
      prompt: 'I\'m feeling a bit down. Can you help me think about something positive?',
    },
  ];

  return (
        <div className="flex flex-col items-center justify-start h-full text-center p-4 pt-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="max-w-md w-full"
      >
        <img 
          src="/logo.svg" 
          alt="Seriva Logo" 
          className="w-24 h-24 mx-auto mb-6 text-indigo-500"
        />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Hello, I'm Seriva
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          How are you feeling today? I'm here to listen and support you.
        </p>

        <div className="grid grid-cols-1 gap-3">
          {starterPrompts.map((item, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              onClick={() => {
                if (onPopulateInput) {
                  onPopulateInput(item.prompt);
                } else {
                  onStartConversation(item.prompt);
                }
              }}
              className="p-4 bg-white dark:bg-gray-800/50 rounded-lg text-left flex items-center space-x-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 shadow-sm border border-gray-100 dark:border-gray-700/50"
            >
              <item.icon className="w-6 h-6 text-indigo-500 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-200 font-medium">
                {item.text}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default EmptyChat;
