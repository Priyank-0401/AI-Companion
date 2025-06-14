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

  // Performance Settings
  PERFORMANCE: {
    UPDATE_FREQUENCY: 60      // 60fps target
  }
};

export default AVATAR_CONFIG;
