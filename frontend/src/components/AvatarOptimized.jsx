import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, PerspectiveCamera } from '@react-three/drei';
import { AVATAR_CONFIG } from '../config/avatarConfig';

// Preload all model files for better performance
useGLTF.preload(AVATAR_CONFIG.MODELS.AVATAR);
useGLTF.preload(AVATAR_CONFIG.MODELS.IDLE);
useGLTF.preload(AVATAR_CONFIG.MODELS.TALKING);

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <div className="text-lg">Loading Avatar...</div>
      </div>
    </div>
  );
}

// Error boundary component
function ErrorFallback({ error }) {
  return (
    <div className="flex items-center justify-center h-full bg-gray-900 text-red-400">
      <div className="text-center">
        <div className="text-lg mb-2">Avatar Loading Error</div>
        <div className="text-sm opacity-70">{error?.message || 'Unknown error'}</div>
      </div>
    </div>
  );
}

// Main Avatar Model Component - Clean and focused
const AvatarModel = React.memo(({ isTalking = false, onError }) => {
  // Load models
  const avatarModel = useGLTF(AVATAR_CONFIG.MODELS.AVATAR);
  const idleFile = useGLTF(AVATAR_CONFIG.MODELS.IDLE);
  const talkingFile = useGLTF(AVATAR_CONFIG.MODELS.TALKING);

  // Refs
  const groupRef = useRef();
  const lastAnimationRef = useRef(null);

  // Prepare animations with clear naming
  const animations = React.useMemo(() => {
    const allAnimations = [];
    
    console.log('🎬 Processing animations...');
    console.log('Idle animations found:', idleFile?.animations?.length || 0);
    console.log('Talking animations found:', talkingFile?.animations?.length || 0);    // Process idle animations
    if (idleFile?.animations && idleFile.animations.length > 0) {
      idleFile.animations.forEach((clip, index) => {
        const namedClip = clip.clone();
        namedClip.name = `${AVATAR_CONFIG.ANIMATIONS.NAMES.IDLE}_${index}`;
        allAnimations.push(namedClip);
        console.log('✅ Added idle animation:', namedClip.name);
      });
    }

    // Process talking animations
    if (talkingFile?.animations && talkingFile.animations.length > 0) {
      talkingFile.animations.forEach((clip, index) => {
        const namedClip = clip.clone();
        namedClip.name = `${AVATAR_CONFIG.ANIMATIONS.NAMES.TALKING}_${index}`;
        allAnimations.push(namedClip);
        console.log('✅ Added talking animation:', namedClip.name);
      });
    }

    console.log('🎭 Total animations processed:', allAnimations.length);
    return allAnimations;
  }, [idleFile, talkingFile]);

  // Animation system - ONLY use animations, ignore Mixamo geometry
  const { actions, mixer } = useAnimations(animations, avatarModel.scene);
  // Hide all Mixamo geometry to prevent conflicts + Verify head mesh visibility
  useEffect(() => {
    // Hide idle file geometry
    if (idleFile?.scene) {
      idleFile.scene.traverse((child) => {
        if (child.isMesh) {
          child.visible = false;
          console.log('🚫 Hidden Idle mesh:', child.name);
        }
      });
    }

    // Hide talking file geometry
    if (talkingFile?.scene) {
      talkingFile.scene.traverse((child) => {
        if (child.isMesh) {
          child.visible = false;
          console.log('🚫 Hidden Talking mesh:', child.name);
        }
      });
    }

    // ✅ Step 2: Verify head mesh exists and is visible
    if (avatarModel?.scene) {
      console.log('🔍 Scanning for head mesh...');
      avatarModel.scene.traverse((child) => {
        if (child.isMesh && child.name.toLowerCase().includes('head')) {
          console.log("🧠 Head found:", child.name, "visible:", child.visible);
          
          // Ensure head is visible
          child.visible = true;
          if (child.material) {
            child.material.visible = true;
            child.material.transparent = false;
            child.material.opacity = 1;
            console.log("✅ Head visibility fixed:", child.name);
          }
        }
      });
    }

    console.log('✅ All Mixamo geometry hidden - only animations will be used');
  }, [idleFile, talkingFile, avatarModel]);

  // Animation switching logic
  useEffect(() => {
    if (!actions || !mixer) {
      console.log('⏳ Waiting for animations to initialize...');
      return;
    }

    const availableActions = Object.keys(actions);
    console.log('🎭 Available actions:', availableActions);

    if (availableActions.length === 0) {
      console.warn('❌ No actions available');
      return;
    }    // Determine target animation - use first animation of each type
    const targetAnimation = isTalking 
      ? `${AVATAR_CONFIG.ANIMATIONS.NAMES.TALKING}_0`
      : `${AVATAR_CONFIG.ANIMATIONS.NAMES.IDLE}_0`;

    console.log(`🎯 Target animation: ${targetAnimation} (isTalking: ${isTalking})`);

    // Only switch if different from current
    if (lastAnimationRef.current !== targetAnimation) {
      // Stop current animation
      if (lastAnimationRef.current && actions[lastAnimationRef.current]) {
        console.log(`⏹️ Stopping: ${lastAnimationRef.current}`);
        actions[lastAnimationRef.current].fadeOut(AVATAR_CONFIG.ANIMATIONS.FADE_DURATION);
      }

      // Start new animation
      if (actions[targetAnimation]) {
        console.log(`▶️ Starting: ${targetAnimation}`);
        const action = actions[targetAnimation];
        action.reset();
        action.setLoop(true);
        action.fadeIn(AVATAR_CONFIG.ANIMATIONS.FADE_DURATION);
        action.play();
        
        lastAnimationRef.current = targetAnimation;
      } else {
        console.warn(`❌ Animation "${targetAnimation}" not found`);
        
        // Fallback to first available
        const fallback = availableActions[0];
        if (fallback) {
          console.log(`🔄 Using fallback: ${fallback}`);
          actions[fallback].reset().play();
          lastAnimationRef.current = fallback;
        }
      }
    }
  }, [isTalking, actions, mixer]);

  // Animation frame updates
  useFrame(() => {
    if (mixer) {
      mixer.update(0.016); // ~60fps
    }
  });

  // Error handling
  useEffect(() => {
    if (!avatarModel?.scene) {
      const error = new Error('Failed to load avatar model');
      console.error('❌ Avatar loading error:', error);
      onError?.(error);
    }
  }, [avatarModel, onError]);  // ✅ Best Practice: Keep model upright, adjust camera instead of rotating avatar
  return (
    <group
      ref={groupRef}
      position={AVATAR_CONFIG.AVATAR.POSITION}
      scale={AVATAR_CONFIG.AVATAR.SCALE}
      rotation={AVATAR_CONFIG.AVATAR.ROTATION}
    >
      {/* Keep avatar upright - no destructive X-axis rotation */}
      <primitive object={avatarModel.scene} />
      {/* 
        ✅ IMPORTANT: 
        - avatarModel.scene = ReadyPlayerMe appearance kept upright
        - No rotation to avoid distorting skinned mesh
        - Camera positioned to look at head level instead
        - idleFile.scene & talkingFile.scene = NEVER rendered (hidden above)
        - Only animations from Mixamo files are applied to ReadyPlayerMe geometry
      */}
    </group>
  );
});

