import React, { createContext, useState, useContext, useEffect } from 'react';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

// Helper function to create the initial bot message with a fresh Date object
const getInitialBotMessage = () => ({
  id: 1,
  type: 'bot',
  content: "Welcome! It's wonderful to see you. I'm Seriva, a friendly presence here to listen without judgment, offer support, and explore any thoughts or feelings you'd like to share. How can I help you feel more supported today?",
  timestamp: new Date() // Use a new Date object directly
});

export const ChatProvider = ({ children }) => {
  // Chat state
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatTitle, setCurrentChatTitle] = useState(null);
  const [selectedModel, setSelectedModel] = useState('default');
  const [conversationStyle, setConversationStyle] = useState('supportive');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeChatDropdown, setActiveChatDropdown] = useState(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [messages, setMessages] = useState(() => {
    try {
      const storedMessages = localStorage.getItem('chatMessages');
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        // If localStorage has messages, parse them and their timestamps
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          return parsedMessages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp) 
          }));
        }
      }
    } catch (error) {
      console.error("Error loading messages from localStorage:", error);
    }
    // If localStorage is empty, has an empty array, or an error occurred, return the initial bot message
    return [getInitialBotMessage()];
  });

  const [conversationId, setConversationId] = useState(() => {
    try {
      const storedConversationId = localStorage.getItem('chatConversationId');
      return storedConversationId ? JSON.parse(storedConversationId) : null;
    } catch (error) {
      console.error("Error loading conversationId from localStorage:", error);
      return null;
    }
  });

  // We can also move conversationStyle here if it needs to be persisted globally
  // const [conversationStyle, setConversationStyle] = useState('supportive'); 

  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const savedChats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
      const processedChats = savedChats.map(chat => ({
        ...chat,
        date: new Date(chat.date),
        lastActivity: new Date(chat.lastActivity || chat.timestamp)
      }));
      setChatHistory(processedChats);
    } catch (error) {
      console.error('Error loading chat history from localStorage:', error);
    }
  }, []);
  
  // Save chat history to localStorage when it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      try {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
      } catch (error) {
        console.error('Error saving chat history to localStorage:', error);
      }
    }
  }, [chatHistory]);

  // Effect to save messages to localStorage
  useEffect(() => {
    try {
      // Store timestamps as ISO strings for proper serialization
      localStorage.setItem('chatMessages', JSON.stringify(messages.map(msg => ({
        ...msg,
        // Ensure timestamp is converted to ISO string before saving
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : new Date(msg.timestamp).toISOString()
      }))));

    } catch (error) {
      console.error("Error saving messages to localStorage:", error);
    }
  }, [messages]);

  // Effect to save conversationId to localStorage
  useEffect(() => {
    try {
      if (conversationId === null) {
        localStorage.removeItem('chatConversationId');
      } else {
        localStorage.setItem('chatConversationId', JSON.stringify(conversationId));
      }
    } catch (error) {
      console.error("Error saving conversationId to localStorage:", error);
    }
  }, [conversationId]);

  const addMessage = (message) => {
    // Ensure timestamp is a Date object before adding
    const messageWithDate = {
        ...message,
        timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)
    };
    setMessages(prevMessages => [...prevMessages, messageWithDate]);
  };

  const resetChat = () => {
    // Use the helper function to ensure a fresh Date object for the timestamp
    setMessages([getInitialBotMessage()]);
    setConversationId(null);
  };

  const value = {
    // Messages
    messages,
    setMessages,
    addMessage,
    
    // Conversation
    conversationId,
    setConversationId,
    resetChat,
    
    // Chat History
    chatHistory,
    setChatHistory,
    currentChatTitle,
    setCurrentChatTitle,
    
    // Model and Voice
    selectedModel,
    setSelectedModel,
    conversationStyle,
    setConversationStyle,
    voiceEnabled,
    setVoiceEnabled,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
    isSpeaking,
    setIsSpeaking,
    
    // UI State
    activeChatDropdown,
    setActiveChatDropdown,
    showModelDropdown,
    setShowModelDropdown,
    showOptions,
    setShowOptions,
    showVoiceDropdown,
    setShowVoiceDropdown,
    isLoading,
    setIsLoading,
    isSending,
    setIsSending
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
