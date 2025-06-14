// Performance configuration for 3D Avatar optimization
export const AVATAR_CONFIG = {
  // Performance settings
  PERFORMANCE: {
    // Limit FPS to reduce GPU load (can be 30 instead of 60 for better performance)
    TARGET_FPS: 30,
    // Reduce device pixel ratio for better performance on high-DPI displays
    MAX_PIXEL_RATIO: 2,
    // Enable performance monitoring
    PERFORMANCE_MONITORING: true,
    // Minimum performance threshold before quality reduction
    MIN_PERFORMANCE: 0.8,
    // Debounce time for performance adjustments (ms)
    PERFORMANCE_DEBOUNCE: 200
  },

  // Animation settings
  ANIMATION: {
    // Cache animations to prevent re-loading
    ENABLE_CACHE: true,
    // Reduce animation update frequency (every N frames)
    UPDATE_FREQUENCY: 3,
    // Blink interval range (ms)
    BLINK_INTERVAL: { min: 3000, max: 8000 },
    // Expression duration (ms)
    EXPRESSION_DURATION: 3000
  },

  // Rendering settings
  RENDERING: {
    // Disable shadows for better performance
    SHADOWS: false,
    // Antialiasing (can be disabled for better performance)
    ANTIALIAS: true,
    // Use high-performance GPU preference
    POWER_PREFERENCE: "high-performance",
    // Disable stencil buffer if not needed
    STENCIL: false,
    // Frame loop mode ("always", "demand", "never")
    FRAME_LOOP: "demand"
  },

  // Model optimization settings
  MODEL: {
    // Scale factor for models
    SCALE: [2.5, 2.5, 2.5],
    // Position offset
    POSITION: [0, -2.5, 0],
    // Camera settings
    CAMERA: {
      position: [0, 0, 8],
      fov: 50,
      near: 0.1,
      far: 1000
    },
    // Lighting settings (optimized for performance)
    LIGHTING: {
      ambient: { intensity: 0.6 },
      directional: { 
        position: [5, 5, 5], 
        intensity: 0.8,
        castShadow: false 
      },
      point: { 
        position: [-5, 5, 5], 
        intensity: 0.4 
      }
    }
  },

  // Audio settings
  AUDIO: {
    // Audio analyzer settings
    FFT_SIZE: 256,
    // Lip-sync update frequency (every N frames)
    LIPSYNC_UPDATE_FREQUENCY: 3,
    // Volume sensitivity multiplier
    VOLUME_SENSITIVITY: 2
  },

  // Development settings
  DEV: {
    // Enable orbit controls in development
    ENABLE_ORBIT_CONTROLS: process.env.NODE_ENV === 'development',
    // Console logging
    ENABLE_LOGGING: process.env.NODE_ENV === 'development',
    // Performance stats
    SHOW_STATS: false
  }
};

// Utility functions for optimization
export const optimizationUtils = {
  // Throttle function to limit function calls
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
  },

  // Debounce function to delay function calls
  debounce: (func, delay) => {
    let debounceTimer;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    }
  },

  // Check if device has high performance capabilities
  isHighPerformanceDevice: () => {
    // Simple heuristic based on hardware concurrency and memory
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    return cores >= 4 && memory >= 4;
  },

  // Get optimal performance settings based on device
  getOptimalSettings: () => {
    const isHighPerf = optimizationUtils.isHighPerformanceDevice();
    
    return {
      pixelRatio: isHighPerf ? 2 : 1,
      antialias: isHighPerf,
      targetFPS: isHighPerf ? 60 : 30,
      shadowsEnabled: isHighPerf,
      updateFrequency: isHighPerf ? 1 : 3
    };
  }
};

export default AVATAR_CONFIG;
