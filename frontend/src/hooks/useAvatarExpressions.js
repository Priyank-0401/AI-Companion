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
  subtle: ['neutral', 'slight_smile', 'thinking', 'content'],
  moderate: ['sad', 'happy', 'thinking', 'confused', 'smile_teeth', 'warm_smile'],
  strong: ['angry', 'surprised', 'excited', 'frustrated', 'big_smile', 'laugh']
};

// Enhanced blinking patterns for realism
const BLINK_PATTERNS = {
  // Normal single blinks
  single: {
    duration: 120,
    probability: 0.7,
    weight: 70
  },
  // Quick double blinks (more natural)
  double: {
    duration: [100, 80], // First blink, pause, second blink
    pause: 150,
    probability: 0.2,
    weight: 20
  },
  // Slow thoughtful blinks
  slow: {
    duration: 200,
    probability: 0.1,
    weight: 10
  }
};

// Smile variations with teeth for realism
const SMILE_EXPRESSIONS = {
  slight_smile: {
    intensity: 0.3,
    showTeeth: false,
    duration: 2000
  },
  smile: {
    intensity: 0.6,
    showTeeth: false,
    duration: 2500
  },
  smile_teeth: {
    intensity: 0.7,
    showTeeth: true,
    duration: 3000
  },
  warm_smile: {
    intensity: 0.8,
    showTeeth: true,
    duration: 3500
  },
  big_smile: {
    intensity: 0.9,
    showTeeth: true,
    duration: 4000
  },
  laugh: {
    intensity: 1.0,
    showTeeth: true,
    duration: 2000,
    animated: true // For laugh animation
  }
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

  // Enhanced message analysis for smile/teeth expressions
  const analyzeMessage = useCallback((message) => {
    if (!enableAutoExpression || !message) return 'neutral';

    const baseExpression = analyzeTextForExpression(message);
    const lowerMessage = message.toLowerCase(); // Define once for entire function scope
    
    // Enhance with smile/teeth variations based on message content
    if (baseExpression === 'happy' || baseExpression === 'smile') {
      
      // Check for laughter indicators
      if (lowerMessage.includes('haha') || lowerMessage.includes('lol') || 
          lowerMessage.includes('😂') || lowerMessage.includes('😄')) {
        return Math.random() > 0.5 ? 'big_smile' : 'laugh';
      }
      
      // Check for warm/positive indicators
      if (lowerMessage.includes('wonderful') || lowerMessage.includes('amazing') || 
          lowerMessage.includes('love') || lowerMessage.includes('great')) {
        return 'warm_smile';
      }
      
      // Check for moderate happiness
      if (lowerMessage.includes('good') || lowerMessage.includes('nice') || 
          lowerMessage.includes('thank') || lowerMessage.includes('😊')) {
        return 'smile_teeth';
      }
      
      // Default to regular smile
      return Math.random() > 0.3 ? 'smile_teeth' : 'smile';
    }
    
    // Check for content/peaceful expressions
    if (lowerMessage.includes('peaceful') || lowerMessage.includes('calm') || 
        lowerMessage.includes('content')) {
      return 'content';
    }
    
    return baseExpression;
  }, [enableAutoExpression]);
  
  // Function to get smile configuration
  const getSmileConfig = useCallback((expression) => {
    return SMILE_EXPRESSIONS[expression] || {
      intensity: 0.5,
      showTeeth: false,
      duration: 2500
    };
  }, []);

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

  // Function to trigger contextual micro-expressions
  const triggerMicroExpression = useCallback((baseExpression) => {
    // Add subtle micro-expressions for realism
    const microExpressions = {
      'neutral': ['slight_smile', 'content'],
      'thinking': ['confused', 'content'],
      'happy': ['warm_smile', 'big_smile']
    };
    
    const options = microExpressions[baseExpression];
    if (options && Math.random() < 0.3) { // 30% chance for micro-expression
      const microExp = options[Math.floor(Math.random() * options.length)];
      setTimeout(() => {
        applyExpression(microExp);
      }, Math.random() * 2000 + 500); // Random delay 0.5-2.5s
    }
  }, [applyExpression]);

  // Handle emotion changes from video detection
  const handleEmotionChange = useCallback((emotion) => {
    // Only update if we're not forcing an expression and auto expressions are enabled
    if (forceExpression || !enableAutoExpression) return;
    
    // Apply the new expression with transition
    applyExpression(emotion);
  }, [forceExpression, enableAutoExpression, applyExpression]);

  // Handle new messages - ENHANCED with micro-expressions and smile variations
  useEffect(() => {
    // Don't run auto expressions if we're forcing an expression
    if (!enableAutoExpression || forceExpression) return;

    if (lastMessage) {
      const detectedExpression = analyzeMessage(lastMessage);

      if (detectedExpression !== 'neutral') {
        // Apply the main expression with transition
        applyExpression(detectedExpression);
        
        // Trigger contextual micro-expressions for added realism
        triggerMicroExpression(detectedExpression);
      }
    }
  }, [lastMessage, analyzeMessage, enableAutoExpression, forceExpression, applyExpression, triggerMicroExpression]);

  // Enhanced realistic blinking system with multiple patterns
  useEffect(() => {
    // Don't blink during forced expressions (like greeting smile)
    if (!enableBlinking || forceExpression === 'smile') {
      return; // Silently disabled
    }

    // Helper function to select blink pattern based on weights
    const selectBlinkPattern = () => {
      const rand = Math.random() * 100;
      if (rand < BLINK_PATTERNS.single.weight) return 'single';
      if (rand < BLINK_PATTERNS.single.weight + BLINK_PATTERNS.double.weight) return 'double';
      return 'slow';
    };

    // Execute a blink with the selected pattern
    const executeBlink = (pattern) => {
      const patternConfig = BLINK_PATTERNS[pattern];
      
      if (pattern === 'double') {
        // Double blink: first blink, pause, second blink
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          // Pause between blinks
          setTimeout(() => {
            setIsBlinking(true);
            setTimeout(() => {
              setIsBlinking(false);
            }, patternConfig.duration[1]);
          }, patternConfig.pause);
        }, patternConfig.duration[0]);
      } else {
        // Single or slow blink
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
        }, patternConfig.duration);
      }
    };

    const scheduleBlink = () => {
      const [minInterval, maxInterval] = blinkInterval;
      // Add more natural variation to blink intervals
      const baseInterval = minInterval + Math.random() * (maxInterval - minInterval);
      // Add micro-variations for more realism
      const microVariation = (Math.random() - 0.5) * 200; // ±100ms
      const interval = Math.max(1000, baseInterval + microVariation);

      blinkTimer.current = setTimeout(() => {
        // Enhanced blinking conditions for more realism
        const isNeutralOrMild = ['neutral', 'slight_smile', 'content', 'thinking'].includes(currentExpression);
        const isSmiling = ['smile', 'smile_teeth', 'warm_smile'].includes(currentExpression);
        const isStrongEmotion = ['angry', 'surprised', 'big_smile', 'laugh'].includes(currentExpression);
        
        let blinkProbability = 0.85; // Base probability
        
        if (isNeutralOrMild) {
          blinkProbability = 0.9; // Higher chance during neutral states
        } else if (isSmiling) {
          blinkProbability = 0.7; // Moderate chance during smiles
        } else if (isStrongEmotion) {
          blinkProbability = 0.4; // Lower chance during strong emotions
        }
        
        // Reduce blinking frequency when talking
        if (isTalking) {
          blinkProbability *= 0.6;
        }

        if (Math.random() < blinkProbability) {
          const selectedPattern = selectBlinkPattern();
          executeBlink(selectedPattern);
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
  }, [clearPendingTransition]);

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
    analyzeMessage,
    // NEW: Enhanced features for realistic expressions
    getSmileConfig, // Get smile configuration with teeth/intensity info
    triggerMicroExpression, // Trigger contextual micro-expressions
    smileExpressions: SMILE_EXPRESSIONS, // Available smile variations
    blinkPatterns: BLINK_PATTERNS // Available blink patterns
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