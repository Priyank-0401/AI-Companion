import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, PerspectiveCamera } from '@react-three/drei';

// Model component that loads and displays the GLB file
function Model(props) {
  const { scene } = useGLTF('/models/avatar.glb');
  // You might need to scale, position, or rotate your model here if it's not appearing correctly
  scene.scale.set(0.5, 0.5, 0.5); // Make the model smaller
  scene.position.set(0, -0.5, 0); // Adjust Y to bring it up a bit
  return <primitive object={scene} {...props} />;
}

// Main Avatar component
const Avatar = () => {
  return (
    <div style={{ width: '100%', height: '100vh' }}> {/* Adjust styling as needed */}
      <Canvas>
        {/* Camera */}
        <PerspectiveCamera makeDefault position={[0, 0.5, 5]} fov={30} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />

        {/* Model with Suspense fallback */}
        <Suspense fallback={null}>
          <Model />
        </Suspense>

        {/* Controls for development (optional) */}
        <OrbitControls />
      </Canvas>
    </div>
  );
};

// Preload the model (optional, but good for performance)
useGLTF.preload('/models/avatar.glb');

export default Avatar;
