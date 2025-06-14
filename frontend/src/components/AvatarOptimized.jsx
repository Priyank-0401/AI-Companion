import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import { AVATAR_CONFIG } from '../config/avatarConfig';

// Preload all model files
useGLTF.preload('/models/avatar.glb');
useGLTF.preload('/models/Idle.glb');
useGLTF.preload('/models/Talking.glb');

// Audio Analyzer for Lip-Sync
class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.source = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      console.log('🎤 Audio analyzer initialized');
      return true;
    } catch (error) {
      console.warn('Audio context initialization failed:', error);
      return false;
    }
  }

  connectAudio(audioElement) {
    if (!this.audioContext || !audioElement || this.isConnected) return false;
    
    try {
      if (this.source) {
        this.source.disconnect();
      }
      
      audioElement.crossOrigin = "anonymous";
      this.source = this.audioContext.createMediaElementSource(audioElement);
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      this.isConnected = true;
      
      console.log('🎤 Audio connected');
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
    
    return { volume, frequency: 0 };
  }

  cleanup() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.isConnected = false;
  }
}

// Loading Component
function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-6 bg-black/80 rounded-lg backdrop-blur-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
        <div className="text-white text-lg font-medium">Loading Avatar...</div>
      </div>
    </Html>
  );
}

// Error Component
function ErrorFallback({ error }) {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-6 bg-red-900/80 rounded-lg backdrop-blur-sm">
        <div className="text-red-300 text-lg font-medium mb-2">❌ Avatar Error</div>
        <div className="text-red-200 text-sm text-center">{error.message}</div>
      </div>
    </Html>
  );
}

// Animation Sanitizer - Removes only problematic root position/scale tracks
function sanitizeAnimationClip(clip) {
  if (!clip || !clip.tracks) return clip;
  
  const originalTrackCount = clip.tracks.length;
  
  clip.tracks = clip.tracks.filter(track => {
    const trackName = track.name.toLowerCase();
    
    // Only remove root position and scale tracks that cause transform issues
    // Keep bone rotations as they're needed for animation
    const isProblematicRootTransform = 
      (trackName.includes('mixamorig_hips') && trackName.includes('.position')) ||
      (trackName.includes('mixamorig_hips') && trackName.includes('.scale')) ||
      trackName.includes('scene.position') ||
      trackName.includes('scene.scale') ||
      trackName.includes('scene.quaternion');
    
    if (isProblematicRootTransform) {
      console.log(`🚫 Removing problematic track: ${track.name}`);
    }
    
    return !isProblematicRootTransform;
  });
  
  console.log(`🧹 Sanitized animation "${clip.name}": ${originalTrackCount} → ${clip.tracks.length} tracks`);
  return clip;
}

