import React, { useEffect, useRef, useState } from 'react';
import Avatar from '../components/Avatar'; // Import the Avatar component
import { Loader2, PhoneOff, Mic, MicOff, Video, VideoOff, Settings, AlertTriangle } from 'lucide-react'; // Assuming lucide-react for icons

const AvatarCallPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Simulate an error for demonstration if needed
      // setError("Could not connect to the avatar service. Please try again later.");
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // ... existing functions ...

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
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-dark to-mediumDark p-4 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 gradient-text">
            Experience a More Personal Connection
          </h1>
          <p className="text-xl text-lightText/80 max-w-2xl mx-auto">
            Step into a more immersive conversation. Our avatar feature brings a friendly face to your Seriva companion, making your interactions feel more natural and engaging.
          </p>
        </div>

        {/* Avatar Display Area */}
        <motion.div 
          className="relative w-full aspect-video bg-black/30 rounded-xl shadow-2xl mb-6 overflow-hidden border-2 border-accent/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Placeholder for actual avatar/video stream */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Replace with actual video element or avatar component */}
            <img src="/placeholder-avatar.png" alt="Seriva Avatar" className="w-1/2 h-1/2 object-contain opacity-70" />
             <p className="absolute bottom-4 left-4 text-sm bg-black/50 px-2 py-1 rounded">Companion's View (Placeholder)</p>
          </div>
           <div className="absolute top-4 right-4 p-2 bg-black/40 rounded-lg">
            <span className="text-xs text-green-400">● Live</span>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div 
          className="flex items-center justify-center space-x-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <button className="control-btn bg-blue-500 hover:bg-blue-600">
            <Mic className="w-6 h-6" />
            <span className="sr-only">Mute/Unmute Mic</span>
          </button>
          <button className="control-btn bg-red-500 hover:bg-red-600">
            <PhoneOff className="w-6 h-6" />
            <span className="sr-only">End Call</span>
          </button>
          <button className="control-btn bg-blue-500 hover:bg-blue-600">
            <Video className="w-6 h-6" />
            <span className="sr-only">Turn Video On/Off</span>
          </button>
          <button className="control-btn bg-gray-600 hover:bg-gray-700">
            <Settings className="w-6 h-6" />
            <span className="sr-only">Settings</span>
          </button>
        </motion.div>
        
        {/* Chat Input (Optional for avatar call) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-4"
        >
          <input 
            type="text"
            placeholder="Share your thoughts with your companion..."
            className="w-full p-3 bg-mediumDark/50 border border-dark rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none placeholder-lightText/60"
          />
        </motion.div>

        <motion.p 
          className="text-center text-sm text-lightText/70 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          This is a preview of the avatar call feature. Full functionality coming soon.
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
