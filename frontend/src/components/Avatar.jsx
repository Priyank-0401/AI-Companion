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
      setBoundingBox({ size, center });
    }
  }, [scene]);
  
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
  }  // Auto-scale model to fit nicely in view - optimized for video call size with zoom
  const scale = Math.min(4.5 / boundingBox.size.x, 5 / boundingBox.size.y, 5 / boundingBox.size.z);
  const yOffset = -boundingBox.center.y * 0.5 - 0.5; // Move model down from center

  return (
    <group ref={group} {...props} key={modelPath}>
      <primitive 
        object={scene} 
        scale={[scale, scale, scale]}
        position={[0, yOffset, 0]}
        rotation={[0, 0, 0]}
      />
    </group>
  );
}

// Main Avatar component
const Avatar = ({ isTalking = false, height = '100vh' }) => {
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
    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">      <Canvas
        onError={handleError}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 3], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        {/* Enhanced lighting for video call realism */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-5, -5, -5]} intensity={0.6} />
        <pointLight position={[0, 3, 2]} intensity={0.8} color="#ffffff" />
        <spotLight position={[0, 5, 0]} intensity={0.5} angle={0.3} penumbra={1} />

        {/* Model with Suspense fallback */}
        <Suspense fallback={<LoadingFallback />}>
          <AnimatedModel isTalking={isTalking} key={isTalking ? 'talking' : 'idle'} />
        </Suspense>

        {/* Controls for development (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxDistance={8}
            minDistance={1}
          />
        )}
      </Canvas>
    </div>
  );
};

export default Avatar;
