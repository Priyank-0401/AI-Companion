import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Plus, 
  Calendar, 
  Search, 
  Edit3, 
  Trash2, 
  Save,
  X,
  Filter,
  Heart,
  Smile,
  Frown
} from 'lucide-react'

const JournalingPage = () => {
  const [entries, setEntries] = useState([
    {
      id: 1,
      date: new Date('2025-06-01'),
      title: 'First Day of Summer',
      content: 'Today marks the beginning of summer, and I\'m feeling excited about the possibilities ahead. The weather is beautiful, and I spent some time in the garden this morning...',
      mood: 'good',
      tags: ['gratitude', 'nature']
    },
    {
      id: 2,
      date: new Date('2025-05-31'),
      title: 'Reflection on Growth',
      content: 'Been thinking a lot about personal growth lately. It\'s amazing how much can change in just a few months when you\'re intentional about your development...',
      mood: 'neutral',
      tags: ['growth', 'reflection']
    }
  ])
  
  const [isWriting, setIsWriting] = useState(false)
  const [currentEntry, setCurrentEntry] = useState({
    title: '',
    content: '',
    mood: 'neutral',
    tags: []
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMoodFilter, setSelectedMoodFilter] = useState('all')

  const moods = {
    great: { emoji: '😄', color: 'text-green-400', label: 'Great' },
    good: { emoji: '😊', color: 'text-blue-400', label: 'Good' },
    neutral: { emoji: '😐', color: 'text-yellow-400', label: 'Neutral' },
    down: { emoji: '😔', color: 'text-orange-400', label: 'Down' },
    low: { emoji: '😢', color: 'text-red-400', label: 'Low' }
  }

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMood = selectedMoodFilter === 'all' || entry.mood === selectedMoodFilter
    return matchesSearch && matchesMood
  })

  const handleSaveEntry = () => {
    if (!currentEntry.title.trim() || !currentEntry.content.trim()) return

    const newEntry = {
      id: Date.now(),
      date: new Date(),
      ...currentEntry
    }

    setEntries(prev => [newEntry, ...prev])
    setCurrentEntry({ title: '', content: '', mood: 'neutral', tags: [] })
    setIsWriting(false)
  }

  const handleDeleteEntry = (id) => {
    setEntries(prev => prev.filter(entry => entry.id !== id))
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light to-background-dark text-text-light p-4 sm:p-6 md:p-8 flex flex-col items-center">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-4xl mb-8 text-center"
      >
        <h1 className="text-4xl sm:text-5xl font-bold text-primary-accent mb-3">
          Your Private Journal: A Space to Reflect
        </h1>
        <p className="text-lg sm:text-xl text-text-light/90">
          Capture your thoughts, feelings, and daily reflections. Your Seriva companion is here to listen.
        </p>
      </motion.header>

      {/* Writing Modal */}
      <AnimatePresence>
        {isWriting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-mediumDark rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">New Journal Entry</h2>
                <button
                  onClick={() => setIsWriting(false)}
                  className="p-2 hover:bg-dark rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={currentEntry.title}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Give your entry a title..."
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">How are you feeling?</label>
                  <div className="flex space-x-2">
                    {Object.entries(moods).map(([key, mood]) => (
                      <button
                        key={key}
                        onClick={() => setCurrentEntry(prev => ({ ...prev, mood: key }))}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          currentEntry.mood === key
                            ? 'border-accent bg-accent/20'
                            : 'border-mediumDark/50 hover:border-accent/50'
                        }`}
                      >
                        <div className="text-2xl">{mood.emoji}</div>
                        <div className="text-xs">{mood.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Your thoughts</label>
                  <textarea
                    value={currentEntry.content}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="What's on your mind today? Write freely about your thoughts, experiences, or feelings..."
                    className="input-field w-full h-64 resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsWriting(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEntry}
                    disabled={!currentEntry.title.trim() || !currentEntry.content.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Your Thoughts
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card mb-6"
      >
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-lightText/50" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search your entries..."
              className="input-field w-full pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-lightText/70" />
            <select
              value={selectedMoodFilter}
              onChange={(e) => setSelectedMoodFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Moods</option>
              {Object.entries(moods).map(([key, mood]) => (
                <option key={key} value={key}>{mood.label}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Journal Entries */}
      <div className="space-y-6">
        <AnimatePresence>
          {filteredEntries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="card hover:bg-mediumDark/80 transition-colors group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{moods[entry.mood].emoji}</div>
                  <div>
                    <h3 className="text-xl font-semibold group-hover:text-accent transition-colors">
                      {entry.title}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-lightText/70">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(entry.date)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 hover:bg-accent/20 rounded-lg transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-lightText/80 leading-relaxed">
                {entry.content.length > 200 
                  ? `${entry.content.substring(0, 200)}...` 
                  : entry.content}
              </p>
              
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {entry.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-accent/20 text-accent text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredEntries.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen className="w-12 h-12 text-lightText/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-lightText/70 mb-2">
              {searchTerm || selectedMoodFilter !== 'all' 
                ? 'No entries found' 
                : 'No journal entries yet'}
            </h3>
            <p className="text-lightText/50">
              {searchTerm || selectedMoodFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Start your journaling journey by writing your first entry'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default JournalingPage

// Helper components (Toast, Modal, LoadingSpinner, ErrorDisplay) - Assuming these are defined elsewhere
