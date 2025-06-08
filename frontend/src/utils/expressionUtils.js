// Expression utilities for Avatar component

/**
 * Analyze chatbot response text to determine appropriate facial expression
 * @param {string} text - The chatbot's response text
 * @param {string} context - Optional context about the conversation
 * @returns {string} - Expression name ('neutral', 'smile', 'frown', 'surprise')
 */
export const analyzeTextForExpression = (text, context = '') => {
  if (!text || typeof text !== 'string') {
    return 'neutral';
  }

  const lowerText = text.toLowerCase();
  const combinedText = `${lowerText} ${context.toLowerCase()}`;

  // Positive expressions - smile
  const positiveKeywords = [
    'great', 'wonderful', 'excellent', 'amazing', 'fantastic', 'good job',
    'well done', 'congratulations', 'awesome', 'brilliant', 'perfect',
    'love', 'happy', 'joy', 'excited', 'pleased', 'delighted', 'thrilled',
    'glad', 'cheerful', 'optimistic', 'positive', 'encouraging', 'proud',
    '😊', '😄', '😁', '🙂', '👍', '🎉', '✨', '💫'
  ];

  // Negative expressions - frown
  const negativeKeywords = [
    'sorry', 'unfortunately', 'sad', 'disappointed', 'concerned', 'worried',
    'trouble', 'problem', 'difficult', 'challenging', 'hard', 'tough',
    'upset', 'frustrated', 'annoyed', 'bothered', 'discouraged',
    'struggle', 'issue', 'mistake', 'error', 'wrong', 'bad',
    '😔', '😞', '😟', '😢', '😰', '😨', '💔', '😕'
  ];

  // Surprise expressions
  const surpriseKeywords = [
    'wow', 'oh my', 'incredible', 'unbelievable', 'surprising', 'unexpected',
    'amazing', 'astonishing', 'remarkable', 'extraordinary', 'impressive',
    'shocking', 'stunning', 'mind-blowing', 'fascinating', 'intriguing',
    '😲', '😮', '🤯', '😱', '🙀', '👀', '‼️', '⚡'
  ];

  // Check for expressions based on keyword frequency and context
  let positiveScore = 0;
  let negativeScore = 0;
  let surpriseScore = 0;

  positiveKeywords.forEach(keyword => {
    const matches = (combinedText.match(new RegExp(keyword, 'g')) || []).length;
    positiveScore += matches;
  });

  negativeKeywords.forEach(keyword => {
    const matches = (combinedText.match(new RegExp(keyword, 'g')) || []).length;
    negativeScore += matches;
  });

  surpriseKeywords.forEach(keyword => {
    const matches = (combinedText.match(new RegExp(keyword, 'g')) || []).length;
    surpriseScore += matches;
  });

  // Additional context-based scoring
  if (text.includes('!')) surpriseScore += 0.5;
  if (text.includes('?') && surpriseKeywords.some(k => lowerText.includes(k))) surpriseScore += 0.5;
  if (text.includes('...')) negativeScore += 0.3; // Often indicates hesitation or concern

  // Determine dominant expression
  const maxScore = Math.max(positiveScore, negativeScore, surpriseScore);
  
  if (maxScore === 0) {
    return 'neutral';
  } else if (positiveScore === maxScore && positiveScore > 0.5) {
    return 'smile';
  } else if (negativeScore === maxScore && negativeScore > 0.5) {
    return 'frown';
  } else if (surpriseScore === maxScore && surpriseScore > 0.5) {
    return 'surprise';
  }

  return 'neutral';
};

/**
 * Get expression duration based on text length and intensity
 * @param {string} expression - The expression type
 * @param {string} text - The text that triggered the expression
 * @returns {number} - Duration in milliseconds
 */
export const getExpressionDuration = (expression, text = '') => {
  const baseDuration = {
    'smile': 2500,
    'frown': 3000,
    'surprise': 2000,
    'neutral': 0,
    'blink': 150
  };

  const textLength = text.length;
  const lengthMultiplier = Math.min(1 + (textLength / 500), 2); // Max 2x duration for long text

  return baseDuration[expression] * lengthMultiplier;
};

