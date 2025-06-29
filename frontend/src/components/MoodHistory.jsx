import { useEffect, useState, useMemo, useCallback } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Line } from 'react-chartjs-2';
import { format, subDays, addDays, startOfDay, endOfDay, isToday, isFuture } from 'date-fns';
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
  const moodData = useMemo(() => {
    const today = new Date();
    const daysInView = 10; // 7 past days + today + 2 future days
    const startDayOffset = 7; // Show 7 days before today
    
    // Initialize days array with past, today, and future dates
    const days = [];
    for (let i = -startDayOffset; i < daysInView - startDayOffset; i++) {
      const date = addDays(today, i);
      days.push({
        date,
        dateKey: format(date, 'MMM dd'),
        isToday: isToday(date),
        isFuture: isFuture(date),
        moods: []
      });
    }

    // Fill with actual data
    entries.forEach(entry => {
      const entryDate = entry.date;
      const day = days.find(d => 
        format(d.date, 'yyyy-MM-dd') === format(entryDate, 'yyyy-MM-dd')
      );
      if (day) {
        day.moods.push(entry.mood);
      }
    });

    // Prepare chart data
    const labels = days.map(day => ({
      label: format(day.date, 'MMM dd'),
      isToday: day.isToday,
      isFuture: day.isFuture
    }));
    
    const data = days.map(day => {
      if (day.isFuture) return null;
      return day.moods.length > 0 
        ? (day.moods.reduce((sum, mood) => sum + mood, 0) / day.moods.length).toFixed(1)
        : null;
    });

    // Calculate weekly average
    const pastWeekMoods = days
      .filter(day => !day.isFuture && !day.isToday && day.moods.length > 0)
      .flatMap(day => day.moods);
    const weeklyAverage = pastWeekMoods.length > 0 
      ? (pastWeekMoods.reduce((sum, mood) => sum + mood, 0) / pastWeekMoods.length).toFixed(1)
      : null;

    return {
      ...chartDataTemplate,
      labels: labels.map(l => l.label),
      datasets: [{
        ...chartDataTemplate.datasets[0],
        data,
        borderWidth: 2,
        pointRadius: (ctx) => labels[ctx.dataIndex]?.isToday ? 6 : 3,
        pointBackgroundColor: (ctx) => labels[ctx.dataIndex]?.isToday ? '#00ADB5' : '#00ADB5',
        pointHoverRadius: 8
      }],
      weeklyAverage
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
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium">Mood Tracker</h3>
          <p className="text-sm text-[#EEEEEE]/70">
            {moodData.weeklyAverage 
              ? `Weekly average: ${moodData.weeklyAverage}/5` 
              : 'Track your daily mood to see trends'}
          </p>
        </div>
        <div className="flex items-center text-sm bg-[#00ADB5]/10 px-3 py-1 rounded-full">
          <span className="inline-block w-2 h-2 rounded-full bg-[#00ADB5] mr-2"></span>
          <span>Your Mood</span>
        </div>
      </div>
      
      <div className="h-56 relative">
        <Line 
          data={moodData} 
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                grid: {
                  display: false,
                  drawBorder: false
                },
                ticks: {
                  autoSkip: false,
                  maxRotation: 0,
                  minRotation: 0,
                  color: (context) => {
                    if (moodData.labels[context.index]?.isToday) return '#00ADB5';
                    if (moodData.labels[context.index]?.isFuture) return 'rgba(238, 238, 238, 0.3)';
                    return 'rgba(238, 238, 238, 0.7)';
                  },
                  font: {
                    weight: (context) => moodData.labels[context.index]?.isToday ? 'bold' : 'normal'
                  }
                },
                border: {
                  display: false
                }
              },
              y: {
                min: 1,
                max: 5.5, // Add some padding at the top
                beginAtZero: false,
                afterFit: (scaleInstance) => {
                  scaleInstance.paddingTop = 15; // Add padding to the top of the y-axis
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.05)',
                  borderDash: [4, 4]
                },
                border: {
                  display: false
                },
                ticks: {
                  stepSize: 1,
                  callback: (value) => {
                    if (value === 1) return '😢 Poor';
                    if (value === 2) return '😕 Not great';
                    if (value === 3) return '😐 Okay';
                    if (value === 4) return '🙂 Good';
                    if (value === 5) return '😊 Great';
                    return '';
                  },
                  color: 'rgba(238, 238, 238, 0.7)'
                }
              }
            },
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: '#222831',
                titleColor: '#EEEEEE',
                bodyColor: '#00ADB5',
                borderColor: 'rgba(0, 173, 181, 0.3)',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                  label: (context) => {
                    const value = context.raw;
                    if (value === null) return 'No data';
                    const moodText = [
                      '',
                      '😢 Poor (1)',
                      '😕 Not great (2)',
                      '😐 Okay (3)',
                      '🙂 Good (4)',
                      '😊 Great (5)'
                    ][Math.round(value)];
                    return `Mood: ${moodText}`;
                  },
                  title: (items) => {
                    const item = items[0];
                    const date = new Date();
                    const dayIndex = item.dataIndex - 7; // Adjust based on your data
                    date.setDate(date.getDate() + dayIndex);
                    return format(date, 'EEEE, MMM d');
                  }
                }
              }
            },
            interaction: {
              intersect: false,
              mode: 'index'
            },
            elements: {
              line: {
                tension: 0.4,
                borderWidth: 2
              },
              point: {
                hoverRadius: 8,
                hoverBorderWidth: 2
              }
            }
          }} 
        />
        
        {/* Date indicator */}
        <div className="absolute -bottom-5 left-0 right-0 flex justify-between px-2">
          <div className="text-xs text-[#EEEEEE]/50 mt-1">Past Week</div>
          <div className="text-xs text-[#00ADB5] font-medium -mt-6">Today</div>
          <div className="text-xs text-[#EEEEEE]/50 mt-1">Next Days</div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-center text-[#EEEEEE]/50">
        Track your mood daily to see your emotional patterns over time
      </div>
    </div>
  );
};

export default MoodHistory;
