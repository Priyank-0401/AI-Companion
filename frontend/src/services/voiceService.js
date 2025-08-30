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
  },
  {
    name: 'hi-IN-SwaraNeural',
    displayName: 'Swara (Hindi - Warm & Clear)',
    language: 'hi-IN',
    gender: 'Female',
    styles: ['default', 'cheerful', 'friendly', 'calm', 'empathetic'],
    characteristics: 'Natural Hindi voice with clear Devanagari pronunciation'
  }
];

class VoiceService {
  constructor() {
    this.audioElement = null;
    this.currentUtterance = null;
    this.isInitialized = false;
    this.selectedVoice = null;
    this.selectedLanguage = 'en-US';
    this.onSpeakStart = null;
    this.onSpeakEnd = null;
    this.onSpeakError = null;
    this.availableVoices = AZURE_NEURAL_VOICES;
    this.selectedVoice = AZURE_NEURAL_VOICES[0];
    this._isSpeaking = false;
    this.currentAudio = null;
    this.audioCache = new Map();
    this.initializationPromise = null;
    this.voiceSettings = {
      rate: '0.9',
      pitch: '+5%',
      style: 'friendly'
    };
    
    // NEW: Viseme support
    this.currentUtterance = null;
    this.visemeCallbacks = new Set();
    
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
        // console.log('Voice service initialized and warmed up');
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
    const style = this.mapTTSStyle(options.style || this.voiceSettings.style);
    
    // Use faster rate for Hindi voices
    let rate = options.rate || this.voiceSettings.rate;
    if (voice.language === 'hi-IN') {
      rate = '1.2'; // Faster rate for Hindi
    }
    
    const pitch = options.pitch || this.voiceSettings.pitch;    

    // Create SSML with style support
    const xmlLang = (options.lang || voice.language || 'en-US');
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${xmlLang}">
        <voice name="${voiceName}">
          <mstts:express-as style="${style}" styledegree="1.0">
            <prosody rate="${rate}" pitch="${pitch}">
              ${this.escapeXML(text)}
            </prosody>
          </mstts:express-as>
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
  }

