import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';

function ModelAnalyzer({ modelPath }) {
  const { scene, animations, error } = useGLTF(modelPath);
  
  useEffect(() => {
    if (scene) {
      console.log(`=== ANALYZING ${modelPath} ===`);
      console.log('Scene UUID:', scene.uuid);
      console.log('Scene type:', scene.type);
      console.log('Scene children count:', scene.children.length);
      console.log('Scene animations:', animations?.length || 0);
      
      // Deep dive into structure
      const analyzeNode = (node, depth = 0) => {
        const indent = '  '.repeat(depth);
        console.log(`${indent}- ${node.name || 'unnamed'} (${node.type}) [${node.uuid}]`);
        
        if (node.geometry) {
          console.log(`${indent}  Geometry: ${node.geometry.type}`);
          console.log(`${indent}  Vertices: ${node.geometry.attributes?.position?.count || 0}`);
        }
        
        if (node.material) {
          console.log(`${indent}  Material: ${node.material.type}`);
          if (node.material.name) {
            console.log(`${indent}  Material name: ${node.material.name}`);
          }
        }
        
        if (node.children) {
          node.children.forEach(child => analyzeNode(child, depth + 1));
        }
      };
      
      scene.children.forEach(child => analyzeNode(child));
      
      if (animations && animations.length > 0) {
        console.log('\n=== ANIMATIONS ===');
        animations.forEach((anim, index) => {
          console.log(`Animation ${index}:`, {
            name: anim.name,
            duration: anim.duration,
            tracks: anim.tracks.length,
            trackNames: anim.tracks.map(track => track.name)
          });
        });
      } else {
        console.log('No animations found');
      }
      
      console.log(`=== END ANALYSIS ${modelPath} ===\n`);
    }
  }, [scene, animations, modelPath]);
  
  if (error) {
    return <div style={{ color: 'red' }}>Error loading {modelPath}: {error.message}</div>;
  }
  
  if (!scene) {
    return <div style={{ color: 'yellow' }}>Loading {modelPath}...</div>;
  }
  
  const clonedScene = scene.clone();
  clonedScene.scale.set(0.5, 0.5, 0.5);
  clonedScene.position.set(0, -1, 0);
  
  return <primitive object={clonedScene} />;
}

export default function ModelInspector() {
  const [analysisComplete, setAnalysisComplete] = useState(false);
  
  useEffect(() => {
    // Wait a bit then mark analysis as complete
    const timer = setTimeout(() => setAnalysisComplete(true), 3000);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div style={{ width: '100%', height: '100vh', background: '#111', color: 'white', padding: '20px' }}>
      <h2>GLB Model Inspector</h2>
      <p>Check the console for detailed model analysis...</p>
      
      <div style={{ display: 'flex', height: 'calc(100vh - 120px)' }}>
        {/* Idle Model */}
        <div style={{ width: '50%', border: '1px solid #333', margin: '10px' }}>
          <h3 style={{ textAlign: 'center', margin: '10px' }}>Idle.glb</h3>
          <Canvas camera={{ position: [0, 0, 5] }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <Suspense fallback={<mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="orange" /></mesh>}>
              <ModelAnalyzer modelPath="/models/Idle.glb" />
            </Suspense>
            <OrbitControls />
          </Canvas>
        </div>
        
        {/* Talking Model */}
        <div style={{ width: '50%', border: '1px solid #333', margin: '10px' }}>
          <h3 style={{ textAlign: 'center', margin: '10px' }}>Talking.glb</h3>
          <Canvas camera={{ position: [0, 0, 5] }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <Suspense fallback={<mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="orange" /></mesh>}>
              <ModelAnalyzer modelPath="/models/Talking.glb" />
            </Suspense>
            <OrbitControls />
          </Canvas>
        </div>
      </div>
      
      {analysisComplete && (
        <div style={{ 
          position: 'absolute', 
          bottom: '20px', 
          left: '20px', 
          backgroundColor: 'rgba(0,173,181,0.8)', 
          padding: '10px', 
          borderRadius: '5px' 
        }}>
          ✓ Analysis complete - check console for detailed comparison
        </div>
      )}
    </div>
  );
}
