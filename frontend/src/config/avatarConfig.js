// Clean Avatar Configuration
export const AVATAR_CONFIG = {  // Model Transform Settings
  MODEL: {
    // Position: Try centering differently for face visibility
    POSITION: [0, -1, 0],      // Less downward offset
    // Scale: Smaller scale to see full model better
    SCALE: [1.2, 1.2, 1.2],    // Slightly smaller to see more of the model
    // Rotation: No rotation at group level
    ROTATION: [0, 0, 0]
  },

  // Camera Settings  
  CAMERA: {
    POSITION: [0, 0.5, 4],     // Higher up and further back to see face
    FOV: 60,                   // Wider FOV to capture more area
    NEAR: 0.1,
    FAR: 1000
  },

  // Animation Settings
  ANIMATION: {
    FADE_DURATION: 0.3,       // Quick but smooth transitions
    LOOP: true                // Loop animations
  },

<<<<<<< Updated upstream
  // Performance Settings
=======
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
      TALKING: 0.4,                    // Slower speed for talking (60% of original)
    },
  },

  // Performance settings
>>>>>>> Stashed changes
  PERFORMANCE: {
    UPDATE_FREQUENCY: 60      // 60fps target
  }
};

export default AVATAR_CONFIG;
