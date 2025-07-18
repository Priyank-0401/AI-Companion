// Enhanced Avatar Configuration with Greeting Support
export const AVATAR_CONFIG = {
  // Model paths - Clear separation of concerns
  MODELS: {
    AVATAR: '/models/avatar.glb',      // ReadyPlayerMe appearance ONLY
    IDLE: '/models/Idle.glb',          // Animation data ONLY
    TALKING: '/models/Talking.glb',    // Animation data ONLY
    GREET: '/models/Greet.glb',        // Greeting animation data ONLY
    NOD: '/models/Nod.glb',            // Nodding animation data ONLY
  },

  // Camera settings - Position at eye level and look at head
  CAMERA: {
    POSITION: [0, 2.2, 2.5],           // Y = eye level, closer for better view
    FOV: 60,                           // Good framing
    NEAR: 0.1,
    FAR: 1000,
    LOOK_AT: [0, 1.6, 0],              // Focus on head level
  },

  // Avatar positioning - Keep upright, no rotation
  AVATAR: {
    POSITION: [0, 0.58, 0],              // Lower to bring head into view
    SCALE: [1.25, 1.25, 1.25],            // Good size
    ROTATION: [0, 0, 0],               // Keep upright - no destructive rotation
  },

  // Enhanced lighting for face visibility
  LIGHTING: {
    AMBIENT: {
      INTENSITY: 1.5,
      COLOR: 0xffffff,
    },
    DIRECTIONAL: {
      INTENSITY: 1.8,
      POSITION: [5, 10, 5],
      COLOR: 0xffffff,
    },
    POINT: {
      INTENSITY: 0.8,
      POSITION: [0, 2, 3],              // Light from front to illuminate face
      COLOR: 0xffffff,
    },
    FACE_LIGHT: {
      INTENSITY: 1.0,
      POSITION: [0, 0, 4],              // Direct face lighting
      COLOR: 0xffffff,
    },
  },

  // Animation settings - Enhanced with greeting support
  ANIMATIONS: {
    FADE_DURATION: 0.3,                // Smooth transitions
    DEFAULT: 'idle',
    NAMES: {
      GREET: 'greet',                  // Greeting animation
      IDLE: 'idle',
      TALKING: 'talking',
      NOD: 'nod',                      // Nodding animation
    },
    SPEEDS: {
      GREET: 0.5,                      // Normal speed for greeting
      IDLE: 0.7,                   // Normal speed for idle
      TALKING: 0.2,                    // Slower speed for talking
      NOD: 0.5,                        // Slightly slower for natural nod
    },
    LOOP_SETTINGS: {
      CONTINUOUS: true,                // Keep looping until manually stopped
      BUFFER_TIME: 0.1,               // Brief pause between animation loops
      SMOOTH_TRANSITIONS: true,        // Enable smooth transitions between loops
      GREET_ONCE: true,               // Greeting plays only once
    },
    // Animation priorities (higher number = higher priority)
    PRIORITIES: {
      GREET: 4,                       // Highest priority
      TALKING: 3,                     // High priority
      NOD: 2,                         // Medium priority (above idle)
      IDLE: 1,                        // Lowest priority
    },
  },

  // Enhanced Expression Settings with Greeting and Emotion Detection
  EXPRESSIONS: {
    ENABLE_BLINKING: false,            // Disabled - no blink morph targets
    ENABLE_AUTO_EXPRESSIONS: true,      // Enable automatic expressions from text
    ENABLE_EMOTION_DETECTION: true,     // Enable webcam-based emotion detection
    ENABLE_GREETING_SMILE: true,        // Enable smile during greeting
    
    // Timing settings
    BLINK_INTERVAL: [2000, 5000],       // Min and max blink interval (ms)
    BLINK_DURATION: 150,                // How long a blink lasts (ms)
    EXPRESSION_DURATION: 3000,          // How long expressions last (ms)
    GREETING_EXPRESSION_DURATION: 4000,  // How long greeting smile lasts
    EMOTION_UPDATE_INTERVAL: 200,        // How often to check for emotion changes (ms)
    EMOTION_CONFIDENCE_THRESHOLD: 0.7,  // Minimum confidence for emotion detection (0-1)
    
    // Behavior settings
    BLINK_PROBABILITY: 0.7,             // Probability of blinking when scheduled
    
    // Emotion to expression mapping
    EMOTION_MAPPING: {
      happy: 'happy',
      sad: 'sad',
      angry: 'angry',
      surprised: 'surprised',
      neutral: 'neutral'
    },
    
    // Morph target configurations
    MORPH_TARGETS: {
      // Eye blinking morph targets (NOT AVAILABLE in current model)
      EYE_BLINK_LEFT: 'eyeBlinkLeft',
      EYE_BLINK_RIGHT: 'eyeBlinkRight',
      EYE_BLINK: 'eyesClosed',         // Fallback if separate targets don't exist
      // Expression targets
      MOUTH_SMILE: 'mouthSmile',       // Available - used for greeting
      MOUTH_OPEN: 'mouthOpen',         // Available - used for talking
      MOUTH_SMILE: 'mouthSmile',       // ✅ Available - used for greeting
      MOUTH_OPEN: 'mouthOpen',         // ✅ Available - used for talking
      MOUTH_FROWN: 'mouthFrown',       // Not available
      EYEBROW_UP: 'browInnerUp',       // Not available
    },
  },

  // NEW: Greeting Configuration
  GREETING: {
    ENABLED: true,                     // Enable greeting on mount
    AUTO_TRIGGER: true,                // Auto-trigger on component mount
    DELAY: 500,                        // Delay before greeting starts (ms)
    DURATION: 3000,                    // Expected greeting animation duration (ms)
    SMILE_INTENSITY: 0.8,              // Smile strength during greeting (0-1)
    PLAY_ONCE_PER_SESSION: true,       // Only play once per page load
  },

  // Performance settings
  PERFORMANCE: {
    UPDATE_FREQUENCY: 60      // 60fps target
  }
};

export default AVATAR_CONFIG;