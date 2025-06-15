// Clean Avatar Configuration - Focus on model appearance and basic animations
export const AVATAR_CONFIG = {
  // Model paths - Clear separation of concerns
  MODELS: {
    AVATAR: '/models/avatar.glb',      // ReadyPlayerMe appearance ONLY
    IDLE: '/models/Idle.glb',          // Animation data ONLY
    TALKING: '/models/Talking.glb',    // Animation data ONLY
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
    POSITION: [0, 0.2, 0],              // Lower to bring head into view
    SCALE: [1.5, 1.5, 1.5],            // Good size
    ROTATION: [0, 0, 0],               // Keep upright - no destructive rotation
  },

  // Animation Settings
  ANIMATION: {
    FADE_DURATION: 0.3,      // Quick but smooth transitions
    LOOP: true                // Loop animations
  },
  // Performance Settings

  // Enhanced lighting for face visibility
  LIGHTING: {
    AMBIENT: {
      INTENSITY: 1.0,
      COLOR: 0xffffff,
    },
    DIRECTIONAL: {
      INTENSITY: 1.2,
      POSITION: [5, 10, 5],
      COLOR: 0xffffff,
    },
    POINT: {
      INTENSITY: 0.8,
      POSITION: [0, 2, 3],              // Light from front to illuminate face
      COLOR: 0xffffff,
    },
    FACE_LIGHT: {
      INTENSITY: 0.6,
      POSITION: [0, 0, 4],              // Direct face lighting
      COLOR: 0xffffff,
    },
  },  // Animation settings - Simple and clean
  ANIMATIONS: {
    FADE_DURATION: 0.3,                // Smooth transitions
    DEFAULT: 'idle',
    NAMES: {
      IDLE: 'idle',
      TALKING: 'talking',
    },
    SPEEDS: {
      IDLE: 1.0,                       // Normal speed for idle
      TALKING: 0.3,                    // Slower speed for talking (60% of original)
    },
    LOOP_SETTINGS: {
      CONTINUOUS: true,                // Keep looping until manually stopped
      BUFFER_TIME: 0.1,               // Brief pause between animation loops (in seconds)
      SMOOTH_TRANSITIONS: true,        // Enable smooth transitions between loops
    },
  },
  // Blinking and Expression Settings
  EXPRESSIONS: {
    ENABLE_BLINKING: false,            // Disabled - no blink morph targets in current model
    ENABLE_AUTO_EXPRESSIONS: true,
    BLINK_INTERVAL: [2000, 5000],      // Min and max blink interval (ms)
    BLINK_DURATION: 150,               // How long a blink lasts (ms)
    EXPRESSION_DURATION: 3000,         // How long expressions last (ms)
    BLINK_PROBABILITY: 0.7,            // Probability of blinking when scheduled
    MORPH_TARGETS: {
      // Eye blinking morph targets (NOT AVAILABLE in current model)
      EYE_BLINK_LEFT: 'eyeBlinkLeft',
      EYE_BLINK_RIGHT: 'eyeBlinkRight',
      EYE_BLINK: 'eyesClosed',         // Fallback if separate targets don't exist
      // Additional expression targets (AVAILABLE)
      MOUTH_SMILE: 'mouthSmile',       // ✅ Available
      MOUTH_OPEN: 'mouthOpen',         // ✅ Available - can be used for talking
      MOUTH_FROWN: 'mouthFrown',       // Not available
      EYEBROW_UP: 'browInnerUp',       // Not available
    },
  },

  // Performance settings
  PERFORMANCE: {
    UPDATE_FREQUENCY: 60      // 60fps target
  }
};

export default AVATAR_CONFIG;
