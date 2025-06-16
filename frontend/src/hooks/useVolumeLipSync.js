import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Simple Volume-Based Lip Sync Hook
 * Analyzes audio amplitude (RMS) and maps it to mouth opening
 */
export const useVolumeLipSync = () => {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const currentVolumeRef = useRef(0);
  const smoothedVolumeRef = useRef(0);
  const animationFrameRef = useRef(null);
  const isAnalyzingRef = useRef(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0);

  /**
   * Calculate volume (RMS) from audio data
   */
  const calculateVolume = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return 0;

    try {
      // Get frequency data
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      // Calculate RMS (Root Mean Square) volume
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        sum += dataArrayRef.current[i] * dataArrayRef.current[i];
      }
      
      const rms = Math.sqrt(sum / dataArrayRef.current.length);
        // Normalize to 0-1 range with better sensitivity
      const normalized = Math.min(rms / 100, 1.0); // Lower threshold for better sensitivity
        
      // Apply lighter smoothing for faster response
      const smoothed = smoothedVolumeRef.current * 0.4 + normalized * 0.6;
      smoothedVolumeRef.current = smoothed;
      
      // Apply a multiplier for more pronounced movement
      return Math.min(smoothed * 1.5, 1.0);
    } catch (error) {
      console.warn('⚠️ Volume calculation error:', error);
      return 0;
    }
  }, []);

  /**
   * Setup Web Audio API for volume analysis
   */
  const setupVolumeAnalysis = useCallback((audio) => {
    try {
      console.log('🎵 Setting up volume-based lip sync');
      
      // Create audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        // Create analyser for frequency analysis
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256; // Good balance of performance and accuracy
      analyserRef.current.smoothingTimeConstant = 0.3; // Faster response for lip sync
      
      // Create source from audio element
      sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
      
      // Connect: source -> analyser -> destination
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      // Create data array for frequency data
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      console.log('✅ Volume analysis setup complete');
      return true;
    } catch (error) {
      console.error('❌ Failed to setup volume analysis:', error);
      return false;
    }
  }, []);  /**
   * Start real-time volume analysis
   */
  const startVolumeAnalysis = useCallback(() => {
    if (!analyserRef.current) {
      console.error('❌ No analyser available for volume analysis');
      return;
    }

    console.log('🎵 Starting volume analysis loop');
    isAnalyzingRef.current = true;
    setIsAnalyzing(true);
    
    const analyze = () => {
      if (!isAnalyzingRef.current || !analyserRef.current || !dataArrayRef.current) {
        return;
      }

      const volume = calculateVolume();
      currentVolumeRef.current = volume;
      setCurrentVolume(volume);
        // Debug logging (reduced frequency for faster movement)
      if (volume > 0.03) {
        if (Math.random() < 0.05) { // 5% chance for debug output
          console.log(`🎵 Volume detected: ${volume.toFixed(3)}`);
        }
      }
      
      // Continue analysis loop
      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();
    console.log('🎵 Volume analysis loop started');
  }, [calculateVolume]);
  /**
   * Stop volume analysis
   */
  const stopVolumeAnalysis = useCallback(() => {
    console.log('🔇 Stopping volume analysis');
    
    isAnalyzingRef.current = false;
    setIsAnalyzing(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    currentVolumeRef.current = 0;
    smoothedVolumeRef.current = 0;
    setCurrentVolume(0);
    
    // Clean up audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    audioContextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
    dataArrayRef.current = null;
    
    console.log('🔇 Volume analysis stopped');
  }, []);

  /**
   * Get current volume value (0-1) for mouth opening
   */
  const getVolumeValue = useCallback(() => {
    return currentVolumeRef.current;
  }, []);

  /**
   * Check if Web Audio API is supported
   */
  const isSupported = useCallback(() => {
    return !!(window.AudioContext || window.webkitAudioContext);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVolumeAnalysis();
    };
  }, [stopVolumeAnalysis]);

  return {
    // Setup and control
    setupVolumeAnalysis,
    startVolumeAnalysis,
    stopVolumeAnalysis,
    
    // State
    isAnalyzing,
    currentVolume,
    
    // Volume getter
    getVolumeValue,
    
    // Utility
    isSupported,
  };
};

export default useVolumeLipSync;
