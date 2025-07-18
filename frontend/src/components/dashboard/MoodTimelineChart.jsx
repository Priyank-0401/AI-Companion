import React, { useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../../contexts/useTheme';
import { Chart as ChartJS, LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Filler, Legend } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { format, parseISO, startOfWeek, endOfWeek, isToday, isSaturday, isSunday } from 'date-fns';
import { Frown, Angry, Meh, Smile, Laugh } from 'lucide-react';

// --- THIS IS THE KEY ---
// We define both a 'string' for the canvas and a 'component' for React.
const MOOD_CONFIG = {
  1: {
    emoji: '😞', // FOR CANVAS AXIS: Must be a simple text string.
    icon: <Frown size={24} />, // FOR JSX/REACT: Can be a full component.
    label: 'Awful',
    color: '#EF4444'
  },
  2: {
    emoji: '😠',
    icon: <Angry size={24} />,
    label: 'Bad',
    color: '#F97316'
  },
  3: {
    emoji: '😐',
    icon: <Meh size={24} />,
    label: 'Okay',
    color: '#EAB308'
  },
  4: {
    emoji: '🙂',
    icon: <Smile size={24} />,
    label: 'Good',
    color: '#22C55E'
  },
  5: {
    emoji: '😄',
    icon: <Laugh size={24} />,
    label: 'Great',
    color: '#14B8A6'
  },
};

// Generates the gradient fill for the chart area based on the average mood.
const getMoodGradient = (ctx, chartArea, avgMood) => {
  if (!ctx || !chartArea) return null;
  const moodColor = MOOD_CONFIG[Math.round(avgMood)]?.color || MOOD_CONFIG[3].color;
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, `${moodColor}60`);
  gradient.addColorStop(1, `${moodColor}00`);
  return gradient;
};

// A styled, empty container for our custom tooltip, which will be populated by Chart.js.
const CustomTooltip = React.forwardRef(({ isDark }, ref) => (
  <div
    ref={ref}
    className={`absolute pointer-events-none z-50 min-w-[180px] rounded-xl p-4 opacity-0 backdrop-blur-md transition-opacity duration-200 ${
      isDark
        ? 'bg-gray-800/80 text-white'
        : 'bg-white/80 text-gray-800'
    }`}
    style={{ transform: 'translate(-50%, calc(-100% - 15px))' }}
  ></div>
));
CustomTooltip.displayName = 'CustomTooltip';

