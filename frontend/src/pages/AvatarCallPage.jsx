import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../services/api';
import Avatar from '../components/AvatarOptimized'; // Import the optimized Avatar component
import { useVolumeLipSync } from '../hooks/useVolumeLipSync'; // Import the volume lip sync hook
import { useEmotionDetection } from '../hooks/useEmotionDetection'; // Import the emotion detection hook
import useSpeechRecognition from '../hooks/useSpeechRecognition';
// Removed expression hook import - keeping it simple
import { 
  Mic, 
  MicOff, 
  MessageSquare,
  Volume1,  
  Volume2,
  VolumeX,
  X,
  Settings,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2, 
  PhoneOff,
  User,
  AlertTriangle,
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
} from 'lucide-react';

import voiceService from '../services/voiceService';

// Debounce helper function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Process user message and get response from the backend
const processUserMessage = async (message, speakText, setError, setIsProcessing, lastProcessedText, currentRequestId, currentEmotion = 'neutral', setMessages, setEmotion, speak) => {
  if (!message || !message.trim()) {
    console.warn('⚠️ Empty message provided to processUserMessage');
    return null;
  }
  
  const trimmedMessage = message.trim();
  console.log('📩 New message to process:', trimmedMessage);
  
  // Generate a unique ID for this request
  const requestId = Date.now().toString();
  if (currentRequestId) {
    currentRequestId.current = requestId;
  }
  
  try {
    setIsProcessing?.(true);
    setError?.('');
    
    console.log('🔍 Processing user message:', { 
      message: trimmedMessage,
      requestId,
      emotion: currentEmotion 
    });

    // Create payload with required fields
    const payload = {
      message: trimmedMessage,
      model: 'llama3-8b-8192',
      style: 'empathetic',
      context: { 
        emotion: currentEmotion,
        timestamp: new Date().toISOString(),
        requestId
      }
    };

    console.log('📤 Sending request to API:', { 
      endpoint: '/api/v1/avatar-call/process',
      payload: JSON.stringify(payload, null, 2) 
    });
    
    // Make the API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${apiClient.baseURL}/api/v1/avatar-call/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiClient.getAuthHeader?.() || {})
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Check for HTTP errors
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP error! status: ${response.status}` };
      }
      const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.details = errorData;
      throw error;
    }
    
    // Parse the response data once
    const responseData = await response.json();
    console.log('API Response:', responseData);
    
    // Handle the response
    if (!responseData) {
      throw new Error('No response data received from server');
    }
    
    // Extract data from the success wrapper if it exists
    let resultData = responseData;
    if (responseData.success && responseData.data) {
      console.log('Extracting data from success wrapper');
      resultData = responseData.data;
    }
    
    // Log the full response for debugging
    console.log('Processed response data:', resultData);
    
    if (!resultData) {
      throw new Error('No valid response data found in the API response');
    }
    
    // Create a message object from the response
    const messageObj = {
      id: resultData.id || `msg-${Date.now()}`,
      role: 'assistant',
      content: resultData.content || resultData.message || 'I apologize, but I could not process your request.',
      context: {
        emotion: resultData.emotion || currentEmotion || 'neutral',
        timestamp: resultData.timestamp || new Date().toISOString(),
        ...(resultData.context || {})
      },
      metadata: {
        model: resultData.model,
        usage: resultData.usage,
        ...(resultData.metadata || {})
      }
    };
    
    // Update messages with the assistant's response
    if (setMessages) {
      setMessages(prev => [...prev, messageObj]);
    }
    
    // Update emotion state if available
    const newEmotion = resultData.emotion || resultData.context?.emotion;
    if (newEmotion && setEmotion) {
      setEmotion(newEmotion);
    }
    
    // Speak the response if speak function is provided
    if (speak && messageObj.content) {
      await speak(messageObj.content);
    }
    
    return messageObj;
    
  } catch (error) {
    console.error('Error in processUserMessage:', error);
    
    const errorMessage = error.response?.data?.message || error.message || 'Sorry, I encountered an error processing your request.';
    console.error('API Error Details:', error.response?.data || error.details || 'No additional details');
    
    if (setError) {
      setError(errorMessage);
    }
    
    // Create a fallback error message
    const errorResponse = {
      id: `error-${Date.now()}`,
      role: 'assistant',
      content: errorMessage,
      context: {
        emotion: 'sad',
        error: true,
        timestamp: new Date().toISOString()
      },
      error: true
    };
    
    // Add to messages if we have a setter
    if (setMessages) {
      setMessages(prev => [...prev, errorResponse]);
    }
    
    // Speak the error message if we have text to speech
    if (speakText && errorMessage) {
      await speakText(errorMessage);
    }
    
    return errorResponse;
    
  } finally {
    if (currentRequestId?.current === requestId) {
      setIsProcessing?.(false);
    }
  }
};

const AvatarCallPage = () => {
  // Refs
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const currentRequestId = useRef(null);
  const isProcessingRef = useRef(false);
  const lastProcessedText = useRef('');
  const lastRequestTime = useRef(0);
  const isInitialized = useRef(false);
  const REQUEST_COOLDOWN = 2000; // 2 seconds cooldown between requests
  
  // Speech recognition hook
  const {
    isListening,
    transcript,
    finalTranscript,
    error: speechError,
    isAvailable: isSpeechAvailable,
    startListening,
    stopListening,
    toggleListening: toggleSpeechRecognition,
    resetTranscript
  } = useSpeechRecognition({
    continuous: true,
    lang: 'en-US',
    confidenceThreshold: 0.8
  });
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Call State
  const [isCallActive, setIsCallActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [lastMessage, setLastMessage] = useState(null);
  
  // Handle final transcript changes
  useEffect(() => {
    if (finalTranscript) {
      console.log('Final transcript received:', finalTranscript);
      setRecognizedText(finalTranscript);
      
      // Process the final transcript if we're in a call and not already processing
      if (isCallActive && !isProcessing) {
        handleProcessText(finalTranscript);
      }
    }
  }, [finalTranscript, isCallActive, isProcessing]);

  // Handle speech recognition errors
  useEffect(() => {
    if (speechError) {
      console.error('Speech recognition error:', speechError);
      setError(`Speech recognition error: ${speechError}`);
    }
  }, [speechError]);

  // Handle when voice playback ends
  const handleVoiceEnd = useCallback(() => {
    console.log('Voice playback ended');
    setIsSpeaking(false);
    // Reset lip-sync animation
    if (volumeLipSyncRef.current) {
      volumeLipSyncRef.current.reset();
    }
  }, []);
  
  // Audio State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [delayedIsSpeaking, setDelayedIsSpeaking] = useState(false);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [systemVolume, setSystemVolume] = useState(80);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const audioElement = useRef(null);
  const volumeLipSyncRef = useRef(null);
  
  // Emotion state for avatar expressions
  const [emotion, setEmotion] = useState('neutral');
  
  // Camera state for emotion detection
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  // Track the last emotion that was displayed
  const lastDisplayedEmotion = useRef('neutral');
  
  // Emotion detection - starts with camera 
  const {
    videoRef: emotionVideoRef,
    isReady: isEmotionDetectionReady,
    hasCameraAccess,
    error: emotionError,
    isDetecting: isEmotionDetectionActive,
    emotion: currentEmotion,
    detectEmotions,
    areModelsLoaded,
    loadModels,
    startVideo,
    stopVideo
  } = useEmotionDetection({
    enabled: isCameraEnabled, // Only enable when camera is on
    onEmotionDetected: (emotion) => {
      // Only log and update if the emotion has changed
      if (emotion !== lastDisplayedEmotion.current) {
        console.log(`[${new Date().toISOString()}] Detected emotion:`, emotion);
        lastDisplayedEmotion.current = emotion;
        setEmotion(emotion);
      }
    },
  });

  // Create a separate ref for the preview video
  const previewVideoRef = useRef(null);
  
  // Handle camera toggle
  const handleToggleCamera = useCallback(async () => {
    try {
      const newCameraState = !isCameraEnabled;
      
      // If turning on, ensure models are loaded first
      if (newCameraState) {
        if (!areModelsLoaded()) {
          console.log('Loading models...');
          const loaded = await loadModels();
          if (!loaded) {
            console.error('Failed to load models');
            return;
          }
        }
        
        // Start video
        const success = await startVideo();
        if (success && emotionVideoRef.current && emotionVideoRef.current.srcObject) {
          // Get the stream from the emotion detection video element
          const stream = emotionVideoRef.current.srcObject;
          
          // Stop any existing tracks in the preview
          if (previewVideoRef.current && previewVideoRef.current.srcObject) {
            const oldStream = previewVideoRef.current.srcObject;
            const tracks = oldStream.getTracks();
            tracks.forEach(track => track.stop());
          }
          
          // Set the preview source to the same stream
          if (previewVideoRef.current) {
            previewVideoRef.current.srcObject = stream;
            previewVideoRef.current.play().catch(err => {
              console.error('Error playing preview video:', err);
            });
          }
        }
      } else {
        // Stop video (this will also stop detection)
        await stopVideo();
        
        // Stop preview tracks
        if (previewVideoRef.current && previewVideoRef.current.srcObject) {
          const stream = previewVideoRef.current.srcObject;
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
          previewVideoRef.current.srcObject = null;
        }
      }
      
      // Update camera state
      setIsCameraEnabled(newCameraState);
    } catch (error) {
      console.error('Error toggling camera:', error);
      setError(error.message || 'Failed to toggle camera');
    }
  }, [isCameraEnabled, areModelsLoaded, loadModels, startVideo, stopVideo]);
  
  // Update preview video source when stream changes
  useEffect(() => {
    if (previewVideoRef.current && emotionVideoRef?.current?.srcObject) {
      previewVideoRef.current.srcObject = emotionVideoRef.current.srcObject;
      previewVideoRef.current.play().catch(err => {
        console.error('Error playing preview video:', err);
      });
    }
  }, [emotionVideoRef?.current?.srcObject]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    await handleToggleCamera();
  }, [handleToggleCamera]);

  // Cleanup video streams on unmount
  useEffect(() => {
    return () => {
      // Clean up emotion detection video
      if (emotionVideoRef.current) {
        const stream = emotionVideoRef.current.srcObject;
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
        }
      }
      // Clean up preview video
      if (previewVideoRef.current) {
        const stream = previewVideoRef.current.srcObject;
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
          previewVideoRef.current.srcObject = null;
        }
      }
    };
  }, [emotionVideoRef, previewVideoRef]);

  // Handle text-to-speech functionality
  const speakText = useCallback(async (text) => {
    if (!text) {
      console.error('Cannot speak: no text provided');
      return false;
    }
    
    // Skip if we're already processing this text
    if (isProcessingRef.current) {
      console.log('Skipping duplicate speak request:', text);
      return false;
    }
    
    if (!voiceEnabled) {
      console.log('Voice was disabled, enabling now...');
      setVoiceEnabled(true);
    }

    console.log('🔊 Starting to speak text:', text);
    
    // Set voice if available
    if (selectedVoice) {
      console.log('🎙️ Setting voice to:', selectedVoice.displayName);
      voiceService.setVoice(selectedVoice);
    }

    try {
      isProcessingRef.current = true;
      
      // Use the voiceService to speak the text
      await voiceService.speak(text, {
        onStart: () => {
          console.log('🎤 Speech started, starting talking animation');
          setIsSpeaking(true);
        },
        onEnd: () => {
          console.log('✅ Speech ended');
          setIsSpeaking(false);
          isProcessingRef.current = false;
          lastProcessedText.current = ''; // Reset after completion
        },
        onError: (error) => {
          console.error('❌ Error in speech synthesis:', error);
          setIsSpeaking(false);
          isProcessingRef.current = false;
          lastProcessedText.current = ''; // Reset on error
          setError('Failed to speak the response. Please check your audio settings.');
        }
      });
      return true;
    } catch (error) {
      console.error('❌ Error in speakText:', error);
      setIsSpeaking(false);
      setError('Failed to speak the response. Please check your audio settings.');
      return false;
    }
  }, [voiceEnabled, selectedVoice, setError]);

  // Volume lip sync integration
  const { 
    currentVolume: lipSyncVolume, 
    isAnalyzing: lipSyncActive, 
    setupVolumeAnalysis,
    startVolumeAnalysis: startLipSync, 
    stopVolumeAnalysis: stopLipSync 
  } = useVolumeLipSync();
  
  // Removed greeting and expression management - keeping it simple  // Memoize format duration function to prevent re-creation

  // useEffect(() => {
  //   // Simulate loading
  //   const timer = setTimeout(() => {
  //     setIsLoading(false);
  //     // Simulate an error for demonstration if needed
  //     // setError("Could not connect to the avatar service. Please try again later.");
  //   }, 2500);
  //   return () => clearTimeout(timer);
  // }, []);  // Removed greeting functionality - keeping it simple

  // Memoize toggle functions to prevent unnecessary re-renders
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    // Update the actual volume in the audio context if needed
    if (audioContextRef.current && audioContextRef.current.gain) {
      audioContextRef.current.gain.gain.value = isMuted ? systemVolume / 100 : 0;
    }
  }, [isMuted, systemVolume]);

  const selectVoice = useCallback((voice) => {
    setSelectedVoice(voice);
    setShowVoiceSelector(false);
    
    // Test the selected Azure Neural voice with a sample phrase
    if (voiceEnabled && voice) {
      // Import and use the voice service for testing
      import('../services/voiceService').then(({ default: voiceService }) => {
        voiceService.testVoice(voice, "Hello! I'm Seriva. This is how I sound with Azure Neural TTS.")
          .then(() => {
            console.log('✅ Voice test completed successfully');
          })
          .catch(error => {
            console.error('❌ Voice test failed:', error);
          });
      });
    }
    
    console.log('🎵 Selected Azure Neural voice:', voice.displayName, '(' + voice.name + ')');
  }, [voiceEnabled]);
  // Start recognition function with retry logic
  const startRecognition = useCallback(async () => {
    console.log('🚀 Starting speech recognition...');
    
    const recognition = recognitionRef.current;
    if (!recognition) {
      console.error('❌ Speech recognition not initialized');
      setError('Speech recognition not initialized. Please refresh the page and try again.');
      return false;
    }

    // Check microphone permissions first
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
      console.log('🎤 Microphone permission state:', permissionStatus.state);
      
      if (permissionStatus.state === 'denied') {
        const errorMsg = 'Microphone access was denied. Please allow microphone access in your browser settings.';
        console.error('❌', errorMsg);
        setError(errorMsg);
        setVoiceEnabled(false);
        return false;
      }
      
      // Listen for permission changes
      permissionStatus.onchange = () => {
        console.log('🎤 Microphone permission changed to:', permissionStatus.state);
        if (permissionStatus.state === 'granted' && voiceEnabled) {
          startRecognition();
        }
      };
    } catch (error) {
      console.warn('⚠️ Could not check microphone permission status:', error);
      // Continue anyway as some browsers might not support the permissions API
    }
    
    // If already listening, no need to start again
    if (isListening) {
      console.log('ℹ️ Speech recognition is already active');
      return true;
    }

    // Use a promise to handle the async nature of recognition start
    return new Promise((resolve) => {
      let retryCount = 0;
      const MAX_RETRIES = 3;
      
      const attemptStart = () => {
        if (retryCount >= MAX_RETRIES) {
          console.error(`❌ Failed to start after ${MAX_RETRIES} attempts`);
          setError('Failed to start speech recognition. Please try again.');
          setVoiceEnabled(false);
          resolve(false);
          return;
        }
        
        console.log(`🔄 Attempt ${retryCount + 1}/${MAX_RETRIES}: Starting recognition...`);
        
        try {
          recognition.start();
          console.log('✅ Started speech recognition');
          setIsListening(true);
          setError(null);
          resolve(true);
        } catch (error) {
          retryCount++;
          console.warn(`⚠️ Attempt ${retryCount} failed:`, error);
          
          if (retryCount < MAX_RETRIES) {
            console.log(`⏳ Retrying in ${retryCount * 500}ms...`);
            setTimeout(attemptStart, retryCount * 500);
          } else {
            console.error('❌ Max retry attempts reached');
            setError('Could not access the microphone. Please check your microphone settings.');
            setVoiceEnabled(false);
            resolve(false);
          }
        }
      };
      
      // Initial start attempt
      attemptStart();
    });
  }, [isListening, voiceEnabled, setError, setVoiceEnabled]);
  
  // Stop recognition function
  const stopRecognition = useCallback(() => {
    console.log('🛑 Stopping speech recognition...');
    
    const recognition = recognitionRef.current;
    if (!recognition) {
      console.warn('No recognition instance to stop');
      return;
    }
    
    try {
      recognition.stop();
      console.log('✅ Stopped speech recognition');
      setIsListening(false);
    } catch (error) {
      console.error('❌ Error stopping recognition:', error);
    }
  }, []);
  
  // Toggle voice on/off
  const toggleVoiceEnabled = useCallback(async () => {
    const newVoiceState = !voiceEnabled;
    console.log(`🔄 Toggling voice ${newVoiceState ? 'ON' : 'OFF'}`);
    
    // Update the state first
    setVoiceEnabled(newVoiceState);
    
    if (newVoiceState) {
      // When enabling voice
      console.log('🔊 Enabling voice features...');
      
      try {
        // Set up the audio element for lip sync
        const audioElement = voiceService.getAudioElement();
        if (audioElement && audioRef.current !== audioElement) {
          audioRef.current = audioElement;
          setupVolumeAnalysis(audioElement);
          console.log('🎵 Audio element connected to lip sync system');
        }
        
        // Start speech recognition
        if (recognitionRef.current) {
          console.log('🎤 Starting speech recognition...');
          const started = await startRecognition();
          
          if (!started) {
            console.warn('⚠️ Failed to start speech recognition');
            setVoiceEnabled(false);
          }
        }
      } catch (error) {
        console.error('❌ Error enabling voice features:', error);
        setError('Failed to enable voice features. Please try again.');
        setVoiceEnabled(false);
      }
    } else {
      // When disabling voice
      console.log('🔇 Disabling voice features...');
      
      // Stop any ongoing speech
      voiceService.stop();
      stopLipSync();
      
      // Process any pending recognized text
      if (recognizedText) {
        console.log('🎤 Processing final message before turning off mic:', recognizedText);
        processUserMessage(
          recognizedText,
          speakText,
          setError,
          setIsProcessing,
          lastProcessedText,
          currentRequestId,
          emotion,
          setConversationHistory,
          setEmotion,
          voiceService.speak.bind(voiceService)
        );
      }
      
      // Stop recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Error stopping recognition:', e);
        }
        setIsListening(false);
      }
      
      // Stop any ongoing speech
      voiceService.stop();
      stopLipSync();
      
      // Clear any pending timers and reset state
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      
      // Clear the recognized text
      setRecognizedText('');
      console.log('🔇 Voice disabled - processing complete');
    }
  }, [voiceEnabled, setupVolumeAnalysis, stopLipSync, startRecognition, recognizedText, processUserMessage, speakText, setError, setIsProcessing, lastProcessedText, currentRequestId, emotion, setConversationHistory, setEmotion]);

  // Create the processFinalTranscript function with useCallback to prevent recreation on every render
  const processFinalTranscript = useCallback(debounce((transcript) => {
    // Skip if we're still processing
    if (isProcessingRef.current) {
      console.log('⏳ Currently processing another request, skipping...');
      return;
    }
    
    // Skip empty or whitespace only transcripts
    const trimmedTranscript = transcript.trim();
    if (!trimmedTranscript) {
      console.log('⚠️ Empty transcript received, skipping...');
      return;
    }
    
    // Check cooldown period (1 second)
    const now = Date.now();
    if (now - lastRequestTime.current < 1000) {
      console.log('⏳ Request too frequent, skipping...');
      return;
    }
    
    // Only check for duplicates if the last processed text was very recent (within 2 seconds)
    const isDuplicate = lastProcessedText.current === trimmedTranscript && 
                       (now - lastRequestTime.current < 2000);
    
    if (isDuplicate) {
      console.log('🔄 Duplicate message detected, skipping...');
      return;
    }
    
    console.log('📨 Processing final transcript:', trimmedTranscript);
    lastRequestTime.current = now;
    lastProcessedText.current = trimmedTranscript;
    
    // Process the user message with the recognized text
    processUserMessage(
      trimmedTranscript,
      speakText,
      setError,
      setIsProcessing,
      lastProcessedText,
      currentRequestId,
      emotion,
      setConversationHistory,
      setEmotion,
      voiceService.speak.bind(voiceService)
    ).catch(error => {
      console.error('❌ Error processing message:', error);
      setError('Failed to process your message. Please try again.');
    });
  }, 500), [speakText, setError, setIsProcessing, emotion, setConversationHistory, setEmotion, currentRequestId]);

  // Process recognized text
  const handleProcessText = useCallback(async (text) => {
    if (!text || !text.trim() || isProcessing) return;
    
    const trimmedText = text.trim();
    
    // Check if we've already processed this text
    if (lastProcessedText.current === trimmedText) {
      console.log('Skipping duplicate text:', trimmedText);
      return;
    }
    
    // Update last processed text
    lastProcessedText.current = trimmedText;
    
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: trimmedText,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    
    setConversationHistory(prev => [...prev, userMessage]);
    
    // Process the message
    setIsProcessing(true);
    
    try {
      const response = await processUserMessage(
        trimmedText,
        speakText,  // Using speakText instead of speak
        setError,
        setIsProcessing,
        lastProcessedText,
        currentRequestId,
        emotion,
        setConversationHistory,
        setEmotion,
        speakText  // Using speakText instead of speak
      );
      
      if (response) {
        // Add AI response to chat
        setConversationHistory(prev => [...prev, response]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setError('Failed to process your message. Please try again.');
    } finally {
      setIsProcessing(false);
      // Reset the transcript after processing
      resetTranscript();
    }
  }, [isProcessing, speakText, setConversationHistory, setError, emotion, resetTranscript]);

  // Speech recognition is handled by the useSpeechRecognition hook
  // The hook manages initialization, event handling, and cleanup

  // Set up audio element for lip sync if available
  useEffect(() => {
    try {
      const audioElement = voiceService.getAudioElement();
      if (audioElement && audioRef.current !== audioElement) {
        audioRef.current = audioElement;
        setupVolumeAnalysis(audioElement);
      }
    } catch (error) {
      console.error('Error setting up audio element:', error);
    }
  }, []);

  // Handle speech recognition results
  const handleFinalTranscript = useCallback(async (text) => {
    if (!text?.trim() || isProcessingRef.current) return;
    
    const trimmedText = text.trim();
    console.log('🎤 Processing speech input:', trimmedText);
    
    // Prevent duplicate processing
    if (lastProcessedText.current === trimmedText) {
      console.log('Skipping duplicate transcript');
      return;
    }
    
    lastProcessedText.current = trimmedText;
    isProcessingRef.current = true;
    setIsProcessing(true);
    
    try {
      // Add user message to chat
      const userMessage = {
        id: Date.now(),
        text: trimmedText,
        sender: 'user',
        timestamp: new Date().toISOString(),
      };
      
      setConversationHistory(prev => [...prev, userMessage]);
      
      // Process the message through the API
      console.log('📡 Sending to API...');
      const response = await processUserMessage(
        trimmedText,
        speakText,
        setError,
        setIsProcessing,
        lastProcessedText,
        currentRequestId,
        emotion,
        setConversationHistory,
        setEmotion,
        voiceService.speak.bind(voiceService)
      );
      
      if (response) {
        console.log('✅ API response received');
        setConversationHistory(prev => [...prev, response]);
        
        // Handle different response formats
        if (typeof response === 'string') {
          await speakText(response);
        } else if (response.message?.content) {
          await speakText(response.message.content);
          const newEmotion = response.emotion || response.message.emotion;
          if (newEmotion) setEmotion(newEmotion);
        } else if (response.content) {
          await speakText(response.content);
          if (response.emotion) setEmotion(response.emotion);
        }
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
      setError('Failed to process your message. Please try again.');
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
      setRecognizedText('');
    }
  }, [speakText, setError, emotion, setConversationHistory, setEmotion, currentRequestId]);
  
  // Process new final transcripts
  useEffect(() => {
    if (finalTranscript?.trim() && finalTranscript !== lastProcessedText.current) {
      handleFinalTranscript(finalTranscript);
    }
  }, [finalTranscript, handleFinalTranscript]);
  
  // Toggle voice recognition using the hook
  const toggleListening = useCallback(async () => {
    if (isProcessing) {
      // If currently processing, cancel the current request
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsProcessing(false);
      stopListening();
      return;
    }
    
    if (isListening) {
      stopListening();
    } else {
      // Reset previous transcript when starting new recognition
      resetTranscript();
      setRecognizedText('');
      
      try {
        const started = await startListening();
        if (!started) {
          setError('Failed to start speech recognition. Please check microphone permissions.');
        }
      } catch (err) {
        console.error('Error starting speech recognition:', err);
        setError(`Error starting speech recognition: ${err.message}`);
      }
    }
  }, [isListening, isProcessing, startListening, stopListening, resetTranscript]);

  // Volume lip sync setup
  const { 
    currentVolume: currentLipSyncVolume, 
    isAnalyzing: isLipSyncing, 
    setupVolumeAnalysis: setupLipSync,
    startVolumeAnalysis: startLipSyncAnalysis, 
    stopVolumeAnalysis: stopLipSyncAnalysis 
  } = useVolumeLipSync();

  // Volume control functions with optimized hover
  const volumeHoverTimeoutRef = useRef(null);
  
  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseInt(e.target.value, 10);
    setSystemVolume(newVolume);
    
    // If unmuting, update the mute state
    if (isMuted && newVolume > 0) {
      setIsMuted(false);
    } else if (newVolume === 0) {
      setIsMuted(true);
    }
    
    // Update the actual volume in the audio context if needed
    if (audioContextRef.current && audioContextRef.current.gain) {
      audioContextRef.current.gain.gain.value = isMuted ? 0 : newVolume / 100;
    }
  }, [isMuted, systemVolume]);

  const showVolumeSliderOnHover = useCallback(() => {
    if (volumeHoverTimeoutRef.current) {
      clearTimeout(volumeHoverTimeoutRef.current);
    }
    setShowVolumeSlider(true);
  }, []);

  const hideVolumeSliderAfterDelay = useCallback(() => {
    volumeHoverTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 1000);
  }, []);

  const getVolumeIcon = useCallback(() => {
    if (isMuted || systemVolume === 0) {
      return <VolumeX className="w-5 h-5" />;
    } else if (systemVolume < 33) {
      return <Volume1 className="w-5 h-5" />;
    } else if (systemVolume < 66) {
      return <Volume2 className="w-5 h-5" />;
    } else {
      return <Volume2 className="w-5 h-5" />;
    }
  }, [isMuted, systemVolume]);

  const hideVolumeSliderOnLeave = useCallback(() => {
    // Add a small delay to prevent flickering when moving mouse to slider
    volumeHoverTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false);    }, 150); // 150ms delay
  }, []);

  // Memoize avatar props - simplified with voice support and lip sync
  const avatarProps = useMemo(() => ({
    lastMessage: lastMessage,
    voiceEnabled: voiceEnabled && systemVolume > 0,
    selectedVoice: selectedVoice,
    onVoiceEnd: handleVoiceEnd,
    avatarVolume: systemVolume, // Pass volume to avatar
    volumeLipSyncRef: {
      current: {
        getVolumeValue: () => currentLipSyncVolume || 0,
        isPlaying: () => isLipSyncing
      }
    },
    detectedEmotion: emotion
  }), [lastMessage, voiceEnabled, systemVolume, selectedVoice, handleVoiceEnd, lipSyncVolume, lipSyncActive, emotion]);
  
  // Handle ending the call
  const endCall = () => {
    console.log('Ending call...');
    // Stop any ongoing speech
    if (voiceService) {
      voiceService.stop();
    }
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    // Reset states
    setIsListening(false);
    setVoiceEnabled(false);
    setRecognizedText('');
    setError(null);
  };

  // Stop avatar speaking when voice is disabled
  useEffect(() => {
    if (!voiceEnabled) {
      // Import and stop the voice service when voice is disabled
      stopLipSync(); // Stop lip sync when voice is disabled
      import('../services/voiceService').then(({ default: voiceService }) => {
        voiceService.stop();
      });
    }
  }, [voiceEnabled, stopLipSync]);

  // Load available Azure Neural voices
  useEffect(() => {
    const loadVoices = () => {
      // Import Azure Neural voices directly
      import('../services/voiceService').then(({ AZURE_NEURAL_VOICES }) => {
        setAvailableVoices(AZURE_NEURAL_VOICES);
        
        // Set default voice if not already set
        if (AZURE_NEURAL_VOICES.length > 0 && !selectedVoice) {
          // Default to the first available voice
          setSelectedVoice(AZURE_NEURAL_VOICES[0]);
        }
      });
    };

    loadVoices();
  }, [selectedVoice]);
  
  // Close voice selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showVoiceSelector && !event.target.closest('.voice-selector-container')) {
        setShowVoiceSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVoiceSelector]);

  // Handle delayed speaking state for smoother animations
  useEffect(() => {
    let timeoutId;
    
    if (isSpeaking) {
      // When speaking starts, update the delayed state immediately
      setDelayedIsSpeaking(true);
    } else {
      // When speaking stops, delay the state update for a smoother transition
      timeoutId = setTimeout(() => {
        setDelayedIsSpeaking(false);
      }, 300); // 300ms delay for a smoother transition
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isSpeaking]);
  
  // Cleanup volume hover timeout on unmount
  useEffect(() => {
    return () => {
      if (volumeHoverTimeoutRef.current) {
        clearTimeout(volumeHoverTimeoutRef.current);
      }
    };
  }, []);

  // Don't show error state for speech recognition issues
  const displayError = error && !error.includes('speech recognition');

  if (isLoading && !displayError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-12 h-12 animate-spin text-white" />
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Connecting to Seriva...
          </h1>
          <p className="text-gray-400 mb-6">Initializing avatar and voice systems</p>
          <div className="flex justify-center space-x-2 text-sm text-gray-500">
            <span>●</span>
            <span>Preparing 3D Environment</span>
          </div> 
        </motion.div>
      </div>
    );
  }
  if (displayError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <AlertTriangle className="w-16 h-16 text-red-500 mb-6 mx-auto" />
          <h1 className="text-3xl font-bold mb-3 text-red-400">Connection Failed</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
          >
            Reconnect
          </button>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white overflow-hidden transition-colors duration-200">
      {/* Custom styles for volume slider */}
      <style jsx="true">{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }
        
        input[type="range"]::-webkit-slider-track {
          background: #4b5563;
          height: 6px;
          border-radius: 3px;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          background: #3b82f6;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
        }
        
        input[type="range"]::-moz-range-track {
          background: #4b5563;
          height: 6px;
          border-radius: 3px;
          border: none;
        }
        
        input[type="range"]::-moz-range-thumb {
          background: #3b82f6;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
      
      {/* Main Video Area */}
      <div className="relative w-full h-full overflow-hidden">
        {/* Hidden video element for emotion detection */}
        <video
          ref={emotionVideoRef}
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '320px',
            height: '240px',
            opacity: 0,  // Completely hidden
            zIndex: -1,  // Move behind other content
            transform: 'scaleX(-1)', // Mirror the video
            pointerEvents: 'none',
            visibility: 'hidden'
          }}
          autoPlay
          playsInline
          muted
          onPlay={() => console.log('Emotion detection video is playing')}
          onLoadedData={() => console.log('Emotion detection video data loaded')}
          onError={(e) => console.error('Emotion detection video error:', e)}
        />
        
        {/* Preview video element - visible to user */}
        <video
          ref={previewVideoRef}
          className="fixed left-4 top-24 z-50 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 transition-all duration-300"
          style={{
            width: isPreviewExpanded ? '500px' : '320px',
            height: isPreviewExpanded ? '375px' : '240px',
            transform: 'scaleX(-1)', // Mirror the preview
            display: isCameraEnabled ? 'block' : 'none',
            objectFit: 'cover'
          }}
          autoPlay
          playsInline
          muted
        />
        
        <motion.div 
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ pointerEvents: 'none' }}
        >
          {/* 3D Avatar */}
          <div className="absolute inset-0">
            <Avatar
              isListening={isListening}
              isTalking={delayedIsSpeaking}
              {...avatarProps}
              className="w-full h-full"
              volumeLipSyncRef={volumeLipSyncRef}
              enableGreeting={true}
              onGreetingComplete={() => {
                console.log('Greeting complete, transitioning to idle');
              }}
              detectedEmotion={emotion}
            />
          </div>
          
          {/* Video Overlays */}
          <div className="absolute inset-0 pointer-events-none">
          </div>
        </motion.div>
      </div>      
      {/* Camera Preview - Positioned below navbar */}
      <AnimatePresence>
        {isCameraEnabled && (
          <motion.div 
            className={`fixed left-4 top-24 z-50 bg-black/80 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 backdrop-blur-sm transition-all duration-300 ${
              isPreviewExpanded 
                ? 'w-[500px] h-[375px]' 
                : 'w-[320px] h-[240px]'
            }`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="relative w-full h-full">
              {/* Visible preview */}
              <video
                ref={previewVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{
                  transform: 'scaleX(-1)', // Mirror the video
                }}
                onPlay={() => console.log('Preview video is playing')}
                onLoadedData={() => console.log('Preview video data loaded')}
                onError={(e) => console.error('Preview video error:', e)}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-xs">
                <div className="flex justify-between items-center">
                  <span>You</span>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-black/50 rounded">
                      {currentEmotion || 'neutral'}
                    </span>
                    <button 
                      onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                      className="p-1 hover:bg-white/20 rounded-full"
                    >
                      {isPreviewExpanded ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white/80 dark:from-black/80 to-transparent backdrop-blur-sm z-40 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center space-x-4">
            {/* Voice Input Button */}
            <div className="relative group">
              <button 
                onClick={toggleListening}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform ${
                  isListening 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 scale-110 text-white' 
                    : 'bg-white/10 dark:bg-white/10 hover:bg-white/20 dark:hover:bg-white/20 backdrop-blur-md shadow-md text-gray-900 dark:text-white'
                }`}
                title={isListening ? 'Stop Listening' : 'Start Listening'}
                disabled={isProcessing}
              >
                {isListening ? (
                  <Mic className="w-6 h-6 text-white" />
                ) : isProcessing ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gray-900 dark:text-white" />
                ) : (
                  <MicOff className="w-6 h-6 text-gray-900 dark:text-white" />
                )}
              </button>
              {isListening && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
              )}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-gray-700 dark:text-white/70 whitespace-nowrap">
                {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Start Listening'}
              </div>
            </div>

            {/* Camera Toggle Button */}
            <div className="relative group">
              <button 
                onClick={toggleCamera}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCameraEnabled 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-white/10 dark:bg-white/10 hover:bg-white/20 dark:hover:bg-white/20 backdrop-blur-md shadow-md text-gray-900 dark:text-white'
                }`}
                title={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {isCameraEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-gray-700 dark:text-white/70 whitespace-nowrap">
                {isCameraEnabled ? 'Turn off' : 'Turn on'}
              </div>
            </div>

            {/* Voice Volume Control */}
            <div className="relative group">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                onMouseEnter={showVolumeSliderOnHover}
                onMouseLeave={hideVolumeSliderAfterDelay}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isMuted 
                    ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600' 
                    : 'bg-white/10 dark:bg-white/10 hover:bg-white/20 dark:hover:bg-white/20 backdrop-blur-md shadow-md'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {getVolumeIcon()}
              </button>
              
              {/* Volume Slider */}
              <div 
                className={`absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-3 mb-3 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl transition-all duration-200 ${
                  showVolumeSlider ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
                onMouseEnter={showVolumeSliderOnHover}
                onMouseLeave={hideVolumeSliderOnLeave}
              >
                <div className="flex items-center h-24">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : systemVolume}
                    onChange={handleVolumeChange}
                    onMouseEnter={showVolumeSliderOnHover}
                    onMouseLeave={hideVolumeSliderAfterDelay}
                    className="h-24 w-6 -rotate-90 origin-center"
                    aria-label="Volume control"
                  />
                </div>
              </div>
              
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-gray-700 dark:text-white/70 whitespace-nowrap">
               {isMuted ? 'Unmute' : 'Volume'}
              </div>
            </div>

            {/* End Call Button */}
            <div className="relative group">
              <button 
                onClick={endCall}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 hover:scale-105 transition-all duration-300"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-gray-700 dark:text-white/70 whitespace-nowrap">
                End Call
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarCallPage;