    import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, MessageSquare, Brain, Heart, User, Smile, Coffee, 
  Trash2, MoreVertical, ChevronRight, ChevronDown,
  Download, Settings, LogOut, Sun, Moon, Clock, Search, Loader2
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { format, isToday, isYesterday, subDays, parseISO } from 'date-fns';

// Group chats by date
const groupChats = (chats) => {
  const today = [];
  const yesterday = [];
  const last7Days = [];
  const older = [];
  const now = new Date();

  const validChats = (chats || [])
    .filter(chat => {
      if (!chat) return false;
      if (!chat.id) chat.id = `temp-${Math.random().toString(36).substr(2, 9)}`;
      if (!chat.updatedAt) chat.updatedAt = new Date().toISOString();
      if (!chat.title) chat.title = 'New Chat';
      if (!Array.isArray(chat.messages)) chat.messages = [];
      return true;
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  validChats.forEach(chat => {
    try {
      const chatDate = new Date(chat.updatedAt);
      if (isNaN(chatDate.getTime())) return;
      
      if (isToday(chatDate)) {
        today.push(chat);
      } else if (isYesterday(chatDate)) {
        yesterday.push(chat);
      } else if (chatDate > subDays(now, 7)) {
        last7Days.push(chat);
      } else {
        older.push(chat);
      }
    } catch (error) {
      console.error('Error processing chat:', chat, error);
    }
  });

  return { today, yesterday, last7Days, older };
};

// Date utility functions
const isLast7Days = (date) => {
  const weekAgo = subDays(new Date(), 7);
  return date >= weekAgo && !isToday(date) && !isYesterday(date);
};

const isOlderThanAWeek = (date) => {
  const weekAgo = subDays(new Date(), 7);
  return date < weekAgo;
};

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

const ConfirmationDialog = ({ isOpen, onConfirm, onCancel, title, message, confirmText = 'Delete', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {message}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const ChatItem = ({ chat, isActive, onSelect, onDelete, onExport }) => {
  const { theme } = useTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      await onDelete(chat.id);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }, [chat.id, onDelete]);

  const handleCancelDelete = useCallback((e) => {
    e?.stopPropagation();
    setShowDeleteConfirm(false);
  }, []);

  const handleSelect = useCallback(() => {
    onSelect(chat.id);
  }, [chat.id, onSelect]);

  const toggleDropdown = useCallback((e) => {
    e.stopPropagation();
    setShowDropdown(prev => !prev);
  }, []);

  // Format the last updated time
  const formattedTime = useMemo(() => {
    if (!chat.updatedAt) return '';
    const date = new Date(chat.updatedAt);
    return format(date, 'h:mm a');
  }, [chat.updatedAt]);

  // Get a preview of the last message
  const lastMessagePreview = useMemo(() => {
    if (!chat.messages || chat.messages.length === 0) return 'No messages yet';
    
    const lastMessage = [...chat.messages].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    )[0];
    
    const content = lastMessage.content || '';
    return content.length > 30 ? `${content.substring(0, 30)}...` : content;
  }, [chat.messages]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className={`group relative flex items-start px-3 py-2.5 rounded-lg transition-colors ${
        isActive 
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
      }`}
      onClick={handleSelect}
    >
      <div className="flex-shrink-0 mt-0.5">
        <MessageSquare className="w-4 h-4 text-gray-400" />
      </div>
      
      <div className="ml-2 min-w-0 flex-1">
        <div className="flex justify-between items-start">
          <h4 className="text-sm font-medium truncate">
            {chat.title || 'New Chat'}
          </h4>
          <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
            {formattedTime}
          </span>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {lastMessagePreview}
        </p>
      </div>
      
      <div className="ml-2 flex items-center">
        <button 
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className={`p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-opacity ${isDeleting ? 'opacity-70 cursor-not-allowed' : ''}`}
          aria-label="Delete chat"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
        
        <ConfirmationDialog
          isOpen={showDeleteConfirm}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          title="Delete Conversation"
          message="Are you sure you want to delete this conversation? This action cannot be undone."
          confirmText={isDeleting ? 'Deleting...' : 'Delete'}
          cancelText="Cancel"
        />
      </div>
    </motion.div>
  );
};

const DateGroup = ({ 
  title, 
  chats = [], 
  isOpen = true, 
  onToggle, 
  onChatSelect, 
  activeChatId, 
  onDeleteChat, 
  onExportChat 
}) => {
  const [isExpanded, setIsExpanded] = useState(isOpen);
  const { theme } = useTheme();

  // Sync with parent's expanded state
  useEffect(() => {
    setIsExpanded(isOpen);
  }, [isOpen]);

  const toggleExpand = useCallback(() => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onToggle) onToggle(newState);
  }, [isExpanded, onToggle]);
  
  // Don't render if no chats
  if (chats.length === 0) return null;

  return (
    <div className="mb-4">
      <button 
        onClick={toggleExpand}
        className="flex items-center w-full text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 mr-1.5 transition-transform duration-200 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
        ) : (
          <ChevronRight className="w-4 h-4 mr-1.5 transition-transform duration-200 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
        )}
        <span className="group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
          {title}
        </span>
        <span className="ml-auto bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 group-hover:text-gray-700 dark:group-hover:text-gray-200 text-xs font-normal px-2 py-0.5 rounded-full transition-colors">
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
              open: { 
                opacity: 1, 
                height: 'auto',
                transition: { 
                  opacity: { duration: 0.2, ease: 'easeInOut' },
                  height: { duration: 0.2, ease: 'easeInOut' }
                }
              },
              collapsed: { 
                opacity: 0, 
                height: 0,
                transition: { 
                  opacity: { duration: 0.15, ease: 'easeInOut' },
                  height: { duration: 0.15, ease: 'easeInOut' }
                }
              }
            }}
            className="space-y-1 pl-6 overflow-hidden"
          >
            {chats
              .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
              .map(chat => (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                  transition={{ duration: 0.15 }}
                  className="relative"
                >
                  <ChatItem
                    chat={chat}
                    isActive={activeChatId === chat.id}
                    onSelect={onChatSelect}
                    onDelete={onDeleteChat}
                    onExport={onExportChat}
                  />
                </motion.div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Sidebar({ 
  isOpen = true, 
  onToggle,
  className = ''
}) {
  // Get chat context
  const { 
    sessions, 
    currentSessionId,
    isLoading,
    error,
    createNewSession,
    switchSession,
    deleteSession,
    exportSession,
    refreshConversations
  } = useChat();
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    today: true,
    yesterday: true,
    last7Days: true,
    older: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  // Refs for click outside handlers
  const modelButtonRef = useRef(null);
  const settingsButtonRef = useRef(null);
  
  // Handle refresh conversations
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refreshConversations();
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshConversations]);
  
  // Group chats by date
  const groupChatsByDate = useCallback((chats) => {
    const today = [];
    const yesterday = [];
    const last7Days = [];
    const older = [];
    const now = new Date();

    const validChats = (chats || [])
      .filter(chat => {
        if (!chat) return false;
        if (!chat.id) chat.id = `temp-${Math.random().toString(36).substr(2, 9)}`;
        if (!chat.updatedAt) chat.updatedAt = new Date().toISOString();
        if (!chat.title) chat.title = 'New Chat';
        if (!Array.isArray(chat.messages)) chat.messages = [];
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    validChats.forEach(chat => {
      try {
        const chatDate = new Date(chat.updatedAt);
        if (isNaN(chatDate.getTime())) return;
        
        if (isToday(chatDate)) {
          today.push(chat);
        } else if (isYesterday(chatDate)) {
          yesterday.push(chat);
        } else if (chatDate > subDays(now, 7)) {
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

  // Filter and group chats based on search query
  const filteredGroupedChats = useMemo(() => {
    let chatsToGroup = sessions || [];
    
    // Apply search filter if there's a search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      chatsToGroup = chatsToGroup.filter(chat => {
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
    }
    
    return groupChatsByDate(chatsToGroup);
  }, [sessions, searchQuery, groupChatsByDate]);

  // Handle chat selection
  const handleChatSelect = useCallback(async (chat) => {
    if (!chat) return;
    
    // Handle both direct sessionId or full chat object
    const sessionId = typeof chat === 'string' ? chat : chat.id;
    
    try {
      await switchSession(sessionId);
      // Close sidebar on mobile after selection
      if (window.innerWidth < 768) {
        onToggle();
      }
    } catch (error) {
      console.error('Error switching chat:', error);
    }
  }, [switchSession, onToggle]);

  // Handle chat deletion
  const handleDeleteChat = useCallback(async (chatId) => {
    try {
      await deleteSession(chatId);
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  }, [deleteSession]);

  // Handle chat export
  const handleExportChat = useCallback(async (chatId) => {
    try {
      await exportSession(chatId);
    } catch (error) {
      console.error('Error exporting chat:', error);
    }
  }, [exportSession]);

  // Handle new chat
  const handleNewChat = useCallback(async () => {
    try {
      await createNewSession();
      // Close sidebar on mobile after creating a new chat
      if (window.innerWidth < 768) {
        onToggle();
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  }, [createNewSession, onToggle]);
  
  // Toggle group expansion
  const toggleGroup = useCallback((group) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  }, []);
  
  // Get theme and auth context
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  
  // Local state for UI
  const searchInputRef = useRef(null);
  // settingsButtonRef is already declared above

  // Toggle settings menu
  const toggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
  }, []);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsButtonRef.current && !settingsButtonRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowSettings(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return sessions || [];
    
    const query = searchQuery.toLowerCase().trim();
    return (sessions || []).filter(chat => {
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
  }, [sessions, searchQuery]);
  
  // Group chats by date using filtered or all sessions
  const { today, yesterday, last7Days, older } = useMemo(() => {
    const chatsToGroup = searchQuery ? filteredChats : (sessions || []);
    return groupChats(chatsToGroup);
  }, [filteredChats, sessions, searchQuery]);

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

  // Handle logout
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  // Use the first model option as default if none selected
  const selectedStyle = CONVERSATION_STYLES[0];

  return (
    <motion.aside
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: isOpen ? 0 : -300, opacity: isOpen ? 1 : 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      className={`fixed md:relative h-screen w-72 pt-16 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-40 ${className}`}
    >
      {/* Header with title and refresh button */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chats</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="Refresh conversations"
        >
          <Loader2 className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Search and New Chat */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            ref={searchInputRef}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-500" />
            </button>
          )}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleNewChat}
          className="flex items-center justify-center w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow-sm font-medium text-sm transition-all duration-200 gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </motion.button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            <p>Error loading conversations</p>
            <button 
              onClick={handleRefresh}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Retry
            </button>
          </div>
        ) : searchQuery && filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <MessageSquare className="w-10 h-10 text-gray-400 mb-3" />
            <h3 className="text-gray-500 dark:text-gray-400 font-medium">No matching chats found</h3>
            <p className="text-sm text-gray-400 mt-1">Try a different search term or create a new chat</p>
          </div>
        ) : sessions.length === 0 ? (
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
            {filteredGroupedChats.today.length > 0 && (
              <DateGroup 
                title="Today" 
                chats={filteredGroupedChats.today} 
                onChatSelect={handleChatSelect}
                activeChatId={currentSessionId}
                onDeleteChat={handleDeleteChat}
                onExportChat={handleExportChat}
              />
            )}
            
            {filteredGroupedChats.yesterday.length > 0 && (
              <DateGroup 
                title="Yesterday" 
                chats={filteredGroupedChats.yesterday} 
                onChatSelect={handleChatSelect}
                activeChatId={currentSessionId}
                onDeleteChat={handleDeleteChat}
                onExportChat={handleExportChat}
              />
            )}
            
            {filteredGroupedChats.last7Days.length > 0 && (
              <DateGroup 
                title="Previous 7 Days" 
                chats={filteredGroupedChats.last7Days} 
                onChatSelect={handleChatSelect}
                activeChatId={currentSessionId}
                onDeleteChat={handleDeleteChat}
                onExportChat={handleExportChat}
              />
            )}
            
            {filteredGroupedChats.older.length > 0 && (
              <DateGroup 
                title="Older" 
                chats={filteredGroupedChats.older} 
                onChatSelect={handleChatSelect}
                activeChatId={currentSessionId}
                onDeleteChat={handleDeleteChat}
                onExportChat={handleExportChat}
              />
            )}
          </>
        )}
      </div>
    </motion.aside>
  );
}
