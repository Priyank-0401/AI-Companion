import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Viseme-Based Lip Sync Hook
 * Uses SpeechSynthesisUtterance.onboundary to detect word boundaries
 * and applies phonetic rules to control mouth shape multipliers
 */
export const useVisemeLipSync = () => {
  const [visemeMultiplier, setVisemeMultiplier] = useState(1.0);
  const [currentWord, setCurrentWord] = useState('');
  const [isActive, setIsActive] = useState(false);
  const currentUtteranceRef = useRef(null);
  const resetTimeoutRef = useRef(null);

  // Phonetic sound rules for mouth shape control
  const soundRules = {
    // Open sounds - vowels and diphthongs that require wide mouth opening
    OPEN_SOUNDS: {
      vowels: ['a', 'ah', 'aa', 'o', 'oh', 'oo', 'ou', 'aw', 'ay', 'au'],
      multiplier: 1.8, // Exaggerate mouth opening
      patterns: [
        /[aeiou]{2,}/i, // Multiple vowels together
        /a[wh]/i,       // 'aw', 'ah' sounds
        /o[wh]/i,       // 'ow', 'oh' sounds
        /[aeiou]y/i     // Vowel + y combinations
      ]
    },
    
    // Closed sounds - consonants that require mouth closure
    CLOSED_SOUNDS: {
      consonants: ['m', 'b', 'p', 'w', 'v', 'f'],
      multiplier: 0.1, // Almost close the mouth
      patterns: [
        /^[mbp]/i,      // Words starting with m, b, p
        /^w[aeiou]/i,   // Words starting with w + vowel
        /[mbp]$/i,      // Words ending with m, b, p
        /mm|bb|pp/i     // Double consonants
      ]
    },
    
    // Mid sounds - consonants that are in middle position
    MID_SOUNDS: {
      consonants: ['s', 't', 'l', 'r', 'n', 'd', 'k', 'g', 'h', 'j', 'z', 'c'],
      multiplier: 0.7, // Moderate mouth opening
      patterns: [
        /^[stlrn]/i,    // Words starting with these consonants
        /[tdkg]$/i,     // Words ending with these consonants
        /th|sh|ch/i,    // Common consonant combinations
        /ng|nk/i        // Nasal combinations
      ]
    }
  };

  /**
   * Analyze a word and determine the appropriate viseme multiplier
   */
  const analyzeWord = useCallback((word) => {
    if (!word || typeof word !== 'string') return 1.0;
    
    const cleanWord = word.toLowerCase().trim();
    if (cleanWord.length === 0) return 1.0;

    // Check for open sounds first (highest priority)
    const hasOpenSound = soundRules.OPEN_SOUNDS.vowels.some(vowel => 
      cleanWord.includes(vowel)
    ) || soundRules.OPEN_SOUNDS.patterns.some(pattern => 
      pattern.test(cleanWord)
    );

    if (hasOpenSound) {
      return soundRules.OPEN_SOUNDS.multiplier;
    }

    // Check for closed sounds
    const hasClosedSound = soundRules.CLOSED_SOUNDS.consonants.some(consonant => 
      cleanWord.includes(consonant)
    ) || soundRules.CLOSED_SOUNDS.patterns.some(pattern => 
      pattern.test(cleanWord)
    );

    if (hasClosedSound) {
      return soundRules.CLOSED_SOUNDS.multiplier;
    }

    // Check for mid sounds
    const hasMidSound = soundRules.MID_SOUNDS.consonants.some(consonant => 
      cleanWord.includes(consonant)
    ) || soundRules.MID_SOUNDS.patterns.some(pattern => 
      pattern.test(cleanWord)
    );

    if (hasMidSound) {
      return soundRules.MID_SOUNDS.multiplier;
    }

    // Default multiplier for unclassified words
    return 1.0;
  }, []);

  /**
   * Handle word boundary events from SpeechSynthesisUtterance
   */
  const handleWordBoundary = useCallback((event) => {
    if (event.name === 'word') {
      const word = event.utterance.text.substring(
        event.charIndex,
        event.charIndex + event.charLength
      );
      
      setCurrentWord(word);
      const multiplier = analyzeWord(word);
      setVisemeMultiplier(multiplier);
      
      // Reset to default after a delay to prevent getting stuck
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      
      resetTimeoutRef.current = setTimeout(() => {
        setVisemeMultiplier(1.0);
        setCurrentWord('');
      }, 500); // Reset after 500ms
    }
  }, [analyzeWord]);

  /**
   * Attach viseme analysis to a SpeechSynthesisUtterance
   */
  const attachToUtterance = useCallback((utterance) => {
    if (!(utterance instanceof SpeechSynthesisUtterance)) {
      console.warn('⚠️ attachToUtterance: Invalid utterance object');
      return;
    }

    // Store reference to current utterance
    currentUtteranceRef.current = utterance;
    
    // Attach boundary event listener
    utterance.addEventListener('boundary', handleWordBoundary);
    
    // Track when speech starts and ends
    utterance.addEventListener('start', () => {
      setIsActive(true);
      setVisemeMultiplier(1.0);
    });
    
    utterance.addEventListener('end', () => {
      setIsActive(false);
      setVisemeMultiplier(1.0);
      setCurrentWord('');
      currentUtteranceRef.current = null;
    });
    
    utterance.addEventListener('error', () => {
      setIsActive(false);
      setVisemeMultiplier(1.0);
      setCurrentWord('');
      currentUtteranceRef.current = null;
    });

    console.log('✅ Viseme lip-sync attached to utterance');
  }, [handleWordBoundary]);

  /**
   * Detach from current utterance
   */
  const detachFromUtterance = useCallback(() => {
    if (currentUtteranceRef.current) {
      currentUtteranceRef.current.removeEventListener('boundary', handleWordBoundary);
      currentUtteranceRef.current = null;
    }
    
    setIsActive(false);
    setVisemeMultiplier(1.0);
    setCurrentWord('');
    
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, [handleWordBoundary]);

  /**
   * Get debug information about current state
   */
  const getDebugInfo = useCallback(() => {
    return {
      visemeMultiplier,
      currentWord,
      isActive,
      hasUtterance: !!currentUtteranceRef.current,
      soundRules: Object.keys(soundRules).reduce((acc, key) => {
        acc[key] = soundRules[key].multiplier;
        return acc;
      }, {})
    };
  }, [visemeMultiplier, currentWord, isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      detachFromUtterance();
    };
  }, [detachFromUtterance]);

  return {
    visemeMultiplier,
    currentWord,
    isActive,
    attachToUtterance,
    detachFromUtterance,
    getDebugInfo
  };
};

export default useVisemeLipSync;
