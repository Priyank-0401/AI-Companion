import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import { AVATAR_CONFIG, optimizationUtils } from '../config/avatarConfig';  

// Preload the main avatar model and both animation files
useGLTF.preload('/models/avatar.glb');
useGLTF.preload('/models/Idle.glb');
useGLTF.preload('/models/Talking.glb');

// Audio analyzer for lip-sync
class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.source = null;
  }

  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = AVATAR_CONFIG.AUDIO.FFT_SIZE;
      this.analyser.smoothingTimeConstant = 0.8;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      console.log('🎤 Audio analyzer initialized successfully');
      return true;
    } catch (error) {
      console.warn('Audio context not available:', error);
      return false;
    }
  }

  connectAudio(audioElement) {
    if (!this.audioContext || !audioElement) return false;
    
    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      if (this.source) {
        this.source.disconnect();
      }
      
      audioElement.crossOrigin = "anonymous";
      
      this.source = this.audioContext.createMediaElementSource(audioElement);
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      
      console.log('🎤 Audio connected to analyzer');
      return true;
    } catch (error) {
      console.warn('Failed to connect audio:', error);
      return false;
    }
  }

  getVolumeData() {
    if (!this.analyser || !this.dataArray) return { volume: 0, frequency: 0 };
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i] * this.dataArray[i];
    }
    const rms = Math.sqrt(sum / this.dataArray.length);
    const volume = rms / 255;
    
    const maxIndex = this.dataArray.indexOf(Math.max(...this.dataArray));
    const frequency = (maxIndex / this.dataArray.length) * (this.audioContext.sampleRate / 2);
    
    return { volume, frequency };
  }

  cleanup() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

// Loading component
function LoadingFallback() {
  return (
    <Html center>
      <div className="text-white text-lg">Loading Avatar...</div>
    </Html>
  );
}

// Error component
function ErrorFallback({ error }) {
  return (
    <Html center>
      <div className="text-red-400 text-lg text-center">
        <div>Failed to load avatar</div>
        <div className="text-sm mt-2">{error?.message}</div>
      </div>
    </Html>
  );
}

