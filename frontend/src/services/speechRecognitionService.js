// Speech Recognition Service for user voice input logging
class SpeechRecognitionService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.silenceTimer = null;
    this.silenceTimeout = 3000; // 3 seconds of silence before auto-stop
    this.onTranscript = null;
    this.onStart = null;
    this.onEnd = null;
    this.onError = null;
    this.lastSpeechTime = null;
    this.activeComponent = null; // Track which component is currently using the service
    this.registeredComponents = new Set(); // Track all registered components
    
    this.initializeRecognition();
  }

  initializeRecognition() {
    // Check if browser supports Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('❌ Speech Recognition not supported in this browser');
      return false;
    }

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Configure recognition settings
    this.recognition.continuous = true; // Keep listening
    this.recognition.interimResults = true; // Show interim results
    this.recognition.lang = 'en-US';
    
    // Set up event handlers
    this.setupEventHandlers();
    
    console.log('✅ Speech Recognition initialized');
    return true;  }

  // Register a component to use the service
  registerComponent(componentName) {
    console.log(`📝 Registering component: ${componentName}`);
    this.registeredComponents.add(componentName);
    
    // If no active component, this becomes the active one
    if (!this.activeComponent) {
      this.activeComponent = componentName;
      console.log(`🎯 ${componentName} is now the active speech recognition component`);
    }
  }

  // Unregister a component
  unregisterComponent(componentName) {
    console.log(`📝 Unregistering component: ${componentName}`);
    this.registeredComponents.delete(componentName);
    
    // If this was the active component, stop listening and clear active status
    if (this.activeComponent === componentName) {
      console.log(`🛑 Active component ${componentName} is unregistering - stopping recognition`);
      this.stopListening();
      this.activeComponent = null;
      
      // If there are other registered components, make the first one active
      if (this.registeredComponents.size > 0) {
        const newActive = Array.from(this.registeredComponents)[0];
        this.activeComponent = newActive;
        console.log(`🎯 ${newActive} is now the active speech recognition component`);
      }
    }
  }

  // Check if a component is registered and can use the service
  canComponentUseService(componentName) {
    return this.registeredComponents.has(componentName) && this.activeComponent === componentName;
  }

  setupEventHandlers() {
    if (!this.recognition) return;    // When speech recognition starts
    this.recognition.onstart = () => {
      this.isListening = true;
      this.lastSpeechTime = Date.now();
      console.log('🎤 Speech recognition started - listening for user input...');
      
      // ✅ START SILENCE TIMER when recognition actually starts
      this.startSilenceTimer();
      
      if (this.onStart) {
        this.onStart();
      }
    };    // When speech recognition ends - IMPROVED STATE MANAGEMENT
    this.recognition.onend = () => {
      const wasListening = this.isListening;
      const previousComponent = this.activeComponent;
      
      this.isListening = false;
      this.activeComponent = null; // Clear ownership
      this.clearSilenceTimer();
      
      if (wasListening) {
        console.log(`🔇 Speech recognition stopped (was used by: ${previousComponent || 'unknown'})`);
      } else {
        console.log('🔇 Speech recognition ended (cleanup)');
      }
      
      if (this.onEnd && wasListening) {
        this.onEnd();
      }
    };

    // When speech is recognized
    this.recognition.onresult = (event) => {
      this.lastSpeechTime = Date.now();
      this.resetSilenceTimer();

      let interimTranscript = '';
      let finalTranscript = '';

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Log interim results (what user is currently speaking)
      if (interimTranscript.trim()) {
        console.log('🗣️ User speaking (interim):', interimTranscript.trim());
      }      // Log final results (complete sentences/phrases)
      if (finalTranscript.trim()) {
        console.log('✅ User said (final):', finalTranscript.trim());
        
        if (this.onTranscript) {
          this.onTranscript(finalTranscript.trim(), true); // true = final
        }
      }

      // Also pass interim results to callback if provided
      if (interimTranscript.trim() && this.onTranscript) {
        this.onTranscript(interimTranscript.trim(), false); // false = interim
      }
    };    // Handle errors - IMPROVED VERSION
    this.recognition.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error);
      
      // Handle specific error types
      switch (event.error) {
        case 'no-speech':
          console.log('ℹ️ No speech detected - continuing...');
          // Don't reset state for no-speech - let it continue
          break;
        case 'audio-capture':
          console.error('❌ No microphone found or permission denied');
          this.isListening = false;
          this.clearSilenceTimer();
          if (this.onError) this.onError(event.error);
          break;
        case 'not-allowed':
          console.error('❌ Microphone permission denied');
          this.isListening = false;
          this.clearSilenceTimer();
          if (this.onError) this.onError(event.error);
          break;
        case 'network':
          console.log('ℹ️ Network error (browser limitation) - this is normal and expected');
          // Network errors are common browser limitations - don't treat as real errors
          // Don't reset state or call error callback
          break;
        case 'aborted':
          console.log('ℹ️ Speech recognition aborted');
          this.isListening = false;
          this.clearSilenceTimer();
          // Don't call error callback for intentional aborts
          break;
        default:
          console.error('❌ Unknown speech recognition error:', event.error);
          this.isListening = false;
          this.clearSilenceTimer();
          if (this.onError) this.onError(event.error);
      }
    };

    // Handle no speech detected
    this.recognition.onnomatch = () => {
      console.log('ℹ️ No speech match found');
    };  }  // Start listening for user input - IMPROVED VERSION WITH COMPONENT REGISTRATION
  startListening(options = {}) {
    if (!this.recognition) {
      console.error('❌ Speech recognition not available');
      return false;
    }

    const componentName = options.componentName || 'unknown';
    
    // Debug current state
    console.log(`🔍 ${componentName} wants to start listening. Current state:`, this.getServiceState());

    // ✅ Check if component is registered and can use the service
    if (!this.canComponentUseService(componentName)) {
      console.warn(`⚠️ ${componentName} cannot use speech recognition service. Active component: ${this.activeComponent}`);
      return false;
    }

    // ✅ Check if already listening
    if (this.isListening) {
      if (this.activeComponent === componentName) {
        console.log(`ℹ️ ${componentName} is already listening... skipping start`);
        return true;
      } else {
        console.log(`⚠️ ${componentName} tried to start listening, but ${this.activeComponent} is already using the service`);
        return false;
      }
    }

    console.log(`🎯 ${componentName} starting speech recognition...`);

    // Set callbacks if provided in options (for backward compatibility)
    if (options.onTranscript) this.onTranscript = options.onTranscript;
    if (options.onStart) this.onStart = options.onStart;
    if (options.onEnd) this.onEnd = options.onEnd;  
    if (options.onError) this.onError = options.onError;

    // Set timeout if provided
    if (options.silenceTimeout) {
      this.setSilenceTimeout(options.silenceTimeout);
    }    try {
      // ✅ SIMPLIFIED: Just try to start, handle errors gracefully
      this.recognition.start();
      console.log(`🎤 ${componentName} starting to listen for user voice input...`);
      return true;
    } catch (error) {
      console.error('❌ Failed to start speech recognition:', error.message);
      
      // Handle the "already started" error by forcing a reset
      if (error.message.includes('already started') || error.name === 'InvalidStateError') {
        console.log('🔄 Recognition state conflict - forcing reset...');
        this.forceReset();
        return false;
      }
      
      if (this.onError) {
        this.onError(error.name || 'start-failed');
      }
      return false;
    }
  }
  // Stop listening - IMPROVED WITH COMPONENT OWNERSHIP
  stopListening(componentName = null) {
    if (!this.recognition) {
      return;
    }

    // If a component name is provided, check if it's the active component
    if (componentName && this.activeComponent && this.activeComponent !== componentName) {
      console.log(`⚠️ ${componentName} tried to stop listening, but ${this.activeComponent} is the active component`);
      return;
    }

    if (this.isListening) {
      try {
        console.log(`🔇 ${this.activeComponent || 'unknown'} stopping speech recognition...`);
        this.recognition.stop(); // Use stop() instead of abort() for graceful shutdown
      } catch (error) {
        console.error('❌ Error stopping speech recognition:', error);
        // Force cleanup even if stop fails
        this.isListening = false;
        this.activeComponent = null;
        this.clearSilenceTimer();
        if (this.onEnd) {
          this.onEnd();
        }
      }
    } else {
      console.log('ℹ️ Not currently listening');
    }
  }
  // Start silence timer - auto-stop after 3 seconds of no speech
  startSilenceTimer() {
    this.clearSilenceTimer();
    
    console.log(`⏰ Starting silence timer (${this.silenceTimeout}ms)...`);
    
    this.silenceTimer = setTimeout(() => {
      if (this.isListening) {
        console.log('⏰ No speech detected for 3 seconds - auto-stopping microphone');
        this.stopListening();
      } else {
        console.log('⏰ Silence timer expired but not listening');
      }
    }, this.silenceTimeout);
  }

  // Reset silence timer when speech is detected
  resetSilenceTimer() {
    console.log('🔄 Speech detected - resetting silence timer');
    this.clearSilenceTimer();
    this.startSilenceTimer();
  }

  // Clear silence timer
  clearSilenceTimer() {
    if (this.silenceTimer) {
      console.log('🛑 Clearing silence timer');
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  // Get current service state for debugging
  getServiceState() {
    return {
      isListening: this.isListening,
      activeComponent: this.activeComponent,
      registeredComponents: Array.from(this.registeredComponents),
      hasRecognition: !!this.recognition
    };
  }

  // Check if currently listening
  isCurrentlyListening() {
    return this.isListening;
  }

  // Check if speech recognition is supported
  isSupported() {
    return this.recognition !== null;
  }

  // Set silence timeout (in milliseconds)
  setSilenceTimeout(timeout) {
    this.silenceTimeout = timeout;
    console.log(`🔧 Silence timeout set to ${timeout}ms`);
  }

  // Get current silence timeout
  getSilenceTimeout() {
    return this.silenceTimeout;
  }
  // Force reset the recognition state
  forceReset() {
    console.log('🔄 Force resetting speech recognition state...');
    this.isListening = false;
    this.activeComponent = null;
    this.clearSilenceTimer();
    
    if (this.recognition) {
      try {
        this.recognition.abort(); // Immediate termination
      } catch (error) {
        // Ignore errors during abort
      }
    }
      // Reinitialize after a short delay
    setTimeout(() => {
      this.initializeRecognition();
    }, 100);
  }
  // Set callbacks for external components
  setCallbacks(callbacks = {}) {
    this.onTranscript = callbacks.onResult || null;
    this.onStart = callbacks.onStart || null;
    this.onEnd = callbacks.onEnd || null;
    this.onError = callbacks.onError || null;
    
    console.log('🔧 Speech recognition callbacks updated');
  }

  // Get current service state for debugging
  getServiceState() {
    return {
      isListening: this.isListening,
      activeComponent: this.activeComponent,
      hasRecognition: !!this.recognition,
      isSupported: this.isSupported()
    };
  }

  // Debug method to log current state
  logCurrentState() {
    const state = this.getServiceState();
    console.log('🔍 Speech Recognition Service State:', state);
  }
  // Cleanup resources
  cleanup() {
    this.stopListening();
    this.clearSilenceTimer();
    this.activeComponent = null;
    
    if (this.recognition) {
      this.recognition.onstart = null;
      this.recognition.onend = null;
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onnomatch = null;
    }
    
    console.log('🧹 Speech recognition service cleaned up');
  }

  // Helper method to safely check if recognition is actually active
  isSafeToStart() {
    // Check both our flag and try to detect actual state
    if (this.isListening) {
      return false;
    }
    
    // Additional safety check - try a quick operation to see if recognition is busy
    try {
      // This is a hack but works - if recognition is active, accessing certain properties might throw
      const lang = this.recognition.lang;
      return true;
    } catch (error) {
      console.log('ℹ️ Recognition appears to be in invalid state');
      return false;
    }
  }
}

// Create and export a singleton instance
const speechRecognitionService = new SpeechRecognitionService();
export default speechRecognitionService;
