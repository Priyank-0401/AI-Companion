// Enhanced Avatar Configuration with Greeting Support
export const AVATAR_CONFIG = {
  // Model paths - Clear separation of concerns
  MODELS: {
    AVATAR: '/models/avatar.glb',      // ReadyPlayerMe appearance ONLY
    IDLE: '/models/Idle.glb',          // Animation data ONLY
    TALKING: '/models/Talking.glb',    // Animation data ONLY
    GREET: '/models/Greet.glb',        // Greeting animation data ONLY
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
    POSITION: [0, 0.5, 0],              // Lower to bring head into view
    SCALE: [1.3, 1.3, 1.3],            // Good size
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
      GREET: 'greet',                  // NEW: Greeting animation
      IDLE: 'idle',
      TALKING: 'talking',
    },
    SPEEDS: {
      GREET: 1.0,                      // NEW: Normal speed for greeting
      IDLE: 1.0,                       // Normal speed for idle
      TALKING: 0.3,                    // Slower speed for talking
    },
    LOOP_SETTINGS: {
      CONTINUOUS: true,                // Keep looping until manually stopped
      BUFFER_TIME: 0.1,               // Brief pause between animation loops
      SMOOTH_TRANSITIONS: true,        // Enable smooth transitions between loops
      GREET_ONCE: true,               // NEW: Greeting plays only once
    },
    // NEW: Animation priorities (higher number = higher priority)
    PRIORITIES: {
      GREET: 3,                       // Highest priority
      TALKING: 2,                     // Medium priority
      IDLE: 1,                        // Lowest priority
    },
  },

  // Enhanced Expression Settings with Greeting
  EXPRESSIONS: {
    ENABLE_BLINKING: false,            // Disabled - no blink morph targets
    ENABLE_AUTO_EXPRESSIONS: true,
    ENABLE_GREETING_SMILE: true,       // NEW: Enable smile during greeting
    BLINK_INTERVAL: [2000, 5000],      // Min and max blink interval (ms)
    BLINK_DURATION: 150,               // How long a blink lasts (ms)
    EXPRESSION_DURATION: 3000,         // How long expressions last (ms)
    GREETING_EXPRESSION_DURATION: 4000, // NEW: How long greeting smile lasts
    BLINK_PROBABILITY: 0.7,            // Probability of blinking when scheduled
    MORPH_TARGETS: {
      // Eye blinking morph targets (NOT AVAILABLE in current model)
      EYE_BLINK_LEFT: 'eyeBlinkLeft',
      EYE_BLINK_RIGHT: 'eyeBlinkRight',
      EYE_BLINK: 'eyesClosed',         // Fallback if separate targets don't exist
      // Expression targets
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