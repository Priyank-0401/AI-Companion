import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, PerspectiveCamera } from '@react-three/drei';
import { AVATAR_CONFIG } from '../config/avatarConfig';
import { useAvatarExpressions } from '../hooks/useAvatarExpressions';
import { useAvatarVoice } from '../hooks/useAvatarVoice';

// Preload all model files for better performance - INCLUDING GREET
useGLTF.preload(AVATAR_CONFIG.MODELS.AVATAR);
useGLTF.preload(AVATAR_CONFIG.MODELS.IDLE);
useGLTF.preload(AVATAR_CONFIG.MODELS.TALKING);
useGLTF.preload(AVATAR_CONFIG.MODELS.GREET); // NEW: Preload greeting animation

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

// Enhanced Avatar Model Component with Greeting Support
const AvatarModel = React.memo(({ 
  isTalking = false, 
  lastMessage = '', 
  voiceEnabled = true, 
  selectedVoice = null, 
  onVoiceEnd = null, 
  onError,
  avatarVolume = 0.8,
  volumeLipSyncRef = null,
  // NEW: Greeting props
  enableGreeting = true,
  onGreetingComplete = null
}) => {
  // Load models - INCLUDING GREET
  const avatarModel = useGLTF(AVATAR_CONFIG.MODELS.AVATAR);
  const idleFile = useGLTF(AVATAR_CONFIG.MODELS.IDLE);
  const talkingFile = useGLTF(AVATAR_CONFIG.MODELS.TALKING);
  const greetFile = useGLTF(AVATAR_CONFIG.MODELS.GREET); // NEW: Load greet model

  // Refs
  const groupRef = useRef();
  const lastAnimationRef = useRef(null);
  const morphTargetRefs = useRef({});
  const animationBufferRef = useRef(null);
  const loopTimeoutRef = useRef(null);

  // NEW: Greeting state management
  const [greetingState, setGreetingState] = useState({
    hasShownGreeting: false,        // Track if greeting has been shown
    isGreeting: false,              // Currently playing greeting animation
    greetingComplete: false,        // Greeting animation finished
    shouldSmile: false,             // Should show smile expression
  });

  // Enhanced expression system with greeting support
  const { currentExpression, isBlinking } = useAvatarExpressions(
    isTalking, 
    lastMessage, 
    {
      enableAutoExpression: AVATAR_CONFIG.EXPRESSIONS.ENABLE_AUTO_EXPRESSIONS,
      enableBlinking: AVATAR_CONFIG.EXPRESSIONS.ENABLE_BLINKING,
      expressionDuration: AVATAR_CONFIG.EXPRESSIONS.EXPRESSION_DURATION,
      blinkInterval: AVATAR_CONFIG.EXPRESSIONS.BLINK_INTERVAL,
      // NEW: Override expression during greeting
      forceExpression: greetingState.shouldSmile ? 'smile' : null,
    }
  );

  // Voice system
  const {
    isSpeaking,
    speak,
    stopSpeaking,
    availableVoices  
  } = useAvatarVoice({
    enabled: voiceEnabled,
    selectedVoice: selectedVoice,
    volume: avatarVolume
  });

  // Enhanced animations preparation - INCLUDING GREET
  const animations = React.useMemo(() => {
    const allAnimations = [];
    
    // Process greeting animations - FIRST PRIORITY
    if (greetFile?.animations && greetFile.animations.length > 0) {
      greetFile.animations.forEach((clip, index) => {
        const namedClip = clip.clone();
        namedClip.name = `${AVATAR_CONFIG.ANIMATIONS.NAMES.GREET}_${index}`;
        allAnimations.push(namedClip);
      });
    }

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
  }, [greetFile, idleFile, talkingFile]); // NEW: Include greetFile dependency

  // Animation system
  const { actions, mixer } = useAnimations(animations, avatarModel.scene);

  // Hide all animation model geometries - INCLUDING GREET
  useEffect(() => {
    // Hide greeting file geometry
    if (greetFile?.scene) {
      greetFile.scene.traverse((child) => {
        if (child.isMesh) {
          child.visible = false;
        }
      });
    }

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

    // Ensure avatar head is visible
    if (avatarModel?.scene) {
      avatarModel.scene.traverse((child) => {
        if (child.isMesh && child.name.toLowerCase().includes('head')) {
          child.visible = true;
          if (child.material) {
            child.material.visible = true;
            child.material.transparent = false;
            child.material.opacity = 1;
          }
        }
      });
    }
  }, [greetFile, idleFile, talkingFile, avatarModel]); // NEW: Include greetFile

  // Setup morph targets
  useEffect(() => {
    if (!avatarModel?.scene) return;

    const morphTargets = {};
    
    avatarModel.scene.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        morphTargets[child.name] = {
          dictionary: child.morphTargetDictionary,
          influences: child.morphTargetInfluences
        };
      }
    });

    morphTargetRefs.current = morphTargets;
  }, [avatarModel]);

  // NEW: Greeting initialization - Auto-trigger on mount
  useEffect(() => {
    if (!enableGreeting || !AVATAR_CONFIG.GREETING.ENABLED) return;
    if (greetingState.hasShownGreeting) return;

    console.log('🎉 Initializing greeting sequence...');

    const startGreeting = () => {
      setGreetingState(prev => ({
        ...prev,
        hasShownGreeting: true,
        isGreeting: true,
        shouldSmile: AVATAR_CONFIG.EXPRESSIONS.ENABLE_GREETING_SMILE,
      }));

      console.log('👋 Starting greeting animation with smile');
    };

    // Delay greeting start
    const greetingTimeout = setTimeout(startGreeting, AVATAR_CONFIG.GREETING.DELAY);

    return () => clearTimeout(greetingTimeout);
  }, [enableGreeting, greetingState.hasShownGreeting]);

  // NEW: Greeting completion handler
  useEffect(() => {
    if (!greetingState.isGreeting) return;

    const greetingDuration = AVATAR_CONFIG.GREETING.DURATION;
    
    const completeGreeting = () => {
      console.log('✅ Greeting animation complete, transitioning to idle');
      
      setGreetingState(prev => ({
        ...prev,
        isGreeting: false,
        greetingComplete: true,
        shouldSmile: false, // Stop smiling after greeting
      }));

      // Callback to parent component
      onGreetingComplete?.();
    };

    const completionTimeout = setTimeout(completeGreeting, greetingDuration);

    return () => clearTimeout(completionTimeout);
  }, [greetingState.isGreeting, onGreetingComplete]);

  // Enhanced expression application with greeting smile
  useEffect(() => {
    const morphTargets = morphTargetRefs.current;
    
    Object.keys(morphTargets).forEach(meshName => {
      const { dictionary, influences } = morphTargets[meshName];
      
      // Handle blinking
      if (isBlinking && !greetingState.shouldSmile) { // Don't blink during greeting smile
        const blinkTargets = [
          AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.EYE_BLINK_LEFT,
          AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.EYE_BLINK_RIGHT,
          AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.EYE_BLINK,
          'eyeBlinkLeft', 'eyeBlinkRight', 'eyesClosed', 'blink'
        ];
        
        blinkTargets.forEach(targetName => {
          if (dictionary[targetName] !== undefined) {
            const targetIndex = dictionary[targetName];
            influences[targetIndex] = 1.0;
          }
        });
      } else {
        // Reset blink targets
        const blinkTargets = [
          AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.EYE_BLINK_LEFT,
          AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.EYE_BLINK_RIGHT,
          AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.EYE_BLINK,
          'eyeBlinkLeft', 'eyeBlinkRight', 'eyesClosed', 'blink'
        ];
        
        blinkTargets.forEach(targetName => {
          if (dictionary[targetName] !== undefined) {
            const targetIndex = dictionary[targetName];
            influences[targetIndex] = 0.0;
          }
        });
      }

      // Handle expressions - PRIORITIZE GREETING SMILE
      if (greetingState.shouldSmile) {
        // Apply greeting smile
        if (dictionary[AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.MOUTH_SMILE] !== undefined) {
          const targetIndex = dictionary[AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.MOUTH_SMILE];
          influences[targetIndex] = AVATAR_CONFIG.GREETING.SMILE_INTENSITY;
          console.log(`😊 Applying greeting smile with intensity: ${AVATAR_CONFIG.GREETING.SMILE_INTENSITY}`);
        }
      } else if (currentExpression === 'smile') {
        if (dictionary[AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.MOUTH_SMILE] !== undefined) {
          const targetIndex = dictionary[AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.MOUTH_SMILE];
          influences[targetIndex] = 0.7;
        }
      } else if (currentExpression === 'frown') {
        if (dictionary[AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.MOUTH_FROWN] !== undefined) {
          const targetIndex = dictionary[AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.MOUTH_FROWN];
          influences[targetIndex] = 0.7;
        }
      } else if (currentExpression === 'neutral' && !isBlinking && !greetingState.shouldSmile) {
        // Reset all expression morph targets to neutral
        Object.keys(dictionary).forEach(morphName => {
          if (!morphName.toLowerCase().includes('blink') && !morphName.toLowerCase().includes('eye')) {
            const targetIndex = dictionary[morphName];
            influences[targetIndex] = 0.0;
          }
        });
      }
    });
  }, [isBlinking, currentExpression, greetingState.shouldSmile]);

  // Auto-speak new messages (unchanged)
  useEffect(() => {
    if (voiceEnabled && lastMessage && lastMessage.trim() && !isTalking) {
      const speakTimeout = setTimeout(() => {
        speak(lastMessage, {
          onStart: () => {},
          onEnd: () => {
            if (!lastMessage.includes('Seriva') || !lastMessage.includes('companion')) {
              onVoiceEnd?.();
            }
          }
        });
      }, 500);

      return () => clearTimeout(speakTimeout);
    }
  }, [lastMessage, voiceEnabled, speak, isTalking, onVoiceEnd]);

  // ENHANCED: Animation switching logic with greeting priority
  useEffect(() => {
    if (!actions || !mixer) return;

    const availableActions = Object.keys(actions);
    if (availableActions.length === 0) return;

    // Clear existing loop timeout
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }

    // DETERMINE TARGET ANIMATION WITH PRIORITY SYSTEM
    let targetAnimation;
    let shouldLoop = true;

    if (greetingState.isGreeting && !greetingState.greetingComplete) {
      // HIGHEST PRIORITY: Greeting animation
      targetAnimation = `${AVATAR_CONFIG.ANIMATIONS.NAMES.GREET}_0`;
      shouldLoop = false; // Greeting plays once only
      console.log('🎬 Switching to greeting animation');
    } else if (isTalking || isSpeaking) {
      // MEDIUM PRIORITY: Talking animation
      targetAnimation = `${AVATAR_CONFIG.ANIMATIONS.NAMES.TALKING}_0`;
      console.log('🗣️ Switching to talking animation');
    } else {
      // LOWEST PRIORITY: Idle animation
      targetAnimation = `${AVATAR_CONFIG.ANIMATIONS.NAMES.IDLE}_0`;
      console.log('😌 Switching to idle animation');
    }

    // Only switch if different from current
    if (lastAnimationRef.current !== targetAnimation) {
      // Stop current animation smoothly
      if (lastAnimationRef.current && actions[lastAnimationRef.current]) {
        actions[lastAnimationRef.current].fadeOut(AVATAR_CONFIG.ANIMATIONS.FADE_DURATION);
      }

      // Start new animation
      if (actions[targetAnimation]) {
        const startAnimation = () => {
          const action = actions[targetAnimation];
          action.reset();
          
          // Set loop mode based on animation type
          action.setLoop(shouldLoop);
          
          // Set animation speed
          const animationSpeed = greetingState.isGreeting 
            ? AVATAR_CONFIG.ANIMATIONS.SPEEDS.GREET
            : (isTalking || isSpeaking) 
              ? AVATAR_CONFIG.ANIMATIONS.SPEEDS.TALKING 
              : AVATAR_CONFIG.ANIMATIONS.SPEEDS.IDLE;
              
          action.setEffectiveTimeScale(animationSpeed);
          action.fadeIn(AVATAR_CONFIG.ANIMATIONS.FADE_DURATION);
          action.play();
          
          // Setup looping for non-greeting animations
          if (shouldLoop && AVATAR_CONFIG.ANIMATIONS.LOOP_SETTINGS.CONTINUOUS) {
            const setupNextLoop = () => {
              if (lastAnimationRef.current === targetAnimation) {
                loopTimeoutRef.current = setTimeout(() => {
                  if (lastAnimationRef.current === targetAnimation && actions[targetAnimation]) {
                    startAnimation();
                  }
                }, (action.getClip().duration / animationSpeed * 1000) + (AVATAR_CONFIG.ANIMATIONS.LOOP_SETTINGS.BUFFER_TIME * 1000));
              }
            };
            setupNextLoop();
          }
        };
        
        startAnimation();
        lastAnimationRef.current = targetAnimation;
      }
    }

    return () => {
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }
    };
  }, [greetingState.isGreeting, greetingState.greetingComplete, isTalking, isSpeaking, actions, mixer]);

  // Animation frame updates with volume-based lip sync (unchanged)
  useFrame(() => {
    if (mixer) {
      mixer.update(0.016);
    }
    
    // Volume-based lip sync integration
    const morphTargets = morphTargetRefs.current;
    Object.keys(morphTargets).forEach(meshName => {
      const { dictionary, influences } = morphTargets[meshName];
      
      if (dictionary[AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.MOUTH_OPEN] !== undefined) {
        const targetIndex = dictionary[AVATAR_CONFIG.EXPRESSIONS.MORPH_TARGETS.MOUTH_OPEN];
        
        if (volumeLipSyncRef?.current?.getVolumeValue && volumeLipSyncRef.current.isPlaying()) {
          const volumeValue = volumeLipSyncRef.current.getVolumeValue();
          if (volumeValue > 0) {
            influences[targetIndex] = Math.max(0, Math.min(1, volumeValue));
          } else {
            influences[targetIndex] = 0;
          }
        } else {
          const shouldMoveMouth = (isTalking || isSpeaking) && !greetingState.isGreeting;
          if (shouldMoveMouth) {
            const jawMovement = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            influences[targetIndex] = jawMovement;
          } else {
            influences[targetIndex] = 0;
          }
        }
      }
    });
  });

  // Error handling (unchanged)
  useEffect(() => {
    if (!avatarModel?.scene) {
      const error = new Error('Failed to load avatar model');
      console.error('❌ Avatar loading error:', error);
      onError?.(error);
    }
  }, [avatarModel, onError]);

  // Cleanup on unmount (unchanged)
  useEffect(() => {
    return () => {
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
      }
    };
  }, []);

  return (
    <group
      ref={groupRef}
      position={AVATAR_CONFIG.AVATAR.POSITION}
      scale={AVATAR_CONFIG.AVATAR.SCALE}
      rotation={AVATAR_CONFIG.AVATAR.ROTATION}
    >
      <primitive object={avatarModel.scene} />
    </group>
  );
});