// AnimatedModel component with proper positioning and rotation
const AnimatedModel = React.memo(({ 
  isTalking, 
  expression = 'neutral', 
  audioElement = null,
  lipSyncEnabled = false,
  ...props 
}) => {
  const group = useRef();
  const [currentExpression, setCurrentExpression] = useState('neutral');
  const [lipSyncData, setLipSyncData] = useState({ volume: 0, frequency: 0 });
  const audioAnalyzer = useRef(new AudioAnalyzer());
  const blinkTimer = useRef(null);
  const expressionTimer = useRef(null);
  const lastExpression = useRef('neutral');
  const frameCount = useRef(0);
  const animationsReady = useRef(false);
  // Load the main avatar model (ReadyPlayerMe)
  const avatarModel = useGLTF('/models/avatar.glb');
    // Load both animation files (Mixamo)
  const idleAnimationFile = useGLTF('/models/Idle.glb');
  const talkingAnimationFile = useGLTF('/models/Talking.glb');

  // Debug: Log loaded models
  console.log('🎬 Avatar model loaded:', avatarModel);
  console.log('🎬 Idle animations loaded:', idleAnimationFile?.animations?.length || 0);
  console.log('🎬 Talking animations loaded:', talkingAnimationFile?.animations?.length || 0);  // Sanitize animation clips to remove only problematic root transform tracks
  const sanitizeClip = (clip) => {
    const originalTrackCount = clip.tracks.length;
    
    clip.tracks = clip.tracks.filter((track) => {
      // Only remove very specific root-level transforms that cause positioning issues
      const isProblematicRootTransform = (
        // Mixamo root transforms
        track.name.startsWith('mixamo.com') ||
        track.name.includes('mixamo') ||
        // Scene-level transforms
        track.name.startsWith('Scene.') ||
        // Root node transforms
        track.name.startsWith('RootNode') ||
        // Only remove Hips position (not rotation/scale) - this is the main culprit
        track.name === 'Hips.position' ||
        track.name === 'mixamorig:Hips.position' ||
        // Root armature transforms (only if they include "Armature" as the root object)
        (track.name.startsWith('Armature.') && (
          track.name.includes('position') ||
          track.name.includes('scale')
        ))
      );
      
      if (isProblematicRootTransform) {
        console.log(`🚫 Removing problematic root transform: "${track.name}"`);
      }
      
      return !isProblematicRootTransform;
    });
    
    console.log(`🔧 Sanitized ${originalTrackCount - clip.tracks.length} problematic tracks, kept ${clip.tracks.length} bone animation tracks`);
    return clip;
  };
  // Combine all animations into a single array for useAnimations
  const allAnimations = React.useMemo(() => {
    const animations = [];
    
    // Add idle animations with proper naming and sanitization
    if (idleAnimationFile?.animations && idleAnimationFile.animations.length > 0) {
      idleAnimationFile.animations.forEach((clip, index) => {
        const idleClip = clip.clone();
        idleClip.name = `idle_${index}`;
          // Debug: Log a sample of tracks before sanitization
        const sampleTracks = idleClip.tracks.slice(0, 10).map(t => t.name);
        console.log(`🔍 Idle animation sample tracks:`, sampleTracks);
          // Sanitize the clip to remove root transforms
        sanitizeClip(idleClip);
        
        // Debug: Check for any remaining problematic tracks
        idleClip.tracks.forEach((track) => {
          if (track.name.includes('Hips') || track.name.includes('position')) {
            console.warn('⚠️ Idle track still moving model:', track.name);
          }
        });
        
        // Debug: Log a sample of tracks after sanitization
        const remainingTracks = idleClip.tracks.slice(0, 10).map(t => t.name);
        console.log(`✅ Idle animation remaining tracks:`, remainingTracks);
        
        animations.push(idleClip);
      });
    } else {
      console.warn('❌ No idle animations found');
    }
    
    // Add talking animations with proper naming and sanitization
    if (talkingAnimationFile?.animations && talkingAnimationFile.animations.length > 0) {
      talkingAnimationFile.animations.forEach((clip, index) => {
        const talkingClip = clip.clone();
        talkingClip.name = `talking_${index}`;
          // Debug: Log a sample of tracks before sanitization
        const sampleTracks = talkingClip.tracks.slice(0, 10).map(t => t.name);
        console.log(`🔍 Talking animation sample tracks:`, sampleTracks);
          // Sanitize the clip to remove root transforms
        sanitizeClip(talkingClip);
        
        // Debug: Check for any remaining problematic tracks
        talkingClip.tracks.forEach((track) => {
          if (track.name.includes('Hips') || track.name.includes('position')) {
            console.warn('⚠️ Talking track still moving model:', track.name);
          }
        });
        
        // Debug: Log a sample of tracks after sanitization
        const remainingTracks = talkingClip.tracks.slice(0, 10).map(t => t.name);
        console.log(`✅ Talking animation remaining tracks:`, remainingTracks);
        
        animations.push(talkingClip);
      });
    } else {
      console.warn('❌ No talking animations found');
    }
    
    console.log('🎬 Combined sanitized animations:', animations.map(a => a.name));
    console.log('🎬 Total animations loaded:', animations.length);
    return animations;
  }, [idleAnimationFile?.animations, talkingAnimationFile?.animations]);
  // Use animations on the avatar model (not the group wrapper)
  const { actions, mixer } = useAnimations(allAnimations, avatarModel.scene);

  // Initialize audio analyzer only once
  useEffect(() => {
    if (lipSyncEnabled) {
      audioAnalyzer.current.initialize();
    }
    
    return () => {
      audioAnalyzer.current.cleanup();
    };
  }, [lipSyncEnabled]);

  // Handle audio element connection
  useEffect(() => {
    if (lipSyncEnabled && audioElement) {
      audioAnalyzer.current.connectAudio(audioElement);
    }
  }, [audioElement, lipSyncEnabled]);  // Animation management - with transform protection
  useEffect(() => {
    if (!actions || !mixer) return;

    const availableActions = Object.keys(actions);
    console.log('🎬 Available animations:', availableActions);
    
    // Stop all current animations
    Object.values(actions).forEach(action => {
      if (action && action.isRunning()) {
        action.fadeOut(AVATAR_CONFIG.ANIMATION.FADE_DURATION);
      }
    });

    // Select the appropriate animation
    let targetAction;
    
    if (isTalking) {
      targetAction = actions['talking_0'] || 
                    actions['Talking'] || 
                    actions['Talk'] || 
                    actions['Speaking'];
    } else {
      targetAction = actions['idle_0'] || 
                    actions['Idle'] || 
                    actions['Breathing'] || 
                    actions['Default'];
    }

    // Fallback to first available animation
    if (!targetAction && availableActions.length > 0) {
      targetAction = actions[availableActions[0]];
    }    if (targetAction) {
      // Force reset avatar position/rotation to prevent animation drift
      avatarModel.scene.position.set(...AVATAR_CONFIG.MODEL.POSITION);
      avatarModel.scene.rotation.set(0, 0, 0);
      avatarModel.scene.scale.set(...AVATAR_CONFIG.MODEL.SCALE);
      
      // Configure and play the animation
      targetAction.reset();
      targetAction.setLoop(THREE.LoopRepeat);
      targetAction.clampWhenFinished = false;
      targetAction.enabled = true;
      targetAction.timeScale = 1;
      targetAction.weight = 1;
      
      // Fade in the new animation
      targetAction.fadeIn(AVATAR_CONFIG.ANIMATION.FADE_DURATION);
      targetAction.play();
      
      console.log(`🎬 Playing animation: ${targetAction.getClip().name} (${isTalking ? 'talking' : 'idle'})`);
      console.log(`⏱️ Animation duration: ${targetAction.getClip().duration}s`);
      animationsReady.current = true;
    } else {
      console.warn('❌ No suitable animations found');
    }

  }, [isTalking, actions, mixer]);  // Animation frame update
  useFrame((state, delta) => {
    // Enforce camera position (keeping this as safety measure)
    if (state.camera) {
      const targetPosition = AVATAR_CONFIG.MODEL.CAMERA.position;
      state.camera.position.set(targetPosition[0], targetPosition[1], targetPosition[2]);
      state.camera.lookAt(0, -1, 0);
      state.camera.updateProjectionMatrix();
    }
    
    // Update animation mixer
    if (mixer) {
      mixer.update(delta);
      
      if (frameCount.current % 60 === 0) {
        console.log(`🔄 Mixer updating - delta: ${delta.toFixed(3)}s, time: ${mixer.time.toFixed(2)}s`);
      }
    }
    
    frameCount.current++;
      // Lip-sync handling
    if (lipSyncEnabled && audioElement && group.current) {
      if (frameCount.current % AVATAR_CONFIG.AUDIO.LIPSYNC_UPDATE_FREQUENCY === 0) {
        const volumeData = audioAnalyzer.current.getVolumeData();
        setLipSyncData(volumeData);

        // Access morph targets directly from the avatar model
        const avatarMesh = group.current.children[0];
        if (avatarMesh?.morphTargetInfluences) {
          const intensity = Math.min(volumeData.volume * AVATAR_CONFIG.AUDIO.VOLUME_SENSITIVITY, 1);
          avatarMesh.morphTargetInfluences[0] = intensity;
          
          if (volumeData.volume > 0.01) {
            console.log(`👄 Lip-sync: ${intensity.toFixed(2)} (volume: ${volumeData.volume.toFixed(2)})`);
          }
        }
      }
    }
  });

  // Expression changes
  useEffect(() => {
    if (expression === lastExpression.current) return;
    
    lastExpression.current = expression;
    setCurrentExpression(expression);

    if (expressionTimer.current) {
      clearTimeout(expressionTimer.current);
    }
    
    if (expression !== 'neutral') {
      expressionTimer.current = setTimeout(() => {
        setCurrentExpression('neutral');
      }, AVATAR_CONFIG.ANIMATION.EXPRESSION_DURATION);
    }
  }, [expression]);

  // Blinking effect
  useEffect(() => {
    const blink = () => {
      setCurrentExpression('blink');
      setTimeout(() => setCurrentExpression('neutral'), 150);
      
      const { min, max } = AVATAR_CONFIG.ANIMATION.BLINK_INTERVAL;
      const nextBlink = Math.random() * (max - min) + min;
      blinkTimer.current = setTimeout(blink, nextBlink);
    };

    blinkTimer.current = setTimeout(blink, 2000);

    return () => {
      if (blinkTimer.current) {
        clearTimeout(blinkTimer.current);
      }
      if (expressionTimer.current) {
        clearTimeout(expressionTimer.current);
      }
    };  }, []);
  return (
    <group
      ref={group}
      position={AVATAR_CONFIG.MODEL.POSITION}
      scale={AVATAR_CONFIG.MODEL.SCALE}
      rotation={[0, 0, 0]}
      {...props}
    >
      <primitive object={avatarModel.scene} />
    </group>
  );
});

