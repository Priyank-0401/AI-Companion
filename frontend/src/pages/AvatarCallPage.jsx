import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../components/AvatarOptimized'; // Import the optimized Avatar component
import { useAvatarExpressions } from '../hooks/useAvatarExpressions'; // Import the expression hook
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
  const [isTalking, setIsTalking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('excellent');
  const [audioElement, setAudioElement] = useState(null);  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [isGreeting, setIsGreeting] = useState(false);
  
  // Expression management
  const { currentExpression, setExpression } = useAvatarExpressions(
    isTalking, 
    '', // No bot messages for chat
    {
      enableAutoExpression: true,
      enableBlinking: true,
      lipSyncEnabled: true
    }
  );

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

  // Load available female voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      
      // Filter for female voices (prioritize Google, Microsoft, Apple)
      const femaleVoices = voices.filter(voice => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();
        
        // Check if it's an English voice and likely female
        if (!lang.startsWith('en')) return false;
        
        return (
          name.includes('female') ||
          name.includes('woman') ||
          name.includes('girl') ||
          name.includes('samantha') ||
          name.includes('zira') ||
          name.includes('susan') ||
          name.includes('karen') ||
          name.includes('hazel') ||
          name.includes('moira') ||
          name.includes('tessa') ||
          name.includes('nicky') ||
          name.includes('fiona') ||
          name.includes('google') && (name.includes('us') || name.includes('uk')) ||
          name.includes('microsoft') && name.includes('aria') ||
          name.includes('cortana')
        );
      }).sort((a, b) => {
        // Prioritize Google voices, then Microsoft, then others
        const aGoogle = a.name.toLowerCase().includes('google');
        const bGoogle = b.name.toLowerCase().includes('google');
        const aMicrosoft = a.name.toLowerCase().includes('microsoft');
        const bMicrosoft = b.name.toLowerCase().includes('microsoft');
        
        if (aGoogle && !bGoogle) return -1;
        if (!aGoogle && bGoogle) return 1;
        if (aMicrosoft && !bMicrosoft) return -1;
        if (!aMicrosoft && bMicrosoft) return 1;
        
        return a.name.localeCompare(b.name);
      });
      
      setAvailableVoices(femaleVoices);
      
      // Set default voice (prefer Google or Microsoft female voices)
      if (femaleVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(femaleVoices[0]);
      }
      
      console.log('🎵 Available female voices:', femaleVoices.map(v => v.name));
    };

    // Load voices immediately if available
    loadVoices();
    
    // Also listen for voices changed event (some browsers load voices asynchronously)
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);    };
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
  // Function to play greeting message with realistic tone and lip-sync
  const playGreeting = useCallback(() => {
    if (!selectedVoice || !isSpeakerOn || hasGreeted) return;
    
    const greetingMessages = [
      { 
        text: "Hello there! *gentle smile* I'm so happy to meet you. How are you doing today?", 
        rate: 0.85, 
        pitch: 1.15, 
        emphasis: "gentle"
      },
      { 
        text: "Hi! *warm laugh* It's wonderful to see you. What would you like to talk about?", 
        rate: 0.9, 
        pitch: 1.1, 
        emphasis: "cheerful"
      },
      { 
        text: "Hello! *excited tone* I'm here and ready to chat with you. How can I help you today?", 
        rate: 0.88, 
        pitch: 1.12, 
        emphasis: "enthusiastic"
      },
      { 
        text: "Hi there! *soft voice* I'm excited to spend some time with you. What's on your mind?", 
        rate: 0.82, 
        pitch: 1.18, 
        emphasis: "intimate"
      },
      { 
        text: "Hello! *welcoming tone* Welcome! I'm looking forward to our conversation together.", 
        rate: 0.87, 
        pitch: 1.14, 
        emphasis: "welcoming"
      }
    ];
    
    const randomGreeting = greetingMessages[Math.floor(Math.random() * greetingMessages.length)];
    
    // Clean text for speech synthesis (remove tone indicators)
    const cleanText = randomGreeting.text.replace(/\*[^*]+\*/g, '');
      setIsGreeting(true);
    console.log('🎵 Playing greeting:', cleanText, 'with', randomGreeting.emphasis, 'tone');
    
    // Create audio element for lip-sync
    const tempAudio = document.createElement('audio');
    tempAudio.crossOrigin = "anonymous";
    tempAudio.preload = "auto";
    
    // Use Speech Synthesis API with enhanced settings
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.voice = selectedVoice;
    utterance.rate = randomGreeting.rate;
    utterance.pitch = randomGreeting.pitch;
    utterance.volume = isSpeakerOn ? 1 : 0;
    
    // Add pauses and emphasis based on tone
    switch (randomGreeting.emphasis) {
      case 'gentle':
        utterance.rate = 0.8;
        utterance.pitch = 1.2;
        break;
      case 'cheerful':
        utterance.rate = 0.95;
        utterance.pitch = 1.15;
        break;
      case 'enthusiastic':
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        break;
      case 'intimate':
        utterance.rate = 0.75;
        utterance.pitch = 1.25;
        break;
      case 'welcoming':
        utterance.rate = 0.85;
        utterance.pitch = 1.18;
        break;
    }
      utterance.onstart = () => {
      console.log('🎵 Greeting started with', randomGreeting.emphasis, 'tone');
      // Set audio element for lip-sync - connect to speech synthesis
      console.log('🎤 Setting up lip-sync for greeting');
      setAudioElement(tempAudio);
    };
    
    utterance.onend = () => {
      console.log('🎵 Greeting finished');
      setIsGreeting(false);
      setHasGreeted(true);
      // Clear audio element
      setAudioElement(null);
      console.log('🎤 Lip-sync cleared');
    };
    
    utterance.onerror = (event) => {
      console.error('🎵 Greeting error:', event.error);
      setIsGreeting(false);
      setAudioElement(null);
    };
    
    // Add boundary events for more natural speech
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        // Trigger subtle expression changes during speech
        const expressions = ['smile', 'happy', 'talking', 'neutral'];
        const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
        setExpression(randomExpression);
      }
    };
      speechSynthesis.speak(utterance);
  }, [selectedVoice, isSpeakerOn, hasGreeted, setExpression]);

  // Play greeting when switching to talking mode
  useEffect(() => {
    if (isTalking && selectedVoice && !hasGreeted && !isGreeting) {
      // Small delay to ensure talking animation has started
      const greetingTimer = setTimeout(() => {
        playGreeting();
      }, 800);
      
      return () => clearTimeout(greetingTimer);
    }
  }, [isTalking, selectedVoice, hasGreeted, isGreeting, playGreeting]);// Memoize toggle functions to prevent unnecessary re-renders
  const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);
    const toggleTalkToModel = useCallback(() => {
    setIsTalking(prev => {
      const newValue = !prev;
      if (newValue) {
        // Start talking animation and trigger greeting if first time
        console.log('🗣️ Starting conversation with model');
      } else {
        // Stop talking animation and any ongoing speech
        console.log('🤐 Ending conversation with model');
        speechSynthesis.cancel(); // Stop any ongoing speech
        setIsGreeting(false);
        // Reset greeting for next time if user wants to restart
        setHasGreeted(false);
      }
      return newValue;
    });
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
  const toggleFullscreen = useCallback(() => setIsFullscreen(prev => !prev), []);
  // Memoize avatar props to prevent unnecessary re-renders
  const avatarProps = useMemo(() => ({
    isTalking: isTalking || isGreeting, // Keep talking animation during greeting
    expression: currentExpression,
    audioElement,
    lipSyncEnabled: true
  }), [isTalking, isGreeting, currentExpression, audioElement]);
  
  const endCall = () => {
    // Handle ending the call
    console.log('Ending call...');
  };
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
            <div className="absolute inset-0 pointer-events-none">
              {/* Top Status Indicators */}
              <div className="absolute top-6 left-6 flex flex-col space-y-2">
                <div className="px-3 py-2 bg-black/60 rounded-lg backdrop-blur-sm">
                  <span className={`text-sm font-medium flex items-center space-x-2 ${isTalking ? 'text-blue-400' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${isTalking ? 'bg-blue-400 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span>{isTalking ? 'Speaking' : 'Listening'}</span>
                  </span>
                </div>
                {isTalking && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-3 py-2 bg-blue-500/20 rounded-lg backdrop-blur-sm border border-blue-500/30"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-6 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1 h-3 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-1 h-5 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                      </div>
                      <span className="text-xs text-blue-300">Audio Waveform</span>
                    </div>
                  </motion.div>                )}
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
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                    
                    {/* Video Button */}
                    <button 
                      onClick={toggleVideo}
                      className={`w-14 h-14 rounded-full flex items-center justify-center ${
                        !isVideoOn 
                          ? 'bg-red-600 shadow-lg shadow-red-500/30' 
                          : 'bg-gray-700'
                      }`}
                      title={isVideoOn ? 'Switch to Idle Model' : 'Switch to Talking Model'}
                    >
                      {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
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
                    </button>                    {/* End Call Button */}
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
          <div className="flex items-center justify-center py-4 pb-20">            <div className="flex items-center space-x-4">
              {/* Talk to Model Button */}
              <button 
                onClick={toggleTalkToModel}
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  isTalking 
                    ? 'bg-blue-600 shadow-lg shadow-blue-500/30' 
                    : 'bg-gray-700'
                }`}
                title={isTalking ? 'Stop Talking' : 'Talk to Model'}
              >
                <MessageSquare className="w-6 h-6" />
              </button>
              
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
              </button>              {/* Voice Selection Button */}
              <div className="relative voice-selector-container">
                <button 
                  onClick={() => setShowVoiceSelector(!showVoiceSelector)}
                  className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center"
                  title="Select Model Voice"
                >
                  <User className="w-6 h-6" />
                </button>
                
                {/* Voice Selector Dropdown */}
                {showVoiceSelector && (
                  <div className="absolute bottom-16 left-0 bg-gray-800 rounded-lg shadow-lg p-2 min-w-64 max-h-48 overflow-y-auto">
                    <div className="text-white text-sm font-medium mb-2 px-2">Select Female Voice:</div>
                    {availableVoices.map((voice, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedVoice(voice);
                          setShowVoiceSelector(false);
                          console.log('🎵 Selected voice:', voice.name);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm ${
                          selectedVoice?.name === voice.name
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <div className="font-medium">{voice.name}</div>
                        <div className="text-xs text-gray-400">{voice.lang}</div>
                      </button>
                    ))}
                    {availableVoices.length === 0 && (
                      <div className="text-gray-400 text-sm px-2">No female voices available</div>
                    )}
                  </div>
                )}
              </div>

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