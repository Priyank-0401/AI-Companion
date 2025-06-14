import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../components/Avatar'; // Import the Avatar component
import { useAvatarExpressions } from '../hooks/useAvatarExpressions'; // Import the expression hook
import { 
  Loader2, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Settings, 
  AlertTriangle,
  Volume2,
  VolumeX,
  MoreVertical,
  Maximize,
  Minimize,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';

const AvatarCallPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTalking, setIsTalking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('excellent');
  const [audioElement, setAudioElement] = useState(null);
  
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

  // Format call duration
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };  // Auto-hide controls in fullscreen mode only
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
    }, 2500);
    return () => clearTimeout(timer);
  }, []);
  // Note: Removed automatic talking simulation
  // The isTalking state should be controlled by actual voice detection or manual triggers
  
  const toggleMute = () => setIsMuted(!isMuted);
  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    // Switch to talking model when camera is turned on, idle when off
    setIsTalking(!isVideoOn);
  };
  const toggleSpeaker = () => setIsSpeakerOn(!isSpeakerOn);
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);
  
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
          >            {/* Avatar Component */}
            <div className="absolute inset-0">
              <Avatar 
                isTalking={isTalking} 
                expression={currentExpression}
                audioElement={audioElement}
                lipSyncEnabled={true}
              />
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
                    </button>
                      {/* End Call Button */}
                    <button 
                      onClick={endCall}
                      className="w-16 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30"
                      title="End Call"
                    >
                      <PhoneOff className="w-7 h-7" />
                    </button>
                    
                    {/* Settings Button */}
                    <button 
                      className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center"
                      title="Settings"
                    >
                      <Settings className="w-6 h-6" />
                    </button>

                    {/* More Options */}
                    <button 
                      className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center"
                      title="More Options"
                    >
                      <MoreVertical className="w-6 h-6" />
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
              </button>
                {/* End Call Button */}
              <button 
                onClick={endCall}
                className="w-16 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30"
                title="End Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              
              {/* Settings Button */}
              <button 
                className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center"
                title="Settings"
              >
                <Settings className="w-6 h-6" />
              </button>              {/* More Options */}
              <button 
                className="w-14 h-14 rounded-full bg-gray-700 hover:brightness-110 flex items-center justify-center"
                title="More Options"
              >
                <MoreVertical className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarCallPage;