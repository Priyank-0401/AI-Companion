import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ScatterController,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  TimeSeriesScale,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ScatterController,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  TimeSeriesScale
);
import 'chartjs-adapter-date-fns';
import { format, parseISO, isSameDay } from 'date-fns';

// Helper function to get mood color based on mood value
const getMoodColor = (mood, opacity = 1) => {
  const colors = {
    1: `rgba(239, 68, 68, ${opacity})`,  // Red for very bad
    2: `rgba(249, 115, 22, ${opacity})`, // Orange for bad
    3: `rgba(234, 179, 8, ${opacity})`,  // Yellow for neutral
    4: `rgba(34, 197, 94, ${opacity})`,  // Green for good
    5: `rgba(16, 185, 129, ${opacity})`  // Teal for great
  };
  return colors[Math.round(mood)] || `rgba(156, 163, 175, ${opacity})`;
};

const MoodTimelineChart = ({ moodData = [] }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Process mood data to group by date and time
  const processMoodData = (data) => {
    if (!data || data.length === 0) return [];

    // Sort data by timestamp
    const sortedData = [...data].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    // Group by date while preserving time
    const groupedByDate = {};
    
    sortedData.forEach(entry => {
      const date = new Date(entry.timestamp);
      const dateKey = format(date, 'yyyy-MM-dd');
      const timeKey = format(date, 'HH:mm');
      
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      
      groupedByDate[dateKey].push({
        x: date,
        y: entry.mood,
        notes: entry.notes || '',
        time: timeKey
      });
    });

    return Object.entries(groupedByDate).map(([date, entries]) => ({
      date,
      entries: entries.sort((a, b) => a.x - b.x)
    }));
  };

  // Generate dataset for Chart.js
  const generateDatasets = (processedData) => {
    const datasets = [];
    const colors = [
      'rgba(0, 173, 181, 0.8)',    // Teal
      'rgba(100, 181, 246, 0.8)',  // Light Blue
      'rgba(159, 168, 218, 0.8)',  // Purple
      'rgba(77, 182, 172, 0.8)',   // Green
      'rgba(255, 138, 101, 0.8)',  // Orange
    ];

    processedData.forEach(({ date, entries }, index) => {
      const color = colors[index % colors.length];
      
      datasets.push({
        label: format(parseISO(date), 'MMM d, yyyy'),
        data: entries,
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
        showLine: true,
        pointBackgroundColor: (context) => {
          const value = context.raw.y;
          if (value >= 4) return '#4ade80'; // Green for good mood
          if (value >= 3) return '#a3e635'; // Lime for okay mood
          if (value >= 2) return '#facc15'; // Yellow for meh mood
          if (value >= 1) return '#fb923c'; // Orange for bad mood
          return '#ef4444'; // Red for very bad mood
        },
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      });
    });

    return datasets;
  };

  // Initialize or update chart
  useEffect(() => {
    if (!chartRef.current) return;

    // Cleanup previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    if (!moodData || moodData.length === 0) return;

    // Process mood data
    const processedData = processMoodData(moodData);
    const datasets = generateDatasets(processedData);

    // Sort datasets by date to ensure proper line connections
    const sortedDatasets = datasets.map(dataset => ({
      ...dataset,
      data: [...dataset.data].sort((a, b) => a.x - b.x)
    }));

    try {
      // Create chart instance
      const ctx = chartRef.current.getContext('2d');
      
      chartInstance.current = new ChartJS(ctx, {
        type: 'scatter',
        data: {
          datasets: sortedDatasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'day',
                tooltipFormat: 'PPp',
                displayFormats: {
                  hour: 'ha',
                  day: 'MMM d',
                  week: 'MMM d',
                  month: 'MMM yyyy',
                },
              },
              title: {
                display: true,
                text: 'Date',
                color: '#9ca3af',
                font: {
                  size: 12
                }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: '#9ca3af'
              }
            },
            y: {
              min: 0.5,
              max: 5.5,
              ticks: {
                stepSize: 1,
                color: '#9ca3af',
                callback: (value) => {
                  const moods = {
                    1: '😢',
                    2: '😕',
                    3: '😐',
                    4: '🙂',
                    5: '😊'
                  };
                  return moods[value] || value;
                },
              },
              title: {
                display: true,
                text: 'Mood',
                color: '#9ca3af',
                font: {
                  size: 12
                }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              }
            },
          },
          plugins: {
            tooltip: {
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              titleColor: '#f3f4f6',
              bodyColor: '#e5e7eb',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                title: (items) => {
                  const item = items[0];
                  const date = new Date(item.parsed.x);
                  return format(date, 'MMM d, yyyy');
                },
                label: (context) => {
                  const data = context.raw;
                  const date = new Date(data.x);
                  const timeString = format(date, 'h:mm a');
                  const moodText = `Mood: ${data.y}/5`;
                  const result = [
                    `Time: ${timeString}`,
                    moodText
                  ];
                  if (data.notes) {
                    result.push(`Notes: ${data.notes}`);
                  }
                  return result;
                },
                labelColor: (context) => {
                  const mood = context.raw.y;
                  const color = getMoodColor(mood);
                  return {
                    borderColor: 'transparent',
                    backgroundColor: color,
                    borderRadius: 2,
                  };
                }
              },
            },
            interaction: {
              intersect: false,
              mode: 'index'
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating chart:', error);
    }

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [moodData]);

  return (
    <div className="relative h-80 w-full">
      <canvas ref={chartRef} />
    </div>
  );
};

export default MoodTimelineChart;