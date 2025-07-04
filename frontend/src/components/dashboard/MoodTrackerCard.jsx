import MoodTracker from '../MoodTracker';
import { useAuth } from '../../auth/context/AuthContext';

const MoodTrackerCard = () => {
  const { currentUser } = useAuth();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Check-in</h2>
        <div className="flex items-center text-sm text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          Daily
        </div>
      </div>
      
      <div className="mt-2">
        <MoodTracker userId={currentUser?.uid} />
      </div>
      
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Your mood helps us personalize your experience and track your emotional well-being over time.
      </p>
    </div>
  );
};

export default MoodTrackerCard;
