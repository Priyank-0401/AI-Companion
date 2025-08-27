import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import chatApi, { api } from '../services/api';
import Avatar from '../components/AvatarOptimized'; // Import the optimized Avatar component
import { useVolumeLipSync } from '../hooks/useVolumeLipSync'; // Import the volume lip sync hook
import { useVisemeLipSync } from '../hooks/useVisemeLipSync'; // Import the viseme lip sync hook
import { useEmotionDetection } from '../hooks/useEmotionDetection'; // Import the emotion detection hook
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useGestureDetectionMainThread from '../hooks/useGestureDetectionMainThread'; // Import the gesture detection hook
import { createGestureContext } from '../utils/gestureAndPoseMapping'; // Import gesture context utility
import useAuth from '../auth/hooks/useAuth';
import avatarConversationService from '../services/avatarConversationService';
import { auth } from '../config/firebase';
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
const processUserMessage = async (message, setError, setIsProcessing, lastProcessedText, currentRequestId, currentEmotion = 'neutral', gestureContext = null, setMessages, setEmotion, conversationHistory = []) => {
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

    // Create user message object
    const userMessage = {
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date().toISOString(),
      id: `user-${requestId}`
    };

    // Prepare messages array for LLM (include conversation history for context)
    const messages = [
      ...conversationHistory.slice(-10), // Include last 10 messages for context
      userMessage
    ];

    const payload = {
      messages: messages,
      model: 'llama3-8b-8192',
      provider: 'groq',
      temperature: 0.7,
      maxTokens: 2000,
      context: { 
        emotion: currentEmotion,
        gestureContext: gestureContext,
        timestamp: new Date().toISOString(),
        requestId,
        isAvatarCall: true,
        hasHistory: conversationHistory.length > 0
      }
    };
    
    console.log('📜 Sending conversation context to LLM:', {
      historyCount: conversationHistory.length,
      totalMessages: messages.length,
      lastMessages: messages.slice(-3).map(m => ({
        role: m.role,
        content: m.content.substring(0, 30) + (m.content.length > 30 ? '...' : '')
      }))
    });

    console.log('📤 Sending request to LLM API:', { 
      endpoint: '/api/v1/chat/llm/send',
      messageCount: messages.length,
      lastMessages: messages.slice(-2).map(m => ({ role: m.role, content: m.content.substring(0, 50) + '...' }))
    });
    
    // Make the API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    // Make the API request with timeout. axios automatically stringifies the payload.
    const response = await api.post('/api/llm/chat', payload, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    // With axios, response data is in `response.data`.
    // A non-2xx status will throw an error and be caught by the main try-catch block.
    const responseData = response.data;
    console.log('API Response:', responseData);
    
    // Handle the response
    if (!responseData) {
      throw new Error('No response data received from server');
    }
    
    // Extract data and TTS style from the success wrapper if it exists
    let resultData = responseData;
    let ttsStyle = 'Assistant'; // Default style
    
    if (responseData.success && responseData.data) {
      console.log('Extracting data from success wrapper');
      resultData = responseData.data;
      ttsStyle = responseData.ttsStyle || 'Assistant';
    } else if (responseData.ttsStyle) {
      ttsStyle = responseData.ttsStyle;
    }
    
    // Log the full response for debugging
    console.log('Processed response data:', resultData);
    
    if (!resultData) {
      throw new Error('No valid response data found in the API response');
    }
    
    // Extract assistant response from LLM API response
    let assistantContent = '';
    if (resultData.choices && resultData.choices[0] && resultData.choices[0].message) {
      assistantContent = resultData.choices[0].message.content;
    } else if (resultData.content) {
      assistantContent = resultData.content;
    } else if (resultData.message) {
      assistantContent = resultData.message;
    } else {
      assistantContent = 'I apologize, but I could not process your request.';
    }

    // Create assistant message object
    const assistantMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date().toISOString(),
      context: {
        emotion: currentEmotion || 'neutral',
        requestId: requestId
      },
      metadata: {
        model: resultData.model || 'llama3-8b-8192',
        provider: resultData.provider || 'groq',
        usage: resultData.usage
      },
      ttsStyle: ttsStyle // Include TTS style in the message
    };

    // Get the current user directly from Firebase auth
    const currentUser = auth.currentUser;

    // Save conversation to Firestore if user is authenticated
    if (currentUser?.uid) {
      try {
        console.log('💾 Saving conversation to Firestore...', {
          userId: currentUser.uid,
          userMessage: userMessage.content?.substring(0, 50) + '...',
          assistantMessage: assistantMessage.content?.substring(0, 50) + '...'
        });
        await avatarConversationService.saveMessagePair(
          currentUser.uid,
          userMessage,
          assistantMessage
        );
        console.log('✅ Conversation saved successfully');
      } catch (saveError) {
        console.error('❌ Error saving conversation:', saveError);
        // Don't throw here - we still want to return the response even if saving fails
      }
    } else {
      console.warn('⚠️ No authenticated user found, skipping Firestore save');
    }
    
    // Update local conversation history with both messages
    if (setMessages) {
      setMessages(prev => [...prev, userMessage, assistantMessage]);
    }
    
    // Update emotion if provided
    if (setEmotion && assistantMessage.context?.emotion) {
      setEmotion(assistantMessage.context.emotion);
    }
    
    console.log('✅ Message processed successfully:', {
      id: assistantMessage.id,
      content: assistantMessage.content.substring(0, 100) + '...',
      emotion: assistantMessage.context?.emotion
    });
    
    return assistantMessage;
    
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
    
    return errorResponse;
    
  } finally {
    if (currentRequestId?.current === requestId) {
      setIsProcessing?.(false);
    }
  }
};

