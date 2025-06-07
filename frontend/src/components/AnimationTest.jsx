import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls } from '@react-three/drei';

function AnimationTester({ modelPath }) {
  const group = useRef();
  const { scene, animations } = useGLTF(modelPath);
  const { actions, mixer } = useAnimations(animations, group);
  
  useEffect(() => {
    console.log(`\n=== ANIMATION ANALYSIS: ${modelPath} ===`);
    console.log('Scene:', scene);
    console.log('Animations found:', animations?.length || 0);
    
    if (animations && animations.length > 0) {
      animations.forEach((clip, index) => {
        console.log(`Animation ${index}:`, {
          name: clip.name,
          duration: clip.duration,
          tracks: clip.tracks.length,
          trackTypes: clip.tracks.map(track => ({
            name: track.name,
            type: track.constructor.name,
            times: track.times.length,
            values: track.values.length
          }))
        });
      });
    } else {
      console.log('No animations found in model');
    }
    
    console.log('Actions:', actions);
    console.log('Mixer:', mixer);
    
    // Try to play all available animations
    if (actions && Object.keys(actions).length > 0) {
      console.log('Available actions:', Object.keys(actions));
      
      Object.values(actions).forEach((action, index) => {
        if (action) {
          console.log(`Playing action ${index}:`, action);
          action.reset().play();
          action.setLoop(2); // LoopRepeat
        }
      });
    }
    
    console.log(`=== END ANALYSIS: ${modelPath} ===\n`);
  }, [scene, animations, actions, mixer, modelPath]);
  
  if (!scene) return null;
  
  return (
    <group ref={group}>
      <primitive object={scene} scale={[0.5, 0.5, 0.5]} position={[0, -1, 0]} />
    </group>
  );
}

export default function AnimationTest() {
  const [currentModel, setCurrentModel] = useState('/models/Idle.glb');
  const [key, setKey] = useState(0);
  
  const switchModel = () => {
    const newModel = currentModel === '/models/Idle.glb' ? '/models/Talking.glb' : '/models/Idle.glb';
    setCurrentModel(newModel);
    setKey(prev => prev + 1); // Force re-render
    console.log('Switching to:', newModel);
  };
  
  return (
    <div style={{ width: '100%', height: '100vh', background: '#222' }}>
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        left: '20px', 
        zIndex: 10,
        color: 'white',
        fontSize: '14px'
      }}>
        <button
          onClick={switchModel}
          style={{
            padding: '10px 20px',
            backgroundColor: '#00ADB5',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          Switch to {currentModel.includes('Idle') ? 'Talking' : 'Idle'}
        </button>
        <div>Current: {currentModel.split('/').pop()}</div>
        <div>Key: {key}</div>
        <div style={{ fontSize: '12px', marginTop: '10px' }}>
          Check console for animation details
        </div>
      </div>
      
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <Suspense fallback={null}>
          <AnimationTester key={key} modelPath={currentModel} />
        </Suspense>
        
        <OrbitControls />
      </Canvas>
    </div>
  );
}