// Enhanced Avatar Scene Component with Greeting Support
const AvatarScene = React.memo(({ 
  isTalking, 
  lastMessage = '', 
  voiceEnabled = true, 
  selectedVoice = null, 
  onVoiceEnd = null, 
  className = "w-full h-full",
  volumeLipSyncRef = null,
  // NEW: Greeting props
  enableGreeting = true,
  onGreetingComplete = null
}) => {
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
      >
        <PerspectiveCamera 
          makeDefault
          position={AVATAR_CONFIG.CAMERA.POSITION}
          fov={AVATAR_CONFIG.CAMERA.FOV}
          near={AVATAR_CONFIG.CAMERA.NEAR}
          far={AVATAR_CONFIG.CAMERA.FAR}
          onUpdate={(camera) => {
            camera.lookAt(...AVATAR_CONFIG.CAMERA.LOOK_AT);
          }}
        />

        {/* Enhanced lighting setup */}
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
        <pointLight 
          position={AVATAR_CONFIG.LIGHTING.FACE_LIGHT.POSITION}
          intensity={AVATAR_CONFIG.LIGHTING.FACE_LIGHT.INTENSITY}
          color={AVATAR_CONFIG.LIGHTING.FACE_LIGHT.COLOR}
        />

        {/* Enhanced Avatar Model with Greeting */}
        <Suspense fallback={null}>
          <AvatarModel
            isTalking={isTalking}
            lastMessage={lastMessage}
            voiceEnabled={voiceEnabled}
            selectedVoice={selectedVoice}
            onVoiceEnd={onVoiceEnd}
            onError={handleError}
            volumeLipSyncRef={volumeLipSyncRef}
            enableGreeting={enableGreeting}
            onGreetingComplete={onGreetingComplete}
          />
        </Suspense>
      </Canvas>
    </div>
  );
});

// Enhanced Main Export Component with Greeting Support
const Avatar = React.memo(({ 
  isTalking = false,
  lastMessage = '',
  voiceEnabled = true,
  selectedVoice = null,
  onVoiceEnd = null,
  className = "w-full h-full",
  volumeLipSyncRef = null,
  // NEW: Greeting props
  enableGreeting = true,
  onGreetingComplete = null
}) => {
  return (
    <AvatarScene
      isTalking={isTalking}
      lastMessage={lastMessage}
      voiceEnabled={voiceEnabled}
      selectedVoice={selectedVoice}
      onVoiceEnd={onVoiceEnd}
      className={className}
      volumeLipSyncRef={volumeLipSyncRef}
      enableGreeting={enableGreeting}
      onGreetingComplete={onGreetingComplete}
    />
  );
});

export default Avatar;