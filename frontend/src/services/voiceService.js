// Voice service for managing avatar speech synthesis using Microsoft Azure Neural TTS
// High-quality neural voices for the AI companion

// Azure Neural TTS Configuration
const AZURE_CONFIG = {
  apiKey: import.meta.env.VITE_AZURE_TTS_KEY,
  region: import.meta.env.VITE_AZURE_TTS_REGION,
  endpoint: `https://${import.meta.env.VITE_AZURE_TTS_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`
};

// Validate that required environment variables are loaded
if (!AZURE_CONFIG.apiKey || !AZURE_CONFIG.region) {
  console.error('❌ Azure TTS configuration missing! Please check your .env file:');
  console.error('Required: VITE_AZURE_TTS_KEY, VITE_AZURE_TTS_REGION');
}

// Available Azure Neural Voices (all high-quality female voices)
export const AZURE_NEURAL_VOICES = [
  {
    name: 'en-US-JennyNeural',
    displayName: 'Jenny (Friendly & Warm)',
    language: 'en-US',
    gender: 'Female',
    styles: ['default', 'cheerful', 'friendly', 'calm'],
    characteristics: 'Warm, conversational, perfect for companionship'
  },
  {
    name: 'en-US-AriaNeural', 
    displayName: 'Aria (Professional & Clear)',
    language: 'en-US',
    gender: 'Female',
    styles: ['default', 'cheerful', 'empathetic', 'newscast'],
    characteristics: 'Clear, professional, empathetic'
  },
  {
    name: 'en-US-MichelleNeural',
    displayName: 'Michelle (Soft & Gentle)',
    language: 'en-US', 
    gender: 'Female',
    styles: ['default', 'cheerful', 'friendly'],
    characteristics: 'Soft, gentle, soothing'
  },
  {
    name: 'en-US-MonicaNeural',
    displayName: 'Monica (Conversational)',
    language: 'en-US',
    gender: 'Female', 
    styles: ['default', 'cheerful', 'friendly'],
    characteristics: 'Natural, conversational, approachable'
  },
  {
    name: 'en-US-SaraNeural',
    displayName: 'Sara (Youthful & Energetic)',
    language: 'en-US',
    gender: 'Female',
    styles: ['default', 'cheerful', 'friendly'],
    characteristics: 'Youthful, energetic, upbeat'
  }
];

class VoiceService {
  constructor() {
    this.availableVoices = AZURE_NEURAL_VOICES;
    this.selectedVoice = AZURE_NEURAL_VOICES[0]; // Default to Jenny
    this.isSpeaking = false;
    this.currentAudio = null;
    this.audioCache = new Map(); // Add audio caching
    this.voiceSettings = {
      rate: '0.9',      // Slightly slower for clarity
      pitch: '+5%',     // Slightly higher for femininity
      style: 'friendly' // Default emotional style
    };
    
    this.init();
  }
  init() {
    console.log('🎵 Azure Neural TTS Voice Service initialized');
    console.log('Available voices:', this.availableVoices.map(v => v.displayName));
    
    // Pre-cache common welcome messages for instant playback
    this.preCacheWelcomeMessages();
  }

