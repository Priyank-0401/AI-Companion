import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Avatar from '../components/Avatar'; // Import the Avatar component
import { Loader2, PhoneOff, Mic, MicOff, Video, VideoOff, Settings, AlertTriangle } from 'lucide-react'; // Assuming lucide-react for icons

const AvatarCallPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTalking, setIsTalking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Simulate an error for demonstration if needed
      // setError("Could not connect to the avatar service. Please try again later.");
    }, 2500);
    return () => clearTimeout(timer);
  }, []);
  // Simulate talking animation every few seconds (disabled for testing)
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setIsTalking(true);
  //     setTimeout(() => setIsTalking(false), 3000); // Talk for 3 seconds
  //   }, 8000); // Every 8 seconds

  //   return () => clearInterval(interval);
  // }, []);

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleVideo = () => setIsVideoOn(!isVideoOn);
  const endCall = () => {
    // Handle ending the call
    console.log('Ending call...');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-dark to-mediumDark p-6 text-white">
        <Loader2 className="w-16 h-16 animate-spin text-accent mb-6" />
        <h1 className="text-3xl font-semibold mb-2">Bringing your companion to life...</h1>
        <p className="text-lightText/80">Please wait a moment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-dark to-mediumDark p-6 text-white">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
        <h1 className="text-3xl font-semibold mb-2 text-red-400">Connection Issue</h1>
        <p className="text-lightText/80 mb-6 text-center max-w-md">{error}</p>
        <button
          onClick={() => window.location.reload()} // Simple reload, or implement a retry mechanism
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }  return (
    <div className="no-root-padding flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-dark to-mediumDark p-4 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 gradient-text">
            Experience a More Personal Connection
          </h1>
          <p className="text-lg text-lightText/80 max-w-2xl mx-auto">
            Step into a more immersive conversation. Our avatar feature brings a friendly face to your Seriva companion, making your interactions feel more natural and engaging.
          </p>
        </div>

        {/* Avatar Display Area - Video Call Style */}
        <motion.div 
          className="relative w-full h-[70vh] bg-black/30 rounded-2xl shadow-2xl mb-6 overflow-hidden border-2 border-accent/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >          {/* Avatar Component - Dynamic switching between Idle and Talking */}
          <div className="absolute inset-0">
            <Avatar isTalking={isTalking} />
          </div>
          
          {/* Video Call UI Overlays */}
          <div className="absolute top-6 right-6 p-3 bg-black/60 rounded-lg backdrop-blur-sm">
            <span className="text-sm text-green-400 font-medium">● Live</span>
          </div>
          
          <div className="absolute top-6 left-6 p-3 bg-black/60 rounded-lg backdrop-blur-sm">
            <span className={`text-sm font-medium ${isTalking ? 'text-blue-400' : 'text-gray-400'}`}>
              {isTalking ? '🗣️ Speaking' : '😌 Listening'}
            </span>
          </div>
          
          <div className="absolute bottom-6 left-6 p-3 bg-black/60 rounded-lg backdrop-blur-sm">
            <span className="text-sm text-yellow-400 font-mono">
              {isTalking ? 'Talking.glb' : 'Idle.glb'}
            </span>
          </div>
          
          {/* Video Call Style Name Bar */}
          <div className="absolute bottom-6 right-6 p-3 bg-black/60 rounded-lg backdrop-blur-sm">
            <span className="text-sm text-white font-medium">Seriva AI Companion</span>
          </div>
        </motion.div>        {/* Video Call Controls */}
        <motion.div 
          className="flex items-center justify-center space-x-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <button 
            onClick={toggleMute}
            className={`control-btn-large ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>
          
          <button 
            onClick={endCall}
            className="control-btn-large bg-red-500 hover:bg-red-600"
            title="End Call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
          
          <button 
            onClick={toggleVideo}
            className={`control-btn-large ${!isVideoOn ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
            title={isVideoOn ? 'Turn Camera Off' : 'Turn Camera On'}
          >
            {isVideoOn ? <Video className="w-7 h-7" /> : <VideoOff className="w-7 h-7" />}
          </button>
          
          <button 
            className="control-btn-large bg-gray-600 hover:bg-gray-700"
            title="Settings"
          >
            <Settings className="w-7 h-7" />
          </button>
          
          <button 
            onClick={() => setIsTalking(!isTalking)}
            className={`control-btn-large ${isTalking ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-600 hover:bg-gray-700'}`}
            title={isTalking ? 'Stop Talking' : 'Start Talking'}
          >
            <span className="text-base font-bold">
              {isTalking ? 'Stop' : 'Talk'}
            </span>
          </button>
        </motion.div>
          {/* Chat Input (Optional for avatar call) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6 max-w-3xl mx-auto"
        >
          <input 
            type="text"
            placeholder="Type a message to your AI companion..."
            className="w-full p-4 bg-mediumDark/50 border border-accent/30 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none placeholder-lightText/60 text-lg"
          />
        </motion.div>

        <motion.p 
          className="text-center text-sm text-lightText/60 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          Experience immersive conversations with your AI companion through our advanced avatar technology.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default AvatarCallPage;

// Helper styles (can be in a global CSS or here for simplicity if not already defined)
// Ensure these class names are available or adapt them:
// .control-btn { padding: 0.75rem; border-radius: 9999px; color: white; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s; }
// .gradient-text { background-clip: text; -webkit-background-clip: text; color: transparent; background-image: linear-gradient(to right, var(--color-accent), var(--color-blue-500)); }
// Ensure --color-accent and --color-blue-500 are defined in your Tailwind config or CSS variables.
