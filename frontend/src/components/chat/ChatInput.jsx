import { useState, useRef, useEffect } from 'react';
import { FiSend, FiSmile, FiMic } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/useTheme';
import EmojiPicker from 'emoji-picker-react';
import PropTypes from 'prop-types';

const ChatInput = ({ onSendMessage, isSending = false, onAttachFile, onRecordAudio }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const { theme: themeContext } = useTheme();
  const isDark = themeContext === 'dark';
  
  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }

    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    
    if (trimmedMessage.length > 0 && !isSending) {
      onSendMessage(trimmedMessage);
      setMessage('');
      setShowEmojiPicker(false);
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };
  
  const addEmoji = (emojiData) => {
    const cursorPosition = textareaRef.current.selectionStart;
    const textBefore = message.substring(0, cursorPosition);
    const textAfter = message.substring(cursorPosition);
    
    setMessage(textBefore + emojiData.emoji + textAfter);
    // Move cursor after the emoji
    setTimeout(() => {
      const newPosition = cursorPosition + emojiData.emoji.length;
      textareaRef.current.selectionStart = newPosition;
      textareaRef.current.selectionEnd = newPosition;
      textareaRef.current.focus();
    }, 0);
    
    // Close the picker after selection
    setShowEmojiPicker(false);
  };
  
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(prev => !prev);
    // Focus back on input after toggling emoji picker
    setTimeout(() => textareaRef.current?.focus(), 0);
  };
  
  const toggleRecording = () => {
    if (onRecordAudio) {
      const newRecordingState = !isRecording;
      setIsRecording(newRecordingState);
      onRecordAudio(newRecordingState);
      
      // If stopping recording, focus back on the input
      if (isRecording) {
        setTimeout(() => textareaRef.current?.focus(), 0);
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
    
    // Show typing indicator
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false);
    }
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsActive(false);
        setIsTyping(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFocus = () => {
    setIsActive(true);
    if (message.length > 0) {
      setIsTyping(true);
    }
  };

  const handleBlur = () => {
    if (message.length === 0) {
      setIsTyping(false);
    }
  };

  return (
    <div ref={containerRef} className="px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto">
        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="absolute bottom-20 left-0 right-0 z-10 flex justify-center px-4"
            >
              <div className="w-full max-w-3xl mx-auto">
                <div ref={emojiPickerRef} className="absolute bottom-16 right-0 z-50 shadow-2xl rounded-xl overflow-hidden">
                  <EmojiPicker
                    onEmojiClick={addEmoji}
                    theme={isDark ? 'dark' : 'light'}
                    height={350}
                    width={300}
                    searchDisabled={false}
                    previewConfig={{
                      showPreview: false
                    }}
                    skinTonesDisabled
                    lazyLoadEmojis
                    searchPlaceholder="Search emojis..."
                    style={{
                      '--epr-emoji-size': '24px',
                      '--epr-category-label-height': '28px',
                      '--epr-search-input-padding': '10px 14px',
                      '--epr-horizontal-padding': '12px',
                    }}
                    groupNames={{
                      smileys_people: 'Smileys',
                      animals_nature: 'Nature',
                      food_drink: 'Food',
                      travel_places: 'Travel',
                      activities: 'Activities',
                      objects: 'Objects',
                      symbols: 'Symbols',
                      flags: 'Flags',
                      recently_used: 'Recent',
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            {/* Input Area */}
            <div className={`flex items-center bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border ${
              isTyping || isActive
                ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900/30' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            } shadow-sm transition-all duration-200 overflow-hidden`}>
              {/* Textarea */}
              <div className="flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Message AI Companion..."
                  className="w-full px-4 py-3 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none overflow-hidden text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  rows={1}
                  style={{
                    minHeight: '44px',
                    maxHeight: '120px',
                    transition: 'max-height 0.2s ease-out'
                  }}
                  disabled={isSending}
                />
              </div>
              
              {/* Right Side Controls */}
              <div className="flex items-center pr-2 space-x-1">
                <button
                  type="button"
                  onClick={toggleEmojiPicker}
                  className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 rounded-full transition-colors"
                  aria-label="Toggle emoji picker"
                >
                  <FiSmile className="w-5 h-5" />
                </button>
                
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-2 rounded-full transition-colors ${
                    isRecording 
                      ? 'text-red-500 animate-pulse' 
                      : 'text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400'
                  }`}
                  aria-label={isRecording ? 'Stop recording' : 'Record voice message'}
                >
                  <FiMic className="w-5 h-5" />
                </button>
                

                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!message.trim() || isSending}
                  className={`p-2 mx-1 rounded-full transition-all duration-200 ${
                    message.trim()
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md hover:shadow-lg'
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
            
            {/* Helper Text */}
            {!message.trim() && !isActive && (
              <div className="mt-2 text-center">
                <span className="text-xs text-gray-400 dark:text-gray-500 inline-flex items-center justify-center">
                  <kbd className="px-1.5 py-0.5 mx-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                    Shift
                  </kbd>
                  <span className="mx-0.5">+</span>
                  <kbd className="px-1.5 py-0.5 mx-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                    ⏎
                  </kbd>
                  <span className="ml-1">to send</span>
                </span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;
