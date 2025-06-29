import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';
let modelsLoaded = false;

/**
 * Loads all required face-api.js models
 * @returns {Promise<boolean>} True if models loaded successfully
 */
export const loadFaceApiModels = async () => {
  if (modelsLoaded) return true;

  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    
    modelsLoaded = true;
    return true;
  } catch (error) {
    console.error('Failed to load face-api models:', error);
    throw new Error('Failed to load face detection models');
  }
};

/**
 * Detects the dominant emotion from a video element
 * @param {HTMLVideoElement} videoElement - The video element to analyze
 * @returns {Promise<string>} The detected emotion
 */
export const detectDominantEmotion = async (videoElement) => {
  if (!modelsLoaded || !videoElement) return 'neutral';

  try {
    const detections = await faceapi
      .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    if (detections.length === 0) return 'neutral';

    const expressions = detections[0].expressions;
    const sortedExpressions = Object.entries(expressions)
      .sort(([, a], [, b]) => b - a);

    const [dominantEmotion, confidence] = sortedExpressions[0];
    const EMOTION_THRESHOLD = 0.7;
    
    if (confidence > EMOTION_THRESHOLD) {
      const EMOTION_MAPPING = {
        'happy': 'happy',
        'sad': 'sad',
        'angry': 'angry',
        'surprised': 'surprised',
        'disgusted': 'neutral',
        'fearful': 'neutral',
        'neutral': 'neutral'
      };
      
      return EMOTION_MAPPING[dominantEmotion] || 'neutral';
    }
  } catch (error) {
    console.error('Error detecting emotion:', error);
  }
  
  return 'neutral';
};

/**
 * Requests camera access and returns a video stream
 * @param {Object} constraints - MediaStreamConstraints for the video stream
 * @returns {Promise<MediaStream>} The video stream
 */
export const getVideoStream = async (constraints = {
  video: { 
    width: 640, 
    height: 480,
    facingMode: 'user'
  },
  audio: false
}) => {
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    console.error('Error accessing camera:', error);
    throw new Error('Could not access camera. Please check permissions.');
  }
};