/**
 * Map conversation context to expressions
 * @param {string} conversationType - Type of conversation ('greeting', 'question', 'advice', etc.)
 * @returns {string} - Appropriate expression
 */
export const getContextualExpression = (conversationType) => {
  const contextMap = {
    'greeting': 'smile',
    'goodbye': 'smile',
    'question': 'neutral',
    'advice': 'neutral',
    'concern': 'frown',
    'celebration': 'smile',
    'surprise': 'surprise',
    'error': 'frown',
    'success': 'smile'
  };

  return contextMap[conversationType] || 'neutral';
};

/**
 * Advanced phoneme mapping for better lip-sync
 * @param {number} frequency - Audio frequency
 * @param {number} volume - Audio volume
 * @returns {object} - Morph target mappings
 */
export const mapFrequencyToPhoneme = (frequency, volume) => {
  const morphTargets = {};
  const intensity = Math.min(volume * 2, 1.0);

  if (frequency < 300) {
    // Very low - U, O sounds
    morphTargets['mouthFunnel'] = intensity * 0.8;
    morphTargets['jawOpen'] = intensity * 0.3;
  } else if (frequency < 600) {
    // Low - O, UH sounds
    morphTargets['mouthOpen'] = intensity * 0.6;
    morphTargets['jawOpen'] = intensity * 0.4;
  } else if (frequency < 1200) {
    // Mid-low - A, E sounds
    morphTargets['mouthOpen'] = intensity * 0.8;
    morphTargets['jawOpen'] = intensity * 0.5;
  } else if (frequency < 2000) {
    // Mid - I, E sounds
    morphTargets['mouthSmile'] = intensity * 0.6;
    morphTargets['jawOpen'] = intensity * 0.3;
  } else if (frequency < 3000) {
    // High - consonants, S, T
    morphTargets['mouthPucker'] = intensity * 0.5;
    morphTargets['jawOpen'] = intensity * 0.2;
  } else {
    // Very high - sharp consonants
    morphTargets['mouthClose'] = intensity * 0.3;
    morphTargets['jawOpen'] = intensity * 0.1;
  }

  return morphTargets;
};

/**
 * Expression transition manager
 */
export class ExpressionManager {
  constructor() {
    this.currentExpression = 'neutral';
    this.expressionQueue = [];
    this.isTransitioning = false;
  }

  /**
   * Queue an expression with priority
   * @param {string} expression - Expression to queue
   * @param {number} duration - Duration in ms
   * @param {number} priority - Priority (higher = more important)
   */
  queueExpression(expression, duration = 3000, priority = 1) {
    const expressionItem = { expression, duration, priority, timestamp: Date.now() };
    
    // Insert based on priority
    let inserted = false;
    for (let i = 0; i < this.expressionQueue.length; i++) {
      if (this.expressionQueue[i].priority < priority) {
        this.expressionQueue.splice(i, 0, expressionItem);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      this.expressionQueue.push(expressionItem);
    }
  }

  /**
   * Get the next expression to display
   * @returns {string} - Expression name
   */
  getNextExpression() {
    if (this.expressionQueue.length === 0) {
      return this.currentExpression;
    }

    const nextExpression = this.expressionQueue.shift();
    this.currentExpression = nextExpression.expression;
    
    // Auto-return to neutral after duration
    setTimeout(() => {
      if (this.currentExpression === nextExpression.expression) {
        this.currentExpression = 'neutral';
      }
    }, nextExpression.duration);

    return this.currentExpression;
  }

  /**
   * Clear all queued expressions
   */
  clearQueue() {
    this.expressionQueue = [];
  }

  /**
   * Get current expression
   * @returns {string}
   */
  getCurrentExpression() {
    return this.currentExpression;
  }
}
