import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';

const EMOTION_MAPPING = {
  'happy': 'happy',
  'sad': 'sad',
  'angry': 'angry',
  'surprised': 'surprised',
  'disgusted': 'disgusted',
  'fearful': 'fearful',
  'neutral': 'neutral'
};

const EMOTION_UPDATE_INTERVAL = 200; // Update emotions every 200ms (~5 FPS)
const EMOTION_THRESHOLD = 0.7; // Minimum confidence threshold for emotion detection

/**
 * Custom hook for detecting user emotions via webcam
 * @param {Object} options - Configuration options
 * @returns {Object} - Emotion state and video ref
 */
export const useEmotionDetection = (options = {}) => {
  const {
    enabled = true,
    onEmotionDetected = () => {},
    onError = (error) => console.error('Emotion detection error:', error)
  } = options;

  const [emotion, setEmotion] = useState('neutral');
  const [isReady, setIsReady] = useState(false);
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const detectionInterval = useRef(null);
  const modelsLoaded = useRef(false);
  const lastEmotionCheck = useRef(Date.now());
  const currentDetectedEmotion = useRef('neutral');
  const EMOTION_CHECK_INTERVAL = 5000; // Check for emotion changes every 5 seconds

  // Load face-api.js models
  const loadModels = useCallback(async () => {
    if (modelsLoaded.current) {
      // console.log('Models already loaded');
      return true;
    }

    try {
      // console.log('Initializing face-api.js...');
      
      // Set the backend to webgl
      // console.log('Setting up TensorFlow.js backend...');
      await faceapi.tf.enableProdMode(); // Enable production mode for better performance
      await faceapi.tf.setBackend('webgl');
      await faceapi.tf.ready();
      // console.log('Backend set to:', await faceapi.tf.getBackend());
      
      // In development, use the full URL to the models
      const isDev = process.env.NODE_ENV === 'development';
      const modelPath = isDev 
        ? `${window.location.origin}/models/face-api`
        : '/models/face-api';
      
      // console.log(`Loading models from: ${modelPath}`);
      
      // Verify models directory
      try {
        const response = await fetch(`${modelPath}/face_expression_model-weights_manifest.json`);
        if (!response.ok) throw new Error('Cannot access model files');
        // console.log('Model files are accessible');
      } catch (err) {
        console.error('Error accessing model files:', err);
        throw new Error(`Cannot access model files at ${modelPath}. Make sure the files are in the public directory.`);
      }
      
      // Load models with error handling for each
      try {
        // First, load the Tiny Face Detector
        // console.log('Loading Tiny Face Detector...');
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
        // console.log('Tiny Face Detector loaded');
        
        // Then load the Face Landmark model - use the correct model name
        // console.log('Loading Face Landmark 68 Net...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);
        // console.log('Face Landmark 68 Net loaded');
        
        // Finally, load the Expression model
        // console.log('Loading Face Expression Net...');
        await faceapi.nets.faceExpressionNet.loadFromUri(modelPath);
        // console.log('Face Expression Net loaded');
        
        // Verify all models are loaded
        if (!faceapi.nets.tinyFaceDetector.isLoaded ||
            !faceapi.nets.faceLandmark68Net.isLoaded ||
            !faceapi.nets.faceExpressionNet.isLoaded) {
          console.error('One or more models failed to load');
          // console.log('Tiny Face Detector loaded:', faceapi.nets.tinyFaceDetector.isLoaded);
          // console.log('Face Landmark loaded:', faceapi.nets.faceLandmark68Net?.isLoaded);
          // console.log('Face Expression loaded:', faceapi.nets.faceExpressionNet?.isLoaded);
          throw new Error('One or more models failed to load');
        }
        
        // console.log('All models loaded and verified');
        modelsLoaded.current = true;
        return true;
      } catch (modelErr) {
        console.error('Error loading models:', modelErr);
        // Log which models are loaded
        // console.log('Tiny Face Detector loaded:', faceapi.nets.tinyFaceDetector.isLoaded);
        // console.log('Face Landmark loaded:', faceapi.nets.faceLandmark68TinyNet?.isLoaded);
        // console.log('Face Expression loaded:', faceapi.nets.faceExpressionNet?.isLoaded);
        throw new Error(`Failed to load one or more models: ${modelErr.message}`);
      }
    } catch (err) {
      console.error('Failed to load face-api models:', err);
      setError(new Error('Failed to load emotion detection models. Make sure to run `npm run download-models` first.'));
      return false;
    }
  }, []);

  // Track the current stream
  const streamRef = useRef(null);
  
  // Start video stream
  const startVideo = useCallback(async () => {
    if (!modelsLoaded.current) {
      console.log('Models not loaded, cannot start video');
      return false;
    }
    
    // If we already have an active stream, return it
    if (streamRef.current) {
      const stream = streamRef.current;
      if (stream.getTracks().some(track => track.readyState === 'live')) {
        console.log('Video stream already active');
        setHasCameraAccess(true);
        return true;
      }
    }

    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Get new stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        },
        audio: false
      });
      
      // Store the stream reference
      streamRef.current = stream;

      // Set up the video element for emotion detection
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play().catch(err => {
                console.error('Error playing video:', err);
              });
              resolve();
            };
          }
        });
      }
      
      setHasCameraAccess(true);
      return true;
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(new Error('Could not access camera. Please check permissions.'));
      setHasCameraAccess(false);
      return false;
    }
  }, []);

  // Stop video stream
  const stopVideo = useCallback(() => {
    let wasStreaming = false;
    
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        track.stop();
        wasStreaming = true;
      });
      streamRef.current = null;
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setHasCameraAccess(false);
    }
    
    // Clear any pending detections
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
      detectionInterval.current = null;
    }
    
    // Reset emotion state
    setEmotion('neutral');
    currentDetectedEmotion.current = 'neutral';
    lastEmotionCheck.current = Date.now();
    
    return wasStreaming;
  }, []);

  // Check if models are loaded
  const areModelsLoaded = useCallback(() => {
    return modelsLoaded.current;
  }, []);

  // Track the last emotion that was logged/displayed
  const lastLoggedEmotion = useRef('neutral');
  const lastReportedEmotion = useRef('neutral');
  
  // Detect emotions from video stream
  const detectEmotions = useCallback(async () => {
    const now = Date.now();
    
    // Only proceed if 5 seconds have passed since last check
    if (now - lastEmotionCheck.current < EMOTION_CHECK_INTERVAL) {
      return currentDetectedEmotion.current;
    }
    
    // Update the last check time at the start to ensure consistent intervals
    lastEmotionCheck.current = now;
    
    try {
      if (!videoRef.current) {
        console.log('Video ref not ready');
        return currentDetectedEmotion.current;
      }
      
      // Ensure models are loaded
      if (!modelsLoaded.current) {
        console.log('Models not loaded, loading now...');
        const loaded = await loadModels();
        if (!loaded) {
          console.error('Failed to load models');
          return currentDetectedEmotion.current;
        }
      }
      
      // Check if video element has video dimensions
      if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        console.log('Video element has no dimensions yet');
        return 'neutral';
      }
      
      // Ensure video is playing
      if (videoRef.current.paused) {
        console.log('Video is paused, trying to play...');
        try {
          await videoRef.current.play();
        } catch (err) {
          console.error('Error playing video:', err);
          return 'neutral';
        }
      }

      // console.log('Starting face detection...');
      const detectionOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,  // Slightly larger for better detection
        scoreThreshold: 0.4,  // Lower threshold to detect more faces
      });

      // console.log('Using detection options:', JSON.stringify(detectionOptions, null, 2));
      
      // Perform face detection with landmarks and expressions
      let detections = [];
      try {
        // First detect all faces with expressions and landmarks
        const faces = await faceapi
          .detectAllFaces(videoRef.current, detectionOptions)
          .withFaceLandmarks()
          .withFaceExpressions();
        
        if (faces.length > 0) {
          // Map the results to our expected format
          detections = faces.map(face => ({
            detection: face.detection,
            landmarks: face.landmarks || null,
            expressions: face.expressions || null
          }));
        }
      } catch (detectErr) {
        console.error('Error during face detection:', detectErr);
        // Try reloading models if detection fails
        if (detectErr.message.includes('load model before inference')) {
          console.log('Model not loaded, attempting to reload...');
          modelsLoaded.current = false;
          const loaded = await loadModels();
          if (loaded) {
            console.log('Models reloaded, retrying detection...');
            const faces = await faceapi
            .detectAllFaces(videoRef.current, detectionOptions)
            .withFaceLandmarks()
            .withFaceExpressions();
          
          if (faces.length > 0) {
            detections = faces.map(face => ({
              detection: face.detection,
              landmarks: face.landmarks || null,
              expressions: face.expressions || null
            }));
          }
          } else {
            console.error('Failed to reload models');
            return 'neutral';
          }
        } else {
          console.error('Face detection error:', detectErr);
          return 'neutral';
        }
      }

      // console.log('Detected', detections.length, 'faces');

      if (detections.length > 0) {
        const detection = detections[0];
        
        if (detection.expressions) {
          const expressions = detection.expressions;
          // console.log('Raw expressions:', JSON.stringify(expressions, null, 2));
          
          const sortedExpressions = Object.entries(expressions)
            .filter(([_, value]) => typeof value === 'number' && value > EMOTION_THRESHOLD)
            .sort(([, a], [, b]) => b - a);

        if (sortedExpressions.length > 0) {
          const [dominantEmotion] = sortedExpressions[0];
          const mappedEmotion = EMOTION_MAPPING[dominantEmotion] || 'neutral';
          
          // Only update if the emotion has changed and we're not already reporting this emotion
          if (mappedEmotion !== lastLoggedEmotion.current) {
            lastLoggedEmotion.current = mappedEmotion;
            currentDetectedEmotion.current = mappedEmotion;
            
            // Only call onEmotionDetected if the emotion has actually changed from last reported
            if (mappedEmotion !== lastReportedEmotion.current) {
              console.log(`[${new Date().toISOString()}] Emotion detected: ${mappedEmotion}`);
              lastReportedEmotion.current = mappedEmotion;
              onEmotionDetected(mappedEmotion);
            }
            
            // Always update the local state to ensure UI consistency
            setEmotion(mappedEmotion);
          }
          
          return mappedEmotion;
        } else {
            console.log('No expressions above confidence threshold');
            return currentDetectedEmotion.current;
          }
        }
      } else {
        // console.log('No faces detected in the frame');
        // Check if video is actually playing
        // console.log('Video readyState:', videoRef.current.readyState);
        // console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
      }
    } catch (err) {
      console.error('Error in emotion detection:', err);
      return 'neutral';
    } finally {
      console.log('Emotion detection completed');
    }
  }, []);

  // Initialize models when component mounts
  useEffect(() => {
    const init = async () => {
      const success = await loadModels();
      if (success) {
        // console.log('Models loaded successfully');
        setIsReady(true);
      }
    };
    
    init();

    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
        detectionInterval.current = null;
      }
      stopVideo();
    };
  }, [loadModels, stopVideo]);
  
  // Only start/stop video when explicitly enabled/disabled
  const toggleVideo = useCallback(async (shouldEnable) => {
    if (shouldEnable) {
      const success = await startVideo();
      if (success) {
        setHasCameraAccess(true);
        // Ensure the video is playing before starting detection
        if (videoRef.current) {
          await videoRef.current.play().catch(err => {
            console.error('Error playing video for detection:', err);
          });
        }
      }
      return success;
    } else {
      stopVideo();
      setHasCameraAccess(false);
      return true;
    }
  }, [startVideo, stopVideo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
      stopVideo();
    };
  }, [stopVideo]);

  // Start/stop detection interval when camera is ready and enabled
  useEffect(() => {
    // Cleanup function to clear interval and reset state
    const cleanup = () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
        detectionInterval.current = null;
      }
      setEmotion('neutral');
      currentDetectedEmotion.current = 'neutral';
      lastEmotionCheck.current = Date.now();
    };

    if (!isReady || !enabled || !hasCameraAccess) {
      cleanup();
      return;
    }
    
    // console.log('Starting detection interval');
    cleanup(); // Clear any existing interval

    let isDetecting = false;
    let isMounted = true;
    
    // Start new detection interval
    const startDetection = async () => {
      // Skip if we're already detecting or component is unmounted
      if (isDetecting || !isMounted) return;
      
      isDetecting = true;
      
      try {
        // Skip if camera access was lost during detection
        if (!hasCameraAccess) return;
        
        const detectedEmotion = await detectEmotions();
        if (detectedEmotion && isMounted) {
          setEmotion(detectedEmotion);
          if (typeof onEmotionDetected === 'function') {
            onEmotionDetected(detectedEmotion);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error in emotion detection:', error);
        }
      } finally {
        if (isMounted) {
          isDetecting = false;
        }
      }
    };

    // Run detection immediately and then at intervals
    const initialDetection = async () => {
      if (!isMounted) return;
      await startDetection();
      if (isMounted) {
        detectionInterval.current = setInterval(startDetection, EMOTION_UPDATE_INTERVAL);
      }
    };
    
    initialDetection();
    
    // Cleanup on unmount or when dependencies change
    return () => {
      isMounted = false;
      cleanup();
    };

    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
        detectionInterval.current = null;
      }
    };
  }, [isReady, enabled, hasCameraAccess, detectEmotions, onEmotionDetected]);

  return {
    videoRef,
    videoStream: streamRef.current || null,
    isReady,
    hasCameraAccess,
    error,
    toggleVideo,
    startVideo,
    stopVideo,
    loadModels,
    areModelsLoaded,
    emotion,
    isDetecting: detectionInterval.current !== null,
    startDetection: () => {
      if (!detectionInterval.current) {
        const startDetection = async () => {
          const detectedEmotion = await detectEmotions();
          if (detectedEmotion) {
            setEmotion(detectedEmotion);
            if (typeof onEmotionDetected === 'function') {
              onEmotionDetected(detectedEmotion);
            }
          }
        };
        startDetection();
        detectionInterval.current = setInterval(startDetection, EMOTION_UPDATE_INTERVAL);
      }
    },
    stopDetection: () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
        detectionInterval.current = null;
      }
    }
  };
};

export default useEmotionDetection;
