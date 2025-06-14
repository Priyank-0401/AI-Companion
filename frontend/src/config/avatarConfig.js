// Clean Avatar Configuration
export const AVATAR_CONFIG = {  // Model Transform Settings
  MODEL: {
    // Position: Center the avatar properly in view
    POSITION: [0, -2, 0],
    // Scale: Increased size for better visibility
    SCALE: [1.5, 1.5, 1.5],
    // Rotation: No rotation at group level
    ROTATION: [0, 0, 0]
  },  // Camera Settings  
  CAMERA: {
    POSITION: [0, -0.8, 2.5], // Moved up slightly and back a bit to catch the face
    FOV: 80,                  // Slightly narrower FOV for better focus
    NEAR: 0.1,
    FAR: 1000
  },

  // Animation Settings
  ANIMATION: {
    FADE_DURATION: 0.3,       // Quick but smooth transitions
    LOOP: true                // Loop animations
  },

  // Performance Settings
  PERFORMANCE: {
    UPDATE_FREQUENCY: 60      // 60fps target
  }
};

export default AVATAR_CONFIG;
