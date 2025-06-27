import { useEffect, useState, useMemo, useCallback } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Line } from 'react-chartjs-2';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Smile, Frown, Meh, Loader2 } from 'lucide-react';

// Chart.js setup outside component to prevent recreation
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      min: 1,
      max: 5,
      ticks: {
        stepSize: 1
      }
    }
  },
  plugins: {
    legend: {
      display: false
    }
  }
};

const chartDataTemplate = {
  labels: [],
  datasets: [{
    label: 'Mood',
    data: [],
    borderColor: '#00ADB5',
    tension: 0.3,
    fill: true,
    backgroundColor: 'rgba(0, 173, 181, 0.1)'
  }]
};

const getMoodIcon = (mood) => {
  if (mood >= 4) return <Smile className="text-green-500" />;
  if (mood <= 2) return <Frown className="text-red-500" />;
  return <Meh className="text-yellow-500" />;
};

const MoodHistory = ({ userId }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Process entries into chart data
  const { moodData, recentMoods } = useMemo(() => {
    if (!entries.length) return { moodData: chartDataTemplate, recentMoods: [] };

    // Process for chart - group by day
    const groupedByDay = {};
    const today = new Date();
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateKey = format(date, 'MMM dd');
      groupedByDay[dateKey] = [];
    }

    // Fill with actual data
    entries.forEach(entry => {
      const dateKey = format(entry.date, 'MMM dd');
      if (groupedByDay[dateKey] !== undefined) {
        groupedByDay[dateKey].push(entry.mood);
      }
    });

    // Calculate average mood per day
    const labels = [];
    const data = [];
    
    Object.entries(groupedByDay).forEach(([date, moods]) => {
      labels.push(date);
      const avgMood = moods.length > 0 
        ? (moods.reduce((sum, mood) => sum + mood, 0) / moods.length).toFixed(1)
        : null;
      data.push(avgMood);
    });

    return {
      moodData: {
        ...chartDataTemplate,
        labels,
        datasets: [{
          ...chartDataTemplate.datasets[0],
          data
        }]
      },
      recentMoods: [...entries].reverse().slice(0, 5)
    };
  }, [entries]);

  // Fetch mood entries
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    
    // Get entries from the last 7 days
    const startDate = startOfDay(subDays(new Date(), 7));
    
    const q = query(
      collection(db, 'moodEntries'),
      where('userId', '==', userId),
      where('timestamp', '>=', startDate),
      orderBy('timestamp', 'desc'),
      limit(50) // Limit to 50 most recent entries for performance
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const fetchedEntries = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedEntries.push({
            id: doc.id,
            ...data,
            date: data.timestamp?.toDate()
          });
        });
        setEntries(fetchedEntries);
        setLoading(false);
      },
      (err) => {
        console.error('Error getting mood history:', err);
        setError('Failed to load mood history');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="animate-spin h-8 w-8 text-[#00ADB5]" />
        <p className="text-[#EEEEEE]/70">Loading your mood history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-[#393E46]/50 p-6 rounded-xl">
      <h3 className="text-lg font-medium mb-4">Your Mood This Week</h3>
      
      <div className="h-48 mb-6">
        <Line data={moodData} options={chartOptions} />
      </div>
      
      <div className="mt-6">
        <h4 className="text-md font-medium mb-3">Recent Moods</h4>
        <div className="space-y-2">
          {recentMoods.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-3 bg-[#222831]/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {getMoodIcon(entry.mood)}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {entry.mood >= 4 ? 'Good' : entry.mood <= 2 ? 'Could be better' : 'Neutral'}
                  </p>
                  {entry.notes && (
                    <p className="text-xs text-[#EEEEEE]/70 line-clamp-1">{entry.notes}</p>
                  )}
                </div>
              </div>
              <span className="text-xs text-[#EEEEEE]/50">
                {entry.date ? format(entry.date, 'MMM d, h:mm a') : ''}
              </span>
            </div>
          ))}
          
          {recentMoods.length === 0 && (
            <p className="text-center text-[#EEEEEE]/70 py-4">
              No mood entries yet. Check in with your feelings!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodHistory;
