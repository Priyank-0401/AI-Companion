import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Copy, Check, Loader2, MoreVertical, ThumbsUp, ThumbsDown, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

// Get user initials for avatar
const getUserInitials = (name) => {
  if (!name || name.trim() === '') return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Message = ({ message, isLast }) => {
  const { currentUser } = useAuth();
  const isUser = message.type === 'user';
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`group relative flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-4`}
    >
      <div className={`flex max-w-3xl w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
          isUser 
            ? 'ml-3 bg-background-tertiary border border-border/50' 
            : 'mr-3 bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600'
        }`}>
          {isUser ? (
            currentUser?.displayName ? (
              <span className="text-sm font-medium text-text-primary">
                {getUserInitials(currentUser.displayName)}
              </span>
            ) : (
              <User className="w-4 h-4 text-text-secondary" strokeWidth={2.5} />
            )
          ) : (
            <Bot className="w-4 h-4 text-white" strokeWidth={2.5} />
          )}
        </div>

        {/* Message Bubble */}
        <div className={`relative rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-indigo-600 text-white rounded-br-none' 
            : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'
        } shadow-lg`}>
          <div className="prose prose-invert max-w-none text-sm leading-relaxed">
            {message.content}
          </div>
          
          {/* Message Actions */}
          <div className={`absolute -top-3 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
            isUser ? 'flex-row-reverse left-2' : ''
          }`}>
            <button 
              onClick={handleCopy}
              className="p-1 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              title="Copy message"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            {!isUser && (
              <>
                <button className="p-1 rounded-full bg-gray-800 text-gray-300 hover:bg-green-600 hover:text-white transition-colors" title="Like">
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 rounded-full bg-gray-800 text-gray-300 hover:bg-red-600 hover:text-white transition-colors" title="Dislike">
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <div className="relative" ref={optionsRef}>
              <button 
                onClick={() => setShowOptions(!showOptions)}
                className="p-1 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                title="More options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
              
              {showOptions && (
                <div className={`absolute z-10 mt-1 w-40 bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden ${
                  isUser ? 'right-0' : 'left-0'
                }`}>
                  <button className="flex items-center w-full px-3 py-2 text-sm text-left text-gray-200 hover:bg-gray-700 transition-colors">
                    <Pencil className="w-4 h-4 mr-2" />
                    <span>Edit</span>
                  </button>
                  <button className="flex items-center w-full px-3 py-2 text-sm text-left text-red-400 hover:bg-gray-700 transition-colors">
                    <Trash2 className="w-4 h-4 mr-2" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Timestamp */}
          <div className={`mt-1 text-xs ${isUser ? 'text-indigo-200' : 'text-gray-400'} text-right`}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const TypingIndicator = () => (
  <div className="flex items-center space-x-2 py-2 px-4">
    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

const MessageList = ({ messages = [], isLoading = false }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="max-w-4xl mx-auto w-full py-4">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <Message 
              key={message.id} 
              message={message} 
              isLast={index === messages.length - 1} 
            />
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start mb-4 px-4"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600 mr-3">
                <Bot className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <div className="bg-gray-800 text-gray-100 rounded-2xl rounded-bl-none px-4 py-3 border border-gray-700 shadow-lg">
                <TypingIndicator />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;