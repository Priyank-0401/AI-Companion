import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../components/AvatarOptimized'; // Import the optimized Avatar component
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

const AvatarCallPage = () => {  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showHeader, setShowHeader] = useState(true);  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('excellent');
  const [audioElement, setAudioElement] = useState(null);  const [lastMessage, setLastMessage] = useState(''); // For expression system
  const [voiceEnabled, setVoiceEnabled] = useState(false); // Voice control - START DISABLED
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  
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
          // Speak the welcome message with synchronized animation
        voiceService.speak(welcomeMessage, {
          onStart: () => {
            // Only switch to talking mode when voice actually starts
            setLastMessage(welcomeMessage);
            console.log('🎵 Welcome message started - Avatar switching to talking mode now');
          },
          onEnd: () => {
            // When message ends, turn off voice and return to idle
            setVoiceEnabled(false);
            setLastMessage(''); // Clear message to return to idle
            console.log('🎵 Welcome message ended - Avatar returning to idle and voice disabled');
          },
          onError: (error) => {
            console.error('❌ Welcome message failed:', error);
            // On error, also turn off voice
            setVoiceEnabled(false);
            setLastMessage('');
          }
        });
      });
      
      console.log('✅ Voice enabled - Preparing welcome message...');    } else {
      // When disabling voice, stop any ongoing speech and clear message
      setLastMessage(''); // Clear message to return to idle immediately
      import('../services/voiceService').then(({ default: voiceService }) => {
        voiceService.stop();
        console.log('🔇 Voice disabled - stopping any ongoing speech');
      });
    }
  }, [voiceEnabled, selectedVoice]);

  // Callback for when voice ends - turns off voice button
  const handleVoiceEnd = useCallback(() => {
    setVoiceEnabled(false);
    setLastMessage(''); // Clear message to return to idle
    console.log('🔇 Voice ended - Avatar voice disabled and returning to idle');
  }, []);

  const toggleListening = useCallback(() => {
    setIsListening(prev => {
      const newValue = !prev;
      if (newValue) {
        // Start voice recognition
        console.log('🎤 Started listening for user input');
        // TODO: Implement speech recognition here
      } else {
        // Stop voice recognition
        console.log('🔇 Stopped listening for user input');
        // TODO: Stop speech recognition here
      }
      return newValue;
    });
  }, []);
  
  const toggleSpeaker = useCallback(() => setIsSpeakerOn(prev => !prev), []);
  const toggleFullscreen = useCallback(() => setIsFullscreen(prev => !prev), []);  // Memoize avatar props - simplified with voice support
  const avatarProps = useMemo(() => ({
    lastMessage: lastMessage,
    voiceEnabled: voiceEnabled && isSpeakerOn,
    selectedVoice: selectedVoice,
    onVoiceEnd: handleVoiceEnd
  }), [lastMessage, voiceEnabled, isSpeakerOn, selectedVoice, handleVoiceEnd]);
  
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
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      setLastMessage(demoMessages[messageIndex]);
      messageIndex = (messageIndex + 1) % demoMessages.length;
      
      // Only update message for expression system, don't auto-start talking
      console.log('� Demo message updated for expressions:', demoMessages[messageIndex - 1]);
    }, 8000); // New message every 8 seconds    return () => clearInterval(messageInterval);
  }, [isLoading, error]);  // Stop avatar speaking when voice is disabled
  useEffect(() => {
    if (!voiceEnabled) {
      // Import and stop the voice service when voice is disabled
      import('../services/voiceService').then(({ default: voiceService }) => {
        voiceService.stop();
        console.log('🔇 Voice disabled - stopping any ongoing speech');
      });
    }
  }, [voiceEnabled]);
  // Load available Azure Neural voices
  useEffect(() => {
    const loadVoices = () => {
      // Import Azure Neural voices directly
      import('../services/voiceService').then(({ AZURE_NEURAL_VOICES }) => {
        setAvailableVoices(AZURE_NEURAL_VOICES);
        
        // Set default voice (Jenny Neural - friendly and warm)
        if (AZURE_NEURAL_VOICES.length > 0 && !selectedVoice) {
          const defaultVoice = AZURE_NEURAL_VOICES.find(v => 
            v.name.includes('JennyNeural')
          ) || AZURE_NEURAL_VOICES[0];
          
          setSelectedVoice(defaultVoice);
        }
        
        console.log('🎵 Available Azure Neural voices:', AZURE_NEURAL_VOICES.map(v => ({ 
          name: v.displayName, 
          technical: v.name,
          styles: v.styles 
        })));
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
                )}
                {/* Show current avatar state */}
                <div className="px-3 py-2 bg-black/50 rounded-lg backdrop-blur-sm">
                  <span className="text-xs text-gray-300 flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${voiceEnabled ? 'bg-green-400' : 'bg-blue-400'}`}></div>
                    <span>Avatar: {voiceEnabled ? 'Ready to Talk' : 'Idle Mode'}</span>
                  </span>
                </div>
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
                    </div>{/* Speaker Button */}
                    <button 
                      onClick={toggleSpeaker}
                      className={`w-14 h-14 rounded-full flex items-center justify-center ${
                        !isSpeakerOn 
                          ? 'bg-red-600 shadow-lg shadow-red-500/30' 
                          : 'bg-gray-700'
                      }`}
                      title={isSpeakerOn ? 'Mute Speaker' : 'Unmute Speaker'}
                    >
                      {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                    </button>                    {/* Voice Toggle Button */}
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
          <div className="flex items-center justify-center py-4 pb-20">            <div className="flex items-center space-x-4">              {/* Select Voice Button */}
              <div className="relative voice-selector-container">
                <button 
                  onClick={() => setShowVoiceSelector(!showVoiceSelector)}
                  disabled={!voiceEnabled || availableVoices.length === 0}
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
              </div>
              
              {/* Voice Input Button */}
              <button 
                onClick={toggleListening}
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  isListening 
                    ? 'bg-green-600 shadow-lg shadow-green-500/30 animate-pulse' 
                    : 'bg-gray-700'
                }`}
                title={isListening ? 'Stop Listening' : 'Start Voice Input'}
              >
                {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>              {/* Voice Toggle Button */}
              <button 
                onClick={toggleVoiceEnabled}
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  voiceEnabled 
                    ? 'bg-purple-600 shadow-lg shadow-purple-500/30' 
                    : 'bg-gray-700'
                }`}
                title={voiceEnabled ? 'Disable Avatar Voice - Avatar will stop speaking and return to idle' : 'Enable Avatar Voice - Avatar will speak messages and switch to talking mode'}
              >
                <User className={`w-6 h-6 ${voiceEnabled ? 'text-white' : 'text-gray-400'}`} />
                {voiceEnabled && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                )}
              </button>

              {/* Speaker Button */}
              <button 
                onClick={toggleSpeaker}
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  !isSpeakerOn 
                    ? 'bg-red-600 shadow-lg shadow-red-500/30' 
                    : 'bg-gray-700'
                }`}
                title={isSpeakerOn ? 'Mute Speaker' : 'Unmute Speaker'}
              >
                {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </button>              {/* End Call Button */}
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
  );
};

export default AvatarCallPage;