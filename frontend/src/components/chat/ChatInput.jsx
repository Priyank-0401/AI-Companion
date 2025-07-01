import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, X, Mic, Paperclip, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect, useContext } from 'react';
import ThemeContext from '../../contexts/ThemeContext';
// Mock emoji picker for demonstration
const MockEmojiPicker = ({ onEmojiSelect, onClose }) => {
  const emojis = ['😀', '😂', '😍', '🤔', '👍', '❤️', '🎉', '🔥'];
  
  return (
    <div className="absolute bottom-full right-0 mb-2 z-20 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-300">Emojis</span>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Close emoji picker"
        >
          <X size={16} />
        </button>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {emojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onEmojiSelect({ native: emoji })}
            className="text-xl hover:bg-gray-700/50 p-1.5 rounded-lg transition-colors"
            aria-label={`Select ${emoji} emoji`}
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
  inputRef,
  onFileUpload = () => {},
  onVoiceToggle = () => {},
  isRecording = false,
  onStopSpeaking = () => {},
  isSpeaking = false,
}) => {
  const { theme } = useContext(ThemeContext);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [inputRows, setInputRows] = useState(1);
  const maxRows = 6;
  
  const typingTimeout = useRef(null);
  const emojiButtonRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);
  
  const handleEmojiSelect = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = input;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    setInput(before + emoji.native + after);
    setIsEmojiPickerOpen(false);
    
    // Move cursor after the inserted emoji
    setTimeout(() => {
      if (textarea) {
        const newPosition = start + emoji.native.length;
        textarea.selectionStart = newPosition;
        textarea.selectionEnd = newPosition;
        textarea.focus();
      }
    }, 0);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const rows = Math.min(
        Math.max(1, Math.ceil((textareaRef.current.scrollHeight - 20) / 24)),
        maxRows
      );
      setInputRows(rows);
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
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
        // Handle Shift+Enter for new line
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = input;
        
        // Insert newline at cursor position
        const newValue = value.substring(0, start) + '\n' + value.substring(end);
        setInput(newValue);
        
        // Update cursor position
        setTimeout(() => {
          if (textarea) {
            textarea.selectionStart = textarea.selectionEnd = start + 1;
            handleInputChange({ target: { value: newValue } });
          }
        }, 0);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiButtonRef.current && !emojiButtonRef.current.contains(event.target)) {
        setIsEmojiPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, []);

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-4">
        {/* Input Area */}
        <div 
          ref={containerRef}
          className={`relative border rounded-2xl shadow-xl transition-all duration-200 min-h-[60px] flex items-center ${
            theme === 'dark' 
              ? 'bg-gray-800/95 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}
        >
          <form onSubmit={handleFormSubmit} className="w-full">
            <div className="relative flex items-center">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
                disabled={isLoading}
              />
              
              <div className="flex-1 min-w-0">
                <textarea
                  ref={(el) => {
                    if (inputRef) inputRef.current = el;
                    textareaRef.current = el;
                  }}
                  rows="1"
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsEmojiPickerOpen(false)}
                  placeholder="Message Seriva..."
                  className={`w-full py-4 pl-5 pr-14 bg-transparent focus:outline-none focus:ring-0 resize-none overflow-hidden max-h-[200px] min-h-[24px] ${
                    theme === 'dark' 
                      ? 'text-gray-100 placeholder-gray-500' 
                      : 'text-gray-900 placeholder-gray-400'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    border: 'none',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(107, 114, 128, 0.5) transparent'
                  }}
                  disabled={isLoading}
                  aria-label="Type your message"
                />
            </div>
            {/* Action Buttons - Right Side */}
            <div className="absolute right-3 bottom-3 flex items-center space-x-1.5">
            <button
                type="button"
                onClick={isRecording ? onStopSpeaking : onVoiceToggle}
                className={`p-1.5 rounded-full transition-colors ${
                  isRecording 
                    ? 'text-red-400 bg-red-500/20' 
                    : 'text-gray-400 hover:text-indigo-400 hover:bg-gray-700/50'
                }`}
                disabled={isLoading}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              >
                {isRecording ? (
                  <div className="w-5 h-5 rounded-full bg-red-500 animate-pulse"></div>
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
              {/* Emoji Picker Button */}
              <button
                type="button"
                ref={emojiButtonRef}
                onClick={() => {
                  setIsEmojiPickerOpen(!isEmojiPickerOpen);
                }}
                className={`p-1.5 rounded-full transition-colors ${
                  isEmojiPickerOpen 
                    ? 'text-indigo-400 bg-indigo-500/20' 
                    : 'text-gray-400 hover:text-indigo-400 hover:bg-gray-700/50'
                }`}
                disabled={isLoading}
                aria-label="Open emoji picker"
              >
                <Smile className="w-5 h-5" />
              </button>
              
              <div className="h-5 w-px bg-gray-700"></div>
              
              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`p-1.5 rounded-full transition-colors ${
                  input.trim() && !isLoading
                    ? 'text-indigo-400 hover:bg-indigo-500/20'
                    : 'text-gray-500 cursor-not-allowed'
                }`}
                aria-label={input.trim() ? 'Send message' : 'Type a message to send'}
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
          <div className="px-4 py-1.5 text-xs text-gray-500 border-t border-gray-700/50 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span>Press Enter to send, Shift+Enter for new line</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`${input.length > 4000 ? 'text-red-400' : ''}`}>
                {input.length}/4000
              </span>
            </div>
          </div>
          </form>
          
          {/* Emoji Picker */}
          <AnimatePresence>
            {isEmojiPickerOpen && (
              <div className="absolute bottom-full right-0 mb-2 z-20">
                <MockEmojiPicker
                  onEmojiSelect={handleEmojiSelect}
                  onClose={() => setIsEmojiPickerOpen(false)}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
