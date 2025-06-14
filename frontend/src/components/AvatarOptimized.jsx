import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, PerspectiveCamera, Html, OrbitControls, TransformControls } from '@react-three/drei';
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

// AnimatedModel component with interactive positioning and real-time tracking
const AnimatedModel = React.memo(({ 
  isTalking, 
  expression = 'neutral', 
  audioElement = null,
  lipSyncEnabled = false,
  onTransformChange = null,
  ...props 
}) => {
  const group = useRef();
  const [currentExpression, setCurrentExpression] = useState('neutral');
  const [lipSyncData, setLipSyncData] = useState({ volume: 0, frequency: 0 });
  const [avatarTransform, setAvatarTransform] = useState({
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1]
  });
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
  console.log('🎬 Talking animations loaded:', talkingAnimationFile?.animations?.length || 0);
  
  // Debug: Log model's initial transform and inspect structure
  console.log('🧭 Model initial rotation:', avatarModel.scene.rotation);
  console.log('📍 Model initial position:', avatarModel.scene.position);
  console.log('📏 Model initial scale:', avatarModel.scene.scale);
  
  // Debug: Inspect model structure to understand orientation
  console.log('🔍 Model children:', avatarModel.scene.children.map(child => ({
    name: child.name,
    type: child.type,
    position: child.position.toArray(),
    rotation: child.rotation.toArray()
  })));
  
  // Find head/face bones to understand forward direction
  avatarModel.scene.traverse((child) => {
    if (child.name && (
      child.name.toLowerCase().includes('head') ||
      child.name.toLowerCase().includes('face') ||
      child.name.toLowerCase().includes('eye')
    )) {
      console.log(`👤 Found face/head bone "${child.name}":`, {
        position: child.position.toArray(),
        rotation: child.rotation.toArray(),
        worldPosition: child.getWorldPosition(new THREE.Vector3()).toArray()
      });
    }
  });// Sanitize animation clips to remove only problematic root transform tracks
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
      // Log transform BEFORE forced reset
      console.log('🔍 Transform BEFORE animation reset:', {
        position: avatarModel.scene.position.toArray(),
        rotation: avatarModel.scene.rotation.toArray(),
        scale: avatarModel.scene.scale.toArray()
      });      // Reset model to local coordinates (critical for proper animation alignment)
      avatarModel.scene.position.set(0, 0, 0);    // Local position reset
      avatarModel.scene.rotation.set(0, 0, 0);    // Local rotation reset  
      avatarModel.scene.scale.set(1, 1, 1);       // Local scale reset
      
      // Note: Group wrapper handles global positioning and axis correction
      
      // Log transform AFTER forced reset
      console.log('🔧 Transform AFTER forced reset:', {
        position: avatarModel.scene.position.toArray(),
        rotation: avatarModel.scene.rotation.toArray(),
        scale: avatarModel.scene.scale.toArray()
      });
      
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
        // Log transform AFTER animation starts
      setTimeout(() => {
        console.log('🎭 Transform AFTER animation starts:', {
          position: avatarModel.scene.position.toArray(),
          rotation: avatarModel.scene.rotation.toArray(),
          scale: avatarModel.scene.scale.toArray()
        });
        
        // Debug: Check forward direction vector
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(avatarModel.scene.quaternion);
        console.log('🧭 Model forward direction:', forward.toArray());
        console.log('✅ Expected forward: [0, 0, -1] or [0, 0, 1]');
      }, 100);
      
      animationsReady.current = true;
    } else {
      console.warn('❌ No suitable animations found');
    }

  }, [isTalking, actions, mixer]);  // Animation frame update
  useFrame((state, delta) => {    // Only enforce camera position if OrbitControls are disabled
    if (state.camera && !AVATAR_CONFIG.DEV.ENABLE_ORBIT_CONTROLS) {
      const targetPosition = AVATAR_CONFIG.MODEL.CAMERA.position;
      state.camera.position.set(targetPosition[0], targetPosition[1], targetPosition[2]);
      state.camera.lookAt(0, 0, 0);  // Look at center, not feet
      state.camera.updateProjectionMatrix();
    }
    
    // Update animation mixer
    if (mixer) {
      mixer.update(delta);
      
      if (frameCount.current % 60 === 0) {
        console.log(`🔄 Mixer updating - delta: ${delta.toFixed(3)}s, time: ${mixer.time.toFixed(2)}s`);
      }    }
    
    frameCount.current++;
    
    // Track avatar transform changes (every 10 frames to avoid excessive updates)
    if (group.current && frameCount.current % 10 === 0) {
      const pos = group.current.position;
      const rot = group.current.rotation;
      const scale = group.current.scale;
      
      const newTransform = {
        position: [pos.x.toFixed(2), pos.y.toFixed(2), pos.z.toFixed(2)],
        rotation: [
          THREE.MathUtils.radToDeg(rot.x).toFixed(1), 
          THREE.MathUtils.radToDeg(rot.y).toFixed(1), 
          THREE.MathUtils.radToDeg(rot.z).toFixed(1)
        ],
        scale: [scale.x.toFixed(2), scale.y.toFixed(2), scale.z.toFixed(2)]
      };
      
      setAvatarTransform(newTransform);
      
      // Callback for parent component
      if (onTransformChange) {
        onTransformChange(newTransform);
      }
    }

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
    };  }, []);  return (
    <group
      ref={group}
      position={[0, -0.8, 0]}      // Slightly down to center torso/chest area
      scale={[1.2, 1.2, 1.2]}      // Moderate scale for better proportions
      rotation={[0, 0, 0]}         // No rotation - test default orientation first
      {...props}
    >
      <primitive object={avatarModel.scene} />
    </group>
  );
});

