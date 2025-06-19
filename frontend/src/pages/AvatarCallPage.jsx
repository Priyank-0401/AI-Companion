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
  Maximize,
  Minimize,
  Clock,
  Wifi,
  WifiOff,
  User
} from 'lucide-react';

const AvatarCallPage = () => {  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [avatarVolume, setAvatarVolume] = useState(0.8); // Volume from 0.0 to 1.0
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showHeader, setShowHeader] = useState(true);  
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('excellent');
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
  
  // Removed greeting and expression management - keeping it simple

  // Simulate call duration timer
  useEffect(() => {
    if (!isLoading && !error) {
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLoading, error]);
  // Memoize format duration function to prevent re-creation
  const formatDuration = useCallback((seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);// Auto-hide controls in fullscreen mode only
  useEffect(() => {
    let timer;
    if (isFullscreen && showControls) {
      timer = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [showControls, isFullscreen]);

  // Auto-hide header in fullscreen mode only
  useEffect(() => {
    let timer;
    if (isFullscreen && showHeader) {
      timer = setTimeout(() => setShowHeader(false), 3000);
    }
    return () => clearTimeout(timer);  }, [showHeader, isFullscreen]);
  
  // Handle fullscreen mode transitions
  useEffect(() => {
    if (isFullscreen) {
      // Hide controls and header when entering fullscreen
      setShowControls(false);
      setShowHeader(false);
    } else {
      // Show controls and header when exiting fullscreen (windowed mode)
      setShowControls(true);
      setShowHeader(true);
    }
    }, [isFullscreen]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Simulate an error for demonstration if needed
      // setError("Could not connect to the avatar service. Please try again later.");
    }, 2500);    return () => clearTimeout(timer);
  }, []);
  // Removed greeting functionality - keeping it simple

  // Memoize toggle functions to prevent unnecessary re-renders  const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);
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
  const toggleListening = useCallback(() => {
    setIsListening(prev => {
      const newValue = !prev;
      if (newValue) {
        // Start voice recognition - placeholder for future implementation
        // TODO: Integrate with speech-to-text API (Web Speech API or Azure Speech)
      } else {
        // Stop voice recognition
        // TODO: Stop speech recognition and cleanup
      }
      return newValue;
    });
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
      setShowVolumeSlider(false);
    }, 150); // 150ms delay
  }, []);
  const toggleFullscreen = useCallback(() => setIsFullscreen(prev => !prev), []);  // Memoize avatar props - simplified with voice support and lip sync
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

  if (isLoading) {
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
  if (error) {
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
  }  return (
    <>
      {/* Custom styles for volume slider */}
      <style jsx>{`
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
    <div 
      className={`${isFullscreen ? 'fixed inset-0 z-50' : ''} flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden`}
    >
      {/* Header Bar - Always visible in windowed mode, hover in fullscreen */}
      {isFullscreen ? (
        <div 
          className="absolute top-0 left-0 right-0 h-24 z-50 group"
          onMouseEnter={() => setShowHeader(true)}
          onMouseLeave={() => setShowHeader(false)}
          style={{ pointerEvents: 'auto' }}
        >
          {/* Subtle hover indicator */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-2 bg-white/20 rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <AnimatePresence>
            {showHeader && (
              <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-black/50 backdrop-blur-sm border-b border-gray-700/50 h-full"
              >
                <div className="flex items-center justify-between px-6 py-4 h-full">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Seriva AI Companion</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(callDuration)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {connectionQuality === 'excellent' ? (
                        <Wifi className="w-4 h-4 text-green-500" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-xs text-gray-400 capitalize">{connectionQuality}</span>
                    </div>
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Minimize className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        // Always visible header in windowed mode
        <div className="bg-black/30 backdrop-blur-sm border-b border-gray-700/50 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Seriva AI Companion</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(callDuration)}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {connectionQuality === 'excellent' ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs text-gray-400 capitalize">{connectionQuality}</span>
              </div>
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Enter Fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}      {/* Main Video Area */}
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
            <div className="absolute inset-0 pointer-events-none">              {/* Top Status Indicators */}              <div className="absolute top-6 left-6 flex flex-col space-y-2">
                <div className="px-3 py-2 bg-black/60 rounded-lg backdrop-blur-sm">
                  <span className={`text-sm font-medium flex items-center space-x-2 ${voiceEnabled ? 'text-purple-400' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${voiceEnabled ? 'bg-purple-400 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span>{voiceEnabled ? 'Voice Enabled' : 'Voice Disabled'}</span>
                  </span>
                </div>
                {selectedVoice && voiceEnabled && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-3 py-2 bg-purple-500/20 rounded-lg backdrop-blur-sm border border-purple-500/30"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-1 h-4 bg-purple-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-6 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-1 h-5 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                      </div>
                      <span className="text-xs text-purple-300">{selectedVoice?.displayName || selectedVoice?.name?.replace('Neural', '') || 'Azure Neural Voice Ready'}</span>
                    </div>
                  </motion.div>
                )}                {/* Show current avatar state */}
                <div className="px-3 py-2 bg-black/50 rounded-lg backdrop-blur-sm">
                  <span className="text-xs text-gray-300 flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${voiceEnabled ? 'bg-green-400' : 'bg-blue-400'}`}></div>
                    <span>Avatar: {voiceEnabled ? 'Ready to Talk' : 'Idle Mode'}</span>
                  </span>
                </div>
                {/* Lip sync status indicator */}
                {lipSyncActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="px-3 py-2 bg-cyan-500/20 rounded-lg backdrop-blur-sm border border-cyan-500/30"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-cyan-400 rounded-full animate-pulse"                            style={{
                              height: `${12 + ((volume || 0) * 20)}px`,
                              animationDelay: `${i * 0.1}s`
                            }}
                          />
                        ))}
                      </div>                      <span className="text-xs text-cyan-300">
                        Lip Sync: {Math.round((volume || 0) * 100)}%
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>{/* Bottom Controls - Always visible in windowed mode, hover in fullscreen */}
      {isFullscreen ? (
        <div 
          className="absolute bottom-8 left-0 right-0 h-32 z-50 group"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
          style={{ pointerEvents: 'auto' }}
        >
          {/* Subtle hover indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-24 h-2 bg-white/20 rounded-t-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ duration: 0.3 }}                className="bg-black/50 backdrop-blur-sm border-t border-gray-700/50 h-full"
              >                <div className="flex items-center justify-center h-full pb-4">                  <div className="flex items-center space-x-4">
                    {/* Mute Button */}
                    <button 
                      onClick={toggleMute}
                      className={`w-14 h-14 rounded-full flex items-center justify-center ${
                        isMuted 
                          ? 'bg-red-600 shadow-lg shadow-red-500/30' 
                          : 'bg-gray-700'
                      }`}
                      title={isMuted ? 'Unmute' : 'Mute'}                    >
                      {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>                    {/* Select Voice Button */}
                    <div className="relative voice-selector-container">
                      <button 
                        onClick={() => setShowVoiceSelector(!showVoiceSelector)}
                        disabled={availableVoices.length === 0}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                          voiceEnabled && availableVoices.length > 0
                            ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30' 
                            : 'bg-gray-700 opacity-50 cursor-not-allowed'
                        }`}
                        title={voiceEnabled ? 'Select Avatar Voice' : 'Enable voice first'}
                      >
                        <User className="w-6 h-6 text-white" />
                        {selectedVoice && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-400 rounded-full"></div>
                        )}
                      </button>

                      {/* Voice Selector Dropdown */}
                      {showVoiceSelector && voiceEnabled && availableVoices.length > 0 && (
                        <div className="absolute bottom-16 left-0 bg-gray-800 rounded-lg shadow-lg p-2 min-w-80 max-h-60 overflow-y-auto z-50">
                          <div className="text-white text-sm font-medium mb-2 px-2">Select Azure Neural Voice:</div>
                          {availableVoices.map((voice, index) => (
                            <button
                              key={`${voice.name}-${index}`}
                              onClick={() => selectVoice(voice)}
                              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                                selectedVoice?.name === voice.name
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-gray-300 hover:bg-gray-700'
                              }`}
                            >
                              <div className="font-medium truncate">{voice.displayName}</div>
                              <div className="text-xs text-gray-400">{voice.language} • Neural • Styles: {voice.styles.join(', ')}</div>
                              <div className="text-xs text-gray-500 mt-1">{voice.characteristics}</div>
                            </button>
                          ))}
                          {availableVoices.length === 0 && (
                            <div className="text-gray-400 text-sm px-2 py-4 text-center">No Azure Neural voices available</div>
                          )}
                        </div>
                      )}
                    </div>                    {/* Volume Control Button */}
                    <div 
                      className="relative volume-control-container p-2 -m-2"
                      onMouseEnter={showVolumeSliderOnHover}
                      onMouseLeave={hideVolumeSliderOnLeave}
                    >
                      <button 
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                          avatarVolume === 0 
                            ? 'bg-red-600 shadow-lg shadow-red-500/30' 
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        title={`Avatar Volume: ${Math.round(avatarVolume * 100)}%`}
                      >
                        {avatarVolume === 0 ? (
                          <VolumeX className="w-6 h-6" />
                        ) : avatarVolume < 0.5 ? (
                          <Volume2 className="w-6 h-6" style={{ opacity: 0.6 }} />
                        ) : (
                          <Volume2 className="w-6 h-6" />
                        )}
                      </button>
                      
                      {/* Volume Slider */}
                      {showVolumeSlider && (
                        <div 
                          className="absolute bottom-14 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg p-3 shadow-lg"
                          onMouseEnter={showVolumeSliderOnHover}
                          onMouseLeave={hideVolumeSliderOnLeave}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <span className="text-xs text-gray-300">Volume</span>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={avatarVolume}
                              onChange={(e) => setAvatarVolume(parseFloat(e.target.value))}
                              className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <span className="text-xs text-gray-400">{Math.round(avatarVolume * 100)}%</span>
                          </div>
                        </div>
                      )}
                    </div>{/* Voice Toggle Button */}
                    <button 
                      onClick={toggleVoiceEnabled}
                      className={`w-14 h-14 rounded-full flex items-center justify-center ${
                        voiceEnabled 
                          ? 'bg-purple-600 shadow-lg shadow-purple-500/30' 
                          : 'bg-gray-700'
                      }`}
                      title={voiceEnabled ? 'Disable Avatar Voice - Avatar will stop speaking and return to idle' : 'Enable Avatar Voice - Avatar will speak welcome message and switch to talking mode'}
                    >
                      <User className={`w-6 h-6 ${voiceEnabled ? 'text-white' : 'text-gray-400'}`} />
                      {voiceEnabled && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                      )}
                    </button>

                    {/* End Call Button */}
                    <button 
                      onClick={endCall}
                      className="w-16 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30"
                      title="End Call"
                    >
                      <PhoneOff className="w-7 h-7" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (        // Always visible controls in windowed mode
        <div className="bg-black/30 backdrop-blur-sm border-t border-gray-700/50 z-40">
          <div className="flex items-center justify-center py-4 pb-20">            <div className="flex items-center space-x-4">              {/* Voice Tone Selector - Simplified */}
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
                title={voiceEnabled ? 'Disable Avatar Voice' : 'Enable & Test Avatar Voice'}
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
                  {/* Volume level indicator */}
                  {avatarVolume > 0 && (
                    <div 
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-400"
                      style={{ 
                        opacity: avatarVolume,
                        transform: `scale(${0.8 + (avatarVolume * 0.4)})` 
                      }}
                    ></div>
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
              </div>

              {/* End Call Button */}
              <button 
                onClick={endCall}
                className="w-16 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30"
                title="End Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default AvatarCallPage;