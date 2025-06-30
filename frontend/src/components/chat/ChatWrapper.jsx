import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../hooks/useAuth';
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
import { format } from 'date-fns';

const ChatWrapper = () => {
  const { resetChat } = useChat();
  const { currentUser } = useAuth();
  
  // UI State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
  const [activeChatDropdown, setActiveChatDropdown] = useState(null);
  
  // Chat State
  const [messages, setMessages] = useState([
    {
      id: uuid(),
      type: 'bot',
      content: "Welcome! It's wonderful to see you. I'm Seriva, a friendly presence here to listen without judgment, offer support, and explore any thoughts or feelings you'd like to share. How can I help you feel more supported today?",
      timestamp: new Date(),
      status: 'delivered'
    }
  ]);
  
  // Settings
  const [selectedModel, setSelectedModel] = useState('default');
  const [voiceEnabled, setVoiceEnabled] = useState(false); // Voice disabled by default
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [conversationStyle, setConversationStyle] = useState('supportive');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  
  // Chat History
  const [chatHistory, setChatHistory] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentChatTitle, setCurrentChatTitle] = useState(null);
  
  // Refs
  const messagesEndRef = useRef(null);
  const chatScrollContainerRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const initialLoadDoneRef = useRef(false);
  
  // Model options
  const modelOptions = [
    { 
      id: 'default', 
      name: 'Seriva (Default)', 
      description: 'Balanced wellness companion',
      icon: <Sparkles className="w-4 h-4" />
    },
    { 
      id: 'supportive', 
      name: 'Supportive Seriva', 
      description: 'Extra empathetic responses',
      icon: <Heart className="w-4 h-4" />
    },
    { 
      id: 'analytical', 
      name: 'Analytical Seriva', 
      description: 'Logical and analytical approach',
      icon: <Brain className="w-4 h-4" />
    }
  ];
  
  // Speech synthesis setup
  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    
    // Get available voices
    const loadVoices = () => {
      const voices = synthRef.current.getVoices();
      setAvailableVoices(voices);
      if (voices.length > 0 && !selectedVoice) {
        setSelectedVoice(voices[0]);
      }
    };
    
    loadVoices();
    synthRef.current.onvoiceschanged = loadVoices;
    
    // Clean up speech synthesis on unmount
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [selectedVoice]);
  
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
  
  // Load chat history from localStorage
  useEffect(() => {
    const savedChats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    const processedChats = savedChats.map(chat => ({
      ...chat,
      date: new Date(chat.date),
      lastActivity: new Date(chat.lastActivity || chat.timestamp)
    }));
    setChatHistory(processedChats);
  }, []);
  
  // Save chat history to localStorage when it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);
  
  // Speak the given text using the Web Speech API
  const speakMessage = useCallback((text) => {
    if (!voiceEnabled || !synthRef.current || !selectedVoice) return;
    
    // Stop any ongoing speech
    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
    setIsSpeaking(true);
  }, [voiceEnabled, isSpeaking, selectedVoice]);
  
  // Voice functionality disabled
  useEffect(() => {
    // Skip the first render to prevent speaking the welcome message
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      return;
    }
    
    // Don't speak if voice is disabled
    if (!voiceEnabled) return;
    
    // Don't speak if there are no messages
    if (messages.length === 0) return;
    
    // Get the last message
    const lastMessage = messages[messages.length - 1];
    
    // Only speak bot messages that aren't the welcome message
    if (lastMessage.type === 'bot' && lastMessage.id !== 1) {
      speakMessage(lastMessage.content);
    }
  }, [messages, voiceEnabled, speakMessage]);
  
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
    const newMessage = {
      id: uuid(),
      type: 'system',
      content: `File uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      timestamp: new Date(),
      file: {
        name: file.name,
        type: file.type,
        size: file.size
      }
    };
    
    setMessages(prev => [...prev, newMessage]);
  }, []);
  
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
  
  // Handle message deletion
  const handleDeleteMessage = useCallback((messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);
  
  // Regenerate the last bot response
  const handleRegenerate = useCallback(async (messageId) => {
    // Find the user message that this bot response is replying to
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1 || messageIndex === 0) return;
    
    const userMessage = messages[messageIndex - 1];
    if (userMessage.type !== 'user') return;
    
    // Remove the bot's response and regenerate
    setMessages(prev => prev.filter((_, i) => i !== messageIndex));
    await handleSend(userMessage.content);
  }, [messages]);
  
  // Handle message sending
  const handleSend = useCallback(async (messageText) => {
    if (!messageText.trim()) return;
    
    const userMessage = {
      id: uuid(),
      type: 'user',
      content: messageText,
      timestamp: new Date(),
      status: 'sending'
    };
    
    // No temporary message, we'll use the loading state in MessageList
    setIsLoading(true);
    
    // Add user message to the chat
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);
    
    try {
      // Call the backend API to get Ollama's response
      const response = await chatApi.sendMessage(
        messageText, 
        currentConversationId, 
        conversationStyle
      );
      
      // Update the user message status to sent
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'sent' } 
            : msg
        )
      );
      
      // Add the bot's response from Ollama
      const botResponse = {
        id: uuid(),
        type: 'bot',
        content: response.response || "I'm sorry, I couldn't process your request at the moment.",
        timestamp: new Date(),
        status: 'delivered'
      };
      
      // Add the bot's response
      setMessages(prev => [...prev, botResponse]);
      
      // Update conversation ID if this is a new conversation
      if (response.conversationId) {
        setCurrentConversationId(response.conversationId);
      }
      
      // Save the conversation to history
      const newChat = {
        id: response.conversationId || uuid(),
        title: messageText.substring(0, 30) + (messageText.length > 30 ? '...' : ''),
        timestamp: new Date(),
        lastActivity: new Date(),
        messages: [userMessage, botResponse]
      };
      
      if (!currentConversationId) {
        // New conversation
        setChatHistory(prev => [newChat, ...prev]);
      } else {
        // Update existing conversation
        setChatHistory(prev => 
          prev.map(chat => 
            chat.id === currentConversationId
              ? {
                  ...chat,
                  lastActivity: new Date(),
                  messages: [...chat.messages, userMessage, botResponse]
                }
              : chat
          )
        );
      }
      
      // Save to local storage
      saveChatToHistory([...messages, userMessage, botResponse]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update the temporary message with an error
      const errorMessage = {
        id: uuid(),
        type: 'system',
        content: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date(),
        status: 'error',
        error: error.message
      };
      
      setMessages(prev => 
        prev
          .filter(msg => msg.id !== tempBotMessage.id)
          .concat(errorMessage)
      );
    } finally {
      setIsSending(false);
      setIsLoading(false);
    }
  }, [currentConversationId, selectedModel, messages]);
  
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
    const newVoiceState = !voiceEnabled;
    setVoiceEnabled(newVoiceState);
    
    // If turning voice off, stop any ongoing speech
    if (!newVoiceState && isSpeaking) {
      stopSpeaking();
    }
  }, [voiceEnabled, isSpeaking, stopSpeaking]);
  
  // Start a new chat
  const startNewChat = useCallback(() => {
    setMessages([{
      id: uuid(),
      type: 'bot',
      content: "Welcome! It's wonderful to see you. I'm Seriva, a friendly presence here to listen without judgment, offer support, and explore any thoughts or feelings you'd like to share. How can I help you feel more supported today?",
      timestamp: new Date(),
      status: 'delivered'
    }]);
    setCurrentConversationId(null);
    setCurrentChatTitle(null);
    setMobileSidebarOpen(false);
    initialLoadDoneRef.current = false;
  }, []);
  
  // Load a chat from history
  const loadChat = useCallback((chatId) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (!chat) return;
    
    setMessages(chat.messages);
    setCurrentConversationId(chat.id);
    setCurrentChatTitle(chat.title);
    setMobileSidebarOpen(false);
  }, [chatHistory]);
  
  // Save chat to history
  const saveChatToHistory = useCallback((updatedMessages) => {
    if (!currentConversationId) {
      const firstUserMessage = updatedMessages.find(msg => msg.type === 'user');
      if (!firstUserMessage) return;
      
      const newConversationId = uuid();
      const newChat = {
        id: newConversationId,
        title: firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : ''),
        lastMessage: updatedMessages[updatedMessages.length - 1].content,
        timestamp: new Date(),
        lastActivity: new Date(),
        messages: updatedMessages
      };
      
      setCurrentConversationId(newConversationId);
      setCurrentChatTitle(newChat.title);
      setChatHistory(prev => [newChat, ...prev]);
    } else {
      // Update existing conversation
      setChatHistory(prev => 
        prev.map(chat => 
          chat.id === currentConversationId
            ? {
                ...chat,
                lastMessage: updatedMessages[updatedMessages.length - 1].content,
                timestamp: new Date(),
                lastActivity: new Date(),
                messages: updatedMessages
              }
            : chat
        )
      );
    }
  }, [currentConversationId]);
  
  // Delete a chat from history
  const deleteChatFromHistory = useCallback((chatId, e) => {
    if (e) e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      const updatedHistory = chatHistory.filter(chat => chat.id !== chatId);
      setChatHistory(updatedHistory);
      
      // If the deleted chat was the current one, reset to new chat
      if (currentConversationId === chatId) {
        startNewChat();
      }
    }
  }, [chatHistory, currentConversationId, startNewChat]);

  // Export chat as text file
  const exportChat = useCallback(() => {
    if (!currentConversationId) return;
    
    const chatToExport = {
      id: currentConversationId,
      title: currentChatTitle || 'Chat Export',
      messages: messages,
      date: new Date()
    };
    
    const formattedDate = new Date().toISOString().split('T')[0];
    const filename = `${chatToExport.title.replace(/[^a-zA-Z0-9]/g, '_')}_${formattedDate}.txt`;
    
    const content = chatToExport.messages
      .filter(m => m.type !== 'system')
      .map(m => `[${m.type.toUpperCase()}] ${new Date(m.timestamp).toLocaleString()}\n${m.content}\n`)
      .join('\n---\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  }, [currentConversationId, currentChatTitle, messages]);

  // Save chat as text file (alternative version for sidebar)
  const saveChatAsTxt = useCallback((chatId = currentConversationId, chatTitle = currentChatTitle) => {
    const chat = chatId 
      ? chatHistory.find(c => c.id === chatId) 
      : { messages, title: chatTitle || 'Untitled Chat' };
    
    if (!chat) return;
    
    const formattedMessages = chat.messages
      .map(msg => {
        const sender = msg.type === 'user' ? 'You' : 'Seriva';
        return `${sender} (${new Date(msg.timestamp).toLocaleString()}):\n${msg.content}\n`;
      })
      .join('\n');
    
    const blob = new Blob([formattedMessages], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.title.replace(/[^\w\s]/gi, '')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentConversationId, currentChatTitle, chatHistory, messages]);

  // Reset chat to initial state
  const resetChatHandler = useCallback(() => {
    setMessages([{
      id: uuid(),
      type: 'bot',
      content: "Welcome! It's wonderful to see you. I'm Seriva, a friendly presence here to listen without judgment, offer support, and explore any thoughts or feelings you'd like to share. How can I help you feel more supported today?",
      timestamp: new Date(),
      status: 'delivered'
    }]);
    setCurrentConversationId(null);
    setCurrentChatTitle(null);
    initialLoadDoneRef.current = false;
  }, []);

  // Group chat history by date
  const groupedChatHistory = chatHistory.reduce((groups, chat) => {
    const date = chat.lastActivity.toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(chat);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-full bg-[#222831] overflow-hidden">
      {/* Messages Area */}
      <div 
        ref={chatScrollContainerRef}
        className="flex-1 overflow-y-auto w-full flex justify-center"
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
          <div ref={messagesEndRef} className="h-16"></div>
        </div>
      </div>

      {/* Input Area */}
      <div className="w-full border-t border-gray-700/50 bg-[#1E1F2B]">
        <div className="w-full max-w-3xl mx-auto px-4 py-2">
          <ChatInput 
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            selectedModel={selectedModel}
            modelOptions={modelOptions}
            inputRef={inputRef}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatWrapper;