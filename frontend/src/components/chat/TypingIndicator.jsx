import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-1.5 h-6 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full w-fit">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full"
          animate={{
            y: ['0%', '-70%', '0%'],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
          style={{
            boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)',
          }}
        />
      ))}
    </div>
  );
};

export default TypingIndicator;
