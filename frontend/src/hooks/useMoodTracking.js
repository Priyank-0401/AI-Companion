import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const useMoodTracking = (userId, startDate = null, endDate = null) => {
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

  // Fetch mood history with optional date range
  useEffect(() => {
    if (!userId) return;

    const fetchMoodHistory = async (startDate = null, endDate = null) => {
      try {
        setLoading(true);
        setError(null);
        
        // Create base query with required filters
        const baseQuery = [
          where('userId', '==', userId),
          orderBy('timestamp', 'desc')
        ];
        
        // Add date range filters if provided
        const queryConstraints = [...baseQuery];
        if (startDate) {
          queryConstraints.push(where('timestamp', '>=', Timestamp.fromDate(new Date(startDate))));
        }
        if (endDate) {
          queryConstraints.push(where('timestamp', '<=', Timestamp.fromDate(new Date(endDate))));
        }
        
        // Create the query
        const q = query(collection(db, 'moodEntries'), ...queryConstraints);
        
        // Set up real-time listener
        const unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const entries = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              entries.push({
                id: doc.id,
                ...data,
                date: data.timestamp?.toDate()
              });
            });
            setMoodHistory(entries);
          }, 
          (err) => {
            console.error('Error fetching mood history:', err);
            setError('Failed to load mood history. Please try again.');
          }
        );

        // Clean up listener on unmount
        return () => {
          try {
            unsubscribe();
          } catch (error) {
            console.error('Error unsubscribing from mood history:', error);
          }
        };
      } catch (err) {
        console.error('Error setting up mood history listener:', err);
        setError('Failed to load mood history. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have valid dates
    if (startDate && endDate) {
      fetchMoodHistory(startDate, endDate);
    }
  }, [userId, startDate, endDate]);

  return {
    mood,
    loading,
    error,
    moodHistory,
    logMood
  };
};
