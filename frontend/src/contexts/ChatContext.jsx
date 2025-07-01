import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

// Helper function to create the initial bot message with a fresh Date object
const getInitialBotMessage = () => ({
  id: uuidv4(),
  type: 'bot',
  content: "Welcome! It's wonderful to see you. I'm Seriva, a friendly presence here to listen without judgment, offer support, and explore any thoughts or feelings you'd like to share. How can I help you feel more supported today?",
  timestamp: new Date()
});

// Default model options
const DEFAULT_MODEL_OPTIONS = [
  { 
    id: 'default', 
    name: 'Seriva', 
    description: 'Balanced AI Assistant',
    icon: 'sparkles'
  },
  { 
    id: 'creative', 
    name: 'Creative', 
    description: 'More imaginative responses',
    icon: 'brain'
  },
  { 
    id: 'empathetic', 
    name: 'Empathetic', 
    description: 'More understanding and caring',
    icon: 'heart'
  },
  { 
    id: 'concise', 
    name: 'Concise', 
    description: 'Shorter, more direct responses',
    icon: 'zap'
  }
];

export const ChatProvider = ({ children }) => {
  // Initialize state from localStorage
  const [sessions, setSessions] = useState(() => {
    try {
      const savedSessions = localStorage.getItem('chatSessions');
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        // Ensure all sessions have required fields
        return parsed.map(session => ({
          id: session.id || uuidv4(),
          title: session.title || 'New Chat',
          messages: Array.isArray(session.messages) ? session.messages : [],
          model: session.model || 'default',
          conversationStyle: session.conversationStyle || 'supportive',
          createdAt: session.createdAt || new Date().toISOString(),
          updatedAt: session.updatedAt || new Date().toISOString(),
          lastActivity: session.lastActivity || new Date().toISOString()
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      return [];
    }
  });
  
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    try {
      return localStorage.getItem('currentSessionId') || null;
    } catch (error) {
      console.error('Error loading current session ID:', error);
      return null;
    }
  });
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedModel, setSelectedModel] = useState('default');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  // Get current session
  const currentSession = sessions.find(session => session.id === currentSessionId) || 
    (sessions.length > 0 ? sessions[0] : null);
  
  // Current messages
  const [messages, setMessages] = useState(() => {
    if (currentSession) {
      return currentSession.messages || [getInitialBotMessage()];
    }
    return [getInitialBotMessage()];
  });

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    try {
      // Only save sessions that have at least one message or have an explicit title
      const sessionsToSave = sessions.filter(session => 
        (session.messages && session.messages.length > 0) || 
        (session.title && session.title !== 'New Chat')
      );
      
      localStorage.setItem('chatSessions', JSON.stringify(sessionsToSave));
      
      // Update current session ID if needed
      if (currentSessionId) {
        localStorage.setItem('currentSessionId', currentSessionId);
      } else if (sessionsToSave.length > 0) {
        // If no current session but we have saved sessions, use the most recent one
        const mostRecent = [...sessionsToSave].sort((a, b) => 
          new Date(b.updatedAt) - new Date(a.updatedAt)
        )[0];
        setCurrentSessionId(mostRecent.id);
      }
    } catch (error) {
      console.error('Error saving chat sessions:', error);
    }
  }, [sessions, currentSessionId]);

  // UI State
  const [showOptions, setShowOptions] = useState(false);
  const [activeChatDropdown, setActiveChatDropdown] = useState(null);
  const [conversationStyle, setConversationStyle] = useState('supportive');

  // Create a new chat session
  const createNewSession = useCallback((initialMessages = []) => {
    const newSession = {
      id: uuidv4(),
      title: 'New Chat',
      model: selectedModel,
      conversationStyle: conversationStyle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messages: initialMessages.length ? initialMessages : [getInitialBotMessage()]
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages);
    
    return newSession;
  }, [selectedModel, conversationStyle]);

  // Update current session
  const updateCurrentSession = useCallback((updates) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, ...updates, updatedAt: new Date() } 
          : session
      )
    );
  }, [currentSessionId]);

  // Delete a session
  const deleteSession = useCallback((sessionId) => {
    setSessions(prev => {
      const newSessions = prev.filter(session => session.id !== sessionId);
      
      // If we're deleting the current session, switch to another one
      if (sessionId === currentSessionId) {
        if (newSessions.length > 0) {
          const newCurrentSessionId = newSessions[0].id;
          setCurrentSessionId(newCurrentSessionId);
          setMessages(newSessions[0].messages || []);
        } else {
          // If no sessions left, create a new one
          const newSession = {
            id: uuidv4(),
            title: 'New Chat',
            model: selectedModel,
            createdAt: new Date(),
            updatedAt: new Date(),
            messages: [getInitialBotMessage()]
          };
          setCurrentSessionId(newSession.id);
          setMessages(newSession.messages);
          return [newSession];
        }
      }
      
      return newSessions;
    });
  }, [currentSessionId, selectedModel]);

  // Switch to a different session
  const switchSession = useCallback((sessionId) => {
    const targetSession = sessions.find(s => s.id === sessionId);
    if (targetSession) {
      setCurrentSessionId(sessionId);
      setMessages(targetSession.messages || []);
      setSelectedModel(targetSession.model || 'default');
    }
  }, [sessions]);

  // Update session title
  const updateSessionTitle = useCallback((sessionId, newTitle) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, title: newTitle, updatedAt: new Date() } 
          : session
      )
    );
  }, []);

  // Add a message to the current session
  const addMessage = useCallback((message) => {
    if (!currentSessionId) {
      // If no current session, create a new one with this message
      const newSession = createNewSession([message]);
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([message]);
      return newSession.id;
    }

    const newMessage = {
      ...message,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Update the session with the new message
    setSessions(prev => {
      const updated = prev.map(session => 
        session.id === currentSessionId 
          ? { 
              ...session, 
              messages: [...(session.messages || []), newMessage],
              updatedAt: new Date().toISOString(),
              lastActivity: new Date().toISOString()
            } 
          : session
      );
      return updated;
    });

    // Update the title if it's the first user message
    const currentSession = sessions.find(s => s.id === currentSessionId) || {};
    if ((!currentSession?.title || currentSession.title === 'New Chat') && message.type === 'user') {
      // Generate a title from the first message
      const newTitle = message.content.length > 30 
        ? `${message.content.substring(0, 30)}...` 
        : message.content;
      updateSessionTitle(currentSessionId, newTitle);
    }

    return newMessage;
  }, [currentSessionId, sessions, updateSessionTitle]);

  // Initialize with a new session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    } else if (currentSessionId === null && sessions.length > 0) {
      setCurrentSessionId(sessions[0].id);
      setMessages(sessions[0].messages || []);
    }
  }, [sessions.length, currentSessionId, createNewSession]);

  // Clear all sessions
  const clearAllSessions = useCallback(() => {
    const newSession = {
      id: uuidv4(),
      title: 'New Chat',
      model: selectedModel,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [getInitialBotMessage()]
    };
    
    setSessions([newSession]);
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages);
  }, [selectedModel]);

  // Handle sending a message
  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isSending) return;

    const userMessage = {
      id: uuidv4(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    // Add user message to chat
    addMessage(userMessage);
    setIsSending(true);

    try {
      // Simulate API call
      const response = await new Promise(resolve => {
        setTimeout(() => {
          resolve({
            message: "I'm your AI assistant. How can I help you today?"
          });
        }, 1000);
      });

      const botMessage = {
        id: uuidv4(),
        type: 'bot',
        content: response.message,
        timestamp: new Date(),
        status: 'delivered'
      };

      // Add bot response to chat
      addMessage(botMessage);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        id: uuidv4(),
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      
      addMessage(errorMessage);
    } finally {
      setIsSending(false);
    }
  }, [isSending, addMessage]);

  // Handle model change
  const handleModelChange = useCallback((modelId) => {
    setSelectedModel(modelId);
    setShowModelDropdown(false);
    
    // Update current session with new model
    if (currentSessionId) {
      updateCurrentSession({ model: modelId });
    }
  }, [currentSessionId, updateCurrentSession]);

  // Save the current chat
  const saveChat = useCallback(() => {
    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (currentSession) {
      // Save the chat to local storage or API
      localStorage.setItem('chat', JSON.stringify(currentSession));
    }
  }, [sessions, currentSessionId]);

  // Load the saved chat
  const loadChat = useCallback(() => {
    const savedChat = localStorage.getItem('chat');
    if (savedChat) {
      const chat = JSON.parse(savedChat);
      switchSession(chat.id);
    }
  }, []);

  // Reset the current chat
  const resetChat = useCallback(() => {
    const newSession = createNewSession();
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([getInitialBotMessage()]);
    return newSession.id;
  }, [createNewSession]);

  // Toggle options menu
  const toggleOptions = useCallback(() => {
    setShowOptions(prev => !prev);
  }, []);

  // Create ref for model button
  const modelButtonRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelButtonRef.current && !modelButtonRef.current.contains(event.target)) {
        setShowModelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModelDropdown]);

  // Context value
  const value = {
    // State
    sessions,
    currentSessionId,
    messages,
    selectedModel,
    conversationStyle,
    showModelDropdown,
    isLoading,
    isSending,
    showOptions,
    activeChatDropdown,
    modelButtonRef,
    
    // Actions
    createNewSession,
    updateCurrentSession,
    deleteSession,
    switchSession,
    updateSessionTitle,
    addMessage,
    clearAllSessions,
    
    // Message Actions
    sendMessage,
    
    // UI Actions
    setSelectedModel: handleModelChange,
    setConversationStyle,
    setShowModelDropdown,
    setIsLoading,
    setIsSending,
    toggleOptions,
    
    // For backward compatibility
    currentChatTitle: sessions.find(s => s.id === currentSessionId)?.title || 'New Chat',
    conversationId: currentSessionId,
    setCurrentChatTitle: (title) => updateSessionTitle(currentSessionId, title),
    resetChat: clearAllSessions,
    loadChatHistory: (chat) => {
      if (chat?.id) {
        switchSession(chat.id);
      }
    }
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
