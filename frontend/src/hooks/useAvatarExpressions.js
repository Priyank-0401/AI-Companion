import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { analyzeTextForExpression, ExpressionManager } from '../utils/expressionUtils';
import { useEmotionDetection } from './useEmotionDetection';

// Emotion transition configuration
const EMOTION_INTENSITY = {
  // Subtle transitions (e.g., neutral → slight smile)
  subtle: {
    delay: 250,
    jitter: 0.1, // ±10%
    fadeDuration: 200
  },
  // Moderate transitions (e.g., neutral → sad, sad → comfort)
  moderate: {
    delay: 500,
    jitter: 0.15,
    fadeDuration: 300
  },
  // Strong transitions (e.g., happy → angry, surprised → calm)
  strong: {
    delay: 850,
    jitter: 0.1,
    fadeDuration: 400
  }
};

// Categorize emotions by their intensity
const EMOTION_CATEGORIES = {
  subtle: ['neutral', 'slight_smile', 'thinking'],
  moderate: ['sad', 'happy', 'thinking', 'confused'],
  strong: ['angry', 'surprised', 'excited', 'frustrated']
};

// Helper function to get transition type between two emotions
const getTransitionType = (fromEmotion, toEmotion) => {
  if (fromEmotion === toEmotion) return 'subtle';
  
  const fromStrong = EMOTION_CATEGORIES.strong.includes(fromEmotion);
  const toStrong = EMOTION_CATEGORIES.strong.includes(toEmotion);
  const fromModerate = EMOTION_CATEGORIES.moderate.includes(fromEmotion);
  const toModerate = EMOTION_CATEGORIES.moderate.includes(toEmotion);
  
  // Strong to strong or strong to/from moderate
  if (fromStrong || toStrong || (fromModerate && toModerate)) {
    return 'strong';
  }
  
  // Moderate to/from subtle
  if (fromModerate || toModerate) {
    return 'moderate';
  }
  
  // Subtle to subtle
  return 'subtle';
};

// Helper function to calculate delay with jitter
const getDelayedAction = (baseDelay, jitterFactor) => {
  const jitter = baseDelay * jitterFactor * (Math.random() * 2 - 1); // ±jitter
  return baseDelay + jitter;
};

/**
 * Custom hook for managing avatar expressions with emotion detection
 * @param {boolean} isTalking - Whether the avatar is currently talking
 * @param {string} lastMessage - The most recent chatbot message
 * @param {object} options - Configuration options
 * @returns {object} - Expression state and controls
 */
