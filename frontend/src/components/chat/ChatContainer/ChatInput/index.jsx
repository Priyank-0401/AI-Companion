import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiSend, FiPaperclip, FiMic, FiSmile } from 'react-icons/fi';

const ChatInput = ({ 
  onSend, 
  isSending = false, 
  className = '' 
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isSending) {
      onSend(message);
      setMessage('');
      adjustTextareaHeight();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <form 
      onSubmit={handleSubmit}
      className={`border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 ${className}`}
    >
      <div className="flex items-end space-x-2">
        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-end">
          <button 
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Add attachment"
          >
            <FiPaperclip className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows="1"
              className="w-full bg-transparent border-0 focus:ring-0 resize-none py-3 px-2 max-h-32 overflow-y-auto"
              disabled={isSending}
            />
            <button 
              type="button"
              className="absolute right-2 bottom-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Add emoji"
            >
              <FiSmile className="w-5 h-5" />
            </button>
          </div>
          
          <button 
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Voice message"
          >
            <FiMic className="w-5 h-5" />
          </button>
        </div>
        
        <button
          type="submit"
          disabled={!message.trim() || isSending}
          className={`p-3 rounded-full ${
            message.trim() && !isSending 
              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          } transition-colors duration-200`}
          aria-label="Send message"
        >
          <FiSend className={`w-5 h-5 ${isSending ? 'animate-pulse' : ''}`} />
        </button>
      </div>
    </form>
  );
};

ChatInput.propTypes = {
  onSend: PropTypes.func.isRequired,
  isSending: PropTypes.bool,
  className: PropTypes.string,
};

export default ChatInput;
