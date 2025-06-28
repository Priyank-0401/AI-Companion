import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

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
  
  // UI State
  const [activeChatDropdown, setActiveChatDropdown] = useState(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState(() => {
    try {
      const storedConversationId = localStorage.getItem('chatConversationId');
      return storedConversationId ? JSON.parse(storedConversationId) : null;
    } catch (error) {
      console.error("Error loading conversationId from localStorage:", error);
      return null;
    }
  });

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

  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const savedChats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
      const processedChats = savedChats.map(chat => ({
        ...chat,
        date: new Date(chat.date),
        lastActivity: new Date(chat.lastActivity || chat.timestamp),
        messages: chat.messages ? chat.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })) : []
      }));
      setChatHistory(processedChats);

      // If we have a current conversation ID, load its messages
      const currentId = localStorage.getItem('currentConversationId');
      if (currentId) {
        const currentChat = processedChats.find(chat => chat.id === currentId);
        if (currentChat && currentChat.messages) {
          setMessages(currentChat.messages);
          setConversationId(currentId);
          setCurrentChatTitle(currentChat.title || 'New Chat');
          return;
        }
      }
    } catch (error) {
      console.error('Error loading chat history from localStorage:', error);
    }
  }, []);
  
  // Save current chat to history when messages change
  useEffect(() => {
    if (messages.length === 0) return;

    const saveChat = () => {
      try {
        const chatId = conversationId || Date.now().toString();
        const chatTitle = currentChatTitle || `Chat ${new Date().toLocaleString()}`;
        
        const chat = {
          id: chatId,
          title: chatTitle,
          messages: messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString()
          })),
          lastActivity: new Date().toISOString(),
          date: new Date().toISOString()
        };

        setChatHistory(prevHistory => {
          const existingChatIndex = prevHistory.findIndex(c => c.id === chatId);
          let updatedHistory;
          
          if (existingChatIndex >= 0) {
            updatedHistory = [...prevHistory];
            updatedHistory[existingChatIndex] = chat;
          } else {
            updatedHistory = [chat, ...prevHistory];
          }

          // Save to localStorage
          localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
          localStorage.setItem('currentConversationId', JSON.stringify(chatId));
          
          return updatedHistory;
        });

        if (!conversationId) {
          setConversationId(chatId);
        }
        if (!currentChatTitle) {
          setCurrentChatTitle(chatTitle);
        }
      } catch (error) {
        console.error('Error saving chat to history:', error);
      }
    };

    // Debounce the save to prevent too many writes
    const timer = setTimeout(saveChat, 500);
    return () => clearTimeout(timer);
  }, [messages, conversationId, currentChatTitle]);

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
    // Save current chat before resetting
    if (messages.length > 1) { // Don't save if it's just the welcome message
      const chatId = conversationId || Date.now().toString();
      const chatTitle = currentChatTitle || `Chat ${new Date().toLocaleString()}`;
      
      const chat = {
        id: chatId,
        title: chatTitle,
        messages: messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        })),
        lastActivity: new Date().toISOString(),
        date: new Date().toISOString()
      };

      setChatHistory(prevHistory => {
        const existingChatIndex = prevHistory.findIndex(c => c.id === chatId);
        let updatedHistory;
        
        if (existingChatIndex >= 0) {
          updatedHistory = [...prevHistory];
          updatedHistory[existingChatIndex] = chat;
        } else {
          updatedHistory = [chat, ...prevHistory];
        }

        localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
        return updatedHistory;
      });
    }

    // Reset to initial state
    setMessages([getInitialBotMessage()]);
    setConversationId(null);
    setCurrentChatTitle(null);
    localStorage.removeItem('currentConversationId');
  };

  // Function to load chat history from localStorage
  const loadChatHistory = useCallback(() => {
    try {
      const savedChats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
      const processedChats = savedChats.map(chat => ({
        ...chat,
        date: new Date(chat.date),
        lastActivity: new Date(chat.lastActivity || chat.timestamp),
        messages: chat.messages ? chat.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })) : []
      }));
      setChatHistory(processedChats);
      return processedChats;
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  }, [setChatHistory]);

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
    loadChatHistory,
    currentChatTitle,
    setCurrentChatTitle,
    
    // Model
    selectedModel,
    setSelectedModel,
    conversationStyle,
    setConversationStyle,
    // UI State
    activeChatDropdown,
    setActiveChatDropdown,
    showModelDropdown,
    setShowModelDropdown,
    showOptions,
    setShowOptions,
    isLoading,
    setIsLoading,
    isSending,
    setIsSending
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
