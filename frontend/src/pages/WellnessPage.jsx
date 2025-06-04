import { useState, useEffect } from 'react'
import { 
  Heart, 
  Moon, 
  TrendingUp, 
  BarChart3,
  Target,
  Award,
  Flame,
  CheckCircle,
  Activity,
  Droplets,
  Star,
  Calendar,
  Shield,
  Sparkles,
  Brain,
  Smile
} from 'lucide-react'
import { wellnessApi } from '../services/api'

const WellnessPage = () => {
  // Core states
  const [currentMood, setCurrentMood] = useState(null)
  const [wellnessStreak, setWellnessStreak] = useState(12)
  const [wellnessPoints, setWellnessPoints] = useState(3250)
  const [username, setUsername] = useState('Alex')
  const [level, setLevel] = useState(8)
  
  // UI states
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState(null)
  
  // Wellness tracking states
  const [completedTasks, setCompletedTasks] = useState(new Set(['task1', 'task3']))
  const [hydrationLevel, setHydrationLevel] = useState(5)
  const [sleepHours, setSleepHours] = useState(7.5)
  const [exerciseMinutes, setExerciseMinutes] = useState(35)
  const [wellnessStats, setWellnessStats] = useState(null)

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Local Storage Keys
  const STORAGE_KEYS = {
    dailyTasks: 'ai-companion-daily-tasks',
    hydration: 'ai-companion-hydration',
    sleep: 'ai-companion-sleep',
    exercise: 'ai-companion-exercise',
    mood: 'ai-companion-mood',
    points: 'ai-companion-points'
  }

  // Utility functions for localStorage
  const saveToLocalStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0]
      }))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  const loadFromLocalStorage = (key, defaultValue = null) => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored)
        const today = new Date().toISOString().split('T')[0]
        if (parsed.date === today) {
          return parsed.data
        }
      }
      return defaultValue
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      return defaultValue
    }
  }

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        
        // Load from localStorage first
        const storedHydration = loadFromLocalStorage(STORAGE_KEYS.hydration, 5)
        const storedTasks = loadFromLocalStorage(STORAGE_KEYS.dailyTasks, new Set(['task1', 'task3']))
        const storedMood = loadFromLocalStorage(STORAGE_KEYS.mood, null)
        const storedPoints = loadFromLocalStorage(STORAGE_KEYS.points, 3250)
        const storedSleep = loadFromLocalStorage(STORAGE_KEYS.sleep, 7.5)
        const storedExercise = loadFromLocalStorage(STORAGE_KEYS.exercise, 35)

        setHydrationLevel(storedHydration)
        setCompletedTasks(new Set(storedTasks))
        setCurrentMood(storedMood)
        setWellnessPoints(storedPoints)
        setSleepHours(storedSleep)
        setExerciseMinutes(storedExercise)

        // Load from backend
        const statsResponse = await wellnessApi.getStats().catch(err => {
          console.error('Error loading wellness stats:', err)
          return { data: null }
        })

        if (statsResponse.data) {
          setWellnessStats(statsResponse.data)
          setWellnessStreak(statsResponse.data.streakDays || 12)
        }

      } catch (error) {
        console.error('Error loading initial data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Save data to localStorage when it changes
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.hydration, hydrationLevel)
  }, [hydrationLevel])
  
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.dailyTasks, Array.from(completedTasks))
  }, [completedTasks])

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.mood, currentMood)
  }, [currentMood])

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.points, wellnessPoints)
  }, [wellnessPoints])

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.sleep, sleepHours)
  }, [sleepHours])

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.exercise, exerciseMinutes)
  }, [exerciseMinutes])

  // Data
  const moods = [
    { label: 'Excellent', value: 5, color: 'from-emerald-400 to-green-500', bg: 'bg-emerald-500/20' },
    { label: 'Good', value: 4, color: 'from-blue-400 to-blue-500', bg: 'bg-blue-500/20' },
    { label: 'Neutral', value: 3, color: 'from-purple-400 to-purple-500', bg: 'bg-purple-500/20' },
    { label: 'Low', value: 2, color: 'from-orange-400 to-red-500', bg: 'bg-orange-500/20' },
    { label: 'Poor', value: 1, color: 'from-red-400 to-pink-500', bg: 'bg-red-500/20' }
  ]

  const todaysTasks = [
    { id: 'task1', task: 'Morning reflection', category: 'Wellness', points: 50, completed: completedTasks.has('task1') },
    { id: 'task2', task: 'Mindfulness practice', category: 'Mindfulness', points: 75, completed: completedTasks.has('task2') },
    { id: 'task3', task: 'Gratitude moment', category: 'Reflection', points: 40, completed: completedTasks.has('task3') },
    { id: 'task4', task: 'Evening wind-down', category: 'Wellness', points: 30, completed: completedTasks.has('task4') },
    { id: 'task5', task: 'Stay hydrated (8 glasses)', category: 'Health', points: 60, completed: hydrationLevel >= 8 },
    { id: 'task6', task: 'Physical activity (30 min)', category: 'Fitness', points: 80, completed: exerciseMinutes >= 30 }
  ]

  const weeklyProgress = [
    { day: 'Mon', mood: 4, wellness: 85, completed: 6 },
    { day: 'Tue', mood: 3, wellness: 72, completed: 4 },
    { day: 'Wed', mood: 5, wellness: 95, completed: 7 },
    { day: 'Thu', mood: 4, wellness: 88, completed: 6 },
    { day: 'Fri', mood: 3, wellness: 65, completed: 3 },
    { day: 'Sat', mood: 5, wellness: 92, completed: 8 },
    { day: 'Sun', mood: 4, wellness: 78, completed: 5 }
  ]

  // Helper functions
  const getHydrationPercentage = () => (hydrationLevel / 8) * 100
  const getMoodColor = (mood) => moods.find(m => m.value === mood)?.color || 'from-gray-400 to-gray-500'
  const getCompletionPercentage = () => {
    const completed = todaysTasks.filter(task => task.completed).length
    return (completed / todaysTasks.length) * 100
  }
  const getTotalPointsEarned = () => {
    return todaysTasks.filter(task => task.completed).reduce((sum, task) => sum + task.points, 0)
  }
  
  // Event handlers
  const handleMoodSelect = async (mood) => {
    setCurrentMood(mood)
    setWellnessPoints(prev => prev + 25)
    
    try {
      await wellnessApi.logMood(mood.value, mood.value, `Feeling ${mood.label.toLowerCase()}`)
      showNotification(`Mood logged! Feeling ${mood.label.toLowerCase()} +25 points`, 'success')
    } catch (error) {
      console.error('Error saving mood:', error)
      showNotification('Failed to save mood. Please try again.', 'error')
    }
  }

  const toggleTask = async (taskId) => {
    const newCompletedTasks = new Set(completedTasks)
    const task = todaysTasks.find(t => t.id === taskId)
    
    if (newCompletedTasks.has(taskId)) {
      newCompletedTasks.delete(taskId)
      if (task) setWellnessPoints(prev => prev - task.points)
    } else {
      newCompletedTasks.add(taskId)
      if (task) setWellnessPoints(prev => prev + task.points)
    }
    setCompletedTasks(newCompletedTasks)
  }

  const addHydration = () => {
    if (hydrationLevel < 8) {
      const newLevel = hydrationLevel + 1
      setHydrationLevel(newLevel)
      if (newLevel === 8) {
        setWellnessPoints(prev => prev + 50)
        showNotification(`Daily hydration goal achieved! +50 points`, 'success')
      } else {
        showNotification(`Glass ${newLevel} added! Keep going!`, 'success')
      }
    }
  }

  const removeHydration = () => {
    if (hydrationLevel > 0) {
      setHydrationLevel(prev => prev - 1)
    }
  }

  const updateSleepHours = (hours) => {
    setSleepHours(Math.max(0, Math.min(12, hours)))
  }

  const updateExerciseMinutes = (minutes) => {
    setExerciseMinutes(Math.max(0, Math.min(300, minutes)))
  }
  
  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#222831] overflow-y-auto z-0 scrollbar-thin scrollbar-thumb-[#00ADB5] scrollbar-track-[#393E46] hover:scrollbar-thumb-[#00ADB5]/80">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-[#222831]/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#393E46] rounded-2xl p-8 flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#00ADB5]/30 border-t-[#00ADB5] rounded-full animate-spin"></div>
            <p className="text-[#EEEEEE] font-medium">Loading your wellness data...</p>
          </div>        </div>
      )}
      
      {/* Notification System */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all transform ${
          notification.type === 'success' 
            ? 'bg-green-500/90 text-white' 
            : notification.type === 'error'
            ? 'bg-red-500/90 text-white'
            : 'bg-[#00ADB5]/90 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {notification.type === 'error' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="z-10 bg-[#393E46]/90 backdrop-blur-md border-b border-[#00ADB5]/20 sticky top-0 mt-16">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/80 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#EEEEEE]">Wellness Dashboard</h1>
                <p className="text-[#EEEEEE]/70">Welcome back, {username}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-[#00ADB5] text-white px-4 py-2 rounded-xl">
                <Flame className="w-4 h-4" />
                <span className="font-semibold">{wellnessStreak} day streak</span>
              </div>              <div className="flex items-center space-x-2 bg-gradient-to-r from-[#FFD93D] to-[#FFD93D]/80 text-[#222831] px-4 py-2 rounded-xl">
                <Star className="w-4 h-4" />
                <span className="font-semibold">{wellnessPoints} points</span>
              </div>
              <div className="flex items-center space-x-2 bg-[#00ADB5] text-white px-4 py-2 rounded-xl">
                <Award className="w-4 h-4" />
                <span className="font-semibold">Level {level}</span>
              </div>
            </div>
          </div>
        </div>
      </div>      {/* Navigation Tabs */}
      <div className="relative z-10 bg-[#393E46]/60 backdrop-blur-md border-b border-[#00ADB5]/20">
        <div className="w-full px-4">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'progress', label: 'Progress', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-4 border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-[#00ADB5] text-[#00ADB5]'
                    : 'border-transparent text-[#EEEEEE]/70 hover:text-[#00ADB5]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>{/* Main Content */}
      <div className="relative z-10 w-full px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#EEEEEE]">Today's Progress</h3>
                  <Target className="w-5 h-5 text-[#00ADB5]" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#EEEEEE]/70">Completed</span>
                    <span className="text-[#EEEEEE]">{todaysTasks.filter(t => t.completed).length}/{todaysTasks.length}</span>
                  </div>
                  <div className="w-full bg-[#222831] rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/70 h-3 rounded-full"
                      style={{ width: `${getCompletionPercentage()}%` }}
                    />
                  </div>
                  <p className="text-2xl font-bold text-[#EEEEEE]">{Math.round(getCompletionPercentage())}%</p>
                </div>
              </div>              <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20">                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#EEEEEE]">Hydration</h3>
                  <Droplets className="w-5 h-5 text-[#00ADB5]" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#EEEEEE]/70">Glasses</span>
                    <span className="text-[#EEEEEE]">{hydrationLevel}/8</span>
                  </div>
                  <div className="w-full bg-[#222831] rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/70 h-3 rounded-full"
                      style={{ width: `${getHydrationPercentage()}%` }}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">                    <button 
                      onClick={addHydration}
                      disabled={hydrationLevel >= 8}
                      className="flex-1 bg-[#00ADB5] text-white py-2 rounded-lg hover:bg-[#00ADB5]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Glass
                    </button>
                    <button 
                      onClick={removeHydration}
                      disabled={hydrationLevel <= 0}
                      className="px-4 bg-[#393E46] border border-[#EEEEEE]/30 text-[#EEEEEE] py-2 rounded-lg hover:bg-[#EEEEEE]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                  </div>
                </div>
              </div>              <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#EEEEEE]">Sleep Quality</h3>
                  <Moon className="w-5 h-5 text-[#00ADB5]" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-[#EEEEEE]">{sleepHours}h</p>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => updateSleepHours(sleepHours - 0.5)}
                        className="w-8 h-8 bg-[#393E46] border border-[#EEEEEE]/30 text-[#EEEEEE] rounded hover:bg-[#EEEEEE]/10"
                      >
                        −
                      </button>
                      <button 
                        onClick={() => updateSleepHours(sleepHours + 0.5)}
                        className="w-8 h-8 bg-[#393E46] border border-[#EEEEEE]/30 text-[#EEEEEE] rounded hover:bg-[#EEEEEE]/10"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[#EEEEEE]/70">Last night</p>
                  <div className="flex items-center space-x-1">
                    {[1,2,3,4,5].map(star => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= Math.round(sleepHours / 1.6) ? 'text-[#FFD93D] fill-current' : 'text-[#EEEEEE]/30'}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#EEEEEE]">Activity</h3>
                  <Activity className="w-5 h-5 text-[#00ADB5]" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-[#EEEEEE]">{exerciseMinutes}min</p>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => updateExerciseMinutes(exerciseMinutes - 5)}
                        className="w-8 h-8 bg-[#393E46] border border-[#EEEEEE]/30 text-[#EEEEEE] rounded hover:bg-[#EEEEEE]/10"
                      >
                        −
                      </button>
                      <button 
                        onClick={() => updateExerciseMinutes(exerciseMinutes + 5)}
                        className="w-8 h-8 bg-[#393E46] border border-[#EEEEEE]/30 text-[#EEEEEE] rounded hover:bg-[#EEEEEE]/10"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[#EEEEEE]/70">Movement today</p>
                  <div className="w-full bg-[#222831] rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/70 h-2 rounded-full"
                      style={{ width: `${Math.min((exerciseMinutes / 60) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>            {/* Mood Tracker */}
            <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20">
              <h3 className="text-xl font-semibold text-[#EEEEEE] mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                How are you feeling today?
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {moods.map(mood => (
                  <button
                    key={mood.value}
                    onClick={() => handleMoodSelect(mood)}
                    className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                      currentMood?.value === mood.value
                        ? `border-[#00ADB5] ${mood.bg}`
                        : 'border-[#EEEEEE]/20 hover:border-[#00ADB5]/50'
                    }`}
                  >
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r ${mood.color}`}></div>
                    <div className="text-sm font-medium text-[#EEEEEE]">{mood.label}</div>
                  </button>
                ))}
              </div>
              {currentMood && (
                <div className="mt-4 p-4 bg-[#00ADB5]/20 rounded-xl">
                  <p className="text-[#EEEEEE]">
                    Thanks for sharing! You're feeling <strong>{currentMood.label}</strong> today. 
                    {currentMood.value >= 4 ? " Keep up the positive energy!" : " Take care of yourself today."}
                  </p>
                </div>
              )}
            </div>

            {/* Daily Tasks */}
            <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20">
              <h3 className="text-xl font-semibold text-[#EEEEEE] mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Today's Wellness Tasks
              </h3>
              <div className="space-y-3">
                {todaysTasks.map(task => (
                  <div 
                    key={task.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                      task.completed 
                        ? 'border-[#00ADB5] bg-[#00ADB5]/20' 
                        : 'border-[#EEEEEE]/20 hover:border-[#00ADB5]/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          task.completed
                            ? 'border-[#00ADB5] bg-[#00ADB5] text-white'
                            : 'border-[#EEEEEE]/30 hover:border-[#00ADB5]'
                        }`}
                      >
                        {task.completed && <CheckCircle className="w-4 h-4" />}
                      </button>
                      <div>
                        <p className={`font-medium ${task.completed ? 'text-[#EEEEEE] line-through' : 'text-[#EEEEEE]'}`}>
                          {task.task}
                        </p>
                        <p className="text-sm text-[#EEEEEE]/70">{task.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#00ADB5]">+{task.points}</p>
                      <p className="text-xs text-[#EEEEEE]/70">points</p>
                    </div>
                  </div>
                ))}
              </div>              <div className="mt-4 p-4 bg-[#FFD93D]/20 rounded-xl">
                <p className="text-[#EEEEEE] font-medium">
                  Points earned today: <span className="text-xl text-[#FFD93D]">{getTotalPointsEarned()}</span>
                </p>
              </div>
            </div>            {/* Wellness Summary */}
            <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20">
              <h3 className="text-xl font-semibold text-[#EEEEEE] mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Today's Wellness Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-[#00ADB5]/20 rounded-xl">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/80 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-[#EEEEEE] mb-1">{todaysTasks.filter(t => t.completed).length}</p>
                  <p className="text-sm text-[#EEEEEE]/70">Tasks Completed</p>
                </div>
                <div className="text-center p-4 bg-[#00ADB5]/20 rounded-xl">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-[#FFD93D] to-[#FFD93D]/80 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-[#EEEEEE] mb-1">{getTotalPointsEarned()}</p>
                  <p className="text-sm text-[#EEEEEE]/70">Points Earned</p>
                </div>
                <div className="text-center p-4 bg-[#00ADB5]/20 rounded-xl">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-[#EEEEEE] mb-1">{wellnessStreak}</p>
                  <p className="text-sm text-[#EEEEEE]/70">Day Streak</p>
                </div>
              </div>
            </div>
          </div>
        )}        {activeTab === 'progress' && (
          <div className="space-y-8">
            {/* Weekly Overview */}
            <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20">
              <h3 className="text-xl font-semibold text-[#EEEEEE] mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Weekly Progress Overview
              </h3>
              <div className="grid grid-cols-7 gap-4">
                {weeklyProgress.map((day, index) => (
                  <div key={day.day} className="text-center">
                    <div className="mb-2">
                      <p className="text-sm font-medium text-[#EEEEEE]/70">{day.day}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full bg-[#222831] rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/70 h-2 rounded-full"
                          style={{ width: `${day.wellness}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#EEEEEE]/70">{day.wellness}%</p>                      <div className="flex items-center justify-center">
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${getMoodColor(day.mood)}`}></div>
                      </div>
                      <p className="text-xs text-[#EEEEEE]/70">{day.completed} tasks</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievement Badges */}
            <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20">
              <h3 className="text-xl font-semibold text-[#EEEEEE] mb-6 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Achievement Badges
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[
                  { name: 'Streak Master', icon: Flame, earned: true, description: '7 day streak' },
                  { name: 'Meditation Guru', icon: Brain, earned: true, description: '100 minutes meditated' },
                  { name: 'Hydration Hero', icon: Droplets, earned: true, description: 'Daily hydration goal' },
                  { name: 'Mood Tracker', icon: Smile, earned: false, description: 'Track mood 30 days' },
                  { name: 'Gratitude Master', icon: Heart, earned: false, description: '50 gratitude entries' },
                  { name: 'Wellness Warrior', icon: Shield, earned: false, description: '1000 total points' }
                ].map(badge => (
                  <div
                    key={badge.name}
                    className={`p-4 rounded-xl border-2 text-center ${
                      badge.earned
                        ? 'border-[#FFD93D] bg-[#FFD93D]/20'
                        : 'border-[#EEEEEE]/20 bg-[#222831]/50 opacity-60'
                    }`}
                  >
                    <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      badge.earned ? 'bg-[#FFD93D] text-white' : 'bg-[#EEEEEE]/30 text-[#EEEEEE]/50'
                    }`}>
                      <badge.icon className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-[#EEEEEE]">{badge.name}</p>
                    <p className="text-xs text-[#EEEEEE]/70">{badge.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20">
                <h4 className="font-semibold text-[#EEEEEE] mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-[#00ADB5]" />
                  This Week
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#EEEEEE]/70">Tasks Completed</span>
                    <span className="font-semibold text-[#EEEEEE]">39/42</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#EEEEEE]/70">Meditation Minutes</span>
                    <span className="font-semibold text-[#EEEEEE]">145 min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#EEEEEE]/70">Avg. Mood Score</span>
                    <span className="font-semibold text-[#EEEEEE]">4.1/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#EEEEEE]/70">Points Earned</span>
                    <span className="font-semibold text-[#EEEEEE]">1,250</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20">
                <h4 className="font-semibold text-[#EEEEEE] mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-[#00ADB5]" />
                  This Month
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#EEEEEE]/70">Total Sessions</span>
                    <span className="font-semibold text-[#EEEEEE]">87</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#EEEEEE]/70">Favorite Tool</span>
                    <span className="font-semibold text-[#EEEEEE]">Breathing</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#EEEEEE]/70">Best Streak</span>
                    <span className="font-semibold text-[#EEEEEE]">12 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#EEEEEE]/70">Level Progress</span>
                    <span className="font-semibold text-[#EEEEEE]">85%</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20">
                <h4 className="font-semibold text-[#EEEEEE] mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-[#00ADB5]" />
                  All Time
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#EEEEEE]/70">Total Points</span>
                    <span className="font-semibold text-[#EEEEEE]">12,450</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#EEEEEE]/70">Days Active</span>
                    <span className="font-semibold text-[#EEEEEE]">156</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#EEEEEE]/70">Badges Earned</span>
                    <span className="font-semibold text-[#EEEEEE]">8/15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#EEEEEE]/70">Current Level</span>
                    <span className="font-semibold text-[#EEEEEE]">Level {level}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>        )}
      </div>
    </div>
  )
}

export default WellnessPage