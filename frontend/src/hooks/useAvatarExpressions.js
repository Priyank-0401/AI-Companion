import { useState, useEffect, useRef, useCallback } from 'react';
import { analyzeTextForExpression, ExpressionManager } from '../utils/expressionUtils';

/**
 * Custom hook for managing avatar expressions based on chatbot responses
 * @param {boolean} isTalking - Whether the avatar is currently talking
 * @param {string} lastMessage - The most recent chatbot message
 * @param {object} options - Configuration options
 * @returns {object} - Expression state and controls
 */
export const useAvatarExpressions = (isTalking, lastMessage, options = {}) => {
  const {
    enableAutoExpression = true,
    enableBlinking = true,
    expressionDuration = 3000,
    blinkInterval = [2000, 5000], // Min and max blink interval
    lipSyncEnabled = false
  } = options;

  const [currentExpression, setCurrentExpression] = useState('neutral');
  const [isBlinking, setIsBlinking] = useState(false);
  const expressionManager = useRef(new ExpressionManager());
  const blinkTimer = useRef(null);
  const expressionTimer = useRef(null);

  // Analyze message for expression
  const analyzeMessage = useCallback((message) => {
    if (!enableAutoExpression || !message) return 'neutral';
    
    return analyzeTextForExpression(message);
  }, [enableAutoExpression]);

  // Handle new messages
  useEffect(() => {
    if (lastMessage && enableAutoExpression) {
      const detectedExpression = analyzeMessage(lastMessage);
      
      if (detectedExpression !== 'neutral') {
        // Queue the expression
        expressionManager.current.queueExpression(
          detectedExpression, 
          expressionDuration, 
          2 // Higher priority than blinking
        );
        
        // Apply the expression
        setCurrentExpression(detectedExpression);
        
        // Clear any existing timer
        if (expressionTimer.current) {
          clearTimeout(expressionTimer.current);
        }
        
        // Return to neutral after duration
        expressionTimer.current = setTimeout(() => {
          setCurrentExpression('neutral');
        }, expressionDuration);
      }
    }
  }, [lastMessage, analyzeMessage, expressionDuration, enableAutoExpression]);

  // Automatic blinking system
  useEffect(() => {
    if (!enableBlinking) return;

    const scheduleBlink = () => {
      const [minInterval, maxInterval] = blinkInterval;
      const interval = minInterval + Math.random() * (maxInterval - minInterval);
      
      blinkTimer.current = setTimeout(() => {
        // Only blink if not in the middle of another expression
        if (currentExpression === 'neutral' && Math.random() < 0.7) {
          setIsBlinking(true);
          setCurrentExpression('blink');
          
          // End blink quickly
          setTimeout(() => {
            setIsBlinking(false);
            setCurrentExpression('neutral');
          }, 150);
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
  }, [enableBlinking, blinkInterval, currentExpression]);

  // Manual expression control
  const setExpression = useCallback((expression, duration = expressionDuration) => {
    setCurrentExpression(expression);
    
    if (expressionTimer.current) {
      clearTimeout(expressionTimer.current);
    }
    
    if (expression !== 'neutral') {
      expressionTimer.current = setTimeout(() => {
        setCurrentExpression('neutral');
      }, duration);
    }
  }, [expressionDuration]);

  // Clear all expressions and return to neutral
  const resetExpression = useCallback(() => {
    setCurrentExpression('neutral');
    setIsBlinking(false);
    expressionManager.current.clearQueue();
    
    if (expressionTimer.current) {
      clearTimeout(expressionTimer.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (blinkTimer.current) {
        clearTimeout(blinkTimer.current);
      }
      if (expressionTimer.current) {
        clearTimeout(expressionTimer.current);
      }
    };
  }, []);

  return {
    currentExpression,
    isBlinking,
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
