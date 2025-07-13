import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for speech recognition functionality
 * @param {Object} options - Configuration options
 * @param {boolean} [options.continuous=true] - Whether to listen continuously
 * @param {string} [options.lang='en-US'] - Language for speech recognition
 * @param {number} [options.confidenceThreshold=0.8] - Minimum confidence score (0-1) to accept a result
 * @returns {Object} Speech recognition state and methods
 */
const useSpeechRecognition = (options = {}) => {
  const {
    continuous = true,
    lang = 'en-US',
    confidenceThreshold = 0.8,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [lastFinalTranscript, setLastFinalTranscript] = useState('');
  
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = lang;
    
    recognitionRef.current = recognition;
    setIsAvailable(true);

    // Set up event handlers
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      let hasHighConfidenceFinal = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript || '';
        const isFinal = result.isFinal;
        const confidence = result[0]?.confidence || 0;

        if (isFinal && confidence >= confidenceThreshold) {
          finalTranscript += text;
          hasHighConfidenceFinal = true;
        } else if (!isFinal) {
          interimTranscript += text;
        }
      }

      if (hasHighConfidenceFinal) {
        setFinalTranscript(prev => prev + finalTranscript);
        setLastFinalTranscript(finalTranscript);
        setTranscript('');
      } else {
        setTranscript(interimTranscript);
      }

      // Reset silence timer on speech activity
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      
      // Set a timer to detect end of speech (1 second of silence)
      silenceTimerRef.current = setTimeout(() => {
        if (finalTranscript && !continuous) {
          stopListening();
        }
      }, 1000);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        // Restart recognition if still supposed to be listening
        startListening();
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [continuous, lang, confidenceThreshold]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isAvailable) {
      setError('Speech recognition is not available');
      return false;
    }

    if (isListening) return true;

    try {
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
      return true;
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError(`Failed to start: ${err.message}`);
      setIsListening(false);
      return false;
    }
  }, [isAvailable, isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!isListening || !recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
      setError(`Error stopping: ${err.message}`);
    }
  }, [isListening]);

  // Toggle listening state
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
    setLastFinalTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    finalTranscript,
    lastFinalTranscript,
    error,
    isAvailable,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
};

export default useSpeechRecognition;
