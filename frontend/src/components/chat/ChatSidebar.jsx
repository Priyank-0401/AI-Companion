import { FiPlus, FiSearch, FiCheck, FiTrash2, FiMenu, FiMessageSquare, FiSun, FiMoon, FiChevronDown, FiHeart, FiZap, FiSmile, FiCompass, FiX } from 'react-icons/fi';
import { FaBrain, FaLaughSquint } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/useTheme';

const ConversationItem = ({ 
  conversation, 
  isActive, 
  onSelect, 
  onDelete,
  selectedConversation
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Safely handle null/undefined conversation
  const safeConversation = conversation || { id: '', title: 'New Chat', lastMessage: '', style: 'empathetic' };
  const conversationId = safeConversation.id || '';
  const conversationStyle = safeConversation.style || 'empathetic';
  
  // Handle both string and object types for selectedConversation
  const isSelected = typeof selectedConversation === 'string' 
    ? selectedConversation === conversationId
    : selectedConversation?.id === conversationId;

  // Get style-based colors
  const getStyleColors = (style) => {
    switch(style) {
      case 'empathetic': return { bg: 'from-purple-500 to-pink-500', text: 'text-purple-600 dark:text-purple-400' };
      case 'coach': return { bg: 'from-green-500 to-emerald-500', text: 'text-green-600 dark:text-green-400' };
      case 'playful': return { bg: 'from-yellow-500 to-orange-500', text: 'text-yellow-600 dark:text-yellow-400' };
      case 'mindful': return { bg: 'from-blue-500 to-cyan-500', text: 'text-blue-600 dark:text-blue-400' };
      default: return { bg: 'from-purple-500 to-pink-500', text: 'text-purple-600 dark:text-purple-400' };
    }
  };

  const styleColors = getStyleColors(conversationStyle);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`group relative flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 shadow-lg border border-gray-200 dark:border-gray-600'
          : 'hover:bg-gradient-to-r hover:from-white/60 hover:to-gray-50/60 dark:hover:from-gray-800/60 dark:hover:to-gray-700/60 hover:shadow-md'
      }`}
      onClick={() => onSelect(conversationId, conversationStyle)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection indicator */}
      {isSelected && (
        <motion.div 
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          className={`absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b ${styleColors.bg} rounded-r-full`}
        />
      )}
      
      <div className="flex items-center min-w-0 flex-1">
        <div className={`relative p-3 rounded-xl mr-4 transition-all duration-300 ${
          isSelected
            ? `bg-gradient-to-br ${styleColors.bg} text-white shadow-md` 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
        }`}>
          <FiMessageSquare className="w-5 h-5" />
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold truncate transition-colors ${
            isSelected
              ? 'text-gray-900 dark:text-white' 
              : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
          }`}>
            {safeConversation.title || 'New Chat'}
          </h3>
          <p className={`text-xs truncate mt-1 transition-colors ${
            isSelected
              ? 'text-gray-600 dark:text-gray-400' 
              : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'
          }`}>
            {safeConversation.lastMessage || 'No messages yet'}
          </p>
        </div>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(null);
        }}
        className={`p-2 rounded-full transition-all duration-200 ${
          isHovered || isSelected
            ? 'opacity-100 bg-gray-50 dark:bg-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'
            : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
        aria-label="Close chat"
      >
        <FiX className="w-4 h-4" />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(conversationId);
        }}
        className={`p-2 rounded-full transition-all duration-200 ${
          isHovered || isSelected
            ? 'opacity-100 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40'
            : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
        }`}
        aria-label="Delete conversation"
      >
        <FiTrash2 className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
};

