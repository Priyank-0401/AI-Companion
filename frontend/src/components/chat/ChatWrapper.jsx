import { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { motion } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../hooks/useAuth';
import ThemeContext from '../../contexts/ThemeContext';
import { chatApi } from '../../services/api';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { 
  Send, User, Loader2, RotateCcw, Download, Settings, MessageSquare,
  Brain, Heart, Smile, Coffee, Moon, Sun, Volume2, VolumeX, Copy,
  Check, Trash2, Bot, MoreVertical, FileText, Bookmark, Star, Play,
  Pause, Plus, ChevronRight, Menu, X, Save, Sparkles, ChevronDown, Mic, Paperclip
} from 'lucide-react';
import { v4 as uuid } from 'uuid';

const ChatWrapper = ({ mobileSidebarOpen, setMobileSidebarOpen }) => {
  const { theme } = useContext(ThemeContext);
  const { 
    // State
    currentSession,
    messages,
    selectedModel,
    isLoading,
    isSending,
    showModelDropdown,
    
    // Session actions
    addMessage,
    sendMessage,
    updateSessionTitle,
    
    // UI state
    setSelectedModel,
    setShowModelDropdown,
    toggleOptions
  } = useChat();
  
  const { currentUser } = useAuth();
  
  // UI State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [input, setInput] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  
  // Refs
  const messagesEndRef = useRef(null);
  const chatScrollContainerRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  
  // Model options
  const modelOptions = [
    { 
      id: 'default', 
      name: 'Seriva (Default)', 
      description: 'Balanced wellness companion',
      icon: <Sparkles className="w-4 h-4" />
    },
    { 
      id: 'creative', 
      name: 'Creative Seriva', 
      description: 'More imaginative responses',
      icon: <Brain className="w-4 h-4" />
    },
    { 
      id: 'empathetic', 
      name: 'Empathetic Seriva', 
      description: 'More understanding and caring',
      icon: <Heart className="w-4 h-4" />
    }
  ];
  
  // Speech synthesis setup
  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    
    // Clean up speech synthesis on unmount
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);
  
  // Speech recognition setup
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    
    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
      setIsRecording(false);
    };
    
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Speak the given text using the Web Speech API
  const speakMessage = useCallback((text) => {
    if (!synthRef.current) return;
    
    // Stop any ongoing speech
    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
    setIsSpeaking(true);
  }, [isSpeaking]);
  
  // Toggle voice recording
  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setInput('');
    }
    
    setIsRecording(!isRecording);
  }, [isRecording]);
  
  // Handle file upload
  const handleFileUpload = useCallback((file) => {
    if (!file) return;
    
    // For now, just show a preview of the file
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target.result;
      // In a real app, you would process the file content here
      console.log('File content:', fileContent);
    };
    
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
    
    // Add a message about the uploaded file
    addMessage({
      type: 'system',
      content: `File uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      file: {
        name: file.name,
        type: file.type,
        size: file.size
      }
    });
  }, [addMessage]);
  
  // Handle message copy
  const copyMessage = useCallback(async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(content);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        console.log('Message copied to clipboard (fallback)');
      } catch (e) {
        console.error('Fallback copy failed:', e);
      }
      document.body.removeChild(textArea);
    }
  }, []);
  
  // Handle message sending
  const handleSend = useCallback(async (content) => {
    if (!content.trim()) return;
    
    try {
      // Send the message through the context
      await sendMessage(content);
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      addMessage({
        type: 'system',
        content: 'Sorry, there was an error processing your message. Please try again.',
        status: 'error',
        error: error.message
      });
    }
  }, [sendMessage, addMessage]);
  
  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (isLoading || isSending || !input.trim()) return;
    
    handleSend(input);
  }, [input, isLoading, isSending, handleSend]);
  
  // Stop any ongoing speech
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);
  
  // Toggle voice on/off
  const toggleVoice = useCallback(() => {
    const newVoiceState = !isSpeaking;
    
    // If turning voice off, stop any ongoing speech
    if (!newVoiceState && isSpeaking) {
      stopSpeaking();
    }
  }, [isSpeaking, stopSpeaking]);

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Messages Area - Takes up available space */}
      <div 
        ref={chatScrollContainerRef}
        className="flex-1 overflow-y-auto w-full flex justify-center pb-4"
      >
        <div className="w-full max-w-4xl px-4">
          <MessageList 
            messages={messages}
            isSpeaking={isSpeaking}
            copiedMessageId={copiedMessageId}
            speakMessage={speakMessage}
            copyMessage={copyMessage}
            isLoading={isLoading}
          />
          <div ref={messagesEndRef} className="h-24"></div>
        </div>
      </div>

      {/* Input Area - Fixed at bottom with gradient */}
      <div className={`w-full border-t ${
        theme === 'dark' 
          ? 'border-gray-900 bg-gray-900' 
          : 'border-white bg-white'
      }`}>
        <div className="w-full max-w-4xl mx-auto px-4 py-4">
          <ChatInput 
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading || isSending}
            selectedModel={selectedModel}
            modelOptions={modelOptions}
            inputRef={inputRef}
            onModelSelect={setSelectedModel}
            onFileUpload={handleFileUpload}
            onVoiceToggle={toggleRecording}
            isRecording={isRecording}
            onStopSpeaking={stopSpeaking}
            isSpeaking={isSpeaking}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatWrapper;
