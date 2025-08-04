/**
 * MediaPipe Gesture and Pose Detection Capabilities
 * 
 * This file documents all supported gestures and poses that can be detected
 * by MediaPipe and maps them to meaningful actions and context for the LLM.
 */

// MediaPipe Hand Gestures (from GestureRecognizer)
export const SUPPORTED_GESTURES = {
  // Basic hand gestures
  'Open_Palm': {
    name: 'Open Palm',
    description: 'Hand with all fingers extended',
    context: 'greeting, showing, presenting, stopping',
    emotion: 'welcoming, open, friendly'
  },
  'Closed_Fist': {
    name: 'Closed Fist',
    description: 'Hand with all fingers closed',
    context: 'emphasis, determination, anger, strength',
    emotion: 'determined, frustrated, strong'
  },
  'Victory': {
    name: 'Victory/Peace',
    description: 'Index and middle finger extended in V shape',
    context: 'victory, peace, celebration, positive',
    emotion: 'happy, victorious, peaceful'
  },
  'Pointing_Up': {
    name: 'Pointing Up',
    description: 'Index finger pointing upward',
    context: 'attention, idea, direction, emphasis',
    emotion: 'thoughtful, directive, emphatic'
  },
  'Thumb_Up': {
    name: 'Thumbs Up',
    description: 'Thumb extended upward',
    context: 'approval, agreement, positive feedback',
    emotion: 'positive, approving, satisfied'
  },
  'Thumb_Down': {
    name: 'Thumbs Down',
    description: 'Thumb extended downward',
    context: 'disapproval, disagreement, negative feedback',
    emotion: 'negative, disapproving, dissatisfied'
  },
  'ILoveYou': {
    name: 'I Love You',
    description: 'Thumb, index, and pinky extended',
    context: 'affection, love, sign language',
    emotion: 'loving, affectionate, caring'
  }
};

// MediaPipe Pose Landmarks (33 keypoints)
export const POSE_LANDMARKS = {
  // Face landmarks (0-10)
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  
  // Upper body landmarks (11-16)
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  
  // Hand landmarks (17-22)
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  
  // Lower body landmarks (23-32)
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32
};

// Derived pose classifications from landmarks
export const POSE_CLASSIFICATIONS = {
  'leaning_forward': {
    name: 'Leaning Forward',
    description: 'User is leaning toward the camera',
    context: 'engaged, interested, attentive, focused',
    emotion: 'interested, engaged, curious'
  },
  'leaning_back': {
    name: 'Leaning Back',
    description: 'User is leaning away from camera',
    context: 'relaxed, casual, thinking, considering',
    emotion: 'relaxed, contemplative, casual'
  },
  'arms_crossed': {
    name: 'Arms Crossed',
    description: 'Arms folded across chest',
    context: 'defensive, closed off, thinking, cold',
    emotion: 'defensive, skeptical, closed'
  },
  'arms_open': {
    name: 'Arms Open',
    description: 'Arms spread wide or gesturing openly',
    context: 'welcoming, explaining, presenting, open',
    emotion: 'welcoming, open, expressive'
  },
  'hands_on_face': {
    name: 'Hands on Face',
    description: 'One or both hands touching face',
    context: 'thinking, tired, stressed, contemplating',
    emotion: 'thoughtful, tired, stressed'
  },
  'sitting_upright': {
    name: 'Sitting Upright',
    description: 'Good posture, sitting straight',
    context: 'attentive, professional, focused, alert',
    emotion: 'alert, professional, engaged'
  },
  'slouching': {
    name: 'Slouching',
    description: 'Poor posture, shoulders dropped',
    context: 'tired, casual, disengaged, relaxed',
    emotion: 'tired, casual, disengaged'
  }
};

