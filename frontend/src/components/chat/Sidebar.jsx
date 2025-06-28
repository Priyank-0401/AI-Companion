import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, MessageSquare, Brain, Heart, User, Smile, Coffee, 
  Trash2, Volume2, VolumeX, MoreVertical, ChevronRight, ChevronDown,
  Download, Play, Pause, Settings, LogOut, Sun, Moon, Clock, Search
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const Sidebar = ({
  mobileSidebarOpen,
  setMobileSidebarOpen,
  chatHistory,
  currentConversationId,
  loadChat,
  startNewChat,
  exportChat,
  resetChatHandler,
  selectedModel,
  setSelectedModel,
  showModelDropdown,
  setShowModelDropdown,
  conversationStyle,
  setConversationStyle,
  showOptions,
  setShowOptions,
  voiceEnabled,
  setVoiceEnabled,
  availableVoices,
  selectedVoice,
  setSelectedVoice,
  showVoiceDropdown,
  setShowVoiceDropdown,
  isSpeaking,
  stopSpeaking,
  activeChatDropdown,
  setActiveChatDropdown,
  groupedChatHistory = {},
  deleteChatFromHistory,
  saveChatAsTxt,
  modelOptions = [],
  onLogout
}) => {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const sidebarRef = useRef(null);
  const searchInputRef = useRef(null);
  const conversationStyles = [
    { 
      value: 'supportive', 
      label: 'Supportive', 
      icon: Heart, 
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      hoverBg: 'hover:bg-pink-500/20'
    },
    { 
      value: 'practical', 
      label: 'Practical', 
      icon: Coffee, 
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      hoverBg: 'hover:bg-amber-500/20'
    },
    { 
      value: 'reflective', 
      label: 'Reflective', 
      icon: Brain, 
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      hoverBg: 'hover:bg-indigo-500/20'
    },
    { 
      value: 'cheerful', 
      label: 'Cheerful', 
      icon: Smile, 
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      hoverBg: 'hover:bg-emerald-500/20'
    }
  ];

  const formatDate = (date) => {
    const now = new Date();
    const diff = now - date;
    const dayInMs = 86400000;
    
    if (diff < dayInMs) return 'Today';
    if (diff < dayInMs * 2) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Filter chat history based on search query
  const filteredChatGroups = Object.entries(groupedChatHistory).reduce((acc, [date, chats]) => {
    const filteredChats = chats.filter(chat => 
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filteredChats.length > 0) {
      acc[date] = filteredChats;
    }
    return acc;
  }, {});

  // Handle scroll for shadow effect
  const handleScroll = (e) => {
    setIsScrolled(e.target.scrollTop > 10);
  };

  // Focus search input when pressing Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <motion.aside 
      ref={sidebarRef}
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      className={`fixed md:static h-[calc(100vh-4rem)] pt-12 bg-gray-50 dark:bg-gray-900 w-72 z-50 flex flex-col shadow-xl border-r border-gray-200 dark:border-gray-800 transition-colors duration-200 ${mobileSidebarOpen ? 'block' : 'hidden md:flex'}`}
    >
      {/* Search and New Chat */}
      <div className="px-4 pb-4">
        {/* Search */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search conversations..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-500" />
            </button>
          )}
        </div>
        
        {/* New Chat Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={startNewChat}
          className="flex items-center justify-center w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow-sm font-medium text-sm transition-all duration-200 gap-2 group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          <span>New Chat</span>
          <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">⌘N</span>
        </motion.button>
      </div>

      {/* Model Selection */}
      <div className="px-4 mb-4">
        <div className="relative">
          <button 
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="flex items-center justify-between w-full p-3 bg-[#222831] hover:bg-[#222831]/80 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#00ADB5]" />
              <span className="text-sm font-medium text-[#EEEEEE]">
                {modelOptions.find(m => m.id === selectedModel)?.name || 'Select Model'}
              </span>
            </div>
            <ChevronRight className={`w-4 h-4 text-[#EEEEEE]/70 transition-transform ${showModelDropdown ? 'rotate-90' : ''}`} />
          </button>

          {/* Model Dropdown */}
          <AnimatePresence>
            {showModelDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 right-0 mt-2 bg-[#222831] border border-[#00ADB5]/20 rounded-lg shadow-lg z-10 overflow-hidden"
              >
                {modelOptions.map(model => (
                  <button
                    key={model.id}
                    className={`flex flex-col w-full text-left p-3 hover:bg-[#00ADB5]/10 transition-colors ${model.id === selectedModel ? 'bg-[#00ADB5]/20' : ''}`}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setShowModelDropdown(false);
                    }}
                  >
                    <span className="font-medium text-sm text-[#EEEEEE]">{model.name}</span>
                    <span className="text-xs text-[#EEEEEE]/60">{model.description}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Voice Options */}
      <div className="px-4 mb-4">
        <div className="mb-2">
          <h3 className="text-xs uppercase font-semibold text-[#EEEEEE]/50 tracking-wider px-1">Voice Options</h3>
        </div>
        
        {/* Voice Toggle */}
        <div className="flex items-center justify-between p-3 bg-[#222831] rounded-lg mb-2">
          <div className="flex items-center gap-2">
            {voiceEnabled ? (
              <Volume2 className="w-4 h-4 text-[#00ADB5]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#EEEEEE]/50" />
            )}
            <span className="text-sm font-medium text-[#EEEEEE]">Voice Enabled</span>
          </div>
          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`relative w-10 h-5 rounded-full transition-colors ${voiceEnabled ? 'bg-[#00ADB5]' : 'bg-[#393E46]'}`}
          >
            <motion.div 
              className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white"
              animate={{ x: voiceEnabled ? '1.25rem' : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
        
        {/* Voice Selection */}
        {voiceEnabled && (
          <div className="relative">
            <button 
              onClick={() => setShowVoiceDropdown(!showVoiceDropdown)}
              disabled={!voiceEnabled || availableVoices.length === 0}
              className={`flex items-center justify-between w-full p-3 bg-[#222831] hover:bg-[#222831]/80 rounded-lg transition-colors ${!voiceEnabled || availableVoices.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#00ADB5]" />
                <span className="text-sm font-medium text-[#EEEEEE] truncate max-w-[150px]">
                  {availableVoices.length === 0 ? 'Loading voices...' : 
                    selectedVoice ? selectedVoice.name.replace('Google ', '') : 'Select Voice'}
                </span>
              </div>
              {(voiceEnabled && availableVoices.length > 0) && (
                <ChevronRight className={`w-4 h-4 text-[#EEEEEE]/70 transition-transform ${showVoiceDropdown ? 'rotate-90' : ''}`} />
              )}
            </button>

            {/* Voice Dropdown */}
            <AnimatePresence>
              {showVoiceDropdown && voiceEnabled && availableVoices.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 mt-2 bg-[#222831] border border-[#00ADB5]/20 rounded-lg shadow-lg z-10 overflow-y-auto max-h-60"
                >
                  {availableVoices.map((voice, index) => (
                    <button
                      key={`${voice.name}-${index}`}
                      className={`flex flex-col w-full text-left p-3 hover:bg-[#00ADB5]/10 transition-colors ${selectedVoice && voice.name === selectedVoice.name ? 'bg-[#00ADB5]/20' : ''}`}
                      onClick={() => {
                        setSelectedVoice(voice);
                        setShowVoiceDropdown(false);
                        
                        // Say a short sample
                        if (window.speechSynthesis) {
                          window.speechSynthesis.cancel();
                          const utterance = new SpeechSynthesisUtterance("Hello, I'm Seriva.");
                          utterance.voice = voice;
                          utterance.volume = 0.8;
                          window.speechSynthesis.speak(utterance);
                        }
                      }}
                    >
                      <span className="font-medium text-sm text-[#EEEEEE] truncate">{voice.name.replace('Google ', '')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#EEEEEE]/60">{voice.lang}</span>
                        {voice.name.includes('Google') && (
                          <span className="text-[7px] uppercase bg-[#00ADB5]/30 text-[#00ADB5] px-1 rounded">Google</span>
                        )}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        {/* Voice Status */}
        {voiceEnabled && (
          <div className="mt-2 px-1">
            {isSpeaking && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#00ADB5] flex items-center gap-1">
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >⬤</motion.span>
                  Speaking...
                </span>
                <button
                  onClick={stopSpeaking}
                  className="text-xs text-red-400 hover:text-red-500"
                >
                  Stop
                </button>
              </div>
            )}
            
            {availableVoices.length === 0 && (
              <span className="text-xs text-yellow-400">Loading available voices...</span>
            )}
          </div>
        )}
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="px-2 mb-2">
          <h2 className="text-xs uppercase font-semibold text-[#EEEEEE]/50 tracking-wider">Chat History</h2>
        </div>
        
        {Object.entries(groupedChatHistory).map(([date, chats]) => (
          <div key={date} className="mb-4">
            <div className="px-2 mb-2">
              <h3 className="text-xs font-medium text-[#EEEEEE]/60">{date}</h3>
            </div>
            {chats.map(chat => (
              <div key={chat.id} className="relative group">
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => loadChat(chat.id)}
                  className={`flex items-start w-full p-2 rounded-lg hover:bg-[#00ADB5]/10 transition-colors text-left ${
                    currentConversationId === chat.id ? 'bg-[#00ADB5]/20 border-l-2 border-[#00ADB5]' : ''
                  }`}
                >
                  <MessageSquare className="w-4 h-4 mt-0.5 mr-3 text-[#EEEEEE]/70" />
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-sm font-medium text-[#EEEEEE] truncate">{chat.title}</h4>
                    <p className="text-xs text-[#EEEEEE]/60 truncate">
                      {chat.lastActivity ? chat.lastActivity.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                       chat.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveChatDropdown(activeChatDropdown === chat.id ? null : chat.id);
                    }}
                    className="p-1 rounded hover:bg-[#393E46] transition-colors"
                  >
                    <MoreVertical className="w-3 h-3 text-[#EEEEEE]/70" />
                  </motion.button>
                  
                  <AnimatePresence>
                    {activeChatDropdown === chat.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute right-0 mt-1 w-48 bg-[#222831] rounded-md shadow-lg z-10 border border-[#00ADB5]/20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            saveChatAsTxt(chat);
                            setActiveChatDropdown(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-[#EEEEEE] hover:bg-[#00ADB5]/10 transition-colors"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          <span>Download as TXT</span>
                        </button>
                        <button
                          onClick={() => {
                            deleteChatFromHistory(chat.id);
                            setActiveChatDropdown(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          <span>Delete</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </motion.aside>
  );
};

export default Sidebar;