const MoodTimelineChart = ({ moodData = [], isLoading = false, onLogMood }) => {
  const { isDark } = useTheme();
  const chartRef = useRef(null);
  const tooltipRef = useRef(null);
  const chartInstance = useRef(null);

  const themeColors = useMemo(() => ({
    light: {
      grid: 'rgba(0, 0, 0, 0.1)',
      ticks: '#6b7280', // gray-500
      ticksToday: '#111827', // gray-900
      pointBorder: '#FFFFFF',
      pointHoverBorder: '#4B5563', // gray-600
      trendLine: 'rgba(156, 163, 175, 0.5)', // gray-400
      weekendHighlight: 'rgba(0, 0, 0, 0.03)',
      tooltipNoteBorder: 'border-gray-300/50',
      tooltipNoteText: 'text-gray-500',
      tooltipPrimaryText: 'text-gray-900',
      tooltipSecondaryText: 'text-gray-600',
    },
    dark: {
      grid: 'rgba(255, 255, 255, 0.1)',
      ticks: '#9ca3af', // gray-400
      ticksToday: '#FFFFFF',
      pointBorder: '#111827', // gray-900
      pointHoverBorder: '#FFFFFF',
      trendLine: 'rgba(107, 114, 128, 0.5)', // gray-500
      weekendHighlight: 'rgba(255, 255, 255, 0.03)',
      tooltipNoteBorder: 'border-gray-600/50',
      tooltipNoteText: 'text-gray-400',
      tooltipPrimaryText: 'text-white',
      tooltipSecondaryText: 'text-gray-300',
    },
  }), []);

  const currentTheme = isDark ? themeColors.dark : themeColors.light;

  const { points, avgMood, trendLineData, frequentMood } = useMemo(() => {
    if (!moodData || moodData.length === 0) {
      return { points: [], avgMood: null, trendLineData: [], frequentMood: null };
    }
    const chartPoints = moodData
      .map(entry => {
        try {
          let timestamp;
          if (entry.timestamp?.toDate) timestamp = entry.timestamp.toDate();
          else if (entry.timestamp?._seconds) timestamp = new Date(entry.timestamp._seconds * 1000);
          else if (entry.timestamp instanceof Date) timestamp = entry.timestamp;
          else if (typeof entry.timestamp === 'string') timestamp = parseISO(entry.timestamp);
          else return null;
          if (isNaN(timestamp.getTime())) return null;
          const moodValue = Math.max(1, Math.min(5, Number(entry.mood)));
          return {
            x: timestamp.valueOf(), y: moodValue, note: entry.note || '',
            ...MOOD_CONFIG[Math.round(moodValue)],
          };
        } catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => a.x - b.x);
    if (chartPoints.length === 0) return { points: [], avgMood: null, trendLineData: [], frequentMood: null };
    let trendData = [];
    if (chartPoints.length >= 2) {
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      chartPoints.forEach(p => { sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumXX += p.x * p.x; });
      const n = chartPoints.length;
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      trendData = chartPoints.map(p => ({ x: p.x, y: slope * p.x + intercept }));
    }
    const overallAvgMood = chartPoints.reduce((sum, p) => sum + p.y, 0) / chartPoints.length;
    const moodCounts = chartPoints.reduce((acc, p) => { const label = MOOD_CONFIG[Math.round(p.y)].label; acc[label] = (acc[label] || 0) + 1; return acc; }, {});
    const mostFrequent = Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b, null);
    return {
      points: chartPoints, avgMood: overallAvgMood, trendLineData: trendData,
      frequentMood: mostFrequent ? { ...MOOD_CONFIG[Object.keys(MOOD_CONFIG).find(key => MOOD_CONFIG[key].label === mostFrequent)], label: mostFrequent } : null,
    };
  }, [moodData]);

  useEffect(() => {
    if (!chartRef.current) return;
    const ctx = chartRef.current.getContext('2d');
    if (chartInstance.current) chartInstance.current.destroy();

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    chartInstance.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        datasets: [{
          data: points,
          borderColor: MOOD_CONFIG[Math.round(avgMood)]?.color || MOOD_CONFIG[3].color,
          borderWidth: 3,
          pointBackgroundColor: (context) => context.raw.color,
          pointBorderColor: currentTheme.pointBorder, pointBorderWidth: 2, pointRadius: 6, pointHoverRadius: 8,
          pointHoverBorderWidth: 2, pointHoverBorderColor: currentTheme.pointHoverBorder,
          cubicInterpolationMode: 'monotone', fill: true,
          backgroundColor: (context) => getMoodGradient(context.chart.ctx, context.chart.chartArea, avgMood),
        }, {
          data: trendLineData,
          borderColor: currentTheme.trendLine, borderWidth: 2, borderDash: [5, 5],
          pointRadius: 0, fill: false,
        }],
      },
      options: {
        responsive: true, 
        maintainAspectRatio: false, 
        animation: { duration: 1000 },
        layout: {
          padding: { left: 20, right: 20 } // Add equal padding on both sides
        },
        scales: {
          x: {
            type: 'time', 
            time: { 
              unit: 'day', 
              displayFormats: { day: 'EEE' },
              tooltipFormat: 'EEE, MMM d, h:mm a'
            },
            min: weekStart.valueOf(), 
            max: weekEnd.valueOf(),
            grid: { display: false },
            offset: true,
            bounds: 'ticks', // This ensures the first and last ticks are fully visible
            ticks: { 
              color: (ctx) => isToday(new Date(ctx.tick.value)) ? currentTheme.ticksToday : currentTheme.ticks, 
              font: { 
                weight: (ctx) => isToday(new Date(ctx.tick.value)) ? 'bold' : 'normal' 
              }, 
              padding: 20, // Increased padding for better spacing
            },
            border: { display: false },
          },
          y: {
            min: 0.5, max: 5.5,
            grid: { color: currentTheme.grid, borderDash: [4, 4], drawBorder: false, },
            ticks: {
              color: currentTheme.ticks, padding: 15, stepSize: 1, font: { size: 14, family: "system-ui, sans-serif" },
              callback: (value) => {
                // This callback correctly uses the STRING 'emoji' property
                if (value % 1 === 0 && MOOD_CONFIG[value]) {
                  return `${MOOD_CONFIG[value].emoji} ${MOOD_CONFIG[value].label}`;
                }
                return '';
              },
            },
            border: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: (context) => {
              const tooltipEl = tooltipRef.current; if (!tooltipEl) return;
              const { tooltip } = context; if (tooltip.opacity === 0) { tooltipEl.style.opacity = 0; return; }
              const point = tooltip.dataPoints[0]?.raw;
              if (point) {
                tooltipEl.innerHTML = `
                  <div class="flex flex-col items-center text-center">
                    <div class="text-5xl mb-2">${point.emoji}</div>
                    <div class="font-bold text-lg ${currentTheme.tooltipPrimaryText}">${point.label}</div>
                    <div class="text-sm ${currentTheme.tooltipSecondaryText} mb-3">${format(point.x, 'EEE, MMM d, h:mm a')}</div>
                    ${point.note ? `<div class="text-left w-full mt-2 pt-2 border-t ${currentTheme.tooltipNoteBorder}"><p class="text-xs ${currentTheme.tooltipNoteText} italic">"${point.note}"</p></div>` : ''}
                  </div>`;
              }
              tooltipEl.style.opacity = 1; tooltipEl.style.left = `${tooltip.caretX}px`; tooltipEl.style.top = `${tooltip.caretY}px`;
            },
          },
          beforeDraw: (chart) => {
            const { ctx, chartArea: { top, bottom }, scales: { x } } = chart; ctx.save();
            const tickWidth = x.getPixelForTick(1) - x.getPixelForTick(0); if (isNaN(tickWidth)) return;
            x.ticks.forEach((tick, index) => {
              const date = new Date(tick.value);
              if (isSaturday(date) || isSunday(date)) { ctx.fillStyle = currentTheme.weekendHighlight; ctx.fillRect(x.getPixelForTick(index) - (tickWidth / 2), top, tickWidth, bottom - top); }
            });
            ctx.restore();
          }
        },
        interaction: { mode: 'index', intersect: false },
      },
    });
    return () => chartInstance.current?.destroy();
  }, [points, avgMood, trendLineData]);

  const hasData = points && points.length > 0;

  return (
    <div className={`relative h-96 w-full p-6 rounded-2xl flex flex-col transition-colors duration-300 ${
      isDark
        ? 'bg-gray-900'
        : 'bg-white border border-gray-200'
    }`}>
      <CustomTooltip ref={tooltipRef} isDark={isDark} />
      
      {isLoading ? (
        <div className="flex-grow flex items-center justify-center text-gray-400 dark:text-gray-500">Loading...</div>
      ) : hasData ? (
        <>
          <div className="flex-grow">
            <canvas ref={chartRef}></canvas>
          </div>
          <div className="flex-shrink-0 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50 flex justify-around text-center text-sm text-gray-500 dark:text-gray-400">
            {avgMood && (
              <div>
                <span className="font-semibold text-gray-600 dark:text-gray-300">Weekly Average</span>
                <p className="flex items-center justify-center gap-2 mt-1">
                  {/* This correctly uses the REACT COMPONENT 'icon' property */}
                  {MOOD_CONFIG[Math.round(avgMood)]?.icon}
                  <span>{MOOD_CONFIG[Math.round(avgMood)]?.label}</span>
                </p>
              </div>
            )}
            {frequentMood && (
              <div>
                <span className="font-semibold text-gray-600 dark:text-gray-300">Most Frequent</span>
                <p className="flex items-center justify-center gap-2 mt-1">
                  {/* This correctly uses the REACT COMPONENT 'icon' property */}
                  {frequentMood.icon}
                  <span>{frequentMood.label}</span>
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500">
          <span className="text-5xl mb-4">🌱</span>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No mood entries yet</h3>
          <p className="mt-1 max-w-xs">Start tracking how you feel to see your wellness journey.</p>
          <button onClick={onLogMood} className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
            Log Mood Now
          </button>
        </div>
      )}
    </div>
  );
};

// Register Chart.js components once
ChartJS.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Filler, Legend);

export default MoodTimelineChart;