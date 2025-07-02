import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  Loader2, 
  MoreVertical, 
  ThumbsUp, 
  ThumbsDown, 
  Pencil, 
  Trash2,
  Volume2,
  VolumeX,
  Sparkles,
  Brain,
  Heart
} from 'lucide-react';
import TypingIndicator from './TypingIndicator';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

// Get user initials for avatar
const getUserInitials = (name) => {
  if (!name || name.trim() === '') return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Message = ({ 
  message, 
  isLast,
  onSpeak,
  onCopy,
  isSpeaking = false,
  onDelete
}) => {
  // No need for manual cursor animation as we're using CSS animation now
  const { currentUser } = useAuth();
  const isUser = message.type === 'user';
  const [showOptions, setShowOptions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const optionsRef = useRef(null);
  const textareaRef = useRef(null);
  const messageRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle copy to clipboard
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    if (onCopy) onCopy(message.id);
  }, [message.content, message.id, onCopy]);

  // Format time
  const formatTime = (timestamp) => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return format(date, 'h:mm a');
    } catch (e) {
      return '';
    }
  };

  // Handle like/dislike
  const handleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    if (isDisliked) setIsDisliked(false);
  };

  const handleDislike = (e) => {
    e.stopPropagation();
    setIsDisliked(!isDisliked);
    if (isLiked) setIsLiked(false);
  };

  // Handle edit
  const handleEdit = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setShowOptions(false);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.value.length;
      }
    }, 0);
  };

  const handleSaveEdit = (e) => {
    e.stopPropagation();
    if (editedContent.trim() && editedContent !== message.content) {
      // In a real app, you would update the message in the backend here
      console.log('Message updated:', editedContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditedContent(message.content);
    setIsEditing(false);
  };

  // Handle delete
  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(message.id);
    }
    setShowOptions(false);
  };

  // Get model icon based on model ID
  const getModelIcon = (modelId) => {
    switch (modelId) {
      case 'creative':
        return <Brain className="w-3 h-3 text-blue-400" />;
      case 'empathetic':
        return <Heart className="w-3 h-3 text-pink-400" />;
      case 'default':
      default:
        return <Sparkles className="w-3 h-3 text-yellow-400" />;
    }
  };

  return (
    <div className="relative w-full pt-4 mb-4 group">
      {/* Floating action buttons */}
      <AnimatePresence>
        {(isHovered || showOptions) && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute top-0 left-0 right-0 flex items-center z-10 ${
              isUser ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className="flex items-center space-x-1 bg-gray-800/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg border border-gray-700">
              {/* Copy Button */}
              <button 
                onClick={handleCopy}
                className="p-1.5 rounded-full text-gray-300 hover:bg-gray-700/80 hover:text-white transition-colors"
                title="Copy message"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              
              {/* Voice Button (for bot messages) */}
              {!isUser && (
                <button 
                  onClick={() => onSpeak && onSpeak(message.content)}
                  className={`p-1.5 rounded-full ${
                    isSpeaking 
                      ? 'text-indigo-400 bg-indigo-500/20' 
                      : 'text-gray-300 hover:bg-gray-700/80 hover:text-white'
                  } transition-colors`}
                  title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                >
                  {isSpeaking ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
              
              {/* Like/Dislike Buttons */}
              {!isUser && (
                <>
                  <button 
                    onClick={handleLike}
                    className={`p-1.5 rounded-full ${
                      isLiked 
                        ? 'text-green-400 bg-green-500/20' 
                        : 'text-gray-300 hover:bg-gray-700/80 hover:text-green-400'
                    } transition-colors`}
                    title="Like response"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={handleDislike}
                    className={`p-1.5 rounded-full ${
                      isDisliked 
                        ? 'text-red-400 bg-red-500/20' 
                        : 'text-gray-300 hover:bg-gray-700/80 hover:text-red-400'
                    } transition-colors`}
                    title="Dislike response"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              
              {/* More Options Dropdown */}
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptions(!showOptions);
                  }}
                  className="p-1.5 rounded-full text-gray-300 hover:bg-gray-700/80 hover:text-white transition-colors"
                  title="More options"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
                
                {/* Dropdown Menu */}
                {showOptions && (
                  <div 
                    className={`absolute z-20 mt-1 w-40 bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden ${
                      isUser ? 'right-0' : 'left-0'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!isUser && (
                      <button 
                        onClick={handleEdit}
                        className="flex items-center w-full px-3 py-2 text-sm text-left text-gray-200 hover:bg-gray-700 transition-colors"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        <span>Edit</span>
                      </button>
                    )}
                    <button 
                      onClick={handleDelete}
                      className="flex items-center w-full px-3 py-2 text-sm text-left text-red-400 hover:bg-gray-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message content */}
      <motion.div
        ref={messageRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: { duration: 0.2, ease: 'easeOut' }
        }}
        exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
        className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} w-full max-w-3xl ${
          isUser ? 'ml-auto' : 'mr-auto'
        } px-4`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Avatar */}
        {isUser ? (
          <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ml-3 bg-indigo-600">
            {currentUser?.displayName ? (
              <span className="text-sm font-medium text-white">
                {getUserInitials(currentUser.displayName)}
              </span>
            ) : (
              <User className="w-4 h-4 text-white" strokeWidth={2.5} />
            )}
          </div>
        ) : (
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center mr-3">
            <img 
              src="/logo.svg" 
              alt="Seriva" 
              className="w-12 h-12"
            />
          </div>
        )}

        {/* Message Content */}
        <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`} style={{ maxWidth: 'calc(100% - 3rem)' }}>
          {/* Sender Info */}
          <div className={`flex items-center mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs font-medium text-gray-400">
              {isUser ? (currentUser?.displayName || 'You') : 'Seriva'}
            </span>
            {!isUser && message.model && (
              <span className="ml-2 flex items-center text-xs text-gray-500">
                {getModelIcon(message.model)}
                <span className="ml-1">{message.model}</span>
              </span>
            )}
          </div>
          
          {/* Message Bubble */}
          <div 
            className={`relative rounded-2xl px-4 py-3 inline-block ${
              message.isError
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50'
                : isUser 
                  ? 'bg-indigo-600 text-white rounded-br-sm dark:bg-indigo-600' 
                  : message.isStreaming
                    ? 'bg-gray-50 dark:bg-gray-800/70 text-gray-800 dark:text-gray-200 border-2 border-dashed border-blue-200 dark:border-blue-900/50'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
            } shadow-md hover:shadow-lg transition-all duration-200 max-w-full ${
              message.isStreaming ? 'animate-pulse' : ''
            }`}
            style={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {isEditing ? (
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveEdit(e);
                    } else if (e.key === 'Escape') {
                      handleCancelEdit(e);
                    }
                  }}
                  className="w-full bg-gray-700 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={Math.min(10, editedContent.split('\n').length + 1)}
                  autoFocus
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 text-sm text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className={`prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap break-words ${
              message.isError ? 'text-red-600 dark:text-red-400' : ''
            }`}>
              {message.content}
              {message.isStreaming && isLast && (
                <div className="mt-2">
                  <TypingIndicator />
                </div>
              )}
            </div>
            )}
            
            {/* Timestamp */}
            <div className={`mt-1 text-xs ${
              isUser ? 'text-indigo-200 dark:text-indigo-200' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {formatTime(message.timestamp)}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const MessageList = ({ 
  messages = [], 
  isLoading = false, 
  onSpeak,
  onCopy,
  onDelete,
  speakingMessageId,
  isTyping = false
}) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Auto-scroll to bottom when new messages arrive if already at bottom
  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  // Handle scroll events to determine if user has scrolled up
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const threshold = 100; // pixels from bottom
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;
    
    setIsAtBottom(isNearBottom);
  }, []);

  // Add scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Scroll to bottom button handler
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setIsAtBottom(true);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden relative"
    >
      <div className="max-w-4xl mx-auto w-full pt-16 pb-4">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <Message 
              key={message.id} 
              message={message} 
              isLast={index === messages.length - 1}
              onSpeak={onSpeak}
              onCopy={onCopy}
              onDelete={onDelete}
              isSpeaking={speakingMessageId === message.id}
            />
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div 
              key="typing-indicator" 
              className={`flex w-full max-w-3xl mr-auto px-4`}
            >
              {/* Avatar - matches bot message avatar */}
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center mr-3">
                <img 
                  src="/logo.svg" 
                  alt="Seriva" 
                  className="w-12 h-12"
                />
              </div>

              {/* Message Content - matches bot message styling */}
              <div className="flex-1 min-w-0" style={{ maxWidth: 'calc(100% - 3rem)' }}>
                {/* Sender Info - matches bot message styling */}
                <div className="flex items-center mb-1 justify-start">
                  <span className="text-xs font-medium text-gray-400">
                    Seriva
                  </span>
                </div>
                
                {/* Typing indicator bubble - matches message bubble styling */}
                <div className="mt-1">
                  <div className="inline-flex items-center px-4 py-2.5 bg-indigo-50 dark:bg-gray-800 rounded-2xl shadow-sm">
                    <TypingIndicator />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} className="h-4" />
        </AnimatePresence>
      </div>
      
      {/* Scroll to bottom button */}
      {!isAtBottom && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={scrollToBottom}
          className="fixed right-8 bottom-24 p-2 bg-gray-800 rounded-full shadow-lg border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors z-10"
          aria-label="Scroll to bottom"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </motion.button>
      )}
    </div>
  );
};

export default MessageList;
