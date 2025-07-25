import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, RotateCcw, Wind } from 'lucide-react';

const BreathingExercise = ({ isOpen, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('inhale'); // 'inhale', 'hold', 'exhale'
  const [count, setCount] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState('478'); // Default 4-7-8 breathing
  const intervalRef = useRef(null);

  const breathingPatterns = {
    '478': {
      name: '4-7-8 Breathing',
      description: 'Inhale for 4, hold for 7, exhale for 8 seconds',
      inhale: 4,
      hold: 7,
      exhale: 8,
      color: 'from-blue-400 to-cyan-500'
    },
    'box': {
      name: 'Box Breathing',
      description: 'Inhale, hold, exhale, hold - each for 4 seconds',
      inhale: 4,
      hold: 4,
      exhale: 4,
      holdAfterExhale: 4,
      color: 'from-green-400 to-teal-500'
    },
    'calm': {
      name: 'Calming Breath',
      description: 'Inhale for 4, exhale for 6 seconds',
      inhale: 4,
      hold: 0,
      exhale: 6,
      color: 'from-purple-400 to-pink-500'
    }
  };

  const currentPattern = breathingPatterns[selectedPattern];

  useEffect(() => {
    if (isActive) {
      const totalDuration = getTotalDuration();
      
      intervalRef.current = setInterval(() => {
        setCount(prev => {
          const newCount = prev + 1;
          
          if (newCount >= totalDuration) {
            // Complete cycle
            setCycle(c => c + 1);
            return 0;
          }
          
          // Update phase based on count
          updatePhase(newCount);
          return newCount;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, selectedPattern]);

  const getTotalDuration = () => {
    const pattern = currentPattern;
    return pattern.inhale + pattern.hold + pattern.exhale + (pattern.holdAfterExhale || 0);
  };

  const updatePhase = (count) => {
    const pattern = currentPattern;
    
    if (count < pattern.inhale) {
      setPhase('inhale');
    } else if (count < pattern.inhale + pattern.hold) {
      setPhase('hold');
    } else if (count < pattern.inhale + pattern.hold + pattern.exhale) {
      setPhase('exhale');
    } else {
      setPhase('holdAfterExhale');
    }
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return 'Breathe In';
      case 'hold': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'holdAfterExhale': return 'Hold';
      default: return 'Ready';
    }
  };

  const getPhaseInstruction = () => {
    switch (phase) {
      case 'inhale': return 'Slowly inhale through your nose';
      case 'hold': return 'Hold your breath gently';
      case 'exhale': return 'Slowly exhale through your mouth';
      case 'holdAfterExhale': return 'Rest and prepare for the next breath';
      default: return 'Click play to start your breathing exercise';
    }
  };

  const getCurrentPhaseCount = () => {
    const pattern = currentPattern;
    
    if (count < pattern.inhale) {
      return pattern.inhale - count;
    } else if (count < pattern.inhale + pattern.hold) {
      return pattern.hold - (count - pattern.inhale);
    } else if (count < pattern.inhale + pattern.hold + pattern.exhale) {
      return pattern.exhale - (count - pattern.inhale - pattern.hold);
    } else if (pattern.holdAfterExhale) {
      return pattern.holdAfterExhale - (count - pattern.inhale - pattern.hold - pattern.exhale);
    }
    return 0;
  };

  const handleStart = () => {
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setCount(0);
    setCycle(0);
    setPhase('inhale');
  };

  const getCircleScale = () => {
    const pattern = currentPattern;
    const totalDuration = getTotalDuration();
    const progress = count / totalDuration;
    
    if (phase === 'inhale') {
      return 0.5 + (count / pattern.inhale) * 0.5;
    } else if (phase === 'exhale') {
      const exhaleStart = pattern.inhale + pattern.hold;
      const exhaleProgress = (count - exhaleStart) / pattern.exhale;
      return 1 - exhaleProgress * 0.5;
    } else {
      return phase === 'hold' ? 1 : 0.5;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-xl w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg">
                <Wind className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Breathing Exercise
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Pattern Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Choose a breathing pattern:
            </label>
            <div className="space-y-2">
              {Object.entries(breathingPatterns).map(([key, pattern]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedPattern(key);
                    handleReset();
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedPattern === key
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {pattern.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {pattern.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Breathing Circle */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-48 h-48 flex items-center justify-center mb-4">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-600 opacity-30"></div>
              
              {/* Animated breathing circle */}
              <motion.div
                animate={{
                  scale: getCircleScale(),
                }}
                transition={{
                  duration: 1,
                  ease: "easeInOut"
                }}
                className={`w-32 h-32 rounded-full bg-gradient-to-br ${currentPattern.color} shadow-lg flex items-center justify-center`}
              >
                <div className="text-center text-white">
                  <div className="text-2xl font-bold">
                    {getCurrentPhaseCount()}
                  </div>
                  <div className="text-sm opacity-90">
                    {getPhaseText()}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Instructions */}
            <div className="text-center mb-4">
              <div className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {getPhaseText()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {getPhaseInstruction()}
              </div>
            </div>

            {/* Cycle counter */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Cycle: {cycle}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={isActive ? handlePause : handleStart}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-colors"
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isActive ? 'Pause' : 'Start'}</span>
            </button>
            
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Tips for better breathing:
            </h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Find a comfortable, quiet place to sit or lie down</li>
              <li>• Keep your shoulders relaxed and spine straight</li>
              <li>• Focus on the rhythm and let your mind be present</li>
              <li>• Practice regularly for best results</li>
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BreathingExercise;
