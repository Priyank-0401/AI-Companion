import { MessageSquare, PenSquare, Wind, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import BreathingExercise from './BreathingExercise';

const QuickAction = ({ icon: Icon, title, description, color, onClick }) => {
  const colors = {
    indigo: 'from-indigo-500 to-indigo-600',
    purple: 'from-purple-500 to-purple-600',
    teal: 'from-teal-500 to-teal-600',
    pink: 'from-pink-500 to-pink-600',
  };

  const bgColors = {
    indigo: 'bg-indigo-100 dark:bg-indigo-900/20',
    purple: 'bg-purple-100 dark:bg-purple-900/20',
    teal: 'bg-teal-100 dark:bg-teal-900/20',
    pink: 'bg-pink-100 dark:bg-pink-900/20',
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl p-5 text-left transition-all ${bgColors[color]} hover:shadow-md`}
    >
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity" />
      <div className="relative z-10">
        <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${colors[color]} text-white`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
        <div className="mt-3 inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
          Get started
          <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>
    </motion.button>
  );
};

const QuickActions = ({ onAction }) => {
  const navigate = useNavigate();
  const [showBreathingExercise, setShowBreathingExercise] = useState(false);

  const actions = [
    {
      icon: MessageSquare,
      title: 'Talk to AI Companion',
      description: 'Have a conversation with your AI wellness companion',
      color: 'indigo',
      action: 'chat',
      link: '/chat'
    },
    {
      icon: PenSquare,
      title: 'New Journal Entry',
      description: 'Write about your thoughts and feelings',
      color: 'purple',
      action: 'journal',
      link: '/journal'
    },
    {
      icon: Wind,
      title: 'Breathing Exercise',
      description: 'Practice mindful breathing to reduce stress',
      color: 'teal',
      action: 'breathe',
      popup: true
    },
    {
      icon: Video,
      title: 'Avatar Call',
      description: 'Have a face-to-face conversation with your 3D AI companion',
      color: 'pink',
      action: 'avatar-call',
      link: '/avatar-call'
    },
  ];

  const handleAction = (action) => {
    if (action.popup && action.action === 'breathe') {
      setShowBreathingExercise(true);
    } else if (action.link) {
      navigate(action.link);
    } else if (onAction) {
      onAction(action.action);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-5">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <QuickAction
              key={index}
              icon={action.icon}
              title={action.title}
              description={action.description}
              color={action.color}
              onClick={() => handleAction(action)}
            />
          ))}
        </div>
      </div>
      
      {/* Breathing Exercise Popup */}
      <BreathingExercise 
        isOpen={showBreathingExercise}
        onClose={() => setShowBreathingExercise(false)}
      />
    </>
  );
};

export default QuickActions;
