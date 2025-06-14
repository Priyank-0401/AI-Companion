import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import { AVATAR_CONFIG, optimizationUtils } from '../config/avatarConfig';

// Preload both models immediately to prevent loading flicker
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
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = AVATAR_CONFIG.AUDIO.FFT_SIZE;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      return true;
    } catch (error) {
      console.warn('Audio context not available:', error);
      return false;
    }
  }

  connectAudio(audioElement) {
    if (!this.audioContext || !audioElement) return false;
    
    try {
      if (this.source) {
        this.source.disconnect();
      }
      this.source = this.audioContext.createMediaElementSource(audioElement);
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      return true;
    } catch (error) {
      console.warn('Failed to connect audio:', error);
      return false;
    }
  }

  getVolumeData() {
    if (!this.analyser || !this.dataArray) return { volume: 0, frequency: 0 };
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate average volume
    const volume = this.dataArray.reduce((sum, value) => sum + value, 0) / this.dataArray.length / 255;
    
    // Get dominant frequency for basic phoneme detection
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

// Optimized Model component with memoization to prevent re-renders
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
  const animationCache = useRef({});
  
  // Preload both models to eliminate loading delays
  const idleModel = useGLTF('/models/Idle.glb');
  const talkingModel = useGLTF('/models/Talking.glb');
  
  // Use stable references for animations to prevent re-initialization
  const idleAnimations = useAnimations(idleModel.animations, group);
  const talkingAnimations = useAnimations(talkingModel.animations, group);
    // Current model and animations based on isTalking state - memoized for stability
  const { scene, actions, mixer, modelName } = React.useMemo(() => {
    const model = isTalking ? talkingModel : idleModel;
    const animations = isTalking ? talkingAnimations : idleAnimations;
    const modelName = isTalking ? 'Talking' : 'Idle';
    
    return {
      scene: model.scene,
      actions: animations.actions,
      mixer: animations.mixer,
      modelName
    };
  }, [isTalking, idleModel, talkingModel, idleAnimations, talkingAnimations]);

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
  }, [audioElement, lipSyncEnabled]);  // Animation management with caching and improved debugging
  useEffect(() => {
    if (!actions) return;

    const cacheKey = `${modelName.toLowerCase()}-${isTalking ? 'talking' : 'idle'}`;
    const availableActions = Object.keys(actions);
    
    // Debug: Log available animations for this model
    console.log(`🔍 ${modelName} model animations:`, availableActions);
      // Use cached animation if available
    if (animationCache.current[cacheKey]) {
      const cachedAction = animationCache.current[cacheKey];
      cachedAction.reset();
      cachedAction.play();
      console.log(`♻️ Using cached ${cacheKey} animation - time: ${cachedAction.time}, enabled: ${cachedAction.enabled}`);
      return;
    }    // Stop all current animations completely
    Object.values(actions).forEach(action => {
      if (action && action.isRunning()) {
        action.stop();
        action.reset();
      }
    });

    // Also ensure mixer is properly reset
    if (mixer) {
      mixer.stopAllAction();
    }

    // Start appropriate animation
    let targetAction;
    
    if (isTalking) {
      // Try different possible talking animation names
      targetAction = actions['Talking'] || 
                    actions['Talk'] || 
                    actions['Speaking'] || 
                    actions['Animation'] ||
                    actions['Armature|mixamo.com|Layer0'] || // Mixamo format
                    actions[availableActions[0]]; // Fallback to first available
    } else {
      // Try different possible idle animation names  
      targetAction = actions['Idle'] || 
                    actions['Breathing'] || 
                    actions['Default'] || 
                    actions['Animation'] ||
                    actions['Armature|mixamo.com|Layer0'] || // Mixamo format
                    actions[availableActions[0]]; // Fallback to first available
    }    if (targetAction) {
      // Cache the animation for future use
      animationCache.current[cacheKey] = targetAction;
      
      // Properly configure the animation
      targetAction.reset();
      targetAction.setLoop(THREE.LoopRepeat);
      targetAction.clampWhenFinished = false;
      targetAction.enabled = true;
      targetAction.timeScale = 1;
      targetAction.weight = 1;
      targetAction.play();
      
      console.log(`🎬 Playing ${modelName} animation:`, targetAction.getClip().name);
      console.log(`⏱️ Animation duration:`, targetAction.getClip().duration, 'seconds');
    } else if (availableActions.length > 0) {
      // Fallback: play the first available animation
      const fallbackAction = actions[availableActions[0]];
      if (fallbackAction) {
        animationCache.current[cacheKey] = fallbackAction;
        
        // Properly configure the fallback animation
        fallbackAction.reset();
        fallbackAction.setLoop(THREE.LoopRepeat);
        fallbackAction.clampWhenFinished = false;
        fallbackAction.enabled = true;
        fallbackAction.timeScale = 1;
        fallbackAction.weight = 1;
        fallbackAction.play();
        
        console.log(`🎬 Playing fallback ${modelName} animation:`, fallbackAction.getClip().name);
        console.log(`⏱️ Animation duration:`, fallbackAction.getClip().duration, 'seconds');
      }
    } else {
      console.warn(`❌ No animations available for ${modelName} model`);
    }

  }, [isTalking, actions, modelName]);  // Animation frame update - handles both mixer updates and lip-sync
  useFrame((state, delta) => {
    // Update animation mixer - CRITICAL for animations to play
    if (mixer) {
      mixer.update(delta);
      
      // Debug: Log mixer update (remove this after testing)
      if (frameCount.current % 60 === 0) { // Log every 60 frames (roughly once per second)
        console.log(`🔄 Mixer updating - delta: ${delta.toFixed(3)}s, time: ${mixer.time.toFixed(2)}s`);
      }
    }
    
    frameCount.current++;
    
    // Lip-sync handling (only if enabled)
    if (!lipSyncEnabled || !audioElement || !group.current) return;
    
    // Use configured update frequency to reduce CPU load
    if (frameCount.current % AVATAR_CONFIG.AUDIO.LIPSYNC_UPDATE_FREQUENCY !== 0) return;

    const volumeData = audioAnalyzer.current.getVolumeData();
    setLipSyncData(volumeData);

    // Basic lip-sync morphing (if model supports it)
    if (group.current.children[0]?.morphTargetInfluences) {
      const intensity = Math.min(volumeData.volume * AVATAR_CONFIG.AUDIO.VOLUME_SENSITIVITY, 1);
      // Assume first morph target is mouth opening
      group.current.children[0].morphTargetInfluences[0] = intensity;
    }
  });

  // Expression changes with reduced frequency
  useEffect(() => {
    if (expression === lastExpression.current) return;
    
    lastExpression.current = expression;
    setCurrentExpression(expression);

    // Clear existing timer
    if (expressionTimer.current) {
      clearTimeout(expressionTimer.current);
    }    // Reset to neutral after expression duration
    if (expression !== 'neutral') {
      expressionTimer.current = setTimeout(() => {
        setCurrentExpression('neutral');
      }, AVATAR_CONFIG.ANIMATION.EXPRESSION_DURATION);
    }
  }, [expression]);

  // Optimized blinking effect with configurable intervals
  useEffect(() => {
    const blink = () => {
      setCurrentExpression('blink');
      setTimeout(() => setCurrentExpression('neutral'), 150);
      
      // Random interval using configured range
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
    };
  }, []);
  return (
    <group ref={group} {...props}>
      <primitive 
        object={scene} 
        scale={AVATAR_CONFIG.MODEL.SCALE} 
        position={AVATAR_CONFIG.MODEL.POSITION}
        rotation={[0, 0, 0]}
      />
    </group>
  );
});

// Optimized Avatar Scene Component - Memoized to prevent unnecessary re-renders
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
    <div className={className}>
      <Canvas
        camera={AVATAR_CONFIG.MODEL.CAMERA}
        gl={{ 
          antialias: AVATAR_CONFIG.RENDERING.ANTIALIAS, 
          alpha: true,
          powerPreference: AVATAR_CONFIG.RENDERING.POWER_PREFERENCE,
          stencil: AVATAR_CONFIG.RENDERING.STENCIL,
          depth: true
        }}
        dpr={[1, AVATAR_CONFIG.PERFORMANCE.MAX_PIXEL_RATIO]}        performance={{ 
          min: AVATAR_CONFIG.PERFORMANCE.MIN_PERFORMANCE,
          debounce: AVATAR_CONFIG.PERFORMANCE.PERFORMANCE_DEBOUNCE
        }}
        frameloop="always"
      >
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

        {/* Conditionally render OrbitControls based on configuration */}
        {AVATAR_CONFIG.DEV.ENABLE_ORBIT_CONTROLS && (
          <OrbitControls 
            enablePan={false} 
            enableZoom={false} 
            enableRotate={false}
          />
        )}
      </Canvas>
    </div>
  );
});

// Main Avatar Component - Now optimized and memoized
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
