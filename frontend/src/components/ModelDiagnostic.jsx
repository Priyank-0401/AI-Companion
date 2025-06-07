import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, Box, Html } from '@react-three/drei';
import * as THREE from 'three';

function ModelAnalyzer({ modelPath }) {
  const group = useRef();
  const { scene, animations } = useGLTF(modelPath);
  const { actions, mixer } = useAnimations(animations, group);
  const [boundingBox, setBoundingBox] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  
  useEffect(() => {
    if (scene) {
      // Calculate bounding box
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      setBoundingBox({ box, size, center });
      
      // Analyze scene structure
      const analyzeNode = (node, depth = 0) => {
        const indent = '  '.repeat(depth);
        console.log(`${indent}${node.type}: ${node.name || 'unnamed'}`);
        
        if (node.geometry) {
          console.log(`${indent}  - Geometry: ${node.geometry.type}`);
          console.log(`${indent}  - Vertices: ${node.geometry.attributes.position?.count || 0}`);
        }
        
        if (node.material) {
          console.log(`${indent}  - Material: ${node.material.type}`);
          if (node.material.map) {
            console.log(`${indent}  - Texture: ${node.material.map.source?.data?.src || 'embedded'}`);
          }
        }
        
        node.children.forEach(child => analyzeNode(child, depth + 1));
      };
      
      console.log(`\n=== MODEL STRUCTURE: ${modelPath} ===`);
      console.log('Bounding Box:', {
        min: box.min,
        max: box.max,
        size: size,
        center: center
      });
      
      analyzeNode(scene);
      
      setModelInfo({
        size: size,
        center: center,
        hasGeometry: scene.traverse(node => node.geometry !== undefined),
        meshCount: scene.children.filter(child => child.type === 'Mesh').length
      });
      
      // Auto-play animations
      if (actions && Object.keys(actions).length > 0) {
        Object.values(actions).forEach(action => {
          if (action) {
            action.reset().play();
            action.setLoop(THREE.LoopRepeat);
          }
        });
      }
    }
  }, [scene, actions, modelPath]);

  if (!scene) return null;
  
  // Try different scales and positions based on bounding box
  const scale = boundingBox ? Math.min(2 / boundingBox.size.x, 2 / boundingBox.size.y, 2 / boundingBox.size.z) : 1;
  const yOffset = boundingBox ? -boundingBox.center.y : 0;

  return (
    <group ref={group}>
      {/* Original model */}
      <primitive 
        object={scene} 
        scale={[scale, scale, scale]} 
        position={[0, yOffset, 0]} 
      />
      
      {/* Bounding box visualization */}
      {boundingBox && (
        <Box 
          args={[boundingBox.size.x, boundingBox.size.y, boundingBox.size.z]}
          position={[boundingBox.center.x, boundingBox.center.y, boundingBox.center.z]}
        >
          <meshBasicMaterial wireframe color="red" opacity={0.3} transparent />
        </Box>
      )}
      
      {/* Info display */}
      <Html position={[2, 2, 0]}>
        <div style={{
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          fontSize: '12px',
          borderRadius: '5px',
          minWidth: '200px'
        }}>
          <div><strong>Model Info:</strong></div>
          {modelInfo && (
            <>
              <div>Size: {modelInfo.size.x.toFixed(2)} x {modelInfo.size.y.toFixed(2)} x {modelInfo.size.z.toFixed(2)}</div>
              <div>Center: {modelInfo.center.x.toFixed(2)}, {modelInfo.center.y.toFixed(2)}, {modelInfo.center.z.toFixed(2)}</div>
              <div>Scale Applied: {scale.toFixed(2)}</div>
              <div>Y Offset: {yOffset.toFixed(2)}</div>
            </>
          )}
          <div>Animations: {animations?.length || 0}</div>
          <div>Actions: {actions ? Object.keys(actions).length : 0}</div>
        </div>
      </Html>
    </group>
  );
}

export default function ModelDiagnostic() {
  const [currentModel, setCurrentModel] = useState('/models/Idle.glb');
  const [key, setKey] = useState(0);
  
  const switchModel = () => {
    const newModel = currentModel === '/models/Idle.glb' ? '/models/Talking.glb' : '/models/Idle.glb';
    setCurrentModel(newModel);
    setKey(prev => prev + 1);
  };
  
  return (
    <div style={{ width: '100%', height: '100vh', background: '#111' }}>
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        left: '20px', 
        zIndex: 10,
        color: 'white'
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
        <div style={{ fontSize: '12px', marginTop: '10px' }}>
          Red wireframe shows model bounds<br/>
          Check console for detailed structure
        </div>
      </div>
      
      <Canvas 
        camera={{ position: [5, 2, 5], fov: 50 }}
        style={{ background: '#222' }}
      >
        {/* Multiple light sources */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <directionalLight position={[-10, 10, -5]} intensity={0.5} />
        <pointLight position={[0, 5, 0]} intensity={0.5} />
        
        {/* Grid for reference */}
        <gridHelper args={[10, 10]} />
        
        <Suspense fallback={null}>
          <ModelAnalyzer key={key} modelPath={currentModel} />
        </Suspense>
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
}
