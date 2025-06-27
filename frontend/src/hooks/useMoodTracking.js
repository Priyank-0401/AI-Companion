import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const useMoodTracking = (userId) => {
  const [mood, setMood] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);

  // Log a new mood entry
  const logMood = async (moodValue, notes = '') => {
    if (loading) return false; // Prevent multiple clicks
    
    setLoading(true);
    setError(null);
    
    try {
      await addDoc(collection(db, 'moodEntries'), {
        userId,
        mood: moodValue,
        notes,
        timestamp: serverTimestamp()
      });
      
      setMood(moodValue);
      
      // Reset mood after 2 seconds
      setTimeout(() => {
        setMood(null);
      }, 2000);
      
      return true;
    } catch (err) {
      console.error('Error logging mood:', err);
      setError('Failed to log mood. Please try again.');
      return false;
    } finally {
      // Small delay to ensure smooth UI transition
      setTimeout(() => setLoading(false), 300);
    }
  };

  // Fetch mood history
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'moodEntries'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(7) // Last 7 entries
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = [];
      snapshot.forEach((doc) => {
        entries.push({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamp to Date
          date: doc.data().timestamp?.toDate()
        });
      });
      setMoodHistory(entries);
    }, (err) => {
      console.error('Error fetching mood history:', err);
      setError('Failed to load mood history');
    });

    return () => unsubscribe();
  }, [userId]);

  return {
    mood,
    loading,
    error,
    moodHistory,
    logMood
  };
};
