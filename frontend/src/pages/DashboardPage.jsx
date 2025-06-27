import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity,
  Calendar,
  Brain,
  Heart,
  MessageSquare,
  BookOpen,
  Target,
  Award,
  Clock,
  Smile,
  Info,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Zap,
  Moon,
  Sun,
  BarChart3,
  Activity as ActivityIcon
} from 'lucide-react';
import { wellnessApi, journalApi, chatApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import MoodTracker from '../components/MoodTracker';
import MoodHistory from '../components/MoodHistory';

// Register Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DashboardPage = () => {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    moodStats: { current: 0, trend: 0 },
    energyStats: { current: 0, trend: 0 },
    journalStats: { total: 0, weekly: 0 },
    chatStats: { total: 0, weekly: 0 },
    recentMoods: [],
    recentActivity: [],
    goals: [
      {
        id: 'mood-tracking',
        title: 'Mood Tracking',
        current: 0,
        target: 7,
        unit: 'days',
        progress: 0
      },
      {
        id: 'journal-streak',
        title: 'Journaling Streak',
        current: 0,
        target: 30,
        unit: 'days',
        progress: 0
      }
    ],
    insights: [
      {
        id: 'welcome',
        title: 'Welcome to Your Dashboard',
        description: 'Start tracking your mood and journal entries to see personalized insights here.',
        type: 'info',
        icon: Info
      }
    ]
  })

  // Format date for API requests
  const formatDate = (date) => {
    return date.toISOString().split('T')[0]
  }

  // Calculate start of week
  const getStartOfWeek = () => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    return new Date(now.setDate(diff))
  }

  // Load dashboard data
  useEffect(() => {
    if (!currentUser) return
    
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get date ranges
        const today = new Date()
        const weekAgo = new Date()
        weekAgo.setDate(today.getDate() - 7)
        const startOfWeek = getStartOfWeek()
        
        // Fetch data from multiple APIs in parallel
        const [
          moodsResponse, 
          journalResponse, 
          chatResponse,
          wellnessResponse
        ] = await Promise.all([
          wellnessApi.getMoods({
            startDate: formatDate(weekAgo),
            endDate: formatDate(today)
          }).catch(() => ({ data: [] })),
          journalApi.getStats().catch(() => ({ data: { total: 0, weekly: 0 } })),
          chatApi.getConversations().catch(() => ({ data: [] })),
          wellnessApi.getStats().catch(() => ({
            data: { 
              mood: { current: 0, trend: 0 },
              energy: { current: 0, trend: 0 }
            } 
          }))
        ])
        
        // Process mood data
        const recentMoods = Array.isArray(moodsResponse.data) 
          ? moodsResponse.data.map(entry => ({
              date: new Date(entry.timestamp).toLocaleDateString(),
              mood: entry.mood,
              energy: entry.energy,
              notes: entry.notes
            }))
          : []
        
        // Calculate mood and energy stats
        const moodStats = wellnessResponse.data?.mood || { current: 0, trend: 0 }
        const energyStats = wellnessResponse.data?.energy || { current: 0, trend: 0 }
        
        // Process journal stats
        const journalStats = {
          total: journalResponse.data?.total || 0,
          weekly: journalResponse.data?.weekly || 0,
          lastEntry: journalResponse.data?.lastEntry
            ? new Date(journalResponse.data.lastEntry).toLocaleDateString()
            : 'Never'
        }
        
        // Process chat stats
        const chatStats = {
          total: chatResponse.data?.length || 0,
          weekly: chatResponse.data?.filter(chat => 
            new Date(chat.updatedAt) >= startOfWeek
          ).length || 0,
          lastChat: chatResponse.data?.[0]?.updatedAt
            ? new Date(chatResponse.data[0].updatedAt).toLocaleString()
            : 'Never'
        }
        
        // Generate recent activity
        const recentActivity = [
          ...(journalStats.lastEntry !== 'Never' ? [{
            id: 'journal-last',
            type: 'journal',
            description: 'Last journal entry',
            time: journalStats.lastEntry,
            icon: BookOpen
          }] : []),
          ...(chatStats.lastChat !== 'Never' ? [{
            id: 'chat-last',
            type: 'chat',
            description: 'Last conversation',
            time: chatStats.lastChat,
            icon: MessageSquare
          }] : []),
          ...(recentMoods.length > 0 ? [{
            id: 'mood-last',
            type: 'mood',
            description: `Mood: ${getMoodDescription(recentMoods[0].mood)}`,
            time: recentMoods[0].date,
            icon: moodStats.trend > 0 ? Sun : (moodStats.trend < 0 ? Moon : Smile)
          }] : [])
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 3)
        
        // Generate insights
        const insights = generateInsights({
          moodStats,
          energyStats,
          journalStats,
          recentMoods
        })
        
        // Generate goals based on user activity
        const goals = [
          {
            id: 'journal-goal',
            title: 'Weekly Journaling',
            progress: Math.min(100, Math.round((journalStats.weekly / 7) * 100)),
            target: 7,
            current: journalStats.weekly,
            unit: 'entries',
            icon: BookOpen
          },
          {
            id: 'mood-goal',
            title: 'Mood Tracking',
            progress: Math.min(100, recentMoods.length * 10), // 10% per mood entry
            target: 10,
            current: recentMoods.length,
            unit: 'entries',
            icon: Smile
          }
        ]
        
        setDashboardData({
          moodStats,
          energyStats,
          journalStats,
          chatStats,
          recentMoods,
          recentActivity,
          goals,
          insights
        })

      } catch (err) {
        console.error('Error loading dashboard data:', err)
        setError('Failed to load dashboard data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    loadDashboardData()
  }, [currentUser])
  
  // Helper function to get mood description
  const getMoodDescription = (score) => {
    if (score >= 4) return 'Great'
    if (score >= 3) return 'Good'
    if (score >= 2) return 'Okay'
    return 'Not great'
  }
  
  // Generate insights based on user data
  const generateInsights = (data) => {
    const insights = []
    
    // Mood trend insight
    if (data.moodStats.trend > 0) {
      insights.push({
        id: 'mood-trend-up',
        title: 'Positive Mood Trend',
        description: 'Your mood has been improving recently. Keep it up!',
        icon: TrendingUp,
        type: 'positive'
      })
    } else if (data.moodStats.trend < 0) {
      insights.push({
        id: 'mood-trend-down',
        title: 'Mood Fluctuation',
        description: 'Your mood has been fluctuating. Consider journaling about it.',
        icon: TrendingUp,
        type: 'neutral'
      })
    }
    
    // Journaling consistency
    if (data.journalStats.weekly >= 5) {
      insights.push({
        id: 'journal-consistency',
        title: 'Consistent Journaling',
        description: `You've journaled ${data.journalStats.weekly} times this week!`,
        icon: BookOpen,
        type: 'positive'
      })
    } else if (data.journalStats.weekly === 0) {
      insights.push({
        id: 'journal-reminder',
        title: 'Journal Reminder',
        description: 'You haven\'t journaled this week. Take a moment to reflect.',
        icon: BookOpen,
        type: 'reminder'
      })
    }
    
    // Energy level insight
    if (data.energyStats.current < 2.5) {
      insights.push({
        id: 'low-energy',
        title: 'Low Energy',
        description: 'Your energy levels seem low. Consider taking a break or resting.',
        icon: Zap,
        type: 'reminder'
      })
    }
    
    // Add default insight if none
    if (insights.length === 0) {
      insights.push({
        id: 'welcome',
        title: 'Welcome to Your Dashboard',
        description: 'Start tracking your mood and activities to see personalized insights here.',
        icon: Smile,
        type: 'neutral'
      })
    }
    
    return insights
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-background-secondary to-background-tertiary">
        <div className="text-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 rounded-full border-4 border-accent/20 border-t-accent mx-auto mb-6"
          />
          <p className="text-text-secondary">Loading your dashboard...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-background-secondary to-background-tertiary">
        <div className="text-center p-6 max-w-md bg-background-primary/50 backdrop-blur-sm rounded-xl border border-red-500/20">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">Something went wrong</h3>
          <p className="text-text-secondary mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-[#222831] to-[#393E46] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00ADB5]"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#222831] to-[#393E46] text-[#EEEEEE] overflow-y-auto">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mb-6 px-4 lg:px-8 py-6"
      >
        <div className="w-full flex justify-between items-center">
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <div className="bg-[#00ADB5]/20 px-4 py-2 rounded-lg">
            <Calendar className="w-5 h-5 inline mr-2" />
            <span className="font-medium">Today</span>
          </div>
        </div>
      </motion.header>

      <div className="w-full px-4 lg:px-8 pb-8 space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mood Tracker */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <MoodTracker userId={currentUser?.uid} />
          </motion.section>

          {/* Mood History */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <MoodHistory userId={currentUser?.uid} />
          </motion.section>
        </div>

        {/* Quick Stats */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <ActivityIcon className="mr-2 w-5 h-5" />
            Your Activity
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Mood Score */}
            <div className="bg-[#393E46]/50 backdrop-blur-md border border-[#00ADB5]/20 rounded-xl p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <Smile className="w-6 lg:w-8 h-6 lg:h-8 text-green-400" />
                <ArrowUp className="w-4 h-4 text-green-400" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">
                {dashboardData.moodStats.current.toFixed(1) || 'N/A'}
              </h3>
              <p className="text-sm lg:text-base text-[#EEEEEE]/70">Current Mood</p>
              <p className={`text-xs lg:text-sm ${
                dashboardData.moodStats.trend > 0 ? 'text-green-400' : 
                dashboardData.moodStats.trend < 0 ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {dashboardData.moodStats.trend > 0 ? '+' : ''}
                {dashboardData.moodStats.trend.toFixed(1)} this week
              </p>
            </div>

            {/* Energy Level */}
            <div className="bg-[#393E46]/50 backdrop-blur-md border border-[#00ADB5]/20 rounded-xl p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-6 lg:w-8 h-6 lg:h-8 text-blue-400" />
                <ArrowUp className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">
                {dashboardData.energyStats.current.toFixed(1) || 'N/A'}
              </h3>
              <p className="text-sm lg:text-base text-[#EEEEEE]/70">Energy Level</p>
              <p className={`text-xs lg:text-sm ${
                dashboardData.energyStats.trend > 0 ? 'text-blue-400' : 
                dashboardData.energyStats.trend < 0 ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {dashboardData.energyStats.trend > 0 ? '+' : ''}
                {dashboardData.energyStats.trend.toFixed(1)} this week
              </p>
            </div>

            {/* Journal Entries */}
            <div className="bg-[#393E46]/50 backdrop-blur-md border border-[#00ADB5]/20 rounded-xl p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <BookOpen className="w-6 lg:w-8 h-6 lg:h-8 text-purple-400" />
                <ArrowUp className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">
                {dashboardData.journalStats.total}
              </h3>
              <p className="text-sm lg:text-base text-[#EEEEEE]/70">Journal Entries</p>
              <p className="text-xs lg:text-sm text-purple-400">
                {dashboardData.journalStats.weekly} this week
              </p>
            </div>

            {/* Chat Sessions */}
            <div className="bg-[#393E46]/50 backdrop-blur-md border border-[#00ADB5]/20 rounded-xl p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <MessageSquare className="w-6 lg:w-8 h-6 lg:h-8 text-[#00ADB5]" />
                <ArrowUp className="w-4 h-4 text-[#00ADB5]" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">
                {dashboardData.chatStats.total}
              </h3>
              <p className="text-sm lg:text-base text-[#EEEEEE]/70">Chat Sessions</p>
              <p className="text-xs lg:text-sm text-[#00ADB5]">
                {dashboardData.chatStats.weekly} this week
              </p>
            </div>
          </div>
        </motion.section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">          {/* Left Column - Charts and Trends */}
          <div className="xl:col-span-2 space-y-6">
            {/* Emotion Trends Chart */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#393E46]/50 backdrop-blur-md border border-[#00ADB5]/20 rounded-xl p-4 lg:p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <h2 className="text-xl lg:text-2xl font-semibold text-white flex items-center mb-2 lg:mb-0">
                  <TrendingUp className="w-5 lg:w-6 h-5 lg:h-6 mr-2 lg:mr-3 text-[#00ADB5]" />
                  Emotion Trends
                </h2>
                <select className="bg-[#222831]/50 border border-[#00ADB5]/20 rounded-lg px-3 py-1 text-[#EEEEEE] text-sm">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 3 months</option>
                </select>
              </div>

              {/* Chart Area */}
              <div className="h-48 lg:h-64 flex items-end justify-between space-x-2">
                {dashboardData.recentMoods.length > 0 ? (
                  dashboardData.recentMoods.slice(0, 7).map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full max-w-8 flex flex-col space-y-1 mb-2">
                        {/* Mood Bar */}
                        <div 
                          className="bg-green-400 rounded-sm transition-all duration-500"
                          style={{ height: `${(day.mood / 5) * 80}px` }}
                          title={`Mood: ${day.mood.toFixed(1)}`}
                        ></div>
                        {/* Energy Bar */}
                        <div 
                          className="bg-blue-400 rounded-sm transition-all duration-500"
                          style={{ height: `${(day.energy / 5) * 80}px` }}
                          title={`Energy: ${day.energy.toFixed(1)}`}
                        ></div>
                      </div>
                      <span className="text-xs text-[#EEEEEE]/70">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="w-full flex items-center justify-center h-full">
                    <p className="text-[#EEEEEE]/50">No mood data available</p>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-[#00ADB5]/20">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded"></div>
                  <span className="text-sm text-[#EEEEEE]/70">Mood</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded"></div>
                  <span className="text-sm text-[#EEEEEE]/70">Energy</span>
                </div>
              </div>
            </motion.section>

            {/* Goals Progress */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#393E46]/50 backdrop-blur-md border border-[#00ADB5]/20 rounded-xl p-4 lg:p-6"
            >
              <h2 className="text-xl lg:text-2xl font-semibold text-white flex items-center mb-4 lg:mb-6">
                <Target className="w-5 lg:w-6 h-5 lg:h-6 mr-2 lg:mr-3 text-[#00ADB5]" />
                Your Goals
              </h2>

              <div className="space-y-4">
                {dashboardData.goals && dashboardData.goals.length > 0 ? dashboardData.goals.map((goal) => (
                  <div key={goal.id} className="bg-[#222831]/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-white text-sm lg:text-base">{goal.title}</h3>
                      <span className="text-sm text-[#EEEEEE]/70">
                        {goal.current}/{goal.target} {goal.unit}
                      </span>
                    </div>
                    <div className="w-full bg-[#222831]/50 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[#00ADB5] to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-[#EEEEEE]/70">{goal.progress}% complete</span>
                      <span className="text-xs text-[#00ADB5]">{goal.target - goal.current} to go</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center p-6">
                    <p className="text-[#EEEEEE]/50">No active goals yet</p>
                    <button 
                      onClick={() => navigate('/goals')}
                      className="px-4 py-2 bg-[#00ADB5] hover:bg-[#00ADB5]/90 text-white rounded-lg transition-colors"
                    >
                      Set a Goal
                    </button>
                  </div>
                )}
              </div>
            </motion.section>
          </div>          {/* Middle Column - Recent Activity */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#393E46]/50 backdrop-blur-md border border-[#00ADB5]/20 rounded-xl p-4 lg:p-6"
            >
              <h2 className="text-lg lg:text-xl font-semibold text-white flex items-center mb-4">
                <Clock className="w-5 h-5 mr-2 text-[#00ADB5]" />
                Recent Activity
              </h2>

              <div className="space-y-3">
                {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 ? (
                  dashboardData.recentActivity.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 bg-[#222831]/30 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-[#00ADB5]/20 rounded-lg flex items-center justify-center">
                          <Icon className="w-4 h-4 text-[#00ADB5]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white">{activity.description}</p>
                          <p className="text-xs text-[#EEEEEE]/70">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center p-6">
                    <p className="text-[#EEEEEE]/50">No recent activity</p>
                  </div>
                )}
              </div>
            </motion.section>

            {/* Quick Actions */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-[#393E46]/50 backdrop-blur-md border border-[#00ADB5]/20 rounded-xl p-4 lg:p-6"
            >
              <h2 className="text-lg lg:text-xl font-semibold text-white mb-4">Quick Actions</h2>

              <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-3 bg-[#222831]/30 hover:bg-[#00ADB5]/20 rounded-lg transition-colors group">
                  <div className="flex items-center space-x-3">
                    <Heart className="w-4 h-4 text-[#00ADB5]" />
                    <span className="text-sm text-white">Log Your Mood</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#EEEEEE]/70 group-hover:text-[#00ADB5] transition-colors" />
                </button>

                <button className="w-full flex items-center justify-between p-3 bg-[#222831]/30 hover:bg-[#00ADB5]/20 rounded-lg transition-colors group">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-4 h-4 text-[#00ADB5]" />
                    <span className="text-sm text-white">Write in Journal</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#EEEEEE]/70 group-hover:text-[#00ADB5] transition-colors" />
                </button>

                <button className="w-full flex items-center justify-between p-3 bg-[#222831]/30 hover:bg-[#00ADB5]/20 rounded-lg transition-colors group">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-4 h-4 text-[#00ADB5]" />
                    <span className="text-sm text-white">Start Chat</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#EEEEEE]/70 group-hover:text-[#00ADB5] transition-colors" />
                </button>
              </div>
            </motion.section>
          </div>

          {/* Right Column - Achievements */}
          <div className="space-y-6">
            {/* Achievements */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[#393E46]/50 backdrop-blur-md border border-[#00ADB5]/20 rounded-xl p-4 lg:p-6"
            >
              <h2 className="text-lg lg:text-xl font-semibold text-white flex items-center mb-4">
                <Award className="w-5 h-5 mr-2 text-[#00ADB5]" />
                Achievements
              </h2>

              <div className="space-y-3">
                {dashboardData.insights && dashboardData.insights.length > 0 ? dashboardData.insights.slice(0, 3).map((insight) => {
                  const Icon = insight.icon
                  return (
                    <div 
                      key={insight.id} 
                      className={`flex items-center space-x-3 p-3 rounded-lg ${
                        insight.type === 'positive' 
                          ? 'bg-green-500/20 border border-green-500/30' 
                          : insight.type === 'reminder'
                          ? 'bg-amber-500/20 border border-amber-500/30'
                          : 'bg-blue-500/20 border border-blue-500/30'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                        insight.type === 'positive' 
                          ? 'bg-green-500/30' 
                          : insight.type === 'reminder'
                          ? 'bg-amber-500/30'
                          : 'bg-blue-500/30'
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          insight.type === 'positive' 
                            ? 'text-green-400' 
                            : insight.type === 'reminder'
                            ? 'text-amber-400'
                            : 'text-blue-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          insight.type === 'positive' 
                            ? 'text-green-400' 
                            : insight.type === 'reminder'
                            ? 'text-amber-400'
                            : 'text-blue-400'
                        }`}>
                          {insight.title}
                        </p>
                        <p className="text-xs text-[#EEEEEE]/70">{insight.description}</p>
                      </div>
                    </div>
                  )
                }) : (
                  <div className="text-center p-6">
                    <p className="text-[#EEEEEE]/50">Complete more activities to see insights</p>
                  </div>
                )}
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
