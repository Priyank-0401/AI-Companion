import { FiPlus, FiSearch, FiCheck, FiX, FiMenu, FiMessageSquare, FiSun, FiMoon, FiChevronDown, FiHeart, FiZap, FiSmile, FiCompass } from 'react-icons/fi';
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

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
        isSelected
          ? 'bg-white dark:bg-gray-800 shadow-md border-l-4 border-blue-500 pl-2.5'
          : 'hover:bg-white/80 dark:hover:bg-gray-700/50 border-l-4 border-transparent hover:border-gray-200 dark:hover:border-gray-600'
      }`}
      onClick={() => onSelect(conversationId, conversationStyle)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center min-w-0">
        <div className={`p-2 rounded-lg mr-3 ${
          isSelected
            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        }`}>
          <FiMessageSquare className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium truncate ${
            isSelected
              ? 'text-gray-900 dark:text-white' 
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            {safeConversation.title || 'New Chat'}
          </h3>
          <p className={`text-xs truncate ${
            isSelected
              ? 'text-gray-500 dark:text-gray-400' 
              : 'text-gray-400 dark:text-gray-500'
          }`}>
            {safeConversation.lastMessage || 'No messages yet'}
          </p>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(conversationId);
        }}
        className={`p-1 rounded-full ${
          isHovered || isSelected
            ? 'opacity-100 text-gray-400 hover:text-red-500'
            : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500'
        } transition-opacity`}
        aria-label="Delete conversation"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
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
  // Debug logging
  console.log('=== CHAT SIDEBAR RENDER ===');
  console.log('validatedStyle:', validatedStyle);
  console.log('selectedConversation:', selectedConversation);
  
  // Debug effect for tracking style changes
  useEffect(() => {
    console.log('Conversation style changed:', validatedStyle);
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

  useEffect(() => {
    if (isOpen && searchInputRef.current && isMobile) {
      searchInputRef.current.focus();
    }
  }, [isOpen, isMobile]);
  if (!isOpen) return null;

  // Define valid styles for safety check
  const validStyles = ['empathetic', 'coach', 'playful', 'mindful'];
  const defaultStyle = 'empathetic';
  
  // Use the validated style for the dropdown
  const [selectedStyle, setSelectedStyle] = useState(validatedStyle);
  
  // Update selected style when validatedStyle changes
  useEffect(() => {
    if (validatedStyle && validatedStyle !== selectedStyle) {
      setSelectedStyle(validatedStyle);
    }
  }, [validatedStyle, selectedStyle]);
  
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
    <div className="h-full w-72 flex-shrink-0 flex flex-col bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
        <AnimatePresence>
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 mb-3">
                <FiMessageSquare className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No conversations</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No matches found' : 'Start a new chat to begin'}
              </p>
              {!searchQuery && (
                <button
                  onClick={onNewChat}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  New Chat
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={selectedConversation?.id === conversation.id}
                  onSelect={onSelectConversation}
                  onDelete={onDeleteConversation}
                  selectedConversation={selectedConversation}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
      
      {/* User Profile and Theme Toggle */}
      <div className="mt-auto p-4 border-t border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium shadow-inner">
              U
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">User</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Free Plan</p>
            </div>
          </div>
          <ThemeToggleButton />
        </div>
      </div>
    </div>
  );
};

// Theme Toggle Button Component
const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <FiSun className="w-5 h-5" />
      ) : (
        <FiMoon className="w-5 h-5" />
      )}
    </button>
  );
};

export default ChatSidebar;
