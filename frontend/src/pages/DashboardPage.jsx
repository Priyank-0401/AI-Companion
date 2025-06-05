import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  BarChart3,
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
  Users,
  Sparkles,
  ChevronRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { wellnessApi, journalApi, chatApi } from '../services/api'

const DashboardPage = () => {
  // State for dashboard data
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    emotionTrends: [],
    wellnessStats: null,
    journalStats: null,
    chatStats: null,
    recentActivity: [],
    goals: [],
    achievements: []
  })

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch data from multiple APIs
        const [wellnessResponse, journalResponse] = await Promise.all([
          wellnessApi.getStats().catch(err => ({ data: null })),
          journalApi.getStats().catch(err => ({ data: null })),
        ])

        // Mock emotion trends data (this would come from API)
        const emotionTrends = [
          { day: 'Mon', mood: 4, energy: 3.5, stress: 2 },
          { day: 'Tue', mood: 3.5, energy: 4, stress: 3 },
          { day: 'Wed', mood: 5, energy: 4.5, stress: 1.5 },
          { day: 'Thu', mood: 4.2, energy: 3.8, stress: 2.2 },
          { day: 'Fri', mood: 3.8, energy: 3.2, stress: 3.5 },
          { day: 'Sat', mood: 4.8, energy: 4.2, stress: 1.8 },
          { day: 'Sun', mood: 4.5, energy: 4, stress: 2 }
        ]

        // Mock recent activity
        const recentActivity = [
          { id: 1, type: 'chat', description: 'Had a meaningful conversation about goals', time: '2 hours ago', icon: MessageSquare },
          { id: 2, type: 'journal', description: 'Completed daily reflection entry', time: '5 hours ago', icon: BookOpen },
          { id: 3, type: 'mood', description: 'Logged mood: Happy and energetic', time: '1 day ago', icon: Smile },
          { id: 4, type: 'breathing', description: 'Completed 10-minute breathing session', time: '2 days ago', icon: Heart }
        ]

        // Mock goals
        const goals = [
          { id: 1, title: 'Daily Journaling', progress: 85, target: 30, current: 25, unit: 'days' },
          { id: 2, title: 'Mood Tracking', progress: 67, target: 30, current: 20, unit: 'entries' },
          { id: 3, title: 'Chat Sessions', progress: 90, target: 20, current: 18, unit: 'conversations' }
        ]

        // Mock achievements
        const achievements = [
          { id: 1, title: 'Consistent Tracker', description: '7-day mood tracking streak', earned: true, icon: Target },
          { id: 2, title: 'Thoughtful Writer', description: 'Completed 10 journal entries', earned: true, icon: BookOpen },
          { id: 3, title: 'Deep Thinker', description: 'Had 5 meaningful AI conversations', earned: false, icon: Brain }
        ]

        setDashboardData({
          emotionTrends,
          wellnessStats: wellnessResponse.data,
          journalStats: journalResponse.data,
          recentActivity,
          goals,
          achievements
        })

      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-background-light to-background-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent mb-4"></div>
          <p className="text-lightText/70">Loading your dashboard...</p>
        </div>
      </div>
    )
  }  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#222831] to-[#393E46] text-[#EEEEEE] overflow-y-auto">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mb-6 px-4 lg:px-8 py-6"
      >
        <div className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl lg:text-5xl font-bold text-[#00ADB5] mb-2">
                Your Personal Dashboard
              </h1>
              <p className="text-base lg:text-xl text-[#EEEEEE]/90">
                Track your emotional journey and personal growth
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-[#00ADB5]/20 px-4 py-2 rounded-lg">
                <Calendar className="w-5 h-5 inline mr-2" />
                <span className="font-medium">Today</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="w-full px-4 lg:px-8 pb-8">        {/* Quick Stats Row */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Mood Score */}
            <div className="bg-[#393E46]/50 backdrop-blur-md border border-[#00ADB5]/20 rounded-xl p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <Smile className="w-6 lg:w-8 h-6 lg:h-8 text-green-400" />
                <ArrowUp className="w-4 h-4 text-green-400" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">4.2</h3>
              <p className="text-sm lg:text-base text-[#EEEEEE]/70">Average Mood</p>
              <p className="text-xs lg:text-sm text-green-400">+0.3 this week</p>
            </div>

            {/* Energy Level */}
            <div className="bg-[#393E46]/50 backdrop-blur-md border border-[#00ADB5]/20 rounded-xl p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-6 lg:w-8 h-6 lg:h-8 text-blue-400" />
                <ArrowUp className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">3.8</h3>
              <p className="text-sm lg:text-base text-[#EEEEEE]/70">Energy Level</p>
              <p className="text-xs lg:text-sm text-blue-400">+0.1 this week</p>
            </div>

            {/* Journal Entries */}
            <div className="bg-[#393E46]/50 backdrop-blur-md border border-[#00ADB5]/20 rounded-xl p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <BookOpen className="w-6 lg:w-8 h-6 lg:h-8 text-purple-400" />
                <ArrowUp className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">25</h3>
              <p className="text-sm lg:text-base text-[#EEEEEE]/70">Journal Entries</p>
              <p className="text-xs lg:text-sm text-purple-400">+3 this week</p>
            </div>

            {/* Chat Sessions */}
            <div className="bg-[#393E46]/50 backdrop-blur-md border border-[#00ADB5]/20 rounded-xl p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <MessageSquare className="w-6 lg:w-8 h-6 lg:h-8 text-[#00ADB5]" />
                <ArrowUp className="w-4 h-4 text-[#00ADB5]" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">18</h3>
              <p className="text-sm lg:text-base text-[#EEEEEE]/70">Chat Sessions</p>
              <p className="text-xs lg:text-sm text-[#00ADB5]">+2 this week</p>
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
                {dashboardData.emotionTrends.map((day, index) => (
                  <div key={day.day} className="flex-1 flex flex-col items-center">
                    <div className="w-full max-w-8 flex flex-col space-y-1 mb-2">
                      {/* Mood Bar */}
                      <div 
                        className="bg-green-400 rounded-sm transition-all duration-500"
                        style={{ height: `${(day.mood / 5) * 40}px` }}
                        title={`Mood: ${day.mood}`}
                      ></div>
                      {/* Energy Bar */}
                      <div 
                        className="bg-blue-400 rounded-sm transition-all duration-500"
                        style={{ height: `${(day.energy / 5) * 40}px` }}
                        title={`Energy: ${day.energy}`}
                      ></div>
                      {/* Stress Bar (inverted) */}
                      <div 
                        className="bg-red-400 rounded-sm transition-all duration-500"
                        style={{ height: `${((5 - day.stress) / 5) * 40}px` }}
                        title={`Low Stress: ${5 - day.stress}`}
                      ></div>
                    </div>
                    <span className="text-xs text-[#EEEEEE]/70">{day.day}</span>
                  </div>
                ))}
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
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded"></div>
                  <span className="text-sm text-[#EEEEEE]/70">Low Stress</span>
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
                {dashboardData.goals.map((goal) => (
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
                ))}
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
                {dashboardData.recentActivity.map((activity) => {
                  const Icon = activity.icon
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
                  )
                })}
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
                {dashboardData.achievements.map((achievement) => {
                  const Icon = achievement.icon
                  return (
                    <div 
                      key={achievement.id} 
                      className={`flex items-center space-x-3 p-3 rounded-lg ${
                        achievement.earned 
                          ? 'bg-green-500/20 border border-green-500/30' 
                          : 'bg-[#222831]/30 border border-gray-500/30'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                        achievement.earned ? 'bg-green-500/30' : 'bg-gray-500/30'
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          achievement.earned ? 'text-green-400' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          achievement.earned ? 'text-green-400' : 'text-gray-400'
                        }`}>
                          {achievement.title}
                        </p>
                        <p className="text-xs text-[#EEEEEE]/70">{achievement.description}</p>
                      </div>
                      {achievement.earned && (
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