export const ChatSidebar = ({
  isOpen = true,
  conversations = [],
  searchQuery = '',
  onSearchChange = () => {},
  onNewChat = () => {},
  onSelectConversation = () => {},
  onDeleteConversation = () => {},
  selectedConversation = null,
  conversationStyle: propStyle,
  onStyleChange = () => {}
}) => {
  // Ensure we have a valid style
  const validatedStyle = propStyle && ['empathetic', 'coach', 'playful', 'mindful'].includes(propStyle) 
    ? propStyle 
    : 'empathetic';
  
  // Debug effect for tracking style changes
  useEffect(() => {
    //console.log('Conversation style changed:', validatedStyle);
  }, [validatedStyle]);
  const [isMobile, setIsMobile] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Define valid styles for safety check (moved before early return)
  const validStyles = ['empathetic', 'coach', 'playful', 'mindful'];
  const defaultStyle = 'empathetic';
  
  // Use the validated style for the dropdown (moved before early return)
  const [selectedStyle, setSelectedStyle] = useState(validatedStyle);
  
  // Update selected style when validatedStyle changes (moved before early return)
  useEffect(() => {
    if (validatedStyle && validatedStyle !== selectedStyle) {
      setSelectedStyle(validatedStyle);
    }
  }, [validatedStyle, selectedStyle]);

  useEffect(() => {
    if (isOpen && searchInputRef.current && isMobile) {
      searchInputRef.current.focus();
    }
  }, [isOpen, isMobile]);
  
  // Early return after all hooks are called
  if (!isOpen) return null;
  
  const handleStyleChange = (styleId) => {
    if (!styleId) return; // Don't allow setting to null/undefined
    setSelectedStyle(styleId);
    onStyleChange(styleId);
  };
  const conversationStyles = [
    { 
      id: 'empathetic', 
      name: 'Empathetic',
      color: 'text-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900/20',
      icon: <FiHeart className="w-4 h-4" />,
      emoji: '🫂',
      prompt: 'You are an empathetic listener. Respond with warmth, calmness, and without judgment. Focus on emotional support and validation rather than solutions. Be gentle and understanding in your responses.'
    },
    { 
      id: 'coach', 
      name: 'Insightful Coach',
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/20',
      icon: <FaBrain className="w-4 h-4" />,
      emoji: '🧠',
      prompt: 'You are an insightful coach. Be encouraging, constructive, and goal-oriented. Help with habit building, goal setting, and productivity. Offer practical suggestions and celebrate progress.'
    },
    { 
      id: 'playful', 
      name: 'Playful Buddy',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      icon: <FaLaughSquint className="w-4 h-4" />,
      emoji: '🎭',
      prompt: 'You are a playful and fun companion. Keep the tone casual, friendly, and sometimes humorous. Share jokes, fun facts, and keep the conversation light-hearted.'
    },
    { 
      id: 'mindful', 
      name: 'Mindful Guide',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
      icon: <FiCompass className="w-4 h-4" />,
      emoji: '🧘‍♀️',
      prompt: 'You are a mindful guide. Maintain a calm, spiritual, and meditative tone. Offer breathing exercises, guided meditations, and gentle reminders for mindfulness and relaxation.'
    }
  ];

  return (
    <div className="h-full w-72 flex-shrink-0 flex flex-col bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 border-r border-gray-200/60 dark:border-gray-700/60">
      {/* Header */}
      <div className="p-6 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-750 dark:to-gray-800 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="mb-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Conversations
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your chat history with Seriva</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <FiPlus className="w-5 h-5" />
          New Chat
        </motion.button>
      </div>

      {/* Conversation Style Dropdown */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="relative w-full max-w-[240px] mx-auto">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
            Conversation Style
          </label>
          
          <div className="relative group">
            {/* Custom Select Button - Hover only */}
            <div 
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 cursor-pointer transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
              onClick={(e) => e.preventDefault()}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">
                  {conversationStyles.find(s => s.id === selectedStyle)?.emoji || '🫂'}
                </span>
                <span className="font-medium">
                  {conversationStyles.find(s => s.id === selectedStyle)?.name || 'Empathetic'}
                </span>
              </div>
              <FiChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-200 group-hover:translate-y-0.5" />
            </div>

            {/* Hidden Native Select for Accessibility - Prevent click events */}
            <select
              value={selectedStyle}
              onChange={(e) => handleStyleChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ pointerEvents: 'none' }}
              aria-label="Select conversation style"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => e.preventDefault()}
            >
              {conversationStyles.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>

            {/* Dropdown Options - Show on hover only */}
            <div 
              className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0"
            >
              {conversationStyles.map((style) => (
                <div
                  key={`style-${style.id}`}
                  onClick={() => handleStyleChange(style.id)}
                  className={`flex items-center px-4 py-2.5 text-sm cursor-pointer transition-colors duration-150 ${
                    selectedStyle === style.id 
                      ? `${style.bgColor} ${style.color} font-medium`
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600/50'
                  }`}
                >
                  <span key={`emoji-${style.id}`} className="mr-3 text-lg">{style.emoji}</span>
                  <span key={`name-${style.id}`}>{style.name}</span>
                  {selectedStyle === style.id && (
                    <FiCheck key={`check-${style.id}`} className="ml-auto w-4 h-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
            placeholder="Search conversations..."
          />
        </div>
      </div>
      
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2">
        <AnimatePresence>
          {conversations.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full py-12 px-4 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-400 mb-4 shadow-inner">
                <FiMessageSquare className="w-7 h-7" />
              </div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">No conversations yet</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
                {searchQuery ? 'No matches found for your search' : 'Start your first conversation with Seriva'}
              </p>
              {!searchQuery && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onNewChat}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Start Chatting
                </motion.button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation, index) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ConversationItem
                    conversation={conversation}
                    isActive={selectedConversation?.id === conversation.id}
                    onSelect={onSelectConversation}
                    onDelete={onDeleteConversation}
                    selectedConversation={selectedConversation}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatSidebar;