// Avatar Scene Component with OrbitControls for debugging
const AvatarScene = React.memo(({ 
  isTalking, 
  expression, 
  audioElement, 
  lipSyncEnabled,
  className 
}) => {
  const [error, setError] = useState(null);

  const handleError = useCallback((err) => {
    console.error('Avatar loading error:', err);
    setError(err);
  }, []);

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <ErrorFallback error={error} />
      </div>
    );
  }

  return (
    <div className={className} style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
      <Canvas
        gl={{ 
          antialias: AVATAR_CONFIG.RENDERING.ANTIALIAS, 
          alpha: true,
          powerPreference: AVATAR_CONFIG.RENDERING.POWER_PREFERENCE,
          stencil: AVATAR_CONFIG.RENDERING.STENCIL,
          depth: true
        }}
        dpr={[1, AVATAR_CONFIG.PERFORMANCE.MAX_PIXEL_RATIO]}
        performance={{ 
          min: AVATAR_CONFIG.PERFORMANCE.MIN_PERFORMANCE,
          debounce: AVATAR_CONFIG.PERFORMANCE.PERFORMANCE_DEBOUNCE
        }}
        frameloop="always"
        style={{ margin: 0, padding: 0, display: 'block' }}
      >
        <PerspectiveCamera 
          makeDefault
          position={AVATAR_CONFIG.MODEL.CAMERA.position}
          fov={AVATAR_CONFIG.MODEL.CAMERA.fov}
          near={AVATAR_CONFIG.MODEL.CAMERA.near}
          far={AVATAR_CONFIG.MODEL.CAMERA.far}        />
        <ambientLight intensity={AVATAR_CONFIG.MODEL.LIGHTING.ambient.intensity} />
        <directionalLight 
          position={AVATAR_CONFIG.MODEL.LIGHTING.directional.position} 
          intensity={AVATAR_CONFIG.MODEL.LIGHTING.directional.intensity}
          castShadow={AVATAR_CONFIG.MODEL.LIGHTING.directional.castShadow}
        />
        <pointLight 
          position={AVATAR_CONFIG.MODEL.LIGHTING.point.position} 
          intensity={AVATAR_CONFIG.MODEL.LIGHTING.point.intensity} 
        />
        
        <Suspense fallback={<LoadingFallback />}>
          <AnimatedModel
            isTalking={isTalking}
            expression={expression}
            audioElement={audioElement}
            lipSyncEnabled={lipSyncEnabled}
          />        
        </Suspense>
      </Canvas>
    </div>
  );
});

// Main Avatar Component
const Avatar = React.memo(({ 
  isTalking = false, 
  expression = 'neutral',
  audioElement = null,
  lipSyncEnabled = false,
  className = "w-full h-full"
}) => {
  return (
    <AvatarScene
      isTalking={isTalking}
      expression={expression}
      audioElement={audioElement}
      lipSyncEnabled={lipSyncEnabled}
      className={className}
    />
  );
});

export default Avatar;