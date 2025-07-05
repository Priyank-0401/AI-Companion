import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiLoader } from 'react-icons/fi';
import { useTheme } from '../../../contexts/useTheme';
import MessageList from './MessageList';

/**
 * A flexible container component for chat interfaces
 */
const ChatContainer = ({
  messages = [],
  currentMessage = '',
  onMessageChange = () => {},
  onSendMessage = () => {},
  isLoading = false,
  isTyping = false,
  className = '',
  placeholder = 'Type a message...',
}) => {
  const messagesEndRef = useRef(null);
  const { theme } = useTheme();
  const [isAtBottom, setIsAtBottom] = useState(true);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentMessage.trim()) {
      onSendMessage(currentMessage);
      // Keep focus on input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 transition-colors duration-200 ${className}`}>
      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages} 
          isTyping={isTyping} 
          className="h-full"
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={currentMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full min-h-[40px] max-h-32 py-2 px-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 resize-none"
              rows={1}
              disabled={isLoading}
            />
            {isLoading && (
              <div className="absolute right-2 bottom-2">
                <FiLoader className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!currentMessage.trim() || isLoading}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

ChatContainer.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      content: PropTypes.string.isRequired,
      sender: PropTypes.oneOf(['user', 'assistant']).isRequired,
      timestamp: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.instanceOf(Date)
      ]).isRequired,
      status: PropTypes.oneOf(['sending', 'sent', 'delivered', 'read', 'failed']),
    })
  ),
  currentMessage: PropTypes.string,
  onMessageChange: PropTypes.func,
  onSendMessage: PropTypes.func,
  isLoading: PropTypes.bool,
  isTyping: PropTypes.bool,
  className: PropTypes.string,
  placeholder: PropTypes.string,
};

ChatContainer.defaultProps = {
  messages: [],
  currentMessage: '',
  onMessageChange: () => {},
  onSendMessage: () => {},
  isLoading: false,
  isTyping: false,
  className: '',
  placeholder: 'Type a message...',
};

export default ChatContainer;