// Main Avatar Model Component
const AvatarModel = React.memo(({ 
  isTalking, 
  expression, 
  audioElement, 
  lipSyncEnabled,
  onError 
}) => {  // Model loading with error handling
  const avatarModel = useGLTF('/models/avatar.glb');
  const idleFile = useGLTF('/models/Idle.glb');
  const talkingFile = useGLTF('/models/Talking.glb');
  
  // Debug: Log loaded files
  useEffect(() => {
    console.log('📦 Avatar model loaded:', !!avatarModel?.scene);
    console.log('🚶 Idle file loaded:', !!idleFile?.animations, `(${idleFile?.animations?.length || 0} animations)`);
    console.log('💬 Talking file loaded:', !!talkingFile?.animations, `(${talkingFile?.animations?.length || 0} animations)`);
    
    if (idleFile?.animations?.[0]) {
      console.log('🔍 First idle animation tracks:', idleFile.animations[0].tracks.length);
    }
    if (talkingFile?.animations?.[0]) {
      console.log('🔍 First talking animation tracks:', talkingFile.animations[0].tracks.length);
    }
  }, [avatarModel, idleFile, talkingFile]);
  
  // Refs
  const groupRef = useRef();
  const audioAnalyzer = useRef(new AudioAnalyzer());
  const lastAnimationRef = useRef(null);
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [lipSyncData, setLipSyncData] = useState({ volume: 0 });
  // Process and combine animations with proper retargeting
  const animations = React.useMemo(() => {
    const allAnimations = [];
    
    console.log('🔍 Processing animation files...');
    console.log('Idle file animations:', idleFile?.animations?.length || 0);
    console.log('Talking file animations:', talkingFile?.animations?.length || 0);
    
    // Process idle animations
    if (idleFile?.animations && idleFile.animations.length > 0) {
      idleFile.animations.forEach((clip, index) => {
        const sanitizedClip = sanitizeAnimationClip(clip.clone());
        sanitizedClip.name = `idle_${index}`;
        
        // Log track information for debugging
        console.log(`🎬 Idle animation ${index} tracks:`, sanitizedClip.tracks.map(t => t.name).slice(0, 5));
        
        allAnimations.push(sanitizedClip);
      });
    } else {
      console.warn('❌ No idle animations found or failed to load');
    }
    
    // Process talking animations
    if (talkingFile?.animations && talkingFile.animations.length > 0) {
      talkingFile.animations.forEach((clip, index) => {
        const sanitizedClip = sanitizeAnimationClip(clip.clone());
        sanitizedClip.name = `talking_${index}`;
        
        // Log track information for debugging
        console.log(`🎬 Talking animation ${index} tracks:`, sanitizedClip.tracks.map(t => t.name).slice(0, 5));
        
        allAnimations.push(sanitizedClip);
      });
    } else {
      console.warn('❌ No talking animations found or failed to load');
    }
    
    console.log('🎬 Total processed animations:', allAnimations.length, allAnimations.map(a => a.name));
    return allAnimations;
  }, [idleFile, talkingFile]);

  // Animation system
  const { actions, mixer } = useAnimations(animations, avatarModel.scene);

  // Initialize audio analyzer
  useEffect(() => {
    if (lipSyncEnabled) {
      audioAnalyzer.current.initialize().then(() => {
        setIsInitialized(true);
      });
    } else {
      setIsInitialized(true);
    }
    
    return () => {
      audioAnalyzer.current.cleanup();
    };
  }, [lipSyncEnabled]);

  // Connect audio element
  useEffect(() => {
    if (lipSyncEnabled && audioElement && isInitialized) {
      audioAnalyzer.current.connectAudio(audioElement);
    }
  }, [audioElement, lipSyncEnabled, isInitialized]);
  // Animation switching logic with better error handling
  useEffect(() => {
    if (!actions || !mixer || !animations.length) {
      console.log('⏳ Waiting for animations to load...', {
        actions: !!actions,
        mixer: !!mixer,
        animationsCount: animations.length
      });
      return;
    }

    const availableActions = Object.keys(actions);
    console.log('🎭 Available actions:', availableActions);
    
    if (availableActions.length === 0) {
      console.warn('❌ No actions available for animation');
      return;
    }
    
    // Determine which animation to play
    const targetAnimation = isTalking ? 'talking_0' : 'idle_0';
    console.log(`🎯 Target animation: ${targetAnimation}, isTalking: ${isTalking}`);
    
    if (availableActions.includes(targetAnimation)) {
      if (lastAnimationRef.current !== targetAnimation) {
        // Stop current animation
        if (lastAnimationRef.current && actions[lastAnimationRef.current]) {
          console.log(`⏹️ Stopping animation: ${lastAnimationRef.current}`);
          actions[lastAnimationRef.current].fadeOut(AVATAR_CONFIG.ANIMATION.FADE_DURATION);
        }
        
        // Start new animation
        const action = actions[targetAnimation];
        console.log(`▶️ Starting animation: ${targetAnimation}`);
        
        action.reset();
        action.setLoop(THREE.LoopRepeat);
        action.clampWhenFinished = false;
        action.fadeIn(AVATAR_CONFIG.ANIMATION.FADE_DURATION);
        action.play();
        
        lastAnimationRef.current = targetAnimation;
        console.log(`✅ Now playing: ${targetAnimation}`);
      }
    } else {
      console.warn(`❌ Target animation "${targetAnimation}" not found in available actions:`, availableActions);
      
      // Fallback: play first available animation
      if (availableActions.length > 0) {
        const fallbackAnimation = availableActions[0];
        console.log(`🔄 Playing fallback animation: ${fallbackAnimation}`);
        const action = actions[fallbackAnimation];
        action.reset();
        action.setLoop(THREE.LoopRepeat);
        action.play();
        lastAnimationRef.current = fallbackAnimation;
      }
    }
  }, [isTalking, actions, mixer, animations]);

  // Animation frame updates
  useFrame(() => {
    if (!groupRef.current) return;
    
    // Update animation mixer
    if (mixer) {
      mixer.update(0.016); // ~60fps
    }
    
    // Lip-sync processing
    if (lipSyncEnabled && audioElement && isInitialized) {
      const volumeData = audioAnalyzer.current.getVolumeData();
      setLipSyncData(volumeData);
      
      // Apply lip-sync to morph targets
      const avatarMesh = groupRef.current.children[0];
      if (avatarMesh?.morphTargetInfluences && volumeData.volume > 0.01) {
        const intensity = Math.min(volumeData.volume * 3, 1);
        avatarMesh.morphTargetInfluences[0] = intensity;
      }
    }
  });

  // Error handling
  useEffect(() => {
    if (!avatarModel?.scene) {
      onError?.(new Error('Failed to load avatar model'));
    }
  }, [avatarModel, onError]);  return (
    <group
      ref={groupRef}
      position={AVATAR_CONFIG.MODEL.POSITION}
      scale={AVATAR_CONFIG.MODEL.SCALE}
      rotation={AVATAR_CONFIG.MODEL.ROTATION}
    >
      {/* 45-degree rotation on X-axis instead of Y-axis */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <primitive object={avatarModel.scene} />
      </group>
    </group>
  );
});

// Main Avatar Scene Component
const AvatarScene = React.memo(({ 
  isTalking, 
  expression, 
  audioElement, 
  lipSyncEnabled,
  className 
}) => {
  const [error, setError] = useState(null);

  const handleError = useCallback((err) => {
    console.error('Avatar error:', err);
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
    <div className={className} style={{ position: 'relative', overflow: 'hidden' }}>
      <Canvas
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
        frameloop="always"
      >
        {/* Camera */}
        <PerspectiveCamera 
          makeDefault
          position={AVATAR_CONFIG.CAMERA.POSITION}
          fov={AVATAR_CONFIG.CAMERA.FOV}
          near={AVATAR_CONFIG.CAMERA.NEAR}
          far={AVATAR_CONFIG.CAMERA.FAR}
        />

        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={0.8}
          castShadow={false}
        />
        <pointLight 
          position={[-5, 5, 5]} 
          intensity={0.4} 
        />

        {/* Avatar Model */}
        <Suspense fallback={<LoadingFallback />}>
          <AvatarModel
            isTalking={isTalking}
            expression={expression}
            audioElement={audioElement}
            lipSyncEnabled={lipSyncEnabled}
            onError={handleError}
          />
        </Suspense>
      </Canvas>
    </div>
  );
});

// Main Export Component
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
