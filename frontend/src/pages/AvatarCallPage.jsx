import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../components/AvatarOptimized'; // Import the optimized Avatar component
import { useVolumeLipSync } from '../hooks/useVolumeLipSync'; // Import the volume lip sync hook
import { useEmotionDetection } from '../hooks/useEmotionDetection'; // Import the emotion detection hook
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
  Minimize2
} from 'lucide-react';

import voiceService from '../services/voiceService';

// Send message to Ollama and get response
const sendToOllama = async (message, conversationHistory, setConversationHistory, voiceEnabled, setVoiceEnabled, selectedVoice, speakText, setError, setIsProcessing, currentEmotion = 'neutral') => {
  if (!message || !message.trim()) {
    console.warn('Empty message provided to sendToLLM');
    return null;
  }
  
  console.log('Sending to LLM:', { message, currentEmotion, conversationHistory });
  setIsProcessing(true);
  
  const abortController = new AbortController();
  
  try {
    // Create emotion context message
    const emotionContext = {
      happy: "The user appears happy. Respond with an upbeat and positive tone, matching their energy while staying professional.",
      sad: "The user seems sad. Respond with extra empathy, kindness, and support. Offer gentle encouragement.",
      angry: "The user seems frustrated or angry. Respond with patience, understanding, and a calming tone. Avoid being confrontational.",
      surprised: "The user seems surprised. Acknowledge their reaction and provide clear, reassuring information.",
      neutral: "The user's expression is neutral. Maintain a warm, professional, and engaging tone."
    };

    // Prepare messages array ensuring proper format for Ollama
    const messages = [
      // System message with emotion context
      { 
        role: 'system', 
        content: `You are Seriva, an AI wellness companion. ${emotionContext[currentEmotion] || emotionContext.neutral}`
      },
      // Add conversation history (filter out any existing system messages to avoid duplicates)
      ...conversationHistory
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        })),
      // Add current user message
      { 
        role: 'user',
        content: message
      }
    ];

    const requestBody = {
      model: 'llama3',
      messages: messages,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_ctx: 2048
      }
    };

    console.log('Ollama Request:', JSON.stringify(requestBody, null, 2));
    
    const startTime = Date.now();
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: abortController.signal,
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`Ollama response received in ${responseTime}ms`, { status: response.status });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API error:', { status: response.status, errorText });
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Ollama response data:', data);
    
    if (!data.message?.content) {
      throw new Error('No content in Ollama response');
    }
    
    // Update conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: message },
      { role: 'assistant', content: data.message.content }
    ];
    
    setConversationHistory(updatedHistory);
    
    // Convert response to speech with proper voice
    if (data.message.content) {
      console.log('Preparing to speak response...');
      
      // Ensure voice is enabled (no artificial delay)
      if (!voiceEnabled) {
        console.log('Voice was disabled, enabling now...');
        setVoiceEnabled(true);
      }
      
      // Set the selected voice if needed
      if (selectedVoice) {
        console.log('Setting voice to:', selectedVoice);
        voiceService.setVoice(selectedVoice);
      }
      
      // Speak the response without waiting for the voice to be fully ready
      // The voice service will handle any necessary buffering
      console.log('Initiating speech synthesis...');
      speakText(data.message.content).catch(error => {
        console.error('Error in speech synthesis:', error);
      });
    }
    
    return data.message.content;
  } catch (error) {
    console.error('Error in sendToOllama:', error);
    setError('Failed to get response from the AI. Please try again.');
    return null;
  } finally {
    setIsProcessing(false);
  }
};

