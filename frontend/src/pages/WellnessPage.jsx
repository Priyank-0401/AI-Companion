import { useState, useEffect, useRef } from 'react'
import { 
  Heart, 
  Wind, 
  Moon, 
  Smile, 
  TrendingUp, 
  Play, 
  Pause, 
  RotateCcw,
  Calendar,
  BarChart3,
  Brain,
  Target,
  Award,
  Sparkles,
  Timer,
  Zap,
  Flame,  CheckCircle,
  Activity,
  LineChart,
  Bell,
  ArrowRight,
  Plus,
  ThumbsUp,
  Droplets,
  Sun,
  Search,
  Coffee,
  TreePine,
  Headphones,
  Star,
  Users,
  MessageCircle,
  Shield,
  Leaf,
  Flower2,
  Sunrise,
  CloudRain
} from 'lucide-react'
import { wellnessApi } from '../services/api'

const WellnessPage = () => {
  // User states
  const [currentMood, setCurrentMood] = useState(null)
  const [wellnessStreak, setWellnessStreak] = useState(12)
  const [wellnessPoints, setWellnessPoints] = useState(3250)
  const [username, setUsername] = useState('Alex')
  const [level, setLevel] = useState(8)
  
  // UI states
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showQuickTip, setShowQuickTip] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTool, setSelectedTool] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('All')
  
  // Feature states
  const [breathingActive, setBreathingActive] = useState(false)
  const [breathingPhase, setBreathingPhase] = useState('inhale')
  const [breathingCount, setBreathingCount] = useState(0)  
  const [meditationActive, setMeditationActive] = useState(false)
  const [meditationTime, setMeditationTime] = useState(0)
  const [completedTasks, setCompletedTasks] = useState(new Set(['task1', 'task3']))
  const [hydrationLevel, setHydrationLevel] = useState(5)
  const [sleepHours, setSleepHours] = useState(7.5)
  const [exerciseMinutes, setExerciseMinutes] = useState(35)
  const [gratitudeItems, setGratitudeItems] = useState(['Morning coffee', 'Sunny weather'])
  const [currentStretchIndex, setCurrentStretchIndex] = useState(0)
  const [soundscapeActive, setSoundscapeActive] = useState(null)
  const [stretchTimerActive, setStretchTimerActive] = useState(false)
  const [stretchTimeRemaining, setStretchTimeRemaining] = useState(0)
  const [wellnessStats, setWellnessStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState(null)

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Local Storage Keys
  const STORAGE_KEYS = {
    wellnessData: 'ai-companion-wellness-data',
    dailyTasks: 'ai-companion-daily-tasks',
    gratitude: 'ai-companion-gratitude',
    hydration: 'ai-companion-hydration',
    sleep: 'ai-companion-sleep',
    exercise: 'ai-companion-exercise',
    mood: 'ai-companion-mood',
    streaks: 'ai-companion-streaks',
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
        // Check if data is from today
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

  // Load initial data from localStorage and backend
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)

        // Load from localStorage first for immediate UI updates
        const storedHydration = loadFromLocalStorage(STORAGE_KEYS.hydration, 5)
        const storedTasks = loadFromLocalStorage(STORAGE_KEYS.dailyTasks, new Set(['task1', 'task3']))
        const storedGratitude = loadFromLocalStorage(STORAGE_KEYS.gratitude, ['Morning coffee', 'Sunny weather'])
        const storedMood = loadFromLocalStorage(STORAGE_KEYS.mood, null)
        const storedPoints = loadFromLocalStorage(STORAGE_KEYS.points, 3250)
        const storedSleep = loadFromLocalStorage(STORAGE_KEYS.sleep, 7.5)
        const storedExercise = loadFromLocalStorage(STORAGE_KEYS.exercise, 35)

        setHydrationLevel(storedHydration)
        setCompletedTasks(new Set(storedTasks))
        setGratitudeItems(storedGratitude)
        setCurrentMood(storedMood)
        setWellnessPoints(storedPoints)
        setSleepHours(storedSleep)
        setExerciseMinutes(storedExercise)        // Load from backend
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
    saveToLocalStorage(STORAGE_KEYS.gratitude, gratitudeItems)
  }, [gratitudeItems])

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
    { emoji: '😄', label: 'Energetic', value: 5, color: 'from-emerald-400 to-green-500', bg: 'bg-emerald-500/20' },
    { emoji: '😊', label: 'Happy', value: 4, color: 'from-blue-400 to-blue-500', bg: 'bg-blue-500/20' },
    { emoji: '😌', label: 'Calm', value: 3, color: 'from-purple-400 to-purple-500', bg: 'bg-purple-500/20' },
    { emoji: '😐', label: 'Neutral', value: 3, color: 'from-yellow-400 to-orange-500', bg: 'bg-yellow-500/20' },
    { emoji: '😔', label: 'Tired', value: 2, color: 'from-orange-400 to-red-500', bg: 'bg-orange-500/20' },
    { emoji: '😰', label: 'Stressed', value: 1, color: 'from-red-400 to-pink-500', bg: 'bg-red-500/20' }
  ]

  const wellnessTools = [
    {
      id: 'breathing',
      icon: Wind,
      title: 'Breathing Exercises',
      description: 'Guided 4-7-8 breathing technique for instant calm',
      category: 'Relaxation',
      duration: '3-10 min',
      color: 'from-cyan-400 to-blue-500',
      benefits: ['Reduces anxiety', 'Improves focus', 'Lowers heart rate'],
      recommended: true,
      difficulty: 'Beginner'
    },
    {
      id: 'meditation',
      icon: Brain,
      title: 'Mindfulness Meditation',
      description: 'Guided meditation sessions for mental clarity',
      category: 'Mindfulness',
      duration: '5-30 min',
      color: 'from-purple-400 to-purple-600',
      benefits: ['Increases awareness', 'Reduces stress', 'Improves emotional regulation'],
      recommended: true,
      difficulty: 'Beginner'
    },
    {
      id: 'yoga',
      icon: TreePine,
      title: 'Morning Yoga Flow',
      description: 'Gentle yoga sequences to start your day',
      category: 'Movement',
      duration: '15-45 min',
      color: 'from-green-400 to-emerald-600',
      benefits: ['Improves flexibility', 'Builds strength', 'Enhances balance'],
      recommended: false,
      difficulty: 'Intermediate'
    },
    {
      id: 'stretching',
      icon: Activity,
      title: 'Desk Stretches',
      description: 'Quick stretches to relieve tension',
      category: 'Movement',
      duration: '2-5 min',
      color: 'from-orange-400 to-red-500',
      benefits: ['Relieves tension', 'Improves posture', 'Boosts energy'],
      recommended: true,
      difficulty: 'Beginner'
    },
    {
      id: 'soundscape',
      icon: Headphones,
      title: 'Nature Soundscapes',
      description: 'Immersive nature sounds for relaxation',
      category: 'Audio',
      duration: 'Unlimited',
      color: 'from-teal-400 to-cyan-600',
      benefits: ['Improves focus', 'Reduces noise stress', 'Enhances mood'],
      recommended: false,
      difficulty: 'Beginner'
    },
    {
      id: 'gratitude',
      icon: Heart,
      title: 'Gratitude Practice',
      description: 'Daily gratitude reflection and journaling',
      category: 'Reflection',
      duration: '5-10 min',
      color: 'from-pink-400 to-rose-500',
      benefits: ['Increases positivity', 'Improves relationships', 'Boosts happiness'],
      recommended: true,
      difficulty: 'Beginner'
    },
    {
      id: 'sleep',
      icon: Moon,
      title: 'Sleep Stories',
      description: 'Calming bedtime stories for better sleep',
      category: 'Sleep',
      duration: '10-20 min',
      color: 'from-indigo-400 to-purple-500',
      benefits: ['Improves sleep quality', 'Reduces racing thoughts', 'Promotes relaxation'],
      recommended: false,
      difficulty: 'Beginner'
    },
    {
      id: 'breathing-advanced',
      icon: Zap,
      title: 'Box Breathing',
      description: 'Advanced breathing technique for focus',
      category: 'Relaxation',
      duration: '5-15 min',
      color: 'from-yellow-400 to-orange-500',
      benefits: ['Enhances concentration', 'Reduces stress', 'Improves performance'],
      recommended: false,
      difficulty: 'Advanced'
    }
  ]

  const todaysTasks = [
    { id: 'task1', task: 'Morning breathing exercise', category: 'Wellness', points: 50, completed: completedTasks.has('task1') },
    { id: 'task2', task: '10-minute meditation', category: 'Mindfulness', points: 75, completed: completedTasks.has('task2') },
    { id: 'task3', task: 'Gratitude journaling', category: 'Reflection', points: 40, completed: completedTasks.has('task3') },
    { id: 'task4', task: 'Evening reflection', category: 'Reflection', points: 30, completed: completedTasks.has('task4') },
    { id: 'task5', task: 'Hydration goal (8 glasses)', category: 'Health', points: 60, completed: hydrationLevel >= 8 },
    { id: 'task6', task: '30 minutes movement', category: 'Fitness', points: 80, completed: exerciseMinutes >= 30 }
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

  const stretchExercises = [
    { name: 'Neck Rolls', duration: 30, description: 'Slowly roll your neck in circles' },
    { name: 'Shoulder Shrugs', duration: 15, description: 'Lift shoulders up and release tension' },
    { name: 'Wrist Circles', duration: 20, description: 'Rotate wrists to prevent strain' },
    { name: 'Spinal Twist', duration: 30, description: 'Gentle twist while seated' }
  ]

  const soundscapes = [
    { id: 'rain', name: 'Gentle Rain', icon: CloudRain, color: 'from-blue-400 to-blue-600' },
    { id: 'forest', name: 'Forest Sounds', icon: TreePine, color: 'from-green-400 to-green-600' },
    { id: 'ocean', name: 'Ocean Waves', icon: Droplets, color: 'from-cyan-400 to-teal-600' },
    { id: 'birds', name: 'Morning Birds', icon: Sunrise, color: 'from-yellow-400 to-orange-500' }
  ]

  // Effects
  useEffect(() => {
    let interval
    if (breathingActive) {
      interval = setInterval(() => {
        setBreathingCount(prev => {
          const newCount = prev + 1
          if (newCount <= 4) setBreathingPhase('inhale')
          else if (newCount <= 11) setBreathingPhase('hold')
          else if (newCount <= 19) setBreathingPhase('exhale')
          else {
            setBreathingPhase('inhale')
            return 0
          }
          return newCount
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [breathingActive])
  useEffect(() => {
    let interval
    if (meditationActive) {
      interval = setInterval(() => {
        setMeditationTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [meditationActive])

  // Stretch timer effect
  useEffect(() => {
    let interval
    if (stretchTimerActive && stretchTimeRemaining > 0) {
      interval = setInterval(() => {        setStretchTimeRemaining(prev => {
          if (prev <= 1) {
            setStretchTimerActive(false)
            setWellnessPoints(prevPoints => prevPoints + 20)
            showNotification(`Stretch completed! Great job! +20 points`, 'success')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [stretchTimerActive, stretchTimeRemaining])

  // Helper functions
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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
    
    // Save mood to backend
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

  const startBreathing = () => {
    setBreathingActive(true)
    setBreathingCount(0)
    setBreathingPhase('inhale')
  }
  const stopBreathing = async () => {
    setBreathingActive(false)
    setBreathingCount(0)
    
    // Save breathing session to backend
    try {
      const duration = Math.max(Math.floor(breathingCount / 20), 1) // Estimate duration
      await wellnessApi.completeBreathingSession(duration)
      setWellnessPoints(prev => prev + 50)
      showNotification(`Great breathing session! +50 points`, 'success')
    } catch (error) {
      console.error('Error saving breathing session:', error)
      showNotification('Session completed but failed to save progress', 'error')
    }
  }

  const startMeditation = () => {
    setMeditationActive(true)
    setMeditationTime(0)
  }

  const stopMeditation = async () => {
    setMeditationActive(false)
    const minutes = Math.floor(meditationTime / 60)
    
    if (meditationTime >= 300) { // 5 minutes
      setWellnessPoints(prev => prev + 100)
      
      // Save meditation session to backend
      try {
        await wellnessApi.completeBreathingSession(minutes) // Using breathing endpoint for now
      } catch (error) {
        console.error('Error saving meditation session:', error)
      }    }
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

  const addGratitudeItem = () => {
    const newItem = prompt('What are you grateful for today?')
    if (newItem && newItem.trim()) {
      setGratitudeItems(prev => [...prev, newItem.trim()])
      setWellnessPoints(prev => prev + 30)
      showNotification(`Added to gratitude list! +30 points`, 'success')
    }
  }

  const removeGratitudeItem = (index) => {
    setGratitudeItems(prev => prev.filter((_, i) => i !== index))
  }

  const nextStretch = () => {
    setCurrentStretchIndex(prev => (prev + 1) % stretchExercises.length)
  }

  const startStretchTimer = () => {
    const currentExercise = stretchExercises[currentStretchIndex]
    setStretchTimeRemaining(currentExercise.duration)
    setStretchTimerActive(true)
  }

  const stopStretchTimer = () => {
    setStretchTimerActive(false)
    setStretchTimeRemaining(0)
  }
  const toggleSoundscape = (soundId) => {
    if (soundscapeActive === soundId) {
      // Stop the current soundscape
      setSoundscapeActive(null)
      // Here you would stop the audio
    } else {
      // Start new soundscape
      setSoundscapeActive(soundId)
      setWellnessPoints(prev => prev + 10) // Small reward for using soundscapes
      // Here you would start playing the audio
      // For now, we'll simulate audio feedback with a notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Now playing: ${soundscapes.find(s => s.id === soundId)?.name}`, {
          icon: '/favicon.ico',
          tag: 'soundscape'
        })
      }
    }
  }

  const updateSleepHours = (hours) => {
    setSleepHours(Math.max(0, Math.min(12, hours)))
  }
  const updateExerciseMinutes = (minutes) => {
    setExerciseMinutes(Math.max(0, Math.min(300, minutes)))
  }
  
  const handleCategoryFilter = (category) => {
    setCategoryFilter(category)
  }

  const filteredTools = wellnessTools.filter(tool => {
    // Filter by search query
    const matchesSearch = searchQuery === '' || 
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Filter by category
    const matchesCategory = categoryFilter === 'All' || tool.category === categoryFilter
      return matchesSearch && matchesCategory
  })
  
  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#222831] overflow-y-auto z-0">
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
                <p className="text-[#EEEEEE]/70">Welcome back, {username}! 🌟</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/80 text-white px-4 py-2 rounded-xl">
                <Flame className="w-4 h-4" />
                <span className="font-semibold">{wellnessStreak} day streak</span>
              </div>
              <div className="flex items-center space-x-2 bg-gradient-to-r from-[#FFD93D] to-[#FFD93D]/80 text-[#222831] px-4 py-2 rounded-xl">
                <Star className="w-4 h-4" />
                <span className="font-semibold">{wellnessPoints} points</span>
              </div>
              <div className="flex items-center space-x-2 bg-gradient-to-r from-[#00ADB5] to-[#393E46] text-white px-4 py-2 rounded-xl">
                <Award className="w-4 h-4" />
                <span className="font-semibold">Level {level}</span>
              </div>
            </div>
          </div>
        </div>
      </div>      {/* Navigation Tabs */}
      <div className="relative z-10 bg-[#393E46]/60 backdrop-blur-md border-b border-[#00ADB5]/20">
        <div className="w-full px-4">
          <div className="flex space-x-8">            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'tools', label: 'Wellness Tools', icon: Heart },
              { id: 'progress', label: 'Progress', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-4 border-b-2 ${
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
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={addHydration}
                      disabled={hydrationLevel >= 8}
                      className="flex-1 bg-[#00ADB5] text-white py-2 rounded-lg hover:bg-[#00ADB5]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Glass 💧
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
            </div>

            {/* Mood Tracker */}
            <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20">
              <h3 className="text-xl font-semibold text-[#EEEEEE] mb-4 flex items-center">
                <Smile className="w-5 h-5 mr-2" />
                How are you feeling today?
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {moods.map(mood => (
                  <button
                    key={mood.value}
                    onClick={() => handleMoodSelect(mood)}
                    className={`p-4 rounded-xl border-2 ${
                      currentMood?.value === mood.value
                        ? `border-[#00ADB5] bg-[#00ADB5]/20`
                        : 'border-[#EEEEEE]/20 hover:border-[#00ADB5]/50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{mood.emoji}</div>
                    <div className="text-sm font-medium text-[#EEEEEE]">{mood.label}</div>
                  </button>
                ))}
              </div>
              {currentMood && (
                <div className="mt-4 p-4 bg-[#00ADB5]/20 rounded-xl">
                  <p className="text-[#EEEEEE]">
                    Thanks for sharing! You're feeling <strong>{currentMood.label}</strong> today. 
                    {currentMood.value >= 4 ? " That's wonderful! 🌟" : " Take care of yourself today. 💜"}
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
              </div>
              <div className="mt-4 p-4 bg-[#FFD93D]/20 rounded-xl">
                <p className="text-[#EEEEEE] font-medium">
                  Points earned today: <span className="text-xl text-[#FFD93D]">{getTotalPointsEarned()}</span> 🏆
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Breathing Exercise */}
              <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20">
                <h4 className="font-semibold text-[#EEEEEE] mb-3 flex items-center">
                  <Wind className="w-5 h-5 mr-2 text-[#00ADB5]" />
                  Quick Breathing
                </h4>
                {breathingActive ? (
                  <div className="text-center">
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-full border-4 ${
                      breathingPhase === 'inhale' ? 'border-[#00ADB5] scale-110' :
                      breathingPhase === 'hold' ? 'border-[#FFD93D] scale-110' :
                      'border-[#00ADB5] scale-90'
                    }`}>
                      <div className="w-full h-full bg-[#00ADB5]/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium capitalize text-[#EEEEEE]">{breathingPhase}</span>
                      </div>
                    </div>
                    <p className="text-[#EEEEEE]/70 mb-4">
                      {breathingPhase === 'inhale' ? 'Breathe in slowly...' :
                       breathingPhase === 'hold' ? 'Hold your breath...' :
                       'Breathe out slowly...'}
                    </p>
                    <button
                      onClick={stopBreathing}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    >
                      Stop
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-[#EEEEEE]/70 mb-4">4-7-8 breathing technique for instant calm</p>
                    <button
                      onClick={startBreathing}
                      className="w-full bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/80 text-white py-3 rounded-lg hover:shadow-lg"
                    >
                      Start Breathing
                    </button>
                  </div>
                )}
              </div>

              {/* Meditation Timer */}
              <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20">
                <h4 className="font-semibold text-[#EEEEEE] mb-3 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-[#00ADB5]" />
                  Meditation Timer
                </h4>
                {meditationActive ? (
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#00ADB5]/20 flex items-center justify-center">
                      <span className="text-lg font-bold text-[#00ADB5]">{formatTime(meditationTime)}</span>
                    </div>
                    <p className="text-[#EEEEEE]/70 mb-4">Focus on your breath and be present</p>
                    <button
                      onClick={stopMeditation}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    >
                      Stop
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-[#EEEEEE]/70 mb-4">Guided mindfulness meditation</p>
                    <button
                      onClick={startMeditation}
                      className="w-full bg-gradient-to-r from-[#00ADB5] to-[#393E46] text-white py-3 rounded-lg hover:shadow-lg"
                    >
                      Start Meditation
                    </button>
                  </div>
                )}
              </div>              {/* Gratitude Practice */}
              <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20">
                <h4 className="font-semibold text-[#EEEEEE] mb-3 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-[#00ADB5]" />
                  Gratitude List
                </h4>
                <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                  {gratitudeItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm group hover:bg-[#222831]/30 p-2 rounded-lg transition-all">
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-[#FFD93D] fill-current" />
                        <span className="text-[#EEEEEE]">{item}</span>
                      </div>
                      <button
                        onClick={() => removeGratitudeItem(index)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1 rounded transition-all"
                        title="Remove item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {gratitudeItems.length === 0 && (
                    <p className="text-[#EEEEEE]/50 text-sm italic text-center py-4">
                      No gratitude items yet. Add something you're grateful for!
                    </p>
                  )}
                </div>
                <button
                  onClick={addGratitudeItem}
                  className="w-full bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/80 text-white py-3 rounded-lg hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Gratitude</span>
                </button>
              </div>
            </div>
          </div>
        )}        {activeTab === 'tools' && (
          <div className="space-y-8">
            {/* Search and Filters */}
            <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#EEEEEE]/50 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search wellness tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#222831]/50 border border-[#EEEEEE]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00ADB5] text-[#EEEEEE] placeholder-[#EEEEEE]/50"
                  />
                </div>                <div className="flex flex-wrap gap-2">
                  {['All', 'Relaxation', 'Mindfulness', 'Movement', 'Audio', 'Reflection', 'Sleep'].map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategoryFilter(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
                        categoryFilter === category
                          ? 'bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/80 text-white shadow-lg'
                          : 'bg-[#222831]/50 border border-[#EEEEEE]/20 hover:bg-[#00ADB5]/20 hover:border-[#00ADB5] text-[#EEEEEE]'
                      }`}
                    >
                      {category}
                      {category !== 'All' && (
                        <span className="ml-1 text-xs opacity-75">
                          ({wellnessTools.filter(tool => tool.category === category).length})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Wellness Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map(tool => {
                const IconComponent = tool.icon
                return (
                  <div
                    key={tool.id}
                    className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20 hover:shadow-xl cursor-pointer"
                    onClick={() => setSelectedTool(tool)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${tool.color} rounded-xl flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center space-x-2">
                        {tool.recommended && (
                          <span className="bg-[#FFD93D]/20 text-[#FFD93D] text-xs px-2 py-1 rounded-full">
                            Recommended
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          tool.difficulty === 'Beginner' ? 'bg-[#00ADB5]/20 text-[#00ADB5]' :
                          tool.difficulty === 'Intermediate' ? 'bg-[#FFD93D]/20 text-[#FFD93D]' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {tool.difficulty}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-[#EEEEEE] mb-2">{tool.title}</h3>
                    <p className="text-[#EEEEEE]/70 text-sm mb-4">{tool.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-[#EEEEEE]/70 bg-[#222831] px-2 py-1 rounded">{tool.category}</span>
                      <span className="text-xs text-[#EEEEEE]/70 flex items-center">
                        <Timer className="w-3 h-3 mr-1" />
                        {tool.duration}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {tool.benefits.slice(0, 2).map((benefit, index) => (
                        <div key={index} className="flex items-center text-xs text-[#EEEEEE]/70">
                          <CheckCircle className="w-3 h-3 mr-1 text-[#00ADB5]" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Featured Tool Details */}
            {selectedTool && (
              <div className="bg-[#393E46]/90 backdrop-blur-md rounded-2xl p-8 border border-[#00ADB5]/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${selectedTool.color} rounded-2xl flex items-center justify-center`}>
                      <selectedTool.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-[#EEEEEE]">{selectedTool.title}</h2>
                      <p className="text-[#EEEEEE]/70">{selectedTool.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTool(null)}
                    className="text-[#EEEEEE]/50 hover:text-[#EEEEEE]"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-[#00ADB5]/20 rounded-xl">
                    <Timer className="w-8 h-8 mx-auto mb-2 text-[#00ADB5]" />
                    <p className="font-semibold text-[#EEEEEE]">{selectedTool.duration}</p>
                    <p className="text-sm text-[#EEEEEE]/70">Duration</p>
                  </div>
                  <div className="text-center p-4 bg-[#00ADB5]/20 rounded-xl">
                    <Target className="w-8 h-8 mx-auto mb-2 text-[#00ADB5]" />
                    <p className="font-semibold text-[#EEEEEE]">{selectedTool.difficulty}</p>
                    <p className="text-sm text-[#EEEEEE]/70">Difficulty</p>
                  </div>
                  <div className="text-center p-4 bg-[#FFD93D]/20 rounded-xl">
                    <Award className="w-8 h-8 mx-auto mb-2 text-[#FFD93D]" />
                    <p className="font-semibold text-[#EEEEEE]">{selectedTool.category}</p>
                    <p className="text-sm text-[#EEEEEE]/70">Category</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#EEEEEE] mb-3">Benefits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {selectedTool.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 bg-[#00ADB5]/20 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-[#00ADB5]" />
                        <span className="text-[#EEEEEE]">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className={`flex-1 bg-gradient-to-r ${selectedTool.color} text-white py-4 rounded-xl font-semibold hover:shadow-lg`}>
                    Start Session
                  </button>
                  <button className="px-6 py-4 border border-[#EEEEEE]/30 rounded-xl hover:bg-[#393E46] text-[#EEEEEE]">
                    Add to Favorites
                  </button>
                </div>
              </div>
            )}            {/* Soundscapes Section */}
            <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20">
              <h3 className="text-xl font-semibold text-[#EEEEEE] mb-4 flex items-center">
                <Headphones className="w-5 h-5 mr-2" />
                Nature Soundscapes
                {soundscapeActive && (
                  <span className="ml-auto text-sm text-[#00ADB5] animate-pulse">● Playing</span>
                )}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {soundscapes.map(sound => (
                  <button
                    key={sound.id}
                    onClick={() => toggleSoundscape(sound.id)}
                    className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                      soundscapeActive === sound.id
                        ? 'border-[#00ADB5] bg-[#00ADB5]/20 shadow-lg'
                        : 'border-[#EEEEEE]/20 hover:border-[#00ADB5]/50'
                    }`}
                  >
                    <div className={`w-12 h-12 mx-auto mb-2 bg-gradient-to-r ${sound.color} rounded-full flex items-center justify-center relative`}>
                      <sound.icon className="w-6 h-6 text-white" />
                      {soundscapeActive === sound.id && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#00ADB5] rounded-full animate-ping" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-[#EEEEEE]">{sound.name}</p>
                    {soundscapeActive === sound.id && (
                      <div className="mt-2">
                        <div className="w-full bg-[#222831] rounded-full h-1">
                          <div className="bg-[#00ADB5] h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
                        </div>
                        <p className="text-xs text-[#00ADB5] mt-1">Playing...</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {soundscapeActive && (
                <div className="mt-4 p-4 bg-[#00ADB5]/10 rounded-lg border border-[#00ADB5]/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#00ADB5] rounded-full animate-pulse" />
                      <span className="text-sm text-[#EEEEEE]">
                        Now playing: {soundscapes.find(s => s.id === soundscapeActive)?.name}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleSoundscape(soundscapeActive)}
                      className="text-xs text-[#00ADB5] hover:text-white px-2 py-1 rounded"
                    >
                      Stop
                    </button>
                  </div>
                </div>              )}
            </div>

            {/* Stretch Break Section */}
            <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20">
              <h3 className="text-xl font-semibold text-[#EEEEEE] mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Quick Desk Stretches
              </h3>
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-[#EEEEEE]">{stretchExercises[currentStretchIndex].name}</h4>
                  <p className="text-[#EEEEEE]/70">{stretchExercises[currentStretchIndex].description}</p>
                </div>
                <div className="text-right">
                  {stretchTimerActive ? (
                    <div className="text-center">
                      <p className="text-3xl font-bold text-[#FFD93D] animate-pulse">{stretchTimeRemaining}s</p>
                      <p className="text-sm text-[#EEEEEE]/70">Remaining</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-2xl font-bold text-[#00ADB5]">{stretchExercises[currentStretchIndex].duration}s</p>
                      <p className="text-sm text-[#EEEEEE]/70">Duration</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Progress bar for timer */}
              {stretchTimerActive && (
                <div className="mb-4">
                  <div className="w-full bg-[#222831] rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-[#FFD93D] to-[#00ADB5] h-3 rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${((stretchExercises[currentStretchIndex].duration - stretchTimeRemaining) / stretchExercises[currentStretchIndex].duration) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex gap-4">
                <button
                  onClick={nextStretch}
                  disabled={stretchTimerActive}
                  className={`flex-1 py-3 rounded-lg transition-all ${
                    stretchTimerActive 
                      ? 'bg-[#222831] text-[#EEEEEE]/50 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/80 text-white hover:shadow-lg'
                  }`}
                >
                  Next Exercise
                </button>
                <button
                  onClick={stretchTimerActive ? stopStretchTimer : startStretchTimer}
                  className={`px-6 py-3 rounded-lg border transition-all ${
                    stretchTimerActive
                      ? 'border-red-500 text-red-400 hover:bg-red-500/20'
                      : 'border-[#00ADB5] text-[#00ADB5] hover:bg-[#00ADB5]/20'
                  }`}
                >
                  {stretchTimerActive ? 'Stop Timer' : 'Start Timer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
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
                      <p className="text-xs text-[#EEEEEE]/70">{day.wellness}%</p>
                      <div className="flex items-center justify-center">
                        {moods.find(m => m.value === day.mood)?.emoji}
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

      {/* Quick Tip Notification */}
      {showQuickTip && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/80 text-white p-4 rounded-xl shadow-xl max-w-sm z-50">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Bell className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">💡 Wellness Tip</p>
                <p className="text-sm opacity-90">Take a 2-minute breathing break every hour to reduce stress and improve focus!</p>
              </div>
            </div>
            <button
              onClick={() => setShowQuickTip(false)}
              className="text-white/70 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WellnessPage