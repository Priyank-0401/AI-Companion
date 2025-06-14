// Clean Avatar configuration optimized for hardware acceleration
export const AVATAR_CONFIG = {
  // Model settings
  MODEL: {
    // Scale factor for the avatar model
    SCALE: [1, 1, 1],    // Position offset for the avatar (centered, full body visible)
    POSITION: [0, -1.2, 0],
    // Camera settings (fixed position for stable view)
    CAMERA: {
      position: [0, -0.2, 3],
      fov: 50,
      near: 0.1,
      far: 1000
    },
    // Lighting settings
    LIGHTING: {
      ambient: { intensity: 0.8 },
      directional: { 
        position: [5, 5, 5], 
        intensity: 1.0,
        castShadow: false 
      },
      point: { 
        position: [-5, 5, 5], 
        intensity: 0.6 
      }
    }
  },

  // Animation settings
  ANIMATION: {
    // Blink interval range (ms)
    BLINK_INTERVAL: { min: 3000, max: 8000 },
    // Expression duration (ms)
    EXPRESSION_DURATION: 3000,
    // Animation fade duration for smooth transitions (seconds)
    FADE_DURATION: 0.5
  },

  // Audio settings for lip-sync
  AUDIO: {
    FFT_SIZE: 256,
    VOLUME_SENSITIVITY: 2,
    LIPSYNC_UPDATE_FREQUENCY: 3
  },

  // Rendering settings (optimized for hardware acceleration)
  RENDERING: {
    ANTIALIAS: true,
    POWER_PREFERENCE: "high-performance",
    STENCIL: false
  },

  // Performance settings (minimal since hardware acceleration is on)
  PERFORMANCE: {
    MAX_PIXEL_RATIO: window.devicePixelRatio || 2,
    MIN_PERFORMANCE: 0.5,
    PERFORMANCE_DEBOUNCE: 100
  },
  // Development settings
  DEV: {
    ENABLE_ORBIT_CONTROLS: true, // Temporarily enabled for positioning
    ENABLE_LOGGING: true,
    SHOW_STATS: false
  }
};

// Simple utility functions
export const optimizationUtils = {
  throttle: (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }
};

export default AVATAR_CONFIG;
