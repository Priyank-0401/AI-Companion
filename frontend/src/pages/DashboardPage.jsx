import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { 
  Activity, 
  Calendar, 
  Heart, 
  MessageSquare, 
  BookOpen, 
  Target, 
  Award, 
  Clock, 
  Smile, 
  Info,
  TrendingUp,
  RefreshCw,
  Activity as ActivityIcon
} from 'lucide-react';
import { useAuth } from '../auth/context/AuthContext';
import { journalApi, chatApi } from '../services/api';
import { useMoodTracking } from '../hooks/useMoodTracking';

// Dashboard Components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import OverviewCards from '../components/dashboard/OverviewCards';
import MoodTrackerCard from '../components/dashboard/MoodTrackerCard';
import QuickActions from '../components/dashboard/QuickActions';
import QuoteCard from '../components/dashboard/QuoteCard';
import MoodTimelineChart from '../components/dashboard/MoodTimelineChart';

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7'); // 7, 14, or 30 days;
  
  // Use the mood tracking hook
  const { moodHistory, loading: moodLoading } = useMoodTracking(currentUser?.uid);
  
  const [dashboardData, setDashboardData] = useState({
    moodStats: { current: 0, trend: 0 },
    journalStats: { total: 0, weekly: 0 },
    chatStats: { total: 0, weekly: 0 },
    moodEntries: [],
    recentActivity: [],
  });

  // Format date for API requests
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Calculate start of week
  const getStartOfWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(now.setDate(diff));
  };

  // Process mood data when moodHistory or timeRange changes
  useEffect(() => {
    if (!currentUser) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const startDate = subDays(new Date(), parseInt(timeRange));
        const startOfWeek = getStartOfWeek();

        // Filter mood entries by selected time range
        const filteredMoodEntries = moodHistory
          .filter(entry => entry.date >= startDate)
          .map(entry => ({
            timestamp: entry.date.toISOString(),
            mood: entry.mood,
            notes: entry.notes || ''
          }));

        // Calculate mood stats
        const currentMood = moodHistory[0]?.mood || 0;
        const previousMood = moodHistory[1]?.mood || 0;
        const moodTrend = moodHistory.length > 1 ? currentMood - previousMood : 0;

        // Fetch other data in parallel
        const [journalResponse, chatResponse] = await Promise.all([
          journalApi.getStats().catch(() => ({ data: { total: 0, weekly: 0 } })),
          chatApi.getConversations().catch(() => ({ data: [] })),
        ]);

        // Process journal stats
        const journalStats = {
          total: journalResponse.data?.total || 0,
          weekly: journalResponse.data?.weekly || 0,
        };

        // Process chat stats
        const chatStats = {
          total: chatResponse.data?.length || 0,
          weekly: chatResponse.data?.filter(chat => 
            new Date(chat.updatedAt) >= startOfWeek
          ).length || 0,
        };

        // Process recent activity
        const recentActivity = [
          { icon: <Activity />, label: 'Recent Activity' },
          { icon: <Calendar />, label: 'Upcoming Events' },
          { icon: <Heart />, label: 'Mood Tracking' },
          { icon: <MessageSquare />, label: 'Conversations' },
          { icon: <BookOpen />, label: 'Journal Entries' },
          { icon: <Target />, label: 'Goals' },
          { icon: <Award />, label: 'Achievements' },
          { icon: <Clock />, label: 'Time Management' },
          { icon: <Smile />, label: 'Mood Insights' },
          { icon: <Info />, label: 'Wellness Tips' },
        ];

        setDashboardData({
          moodStats: {
            current: currentMood,
            trend: moodTrend
          },
          journalStats,
          chatStats,
          moodEntries: filteredMoodEntries,
          recentActivity,
        });
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser, timeRange, moodHistory]);

  // Refresh dashboard data
  const refreshData = () => {
    // The moodHistory will automatically update via the useMoodTracking hook
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const handleQuickAction = (action) => {
    // Handle quick actions (e.g., navigation)
    console.log('Quick action:', action);
    // You can implement navigation logic here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-indigo-200 dark:bg-indigo-800 rounded-full mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 max-w-md mx-auto">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Something went wrong</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="container mx-auto px-4 py-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={item}>
        <DashboardHeader />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item} className="mb-8">
        <QuickActions onAction={handleQuickAction} />
      </motion.div>

      {/* Overview Cards */}
      <motion.div variants={item} className="mb-8">
        <OverviewCards stats={dashboardData} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Mood Tracker */}
        <motion.div variants={item} className="lg:col-span-2">
          <MoodTrackerCard />
        </motion.div>

        {/* Quote Card */}
        <motion.div variants={item}>
          <QuoteCard />
        </motion.div>
      </div>

      {/* Mood Timeline Chart */}
      <motion.div variants={item} className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Mood Timeline</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Track your mood changes over time</p>
            </div>
            <div className="flex items-center space-x-2 mt-3 md:mt-0">
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              >
                <option value="7">Last 7 days</option>
                <option value="14">Last 14 days</option>
                <option value="30">Last 30 days</option>
              </select>
              <button 
                onClick={refreshData}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          <div className="h-80 w-full">
            {dashboardData.moodEntries?.length > 0 ? (
              <MoodTimelineChart moodData={dashboardData.moodEntries} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <ActivityIcon className="w-12 h-12 mb-4" />
                <p>No mood data available. Start tracking your mood to see your timeline.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div variants={item} className="text-center text-sm text-gray-500 dark:text-gray-400 mt-12">
        <p>Your wellness journey, one day at a time.</p>
      </motion.div>
    </motion.div>
  );
};

export default DashboardPage;
