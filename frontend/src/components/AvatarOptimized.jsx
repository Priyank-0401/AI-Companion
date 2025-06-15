import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, PerspectiveCamera } from '@react-three/drei';
import { AVATAR_CONFIG } from '../config/avatarConfig';
import { useAvatarExpressions } from '../hooks/useAvatarExpressions';
import { useAvatarVoice } from '../hooks/useAvatarVoice';

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

// Main Avatar Model Component - Clean and focused with voice integration
const AvatarModel = React.memo(({ isTalking = false, lastMessage = '', voiceEnabled = true, selectedVoice = null, onVoiceEnd = null, onError }) => {
  // Load models
  const avatarModel = useGLTF(AVATAR_CONFIG.MODELS.AVATAR);
  const idleFile = useGLTF(AVATAR_CONFIG.MODELS.IDLE);
  const talkingFile = useGLTF(AVATAR_CONFIG.MODELS.TALKING);
  // Refs
  const groupRef = useRef();
  const lastAnimationRef = useRef(null);
  const morphTargetRefs = useRef({});
  const animationBufferRef = useRef(null);
  const loopTimeoutRef = useRef(null);
  // Expression system - handles blinking and facial expressions
  const { currentExpression, isBlinking } = useAvatarExpressions(
    isTalking, 
    lastMessage, 
    {
      enableAutoExpression: AVATAR_CONFIG.EXPRESSIONS.ENABLE_AUTO_EXPRESSIONS,
      enableBlinking: AVATAR_CONFIG.EXPRESSIONS.ENABLE_BLINKING,
      expressionDuration: AVATAR_CONFIG.EXPRESSIONS.EXPRESSION_DURATION,
      blinkInterval: AVATAR_CONFIG.EXPRESSIONS.BLINK_INTERVAL,
    }
  );
  // Voice system - handles speech synthesis for avatar responses
  const {
    isSpeaking,
    speak,
    stopSpeaking,
    availableVoices
  } = useAvatarVoice({
    enabled: voiceEnabled,
    selectedVoice: selectedVoice
  });
  // Prepare animations with clear naming
  const animations = React.useMemo(() => {
    const allAnimations = [];
    
    // Process idle animations
    if (idleFile?.animations && idleFile.animations.length > 0) {
      idleFile.animations.forEach((clip, index) => {
        const namedClip = clip.clone();
        namedClip.name = `${AVATAR_CONFIG.ANIMATIONS.NAMES.IDLE}_${index}`;
        allAnimations.push(namedClip);
      });
    }

    // Process talking animations
    if (talkingFile?.animations && talkingFile.animations.length > 0) {
      talkingFile.animations.forEach((clip, index) => {
        const namedClip = clip.clone();
        namedClip.name = `${AVATAR_CONFIG.ANIMATIONS.NAMES.TALKING}_${index}`;
        allAnimations.push(namedClip);
      });
    }

    return allAnimations;
  }, [idleFile, talkingFile]);

  // Animation system - ONLY use animations, ignore Mixamo geometry
  const { actions, mixer } = useAnimations(animations, avatarModel.scene);  // Hide all Mixamo geometry to prevent conflicts + Verify head mesh visibility
  useEffect(() => {
    // Hide idle file geometry
    if (idleFile?.scene) {
      idleFile.scene.traverse((child) => {
        if (child.isMesh) {
          child.visible = false;
        }
      });
    }

    // Hide talking file geometry
    if (talkingFile?.scene) {
      talkingFile.scene.traverse((child) => {
        if (child.isMesh) {
          child.visible = false;
        }
      });
    }

    // ✅ Step 2: Verify head mesh exists and is visible
    if (avatarModel?.scene) {
      avatarModel.scene.traverse((child) => {
        if (child.isMesh && child.name.toLowerCase().includes('head')) {
          // Ensure head is visible
          child.visible = true;
          if (child.material) {
            child.material.visible = true;
            child.material.transparent = false;
            child.material.opacity = 1;
          }
        }      });    }

  }, [idleFile, talkingFile, avatarModel]);
  // Setup morph targets for expressions and blinking
  useEffect(() => {
    if (!avatarModel?.scene) return;

    const morphTargets = {};
    
    // Find meshes with morph targets (typically head/face meshes)
    avatarModel.scene.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        // Store reference to morph target influences
        morphTargets[child.name] = {
          dictionary: child.morphTargetDictionary,
          influences: child.morphTargetInfluences
        };
      }
    });

    morphTargetRefs.current = morphTargets;
  }, [avatarModel]);// Apply blinking and expressions via morph targets
  useEffect(() => {
    const morphTargets = morphTargetRefs.current;
    
    Object.keys(morphTargets).forEach(meshName => {
      const { dictionary, influences } = morphTargets[meshName];
      
      // Handle blinking
      if (isBlinking || currentExpression === 'blink') {
        console.log(`👁️ Applying blink to mesh: ${meshName}`);
        
        // Try different possible eye blink morph target names
        const blinkTargets = [
          AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.EYE_BLINK_LEFT,
          AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.EYE_BLINK_RIGHT,
          AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.EYE_BLINK,
          'eyeBlinkLeft', 'eyeBlinkRight', 'eyesClosed', 'blink'
        ];
        
        let blinkApplied = false;
        blinkTargets.forEach(targetName => {
          if (dictionary[targetName] !== undefined) {
            const targetIndex = dictionary[targetName];
            influences[targetIndex] = 1.0; // Fully close eyes
            console.log(`👁️ Applied blink to target: ${targetName} (index: ${targetIndex})`);
            blinkApplied = true;
          }
        });
        
        if (!blinkApplied) {
          console.warn('👁️ No blink morph targets found in dictionary:', Object.keys(dictionary));
        }
      } else {
        // Reset eye blink targets
        const blinkTargets = [
          AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.EYE_BLINK_LEFT,
          AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.EYE_BLINK_RIGHT,
          AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.EYE_BLINK,
          'eyeBlinkLeft', 'eyeBlinkRight', 'eyesClosed', 'blink'
        ];
        
        blinkTargets.forEach(targetName => {
          if (dictionary[targetName] !== undefined) {
            const targetIndex = dictionary[targetName];
            influences[targetIndex] = 0.0; // Open eyes
          }
        });
      }      // Handle other expressions
      if (currentExpression === 'smile') {
        if (dictionary[AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.MOUTH_SMILE] !== undefined) {
          const targetIndex = dictionary[AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.MOUTH_SMILE];
          influences[targetIndex] = 0.7;
          console.log('😊 Applied smile expression');
        }
      } else if (currentExpression === 'frown') {
        if (dictionary[AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.MOUTH_FROWN] !== undefined) {
          const targetIndex = dictionary[AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.MOUTH_FROWN];
          influences[targetIndex] = 0.7;
        }
      } else if (currentExpression === 'neutral' && !isBlinking) {
        // Reset all expression morph targets to neutral
        Object.keys(dictionary).forEach(morphName => {
          if (!morphName.toLowerCase().includes('blink') && !morphName.toLowerCase().includes('eye')) {
            const targetIndex = dictionary[morphName];
            influences[targetIndex] = 0.0;
          }        });
      }
    });
  }, [isBlinking, currentExpression]);
  // Auto-speak new messages
  useEffect(() => {
    if (voiceEnabled && lastMessage && lastMessage.trim() && !isTalking) {
      // Delay speaking slightly to allow for visual transition
      const speakTimeout = setTimeout(() => {
        speak(lastMessage, {
          onStart: () => {
            // Avatar starts talking animation when voice starts
          },
          onEnd: () => {
            // Avatar returns to idle when voice ends
            // If this is a demo message (not the welcome message), turn off voice
            if (!lastMessage.includes('Seriva') || !lastMessage.includes('companion')) {
              onVoiceEnd?.(); // Call callback to disable voice
            }
          }
        });
      }, 500);

      return () => clearTimeout(speakTimeout);
    }
  }, [lastMessage, voiceEnabled, speak, isTalking, onVoiceEnd]);// Animation switching logic with continuous looping
  useEffect(() => {
    if (!actions || !mixer) {
      return;
    }

    const availableActions = Object.keys(actions);

    if (availableActions.length === 0) {
      return;
    }

    // Clear any existing loop timeout
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }

    // Determine if avatar should be talking (manual isTalking or voice speaking)
    const shouldBeTalking = isTalking || isSpeaking;

    // Determine target animation - use first animation of each type
    const targetAnimation = shouldBeTalking 
      ? `${AVATAR_CONFIG.ANIMATIONS.NAMES.TALKING}_0`
      : `${AVATAR_CONFIG.ANIMATIONS.NAMES.IDLE}_0`;    // Only switch if different from current
    if (lastAnimationRef.current !== targetAnimation) {
      // Stop current animation smoothly
      if (lastAnimationRef.current && actions[lastAnimationRef.current]) {
        actions[lastAnimationRef.current].fadeOut(AVATAR_CONFIG.ANIMATIONS.FADE_DURATION);
      }

      // Start new animation with continuous looping
      if (actions[targetAnimation]) {
        const startAnimation = () => {
          const action = actions[targetAnimation];
          action.reset();
          
          // Set to loop only once for buffering control
          action.setLoop(false);
          
          // Set animation speed based on type
          const animationSpeed = shouldBeTalking 
            ? AVATAR_CONFIG.ANIMATIONS.SPEEDS.TALKING 
            : AVATAR_CONFIG.ANIMATIONS.SPEEDS.IDLE;
            action.setEffectiveTimeScale(animationSpeed);
          
          action.fadeIn(AVATAR_CONFIG.ANIMATIONS.FADE_DURATION);
          action.play();
          
          // Setup continuous looping with buffer
          if (AVATAR_CONFIG.ANIMATIONS.LOOP_SETTINGS.CONTINUOUS) {
            const setupNextLoop = () => {
              // Only continue looping if we're still in the same animation state
              if (lastAnimationRef.current === targetAnimation) {
                loopTimeoutRef.current = setTimeout(() => {
                  if (lastAnimationRef.current === targetAnimation && actions[targetAnimation]) {
                    startAnimation(); // Recursively restart the animation
                  }
                }, (action.getClip().duration / animationSpeed * 1000) + (AVATAR_CONFIG.ANIMATIONS.LOOP_SETTINGS.BUFFER_TIME * 1000));
              }
            };
            
            setupNextLoop();
          }
        };
        
        startAnimation();
        lastAnimationRef.current = targetAnimation;
      } else {
        // Fallback to first available
        const fallback = availableActions[0];
        if (fallback) {
          actions[fallback].reset().play();
          lastAnimationRef.current = fallback;
        }
      }
    }

    // Cleanup function
    return () => {
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;      }    };
  }, [isTalking, isSpeaking, actions, mixer]);// Animation frame updates
  useFrame(() => {
    if (mixer) {
      mixer.update(0.016); // ~60fps
    }
    
    // Apply jaw movement during talking (manual or voice-driven)
    const shouldMoveMouth = isTalking || isSpeaking;
    if (shouldMoveMouth) {
      const morphTargets = morphTargetRefs.current;
      Object.keys(morphTargets).forEach(meshName => {
        const { dictionary, influences } = morphTargets[meshName];
        
        if (dictionary[AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.MOUTH_OPEN] !== undefined) {
          const targetIndex = dictionary[AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.MOUTH_OPEN];
          // More pronounced jaw movement for testing
          const jawMovement = Math.sin(Date.now() * 0.01) * 0.5 + 0.5; // Oscillates between 0 and 1.0
          influences[targetIndex] = jawMovement;
        }
      });
    }
  });
  // Error handling
  useEffect(() => {
    if (!avatarModel?.scene) {
      const error = new Error('Failed to load avatar model');
      console.error('❌ Avatar loading error:', error);
      onError?.(error);
    }
  }, [avatarModel, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
      }
    };
  }, []);// ✅ Best Practice: Keep model upright, adjust camera instead of rotating avatar
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
const AvatarScene = React.memo(({ isTalking, lastMessage = '', voiceEnabled = true, selectedVoice = null, onVoiceEnd = null, className = "w-full h-full" }) => {
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
        />        {/* Avatar Model */}
        <Suspense fallback={null}>
          <AvatarModel
            isTalking={isTalking}
            lastMessage={lastMessage}
            voiceEnabled={voiceEnabled}
            selectedVoice={selectedVoice}
            onVoiceEnd={onVoiceEnd}
            onError={handleError}
          />
        </Suspense>
      </Canvas>
    </div>
  );
});

// Main Export Component - Simple interface with voice support
const Avatar = React.memo(({ 
  isTalking = false,
  lastMessage = '',
  voiceEnabled = true,
  selectedVoice = null,
  onVoiceEnd = null,
  className = "w-full h-full"
}) => {
  return (
    <AvatarScene
      isTalking={isTalking}
      lastMessage={lastMessage}
      voiceEnabled={voiceEnabled}
      selectedVoice={selectedVoice}
      onVoiceEnd={onVoiceEnd}
      className={className}
    />
  );
});

export default Avatar;
