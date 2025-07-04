import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiSend } from 'react-icons/fi';
import { useTheme } from '../../contexts/useTheme';

const ChatInput = ({ onSendMessage, isSending = false }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  const { theme } = useTheme();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isSending) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    // Handle Shift+Enter for new line, Enter to send
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message AI Companion..."
              className="w-full pl-5 pr-14 py-3.5 text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden min-h-[56px] max-h-48 shadow-sm transition-all duration-200"
              rows={1}
              disabled={isSending}
              style={{
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            />
            <div className="absolute right-3 bottom-3 flex items-center space-x-2">
              {!message.trim() && (
                <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline-flex items-center">
                  <kbd className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 mr-1">
                    Shift
                  </kbd>
                  <kbd className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                    ⏎
                  </kbd>
                  <span className="ml-1">to send</span>
                </span>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!message.trim() || isSending}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  message.trim()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                    : 'text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label="Send message"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FiSend className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </div>
          
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              AI Companion may produce inaccurate information. Consider verifying important details.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;
