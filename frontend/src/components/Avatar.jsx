import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';

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
      this.analyser.fftSize = 256;
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

// Enhanced Model component with facial expressions and lip-sync
function AnimatedModel({ 
  isTalking, 
  expression = 'neutral', 
  audioElement = null,
  lipSyncEnabled = false,
  ...props 
}) {  const group = useRef();
  const [currentExpression, setCurrentExpression] = useState('neutral');
  const [lipSyncData, setLipSyncData] = useState({ volume: 0, frequency: 0 });
  const [isIdleReady, setIsIdleReady] = useState(false);
  const [isTalkingReady, setIsTalkingReady] = useState(false);
  const [idleAnimationsInitialized, setIdleAnimationsInitialized] = useState(false);
  const [talkingAnimationsInitialized, setTalkingAnimationsInitialized] = useState(false);
  const audioAnalyzer = useRef(new AudioAnalyzer());
  const blinkTimer = useRef(null);
  const expressionTimer = useRef(null);
  const lastExpression = useRef('neutral');
  const frameCount = useRef(0);
  
  // Preload both models to eliminate loading delays
  const idleModel = useGLTF('/models/Idle.glb');
  const talkingModel = useGLTF('/models/Talking.glb');
  
  // Get animations for both models
  const idleAnimations = useAnimations(idleModel.animations, group);
  const talkingAnimations = useAnimations(talkingModel.animations, group);
  
  // Current model and animations based on isTalking state
  const currentModel = React.useMemo(() => {
    return isTalking ? talkingModel : idleModel;
  }, [isTalking, idleModel, talkingModel]);
  
  const { scene, animations } = currentModel;
  const { actions, mixer } = isTalking ? talkingAnimations : idleAnimations;
  
  // Track when models are ready
  useEffect(() => {
    if (idleModel.scene) {
      setIsIdleReady(true);
      console.log('Idle model loaded and ready');
    }
  }, [idleModel.scene]);
  
  useEffect(() => {
    if (talkingModel.scene) {
      setIsTalkingReady(true);
      console.log('Talking model loaded and ready');
    }
  }, [talkingModel.scene]);
  
  // Only log when model actually changes (reduce console spam)
  React.useEffect(() => {
    const modelName = isTalking ? 'Talking' : 'Idle';
    console.log(`Switching to ${modelName} model`);
  }, [isTalking]);// Initialize audio analyzer once
  useEffect(() => {
    if (lipSyncEnabled) {
      audioAnalyzer.current.initialize();
    }
    
    return () => {
      audioAnalyzer.current.cleanup();
    };
  }, [lipSyncEnabled]);

  // Connect audio element for lip-sync
  useEffect(() => {
    if (lipSyncEnabled && audioElement && audioAnalyzer.current.audioContext) {
      audioAnalyzer.current.connectAudio(audioElement);
    }
  }, [lipSyncEnabled, audioElement]);

  // Optimized expression handling - only update when expression actually changes
  useEffect(() => {
    if (lastExpression.current !== expression) {
      console.log(`Expression changed from ${lastExpression.current} to ${expression}`);
      lastExpression.current = expression;
      setCurrentExpression(expression);
      
      // Clear any existing expression timer
      if (expressionTimer.current) {
        clearTimeout(expressionTimer.current);
      }

      // Auto-return to neutral after certain expressions
      if (['smile', 'frown', 'surprise'].includes(expression)) {
        expressionTimer.current = setTimeout(() => {
          setCurrentExpression('neutral');
        }, 3000);
      }
    }

    return () => {
      if (expressionTimer.current) {
        clearTimeout(expressionTimer.current);
      }
    };
  }, [expression]);
  // Automatic blinking - only initialize once
  useEffect(() => {
    const startBlinking = () => {
      const blink = () => {
        if (Math.random() < 0.3) { // 30% chance to blink
          setCurrentExpression('blink');
          setTimeout(() => {
            setCurrentExpression(prev => prev === 'blink' ? 'neutral' : prev);
          }, 150);
        }
        
        blinkTimer.current = setTimeout(blink, 2000 + Math.random() * 3000);
      };
      
      blink();
    };

    startBlinking();

    return () => {
      if (blinkTimer.current) {
        clearTimeout(blinkTimer.current);
      }
    };
  }, []); // Only run once  // Initialize animations only once per model
  useEffect(() => {
    if (!scene || !actions || Object.keys(actions).length === 0) {
      return;
    }

    const modelName = isTalking ? 'Talking' : 'Idle';
    const isAnimationsInitialized = isTalking ? talkingAnimationsInitialized : idleAnimationsInitialized;
    
    if (isAnimationsInitialized) {
      return; // Animations already initialized for this model
    }

    console.log(`Initializing animations for ${modelName} model`);
    
    const actionNames = Object.keys(actions);
    console.log(`Available animations:`, actionNames);
    
    // Stop all previous actions before initializing new ones
    if (mixer) {
      mixer.stopAllAction();
    }
    
    actionNames.forEach(actionName => {
      const action = actions[actionName];
      if (action) {
        action.reset();
        action.setEffectiveWeight(1.0);
        action.play();
        action.setLoop(THREE.LoopRepeat);
      }
    });

    // Mark animations as initialized for this model
    if (isTalking) {
      setTalkingAnimationsInitialized(true);
    } else {
      setIdleAnimationsInitialized(true);
    }

    console.log(`${modelName} model animations initialized`);
  }, [scene, actions, mixer, isTalking, idleAnimationsInitialized, talkingAnimationsInitialized]);

  // Memoize the facial expression application to prevent unnecessary updates
  const applyFacialExpression = useCallback((scene, expression) => {
    scene.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary) {
        const morphTargets = child.morphTargetDictionary;
        
        // Only log morph targets when debugging is needed (reduce spam)
        if (frameCount.current % 120 === 0) { // Log every 2 seconds at 60fps
          const modelName = isTalking ? 'Talking' : 'Idle';
          console.log(`Morph targets for ${modelName}:`, Object.keys(morphTargets).length);
        }
        
        // Reset all morphs first
        Object.keys(morphTargets).forEach(name => {
          const index = morphTargets[name];
          if (child.morphTargetInfluences && child.morphTargetInfluences[index] !== undefined) {
            child.morphTargetInfluences[index] = 0;
          }
        });

        // Apply expression-specific morphs
        const expressionMorphs = {
          'smile': { 'smile': 0.8, 'eyeSquintLeft': 0.3, 'eyeSquintRight': 0.3 },
          'frown': { 'frown': 0.7, 'browDownLeft': 0.5, 'browDownRight': 0.5 },
          'surprise': { 'eyeWideLeft': 0.8, 'eyeWideRight': 0.8, 'jawOpen': 0.4 },
          'blink': { 'eyeBlinkLeft': 1.0, 'eyeBlinkRight': 1.0 },
          'neutral': {}
        };

        const morphsToApply = expressionMorphs[expression] || {};
        
        Object.entries(morphsToApply).forEach(([morphName, intensity]) => {
          const index = morphTargets[morphName];
          if (index !== undefined && child.morphTargetInfluences) {
            child.morphTargetInfluences[index] = intensity;
          }
        });
      }
    });
  }, [isTalking]);

  // Apply expression changes only when necessary
  useEffect(() => {
    if (scene && (isIdleReady || isTalkingReady)) {
      applyFacialExpression(scene, currentExpression);
    }
  }, [scene, currentExpression, isIdleReady, isTalkingReady, applyFacialExpression]);
  // Memoize animation weight calculation
  const getAnimationWeight = useCallback((animationName, expression, talking) => {
    const baseWeight = talking ? 1.0 : 0.8;
    
    const expressionModifiers = {
      'smile': { 'happy': 1.2, 'default': 0.9 },
      'frown': { 'sad': 1.2, 'default': 0.7 },
      'surprise': { 'default': 1.1 },
      'neutral': { 'default': 1.0 },
      'blink': { 'blink': 1.0, 'default': 0.3 }
    };

    const modifier = expressionModifiers[expression]?.[animationName] || 
                    expressionModifiers[expression]?.['default'] || 1.0;

    return Math.min(baseWeight * modifier, 1.0);
  }, []);
  // Update animation weights efficiently
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) {
      return;
    }

    Object.entries(actions).forEach(([actionName, action]) => {
      if (action) {
        const weight = getAnimationWeight(actionName, currentExpression, isTalking);
        action.setEffectiveWeight(weight);
      }
    });
  }, [actions, currentExpression, isTalking, getAnimationWeight]);

  // Optimized frame-based updates with reduced frequency
  useFrame(() => {
    frameCount.current++;
    
    if (lipSyncEnabled && audioAnalyzer.current.analyser) {
      const data = audioAnalyzer.current.getVolumeData();
      
      // Only update state if there's significant change
      if (Math.abs(data.volume - lipSyncData.volume) > 0.05) {
        setLipSyncData(data);
      }
      
      // Apply lip-sync morphs directly without state updates
      if (scene && data.volume > 0.1) {
        applyLipSyncMorphs(scene, data);
      }
    }
  });  // Memoized lip-sync morph application
  const applyLipSyncMorphs = useCallback((scene, audioData) => {
    scene.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary) {
        const morphTargets = child.morphTargetDictionary;
        const { volume, frequency } = audioData;

        // Basic phoneme mapping based on frequency ranges
        let mouthMorph = 'mouthClose';
        let intensity = Math.min(volume * 2, 1.0);

        if (frequency < 500) {
          mouthMorph = 'mouthFunnel';
        } else if (frequency < 1000) {
          mouthMorph = 'mouthSmile';
        } else if (frequency < 2000) {
          mouthMorph = 'mouthPucker';
        } else {
          mouthMorph = 'mouthOpen';
        }

        // Apply mouth morph
        const morphIndex = morphTargets[mouthMorph];
        if (morphIndex !== undefined && child.morphTargetInfluences) {
          child.morphTargetInfluences[morphIndex] = intensity;
        }

        // Add jaw movement for volume
        const jawIndex = morphTargets['jawOpen'];
        if (jawIndex !== undefined && child.morphTargetInfluences) {
          child.morphTargetInfluences[jawIndex] = Math.min(volume * 0.5, 0.3);
        }
      }
    });
  }, []);  // Optimized render with consistent scaling and positioning
  if (!scene) {
    return null;
  }

  const scale = [2, 2, 2];
  const position = [0, -1.8, 0];
  
  return (
    <group ref={group} {...props} key={`avatar-${isTalking ? 'talking' : 'idle'}`}>
      <primitive 
        object={scene} 
        scale={scale}
        position={position}
        rotation={[0, 0, 0]}
        userData={{ locked: true }}
      />
    </group>
  );
}

