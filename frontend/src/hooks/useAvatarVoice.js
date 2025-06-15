// Hook for managing avatar voice integration with Microsoft Azure Neural TTS
import { useState, useEffect, useRef, useCallback } from 'react';
import voiceService, { AZURE_NEURAL_VOICES } from '../services/voiceService';

export const useAvatarVoice = (options = {}) => {
  const [isEnabled, setIsEnabled] = useState(options.enabled ?? false); // START DISABLED BY DEFAULT
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState(AZURE_NEURAL_VOICES);
  const [selectedVoice, setSelectedVoice] = useState(options.selectedVoice || AZURE_NEURAL_VOICES[0]);
  const [voiceSettings, setVoiceSettings] = useState({
    rate: '0.9',
    pitch: '+5%',
    style: 'friendly'
  });

  const currentSpeechRef = useRef(null);
  // Update selected voice when external voice changes
  useEffect(() => {
    if (options.selectedVoice) {
      setSelectedVoice(options.selectedVoice);
      voiceService.setVoice(options.selectedVoice);
    }
  }, [options.selectedVoice]);

  // Initialize voice service and sync speaking state
  useEffect(() => {
    // Set initial voice
    if (selectedVoice) {
      voiceService.setVoice(selectedVoice);
    }

    // Sync speaking state with voice service
    const checkSpeakingState = () => {
      const serviceStatus = voiceService.getStatus();
      if (serviceStatus.isSpeaking !== isSpeaking) {
        setIsSpeaking(serviceStatus.isSpeaking);
      }
    };

    // Check speaking state periodically
    const speakingStateInterval = setInterval(checkSpeakingState, 100);
    
    return () => clearInterval(speakingStateInterval);
  }, [selectedVoice, isSpeaking]);
  // Speak text with Azure Neural TTS
  const speak = useCallback(async (text, customOptions = {}) => {
    if (!isEnabled || !text || isSpeaking) {
      return Promise.resolve();
    }

    try {
      console.log('🎵 Hook: Starting Azure TTS speech');
      setIsSpeaking(true);
      
      const speechOptions = {
        voice: selectedVoice,
        ...voiceSettings,
        ...customOptions,
        onStart: () => {
          setIsSpeaking(true);
          console.log('🎵 Hook: Speech started');
          customOptions.onStart?.();
        },
        onEnd: () => {
          setIsSpeaking(false);
          console.log('🎵 Hook: Speech ended');
          customOptions.onEnd?.();
        },
        onError: (error) => {
          setIsSpeaking(false);
          console.error('❌ Hook: Speech error:', error);
          customOptions.onError?.(error);
        }
      };

      currentSpeechRef.current = voiceService.speak(text, speechOptions);
      await currentSpeechRef.current;
      
    } catch (error) {
      setIsSpeaking(false);
      console.error('❌ Hook: Speech failed:', error);
    }
  }, [isEnabled, isSpeaking, selectedVoice, voiceSettings]);

  // Stop current speech
  const stopSpeaking = useCallback(() => {
    voiceService.stop();
    setIsSpeaking(false);
    currentSpeechRef.current = null;
  }, []);

  // Pause current speech
  const pauseSpeaking = useCallback(() => {
    voiceService.pause();
  }, []);

  // Resume paused speech
  const resumeSpeaking = useCallback(() => {
    voiceService.resume();
  }, []);

  // Change voice
  const changeVoice = useCallback((voice) => {
    if (voiceService.setVoice(voice)) {
      setSelectedVoice(voice);
      return true;
    }
    return false;
  }, []);

  // Change voice by name
  const changeVoiceByName = useCallback((voiceName) => {
    if (voiceService.setVoiceByName(voiceName)) {
      const newVoice = voiceService.selectedVoice;
      setSelectedVoice(newVoice);
      return true;
    }
    return false;
  }, []);
  // Test a voice with sample text
  const testVoice = useCallback(async (voice, testText = "Hello! I'm your AI companion. This is how I sound with Azure Neural TTS.") => {
    try {
      await voiceService.testVoice(voice, testText);
      return true;
    } catch (error) {
      console.error('❌ Voice test failed:', error);
      return false;
    }
  }, []);

  // Update voice settings
  const updateSettings = useCallback((newSettings) => {
    const updatedSettings = { ...voiceSettings, ...newSettings };
    setVoiceSettings(updatedSettings);
    voiceService.adjustSettings(updatedSettings);
  }, [voiceSettings]);

  // Get voice recommendation for context
  const getRecommendedVoice = useCallback((context) => {
    return voiceService.getVoiceRecommendation(context);
  }, []);

  // Enable/disable voice
  const toggleVoice = useCallback((enabled) => {
    if (enabled === undefined) {
      setIsEnabled(!isEnabled);
    } else {
      setIsEnabled(enabled);
    }
    
    // Stop speaking if disabling
    if (!enabled && isSpeaking) {
      stopSpeaking();
    }
  }, [isEnabled, isSpeaking, stopSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  return {
    // State
    isEnabled,
    isSpeaking,
    availableVoices,
    selectedVoice,
    voiceSettings,
    
    // Methods
    speak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    changeVoice,
    changeVoiceByName,
    testVoice,
    updateSettings,
    getRecommendedVoice,
    toggleVoice,
    
    // Voice service direct access
    voiceService
  };
};

export default useAvatarVoice;
