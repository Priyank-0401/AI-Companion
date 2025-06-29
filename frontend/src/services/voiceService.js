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
    this.selectedVoice = AZURE_NEURAL_VOICES[0];
    this._isSpeaking = false;
    this.currentAudio = null;
    this.audioCache = new Map();
    this.isInitialized = false;
    this.initializationPromise = null;
    this.voiceSettings = {
      rate: '0.9',
      pitch: '+5%',
      style: 'friendly'
    };
    
    // Start initialization immediately but don't wait for it
    this.initialize();
  }

  async initialize() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        // Warm up the speech synthesis with a silent audio
        await this.warmUp();
        // Pre-cache welcome messages
        await this.preCacheWelcomeMessages();
        this.isInitialized = true;
        console.log('Voice service initialized and warmed up');
      } catch (error) {
        console.warn('Voice service initialization warning:', error);
      }
      return this;
    })();

    return this.initializationPromise;
  }

  // Warm up the speech synthesis with a silent audio
  async warmUp() {
    try {
      // Use a very short silent audio to warm up the speech synthesis
      const silentAudio = new Audio();
      silentAudio.volume = 0;
      silentAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      await silentAudio.play().catch(() => {});
    } catch (error) {
      console.warn('Voice warm-up warning:', error);
    }
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
      
      // Don't wait for this to complete - let it happen in the background
      this.fetchAndCacheMessage(message, defaultVoice, cacheKey);
    } catch (error) {
      console.warn(`⚠️ Failed to start welcome message caching:`, error);
    }
  }

  // Helper method to fetch and cache a single message
  async fetchAndCacheMessage(message, voice, cacheKey) {
    if (this.audioCache.has(cacheKey)) return;
    
    try {
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      const audioBlob = await this.fetchAzureTTS(message, { voice });
      this.audioCache.set(cacheKey, audioBlob);
    } catch (error) {
      console.warn(`⚠️ Failed to cache message:`, error);
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
    if (!text || this._isSpeaking) {
      return Promise.reject('Cannot speak: empty text or already speaking');
    }

    try {
      // Stop any current audio
      this.stop();

      this._isSpeaking = true;

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
      this._isSpeaking = false;
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
        this._isSpeaking = true;
        // Create a dummy audio element for consistency with Azure TTS
        this.currentAudio = new Audio();
        options.onStart?.();
      };
      
      utterance.onend = () => {
        this._isSpeaking = false;
        this.currentAudio = null;
        options.onEnd?.();
        resolve();
      };
      
      utterance.onerror = (error) => {
        this._isSpeaking = false;
        this.currentAudio = null;
        console.error('❌ Web Speech synthesis error:', error);
        options.onError?.(error);
        reject(error);
      };
      
      speechSynthesis.speak(utterance);
    });
  }  // Play audio blob with buffer-aware playback system
  async playAudioBlob(audioBlob, options = {}) {
    console.log('🎵 Starting buffer-aware audio playback');
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio();
    
    // Set volume from options, default to 0.8
    audio.volume = options.volume !== undefined ? options.volume : 0.8;
    
    // Preload the audio
    audio.preload = 'auto';
    audio.src = audioUrl;
    
    this.currentAudio = audio;
    this._isSpeaking = true;
    
    // Call onStart immediately to sync with avatar animation
    options.onStart?.();
    
    // Start loading the audio
    audio.load();
    
    return new Promise((resolve, reject) => {
      // Function to start playback when ready
      const startPlayback = () => {
        console.log('🎵 Audio ready to play, starting playback');
        
        // Small delay to ensure avatar animation is in sync
        setTimeout(() => {
          audio.play()
            .then(() => {
              console.log('▶️ Playback started successfully');
            })
            .catch(error => {
              console.error('❌ Playback failed:', error);
              this._handlePlaybackError(error, audioUrl, reject, options);
            });
        }, 150); // 150ms delay for visual sync
      };
      
      // Try using canplaythrough first (most reliable)
      const canPlayHandler = () => {
        console.log('✅ Audio can play through');
        audio.removeEventListener('canplaythrough', canPlayHandler);
        startPlayback();
      };
      
      audio.addEventListener('canplaythrough', canPlayHandler);
      
      // Fallback: Check ready state periodically
      const readyStateCheck = setInterval(() => {
        if (audio.readyState >= 4) { // HAVE_ENOUGH_DATA
          console.log('✅ Audio ready (via readyState check)');
          clearInterval(readyStateCheck);
          audio.removeEventListener('canplaythrough', canPlayHandler);
          startPlayback();
        }
      }, 50);
      
      // Set a timeout to prevent hanging if audio never loads
      const loadTimeout = setTimeout(() => {
        console.warn('⚠️ Audio loading timeout, attempting playback anyway');
        clearInterval(readyStateCheck);
        audio.removeEventListener('canplaythrough', canPlayHandler);
        startPlayback();
      }, 5000); // 5 second timeout
      
      // Cleanup
      audio.onended = () => {
        console.log('✅ Playback completed');
        clearInterval(readyStateCheck);
        clearTimeout(loadTimeout);
        this._isSpeaking = false;
        this.currentAudio = null;
        URL.revokeObjectURL(audioUrl);
        options.onEnd?.();
        resolve();
      };
      
      audio.onplay = () => {
        console.log('▶️ Audio playback started');
      };
      
      audio.onerror = (error) => {
        console.error('❌ Playback error:', error);
        clearInterval(readyStateCheck);
        clearTimeout(loadTimeout);
        this._handlePlaybackError(error, audioUrl, reject, options);
      };

      audio.onended = () => {
        console.log('✅ Audio playback completed');
        this._isSpeaking = false;
        this.currentAudio = null;
        URL.revokeObjectURL(audioUrl);
        options.onEnd?.();
        resolve();
      };

      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        this._handlePlaybackError(error, audioUrl, reject, options);
      };

      audio.onpause = () => {
        console.log('⏸️ Audio playback paused');
        options.onPause?.();
      };

      audio.onabort = () => {
        console.log('⏹️ Audio playback aborted');
        this._isSpeaking = false;
        this.currentAudio = null;
        URL.revokeObjectURL(audioUrl);
      };
    });
  }

  // Handle playback errors consistently
  _handlePlaybackError(error, audioUrl, reject, options = {}) {
    console.error('❌ Handling playback error:', error);
    this._isSpeaking = false;
    this.currentAudio = null;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (options.onError) options.onError(error);
    if (reject) reject(error);
  }
  
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
      this._isSpeaking = false;
    }
  }
  
  // Check if currently speaking
  isSpeaking() {
    return this._isSpeaking;
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
      isSpeaking: this._isSpeaking,
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