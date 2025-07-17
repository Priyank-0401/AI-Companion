import React from 'react';
import { motion } from 'framer-motion';
import { Smile, Frown, Meh, Laugh, Angry } from 'lucide-react';

const moods = [
  { name: 'Awful', icon: <Frown size={40} />, value: 1, color: 'text-red-500' },
  { name: 'Bad', icon: <Angry size={40} />, value: 2, color: 'text-orange-500' },
  { name: 'Okay', icon: <Meh size={40} />, value: 3, color: 'text-yellow-500' },
  { name: 'Good', icon: <Smile size={40} />, value: 4, color: 'text-green-500' },
  { name: 'Great', icon: <Laugh size={40} />, value: 5, color: 'text-teal-500' },
];

const MoodTracker = ({ onMoodSubmit }) => {
  if (!onMoodSubmit) {
    return null; // Or a disabled state
  }

  return (
    <div className="flex items-center justify-around w-full space-x-2 md:space-x-4">
      {moods.map((mood, index) => (
        <motion.div
          key={mood.name}
          whileHover={{ scale: 1.1, y: -5 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center cursor-pointer group"
          onClick={() => onMoodSubmit(mood.value)}
        >
          <div className={`p-3 rounded-full transition-colors duration-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-700 ${mood.color}`}>
            {mood.icon}
          </div>
          <span className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {mood.name}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export default MoodTracker;
