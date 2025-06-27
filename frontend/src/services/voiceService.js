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
    
    // Pre-cache common welcome messages for instant playback
    this.preCacheWelcomeMessages();
  }
  // Pre-cache welcome messages for instant response (with rate limiting)
  async preCacheWelcomeMessages() {
    const welcomeMessages = [
      "Hey! I am Seriva, your AI companion. I'm ready to talk with you!"
    ];

    
    // Only cache for the default voice to avoid rate limiting
    const defaultVoice = this.availableVoices[0];
    
    try {
      const message = welcomeMessages[0];
      const cacheKey = `${message}-${defaultVoice.name}`;
      if (!this.audioCache.has(cacheKey)) {
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        const audioBlob = await this.fetchAzureTTS(message, { voice: defaultVoice });
        this.audioCache.set(cacheKey, audioBlob);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to cache welcome message:`, error);
      // Don't throw error, just log it - the app should still work without pre-caching
    }
    
  }  // Fetch Azure Neural TTS Audio with rate limiting and retry logic
  async fetchAzureTTS(text, options = {}) {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Get voice and style settings
    const voice = options.voice || this.selectedVoice;
    const voiceName = voice.name || 'en-US-JennyNeural';
    const style = options.style || this.voiceSettings.style;
    const rate = options.rate || this.voiceSettings.rate;
    const pitch = options.pitch || this.voiceSettings.pitch;    

    // Create simple SSML without complex features for debugging
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${voiceName}">
          ${this.escapeXML(text)}
        </voice>
      </speak>`;

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        
        const response = await fetch(AZURE_CONFIG.endpoint, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': AZURE_CONFIG.apiKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
            'User-Agent': 'AI-COMPANION-Avatar'
          },
          body: ssml
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          // Handle rate limiting specifically
          if (response.status === 429) {
            retryCount++;
            const retryAfter = response.headers.get('Retry-After') || (retryCount * 2);
            console.warn(`⚠️ Rate limited (429). Retry ${retryCount}/${maxRetries} after ${retryAfter}s`);
            
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
              continue;
            }
          }
          
          console.error('❌ Azure TTS API Response:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: errorText
          });
          throw new Error(`Azure TTS API error: ${response.status} - ${errorText}`);
        }

        const audioBlob = await response.blob();
        
        return audioBlob;
      } catch (error) {
        if (error.message.includes('429') && retryCount < maxRetries - 1) {
          retryCount++;
          console.warn(`⚠️ Retrying due to rate limit: ${retryCount}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
          continue;
        }
        
        console.error('❌ Azure TTS error:', error);
        throw error;
      }
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

      this.isSpeaking = true;

      // Check cache first for instant response
      const cacheKey = `${text}-${this.selectedVoice?.name}`;
      let audioBlob = this.audioCache.get(cacheKey);
      
      if (audioBlob) {
        return this.playAudioBlob(audioBlob, options);
      }

      // Try Azure TTS first, fallback to Web Speech API on rate limit
      try {
        audioBlob = await this.fetchAzureTTS(text, options);
        
        // Cache small audio files
        if (audioBlob.size < 100000) {
          this.audioCache.set(cacheKey, audioBlob);
          
          // Limit cache size
          if (this.audioCache.size > 10) {
            const firstKey = this.audioCache.keys().next().value;
            this.audioCache.delete(firstKey);
          }
        }
        
        return this.playAudioBlob(audioBlob, options);
      } catch (azureError) {
        console.warn('⚠️ Azure TTS failed, falling back to Web Speech API:', azureError.message);
        
        // Fallback to Web Speech API
        return this.playWebSpeechFallback(text, options);
      }

    } catch (error) {
      console.error('❌ Speech synthesis failed:', error);
      this.isSpeaking = false;
      this.currentAudio = null;
      
      // Last resort: try Web Speech API
      try {
        return this.playWebSpeechFallback(text, options);
      } catch (fallbackError) {
        console.error('❌ All speech synthesis methods failed:', fallbackError);
        throw error;
      }
    }
  }
  // Instant Web Speech API fallback for immediate response
  playWebSpeechFallback(text, options = {}) {
    if (!('speechSynthesis' in window)) {
      console.warn('⚠️ Web Speech API not available');
      throw new Error('Web Speech API not supported');
    }
    
    return new Promise((resolve, reject) => {
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
      utterance.volume = options.volume !== undefined ? options.volume : 0.8;
      
      utterance.onstart = () => {
        this.isSpeaking = true;
        // Create a dummy audio element for consistency with Azure TTS
        this.currentAudio = new Audio();
        options.onStart?.();
      };
      
      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentAudio = null;
        options.onEnd?.();
        resolve();
      };
      
      utterance.onerror = (error) => {
        this.isSpeaking = false;
        this.currentAudio = null;
        console.error('❌ Web Speech synthesis error:', error);
        options.onError?.(error);
        reject(error);
      };
      
      speechSynthesis.speak(utterance);
    });
  }  // Play audio blob with proper event handling
  async playAudioBlob(audioBlob, options = {}) {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Set volume from options, default to 0.8
    audio.volume = options.volume !== undefined ? options.volume : 0.8;
    
    this.currentAudio = audio;

    return new Promise((resolve, reject) => {
      // Event handlers
      audio.onloadstart = () => {
        options.onStart?.();
      };


      audio.onplay = () => {
        this.isSpeaking = true;
        options.onStart?.();
      };

      audio.onended = () => {
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
        options.onPause?.();
      };

      audio.onabort = () => {
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
  }

  pause() {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
    }
  }

  resume() {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch(error => {
        console.error('❌ Failed to resume audio:', error);
      });
    }
  }

  setVoice(voice) {
    if (voice && this.availableVoices.includes(voice)) {
      this.selectedVoice = voice;
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
      return true;
    }
    return false;
  }

  adjustSettings(settings) {
    this.voiceSettings = { ...this.voiceSettings, ...settings };
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

  // Get the current audio element for lip sync integration
  getAudioElement() {
    return this.currentAudio;
  }
}


// Export singleton instance
export const voiceService = new VoiceService();
export default voiceService;