// Memoize the AnimatedModel to prevent unnecessary re-renders
const MemoizedAnimatedModel = React.memo(AnimatedModel);

// Main Avatar component with enhanced props for expressions and lip-sync
const Avatar = React.memo(({ 
  isTalking = false, 
  expression = 'neutral',
  audioElement = null,
  lipSyncEnabled = false 
}) => {
  const [error, setError] = useState(null);

  // Memoize error handler
  const handleError = useCallback((error) => {
    console.error('Canvas error:', error);
    setError(error);
  }, []);

  // Memoize retry handler
  const handleRetry = useCallback(() => {
    setError(null);
  }, []);
  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-xl mb-2">Avatar Loading Error</div>
          <div className="text-sm text-gray-400">{error.message}</div>
          <button 
            onClick={handleRetry} 
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      style={{ 
        userSelect: 'none', 
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      <Canvas
        onError={handleError}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 1, 5], fov: 50, near: 0.1, far: 100 }}
        style={{ background: 'transparent' }}
        resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
        performance={{ min: 0.5 }}
        dpr={[1, 2]}
      >
        {/* Optimized lighting setup */}
        <ambientLight intensity={1.0} />
        <directionalLight position={[3, 4, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-3, -2, -5]} intensity={0.7} />
        <pointLight position={[0, 4, 3]} intensity={1.0} color="#ffffff" />
        <spotLight position={[0, 6, 2]} intensity={0.8} angle={0.4} penumbra={1} />
        <hemisphereLight skyColor="#ffffff" groundColor="#444444" intensity={0.5} />

        {/* Memoized model component with Suspense fallback */}
        <Suspense fallback={<LoadingFallback />}>
          <MemoizedAnimatedModel 
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

// Add display name for debugging
Avatar.displayName = 'Avatar';

export default Avatar;