export const useAvatarExpressions = (
  isTalking = false,
  lastMessage = '',
  options = {}
) => {
  const {
    enableAutoExpression = true,
    enableBlinking = true,
    enableEmotionDetection = true, // New option to enable/disable emotion detection
    expressionDuration = 3000,
    blinkInterval = [2000, 5000], // Min and max blink interval
    lipSyncEnabled = false,
    forceExpression = null,
  } = options;

  // Emotion detection hook
  const { emotion: detectedEmotion, videoRef } = useEmotionDetection({
    enabled: enableEmotionDetection,
    onEmotionDetected: (emotion) => {
      // Only update if we're not forcing an expression and auto expressions are enabled
      if (!forceExpression && enableAutoExpression) {
        handleEmotionChange(emotion);
      }
    }
  });

  const [currentExpression, setCurrentExpression] = useState('neutral');
  const [isBlinking, setIsBlinking] = useState(false);
  const expressionManager = useRef(new ExpressionManager());
  const blinkTimer = useRef(null);
  const expressionTimer = useRef(null);

  // NEW: Handle forced expressions (like greeting smile)
  useEffect(() => {
    if (forceExpression) {
      setCurrentExpression(forceExpression);

      // Clear any existing expression timers when forcing
      if (expressionTimer.current) {
        clearTimeout(expressionTimer.current);
        expressionTimer.current = null;
      }

      // Don't allow auto-expressions while forced
      return;
    }
  }, [forceExpression]);

  // Analyze message for expression
  const analyzeMessage = useCallback((message) => {
    if (!enableAutoExpression || !message) return 'neutral';

    return analyzeTextForExpression(message);
  }, [enableAutoExpression]);

  // Track the current transition timeout
  const transitionTimeout = useRef(null);
  const previousEmotion = useRef('neutral');

  // Clear any pending transitions
  const clearPendingTransition = useCallback(() => {
    if (transitionTimeout.current) {
      clearTimeout(transitionTimeout.current);
      transitionTimeout.current = null;
    }
  }, []);

  // Apply expression with transition
  const applyExpression = useCallback((newEmotion) => {
    // Clear any pending transitions
    clearPendingTransition();
    
    // Skip if no change
    if (newEmotion === currentExpression) return;
    
    // Determine transition type
    const transitionType = getTransitionType(previousEmotion.current, newEmotion);
    const { delay, jitter, fadeDuration } = EMOTION_INTENSITY[transitionType];
    
    // Calculate actual delay with jitter
    const actualDelay = getDelayedAction(delay, jitter);
    
    // Queue the expression with medium priority
    expressionManager.current.queueExpression(
      newEmotion,
      expressionDuration,
      2 // Medium priority
    );
    
    // Schedule the expression change
    transitionTimeout.current = setTimeout(() => {
      // Update the expression with smooth transition
      setCurrentExpression(newEmotion);
      previousEmotion.current = newEmotion;
      
      // Schedule return to neutral if needed
      if (expressionTimer.current) {
        clearTimeout(expressionTimer.current);
      }
      
      if (newEmotion !== 'neutral') {
        expressionTimer.current = setTimeout(() => {
          applyExpression('neutral');
        }, expressionDuration - fadeDuration);
      }
    }, actualDelay);
    
  }, [currentExpression, expressionDuration, clearPendingTransition]);

  // Handle emotion changes from video detection
  const handleEmotionChange = useCallback((emotion) => {
    // Only update if we're not forcing an expression and auto expressions are enabled
    if (forceExpression || !enableAutoExpression) return;
    
    // Apply the new expression with transition
    applyExpression(emotion);
  }, [forceExpression, enableAutoExpression, applyExpression]);

  // Handle new messages - MODIFIED to respect forced expressions and use smooth transitions
  useEffect(() => {
    // Don't run auto expressions if we're forcing an expression
    if (!enableAutoExpression || forceExpression) return;

    if (lastMessage) {
      const detectedExpression = analyzeMessage(lastMessage);

      if (detectedExpression !== 'neutral') {
        // Apply the expression with transition
        applyExpression(detectedExpression);
      }
    }
  }, [lastMessage, analyzeMessage, enableAutoExpression, forceExpression, applyExpression]);

  // Automatic blinking system - MODIFIED to respect forced expressions
  useEffect(() => {
    // Don't blink during forced expressions (like greeting smile)
    if (!enableBlinking || forceExpression === 'smile') {
      return; // Silently disabled
    }

    const scheduleBlink = () => {
      const [minInterval, maxInterval] = blinkInterval;
      const interval = minInterval + Math.random() * (maxInterval - minInterval);

      blinkTimer.current = setTimeout(() => {
        // Allow blinking even with mild expressions, but not during strong emotions
        const allowBlinking = currentExpression === 'neutral' ||
          currentExpression === 'smile' ||
          Math.random() < 0.3; // 30% chance to blink during other expressions

        if (allowBlinking && Math.random() < 0.8) { // Increased probability to 80%
          setIsBlinking(true);

          // Brief blink without changing the main expression
          setTimeout(() => {
            setIsBlinking(false);
          }, 150);
        } else {
        }

        // Schedule next blink
        scheduleBlink();
      }, interval);
    };

    scheduleBlink();

    return () => {
      if (blinkTimer.current) {
        clearTimeout(blinkTimer.current);
      }
    };
  }, [enableBlinking, blinkInterval, currentExpression, forceExpression]);

  // NEW: Reset to neutral when forced expression is removed
  useEffect(() => {
    if (forceExpression === null && currentExpression !== 'neutral' && !isTalking) {
      setCurrentExpression('neutral');
    }
  }, [forceExpression, currentExpression, isTalking]);

  // Manual expression control with smooth transitions
  const setExpression = useCallback((expression, duration = expressionDuration) => {
    // Apply the expression with transition
    applyExpression(expression);
    
    // Update the expression duration
    if (expressionTimer.current) {
      clearTimeout(expressionTimer.current);
    }
    
    if (expression !== 'neutral') {
      expressionTimer.current = setTimeout(() => {
        applyExpression('neutral');
      }, duration);
    }
  }, [expressionDuration, applyExpression]);

  // Clear all expressions and return to neutral
  const resetExpression = useCallback(() => {
    clearPendingTransition();
    setCurrentExpression('neutral');
    previousEmotion.current = 'neutral';
    setIsBlinking(false);
    expressionManager.current.clearQueue();

    if (expressionTimer.current) {
      clearTimeout(expressionTimer.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPendingTransition();
      if (expressionTimer.current) {
        clearTimeout(expressionTimer.current);
      }
      if (blinkTimer.current) {
        clearTimeout(blinkTimer.current);
      }
    };
  }, [clearPendingTransition]);

  return {
    currentExpression,
    isBlinking,
    videoRef, // Expose video ref for the video element
    detectedEmotion, // For debugging purposes
    setExpression,
    resetExpression,
    analyzeMessage
  };
};

/**
 * Hook for managing audio-driven lip sync
 * @param {HTMLAudioElement} audioElement - Audio element to analyze
 * @param {boolean} enabled - Whether lip sync is enabled
 * @returns {object} - Lip sync data and controls
 */
export const useAudioLipSync = (audioElement, enabled = false) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioData, setAudioData] = useState({ volume: 0, frequency: 0 });
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const source = useRef(null);
  const animationFrame = useRef(null);

  // Initialize audio context
  useEffect(() => {
    if (!enabled) return;

    const initAudio = async () => {
      try {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        analyser.current = audioContext.current.createAnalyser();
        analyser.current.fftSize = 256;
        setIsAnalyzing(true);
      } catch (error) {
        console.warn('Audio context initialization failed:', error);
      }
    };

    initAudio();

    return () => {
      if (audioContext.current && audioContext.current.state !== 'closed') {
        audioContext.current.close();
      }
    };
  }, [enabled]);

  // Connect audio element
  useEffect(() => {
    if (!enabled || !audioElement || !audioContext.current || !analyser.current) return;

    try {
      if (source.current) {
        source.current.disconnect();
      }

      source.current = audioContext.current.createMediaElementSource(audioElement);
      source.current.connect(analyser.current);
      analyser.current.connect(audioContext.current.destination);
    } catch (error) {
      console.warn('Failed to connect audio source:', error);
    }
  }, [enabled, audioElement]);

  // Audio analysis loop
  useEffect(() => {
    if (!isAnalyzing || !analyser.current) return;

    const dataArray = new Uint8Array(analyser.current.frequencyBinCount);

    const analyze = () => {
      analyser.current.getByteFrequencyData(dataArray);

      // Calculate volume
      const volume = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length / 255;

      // Find dominant frequency
      const maxIndex = dataArray.indexOf(Math.max(...dataArray));
      const frequency = (maxIndex / dataArray.length) * (audioContext.current.sampleRate / 2);

      setAudioData({ volume, frequency });

      animationFrame.current = requestAnimationFrame(analyze);
    };

    analyze();

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [isAnalyzing]);

  const stopAnalysis = useCallback(() => {
    setIsAnalyzing(false);
    setAudioData({ volume: 0, frequency: 0 });
  }, []);

  return {
    audioData,
    isAnalyzing,
    stopAnalysis
  };
};