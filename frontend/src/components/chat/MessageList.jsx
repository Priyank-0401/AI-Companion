import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  MoreVertical, 
  ThumbsUp, 
  ThumbsDown, 
  Pencil, 
  Trash2,
  Volume2,
  VolumeX,
  Sparkles,
  Brain,
  Heart,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { format } from 'date-fns';

// Memoized message component to prevent unnecessary re-renders
const Message = memo(({ 
  message, 
  isUser, 
  isLast, 
  onSpeak, 
  onCopy, 
  onDelete,
  isSpeaking = false,
  currentUserId
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const optionsRef = useRef(null);
  const messageRef = useRef(null);
  const { currentUser } = useAuth();

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
    setShowOptions(false);
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
  const handleLike = useCallback((e) => {
    e.stopPropagation();
    setIsLiked(prev => !prev);
    if (isDisliked) setIsDisliked(false);
  }, [isDisliked]);

  const handleDislike = useCallback((e) => {
    e.stopPropagation();
    setIsDisliked(prev => !prev);
    if (isLiked) setIsLiked(false);
  }, [isLiked]);

  // Handle edit
  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    setIsEditing(true);
    setShowOptions(false);
  }, []);

  const handleSaveEdit = useCallback((e) => {
    e.stopPropagation();
    if (editedContent.trim() && editedContent !== message.content) {
      // In a real app, you would update the message in the backend here
      console.log('Message updated:', editedContent);
    }
    setIsEditing(false);
  }, [editedContent, message.content]);

  const handleCancelEdit = useCallback((e) => {
    e.stopPropagation();
    setEditedContent(message.content);
    setIsEditing(false);
  }, [message.content]);

  // Handle delete
  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(message.id);
    }
    setShowOptions(false);
  }, [message.id, onDelete]);

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <CheckCircle className="w-3 h-3 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'read':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <CheckCircle className="w-3 h-3 text-gray-400" />;
    }
  };

  // Get model icon based on model ID
  const getModelIcon = useCallback((modelId) => {
    switch (modelId) {
      case 'creative':
        return <Brain className="w-3 h-3 text-blue-400" />;
      case 'empathetic':
        return <Heart className="w-3 h-3 text-pink-400" />;
      case 'default':
      default:
        return <Sparkles className="w-3 h-3 text-yellow-400" />;
    }
  }, []);

  // Handle click on message
  const handleMessageClick = useCallback(() => {
    if (isEditing) return;
    setShowOptions(prev => !prev);
  }, [isEditing]);

  // Get user initials for avatar
  const getUserInitials = useCallback((name) => {
    if (!name || name.trim() === '') return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, []);

  return (
    <div 
      ref={messageRef}
      className={`relative w-full py-1 group ${isLast ? 'mb-4' : 'mb-1'}`}
      onClick={handleMessageClick}
    >
      {/* Message content */}
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} w-full max-w-3xl ${
        isUser ? 'ml-auto' : 'mr-auto'
      } px-4`}>
        {/* Avatar */}
        {isUser ? (
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ml-3 bg-indigo-600">
            {currentUser?.displayName ? (
              <span className="text-xs font-medium text-white">
                {getUserInitials(currentUser.displayName)}
              </span>
            ) : (
              <User className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            )}
          </div>
        ) : (
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center mr-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
          </div>
        )}

        {/* Message Content */}
        <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`} style={{ maxWidth: 'calc(100% - 2.5rem)' }}>
          {/* Sender Info */}
          <div className={`flex items-center mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs font-medium text-gray-400">
              {isUser ? (currentUser?.displayName || 'You') : 'AI Assistant'}
            </span>
            {!isUser && message.model && (
              <span className="ml-2 flex items-center text-xs text-gray-500">
                {getModelIcon(message.model)}
              </span>
            )}
          </div>
          
          {/* Message bubble */}
          <div 
            className={`relative rounded-2xl px-4 py-3 inline-block ${
              message.isError
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50'
                : isUser 
                  ? 'bg-indigo-600 text-white rounded-br-sm' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
            } shadow-md hover:shadow-lg transition-all duration-200 max-w-full`}
            style={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {isEditing ? (
              <div className="relative">
                <textarea
                  ref={el => el && el.focus()}
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
                  className="w-full bg-white/10 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={Math.min(10, editedContent.split('\n').length + 1)}
                  autoFocus
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 text-sm text-gray-200 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 text-sm bg-white/20 hover:bg-white/30 text-white rounded-md"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {message.content.split('\n').map((paragraph, i) => (
                  <p key={i} className={i > 0 ? 'mt-2' : ''}>
                    {paragraph || <br />}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Message metadata */}
          <div className={`flex items-center mt-1 space-x-2 text-xs ${
            isUser ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <span>{formatTime(message.timestamp || message.createdAt)}</span>
            
            {isUser && message.status && (
              <span className="flex items-center">
                {getStatusIcon(message.status)}
              </span>
            )}
            
            {!isUser && message.model && (
              <span className="flex items-center">
                {getModelIcon(message.model)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons - shown on hover or when active */}
      <AnimatePresence>
        {showOptions && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute top-0 flex items-center space-x-1 z-10 ${
              isUser ? 'right-16' : 'left-16'
            }`}
            ref={optionsRef}
          >
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1 shadow-lg border border-gray-200 dark:border-gray-700">
              {/* Copy Button */}
              <button 
                onClick={handleCopy}
                className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                title="Copy message"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              
              {/* Voice Button */}
              <button 
                onClick={() => onSpeak && onSpeak(message.content)}
                className={`p-1.5 rounded-full ${
                  isSpeaking 
                    ? 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
                } transition-colors`}
                title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
              >
                {isSpeaking ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
              
              {/* Like/Dislike Buttons - only for bot messages */}
              {!isUser && (
                <>
                  <button 
                    onClick={handleLike}
                    className={`p-1.5 rounded-full ${
                      isLiked 
                        ? 'text-green-500 bg-green-100 dark:bg-green-900/30' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
                    } transition-colors`}
                    title="Like response"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={handleDislike}
                    className={`p-1.5 rounded-full ${
                      isDisliked 
                        ? 'text-red-500 bg-red-100 dark:bg-red-900/30' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
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
                  className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  title="More options"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
                
                {/* Dropdown Menu */}
                {showOptions && (
                  <div 
                    className={`absolute z-20 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${
                      isUser ? 'right-0' : 'left-0'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!isUser && (
                      <button 
                        onClick={handleEdit}
                        className="flex items-center w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        <span>Edit</span>
                      </button>
                    )}
                    <button 
                      onClick={handleDelete}
                      className="flex items-center w-full px-3 py-2 text-sm text-left text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
    </div>
  );
});

// Add display name for better dev tools
Message.displayName = 'Message';

const MessageList = memo(({ 
  messages = [], 
  currentUserId,
  onSpeak,
  onCopy,
  onDelete,
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

  // Group messages by date for better organization
  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    messages.forEach((message) => {
      const messageDate = format(new Date(message.timestamp || message.createdAt), 'yyyy-MM-dd');
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({
            date: currentDate,
            messages: [...currentGroup]
          });
          currentGroup = [];
        }
        currentDate = messageDate;
      }
      
      currentGroup.push(message);
    });

    // Add the last group
    if (currentGroup.length > 0) {
      groups.push({
        date: currentDate,
        messages: currentGroup
      });
    }

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);
  const { currentUser } = useAuth();

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden relative"
    >
      <div className="max-w-3xl mx-auto w-full pt-16 pb-4">
        {messageGroups.length > 0 ? (
          messageGroups.map((group, groupIndex) => (
            <div key={group.date} className="mb-6">
              {/* Date header */}
              <div className="flex items-center justify-center my-4">
                <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full">
                  {format(new Date(group.date), 'MMMM d, yyyy')}
                </div>
              </div>
              
              {/* Messages in group */}
              <div className="space-y-1">
                {group.messages.map((message, index) => (
                  <Message
                    key={message.id || index}
                    message={message}
                    isUser={message.senderId === (currentUser?.uid || '')}
                    isLast={index === group.messages.length - 1}
                    onSpeak={onSpeak}
                    onCopy={onCopy}
                    onDelete={onDelete}
                    currentUserId={currentUser?.uid}
                  />
                ))}
              </div>
            </div>
          ))
        ) : !isTyping ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <MessageSquare className="w-8 h-8" />
            </div>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        ) : null}
        
        {isTyping && (
          <div className="flex items-center space-x-2 px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} className="h-4" />
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
});

// Add display name for better dev tools
MessageList.displayName = 'MessageList';

export default MessageList;