// Main Avatar Scene Component
const AvatarScene = React.memo(({ isTalking, className = "w-full h-full" }) => {
  const [error, setError] = useState(null);

  const handleError = (err) => {
    console.error('Avatar error:', err);
    setError(err);
  };

  if (error) {
    return <ErrorFallback error={error} />;
  }

  return (
    <div className={className}>
      <Canvas
        shadows={false}
        dpr={[1, 2]}
        frameloop="always"
        gl={{ antialias: true, alpha: false }}
      >        {/* Camera positioned at eye level looking at head */}
        <PerspectiveCamera 
          makeDefault
          position={AVATAR_CONFIG.CAMERA.POSITION}
          fov={AVATAR_CONFIG.CAMERA.FOV}
          near={AVATAR_CONFIG.CAMERA.NEAR}
          far={AVATAR_CONFIG.CAMERA.FAR}
          onUpdate={(camera) => {
            // Make camera look at head level
            camera.lookAt(...AVATAR_CONFIG.CAMERA.LOOK_AT);
          }}
        />

        {/* Lighting setup for optimal face visibility */}
        <ambientLight 
          intensity={AVATAR_CONFIG.LIGHTING.AMBIENT.INTENSITY}
          color={AVATAR_CONFIG.LIGHTING.AMBIENT.COLOR}
        />
        <directionalLight 
          position={AVATAR_CONFIG.LIGHTING.DIRECTIONAL.POSITION}
          intensity={AVATAR_CONFIG.LIGHTING.DIRECTIONAL.INTENSITY}
          color={AVATAR_CONFIG.LIGHTING.DIRECTIONAL.COLOR}
          castShadow={false}
        />
        <pointLight 
          position={AVATAR_CONFIG.LIGHTING.POINT.POSITION}
          intensity={AVATAR_CONFIG.LIGHTING.POINT.INTENSITY}
          color={AVATAR_CONFIG.LIGHTING.POINT.COLOR}
        />
        {/* Additional face lighting */}
        <pointLight 
          position={AVATAR_CONFIG.LIGHTING.FACE_LIGHT.POSITION}
          intensity={AVATAR_CONFIG.LIGHTING.FACE_LIGHT.INTENSITY}
          color={AVATAR_CONFIG.LIGHTING.FACE_LIGHT.COLOR}
        />

        {/* Avatar Model */}
        <Suspense fallback={null}>
          <AvatarModel
            isTalking={isTalking}
            onError={handleError}
          />
        </Suspense>
      </Canvas>
    </div>
  );
});

// Main Export Component - Simple interface
const Avatar = React.memo(({ 
  isTalking = false,
  className = "w-full h-full"
}) => {
  return (
    <AvatarScene
      isTalking={isTalking}
      className={className}
    />
  );
});

export default Avatar;
