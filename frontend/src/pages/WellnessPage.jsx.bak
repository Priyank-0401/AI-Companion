import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  CheckCircle,
  Activity
} from 'lucide-react'

const WellnessPage = () => {
  const [currentMood, setCurrentMood] = useState(null)
  const [breathingActive, setBreathingActive] = useState(false)
  const [breathingPhase, setBreathingPhase] = useState('inhale') // inhale, hold, exhale
  const [breathingCount, setBreathingCount] = useState(0)
  const [completedTasks, setCompletedTasks] = useState(new Set())

  // Floating particles animation
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 20,
    duration: 15 + Math.random() * 10
  }))

  const moods = [
    { emoji: '😄', label: 'Amazing', value: 5, color: 'from-emerald-400 to-green-500', bg: 'bg-emerald-500/20' },
    { emoji: '😊', label: 'Good', value: 4, color: 'from-blue-400 to-blue-500', bg: 'bg-blue-500/20' },
    { emoji: '😐', label: 'Neutral', value: 3, color: 'from-yellow-400 to-orange-500', bg: 'bg-yellow-500/20' },
    { emoji: '😔', label: 'Down', value: 2, color: 'from-orange-400 to-red-500', bg: 'bg-orange-500/20' },
    { emoji: '😢', label: 'Struggling', value: 1, color: 'from-red-400 to-pink-500', bg: 'bg-red-500/20' }
  ]

  const wellnessTools = [
    {
      icon: Wind,
      title: 'Breathing Exercises',
      description: 'Guided 4-7-8 breathing technique to reduce stress and anxiety instantly',
      action: () => setBreathingActive(!breathingActive),
      buttonText: breathingActive ? 'Stop Exercise' : 'Start Breathing',
      category: 'Relaxation',
      duration: '5 min',
      color: 'from-cyan-400 to-blue-500'
    },
    {
      icon: Brain,
      title: 'Mindfulness Meditation',
      description: 'Guided meditation sessions to enhance focus and inner peace',
      action: () => console.log('Mindfulness'),
      buttonText: 'Begin Session',
      category: 'Mindfulness',
      duration: '10 min',
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: Moon,
      title: 'Sleep Stories',
      description: 'Calming narratives and soundscapes for better sleep quality',
      action: () => console.log('Sleep stories'),
      buttonText: 'Explore Stories',
      category: 'Sleep',
      duration: '15 min',
      color: 'from-indigo-400 to-purple-500'
    },
    {
      icon: Target,
      title: 'Daily Wellness Goals',
      description: 'Set and track personalized wellness objectives for consistent growth',
      action: () => console.log('Goals'),
      buttonText: 'Set Goals',
      category: 'Progress',
      duration: '2 min',
      color: 'from-green-400 to-emerald-500'
    }
  ]

  const wellnessStats = [
    { icon: Calendar, label: 'Current Streak', value: '7 days', color: 'text-green-400' },
    { icon: Activity, label: 'This Week', value: '12 sessions', color: 'text-blue-400' },
    { icon: Award, label: 'Total Points', value: '2,840', color: 'text-purple-400' },
    { icon: TrendingUp, label: 'Mood Trend', value: '+15%', color: 'text-emerald-400' }
  ]

  const todaysTasks = [
    { id: 1, task: 'Morning breathing exercise', completed: false },
    { id: 2, task: '10-minute meditation', completed: false },
    { id: 3, task: 'Gratitude journaling', completed: true },
    { id: 4, task: 'Evening reflection', completed: false }
  ]

  const handleMoodSelect = (mood) => {
    setCurrentMood(mood)
    console.log('Mood selected:', mood)
  }

  const toggleTask = (taskId) => {
    const newCompleted = new Set(completedTasks)
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId)
    } else {
      newCompleted.add(taskId)    }
    setCompletedTasks(newCompleted)
  }
  
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-[95vw] mx-auto p-4 gap-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-mediumDark to-dark"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-purple-500/10 via-transparent to-blue-500/10"></div>
        
        {/* Floating Particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 bg-accent/30 rounded-full"
            initial={{
              x: `${particle.x}vw`,
              y: `${particle.y}vh`,
              opacity: 0
            }}
            animate={{
              y: [particle.y + 'vh', (particle.y - 100) + 'vh'],
              opacity: [0, 0.6, 0],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
      </div>      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-gradient-to-r from-mediumDark/50 to-dark/50 backdrop-blur-xl rounded-3xl border border-mediumDark/30 shadow-2xl p-4"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur opacity-50"></div>
          <div className="relative text-center">
          <motion.div 
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent via-purple-500 to-blue-500 rounded-3xl shadow-xl mb-4"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <Heart className="w-8 h-8 text-white" />
          </motion.div>
          
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-accent to-blue-400 bg-clip-text text-transparent mb-3">
            Your Wellness Sanctuary
          </h1>
          <p className="text-lg text-lightText/80 max-w-2xl mx-auto">
            Nurture your mind, body, and spirit with our comprehensive wellness toolkit designed for your personal growth journey
          </p>
          
          {/* Trust Indicators */}
          <div className="flex justify-center items-center gap-6 mt-4 text-lightText/60">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm">Personalized Experience</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-green-400" />
              <span className="text-sm">5-15 min Sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-sm">Instant Relief</span>
            </div>
          </div>
        </div>
      </motion.div>      <div className="flex-1 grid lg:grid-cols-3 gap-4 overflow-hidden">
        {/* Left Column - Mood & Stats */}
        <div className="space-y-4 overflow-y-auto max-h-full">{/* Enhanced Mood Tracker */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-b from-mediumDark/40 to-dark/40 backdrop-blur-xl rounded-2xl border border-mediumDark/30 shadow-2xl p-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Smile className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Daily Check-in</h2>
                <p className="text-lightText/70">How are you feeling right now?</p>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-3">
              {moods.map((mood) => (
                <motion.button
                  key={mood.value}
                  whileHover={{ scale: 1.1, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMoodSelect(mood)}
                  className={`relative p-4 rounded-2xl border-2 transition-all duration-300 group ${
                    currentMood?.value === mood.value
                      ? 'border-accent bg-accent/20 shadow-lg shadow-accent/25'
                      : 'border-mediumDark/50 hover:border-accent/50 hover:bg-mediumDark/30'
                  }`}
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{mood.emoji}</div>
                  <div className="text-xs font-medium text-lightText/90">{mood.label}</div>
                  
                  {currentMood?.value === mood.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center"
                    >
                      <CheckCircle className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>

            <AnimatePresence>
              {currentMood && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 p-4 bg-gradient-to-r from-accent/10 to-blue-500/10 rounded-xl border border-accent/20"
                >
                  <p className="text-lightText/90">
                    <span className="font-semibold text-accent">Feeling {currentMood.label}</span> today. 
                    {currentMood.value >= 4 
                      ? " That's wonderful! Your positive energy is inspiring. Keep nurturing this feeling with our wellness tools." 
                      : " It's completely normal to have challenging days. Remember, you're taking a brave step by checking in with yourself. Try some of our wellness exercises below."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>          {/* Wellness Stats */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-b from-mediumDark/40 to-dark/40 backdrop-blur-xl rounded-2xl border border-mediumDark/30 shadow-2xl p-4"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent" />
              Your Progress
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {wellnessStats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-4 bg-dark/50 rounded-xl border border-mediumDark/30 hover:border-accent/30 transition-all"
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                    <div className="text-lg font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-lightText/70">{stat.label}</div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>        </div>

        {/* Middle Column - Wellness Tools */}
        <div className="space-y-4 overflow-y-auto max-h-full"><motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-b from-mediumDark/40 to-dark/40 backdrop-blur-xl rounded-2xl border border-mediumDark/30 shadow-2xl p-4"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Wellness Tools
            </h3>
            
            <div className="space-y-4">
              {wellnessTools.map((tool, index) => {
                const Icon = tool.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="group relative p-5 bg-gradient-to-r from-dark/60 to-mediumDark/60 backdrop-blur-sm rounded-xl border border-mediumDark/40 hover:border-accent/50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-accent/20"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-semibold text-white group-hover:text-accent transition-colors">{tool.title}</h4>
                          <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">{tool.duration}</span>
                        </div>
                        <p className="text-sm text-lightText/80 mb-3 leading-relaxed">{tool.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-lightText/60 bg-mediumDark/50 px-2 py-1 rounded-full">{tool.category}</span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={tool.action}
                            className="text-sm bg-accent/20 hover:bg-accent/30 text-accent px-4 py-2 rounded-xl border border-accent/30 transition-all duration-200 font-medium"
                          >
                            {tool.buttonText}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>        </div>

        {/* Right Column - Today's Tasks & Breathing Exercise */}
        <div className="space-y-4 overflow-y-auto max-h-full">
          {/* Today's Wellness Tasks */}          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-b from-mediumDark/40 to-dark/40 backdrop-blur-xl rounded-2xl border border-mediumDark/30 shadow-2xl p-4"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              Today's Wellness
            </h3>
            
            <div className="space-y-3">
              {todaysTasks.map((task) => (
                <motion.div
                  key={task.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    completedTasks.has(task.id) || task.completed
                      ? 'bg-green-500/20 border-green-500/50 text-green-300'
                      : 'bg-dark/50 border-mediumDark/50 text-lightText/90 hover:border-accent/50'
                  }`}
                  onClick={() => toggleTask(task.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      completedTasks.has(task.id) || task.completed
                        ? 'border-green-500 bg-green-500'
                        : 'border-mediumDark'
                    }`}>
                      {(completedTasks.has(task.id) || task.completed) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className={`text-sm ${
                      completedTasks.has(task.id) || task.completed ? 'line-through' : ''
                    }`}>
                      {task.task}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-accent/10 rounded-xl border border-accent/20">
              <div className="flex items-center gap-2 text-accent">
                <Award className="w-4 h-4" />
                <span className="text-sm">Complete 3 tasks to earn 50 wellness points!</span>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Breathing Exercise */}
          <AnimatePresence>
            {breathingActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gradient-to-b from-mediumDark/40 to-dark/40 backdrop-blur-xl rounded-2xl border border-mediumDark/30 shadow-2xl p-8 text-center"
              >
                <h3 className="text-2xl font-bold text-white mb-6">Breathing Exercise</h3>
                
                <div className="flex flex-col items-center space-y-6">
                  <motion.div
                    animate={{
                      scale: breathingPhase === 'inhale' ? 1.4 : breathingPhase === 'hold' ? 1.4 : 1,
                    }}
                    transition={{ duration: 4, ease: "easeInOut" }}
                    className="relative w-32 h-32 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-2xl"
                  >
                    <Wind className="w-12 h-12 text-white" />
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/30 to-purple-500/30 rounded-full animate-pulse"></div>
                  </motion.div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      {breathingPhase === 'inhale' && 'Breathe In...'}
                      {breathingPhase === 'hold' && 'Hold...'}
                      {breathingPhase === 'exhale' && 'Breathe Out...'}
                    </div>
                    
                    <div className="text-lg text-lightText/70">
                      Cycle {Math.floor(breathingCount / 3) + 1}
                    </div>
                  </div>
                    <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setBreathingActive(false)}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-red-300 transition-all duration-200"
                  >
                    <Pause className="w-4 h-4" />
                    Stop Exercise
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default WellnessPage
