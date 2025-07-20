/**
 * Centralized Camera Service
 * Manages camera access across the application to prevent conflicts
 * Ensures only one component can use the camera at a time
 */

class CameraService {
  constructor() {
    this.currentStream = null;
    this.currentOwner = null;
    this.isActive = false;
    this.constraints = null;
    this.listeners = new Map(); // For cleanup notifications
  }

  /**
   * Request camera access for a specific component
   * @param {string} ownerId - Unique identifier for the requesting component
   * @param {Object} constraints - Media constraints for getUserMedia
   * @param {Object} options - Additional options
   * @returns {Promise<MediaStream>} - The camera stream
   */
  async requestCamera(ownerId, constraints = { audio: true, video: true }, options = {}) {
    try {

      
      // If another component is using the camera, release it first
      if (this.isActive && this.currentOwner !== ownerId) {

        await this.releaseCamera(this.currentOwner);
      }

      // If we already have a stream for this owner with same constraints, return it
      if (this.isActive && this.currentOwner === ownerId && this.constraintsMatch(constraints)) {

        return this.currentStream;
      }

      // Release any existing stream before creating a new one
      if (this.currentStream) {
        this.stopAllTracks();
      }

      // Request new camera access

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Store the stream and owner info
      this.currentStream = stream;
      this.currentOwner = ownerId;
      this.isActive = true;
      this.constraints = { ...constraints };


      
      // Add event listeners to track when tracks end
      stream.getTracks().forEach(track => {
        track.addEventListener('ended', () => {
          console.log(`Track ended for ${ownerId}:`, track.kind);
          this.handleTrackEnded(ownerId);
        });
      });

      return stream;
    } catch (error) {
      console.error(`Error requesting camera for ${ownerId}:`, error);
      this.resetState();
      throw new Error(`Failed to access camera: ${error.message}`);
    }
  }

  /**
   * Release camera for a specific component
   * @param {string} ownerId - The component releasing the camera
   */
  async releaseCamera(ownerId) {
    console.log(`Camera release requested by: ${ownerId}`);
    
    if (!this.isActive) {
      console.log('No active camera to release');
      return;
    }

    if (this.currentOwner !== ownerId) {
      console.warn(`Release requested by ${ownerId} but camera is owned by ${this.currentOwner}`);
      return;
    }

    // Notify listeners that camera is being released
    if (this.listeners.has(ownerId)) {
      const listener = this.listeners.get(ownerId);
      if (typeof listener === 'function') {
        try {
          listener();
        } catch (error) {
          console.warn('Error in camera release listener:', error);
        }
      }
    }

    this.stopAllTracks();
    this.resetState();
    console.log(`Camera released by: ${ownerId}`);
  }

  /**
   * Force release camera (emergency cleanup)
   */
  forceRelease() {
    console.log('Force releasing camera');
    this.stopAllTracks();
    this.resetState();
  }

  /**
   * Check if camera is currently in use
   * @returns {boolean}
   */
  isInUse() {
    return this.isActive && this.currentStream && this.currentStream.active;
  }

  /**
   * Get current owner of the camera
   * @returns {string|null}
   */
  getCurrentOwner() {
    return this.currentOwner;
  }

  /**
   * Register a cleanup listener for a component
   * @param {string} ownerId - Component identifier
   * @param {Function} listener - Cleanup function to call
   */
  registerCleanupListener(ownerId, listener) {
    this.listeners.set(ownerId, listener);
  }

  /**
   * Unregister cleanup listener
   * @param {string} ownerId - Component identifier
   */
  unregisterCleanupListener(ownerId) {
    this.listeners.delete(ownerId);
  }

  /**
   * Get available camera devices
   * @returns {Promise<MediaDeviceInfo[]>}
   */
  async getAvailableDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error getting camera devices:', error);
      return [];
    }
  }

  /**
   * Check if camera permissions are granted
   * @returns {Promise<boolean>}
   */
  async checkPermissions() {
    try {
      const result = await navigator.permissions.query({ name: 'camera' });
      return result.state === 'granted';
    } catch (error) {
      console.warn('Permission check not supported:', error);
      return null; // Unknown
    }
  }

  // Private methods

  /**
   * Stop all tracks in the current stream
   */
  stopAllTracks() {
    if (this.currentStream) {
      console.log('Stopping all media tracks');
      this.currentStream.getTracks().forEach(track => {
        console.log(`Stopping ${track.kind} track:`, track.id);
        track.stop();
        track.enabled = false;
      });
      this.currentStream = null;
    }
  }

  /**
   * Reset internal state
   */
  resetState() {
    this.currentStream = null;
    this.currentOwner = null;
    this.isActive = false;
    this.constraints = null;
  }

  /**
   * Check if constraints match the current ones
   * @param {Object} newConstraints
   * @returns {boolean}
   */
  constraintsMatch(newConstraints) {
    if (!this.constraints) return false;
    
    return JSON.stringify(this.constraints) === JSON.stringify(newConstraints);
  }

  /**
   * Handle when a track ends unexpectedly
   * @param {string} ownerId
   */
  handleTrackEnded(ownerId) {
    console.log(`Track ended unexpectedly for ${ownerId}`);
    if (this.currentOwner === ownerId) {
      this.resetState();
    }
  }
}

// Create and export a singleton instance
const cameraService = new CameraService();

// Global cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cameraService.forceRelease();
  });
  
  window.addEventListener('pagehide', () => {
    cameraService.forceRelease();
  });
}

export default cameraService;
