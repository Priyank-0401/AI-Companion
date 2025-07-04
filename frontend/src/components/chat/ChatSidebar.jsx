import { FiPlus, FiSearch, FiCheck, FiX, FiMenu, FiMessageSquare } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

const ConversationItem = ({ 
  conversation, 
  isActive, 
  onSelect, 
  onDelete,
  selectedConversation
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
        selectedConversation === conversation.id
          ? 'bg-white dark:bg-gray-800 shadow-md border-l-4 border-blue-500 pl-2.5'
          : 'hover:bg-white/80 dark:hover:bg-gray-700/50 border-l-4 border-transparent hover:border-gray-200 dark:hover:border-gray-600'
      }`}
      onClick={() => onSelect(conversation.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center min-w-0">
        <div className={`p-2 rounded-lg mr-3 ${
          selectedConversation === conversation.id 
            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        }`}>
          <FiMessageSquare className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium truncate ${
            selectedConversation === conversation.id 
              ? 'text-gray-900 dark:text-white' 
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            {conversation.title || 'New Chat'}
          </h3>
          <p className={`text-xs truncate ${
            selectedConversation === conversation.id 
              ? 'text-gray-500 dark:text-gray-400' 
              : 'text-gray-400 dark:text-gray-500'
          }`}>
            {conversation.lastMessage || 'No messages yet'}
          </p>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(conversation.id);
        }}
        className={`p-1 rounded-full ${
          isHovered || selectedConversation === conversation.id
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
  conversationStyle = 'empathetic',
  onStyleChange = () => {}
}) => {
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

  const [selectedStyle, setSelectedStyle] = useState(conversationStyle);
  
  useEffect(() => {
    setSelectedStyle(conversationStyle);
  }, [conversationStyle]);
  
  const handleStyleChange = (styleId) => {
    setSelectedStyle(styleId);
    onStyleChange(styleId);
  };
  const conversationStyles = [
    { 
      id: 'empathetic', 
      name: 'Empathetic Listener', 
      prompt: 'You are an empathetic listener. Respond with warmth, calmness, and without judgment. Focus on emotional support and validation rather than solutions. Be gentle and understanding in your responses.'
    },
    { 
      id: 'coach', 
      name: 'Insightful Coach', 
      prompt: 'You are an insightful coach. Be encouraging, constructive, and goal-oriented. Help with habit building, goal setting, and productivity. Offer practical suggestions and celebrate progress.'
    },
    { 
      id: 'playful', 
      name: 'Playful Buddy', 
      prompt: 'You are a playful and fun companion. Keep the tone casual, friendly, and sometimes humorous. Share jokes, fun facts, and keep the conversation light-hearted.'
    },
    { 
      id: 'mindful', 
      name: 'Mindful Guide', 
      prompt: 'You are a mindful guide. Maintain a calm, spiritual, and meditative tone. Offer breathing exercises, guided meditations, and gentle reminders for mindfulness and relaxation.'
    }
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800">
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

      {/* Companion Style Selector */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">Companion Style</h3>
        <div className="grid grid-cols-2 gap-2">
          {conversationStyles.map((style) => (
            <motion.button
              key={style.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleStyleChange(style.id)}
              className={`relative p-3 rounded-xl border transition-all duration-200 text-center ${
                selectedStyle === style.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/70'
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1.5">{style.icon}</span>
                <div className="font-medium text-xs text-gray-900 dark:text-white">
                  {style.name.split(' ')[0]}
                </div>
              </div>
              {selectedStyle === style.id && (
                <div className="absolute top-1 right-1 p-1 text-blue-500">
                  <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <FiCheck className="w-2.5 h-2.5" />
                  </div>
                </div>
              )}
            </motion.button>
          ))}
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
      
      {/* User Profile */}
      <div className="mt-auto p-4 border-t border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium shadow-inner">
            U
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">User</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Free Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