  // Pre-cache welcome messages for instant response
  async preCacheWelcomeMessages() {
    const welcomeMessages = [
      "Hey! I am Seriva, your AI companion. I'm ready to talk with you!",
      "Hello! I'm Seriva, nice to meet you!",
      "Hi there! I'm your AI companion Seriva."
    ];

    console.log('🚀 Pre-caching welcome messages for instant playback...');
    
    // Cache welcome messages for each voice
    for (const voice of this.availableVoices) {
      for (const message of welcomeMessages) {
        try {
          const cacheKey = `${message}-${voice.name}`;
          if (!this.audioCache.has(cacheKey)) {
            const audioBlob = await this.fetchAzureTTS(message, { voice });
            this.audioCache.set(cacheKey, audioBlob);
            console.log(`✅ Cached: "${message.substring(0, 30)}..." for ${voice.displayName}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to cache message for ${voice.displayName}:`, error);
        }
      }
    }
    
    console.log('🎉 Welcome messages pre-cached for instant playback!');
  }
  // Fetch Azure Neural TTS Audio
  async fetchAzureTTS(text, options = {}) {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Get voice and style settings
    const voice = options.voice || this.selectedVoice;
    const voiceName = voice.name || 'en-US-JennyNeural';
    const style = options.style || this.voiceSettings.style;
    const rate = options.rate || this.voiceSettings.rate;
    const pitch = options.pitch || this.voiceSettings.pitch;    // Create simple SSML without complex features for debugging
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${voiceName}">
          ${this.escapeXML(text)}
        </voice>
      </speak>`;

    try {
      console.log('🎵 Fetching Azure TTS for:', text.substring(0, 50) + '...');
      console.log('🔧 Using voice:', voiceName);
      console.log('🔧 Using style:', style);
      console.log('🔧 SSML:', ssml);
        const response = await fetch(AZURE_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_CONFIG.apiKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3', // Faster, smaller format
          'User-Agent': 'AI-COMPANION-Avatar'
        },
        body: ssml
      });if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Azure TTS API Response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        });
        throw new Error(`Azure TTS API error: ${response.status} - ${errorText}`);
      }

      const audioBlob = await response.blob();
      console.log('✅ Azure TTS audio received, size:', audioBlob.size, 'bytes');
      
      return audioBlob;
    } catch (error) {
      console.error('❌ Azure TTS error:', error);
      throw error;
    }
  }

  // Escape XML characters for SSML
  escapeXML(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }  async speak(text, options = {}) {
    if (!text || this.isSpeaking) {
      return Promise.reject('Cannot speak: empty text or already speaking');
    }

    try {
      // Stop any current audio
      this.stop();

      console.log('🎵 Starting Azure TTS speech:', text.substring(0, 50) + '...');
      this.isSpeaking = true;

      // Check cache first for instant response
      const cacheKey = `${text}-${this.selectedVoice?.name}`;
      let audioBlob = this.audioCache.get(cacheKey);
      
      if (audioBlob) {
        console.log('🚀 Using cached audio for instant playback');
        return this.playAudioBlob(audioBlob, options);
      }

      // For immediate response, use a hybrid approach
      const isWelcomeMessage = text.toLowerCase().includes('seriva') || text.toLowerCase().includes('hello') || text.toLowerCase().includes('hey');
      
      if (isWelcomeMessage) {
        // Start immediate Web Speech API for instant feedback
        this.playWebSpeechFallback(text, options);
        
        // Then fetch Azure in background for better quality next time
        this.fetchAzureTTS(text, options).then(blob => {
          if (blob.size < 100000) {
            this.audioCache.set(cacheKey, blob);
            console.log('🎵 Azure audio cached for next time');
          }
        }).catch(error => {
          console.warn('⚠️ Background Azure fetch failed:', error);
        });
        
        return Promise.resolve();
      } else {
        // For other messages, use Azure TTS
        audioBlob = await this.fetchAzureTTS(text, options);
        
        // Cache small audio files
        if (audioBlob.size < 100000) {
          this.audioCache.set(cacheKey, audioBlob);
          
          // Limit cache size
          if (this.audioCache.size > 20) {
            const firstKey = this.audioCache.keys().next().value;
            this.audioCache.delete(firstKey);
          }
        }
        
        return this.playAudioBlob(audioBlob, options);
      }

    } catch (error) {
      console.error('❌ Speech synthesis failed:', error);
      this.isSpeaking = false;
      this.currentAudio = null;
      throw error;
    }
  }

  // Instant Web Speech API fallback for immediate response
  playWebSpeechFallback(text, options = {}) {
    if (!('speechSynthesis' in window)) {
      console.warn('⚠️ Web Speech API not available');
      return;
    }

    console.log('⚡ Using Web Speech API for instant response');
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find a good female voice from system
    const voices = speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.toLowerCase().includes('female') || 
       v.name.toLowerCase().includes('samantha') ||
       v.name.toLowerCase().includes('zoe'))
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;
    
    utterance.onstart = () => {
      this.isSpeaking = true;
      options.onStart?.();
    };
    
    utterance.onend = () => {
      this.isSpeaking = false;
      options.onEnd?.();
    };
    
    utterance.onerror = () => {
      this.isSpeaking = false;
      options.onError?.();
    };
    
    speechSynthesis.speak(utterance);
  }
  // Play audio blob with proper event handling
  async playAudioBlob(audioBlob, options = {}) {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    this.currentAudio = audio;

    return new Promise((resolve, reject) => {
      // Event handlers
      audio.onloadstart = () => {
        console.log('🎵 Audio loading started');
        options.onStart?.();
      };

      audio.oncanplaythrough = () => {
        console.log('🎵 Audio ready to play');
      };

      audio.onplay = () => {
        console.log('🎵 Audio playback started');
        this.isSpeaking = true;
        options.onStart?.();
      };

      audio.onended = () => {
        console.log('🎵 Audio playback ended');
        this.isSpeaking = false;
        this.currentAudio = null;
        URL.revokeObjectURL(audioUrl);
        options.onEnd?.();
        resolve();
      };

      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        this.isSpeaking = false;
        this.currentAudio = null;
        URL.revokeObjectURL(audioUrl);
        options.onError?.(error);
        reject(error);
      };

      audio.onpause = () => {
        console.log('⏸️ Audio paused');
        options.onPause?.();
      };

      audio.onabort = () => {
        console.log('⏹️ Audio aborted');
        this.isSpeaking = false;
        this.currentAudio = null;
        URL.revokeObjectURL(audioUrl);
      };      // Start playback
      audio.play().catch(error => {
        console.error('❌ Failed to play audio:', error);
        this.isSpeaking = false;
        this.currentAudio = null;
        URL.revokeObjectURL(audioUrl);
        reject(error);
      });
    });
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isSpeaking = false;
    console.log('⏹️ Speech stopped');
  }

  pause() {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      console.log('⏸️ Speech paused');
    }
  }

  resume() {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch(error => {
        console.error('❌ Failed to resume audio:', error);
      });
      console.log('▶️ Speech resumed');
    }
  }

  setVoice(voice) {
    if (voice && this.availableVoices.includes(voice)) {
      this.selectedVoice = voice;
      console.log('🎵 Voice changed to:', voice.displayName);
      return true;
    }
    return false;
  }

  setVoiceByName(voiceName) {
    const voice = this.availableVoices.find(v => 
      v.name.toLowerCase().includes(voiceName.toLowerCase()) ||
      v.displayName.toLowerCase().includes(voiceName.toLowerCase())
    );
    
    if (voice) {
      this.selectedVoice = voice;
      console.log('🎵 Voice changed to:', voice.displayName);
      return true;
    }
    return false;
  }

  adjustSettings(settings) {
    this.voiceSettings = { ...this.voiceSettings, ...settings };
    console.log('⚙️ Voice settings updated:', this.voiceSettings);
  }

  // Get voice recommendations based on context
  getVoiceRecommendation(context = 'general') {
    const recommendations = {
      'supportive': this.availableVoices.find(v => 
        v.name.includes('Jenny') || v.name.includes('Michelle')
      ),
      'professional': this.availableVoices.find(v => 
        v.name.includes('Aria') || v.name.includes('Monica')
      ),
      'friendly': this.availableVoices.find(v => 
        v.name.includes('Sara') || v.name.includes('Jenny')
      ),
      'calm': this.availableVoices.find(v => 
        v.name.includes('Michelle') || v.name.includes('Aria')
      )
    };

    return recommendations[context] || this.availableVoices[0];
  }

  // Test voice with a sample phrase
  async testVoice(voice, testPhrase = "Hello! I'm your AI companion. This is how I sound with Azure Neural TTS.") {
    const originalVoice = this.selectedVoice;
    this.setVoice(voice);
    
    try {
      await this.speak(testPhrase, {
        onEnd: () => {
          // Restore original voice after test
          this.selectedVoice = originalVoice;
        }
      });
      return true;
    } catch (error) {
      console.error('Voice test failed:', error);
      this.selectedVoice = originalVoice;
      return false;
    }
  }

  // Get available voices with metadata
  getVoicesWithMetadata() {
    return this.availableVoices.map(voice => ({
      voice,
      name: voice.displayName,
      lang: voice.language,
      provider: 'Microsoft Azure',
      characteristics: voice.characteristics,
      styles: voice.styles
    }));
  }

  // Get current voice status
  getStatus() {
    return {
      isSpeaking: this.isSpeaking,
      selectedVoice: this.selectedVoice,
      availableVoices: this.availableVoices.length,
      settings: this.voiceSettings
    };
  }
}


// Export singleton instance
export const voiceService = new VoiceService();
export default voiceService;