const AvatarCallPage = () => {
  // Authentication context
  const { currentUser, loading: authLoading, initialized: authInitialized } = useAuth();
  
  // Refs
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const currentRequestId = useRef(null);
  const isProcessingRef = useRef(false);
  const lastProcessedText = useRef('');
  const lastRequestTime = useRef(0);
  const isInitialized = useRef(false);
  const recognitionRef = useRef(null);
  const conversationLoadedRef = useRef(false);
  const audioElement = useRef(null);
  const volumeLipSyncRef = useRef(null);
  const debounceTimer = useRef(null);
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

  // Initialize speech recognition ref
  useEffect(() => {
    recognitionRef.current = {
      start: startListening,
      stop: stopListening,
      isListening: isListening
    };
  }, [startListening, stopListening, isListening]);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Call State
  const [isCallActive, setIsCallActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [lastMessage, setLastMessage] = useState(null);
  const [emotion, setEmotion] = useState('neutral');
  const [currentCaption, setCurrentCaption] = useState('');
  const [showCaptions, setShowCaptions] = useState(true);

  // Audio & Voice State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [delayedIsSpeaking, setDelayedIsSpeaking] = useState(false);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [systemVolume, setSystemVolume] = useState(80);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  
  // Greeting State
  const [isGreeting, setIsGreeting] = useState(true); // Start with greeting active
  const [greetingComplete, setGreetingComplete] = useState(false);
  
  // Camera State (missing state variable for existing camera functionality)
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  
  // Gesture Detection State
  const [gestureContext, setGestureContext] = useState(null);
  const [isGestureDetectionActive, setIsGestureDetectionActive] = useState(false);
  
  // NEW: Viseme Lip Sync Hook
  const {
    visemeMultiplier,
    currentWord,
    isActive: isVisemeActive,
    attachToUtterance,
    detachFromUtterance,
    getDebugInfo
  } = useVisemeLipSync();
  
  // NEW: Gesture Detection Hook
  const {
    isInitialized: isGestureInitialized,
    error: gestureError,
    poseResults,
    gestureResults,
    isProcessing: isGestureProcessing,
    videoRef: gestureVideoRef,
    canvasRef: gestureCanvasRef,
    startProcessing: startGestureDetection,
    stopProcessing: stopGestureDetection
  } = useGestureDetectionMainThread();
  
  // NEW: Connect viseme system to voice service
  useEffect(() => {
    // Register viseme callback with voice service
    const visemeCallback = (utterance) => {
      console.log('🎭 Attaching viseme analysis to utterance');
      attachToUtterance(utterance);
    };
    
    // Add callback to voice service
    voiceService.addVisemeCallback(visemeCallback);
    
    // Cleanup on unmount
    return () => {
      voiceService.removeVisemeCallback(visemeCallback);
      detachFromUtterance();
    };
  }, [attachToUtterance, detachFromUtterance]);
  
  // Process gesture and pose results to generate context for LLM
  useEffect(() => {
    if (poseResults || gestureResults) {
      const context = createGestureContext(gestureResults, poseResults);
      
      // Only update and log if there are actual changes
      setGestureContext(prevContext => {
        // Simple deep equality check for gestures and poses
        const gesturesChanged = JSON.stringify(prevContext?.gestures || []) !== JSON.stringify(context.gestures);
        const posesChanged = JSON.stringify(prevContext?.poses || []) !== JSON.stringify(context.poses);
        
        if (gesturesChanged || posesChanged) {
          // Log gesture context for debugging only when there are changes
          if (context.gestures.length > 0 || context.poses.length > 0) {
            console.log('🎯 Gesture/pose context updated:', context);
          } else if (prevContext?.gestures?.length > 0 || prevContext?.poses?.length > 0) {
            // Log when gestures/poses disappear
            console.log('🎯 Gesture/pose context cleared');
          }
          return context;
        }
        
        return prevContext;
      });
    }
  }, [poseResults, gestureResults]);
  
  // Handle final transcript changes - automatically stop mic and process
  useEffect(() => {
    if (finalTranscript && finalTranscript.trim() && finalTranscript !== lastProcessedText.current) {
      console.log('Final transcript received:', finalTranscript);
      setRecognizedText(finalTranscript);
      
      // Automatically stop listening when we get a final transcript
      if (isListening) {
        console.log('🎤 Final transcript ready, automatically stopping microphone');
        stopListening();
      }
      
      // Process the final transcript if not already processing
      if (!isProcessing) {
        console.log('🎯 Processing final transcript:', finalTranscript);
        handleProcessText(finalTranscript);
      } else {
        console.log('⏳ Already processing, skipping transcript:', finalTranscript);
      }
      
      // Clear the transcript to prevent reprocessing
      resetTranscript();
    }
  }, [finalTranscript, isProcessing, isListening, stopListening, resetTranscript]);

  // Handle speech recognition errors
  useEffect(() => {
    if (speechError) {
      console.error('Speech recognition error:', speechError);
      setError(`Speech recognition error: ${speechError}`);
    }
  }, [speechError]);
  
  // Start/stop gesture detection based on camera state and manual toggle
  useEffect(() => {
    let isCancelled = false;
    
    const startGestureDetectionSafely = async () => {
      if (isCancelled) return;
      
      // Only attempt to start if not already processing
      if (!isGestureProcessing) {
        console.log('🚀 Starting gesture detection');
        try {
          await startGestureDetection();
        } catch (error) {
          console.error('❌ Error starting gesture detection:', error);
          if (!isCancelled) {
            setIsGestureDetectionActive(false);
          }
        }
      }
    };
    
    if (isCameraEnabled && isGestureInitialized && isGestureDetectionActive) {
      startGestureDetectionSafely();
    } else if (isGestureInitialized) {
      console.log('🛑 Stopping gesture detection');
      stopGestureDetection();
    }
    
    return () => {
      isCancelled = true;
    };
  }, [isCameraEnabled, isGestureInitialized, isGestureDetectionActive, isGestureProcessing, startGestureDetection, stopGestureDetection]);
  
  // Automatically enable gesture detection when camera is turned on
  useEffect(() => {
    if (isCameraEnabled && isGestureInitialized && !isGestureDetectionActive) {
      console.log('🔄 Auto-enabling gesture detection with camera');
      setIsGestureDetectionActive(true);
    }
  }, [isCameraEnabled, isGestureInitialized, isGestureDetectionActive]);

  // Load conversation history when user is available
  useEffect(() => {
    const loadConversationHistory = async () => {
      console.log('🔍 Auth state check:', {
        authInitialized,
        authLoading,
        currentUser: currentUser ? {
          uid: currentUser.uid,
          email: currentUser.email
        } : null,
        firebaseCurrentUser: auth.currentUser ? {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email
        } : null
      });
      
      // Wait for auth to be initialized
      if (!authInitialized) {
        console.log('⏳ Waiting for authentication to initialize...');
        return;
      }
      
      // Check if we have a user from Firebase directly
      const firebaseUser = auth.currentUser;
      const userToUse = currentUser || firebaseUser;
      
      if (!userToUse?.uid) {
        console.log('⚠️ No user available for loading conversation history', {
          currentUser: !!currentUser,
          firebaseUser: !!firebaseUser,
          authInitialized,
          authLoading
        });
        return;
      }
      
      if (conversationLoadedRef.current) {
        console.log('📋 Conversation history already loaded, skipping...');
        return;
      }

      try {
        console.log('🔄 Loading conversation history for Seriva...', {
          userId: userToUse.uid,
          currentHistoryLength: conversationHistory.length,
          usingFirebaseDirectly: !currentUser && !!firebaseUser
        });
        
        const history = await avatarConversationService.loadConversationHistory(userToUse.uid);
        
        console.log('📊 Conversation history loaded:', {
          historyLength: history.length,
          firstMessage: history[0]?.content?.substring(0, 50) + '...' || 'none',
          lastMessage: history[history.length - 1]?.content?.substring(0, 50) + '...' || 'none'
        });
        
        if (history.length > 0) {
          console.log(`✅ Setting ${history.length} messages to conversation history state`);
          setConversationHistory(history);
          
          // Show a brief welcome back message if there's history
          const lastMessage = history[history.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            const welcomeMessage = "Welcome back! I remember our previous conversations. How are you feeling today?";
            setLastMessage({
              content: welcomeMessage,
              context: { emotion: 'happy' }
            });
            // Set initial caption for returning users
            setCurrentCaption(welcomeMessage);
          }
        } else {
          console.log('📝 No previous conversation history found');
          setConversationHistory([]); // Explicitly set empty array
          // Set a welcome message for new users
          const welcomeMessage = "Hello! I'm Seriva, your AI companion. I'm here to listen and support you. How are you feeling today?";
          setLastMessage({
            content: welcomeMessage,
            context: { emotion: 'happy' }
          });
          // Set initial caption for new users
          setCurrentCaption(welcomeMessage);
        }
        
        conversationLoadedRef.current = true;
        console.log('🏁 Conversation loading completed');
      } catch (error) {
        console.error('❌ Error loading conversation history:', error);
        setError('Failed to load conversation history. Starting fresh.');
        setConversationHistory([]); // Ensure we have an empty array on error
        conversationLoadedRef.current = true;
      }
    };

    loadConversationHistory();
  }, [currentUser?.uid, authInitialized]);

  // Debug conversation history changes
  useEffect(() => {
    console.log('🔍 Conversation history state changed:', {
      length: conversationHistory.length,
      messages: conversationHistory.slice(-3).map(m => ({
        role: m.role,
        content: m.content?.substring(0, 30) + '...',
        timestamp: m.timestamp
      }))
    });
  }, [conversationHistory]);

  // Handle text-to-speech functionality
  const speakText = useCallback(async (text, ttsStyle = 'Assistant') => {
    if (!text) {
      console.error('Cannot speak: no text provided');
      return false;
    }
    
    if (!voiceEnabled) {
      console.log('Voice was disabled, enabling now...');
      setVoiceEnabled(true);
    }

    console.log('🔊 Starting to speak text with style:', { text: text.substring(0, 50) + '...', ttsStyle });
    
    // Ensure the voice service is initialized with the selected voice
    if (selectedVoice) {
      voiceService.setVoice(selectedVoice);
    }

    try {
      // Use the voiceService to speak the text with the specified style
      await voiceService.speak(text, {
        style: ttsStyle, // Pass the TTS style to the voice service
        onStart: () => {
          console.log('🎤 Speech started - starting talking animation immediately');
          setIsSpeaking(true); // Start talking animation immediately when speech begins
          setCurrentCaption(text); // Set caption text when speech starts
        },
        onEnd: () => {
          console.log('✅ Speech ended');
          setIsSpeaking(false);
          // Reset lip-sync animation
          if (volumeLipSyncRef.current) {
            volumeLipSyncRef.current.reset();
          }
          // Clear captions after a delay when speech ends
          setTimeout(() => {
            setCurrentCaption('');
          }, 3000); // Keep captions for 3 seconds after speech ends
        },
        onError: (error) => {
          console.error('❌ Error in speech synthesis:', error);
          setIsSpeaking(false);
          setError('Failed to speak the response. Please check your audio settings.');
        }
      });
      return true;
    } catch (error) {
      console.error('❌ Error in speakText:', error);
      setIsSpeaking(false); // Ensure this is reset on error
      setError('Failed to speak the response. Please check your audio settings.');
      return false;
    }
  }, [voiceEnabled, selectedVoice, setError]);

  // Handle processing text input (from speech recognition or manual input)
  const handleProcessText = useCallback(async (text) => {
    if (!text || !text.trim() || isProcessing) {
      return;
    }

    const now = Date.now();
    if (now - lastRequestTime.current < REQUEST_COOLDOWN) {
      console.log('⏳ Request cooldown active, skipping...');
      return;
    }

    lastRequestTime.current = now;
    console.log('🎯 Processing text:', text);

    try {
      const response = await processUserMessage(
        text,
        setError,
        setIsProcessing,
        lastProcessedText,
        currentRequestId,
        emotion,
        gestureContext,
        setConversationHistory,
        setEmotion,
        conversationHistory
      );

      if (response && response.content) {
        // Update last message for UI display
        setLastMessage(response);
        
        // Update conversation history state
        setConversationHistory(prev => [...prev, {
          role: 'user',
          content: text,
          timestamp: new Date().toISOString(),
          id: `user-${Date.now()}`
        }, response]);
        
        // Speak the response - auto-enable voice if user is using speech recognition
        console.log('🔊 Voice enabled status:', voiceEnabled);
        if (!voiceEnabled && isSpeechAvailable) {
          console.log('🔊 Auto-enabling voice since user is using speech recognition');
          setVoiceEnabled(true);
        }
        
        if (voiceEnabled || isSpeechAvailable) {
          console.log('🎤 Speaking response with style:', { 
            content: response.content.substring(0, 50) + '...', 
            ttsStyle: response.ttsStyle 
          });
          await speakText(response.content, response.ttsStyle);
        } else {
          console.log('🔇 Voice is disabled, not speaking response');
        }
        
        lastProcessedText.current = text; // Update last processed text
        
        // Clear the recognized text and reset transcript for next input
        setRecognizedText('');
        resetTranscript();
        
        // After processing is complete and avatar has responded, 
        // automatically restart listening if voice is enabled
        setTimeout(() => {
          if (voiceEnabled && !isListening && isSpeechAvailable) {
            console.log('🎤 Avatar response complete, restarting microphone for next input');
            startListening();
          }
        }, 1000); // Small delay to ensure speech synthesis has started
        
      } else {
        console.warn('⚠️ No response content received from API.');
      }
    } catch (error) {
      console.error('❌ Error processing text:', error);
      setError('Failed to process your message. Please try again.');
    }
  }, [isProcessing, emotion, gestureContext, currentUser, conversationHistory, voiceEnabled, speakText, setError, setIsProcessing, setConversationHistory, setEmotion, setLastMessage, resetTranscript, isListening, isSpeechAvailable, startListening]);

  // Removed handleVoiceEnd - now handled directly in speakText onEnd callback
  

  
  // Emotion state for avatar expressions
  
  // Camera state for emotion detection
  // const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  // Track the last emotion that was displayed
  const lastDisplayedEmotion = useRef('neutral');
  const emotionUpdateTimeoutRef = useRef(null);
  
  // Debounced emotion update function
  const updateEmotionDebounced = useCallback((newEmotion) => {
    // Clear any pending emotion updates
    if (emotionUpdateTimeoutRef.current) {
      clearTimeout(emotionUpdateTimeoutRef.current);
    }
    
    // Only update if the emotion has actually changed
    if (newEmotion !== lastDisplayedEmotion.current) {
      lastDisplayedEmotion.current = newEmotion;
      setEmotion(newEmotion);
    }
  }, []);
  
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
    onEmotionDetected: updateEmotionDebounced,
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
          setError,
          setIsProcessing,
          lastProcessedText,
          currentRequestId,
          emotion,
          setConversationHistory,
          setEmotion,
          currentUser,
          conversationHistory
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

  // Removed processFinalTranscript - now using simplified handleProcessText flow

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

  // Remove duplicate transcript handling - now handled in the main useEffect above
  
  // Toggle voice recognition using the hook
  const toggleListening = useCallback(async () => {
    // Don't allow speech recognition during greeting
    if (isGreeting) {
      console.log('Speech recognition disabled during greeting');
      return;
    }
    
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
  }, [isListening, isProcessing, startListening, stopListening, resetTranscript, isGreeting]);

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

  // Memoize avatar props - simplified with voice support and hybrid lip sync
  const avatarProps = useMemo(() => ({
    lastMessage: lastMessage?.content || '',
    voiceEnabled: voiceEnabled && systemVolume > 0,
    selectedVoice: selectedVoice,
    onVoiceEnd: null,
    avatarVolume: systemVolume, // Pass volume to avatar
    isTalking: isSpeaking, // CRITICAL: Pass talking state to trigger animation
    volumeLipSyncRef: {
      current: {
        getVolumeValue: () => currentLipSyncVolume || 0,
        isPlaying: () => isLipSyncing
      }
    },
    // NEW: Viseme props for hybrid lip sync
    visemeMultiplier: visemeMultiplier,
    currentWord: currentWord,
    isVisemeActive: isVisemeActive,
    detectedEmotion: emotion
  }), [lastMessage, voiceEnabled, systemVolume, selectedVoice, isSpeaking, currentLipSyncVolume, isLipSyncing, emotion, visemeMultiplier, currentWord, isVisemeActive]);
  
  // Handle ending the call
  const endCall = useCallback(() => {
    console.log('Ending call...');
    
    // Stop any ongoing speech
    if (voiceService) {
      voiceService.stop();
    }
    
    // Stop speech recognition through the hook
    if (stopListening) {
      stopListening();
    }
    
    // Also stop through the ref if available
    if (recognitionRef.current && recognitionRef.current.stop) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
    }
    
    // Reset states
    setVoiceEnabled(false);
    setRecognizedText('');
    setError(null);
    setIsCallActive(false);
  }, []);

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
      <div className="relative w-full h-full overflow-hidden bg-white dark:bg-black">
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
                setIsGreeting(false);
                setGreetingComplete(true);
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
              {/* Hidden video element for gesture detection */}
              <video
                ref={gestureVideoRef}
                autoPlay
                playsInline
                muted
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
                onPlay={() => console.log('Gesture detection video is playing')}
                onLoadedData={() => console.log('Gesture detection video data loaded')}
                onError={(e) => console.error('Gesture detection video error:', e)}
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

      {/* Captions Area - Bottom Right Corner */}
      <AnimatePresence>
        {showCaptions && currentCaption && (
          <motion.div 
            className="fixed bottom-24 right-6 z-30 max-w-sm"
            initial={{ opacity: 0, x: 20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 20, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/50 p-4 relative overflow-hidden">
              {/* Gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              
              <div className="flex items-start space-x-3">
                {/* Avatar Icon */}
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-semibold text-xs">S</span>
                  </div>
                </div>
                
                {/* Caption Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Seriva</h4>
                    <button 
                      onClick={() => setShowCaptions(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                      title="Hide captions"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm">
                    {currentCaption}
                  </p>
                </div>
              </div>
              
              {/* Typing indicator when processing */}
              {isProcessing && (
                <div className="flex items-center space-x-2 mt-3 pl-11">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Thinking...</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center space-x-4">
            {/* Voice Input Button */}
            <div className="relative group">
              <button 
                onClick={toggleListening}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform ${
                  isGreeting
                    ? 'bg-red-500/70 cursor-not-allowed text-white/70' // Red and disabled during greeting
                    : isListening 
                      ? 'bg-green-500 shadow-lg shadow-green-500/30 scale-110 text-white' 
                      : isProcessing
                        ? 'bg-gray-500 cursor-not-allowed text-white/70'
                        : 'bg-white/10 dark:bg-white/10 hover:bg-white/20 dark:hover:bg-white/20 backdrop-blur-md shadow-md text-gray-900 dark:text-white'
                }`}
                title={isGreeting ? 'Mic disabled during greeting' : isListening ? 'Stop Listening' : isProcessing ? 'Processing...' : 'Start Listening'}
                disabled={isProcessing || isGreeting}
              >
                {isListening ? (
                  <Mic className="w-6 h-6 text-white" />
                ) : isProcessing ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <MicOff className={`w-6 h-6 ${isGreeting ? 'text-white/70' : 'text-gray-900 dark:text-white'}`} />
                )}
              </button>
              {isListening && !isGreeting && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
              )}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-gray-700 dark:text-white/70 whitespace-nowrap">
                {isGreeting ? 'Greeting...' : isListening ? 'Stop' : isProcessing ? 'Processing...' : 'Listen'}
              </div>
            </div>

            {/* Camera Toggle Button */}
            <div className="relative group">
              <button 
                onClick={handleToggleCamera}
                disabled={isGreeting}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isGreeting
                    ? 'bg-gray-500/70 cursor-not-allowed text-white/70'
                    : isCameraEnabled 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                      : 'bg-white/10 dark:bg-white/10 hover:bg-white/20 dark:hover:bg-white/20 backdrop-blur-md shadow-md text-gray-900 dark:text-white'
                }`}
                title={
                  isGreeting 
                    ? 'Camera disabled during greeting'
                    : isCameraEnabled 
                      ? 'Turn off camera' 
                      : 'Turn on camera'
                }
              >
                {isCameraEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-gray-700 dark:text-white/70 whitespace-nowrap">
                {isGreeting ? 'Greeting...' : isCameraEnabled ? 'Turn off' : 'Turn on'}
              </div>
            </div>

            {/* Gesture Detection Toggle Button */}
            <div className="relative group">
              <button 
                onClick={() => setIsGestureDetectionActive(!isGestureDetectionActive)}
                disabled={!isCameraEnabled || !isGestureInitialized || isGreeting}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isGreeting
                    ? 'bg-gray-500/70 cursor-not-allowed text-white/70'
                    : !isCameraEnabled || !isGestureInitialized
                      ? 'bg-gray-500/70 cursor-not-allowed text-white/70'
                      : isGestureDetectionActive 
                        ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                        : 'bg-white/10 dark:bg-white/10 hover:bg-white/20 dark:hover:bg-white/20 backdrop-blur-md shadow-md text-gray-900 dark:text-white'
                }`}
                title={
                  isGreeting 
                    ? 'Gesture detection disabled during greeting'
                    : !isCameraEnabled
                      ? 'Enable camera first'
                      : !isGestureInitialized
                        ? 'Gesture detection initializing...'
                        : isGestureDetectionActive 
                          ? 'Turn off gesture detection' 
                          : 'Turn on gesture detection'
                }
              >
                {isGestureDetectionActive ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 3v1h6V3H9zm-2 5v10h10V8H7z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 3v1h6V3H9zm-2 5v10h10V8H7z" />
                  </svg>
                )}
              </button>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-gray-700 dark:text-white/70 whitespace-nowrap">
                {isGreeting ? 'Greeting...' : !isCameraEnabled ? 'Camera off' : !isGestureInitialized ? 'Initializing...' : isGestureDetectionActive ? 'Turn off' : 'Turn on'}
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
                className={`absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-3 mb-3 transition-all duration-200 ${
                  showVolumeSlider ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
                onMouseEnter={showVolumeSliderOnHover}
                onMouseLeave={hideVolumeSliderOnLeave}
              >
                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-xl border border-white/20 dark:border-gray-700/30 px-4 py-3">
                  <div className="flex items-center space-x-3">
                    {/* Volume percentage display */}
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[2.5rem]">
                      {isMuted ? 'Mute' : `${systemVolume}%`}
                    </div>
                    
                    {/* Horizontal slider container */}
                    <div className="relative w-24 h-6 flex items-center">
                      {/* Background track */}
                      <div className="absolute w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      
                      {/* Progress track */}
                      <div 
                        className="absolute h-2 bg-blue-500 rounded-full transition-all duration-200"
                        style={{
                          width: `${isMuted ? 0 : systemVolume}%`
                        }}
                      ></div>
                      
                      {/* Slider input */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : systemVolume}
                        onChange={handleVolumeChange}
                        onMouseEnter={showVolumeSliderOnHover}
                        onMouseLeave={hideVolumeSliderAfterDelay}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        aria-label="Volume control"
                      />
                      
                      {/* Slider thumb */}
                      <div 
                        className="absolute w-4 h-4 bg-white dark:bg-gray-200 rounded-full shadow-md border-2 border-blue-500 transition-all duration-200 pointer-events-none"
                        style={{
                          left: `${isMuted ? 0 : systemVolume}%`,
                          transform: 'translateX(-50%)'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-gray-700 dark:text-white/70 whitespace-nowrap">
               {isMuted ? 'Unmute' : 'Volume'}
              </div>
            </div>

            {/* Captions Toggle Button */}
            <div className="relative group">
              <button 
                onClick={() => setShowCaptions(!showCaptions)}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                  showCaptions 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-white/10 dark:bg-white/10 hover:bg-white/20 dark:hover:bg-white/20 backdrop-blur-md shadow-md text-gray-900 dark:text-white'
                }`}
                title={showCaptions ? 'Hide captions' : 'Show captions'}
              >
                <MessageSquare className="w-6 h-6" />
              </button>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-gray-700 dark:text-white/70 whitespace-nowrap">
                {showCaptions ? 'Hide captions' : 'Show captions'}
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