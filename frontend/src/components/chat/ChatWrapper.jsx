import { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { motion } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../auth/context/AuthContext';
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
    isTyping,
    showModelDropdown,
    
    // Session actions
    addMessage,
    sendMessage,
    updateSessionTitle,
    createNewSession,
    getInitialBotMessage,
    
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
  
  // Stop any ongoing speech
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    // Cancel any ongoing speech
    stopSpeaking();
    
    // Create a new session (this will also abort any ongoing requests)
    createNewSession();
    
    // Reset input
    setInput('');
  }, [createNewSession, stopSpeaking]);
  

  
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
  
  // Handle send message
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || isSending) return false;
    
    // Clear input immediately for better UX
    const messageContent = input.trim();
    setInput('');
    
    try {
      // Send message to API - the ChatContext will handle adding the user message
      await sendMessage(messageContent);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      addMessage({
        type: 'system',
        content: 'Sorry, there was an error processing your message. Please try again.',
        status: 'error',
        error: error.message
      });
      // Restore the input if there was an error
      setInput(messageContent);
      return false;
    }
  }, [input, isLoading, isSending, sendMessage, addMessage]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e, submittedContent = null) => {
    e?.preventDefault();
    const contentToSend = submittedContent !== null ? submittedContent : input;
    
    if (isLoading || isSending || !contentToSend?.trim()) return;
    
    // Handle the send - the input is managed within handleSend now
    await handleSend();
  }, [input, isLoading, isSending, handleSend]);
  

  
  // Toggle voice on/off
  const toggleVoice = useCallback(() => {
    const newVoiceState = !isSpeaking;
    
    // If turning voice off, stop any ongoing speech
    if (!newVoiceState && isSpeaking) {
      stopSpeaking();
    }
  }, [isSpeaking, stopSpeaking]);

  // Render loading state
  if (isLoadingSessions) {
    return (
      <div className={`flex flex-col items-center justify-center h-[calc(100vh-64px)] md:h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading conversations...</p>
      </div>
    );
  }

  // Render empty state if no messages and not loading
  if (messages.length === 0 && !isLoading && !isSending) {
    return (
      <div className={`flex flex-col items-center justify-center h-[calc(100vh-64px)] md:h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-4`}>
        <div className="text-center max-w-md">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
            <MessageSquare className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No messages yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Start a new conversation by sending a message below.
          </p>
          <button
            onClick={handleSendMessage}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Send className="h-4 w-4 mr-2" />
            Start a new conversation
          </button>
        </div>
      </div>
    );
  }

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
            isTyping={isTyping}
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
