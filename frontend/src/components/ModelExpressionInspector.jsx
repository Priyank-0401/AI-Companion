import React, { useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

// Preload the models
useGLTF.preload('/models/Idle.glb');
useGLTF.preload('/models/Talking.glb');

// Custom hook to inspect morph targets and animations in GLB/GLTF models
function useModelInspector(modelPath) {
  const [modelInfo, setModelInfo] = useState(null);
  const [loadError, setLoadError] = useState(null);
  
  console.log(`Attempting to load GLB model: ${modelPath}`);
  
  // useGLTF works with both .gltf and .glb files
  // GLB is the binary version of GLTF
  const { scene, animations, error } = useGLTF(modelPath, true); // Enable draco loader
  
  console.log(`GLB loading result for ${modelPath}:`, { 
    scene: !!scene, 
    animations: animations?.length || 0, 
    error: !!error 
  });
    useEffect(() => {
    if (error) {
      console.error(`GLB loading error for ${modelPath}:`, error);
      setLoadError(error.message || 'Failed to load GLB model');
      return;
    }
    
    if (scene) {
      console.log(`Processing GLB scene for ${modelPath}...`);
      const info = {
        morphTargets: {},
        animations: [],
        meshes: []
      };

      // Collect morph targets from all meshes
      scene.traverse((child) => {
        if (child.isMesh) {
          console.log(`Found mesh: ${child.name || 'Unnamed'}`, {
            name: child.name,
            geometry: child.geometry,
            morphTargetDictionary: child.morphTargetDictionary,
            morphTargetInfluences: child.morphTargetInfluences
          });
          info.meshes.push(child.name || 'Unnamed Mesh');
          
          if (child.morphTargetDictionary) {
            const morphTargets = Object.keys(child.morphTargetDictionary);
            console.log(`Morph targets for ${child.name}:`, morphTargets);
            info.morphTargets[child.name || 'Unnamed Mesh'] = morphTargets;
          } else {
            console.log(`No morph targets found for mesh: ${child.name}`);
          }
        }
      });

      // Collect animation names
      if (animations && animations.length > 0) {
        info.animations = animations.map(anim => anim.name);
        console.log(`Animations found in GLB:`, info.animations);
      } else {
        console.log(`No animations found in GLB: ${modelPath}`);
      }

      setModelInfo(info);
      setLoadError(null);
      console.log(`Final GLB model info for ${modelPath}:`, info);
    } else {
      console.log(`Scene not yet loaded for ${modelPath}`);
    }
  }, [scene, animations, modelPath, error]);
  return { scene, modelInfo, loadError };
}

// Main inspector component
const ModelExpressionInspector = () => {
  const [currentModel, setCurrentModel] = useState('/models/Idle.glb');
  const [selectedMorph, setSelectedMorph] = useState('');
  const [morphValue, setMorphValue] = useState(0);

  // Test GLB file accessibility
  useEffect(() => {
    const testGLBAccess = async () => {
      try {
        const response = await fetch('/models/Idle.glb', { method: 'HEAD' });
        console.log(`GLB file accessibility test - Idle.glb: ${response.status} ${response.statusText}`);
        
        const response2 = await fetch('/models/Talking.glb', { method: 'HEAD' });
        console.log(`GLB file accessibility test - Talking.glb: ${response2.status} ${response2.statusText}`);
      } catch (error) {
        console.error('GLB file accessibility test failed:', error);
      }
    };
    
    testGLBAccess();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Model Expression Inspector</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Model Viewer */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">3D Model Preview</h2>
              {/* Model Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select GLB Model:</label>
              <select 
                value={currentModel} 
                onChange={(e) => setCurrentModel(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="/models/Idle.glb">Idle Model (GLB)</option>
                <option value="/models/Talking.glb">Talking Model (GLB)</option>
              </select>
            </div>{/* 3D Canvas */}
            <div className="h-96 bg-black rounded-lg">
              <Canvas 
                camera={{ position: [0, 1, 3], fov: 50 }}
                onError={(error) => console.error('Canvas error:', error)}
              >
                <ambientLight intensity={0.8} />
                <directionalLight position={[3, 4, 5]} intensity={1} />
                <React.Suspense fallback={null}>
                  <ModelInspectorScene 
                    modelPath={currentModel}
                    selectedMorph={selectedMorph}
                    morphValue={morphValue}
                  />
                </React.Suspense>
              </Canvas>
            </div>
          </div>

          {/* Inspector Panel */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Model Information</h2>
            <ModelInfoPanel 
              modelPath={currentModel}
              selectedMorph={selectedMorph}
              setSelectedMorph={setSelectedMorph}
              morphValue={morphValue}
              setMorphValue={setMorphValue}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Scene component for the 3D canvas
function ModelInspectorScene({ modelPath, selectedMorph, morphValue }) {
  const { scene, loadError } = useModelInspector(modelPath);
  
  // Apply morph target for testing
  useEffect(() => {
    if (scene && selectedMorph) {
      scene.traverse((child) => {
        if (child.isMesh && child.morphTargetDictionary) {
          const morphIndex = child.morphTargetDictionary[selectedMorph];
          if (morphIndex !== undefined && child.morphTargetInfluences) {
            child.morphTargetInfluences[morphIndex] = morphValue;
          }
        }
      });
    }
  }, [scene, selectedMorph, morphValue]);
  
  if (loadError) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }

  if (!scene) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    );
  }

  return (
    <primitive 
      object={scene.clone()} 
      scale={[1, 1, 1]}
      position={[0, -2, 0]}
    />
  );
}

// Info panel component
function ModelInfoPanel({ modelPath, selectedMorph, setSelectedMorph, morphValue, setMorphValue }) {
  const { modelInfo, loadError } = useModelInspector(modelPath);

  if (loadError) {
    return (
      <div className="text-red-400">
        <p>Error loading model: {loadError}</p>
        <p className="text-sm text-gray-400 mt-2">
          Make sure the model files exist in the public/models directory.
        </p>
      </div>
    );
  }

  if (!modelInfo) {
    return <div className="text-gray-400">Loading model information...</div>;
  }

  const allMorphTargets = Object.values(modelInfo.morphTargets).flat();
  const uniqueMorphTargets = [...new Set(allMorphTargets)];

  return (
    <div className="space-y-6">
      {/* Morph Targets */}
      <div>
        <h3 className="text-lg font-medium mb-3">Morph Targets ({uniqueMorphTargets.length})</h3>
        
        {uniqueMorphTargets.length > 0 ? (
          <div className="space-y-3">
            <select 
              value={selectedMorph} 
              onChange={(e) => setSelectedMorph(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="">Select a morph target</option>
              {uniqueMorphTargets.map(morph => (
                <option key={morph} value={morph}>{morph}</option>
              ))}
            </select>
            
            {selectedMorph && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {selectedMorph} Value: {morphValue.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={morphValue}
                  onChange={(e) => setMorphValue(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
            
            <div className="bg-gray-700 rounded p-3 max-h-40 overflow-y-auto">
              <h4 className="font-medium mb-2">All Morph Targets:</h4>
              <div className="grid grid-cols-2 gap-1 text-sm">
                {uniqueMorphTargets.map(morph => (
                  <button
                    key={morph}
                    onClick={() => setSelectedMorph(morph)}
                    className={`text-left p-1 rounded hover:bg-gray-600 ${
                      selectedMorph === morph ? 'bg-blue-600' : ''
                    }`}
                  >
                    {morph}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-400">No morph targets found</div>
        )}
      </div>

      {/* Animations */}
      <div>
        <h3 className="text-lg font-medium mb-3">Animations ({modelInfo.animations.length})</h3>
        <div className="bg-gray-700 rounded p-3 max-h-32 overflow-y-auto">
          {modelInfo.animations.length > 0 ? (
            <div className="space-y-1 text-sm">
              {modelInfo.animations.map(animName => (
                <div key={animName} className="p-1">{animName}</div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400">No animations found</div>
          )}
        </div>
      </div>

      {/* Meshes */}
      <div>
        <h3 className="text-lg font-medium mb-3">Meshes ({modelInfo.meshes.length})</h3>
        <div className="bg-gray-700 rounded p-3 max-h-32 overflow-y-auto">
          <div className="space-y-1 text-sm">
            {modelInfo.meshes.map((meshName, index) => (
              <div key={index} className="p-1">{meshName}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Expression Mappings */}
      <div>
        <h3 className="text-lg font-medium mb-3">Current Expression Mappings</h3>
        <div className="bg-gray-700 rounded p-3 text-sm space-y-2">
          <div><strong>Smile:</strong> smile, eyeSquintLeft, eyeSquintRight</div>
          <div><strong>Frown:</strong> frown, browDownLeft, browDownRight</div>
          <div><strong>Surprise:</strong> eyeWideLeft, eyeWideRight, jawOpen</div>
          <div><strong>Blink:</strong> eyeBlinkLeft, eyeBlinkRight</div>
          <div><strong>Lip Sync:</strong> mouthFunnel, mouthSmile, mouthPucker, mouthOpen, jawOpen</div>
        </div>
      </div>
    </div>
  );
}

export default ModelExpressionInspector;
