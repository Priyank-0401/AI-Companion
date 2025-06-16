import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Volume2 } from 'lucide-react';
import { useVolumeLipSync } from '../../hooks/useVolumeLipSync';
import voiceService from '../../services/voiceService';
import AvatarOptimized from '../AvatarOptimized';

/**
 * Simple Volume-Based Lip Sync Test
 * Maps audio volume directly to mouth opening - no complex analysis needed
 */
const VolumeLipSyncTest = () => {
  const [testText, setTestText] = useState("Hello! I'm your AI companion. Watch my mouth move based on the volume of my voice.");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [manualMouthOpen, setManualMouthOpen] = useState(0);
  
  const lipSyncRef = useRef({ getVolumeValue: () => 0, isPlaying: () => false });
  
  const {
    setupVolumeAnalysis,
    startVolumeAnalysis,
    stopVolumeAnalysis,
    isAnalyzing,
    currentVolume,
    getVolumeValue,
    isSupported
  } = useVolumeLipSync();  // Update lip sync ref for avatar
  React.useEffect(() => {
    lipSyncRef.current = {
      getVolumeValue: () => {
        // Use manual mouth value if set, otherwise use audio volume
        const value = manualMouthOpen > 0 ? manualMouthOpen : getVolumeValue();
        // Debug logging
        if (value > 0 && Math.random() < 0.1) {
          console.log(`🎵 Lip sync ref providing value: ${value.toFixed(3)} (manual: ${manualMouthOpen})`);
        }
        return value;
      },
      isPlaying: () => {
        const playing = manualMouthOpen > 0 || (isSpeaking && isAnalyzing);
        if (playing && Math.random() < 0.1) {
          console.log(`🎵 Lip sync ref isPlaying: ${playing}`);
        }
        return playing;
      }
    };
  }, [getVolumeValue, isSpeaking, isAnalyzing, manualMouthOpen]);

  /**
   * Speak with volume-based lip sync
   */
  const speakWithVolumeLipSync = async () => {
    if (isSpeaking) {
      // Stop current speech
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }
      stopVolumeAnalysis();
      setIsSpeaking(false);
      return;
    }

    try {
      console.log('🎵 Starting volume-based lip sync');
      
      // Get audio from Azure TTS
      const audioBlob = await voiceService.fetchAzureTTS(testText);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.crossOrigin = 'anonymous'; // Required for Web Audio API
      
      setCurrentAudio(audio);

      // Setup volume analysis
      const analysisReady = setupVolumeAnalysis(audio);
      
      if (!analysisReady) {
        console.warn('⚠️ Volume analysis setup failed');
        return;
      }

      // Audio event handlers
      audio.addEventListener('play', () => {
        console.log('🎵 Audio started - beginning volume analysis');
        setIsSpeaking(true);
        startVolumeAnalysis();
      });

      audio.addEventListener('ended', () => {
        console.log('🎵 Audio ended - stopping volume analysis');
        setIsSpeaking(false);
        stopVolumeAnalysis();
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      });

      audio.addEventListener('error', (error) => {
        console.error('❌ Audio error:', error);
        setIsSpeaking(false);
        stopVolumeAnalysis();
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      });

      // Start playback
      await audio.play();

    } catch (error) {
      console.error('❌ Volume lip sync failed:', error);
      setIsSpeaking(false);
      stopVolumeAnalysis();
    }
  };

  return (
    <div className="min-h-screen bg-[#222831] text-[#EEEEEE] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#00ADB5] to-[#393E46] bg-clip-text text-transparent">
            Volume-Based Lip Sync
          </h1>
          <p className="text-[#EEEEEE]/70">
            Simple & Realistic: Mouth opens based on audio volume
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Avatar Section */}
          <div className="bg-[#393E46] rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Volume2 className="mr-2" size={24} />
              Avatar with Volume Lip Sync
            </h2>
            
            <div className="aspect-square bg-[#222831] rounded-lg mb-4 relative overflow-hidden">
              <AvatarOptimized
                isTalking={isSpeaking}
                lastMessage={testText}
                voiceEnabled={true}
                selectedVoice={voiceService.selectedVoice}
                volumeLipSyncRef={lipSyncRef}
                className="w-full h-full"
              />
              
              {/* Status Overlay */}
              {isAnalyzing && (
                <div className="absolute top-4 right-4 bg-green-500/20 backdrop-blur-sm rounded-lg p-2">
                  <div className="flex items-center text-green-400 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                    Volume Analysis Active
                  </div>
                </div>
              )}
            </div>

            {/* Volume Visualization */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Audio Volume</span>
                <span className="text-sm text-[#00ADB5]">
                  {(currentVolume * 100).toFixed(1)}%
                </span>
              </div>
              <div className="bg-[#222831] rounded-full h-4 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-[#00ADB5]"
                  initial={{ width: 0 }}
                  animate={{ width: `${currentVolume * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-[#222831] rounded-lg p-3">
                <div className="text-[#EEEEEE]/70">Speech</div>
                <div className="font-medium">
                  {isSpeaking ? '🟢 Playing' : '🔴 Silent'}
                </div>
              </div>
              <div className="bg-[#222831] rounded-lg p-3">
                <div className="text-[#EEEEEE]/70">Analysis</div>
                <div className="font-medium">
                  {isAnalyzing ? '🟢 Active' : '🔴 Inactive'}
                </div>
              </div>
            </div>
          </div>          {/* Controls Section */}
          <div className="bg-[#393E46] rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Test Controls</h2>            {/* Manual Mouth Test - PROMINENTLY DISPLAYED AT TOP */}
            <div className="mb-6 p-5 bg-gradient-to-r from-[#00ADB5]/10 to-[#222831] rounded-lg border-2 border-[#00ADB5] shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <label className="text-lg font-bold text-[#00ADB5] flex items-center">
                  🧪 Manual Mouth Test
                </label>
                <div className="text-2xl font-bold text-[#00ADB5]">
                  {manualMouthOpen.toFixed(1)}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={manualMouthOpen}
                onChange={(e) => setManualMouthOpen(parseFloat(e.target.value))}
                className="w-full h-4 bg-[#393E46] rounded-lg appearance-none cursor-pointer slider hover:bg-[#393E46]/80 transition-colors"
                style={{
                  background: `linear-gradient(to right, #00ADB5 0%, #00ADB5 ${manualMouthOpen * 100}%, #393E46 ${manualMouthOpen * 100}%, #393E46 100%)`
                }}
              />
              <div className="text-sm text-[#EEEEEE]/80 mt-2 text-center">
                🎯 <strong>START HERE:</strong> Move this slider to test if the avatar's mouth opens at all
              </div>
              <div className="text-xs text-[#00ADB5]/70 mt-1 text-center">
                If mouth doesn't move with this slider, check console for morph target debugging info
              </div>
            </div>

            {/* Text Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Test Text
              </label>
              <textarea
                className="w-full bg-[#222831] border border-[#00ADB5]/30 rounded-lg px-3 py-2 text-[#EEEEEE] focus:outline-none focus:border-[#00ADB5] resize-none"
                rows="4"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to speak..."
              />
            </div>

            {/* Quick Test Phrases */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Quick Test Phrases
              </label>
              <div className="space-y-2">
                {[
                  "Hello! Watch my mouth move with the volume of my voice.",
                  "The quick brown fox jumps over the lazy dog.",
                  "I'm speaking loudly now! And now I'm whispering softly.",
                  "This is a test of volume-based lip synchronization."
                ].map((phrase, index) => (
                  <button
                    key={index}
                    className="w-full text-left bg-[#222831] hover:bg-[#222831]/80 border border-[#00ADB5]/20 rounded-lg px-3 py-2 text-sm transition-colors"
                    onClick={() => setTestText(phrase)}
                    disabled={isSpeaking}
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>            {/* Main Control Button */}
            <button
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                isSpeaking
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-[#00ADB5] hover:bg-[#00ADB5]/80 text-white'
              }`}
              onClick={speakWithVolumeLipSync}
              disabled={!testText.trim()}
            >
              {isSpeaking ? (
                <>
                  <Square className="mr-2" size={20} />
                  Stop Speech
                </>
              ) : (
                <>
                  <Play className="mr-2" size={20} />
                  Start Volume Lip Sync
                </>
              )}
            </button>

            {/* System Info */}
            <div className="mt-6 p-4 bg-[#222831] rounded-lg">
              <h3 className="font-medium mb-2">System Information</h3>
              <div className="text-sm text-[#EEEEEE]/70 space-y-1">
                <div>Web Audio API: {isSupported() ? '✅ Supported' : '❌ Not Supported'}</div>
                <div>Voice: {voiceService.selectedVoice?.displayName || 'Jenny (Default)'}</div>                <div>Current Volume: {currentVolume.toFixed(3)}</div>
                <div>Manual Mouth: {manualMouthOpen.toFixed(1)}</div>
                <div>Mouth Opening: {Math.max(manualMouthOpen, currentVolume).toFixed(3)}</div>
              </div>
            </div>

            {/* How It Works */}
            <div className="mt-4 p-4 bg-[#222831] rounded-lg">
              <h3 className="font-medium mb-2">How It Works</h3>
              <div className="text-sm text-[#EEEEEE]/70">
                <p>This uses simple volume analysis:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Analyzes audio amplitude (RMS)</li>
                  <li>Maps volume to mouth opening</li>
                  <li>Louder sound = wider mouth</li>
                  <li>No complex phoneme detection needed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolumeLipSyncTest;