// Avatar Scene Component with interactive controls and real-time stats
const AvatarScene = React.memo(({ 
  isTalking, 
  expression, 
  audioElement, 
  lipSyncEnabled,
  className,
  showStats = true
}) => {
  const [error, setError] = useState(null);
  const [avatarTransform, setAvatarTransform] = useState({
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1]
  });
  const [transformMode, setTransformMode] = useState('translate'); // 'translate', 'rotate', 'scale'
  const [showTransformControls, setShowTransformControls] = useState(true);

  const handleError = useCallback((err) => {
    console.error('Avatar loading error:', err);
    setError(err);
  }, []);

  const handleTransformChange = useCallback((transform) => {
    setAvatarTransform(transform);
  }, []);

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <ErrorFallback error={error} />
      </div>
    );
  }
  return (
    <div className={className} style={{ margin: 0, padding: 0, overflow: 'hidden', position: 'relative' }}>      {/* Real-time Avatar Stats Panel */}
      {showStats && AVATAR_CONFIG.DEV.ENABLE_ORBIT_CONTROLS && (
        <div className="absolute top-4 right-4 bg-black/80 text-white p-4 rounded-lg shadow-lg z-10 font-mono text-sm">
          <div className="text-green-400 font-bold mb-2">🎮 Avatar Transform</div>
          
          {/* Transform Mode Controls */}
          <div className="mb-3 pb-3 border-b border-gray-600">
            <div className="text-orange-300 font-semibold mb-2">🔧 Transform Mode:</div>
            <div className="flex gap-1">
              <button
                onClick={() => setTransformMode('translate')}
                className={`px-2 py-1 text-xs rounded ${
                  transformMode === 'translate' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                Move
              </button>
              <button
                onClick={() => setTransformMode('rotate')}
                className={`px-2 py-1 text-xs rounded ${
                  transformMode === 'rotate' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                Rotate
              </button>
              <button
                onClick={() => setTransformMode('scale')}
                className={`px-2 py-1 text-xs rounded ${
                  transformMode === 'scale' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                Scale
              </button>
            </div>
            <div className="mt-2">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={showTransformControls}
                  onChange={(e) => setShowTransformControls(e.target.checked)}
                  className="rounded"
                />
                Show Gizmo
              </label>
            </div>
          </div>
          
          <div className="mb-3">
            <div className="text-blue-300 font-semibold">📍 Position:</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>X: {avatarTransform.position[0]}</div>
              <div>Y: {avatarTransform.position[1]}</div>
              <div>Z: {avatarTransform.position[2]}</div>
            </div>
          </div>
          
          <div className="mb-3">
            <div className="text-purple-300 font-semibold">🔄 Rotation (°):</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>X: {avatarTransform.rotation[0]}</div>
              <div>Y: {avatarTransform.rotation[1]}</div>
              <div>Z: {avatarTransform.rotation[2]}</div>
            </div>
          </div>
            <div className="mb-2">
            <div className="text-yellow-300 font-semibold">📏 Scale:</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>X: {avatarTransform.scale[0]}</div>
              <div>Y: {avatarTransform.scale[1]}</div>
              <div>Z: {avatarTransform.scale[2]}</div>
            </div>
          </div>
          
          <div className="mb-2">
            <div className="text-cyan-300 font-semibold">📷 Camera:</div>
            <div className="text-xs text-gray-300">
              Pos: [{AVATAR_CONFIG.MODEL.CAMERA.position.join(', ')}]<br/>
              FOV: {AVATAR_CONFIG.MODEL.CAMERA.fov}°
            </div>
          </div>
            <div className="text-xs text-gray-400 mt-3 border-t border-gray-600 pt-2">            💡 Click gizmo to move avatar<br/>
            🖱️ <strong>Left drag</strong> = rotate camera<br/>
            🖱️ <strong>Right drag</strong> = pan camera<br/>
            �️ <strong>Scroll</strong> = zoom camera<br/>
            🔍 Check console for model logs
          </div>
        </div>
      )}
      
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
        />        <pointLight 
          position={AVATAR_CONFIG.MODEL.LIGHTING.point.position} 
          intensity={AVATAR_CONFIG.MODEL.LIGHTING.point.intensity} 
        />
        
        {/* Interactive Camera Controls */}
        {AVATAR_CONFIG.DEV.ENABLE_ORBIT_CONTROLS && (
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            zoomSpeed={0.5}
            panSpeed={0.5}
            rotateSpeed={0.5}
            minDistance={1}
            maxDistance={10}
          />
        )}        <Suspense fallback={<LoadingFallback />}>
          {AVATAR_CONFIG.DEV.ENABLE_ORBIT_CONTROLS && showTransformControls ? (
            <TransformControls
              mode={transformMode}
              showX={true}
              showY={true}
              showZ={true}
              enabled={true}
              size={1}
              space="world"
            >
              <AnimatedModel
                isTalking={isTalking}
                expression={expression}
                audioElement={audioElement}
                lipSyncEnabled={lipSyncEnabled}
                onTransformChange={handleTransformChange}
              />
            </TransformControls>
          ) : (
            <AnimatedModel
              isTalking={isTalking}
              expression={expression}
              audioElement={audioElement}
              lipSyncEnabled={lipSyncEnabled}
              onTransformChange={handleTransformChange}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
});

// Main Avatar Component with interactive controls
const Avatar = React.memo(({ 
  isTalking = false, 
  expression = 'neutral',
  audioElement = null,
  lipSyncEnabled = false,
  showStats = true,
  className = "w-full h-full"
}) => {
  return (
    <AvatarScene
      isTalking={isTalking}
      expression={expression}
      audioElement={audioElement}
      lipSyncEnabled={lipSyncEnabled}
      showStats={showStats}
      className={className}
    />
  );
});

export default Avatar;