  // Map LLM-suggested TTS styles to Azure Neural Voice styles
  mapTTSStyle(llmStyle) {
    if (!llmStyle) return 'assistant';
    
    const styleMap = {
      'Default': 'default',
      'Assistant': 'assistant',
      'Chat': 'chat',
      'Customer Service': 'customerservice',
      'Newscast': 'newscast',
      'Angry': 'angry',
      'Cheerful': 'cheerful',
      'Sad': 'sad',
      'Excited': 'excited',
      'Friendly': 'friendly',
      'Terrified': 'terrified',
      'Shouting': 'shouting',
      'Unfriendly': 'unfriendly',
      'Whispering': 'whispering',
      'Hopeful': 'hopeful'
    };
    
    // Convert to lowercase for case-insensitive matching
    const normalizedStyle = llmStyle.toLowerCase();
    const mappedStyle = Object.entries(styleMap).find(([key]) => 
      key.toLowerCase() === normalizedStyle
    );
    
    return mappedStyle ? mappedStyle[1] : 'assistant';
  }  async speak(text, options = {}) {
    if (!text) {
      return Promise.reject('Cannot speak: empty text');
    }

    // If already speaking, stop current speech first
    if (this._isSpeaking) {
      this.stop();
      // Small delay to allow the stop to take effect
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    try {
      this._isSpeaking = true;
      // NOTE: onStart callback moved to playAudioBlob when audio actually starts

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
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Find a good female voice from system matching desired language
      const voices = window.speechSynthesis.getVoices();
      const desiredLang = (options.lang || this.selectedVoice?.language || 'en-US');
      const desiredLangBase = desiredLang.split('-')[0];
      let femaleVoice = voices.find(v => 
        (v.lang === desiredLang || v.lang.toLowerCase() === desiredLang.toLowerCase() || v.lang.toLowerCase().startsWith(desiredLangBase.toLowerCase())) &&
        (
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('zoe') ||
          v.name.toLowerCase().includes('swara')
        )
      );
      if (!femaleVoice) {
        femaleVoice = voices.find(v => v.lang.toLowerCase() === desiredLang.toLowerCase() || v.lang.toLowerCase().startsWith(desiredLangBase.toLowerCase()))
          || voices.find(v => v.lang.startsWith('en'));
      }
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = options.volume !== undefined ? options.volume : 0.8;
      
      // NEW: Store current utterance for viseme access
      this.currentUtterance = utterance;
      
      // NEW: Call viseme callbacks to allow viseme listeners to attach
      this.visemeCallbacks.forEach(callback => {
        try {
          callback(utterance);
        } catch (error) {
          console.warn('⚠️ Viseme callback error:', error);
        }
      });
      
      // Set a timeout to handle cases where onend doesn't fire
      const timeout = setTimeout(() => {
        this._isSpeaking = false;
        this.currentAudio = null;
        this.currentUtterance = null;
        reject(new Error('Speech synthesis timed out'));
      }, 30000); // 30 second timeout
      
      utterance.onstart = () => {
        clearTimeout(timeout);
        this._isSpeaking = true;
        options.onStart?.(); // Call onStart here for perfect animation sync
      };
      
      utterance.onend = () => {
        clearTimeout(timeout);
        this._isSpeaking = false;
        this.currentAudio = null;
        this.currentUtterance = null;
        options.onEnd?.();
        resolve();
      };
      
      utterance.onerror = (error) => {
        clearTimeout(timeout);
        this._isSpeaking = false;
        this.currentAudio = null;
        this.currentUtterance = null;
        console.error('❌ Web Speech synthesis error:', error);
        if (options.onError) {
          options.onError(error);
        }
        reject(error);
      };
      
      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        clearTimeout(timeout);
        this._isSpeaking = false;
        this.currentUtterance = null;
        reject(e);
      }
    });
  }

  // REVISED: Play audio blob with immediate playback
  async playAudioBlob(audioBlob, options = {}) {

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.volume = options.volume !== undefined ? options.volume : 0.8;
    audio.preload = 'auto';
    this.currentAudio = audio;

    // No need to call audio.load() explicitly when src is set

    return new Promise((resolve, reject) => {
      let playbackStarted = false;

      // Function to start playback as soon as possible
      const startPlayback = () => {
        if (playbackStarted) return;
        playbackStarted = true;


        
        // Reduced delay from 150ms to 50ms for faster response
        setTimeout(() => {
          audio.play().catch(error => {
            console.error('❌ Playback failed:', error);
            this._handlePlaybackError(error, audioUrl, reject, options);
          });
        }, 50); // Reduced delay for faster response
      };

      // Use 'canplay' which fires much sooner than 'canplaythrough'
      const canPlayHandler = () => {

        cleanupListeners();
        startPlayback();
      };

      // Fallback check for readyState
      const readyStateCheck = setInterval(() => {
        // Use readyState >= 3 (HAVE_FUTURE_DATA) which is equivalent to 'canplay'
        if (audio.readyState >= 3) {

          cleanupListeners();
          startPlayback();
        }
      }, 50);

      // Timeout to prevent hanging if audio never loads
      const loadTimeout = setTimeout(() => {
        console.warn('⚠️ Load timeout reached, attempting to play anyway.');
        cleanupListeners();
        startPlayback();
      }, 3000); // 3-second timeout is plenty

      const cleanupListeners = () => {
        clearInterval(readyStateCheck);
        clearTimeout(loadTimeout);
        audio.removeEventListener('canplay', canPlayHandler);
        audio.removeEventListener('error', errorHandler);
      };

      const errorHandler = (error) => {
        console.error('❌ Playback error:', error);
        cleanupListeners();
        this._handlePlaybackError(error, audioUrl, reject, options);
      };

      // Assign all event listeners once
      audio.addEventListener('canplay', canPlayHandler);
      audio.addEventListener('error', errorHandler);

      audio.onplaying = () => {

        this._isSpeaking = true;
        options.onStart?.(); // Call onStart here for perfect animation sync
      };

      audio.onended = () => {

        this._isSpeaking = false;
        this.currentAudio = null;
        URL.revokeObjectURL(audioUrl);
        options.onEnd?.();
        resolve();
      };

      audio.onpause = () => {

        options.onPause?.();
      };

      audio.onabort = () => {

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
    if (voice && AZURE_NEURAL_VOICES.find(v => v.name === voice.name)) {
      this.selectedVoice = voice;
      console.log('🎵 Voice set to:', voice.displayName);
    }
  }

  setLanguage(languageCode) {
    this.selectedLanguage = languageCode;
    console.log('🌐 VoiceService language set to:', languageCode);
    
    // Auto-select appropriate voice for the language
    const languageVoices = AZURE_NEURAL_VOICES.filter(voice => voice.language === languageCode);
    if (languageVoices.length > 0 && (!this.selectedVoice || this.selectedVoice.language !== languageCode)) {
      this.selectedVoice = languageVoices[0];
      console.log('🎵 Auto-selected voice for language:', this.selectedVoice.displayName);
    }
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

  // NEW: Viseme support methods
  
  /**
   * Register a callback to receive SpeechSynthesisUtterance objects for viseme analysis
   * @param {Function} callback - Function that receives utterance object
   */
  addVisemeCallback(callback) {
    if (typeof callback === 'function') {
      this.visemeCallbacks.add(callback);

    }
  }

  /**
   * Remove a viseme callback
   * @param {Function} callback - Function to remove
   */
  removeVisemeCallback(callback) {
    this.visemeCallbacks.delete(callback);

  }

  /**
   * Get current utterance for viseme analysis
   * @returns {SpeechSynthesisUtterance|null}
   */
  getCurrentUtterance() {
    return this.currentUtterance;
  }

  /**
   * Check if viseme support is available (Web Speech API)
   * @returns {boolean}
   */
  isVisemeSupported() {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }
}


// Export singleton instance
export const voiceService = new VoiceService();
export default voiceService;