import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../components/AvatarOptimized'; // Import the optimized Avatar component
import { useVolumeLipSync } from '../hooks/useVolumeLipSync'; // Import the volume lip sync hook
// Removed expression hook import - keeping it simple
import { 
  Loader2, 
  PhoneOff, 
  Mic, 
  MicOff, 
  MessageSquare,
  Volume2,
  VolumeX,
  AlertTriangle,
  User
} from 'lucide-react';

const AvatarCallPage = () => {  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const recognitionRef = useRef(null);
  const [avatarVolume, setAvatarVolume] = useState(0.8); // Volume from 0.0 to 1.0
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [lastMessage, setLastMessage] = useState(''); // For expression system
  const [voiceEnabled, setVoiceEnabled] = useState(false); // Voice control - START DISABLED
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);  const [selectedVoice, setSelectedVoice] = useState(null);
  const [selectedTone, setSelectedTone] = useState('empathetic'); // New tone selector state
  
  // Voice tone options
  const voiceTones = [
    { id: 'empathetic', name: 'Empathetic', description: 'Caring & supportive', voice: 'en-US-JennyNeural' },
    { id: 'cheerful', name: 'Cheerful', description: 'Upbeat & energetic', voice: 'en-US-AriaNeural' },
    { id: 'calm', name: 'Calm', description: 'Professional & measured', voice: 'en-US-MichelleNeural' },
    { id: 'friendly', name: 'Friendly', description: 'Casual & warm', voice: 'en-US-MonicaNeural' }
  ];
  // Volume lip sync integration
  const audioRef = useRef(null);
  const { 
    currentVolume: volume, 
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
  const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);
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
    // Only initialize if not already done and if the API is available
    if (recognitionRef.current) return;
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser');
      // Don't show error for unsupported browsers, just disable the feature
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let isStarting = false;
    let retryCount = 0;
    const MAX_RETRIES = 3;

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
          // Don't show error to user, just disable the feature
        }
      }).finally(() => {
        isStarting = false;
      });
    };

    recognition.onresult = (event) => {
      try {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setRecognizedText(transcript);
        console.log('Recognized text:', transcript);
        
        if (event.results[0].isFinal) {
          console.log('Final recognized text:', transcript);
        }
      } catch (error) {
        console.error('Error processing speech recognition result:', error);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Don't show errors to the user, just log them
      switch(event.error) {
        case 'not-allowed':
          console.warn('Microphone access was denied');
          break;
        case 'network':
          console.warn('Network error occurred with speech recognition');
          break;
        case 'no-speech':
          console.log('No speech detected');
          break;
        default:
          console.warn('Speech recognition error:', event.error);
      }
      
      // Don't set error state, just stop listening
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        // Small delay before restarting to prevent rapid retries
        setTimeout(() => {
          if (isListening) {
            startRecognition();
          }
        }, 100);
      }
    };

    recognitionRef.current = recognition;

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping recognition during cleanup:', e);
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  // Handle starting/stopping recognition when isListening changes
  useEffect(() => {
    if (!recognitionRef.current) {
      console.warn('Speech recognition not available');
      return;
    }

    let timeoutId;
    
    const startListening = async () => {
      try {
        console.log('Attempting to start voice recognition...');
        await recognitionRef.current.start();
        console.log('Voice recognition started successfully');
        setRecognizedText('');
      } catch (error) {
        console.error('Error starting voice recognition:', error);
        // Don't show error to user, just stop listening
        setIsListening(false);
      }
    };

    if (isListening) {
      startListening();
    } else {
      try {
        recognitionRef.current.stop();
        console.log('Voice recognition stopped');
      } catch (error) {
        console.warn('Error stopping voice recognition:', error);
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isListening]);

  const toggleListening = useCallback(() => {
    setIsListening(prev => !prev);
  }, []);

  // Volume control functions with optimized hover
  const volumeHoverTimeoutRef = useRef(null);
  
  const handleVolumeChange = useCallback((newVolume) => {
    setAvatarVolume(newVolume);
  }, []);

  const showVolumeSliderOnHover = useCallback(() => {
    if (volumeHoverTimeoutRef.current) {
      clearTimeout(volumeHoverTimeoutRef.current);
      volumeHoverTimeoutRef.current = null;
    }
    setShowVolumeSlider(true);
  }, []);

  const hideVolumeSliderOnLeave = useCallback(() => {
    // Add a small delay to prevent flickering when moving mouse to slider
    volumeHoverTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false);    }, 150); // 150ms delay
  }, []);

  // Memoize avatar props - simplified with voice support and lip sync
  const avatarProps = useMemo(() => ({
    lastMessage: lastMessage,
    voiceEnabled: voiceEnabled && avatarVolume > 0,
    selectedVoice: selectedVoice,
    onVoiceEnd: handleVoiceEnd,
    avatarVolume: avatarVolume, // Pass volume to avatar
    volumeLipSyncRef: { 
      current: {
        getVolumeValue: () => volume || 0,
        isPlaying: () => lipSyncActive
      }
    } // Provide proper interface for lip sync
  }), [lastMessage, voiceEnabled, avatarVolume, selectedVoice, handleVoiceEnd, volume, lipSyncActive]);
  
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
    <>
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
        }      `}</style>
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Main Video Area */}
      <div className="flex-1 flex relative">
        {/* Video Area */}
        <div className="w-full relative bg-black/20">
          <motion.div 
            className="absolute inset-0 rounded-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ pointerEvents: 'none' }}
          >            {/* Avatar Component - Optimized with memoized props */}
            <div className="absolute inset-0">
              <Avatar {...avatarProps} />
            </div>
            
            {/* Video Overlays */}
            <div className="absolute inset-0 pointer-events-none">
            </div>
          </motion.div>
        </div>
      </div>      {/* Bottom Controls - Always visible */}
      <div className="bg-black/30 backdrop-blur-sm border-t border-gray-700/50 z-40 w-full">
        <div className="flex flex-col items-center justify-center py-4 pb-20 w-full">
          <div className="flex items-center justify-center space-x-4 w-full max-w-2xl mx-auto">{/* Voice Tone Selector - Simplified */}
              <div className="relative voice-selector-container">
                <button 
                  onClick={() => setShowVoiceSelector(!showVoiceSelector)}
                  disabled={!voiceEnabled}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                    voiceEnabled
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30' 
                      : 'bg-gray-700 opacity-50 cursor-not-allowed'
                  }`}
                  title={voiceEnabled ? 'Select Voice Tone' : 'Enable voice first'}
                >
                  <User className="w-6 h-6 text-white" />
                  {voiceEnabled && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                  )}
                </button>

                {/* Voice Tone Selector Dropdown */}
                {showVoiceSelector && voiceEnabled && (
                  <div className="absolute bottom-16 left-0 bg-gray-800 rounded-lg shadow-lg p-2 min-w-60 z-50">
                    <div className="text-white text-sm font-medium mb-2 px-2">Select Voice Tone:</div>
                    {voiceTones.map((tone) => (
                      <button
                        key={tone.id}
                        onClick={() => {
                          selectTone(tone);
                          setShowVoiceSelector(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          selectedTone === tone.id
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <div className="font-medium">{tone.name}</div>
                        <div className="text-xs text-gray-400">{tone.description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
                {/* Voice Input Button - Enhanced with better feedback */}
              <button 
                onClick={toggleListening}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isListening 
                    ? 'bg-green-600 shadow-lg shadow-green-500/50 animate-pulse scale-105' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isListening ? 'Stop Voice Input' : 'Start Voice Input'}
              >
                {isListening ? (
                  <Mic className="w-6 h-6 text-white" />
                ) : (
                  <MicOff className="w-6 h-6 text-gray-300" />
                )}
                {/* Active listening indicator */}
                {isListening && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                )}
              </button>              {/* Voice Enable/Test Button - Simplified */}
              <button 
                onClick={toggleVoiceEnabled}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                  voiceEnabled 
                    ? 'bg-purple-600 shadow-lg shadow-purple-500/50' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={voiceEnabled ? 'Disable Avatar Voice' : 'Enable Avatar Voice'}
              >
                <MessageSquare className={`w-6 h-6 ${voiceEnabled ? 'text-white' : 'text-gray-400'}`} />
                {voiceEnabled && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                )}
              </button>              {/* Avatar Volume Control - Enhanced */}
              <div 
                className="relative volume-control-container p-2 -m-2"
                onMouseEnter={showVolumeSliderOnHover}
                onMouseLeave={hideVolumeSliderOnLeave}
              >
                <button 
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                    avatarVolume === 0 
                      ? 'bg-red-600 shadow-lg shadow-red-500/50 scale-105' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title={`Avatar Volume: ${Math.round(avatarVolume * 100)}%`}
                >
                  {avatarVolume === 0 ? (
                    <VolumeX className="w-6 h-6 text-white" />
                  ) : avatarVolume < 0.5 ? (
                    <Volume2 className="w-6 h-6 text-gray-300" style={{ opacity: 0.7 }} />
                  ) : (
                    <Volume2 className="w-6 h-6 text-gray-300" />
                  )}
                </button>
                
                {/* Volume Slider */}
                {showVolumeSlider && (
                  <div 
                    className="absolute bottom-14 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-xl z-50"
                    onMouseEnter={showVolumeSliderOnHover}
                    onMouseLeave={hideVolumeSliderOnLeave}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <span className="text-sm text-gray-200 font-medium">Avatar Volume</span>
                      <div className="flex items-center space-x-3">
                        <VolumeX className="w-4 h-4 text-gray-400" />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={avatarVolume}
                          onChange={(e) => setAvatarVolume(parseFloat(e.target.value))}
                          className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${avatarVolume * 100}%, #4b5563 ${avatarVolume * 100}%, #4b5563 100%)`
                          }}
                        />
                        <Volume2 className="w-4 h-4 text-gray-400" />
                      </div>
                      <span className="text-sm text-blue-400 font-medium">{Math.round(avatarVolume * 100)}%</span>
                    </div>
                  </div>
                )}
              </div>              {/* End Call Button */}
              <button 
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 transition-all duration-200 hover:bg-red-700"
                title="End Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>            </div>
          </div>
        </div>
    </div>
    </>
  );
};

export default AvatarCallPage;