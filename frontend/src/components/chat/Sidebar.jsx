    import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, MessageSquare, Brain, Heart, User, Smile, Coffee, 
  Trash2, MoreVertical, ChevronRight, ChevronDown,
  Download, Settings, LogOut, Sun, Moon, Clock, Search
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import ThemeContext from '../../contexts/ThemeContext';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { format, isToday, isYesterday, subDays } from 'date-fns';

const CONVERSATION_STYLES = [
  { 
    value: 'supportive', 
    label: 'Supportive', 
    icon: Heart, 
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    hoverBg: 'hover:bg-pink-500/20',
    description: 'Warm and encouraging responses'
  },
  { 
    value: 'practical', 
    label: 'Practical', 
    icon: Coffee, 
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    hoverBg: 'hover:bg-amber-500/20',
    description: 'Focused on actionable advice'
  },
  { 
    value: 'reflective', 
    label: 'Reflective', 
    icon: Brain, 
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    hoverBg: 'hover:bg-indigo-500/20',
    description: 'Thoughtful and analytical responses'
  },
  { 
    value: 'cheerful', 
    label: 'Cheerful', 
    icon: Smile, 
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    hoverBg: 'hover:bg-emerald-500/20',
    description: 'Upbeat and positive responses'
  }
];

const ChatItem = ({ chat, isActive, onSelect, onDelete, onExport }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { theme } = useTheme();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(chat.id);
    setShowDropdown(false);
  };

  const handleExport = (e) => {
    e.stopPropagation();
    onExport(chat.id);
    setShowDropdown(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className={`group relative flex items-center px-3 py-2.5 rounded-lg transition-colors ${
        isActive 
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
      }`}
      onClick={() => onSelect(chat.id)}
    >
      <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
      <span className="truncate flex-1 text-sm">{chat.title}</span>
      <div className="flex items-center ml-2">
        <span className="text-xs text-gray-400 mr-1">
          {format(new Date(chat.updatedAt), 'h:mm a')}
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowDropdown(!showDropdown);
          }}
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-8 z-10 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <button
              onClick={handleExport}
              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const DateGroup = ({ title, chats, isOpen = true, onToggle, onChatSelect, activeChatId, onDeleteChat, onExportChat }) => {
  const [isExpanded, setIsExpanded] = useState(isOpen);
  const { theme } = useTheme();

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (onToggle) onToggle(!isExpanded);
  };

  if (chats.length === 0) return null;

  return (
    <div className="mb-4">
      <button 
        onClick={toggleExpand}
        className="flex items-center w-full px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <ChevronRight 
          className={`w-3.5 h-3.5 mr-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
        />
        {title}
        <span className="ml-auto text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
          {chats.length}
        </span>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto' },
              collapsed: { opacity: 0, height: 0 }
            }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1 space-y-1 pl-4">
              {chats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === activeChatId}
                  onSelect={onChatSelect}
                  onDelete={onDeleteChat}
                  onExport={onExportChat}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Sidebar({ 
  isOpen = true, 
  onToggle,
  className = '',
  chatHistory = [],
  currentConversationId,
  loadChat,
  startNewChat,
  deleteChatFromHistory,
  saveChatAsTxt
}) {
  // Get theme and chat context
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { selectedModel, setSelectedModel, conversationStyle, setConversationStyle } = useChat();
  
  // Local state for UI
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  // Use the chatHistory prop as the main source of chats
  const chats = chatHistory;
  const [currentStyle, setCurrentStyle] = useState(conversationStyle);
  
  // Update local state when prop changes
  useEffect(() => {
    setCurrentStyle(conversationStyle);
  }, [conversationStyle]);
  
  const handleStyleChange = (style) => {
    setCurrentStyle(style);
    setConversationStyle(style);
  };
  
  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setShowModelDropdown(false);
  };
  
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const searchInputRef = useRef(null);
  const modelButtonRef = useRef(null);
  const settingsButtonRef = useRef(null);

  // Group chats by date
  const groupChatsByDate = useCallback((chats) => {
    const today = [];
    const yesterday = [];
    const last7Days = [];
    const older = [];
    
    if (!Array.isArray(chats)) {
      console.warn('Chats is not an array:', chats);
      return { today, yesterday, last7Days, older };
    }
    
    // Filter out any null or undefined chats and ensure they have required fields
    const validChats = chats
      .filter(chat => {
        if (!chat) return false;
        if (!chat.id) chat.id = `temp-${Math.random().toString(36).substr(2, 9)}`;
        if (!chat.updatedAt) chat.updatedAt = new Date().toISOString();
        if (!chat.title) chat.title = 'New Chat';
        if (!Array.isArray(chat.messages)) chat.messages = [];
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const now = new Date();

    validChats.forEach(chat => {
      try {
        const chatDate = new Date(chat.updatedAt);
        if (isNaN(chatDate.getTime())) return;
        
        const diffTime = now - chatDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (isToday(chatDate)) {
          today.push(chat);
        } else if (isYesterday(chatDate)) {
          yesterday.push(chat);
        } else if (diffDays <= 7) {
          last7Days.push(chat);
        } else {
          older.push(chat);
        }
      } catch (error) {
        console.error('Error processing chat:', chat, error);
      }
    });

    return { today, yesterday, last7Days, older };
  }, []);

  const { today, yesterday, last7Days, older } = groupChatsByDate(chats);

  // Filter chats based on search query
  const filteredChats = useCallback(() => {
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase().trim();
    
    return (chats || []).filter(chat => {
      if (!chat) return false;
      
      // Check title match
      const titleMatch = chat.title?.toLowerCase().includes(query) || false;
      
      // Check message content match
      const messageMatch = Array.isArray(chat.messages) && chat.messages.some(msg => {
        if (msg.role === 'user' && msg.content) {
          return msg.content.toLowerCase().includes(query);
        }
        return false;
      });
      
      return titleMatch || messageMatch;
    });
  }, [chats, searchQuery]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelButtonRef.current && !modelButtonRef.current.contains(event.target)) {
        setShowModelDropdown(false);
      }
      if (settingsButtonRef.current && !settingsButtonRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K or Ctrl+K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Cmd+N or Ctrl+N for new chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleNewChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNewChat = useCallback(() => {
    if (startNewChat) {
      startNewChat();
    } else if (loadChat) {
      // If no specific new chat handler, create a new empty chat
      const newChat = {
        id: `temp-${Date.now()}`,
        title: 'New Chat',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      };
      loadChat(newChat.id);
    }
    setMobileSidebarOpen(false);
  }, [startNewChat, loadChat]);

  const handleChatSelect = useCallback((chat) => {
    if (!chat) return;
    
    // Find the full chat object to ensure we have all properties
    const fullChat = chats.find(c => c?.id === chat.id) || chat;
    
    if (loadChat) {
      loadChat(fullChat.id);
    }
    
    setMobileSidebarOpen(false);
  }, [chats, loadChat]);

  const handleDeleteChat = (chatId) => {
    if (window.confirm('Are you sure you want to delete this chat? This cannot be undone.')) {
      deleteChatFromHistory?.(chatId);
    }
  };

  const handleExportChat = (chatId) => {
    saveChatAsTxt?.(chatId);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  const filtered = searchQuery ? groupChatsByDate(filteredChats()) : { today, yesterday, last7Days, older };
  // Use the first model option as default if none selected
  const selectedStyle = CONVERSATION_STYLES.find(s => s.value === currentStyle) || CONVERSATION_STYLES[0];

  return (
    <motion.aside
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: isOpen ? 0 : -300, opacity: isOpen ? 1 : 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      className={`fixed md:relative h-screen w-72 pt-16 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-40 ${className}`}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
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
          onClick={handleNewChat}
          className="flex items-center justify-center w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow-sm font-medium text-sm transition-all duration-200 gap-2"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          <span>New Chat</span>
        </motion.button>
      </div>

      {/* Conversation Style Selector */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-1">CONVERSATION STYLE</p>
          <div className="grid grid-cols-2 gap-2">
            {CONVERSATION_STYLES.map(style => {
              const isActive = currentStyle === style.value;
              const Icon = style.icon;
              
              return (
                <motion.button
                  key={style.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStyleChange(style.value)}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? `${style.bgColor} ${style.color}`
                      : `bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 ${style.hoverBg}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{style.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        {searchQuery && chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <MessageSquare className="w-10 h-10 text-gray-400 mb-3" />
            <h3 className="text-gray-500 dark:text-gray-400 font-medium">No matching chats found</h3>
            <p className="text-sm text-gray-400 mt-1">Try a different search term or create a new chat</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <MessageSquare className="w-10 h-10 text-gray-400 mb-3" />
            <h3 className="text-gray-500 dark:text-gray-400 font-medium">No chats yet</h3>
            <p className="text-sm text-gray-400 mt-1">Get started by creating a new chat</p>
            <button
              onClick={handleNewChat}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              New Chat
            </button>
          </div>
        ) : (
          <>
            <DateGroup 
              title="Today" 
              chats={filtered.today} 
              onChatSelect={handleChatSelect}
              activeChatId={currentChatId}
              onDeleteChat={handleDeleteChat}
              onExportChat={handleExportChat}
            />
            
            <DateGroup 
              title="Yesterday" 
              chats={filtered.yesterday} 
              onChatSelect={handleChatSelect}
              activeChatId={currentChatId}
              onDeleteChat={handleDeleteChat}
              onExportChat={handleExportChat}
            />
            
            <DateGroup 
              title="Previous 7 Days" 
              chats={filtered.last7Days} 
              onChatSelect={handleChatSelect}
              activeChatId={currentChatId}
              onDeleteChat={handleDeleteChat}
              onExportChat={handleExportChat}
            />
            
            <DateGroup 
              title="Older" 
              chats={filtered.older} 
              onChatSelect={handleChatSelect}
              activeChatId={currentChatId}
              onDeleteChat={handleDeleteChat}
              onExportChat={handleExportChat}
            />
          </>
        )}
      </div>
    </motion.aside>
  );
}
