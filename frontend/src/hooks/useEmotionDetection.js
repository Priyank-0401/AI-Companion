import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';

const EMOTION_MAPPING = {
  'happy': 'happy',
  'sad': 'sad',
  'angry': 'angry',
  'surprised': 'surprised',
  'disgusted': 'neutral',
  'fearful': 'neutral',
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

  // Load face-api.js models
  const loadModels = useCallback(async () => {
    if (modelsLoaded.current) return true;

    try {
      // Use relative path to models in the public directory
      const MODEL_URL = '/face-api-models';
      
      console.log('Loading face-api.js models from:', MODEL_URL);
      
      // Load models with error handling for each model
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        console.log('TinyFaceDetector model loaded');
      } catch (e) {
        console.error('Error loading TinyFaceDetector model:', e);
        throw e;
      }
      
      try {
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        console.log('FaceLandmark68Net model loaded');
      } catch (e) {
        console.error('Error loading FaceLandmark68Net model:', e);
        throw e;
      }
      
      try {
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        console.log('FaceExpressionNet model loaded');
      } catch (e) {
        console.error('Error loading FaceExpressionNet model:', e);
        throw e;
      }
      
      modelsLoaded.current = true;
      return true;
    } catch (err) {
      console.error('Failed to load face-api models:', err);
      setError(new Error('Failed to load emotion detection models. Make sure to run `npm run download-models` first.'));
      return false;
    }
  }, []);

  // Start video stream
  const startVideo = useCallback(async () => {
    if (!modelsLoaded.current) {
      console.log('Models not loaded, cannot start video');
      return false;
    }
    
    // If we already have an active stream, return
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject;
      if (stream.getTracks().some(track => track.readyState === 'live')) {
        console.log('Video stream already active');
        setHasCameraAccess(true);
        return true;
      }
    }

    try {
      // Check if we already have a stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        if (tracks.some(track => track.readyState === 'live')) {
          console.log('Video stream already active');
          return true;
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play().then(resolve).catch(err => {
                console.error('Error playing video:', err);
                resolve();
              });
            };
          }
        });
        setHasCameraAccess(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(new Error('Could not access camera. Please check permissions.'));
      setHasCameraAccess(false);
    }
  }, [enabled]);

  // Stop video stream
  const stopVideo = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setHasCameraAccess(false);
      return true;
    }
    return false;
  }, []);

  // Detect emotions from video stream
  const detectEmotions = useCallback(async () => {
    if (!videoRef.current || !modelsLoaded.current) return 'neutral';

    try {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detections.length > 0) {
        const expressions = detections[0].expressions;
        const sortedExpressions = Object.entries(expressions)
          .sort(([, a], [, b]) => b - a);

        const [dominantEmotion, confidence] = sortedExpressions[0];
        
        if (confidence > EMOTION_THRESHOLD && EMOTION_MAPPING[dominantEmotion]) {
          const mappedEmotion = EMOTION_MAPPING[dominantEmotion];
          return mappedEmotion;
        }
      }
    } catch (err) {
      console.error('Error detecting emotions:', err);
    }
    
    return 'neutral';
  }, []);

  // Initialize models when component mounts
  useEffect(() => {
    const init = async () => {
      const success = await loadModels();
      if (success) {
        console.log('Models loaded successfully');
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

  // Handle video start/stop when enabled changes
  useEffect(() => {
    if (!isReady) {
      console.log('Not ready to toggle video');
      return;
    }

    console.log('Toggling video, enabled:', enabled);
    
    const handleVideoToggle = async () => {
      if (enabled) {
        console.log('Starting video...');
        await startVideo();
      } else {
        console.log('Stopping video...');
        stopVideo();
      }
    };

    handleVideoToggle();
    
    // Cleanup on unmount or when enabled changes
    return () => {
      if (!enabled) {
        console.log('Cleaning up video');
        stopVideo();
      }
    };
  }, [enabled, isReady, startVideo, stopVideo]);

  // Start/stop detection interval when camera is ready and enabled
  useEffect(() => {
    if (!isReady || !enabled || !hasCameraAccess) {
      if (detectionInterval.current) {
        console.log('Stopping detection interval');
        clearInterval(detectionInterval.current);
        detectionInterval.current = null;
      }
      return;
    }
    
    console.log('Starting detection interval');

    // Clear any existing interval
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
    }

    // Start new detection interval
    detectionInterval.current = setInterval(async () => {
      try {
        const detectedEmotion = await detectEmotions();
        if (detectedEmotion && detectedEmotion !== emotion) {
          setEmotion(detectedEmotion);
          onEmotionDetected(detectedEmotion);
        }
      } catch (error) {
        console.error('Error in emotion detection:', error);
      }
    }, EMOTION_UPDATE_INTERVAL);

    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
        detectionInterval.current = null;
      }
    };
  }, [isReady, hasCameraAccess, detectEmotions, emotion, onEmotionDetected]);

  return {
    emotion,
    videoRef,
    videoStream: videoRef.current?.srcObject || null,
    isReady,
    hasCameraAccess,
    error,
    startVideo,
    stopVideo
  };
};

export default useEmotionDetection;
