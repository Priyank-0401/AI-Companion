import React from 'react';
import MoodTracker from '../MoodTracker';

const MoodTrackerCard = ({ onMoodSubmit }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 h-full flex flex-col">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">How are you feeling today?</h2>
      <div className="flex-grow flex items-center justify-center">
        <MoodTracker onMoodSubmit={onMoodSubmit} />
      </div>
    </div>
  );
};

export default MoodTrackerCard;
