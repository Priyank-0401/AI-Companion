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
    POSITION: [0, 1.6, 2.5],           // Y = eye level, closer for better view
    FOV: 60,                           // Good framing
    NEAR: 0.1,
    FAR: 1000,
    LOOK_AT: [0, 1.6, 0],              // Focus on head level
  },

  // Avatar positioning - Keep upright, no rotation
  AVATAR: {
    POSITION: [0, 0.25, 0],              // Lower to bring head into view
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
  },
  // Animation settings - Simple and clean
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
  },

  // Performance settings
  PERFORMANCE: {
    UPDATE_FREQUENCY: 60      // 60fps target
  }
};

export default AVATAR_CONFIG;
