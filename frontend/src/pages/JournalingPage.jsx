import { useState, useEffect } from 'react'
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
  TrendingUp,
  CheckCircle,
  Timer,
  Brain,
  Sparkles,
  FileText,
  Clock,
  Bookmark
} from 'lucide-react'

const JournalingPage = () => {
  const [entries, setEntries] = useState([
    {
      id: 1,
      date: new Date('2025-06-01'),
      title: 'First Day of Summer',
      content: 'Today marks the beginning of summer, and I\'m feeling excited about the possibilities ahead. The weather is beautiful, and I spent some time in the garden this morning...',
      mood: 'positive',
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
  const [notification, setNotification] = useState(null)

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const moods = {
    positive: { color: 'from-emerald-400 to-green-500', bg: 'bg-emerald-500/20', label: 'Positive' },
    neutral: { color: 'from-blue-400 to-blue-500', bg: 'bg-blue-500/20', label: 'Neutral' },
    reflective: { color: 'from-purple-400 to-purple-500', bg: 'bg-purple-500/20', label: 'Reflective' },
    challenging: { color: 'from-orange-400 to-red-500', bg: 'bg-orange-500/20', label: 'Challenging' },
    grateful: { color: 'from-pink-400 to-rose-500', bg: 'bg-pink-500/20', label: 'Grateful' }
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
    showNotification('Journal entry saved successfully')
  }

  const handleDeleteEntry = (id) => {
    setEntries(prev => prev.filter(entry => entry.id !== id))
    showNotification('Journal entry deleted', 'error')
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
    <div className="fixed inset-0 w-screen h-screen bg-[#222831] overflow-y-auto z-0">
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
            {notification.type === 'error' && <X className="w-5 h-5" />}
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
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#EEEEEE]">Personal Journal</h1>
                <p className="text-[#EEEEEE]/70">Capture your thoughts and reflections</p>
              </div>
            </div>
            <button
              onClick={() => setIsWriting(true)}
              className="bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/80 text-white px-6 py-3 rounded-xl hover:shadow-lg flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>New Entry</span>
            </button>
          </div>
        </div>
      </div>      {/* Writing Modal */}
      {isWriting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#393E46] rounded-2xl p-8 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl border border-[#00ADB5]/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-[#EEEEEE]">New Journal Entry</h2>
              <button
                onClick={() => setIsWriting(false)}
                className="p-2 hover:bg-[#222831] rounded-lg transition-colors text-[#EEEEEE]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-[#EEEEEE]">Entry Title</label>
                <input
                  type="text"
                  value={currentEntry.title}
                  onChange={(e) => setCurrentEntry(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Give your entry a title..."
                  className="w-full px-4 py-3 bg-[#222831] border border-[#EEEEEE]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00ADB5] text-[#EEEEEE] placeholder-[#EEEEEE]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[#EEEEEE]">Mood</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries(moods).map(([key, mood]) => (
                    <button
                      key={key}
                      onClick={() => setCurrentEntry(prev => ({ ...prev, mood: key }))}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        currentEntry.mood === key
                          ? 'border-[#00ADB5] bg-[#00ADB5]/20'
                          : 'border-[#EEEEEE]/20 hover:border-[#00ADB5]/50'
                      }`}
                    >
                      <div className={`w-8 h-8 mx-auto mb-2 bg-gradient-to-r ${mood.color} rounded-full`}></div>
                      <div className="text-sm font-medium text-[#EEEEEE]">{mood.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[#EEEEEE]">Your Thoughts</label>
                <textarea
                  value={currentEntry.content}
                  onChange={(e) => setCurrentEntry(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="What's on your mind today? Write freely about your thoughts, experiences, or feelings..."
                  className="w-full h-64 px-4 py-3 bg-[#222831] border border-[#EEEEEE]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00ADB5] text-[#EEEEEE] placeholder-[#EEEEEE]/50 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsWriting(false)}
                  className="px-6 py-3 bg-[#393E46] border border-[#EEEEEE]/30 text-[#EEEEEE] rounded-xl hover:bg-[#EEEEEE]/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEntry}
                  disabled={!currentEntry.title.trim() || !currentEntry.content.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/80 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Entry</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}      {/* Search and Filter */}
      <div className="relative z-10 w-full px-4 py-6">
        <div className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20 mb-8">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#EEEEEE]/50" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search your journal entries..."
                className="w-full pl-10 pr-4 py-3 bg-[#222831]/50 border border-[#EEEEEE]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00ADB5] text-[#EEEEEE] placeholder-[#EEEEEE]/50"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-[#EEEEEE]/70" />
              <select
                value={selectedMoodFilter}
                onChange={(e) => setSelectedMoodFilter(e.target.value)}
                className="px-4 py-3 bg-[#222831]/50 border border-[#EEEEEE]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00ADB5] text-[#EEEEEE]"
              >
                <option value="all">All Moods</option>
                {Object.entries(moods).map(([key, mood]) => (
                  <option key={key} value={key}>{mood.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>        {/* Journal Entries */}
        <div className="space-y-6">
          {filteredEntries.map((entry, index) => (
            <div
              key={entry.id}
              className="bg-[#393E46]/80 backdrop-blur-md rounded-2xl p-6 border border-[#00ADB5]/20 hover:shadow-xl transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-4 h-4 bg-gradient-to-r ${moods[entry.mood].color} rounded-full`}></div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#EEEEEE] group-hover:text-[#00ADB5] transition-colors">
                      {entry.title}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-[#EEEEEE]/70">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(entry.date)}</span>
                      <span className="text-[#00ADB5]">•</span>
                      <span className="capitalize">{moods[entry.mood].label}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 hover:bg-[#00ADB5]/20 rounded-lg transition-colors text-[#EEEEEE]">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-[#EEEEEE]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-[#EEEEEE]/80 leading-relaxed mb-4">
                {entry.content.length > 200 
                  ? `${entry.content.substring(0, 200)}...` 
                  : entry.content}
              </p>
              
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-3 py-1 bg-[#00ADB5]/20 text-[#00ADB5] text-sm rounded-full border border-[#00ADB5]/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {filteredEntries.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#393E46] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-[#EEEEEE]/30" />
              </div>
              <h3 className="text-xl font-semibold text-[#EEEEEE]/70 mb-2">
                {searchTerm || selectedMoodFilter !== 'all' 
                  ? 'No entries found' 
                  : 'No journal entries yet'}
              </h3>
              <p className="text-[#EEEEEE]/50 mb-6">
                {searchTerm || selectedMoodFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start your journaling journey by writing your first entry'}
              </p>
              {!searchTerm && selectedMoodFilter === 'all' && (
                <button
                  onClick={() => setIsWriting(true)}
                  className="bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/80 text-white px-6 py-3 rounded-xl hover:shadow-lg flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  <span>Write Your First Entry</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JournalingPage