const AvatarCallPage = () => {  
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);  
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [delayedIsSpeaking, setDelayedIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [systemVolume, setSystemVolume] = useState(80);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [audioElement, setAudioElement] = useState(null);
  const [lastMessage, setLastMessage] = useState(''); // For expression system
  const [voiceEnabled, setVoiceEnabled] = useState(false); // Voice control - START DISABLED
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);  
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [selectedTone, setSelectedTone] = useState('empathetic'); // New tone selector state
  const volumeLipSyncRef = useRef(null); // Add volume lip sync ref
  
  // Emotion state
  const [emotion, setEmotion] = useState('neutral');
  
  // Camera preview state
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  
  // Camera state
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);

  // Emotion detection - starts with camera disabled by default
  const { 
    videoRef, 
    videoStream,
    isReady: isEmotionReady, 
    hasCameraAccess, 
    error: emotionError,
    stopVideo,
    startVideo
  } = useEmotionDetection({ 
    enabled: isCameraEnabled,
    onEmotionDetected: (detectedEmotion) => {
      setEmotion(detectedEmotion);
    }
  });

  // Toggle camera - explicitly starts/stops the camera
  const toggleCamera = useCallback(async () => {
    const newState = !isCameraEnabled;
    console.log('Toggling camera to:', newState);
    
    if (newState) {
      // When enabling camera
      try {
        setIsPreviewVisible(true);
        // First start the video stream
        await startVideo();
        // Then enable the camera flag
        setIsCameraEnabled(true);
      } catch (err) {
        console.error('Failed to start camera:', err);
        setError(new Error('Could not access camera. Please check permissions.'));
        setIsPreviewVisible(false);
        setIsCameraEnabled(false);
      }
    } else {
      // When disabling camera
      setIsCameraEnabled(false);
      // Reset emotion to neutral when camera is off
      setEmotion('neutral');
      
      // Stop any active video tracks
      if (videoRef?.current?.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      
      // Hide preview when camera is off
      setIsPreviewVisible(false);
    }
  }, [isCameraEnabled, startVideo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup camera on unmount
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // Handle camera state changes
  useEffect(() => {
    if (!isCameraEnabled) {
      stopVideo?.();
      setEmotion('neutral');
    } else {
      startVideo?.();
    }
  }, [isCameraEnabled, startVideo, stopVideo]);

  // Log detected emotion
  useEffect(() => {
    if (emotion) {
      console.log('Detected emotion:', emotion);
    }
  }, [emotion]);

  // Handle delayed animation state
  useEffect(() => {
    let timeout;
    if (isSpeaking) {
      timeout = setTimeout(() => {
        setDelayedIsSpeaking(true); // Start animation after 2 seconds
      }, 500);
    } else {
      setDelayedIsSpeaking(false); // Reset immediately if AI stops talking
      clearTimeout(timeout);
    }

    return () => clearTimeout(timeout);
  }, [isSpeaking]);

  // Voice tone options
  const voiceTones = [
    { id: 'empathetic', name: 'Empathetic', description: 'Caring & supportive', voice: 'en-US-JennyNeural' },
    { id: 'cheerful', name: 'Cheerful', description: 'Upbeat & energetic', voice: 'en-US-AriaNeural' },
    { id: 'calm', name: 'Calm', description: 'Professional & measured', voice: 'en-US-MichelleNeural' },
    { id: 'friendly', name: 'Friendly', description: 'Casual & warm', voice: 'en-US-MonicaNeural' }
  ];

  // Handle text-to-speech functionality
  const speakText = useCallback(async (text) => {
    if (!text) {
      console.error('Cannot speak: no text provided');
      return false;
    }
    
    if (!voiceEnabled) {
      console.log('Voice was disabled, enabling now...');
      setVoiceEnabled(true);
    }

    console.log('🔊 Starting to speak text:', text);
    
    // Set voice and speaking state immediately
    if (selectedVoice) {
      console.log('🎙️ Setting voice to:', selectedVoice.displayName);
      voiceService.setVoice(selectedVoice);
    }
    
    // Set the last message but don't start speaking yet
    setLastMessage(text);

    try {
      // Use the voiceService to speak the text
      await voiceService.speak(text, {
        onStart: () => {
          console.log('🎤 Speech started, starting talking animation');
          // Start the talking animation after delay
          setIsSpeaking(true);
        },
        onEnd: () => {
          console.log('✅ Speech ended');
          setIsSpeaking(false);
          setLastMessage(''); // Clear the last message when done speaking
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
  // Voice enable/disable handler with immediate talking activation
  const toggleVoiceEnabled = useCallback(() => {
    const newVoiceState = !voiceEnabled;
    setVoiceEnabled(newVoiceState);
    
    if (newVoiceState) {      // When enabling voice, prepare welcome message but don't set it yet
      const welcomeMessage = "Hey! I am Seriva, your AI companion. I'm ready to talk with you!";
      
      // Import and use the voice service to speak immediately
      import('../services/voiceService').then(({ default: voiceService }) => {
        if (selectedVoice) {
          voiceService.setVoice(selectedVoice);
        }
          // Set up the audio element reference for lip sync
        const audioElement = voiceService.getAudioElement();
        if (audioElement && audioRef.current !== audioElement) {
          audioRef.current = audioElement;
          setupVolumeAnalysis(audioElement);
          console.log('🎵 Audio element connected to lip sync system');
        }
          
        // Speak the welcome message with synchronized animation
        voiceService.speak(welcomeMessage, {
          onStart: () => {
            // Only switch to talking mode when voice actually starts
            setLastMessage(welcomeMessage);
            
            // Get the audio element again in case it changed
            const currentAudioElement = voiceService.getAudioElement();
            if (currentAudioElement && currentAudioElement !== audioRef.current) {
              audioRef.current = currentAudioElement;
              setupVolumeAnalysis(currentAudioElement);
            }
            
            startLipSync(); // Start lip sync when speaking begins
            console.log('🎵 Welcome message started - Avatar switching to talking mode and lip sync enabled');
          },
          onEnd: () => {
            // When message ends, turn off voice and return to idle
            setVoiceEnabled(false);
            setLastMessage(''); // Clear message to return to idle
            stopLipSync(); // Stop lip sync when speaking ends
            console.log('🎵 Welcome message ended - Avatar returning to idle, voice disabled, and lip sync stopped');
          },
          onError: (error) => {
            console.error('❌ Welcome message failed:', error);
            // On error, also turn off voice
            setVoiceEnabled(false);
            setLastMessage('');
            stopLipSync(); // Stop lip sync on error
          }
        });
      });
      
      console.log('✅ Voice enabled - Preparing welcome message...');    } else {
      // When disabling voice, stop any ongoing speech and clear message
      setLastMessage(''); // Clear message to return to idle immediately
      stopLipSync(); // Stop lip sync when voice is disabled
      import('../services/voiceService').then(({ default: voiceService }) => {
        voiceService.stop();
        console.log('🔇 Voice disabled - stopping any ongoing speech and lip sync');
      });
    }
  }, [voiceEnabled, selectedVoice, setupVolumeAnalysis, startLipSync, stopLipSync]);
  
  // Tone selection handler
  const selectTone = useCallback((tone) => {
    setSelectedTone(tone.id);
    
    // Find the corresponding voice from available voices
    const toneVoice = availableVoices.find(v => v.name === tone.voice);
    if (toneVoice && voiceEnabled) {
      setSelectedVoice(toneVoice);
      
      // Test the selected tone with a sample phrase
      import('../services/voiceService').then(({ default: voiceService }) => {
        voiceService.setVoice(toneVoice);
        const sampleMessage = `Hi! I'm Seriva in ${tone.name.toLowerCase()} mode. ${tone.description}.`;
        voiceService.speak(sampleMessage).catch(error => {
          console.error('❌ Tone test failed:', error);
        });
      });
    }
  }, [availableVoices, voiceEnabled]);
  // Callback for when voice ends - turns off voice button
  const handleVoiceEnd = useCallback(() => {
    setVoiceEnabled(false);
    setLastMessage(''); // Clear message to return to idle
    stopLipSync(); // Stop lip sync when voice ends
    console.log('🔇 Voice ended - Avatar voice disabled, returning to idle, and lip sync stopped');
  }, [stopLipSync]);
  
  // Initialize speech recognition on component mount
  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const errorMsg = 'Speech recognition not supported in this browser';
      console.error(errorMsg);
      setError('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
      return;
    }

    console.log('Initializing speech recognition...');
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    console.log('Speech recognition settings:', {
      continuous: recognition.continuous,
      interimResults: recognition.interimResults,
      lang: recognition.lang
    });

    let isStarting = false;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    let recognitionCleanup = null;

    const startRecognition = () => {
      if (isStarting || retryCount >= MAX_RETRIES) return;
      isStarting = true;
      
      console.log('Starting speech recognition, attempt', retryCount + 1);
      
      recognition.start().then(() => {
        console.log('Speech recognition started successfully');
        retryCount = 0; // Reset retry count on success
        setError(null); // Clear any previous errors
      }).catch(error => {
        console.error('Failed to start speech recognition:', error);
        retryCount++;
        
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying in 1 second... (${retryCount}/${MAX_RETRIES})`);
          setTimeout(() => {
            if (isListening) startRecognition();
          }, 1000);
        } else {
          console.error('Max retries reached, giving up');
          setIsListening(false);
        }
      }).finally(() => {
        isStarting = false;
      });
    };

    // Set up audio element for lip sync
    try {
      const audioElement = voiceService.getAudioElement();
      if (audioElement && audioRef.current !== audioElement) {
        audioRef.current = audioElement;
      }
    } catch (error) {
      console.error('Error processing speech recognition result:', error);
    }

    // Handle recognition results
    recognition.onresult = (event) => {
      console.log('🎤 Speech recognition result received');
      
      let interimTranscript = '';
      let finalTranscript = '';

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || '';
        
        if (result.isFinal) {
          finalTranscript += transcript;
          console.log('✅ Final transcript:', finalTranscript);
          
          // Update the recognized text state
          setRecognizedText(prev => {
            // Only update if the text is different to avoid unnecessary re-renders
            const newText = finalTranscript.trim();
            return prev !== newText ? newText : prev;
          });
          
        } else {
          interimTranscript += transcript;
          console.log('⏳ Interim transcript:', interimTranscript);
        }
      }
    };

    // Handle when recognition ends
    recognition.onend = () => {
      console.log('🔴 Speech recognition ended');
      if (isListening) {
        console.log('🔄 Restarting speech recognition...');
        try {
          recognition.start();
        } catch (error) {
          console.error('❌ Error restarting recognition:', error);
          setIsListening(false);
        }
      }
    };

    // Handle recognition errors
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', {
        error: event.error,
        message: event.message || 'No error message',
        time: new Date().toISOString()
      });
      
      let errorMessage = 'Error with speech recognition';
      
      switch(event.error) {
        case 'not-allowed':
          errorMessage = 'Microphone access was denied. Please allow microphone access in your browser settings to use voice commands.';
          console.warn('Microphone access was denied or blocked');
          break;
        case 'network':
          errorMessage = 'Network error occurred with speech recognition. Please check your connection.';
          console.warn('Network error occurred with speech recognition');
          break;
        case 'no-speech':
          errorMessage = 'No speech was detected. Please try speaking again.';
          console.log('No speech detected');
          break;
        case 'audio-capture':
          errorMessage = 'No microphone was found. Please ensure a microphone is connected.';
          console.error('No microphone found');
          break;
        default:
          console.warn('Speech recognition error:', event.error);
      }
      
      setError(errorMessage);
      setIsListening(false);
      
      // Additional debug information
      if (navigator.mediaDevices) {
        navigator.mediaDevices.enumerateDevices()
          .then(devices => {
            console.log('Available devices:', devices);
            const audioInputs = devices.filter(device => device.kind === 'audioinput');
            console.log('Audio input devices:', audioInputs);
          })
          .catch(err => console.error('Error enumerating devices:', err));
      }
      setIsProcessing(false);
    };

    // When recognition ends, check if we should restart
    recognition.onend = () => {
      if (isListening) {
        console.log('Speech recognition ended, restarting...');
        try {
          recognition.start();
        } catch (error) {
          console.error('Error restarting recognition:', error);
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;

    // Store recognition in ref for cleanup
    recognitionRef.current = recognition;
    
    // Cleanup function
    return () => {
      console.log('Cleaning up speech recognition...');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          console.log('Speech recognition stopped during cleanup');
        } catch (e) {
          console.error('Error stopping recognition during cleanup:', e);
        } finally {
          recognitionRef.current = null;
        }
      }
      
      // Clean up any ongoing speech synthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        console.log('Cancelled any ongoing speech synthesis');
      }
      
      // Clean up any ongoing processing
      setIsProcessing(false);
      setIsListening(false);
    };
  }, []);

  // Handle recognized text and update conversation
  useEffect(() => {
    if (!recognizedText || recognizedText.trim() === '') return;
    
    // Check if this is a duplicate message to prevent infinite loops
    const lastMessage = conversationHistory[conversationHistory.length - 1]?.content;
    if (lastMessage === recognizedText) return;
    
    console.log('🎤 Processing recognized text:', recognizedText);
    
    const processText = async () => {
      try {
        console.log('🔄 Adding message to conversation history...');
        const userMessage = { role: 'user', content: recognizedText, timestamp: Date.now() };
        const updatedHistory = [...conversationHistory, userMessage];
        
        setConversationHistory(updatedHistory);
        console.log('✅ Successfully updated conversation history');
        
        // Reset recognizedText to prevent reprocessing
        setRecognizedText('');
        
        // Ensure voice is enabled before proceeding
        let finalVoiceEnabled = voiceEnabled;
        if (!finalVoiceEnabled) {
          console.log('🔊 Voice was disabled, enabling now...');
          setVoiceEnabled(true);
          finalVoiceEnabled = true;
          // Small delay to allow voice to initialize
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Call Ollama API to get response
        console.log('📡 Sending to Ollama API with emotion:', emotion);
        const response = await sendToOllama(
          recognizedText,
          updatedHistory,
          setConversationHistory,
          finalVoiceEnabled, // Use the local variable instead of state
          setVoiceEnabled,
          selectedVoice,
          speakText,
          setError,
          setIsProcessing,
          emotion // Pass the current emotion to the LLM
        );
        
        if (response) {
          console.log('🤖 Ollama response received successfully');
        } else {
          console.warn('⚠️ No response received from Ollama');
        }
        
      } catch (error) {
        console.error('❌ Error processing recognized text:', error);
        setError('Failed to process the message. Please try again.');
      }
    };
    
    processText();
  }, [recognizedText, conversationHistory, setConversationHistory, setError, voiceEnabled, selectedVoice, speakText]);
  
  // Handle starting/stopping recognition when isListening changes
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      console.warn('Speech recognition not available');
      return;
    }
    
    let isMounted = true;
    
    const startRecognition = async () => {
      if (!isListening || !isMounted) return;
      
      try {
        console.log('🎤 Starting speech recognition...');
        recognition.start();
      } catch (error) {
        console.error('❌ Failed to start speech recognition:', error);
        if (isMounted) {
          setIsListening(false);
          setError('Failed to start speech recognition. Please check your microphone settings.');
        }
      }
    };
    
    const stopRecognition = () => {
      try {
        console.log('🛑 Stopping speech recognition...');
        recognition.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    };
    
    if (isListening) {
      startRecognition();
    } else {
      stopRecognition();
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
      stopRecognition();
    };
  }, [isListening, setError]);
  
  // Toggle voice recognition
  const toggleListening = useCallback(() => {
    if (isProcessing) {
      // If currently processing, cancel the current request
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsProcessing(false);
      setIsListening(false);
      return;
    }
    
    setIsListening(prev => !prev);
  }, [isProcessing]);

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
  }, [isMuted]);

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
  
  const endCall = () => {
    // Handle ending the call
    console.log('Ending call...');
  };  // Demo messages for expression system (without automatic talking)
  useEffect(() => {
    if (isLoading || error) return;

    const demoMessages = [
      "Hello! I'm so happy to see you today!",
      "How are you feeling right now?",
      "That's wonderful to hear!",
      "I understand how you feel.",
      "Oh no, I'm sorry to hear that.",
      "That's amazing! Congratulations!",
      "I'm here to listen and support you.",
      "What would you like to talk about?",
      "You're doing great!",
      "I appreciate you sharing that with me."
    ];    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      setLastMessage(demoMessages[messageIndex]);
      messageIndex = (messageIndex + 1) % demoMessages.length;
    }, 8000); // New message every 8 seconds

    return () => clearInterval(messageInterval);
  }, [isLoading, error]);

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
        
        // Set default voice based on selected tone (empathetic = Jenny)
        if (AZURE_NEURAL_VOICES.length > 0 && !selectedVoice) {
          const defaultTone = voiceTones.find(t => t.id === selectedTone);
          const defaultVoice = AZURE_NEURAL_VOICES.find(v => 
            v.name === defaultTone?.voice
          ) || AZURE_NEURAL_VOICES[0];
          
          setSelectedVoice(defaultVoice);
        }
      });
    };

    loadVoices();
  }, [selectedVoice, selectedTone]);  // Close voice selector when clicking outside
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
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
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            position: 'absolute',
            top: '-9999px',
            left: '-9999px',
            width: '1px',
            height: '1px',
            opacity: 0,
            pointerEvents: 'none',
          }}
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
      {/* Camera Preview */}
      {isPreviewVisible && isCameraEnabled && (
        <motion.div 
          className={`fixed right-4 z-50 bg-black/80 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 backdrop-blur-sm transition-all duration-300 ${
            isPreviewExpanded 
              ? 'bottom-24 w-[500px] h-[375px]' 
              : 'bottom-24 w-[320px] h-[240px]'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover transform -scale-x-100"
              style={{ transform: 'scaleX(-1)' }}
            />
            <div className="absolute top-2 right-2 flex space-x-1">
              <button 
                onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                className="p-1.5 bg-black/60 rounded-full text-white hover:bg-white/20 transition-colors"
                title={isPreviewExpanded ? 'Minimize' : 'Maximize'}
              >
                {isPreviewExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
              <button 
                onClick={() => setIsPreviewVisible(false)}
                className="p-1.5 bg-black/60 rounded-full text-white hover:bg-white/20 transition-colors"
                title="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {emotion && (
              <div className="absolute bottom-2 left-2 px-3 py-1.5 bg-black/60 text-white text-sm rounded-md font-medium">
                {emotion}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Enhanced Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-sm z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center space-x-2 md:space-x-4">
            {/* Voice Input Button */}
            <div className="relative group">
              <button 
                onClick={toggleListening}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform ${
                  isListening 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 scale-110' 
                    : 'bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-md'
                }`}
                title={isListening ? 'Stop Voice Input' : 'Start Voice Input'}
              >
                {isListening ? (
                  <Mic className="w-7 h-7 text-white" />
                ) : (
                  <MicOff className="w-6 h-6 text-white/80" />
                )}
              </button>
              {isListening && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
              )}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-white/70 whitespace-nowrap">
                {isListening ? 'Listening...' : 'Voice Input'}
              </div>
            </div>

            {/* Voice Tone Selector */}
            <div className="relative group">
              <button 
                onClick={() => setShowVoiceSelector(!showVoiceSelector)}
                disabled={!voiceEnabled}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform ${
                  voiceEnabled
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/30 hover:scale-105' 
                    : 'bg-white/10 opacity-50 cursor-not-allowed'
                }`}
                title={voiceEnabled ? 'Change Voice Tone' : 'Enable voice first'}
              >
                <User className="w-6 h-6 text-white" />
                {voiceEnabled && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                )}
              </button>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-white/70 whitespace-nowrap">
                Voice Tone
              </div>

              {/* Voice Tone Dropdown */}
              <AnimatePresence>
                {showVoiceSelector && voiceEnabled && (
                  <motion.div 
                    className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800/95 backdrop-blur-lg rounded-xl shadow-2xl p-2 min-w-64 z-50 border border-gray-700/50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <div className="text-white text-sm font-medium mb-2 px-2">Select Voice Tone</div>
                    <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                      {voiceTones.map((tone) => (
                        <button
                          key={tone.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectTone(tone);
                            setShowVoiceSelector(false);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center ${
                            selectedTone === tone.id
                              ? 'bg-gradient-to-r from-blue-600/80 to-blue-700/80 text-white shadow-md'
                              : 'text-gray-200 hover:bg-gray-700/80'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{tone.name}</div>
                            <div className="text-xs text-gray-400">{tone.description}</div>
                          </div>
                          {selectedTone === tone.id && (
                            <Check className="w-4 h-4 text-blue-300" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Camera Toggle */}
            <div className="relative group">
              {isPreviewVisible && isCameraEnabled && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              )}
              <button 
                onClick={toggleCamera}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform ${
                  isCameraEnabled 
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30 hover:scale-105' 
                    : 'bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-md'
                }`}
                title={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {isCameraEnabled ? (
                  <Video className="w-6 h-6 text-white" />
                ) : (
                  <VideoOff className="w-6 h-6 text-white/80" />
                )}
              </button>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-white/70 whitespace-nowrap">
                {isCameraEnabled ? 'Camera On' : 'Camera Off'}
              </div>
            </div>

            {/* Volume Control */}
            <div 
              className="relative group"
              onMouseEnter={showVolumeSliderOnHover}
              onMouseLeave={hideVolumeSliderAfterDelay}
            >
              <button 
                onClick={toggleMute}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform ${
                  isMuted || systemVolume === 0
                    ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/30 scale-105' 
                    : 'bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-md hover:scale-105'
                }`}
                title={isMuted ? 'Unmute' : `Volume: ${systemVolume}%`}
              >
                {getVolumeIcon()}
              </button>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-white/70 whitespace-nowrap">
                {isMuted ? 'Unmute' : 'Volume'}
              </div>

              {/* Volume Slider */}
              <AnimatePresence>
                {showVolumeSlider && (
                  <motion.div 
                    className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800/95 backdrop-blur-lg rounded-xl p-4 shadow-2xl z-50 border border-gray-700/50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    onMouseEnter={showVolumeSliderOnHover}
                    onMouseLeave={hideVolumeSliderAfterDelay}
                  >
                    <div className="w-8 h-32 flex items-center justify-center">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="1"
                        value={systemVolume}
                        onChange={handleVolumeChange}
                        className="volume-slider w-32 h-2 bg-gray-700 rounded-full appearance-none cursor-pointer transform -rotate-90"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${systemVolume}%, #4b5563 ${systemVolume}%, #4b5563 100%)`
                        }}
                      />
                    </div>
                    <div className="text-center text-xs text-gray-300 mt-2">{systemVolume}%</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* End Call Button */}
            <div className="relative group">
              <button 
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30 transition-all duration-300 transform hover:scale-110 hover:shadow-red-500/50"
                title="End Call"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-white/70 whitespace-nowrap">
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