import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, X, Sparkles, Brain, Heart, Zap, Loader2, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import React from 'react';

const MODEL_OPTIONS = [
  { 
    id: 'default', 
    name: 'Seriva', 
    description: 'Balanced AI Assistant',
    icon: <Sparkles className="w-4 h-4" />
  },
  { 
    id: 'creative', 
    name: 'Creative', 
    description: 'More imaginative responses',
    icon: <Brain className="w-4 h-4" />
  },
  { 
    id: 'empathetic', 
    name: 'Empathetic', 
    description: 'More understanding and caring',
    icon: <Heart className="w-4 h-4" />
  },
  { 
    id: 'concise', 
    name: 'Concise', 
    description: 'Shorter, more direct responses',
    icon: <Zap className="w-4 h-4" />
  },
];

// Mock emoji picker for demonstration
const MockEmojiPicker = ({ onEmojiSelect, onClose }) => {
  const emojis = ['😀', '😂', '😍', '🤔', '👍', '❤️', '🎉', '🔥'];
  
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-300">Emojis</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
          <X size={14} />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {emojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onEmojiSelect({ native: emoji })}
            className="text-lg hover:bg-gray-700 p-1 rounded"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

const ChatInput = ({
  input = '',
  setInput = () => {},
  handleSubmit = () => {},
  isLoading = false,
  selectedModel = 'default',
  modelOptions = MODEL_OPTIONS,
  inputRef,
  setSelectedModel = () => {}
}) => {
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputRows, setInputRows] = useState(1);
  const maxRows = 6;
  
  const typingTimeout = useRef(null);
  const emojiButtonRef = useRef(null);
  const modelButtonRef = useRef(null);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);
  
  const currentModel = modelOptions.find(m => m.id === selectedModel) || modelOptions[0];
  
  const handleEmojiSelect = (emoji) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = input;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    setInput(before + emoji.native + after);
    setIsEmojiPickerOpen(false);
    
    // Move cursor after the inserted emoji
    setTimeout(() => {
      const newPosition = start + emoji.native.length;
      textarea.selectionStart = newPosition;
      textarea.selectionEnd = newPosition;
      textarea.focus();
    }, 0);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    
    // Show typing indicator when user is typing
    if (!isTyping) {
      setIsTyping(true);
    }
    
    // Clear previous timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    // Set a new timeout to hide typing indicator after user stops typing
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
    }, 1500);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      // Reset textarea height after submission
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        setInputRows(1);
      }
      handleSubmit(e);
    }
  };

  const handleKeyDown = (e) => {
    const textarea = e.target;
    
    if (e.key === 'Enter') {
      if (!e.shiftKey) {
        // Submit on Enter (without Shift)
        e.preventDefault();
        if (input.trim() && !isLoading) {
          handleFormSubmit(e);
        }
      } else {
        // Handle Shift+Enter for new line and textarea expansion
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = input;
        
        // Insert newline at cursor position
        const newValue = value.substring(0, start) + '\n' + value.substring(end);
        setInput(newValue);
        
        // Update cursor position
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
          
          // Adjust textarea height if needed
          textarea.style.height = 'auto';
          const rows = Math.min(
            Math.max(1, Math.ceil((textarea.scrollHeight - 20) / 24)),
            maxRows
          );
          setInputRows(rows);
          textarea.style.height = `${textarea.scrollHeight}px`;
        }, 0);
      }
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close emoji picker when clicking outside
      if (emojiButtonRef.current && !emojiButtonRef.current.contains(event.target)) {
        setIsEmojiPickerOpen(false);
      }
      // Close model selector when clicking outside the model selector or its button
      if (modelButtonRef.current && !modelButtonRef.current.contains(event.target) &&
          containerRef.current && !containerRef.current.contains(event.target)) {
        setIsModelSelectorOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Toggle model selector
  const toggleModelSelector = (e) => {
    e.stopPropagation();
    setIsModelSelectorOpen(prev => !prev);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.2,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      y: 20,
      transition: { 
        duration: 0.15,
        ease: "easeIn"
      }
    }
  };

  return (
    <motion.div 
      className="w-full px-4 pb-3 max-w-4xl"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Model Selector */}
      <motion.div 
        className="flex justify-center mb-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="relative">
          <motion.button
            ref={modelButtonRef}
            type="button"
            onClick={toggleModelSelector}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors"
            disabled={isLoading}
            whileHover={{ backgroundColor: 'rgba(55, 65, 81, 0.8)' }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span className="flex items-center">
              {React.cloneElement(currentModel.icon, { className: 'w-3.5 h-3.5 mr-1.5' })}
              {currentModel.name}
            </motion.span>
            <motion.span
              animate={{ rotate: isModelSelectorOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </motion.span>
          </motion.button>
          
          <AnimatePresence>
            {isModelSelectorOpen && (
              <motion.div 
                className="absolute bottom-full left-0 mb-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-20"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              >
                <div className="p-2">
                  <h3 className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Chat Model
                  </h3>
                  <div className="space-y-1">
                    {modelOptions.map((model, index) => (
                      <motion.button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(model.id);
                          setIsModelSelectorOpen(false);
                        }}
                        className={`w-full flex items-center px-3 py-2 text-sm rounded-lg text-left ${
                          selectedModel === model.id
                            ? 'bg-indigo-500/10 text-indigo-400'
                            : 'text-gray-300 hover:bg-gray-700/50'
                        } transition-colors`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ backgroundColor: 'rgba(79, 70, 229, 0.1)' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="flex items-center">
                          {React.cloneElement(model.icon, {
                            className: 'w-4 h-4 mr-2.5 flex-shrink-0',
                          })}
                          <span>
                            <span className="block font-medium">{model.name}</span>
                            <span className="text-xs text-gray-400">{model.description}</span>
                          </span>
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Input Area */}
      <motion.div 
        ref={containerRef}
        className={`relative bg-gray-800/50 border border-gray-700 rounded-2xl shadow-lg transition-all duration-200`}
        whileHover={{ boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.2)' }}
        animate={{
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        <form onSubmit={handleFormSubmit} className="relative">
          <div className="relative">
            <textarea
              ref={(el) => {
                if (inputRef) inputRef.current = el;
                textareaRef.current = el;
              }}
              rows={inputRows}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                // Small delay to allow click events to fire on buttons
                setTimeout(() => setIsEmojiPickerOpen(false), 200);
              }}
              placeholder="Message Seriva..."
              className={`w-full py-4 pl-5 pr-14 bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-0 resize-none overflow-hidden transition-all duration-200 ${
                inputRows >= maxRows ? 'overflow-y-auto' : ''
              }`}
              style={{
                WebkitAppearance: 'none',
                outline: 'none',
                boxShadow: 'none',
                border: 'none',
                minHeight: '24px',
                maxHeight: `${maxRows * 24}px`
              }}
              disabled={isLoading}
            />
            
            {/* Action Buttons */}
            <div className="absolute right-3 bottom-3 flex items-center space-x-1.5">
              <button
                type="button"
                ref={emojiButtonRef}
                onClick={() => {
                  setIsEmojiPickerOpen(!isEmojiPickerOpen);
                  setIsModelSelectorOpen(false);
                }}
                className={`p-1.5 rounded-full transition-colors ${
                  isEmojiPickerOpen 
                    ? 'text-indigo-400 bg-indigo-500/20' 
                    : 'text-gray-400 hover:text-indigo-400 hover:bg-gray-700/50'
                }`}
                disabled={isLoading}
              >
                <Smile className="w-5 h-5" />
              </button>
              
              <div className="h-5 w-px bg-gray-700"></div>
              
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`p-1.5 rounded-full transition-colors ${
                  input.trim() && !isLoading
                    ? 'text-indigo-400 hover:bg-indigo-500/20'
                    : 'text-gray-500 cursor-not-allowed'
                }`}
                title={input.trim() ? 'Send message' : 'Type a message to send'}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          
          {/* Character counter */}
          <div className="px-4 py-1.5 text-xs text-gray-500 border-t border-gray-700/50">
            <div className="flex justify-between items-center">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span className={`${input.length > 4000 ? 'text-red-400' : ''}`}>
                {input.length}/4000
              </span>
            </div>
          </div>
        </form>
        
        {/* Emoji Picker */}
        <AnimatePresence>
          {isEmojiPickerOpen && (
            <motion.div 
              className="absolute bottom-full right-0 mb-2 z-10"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              <MockEmojiPicker
                onEmojiSelect={handleEmojiSelect}
                onClose={() => setIsEmojiPickerOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default ChatInput;