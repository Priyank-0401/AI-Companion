import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';

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

// Model component that loads and displays the GLB file with animations
function AnimatedModel({ isTalking, ...props }) {
  const group = useRef();
  const [boundingBox, setBoundingBox] = useState(null);
  
  // Load models separately with unique keys to force re-mounting
  const modelPath = isTalking ? '/models/Talking.glb' : '/models/Idle.glb';
  const { scene, animations } = useGLTF(modelPath);
  const { actions, mixer } = useAnimations(animations, group);
  
  console.log(`Loading model: ${modelPath}`);
  console.log(`Animations available: ${animations?.length || 0}`);
  console.log(`Actions available: ${Object.keys(actions || {}).length}`);
    // Calculate bounding box for proper scaling and positioning
  useEffect(() => {
    if (scene) {
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      console.log(`Model ${modelPath} - Size:`, size, 'Center:', center);
      setBoundingBox({ size, center });
    }
  }, [scene, modelPath]);
  
  useEffect(() => {
    console.log(`Effect triggered for model: ${modelPath}`);
    
    // Clean up previous animations
    if (mixer) {
      mixer.stopAllAction();
    }
    
    // Small delay to ensure model is fully loaded
    const timer = setTimeout(() => {
      if (actions && Object.keys(actions).length > 0) {
        const actionNames = Object.keys(actions);
        console.log(`Playing animations for ${modelPath}:`, actionNames);
        
        // Play all available animations with proper looping
        actionNames.forEach(actionName => {
          const action = actions[actionName];
          if (action) {
            action.reset().play();
            action.setLoop(THREE.LoopRepeat);
            console.log(`Started animation: ${actionName} for ${modelPath}`);
          }
        });
      } else {
        console.log(`No animations found for ${modelPath}`);
      }
    }, 100);
    
    return () => {
      clearTimeout(timer);
      // Cleanup: stop all actions when component unmounts or changes
      if (mixer) {
        mixer.stopAllAction();
      }
    };
  }, [actions, mixer, modelPath]); // Added modelPath as dependency

  if (!scene || !boundingBox) {
    return null;
  }  // Fixed scaling for consistent avatar size across all screens
  // The model should always fit properly in the video call interface
  const targetHeight = 4.5; // Fixed height regardless of heightScale prop
  const scaleY = targetHeight / boundingBox.size.y;
  
  // Use uniform scaling to maintain proportions
  const finalScale = scaleY * 0.8; // Slightly smaller for better framing
    // Center the model properly in the viewport
  const yOffset = -boundingBox.center.y * finalScale - 0; // Move model up by 1.0 to match menu bar
  
  console.log(`Model ${modelPath} - Final scale:`, finalScale, 'Y offset:', yOffset);
  return (
    <group ref={group} {...props} key={modelPath}>
      <primitive 
        object={scene} 
        scale={[finalScale, finalScale, finalScale]}
        position={[0, yOffset, 0]}
        rotation={[0, 0, 0]}
        userData={{ locked: true }} // Prevent modifications
      />
    </group>
  );
}

// Main Avatar component
const Avatar = ({ isTalking = false }) => {
  const [error, setError] = useState(null);

  // Error boundary for the Canvas
  const handleError = (error) => {
    console.error('Canvas error:', error);
    setError(error);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-xl mb-2">Avatar Loading Error</div>
          <div className="text-sm text-gray-400">{error.message}</div>
          <button 
            onClick={() => setError(null)} 
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }  return (
    <div 
      className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      style={{ 
        userSelect: 'none', 
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    ><Canvas
        onError={handleError}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 1, 5], fov: 50, near: 0.1, far: 100 }}
        style={{ background: 'transparent' }}
        resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
      >
        {/* Optimized lighting for video call interface */}
        <ambientLight intensity={1.0} />
        <directionalLight position={[3, 4, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-3, -2, -5]} intensity={0.7} />
        <pointLight position={[0, 4, 3]} intensity={1.0} color="#ffffff" />
        <spotLight position={[0, 6, 2]} intensity={0.8} angle={0.4} penumbra={1} />
        <hemisphereLight skyColor="#ffffff" groundColor="#444444" intensity={0.5} />        {/* Model with Suspense fallback - fixed position and size */}
        <Suspense fallback={<LoadingFallback />}>
          <AnimatedModel isTalking={isTalking} key={isTalking ? 'talking' : 'idle'} />
        </Suspense>

        {/* Camera controls disabled to prevent user interaction */}
        {/* OrbitControls removed to fix avatar size and position */}
      </Canvas>
    </div>
  );
};

export default Avatar;