// Function to analyze pose landmarks and classify pose
export const analyzePose = (landmarks) => {
  if (!landmarks || landmarks.length === 0) return null;
  
  const poses = [];
  const keypoints = landmarks[0]; // First person's landmarks
  
  if (keypoints.length < 33) return null;
  
  // Calculate shoulder slope to detect leaning
  const leftShoulder = keypoints[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = keypoints[POSE_LANDMARKS.RIGHT_SHOULDER];
  const nose = keypoints[POSE_LANDMARKS.NOSE];
  
  if (leftShoulder && rightShoulder && nose) {
    // Check if leaning forward (nose closer to camera than shoulders)
    if (nose.z < (leftShoulder.z + rightShoulder.z) / 2 - 0.05) {
      poses.push('leaning_forward');
    }
    // Check if leaning back
    else if (nose.z > (leftShoulder.z + rightShoulder.z) / 2 + 0.05) {
      poses.push('leaning_back');
    }
    
    // Check posture based on shoulder height relative to hips
    const leftHip = keypoints[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = keypoints[POSE_LANDMARKS.RIGHT_HIP];
    
    if (leftHip && rightHip) {
      const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
      const hipY = (leftHip.y + rightHip.y) / 2;
      const torsoLength = Math.abs(shoulderY - hipY);
      
      // If shoulders are significantly higher than expected, user is sitting upright
      if (torsoLength > 0.3) {
        poses.push('sitting_upright');
      } else if (torsoLength < 0.2) {
        poses.push('slouching');
      }
    }
  }
  
  // Check for arms crossed (wrists close to opposite elbows)
  const leftWrist = keypoints[POSE_LANDMARKS.LEFT_WRIST];
  const rightWrist = keypoints[POSE_LANDMARKS.RIGHT_WRIST];
  const leftElbow = keypoints[POSE_LANDMARKS.LEFT_ELBOW];
  const rightElbow = keypoints[POSE_LANDMARKS.RIGHT_ELBOW];
  
  if (leftWrist && rightWrist && leftElbow && rightElbow) {
    const leftWristToRightElbow = Math.sqrt(
      Math.pow(leftWrist.x - rightElbow.x, 2) + 
      Math.pow(leftWrist.y - rightElbow.y, 2)
    );
    const rightWristToLeftElbow = Math.sqrt(
      Math.pow(rightWrist.x - leftElbow.x, 2) + 
      Math.pow(rightWrist.y - leftElbow.y, 2)
    );
    
    if (leftWristToRightElbow < 0.1 && rightWristToLeftElbow < 0.1) {
      poses.push('arms_crossed');
    }
    
    // Check for arms open (wrists far from body center)
    const bodyCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    
    const leftWristDistance = Math.sqrt(
      Math.pow(leftWrist.x - bodyCenter.x, 2) + 
      Math.pow(leftWrist.y - bodyCenter.y, 2)
    );
    const rightWristDistance = Math.sqrt(
      Math.pow(rightWrist.x - bodyCenter.x, 2) + 
      Math.pow(rightWrist.y - bodyCenter.y, 2)
    );
    
    if (leftWristDistance > 0.3 && rightWristDistance > 0.3) {
      poses.push('arms_open');
    }
  }
  
  // Check for hands on face
  if (leftWrist && rightWrist && nose) {
    const leftHandToFace = Math.sqrt(
      Math.pow(leftWrist.x - nose.x, 2) + 
      Math.pow(leftWrist.y - nose.y, 2)
    );
    const rightHandToFace = Math.sqrt(
      Math.pow(rightWrist.x - nose.x, 2) + 
      Math.pow(rightWrist.y - nose.y, 2)
    );
    
    if (leftHandToFace < 0.15 || rightHandToFace < 0.15) {
      poses.push('hands_on_face');
    }
  }
  
  return poses;
};

// Function to create context string for LLM
export const createGestureContext = (gestureResults, poseResults) => {
  const context = {
    gestures: [],
    poses: [],
    overall_body_language: '',
    emotional_indicators: []
  };
  
  // Process gesture results
  if (gestureResults && gestureResults.gestures) {
    gestureResults.gestures.forEach((handGestures, handIndex) => {
      if (handGestures.length > 0) {
        const topGesture = handGestures[0];
        const gestureInfo = SUPPORTED_GESTURES[topGesture.categoryName];
        
        if (gestureInfo && topGesture.score > 0.7) {
          context.gestures.push({
            hand: handIndex === 0 ? 'left' : 'right',
            gesture: gestureInfo.name,
            confidence: Math.round(topGesture.score * 100),
            context: gestureInfo.context,
            emotion: gestureInfo.emotion
          });
          
          context.emotional_indicators.push(gestureInfo.emotion);
        }
      }
    });
  }
  
  // Process pose results
  if (poseResults && poseResults.landmarks) {
    const detectedPoses = analyzePose(poseResults.landmarks);
    
    if (detectedPoses) {
      detectedPoses.forEach(poseKey => {
        const poseInfo = POSE_CLASSIFICATIONS[poseKey];
        if (poseInfo) {
          context.poses.push({
            pose: poseInfo.name,
            context: poseInfo.context,
            emotion: poseInfo.emotion
          });
          
          context.emotional_indicators.push(poseInfo.emotion);
        }
      });
    }
  }
  
  // Create overall body language summary
  if (context.gestures.length > 0 || context.poses.length > 0) {
    const gestureDescriptions = context.gestures.map(g => g.gesture).join(', ');
    const poseDescriptions = context.poses.map(p => p.pose).join(', ');
    
    context.overall_body_language = [
      gestureDescriptions && `Gestures: ${gestureDescriptions}`,
      poseDescriptions && `Posture: ${poseDescriptions}`
    ].filter(Boolean).join('. ');
  }
  
  return context;
};

// Function to format context for LLM prompt
export const formatContextForLLM = (gestureContext) => {
  if (!gestureContext || (gestureContext.gestures.length === 0 && gestureContext.poses.length === 0)) {
    return '';
  }
  
  let contextString = '\n\n**Body Language Context:**\n';
  
  if (gestureContext.overall_body_language) {
    contextString += `- Overall: ${gestureContext.overall_body_language}\n`;
  }
  
  if (gestureContext.gestures.length > 0) {
    contextString += '- Hand Gestures: ';
    contextString += gestureContext.gestures.map(g => 
      `${g.gesture} (${g.confidence}% confidence, indicates: ${g.context})`
    ).join(', ') + '\n';
  }
  
  if (gestureContext.poses.length > 0) {
    contextString += '- Body Posture: ';
    contextString += gestureContext.poses.map(p => 
      `${p.pose} (indicates: ${p.context})`
    ).join(', ') + '\n';
  }
  
  if (gestureContext.emotional_indicators.length > 0) {
    const uniqueEmotions = [...new Set(gestureContext.emotional_indicators)];
    contextString += `- Emotional Indicators: ${uniqueEmotions.join(', ')}\n`;
  }
  
  return contextString;
};
