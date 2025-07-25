import React from 'react';
import { motion } from 'framer-motion';

const sentimentColors = {
  positive: 'rgba(255, 215, 0, 0.15)',   // Gold
  neutral: 'rgba(173, 216, 230, 0.1)',  // Light Blue
  negative: 'rgba(138, 43, 226, 0.12)',  // Blue-Violet
};

const getSentimentColor = (score) => {
  if (score > 1) return sentimentColors.positive;
  if (score < -1) return sentimentColors.negative;
  return sentimentColors.neutral;
};

export const ChatBackground = ({ sentimentScore = 0 }) => {
  const color = getSentimentColor(sentimentScore);

  return (
    <motion.div
      className="absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <motion.div
        className="absolute inset-0"
        animate={{ backgroundColor: color }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[150%] rounded-full"
        style={{ 
          background: `radial-gradient(circle, ${color} 0%, transparent 60%)`
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.div>
  );
};
