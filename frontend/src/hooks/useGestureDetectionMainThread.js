import { useState, useEffect, useRef } from 'react';
import { FilesetResolver, PoseLandmarker, GestureRecognizer } from '@mediapipe/tasks-vision';

const useGestureDetectionMainThread = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [poseResults, setPoseResults] = useState(null);
  const [gestureResults, setGestureResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const poseLandmarkerRef = useRef(null);
  const gestureRecognizerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const processingRef = useRef(false);
  const lastProcessTimeRef = useRef(0);

  const PROCESSING_INTERVAL = 100; // Process every 100ms (10 FPS)

  // Initialize MediaPipe
  useEffect(() => {
    const initializeMediaPipe = async () => {
      try {
        setError(null);
        
        // Load the vision bundle
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm"
        );

        // Initialize PoseLandmarker
        poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `/pose_landmarker_lite.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1
        });

        // Initialize GestureRecognizer
        gestureRecognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `/gesture_recognizer.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO"
        });

        setIsInitialized(true);
        console.log('MediaPipe initialized successfully in main thread');
      } catch (err) {
        console.error('MediaPipe initialization error:', err);
        setError(`Initialization failed: ${err.message}`);
      }
    };

    initializeMediaPipe();

    return () => {
      // Cleanup
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
      }
      if (gestureRecognizerRef.current) {
        gestureRecognizerRef.current.close();
      }
    };
  }, []);

  // Start camera
  const startCamera = async () => {
    // Check if camera is already started
    if (streamRef.current) {
      console.log('Camera already started, stopping previous stream');
      stopCamera();
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Video ready timeout'));
          }, 3000);
          
          const handleCanPlay = () => {
            clearTimeout(timeout);
            videoRef.current.removeEventListener('canplay', handleCanPlay);
            resolve();
          };
          
          videoRef.current.addEventListener('canplay', handleCanPlay);
          // Also resolve if already can play
          if (videoRef.current.readyState >= 2) {
            clearTimeout(timeout);
            resolve();
          }
        });
        
        await videoRef.current.play();
      }
      
      return true;
    } catch (err) {
      console.error('Camera access error:', err);
      setError(`Camera access failed: ${err.message}`);
      return false;
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    processingRef.current = false;
    setIsProcessing(false);
  };

  // Process frame (non-blocking using requestAnimationFrame)
  const processFrame = () => {
    if (!isInitialized || !videoRef.current || !poseLandmarkerRef.current || !gestureRecognizerRef.current) {
      return;
    }
    
    // Check if video is ready and has valid dimensions
    const video = videoRef.current;
    if (video.videoWidth <= 0 || video.videoHeight <= 0) {
      console.warn('Video not ready or has invalid dimensions', { width: video.videoWidth, height: video.videoHeight });
      if (processingRef.current) {
        requestAnimationFrame(processFrame);
      }
      return;
    }

    const now = performance.now();
    if (now - lastProcessTimeRef.current < PROCESSING_INTERVAL) {
      if (processingRef.current) {
        requestAnimationFrame(processFrame);
      }
      return;
    }

    try {
      const timestamp = performance.now();

      // Run pose detection
      const poseResults = poseLandmarkerRef.current.detectForVideo(video, timestamp);
      
      // Run gesture recognition
      const gestureResults = gestureRecognizerRef.current.recognizeForVideo(video, timestamp);
      
      // Update results
      setPoseResults(poseResults);
      setGestureResults(gestureResults);
      
      lastProcessTimeRef.current = now;
    } catch (err) {
      console.error('Processing error:', err);
      setError(`Processing failed: ${err.message}`);
    }

    // Continue processing if still active
    if (processingRef.current) {
      requestAnimationFrame(processFrame);
    }
  };

  // Start processing
  const startProcessing = async () => {
    if (!isInitialized) {
      setError('MediaPipe not initialized');
      return false;
    }
    
    // Check if already processing
    if (processingRef.current) {
      console.log('Gesture detection already running');
      return true;
    }

    const cameraStarted = await startCamera();
    if (!cameraStarted) {
      return false;
    }

    processingRef.current = true;
    setIsProcessing(true);
    requestAnimationFrame(processFrame);
    return true;
  };

  // Stop processing
  const stopProcessing = () => {
    processingRef.current = false;
    setIsProcessing(false);
    stopCamera();
  };

  return {
    isInitialized,
    error,
    poseResults,
    gestureResults,
    isProcessing,
    startProcessing,
    stopProcessing,
    videoRef,
    canvasRef
  };
};

export default useGestureDetectionMainThread;
