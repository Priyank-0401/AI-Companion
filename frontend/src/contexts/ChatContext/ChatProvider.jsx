import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { chatApi } from '../../services/api';
import ChatContext from './ChatContext';
import { format, isToday, isYesterday, subDays, parseISO } from 'date-fns';
import { useAuth } from '../AuthContext';

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

const ChatProvider = ({ children }) => {
  const { currentUser } = useAuth();
  
  // State for conversations from Firestore
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);

  const [currentSessionId, setCurrentSessionId] = useState(() => {
    try {
      return localStorage.getItem('currentChatSessionId') || null;
    } catch (error) {
      console.error('Failed to get current session ID', error);
      return null;
    }
  });

  const [messages, setMessages] = useState(() => {
    if (!currentSessionId) return [getInitialBotMessage()];
    const session = sessions.find(s => s.id === currentSessionId);
    return session?.messages || [getInitialBotMessage()];
  });

  const [selectedModel, setSelectedModel] = useState('default');
  // Default conversation style is always 'supportive'
  const [conversationStyle, setConversationStyle] = useState('supportive');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [activeChatDropdown, setActiveChatDropdown] = useState(null);
  const [isSending, setIsSending] = useState(false);
  
  const abortControllerRef = useRef(null);
  const modelButtonRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    if (!currentUser?.uid) {
      console.log('No user ID, skipping fetch');
      setSessions([]);
      setIsLoadingSessions(false);
      return [];
    }
  
    try {
      console.log('Fetching conversations...');
      const data = await chatApi.getConversations();
      console.log('Fetched conversations:', data);
      
      const formattedSessions = (Array.isArray(data) ? data : []).map(session => {
        // Handle different date formats
        const parseDate = (dateValue, fallback = new Date()) => {
          if (!dateValue) return fallback;
          if (dateValue instanceof Date) return dateValue;
          if (typeof dateValue === 'string') return new Date(dateValue);
          if (dateValue.toDate) return dateValue.toDate();
          return fallback;
        };
        
        const createdAt = parseDate(session.createdAt);
        const updatedAt = parseDate(session.updatedAt, createdAt);
        
        return {
          id: session.id || uuidv4(),
          title: session.title || 'New Chat',
          messages: Array.isArray(session.messages) ? session.messages : [],
          model: session.model || 'default',
          style: session.style || 'supportive',
          userId: session.userId || currentUser.uid,
          createdAt,
          updatedAt
        };
      });
  
      const sortedSessions = formattedSessions.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );
  
      setSessions(sortedSessions);
      setSessionsError(null);
      return sortedSessions;
    } catch (error) {
      console.error('Error in fetchConversations:', error);
      setSessionsError(error);
      setSessions([]);
      return [];
    } finally {
      setIsLoadingSessions(false);
    }
  }, [currentUser?.uid]);

  // Load a session
  const loadSession = useCallback(async (sessionId) => {
    if (!currentUser?.uid) {
      console.warn('No user authenticated, cannot load session');
      return false;
    }
    
    try {
      setIsLoadingSession(true);
      setSessionError(null);
      
      console.log(`Loading session ${sessionId}...`);
      const session = await chatApi.getConversation(sessionId);
      
      if (!session) {
        console.warn(`Session ${sessionId} not found`);
        setSessionError(new Error('Session not found'));
        return false;
      }
      
      // Ensure messages is an array and has required fields
      const formatMessage = (msg) => {
        if (!msg) return null;
        
        const timestamp = msg.timestamp 
          ? (typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp)
          : new Date();
          
        return {
          id: msg.id || uuidv4(),
          type: msg.type || 'user',
          content: msg.content || '',
          timestamp,
          model: msg.model || 'default',
          style: msg.style || 'supportive',
          ...(msg.metadata || {})
        };
      };
      
      const formattedMessages = (Array.isArray(session.messages) 
        ? session.messages.map(formatMessage).filter(Boolean)
        : []);
      
      // Update current session
      const updatedSession = {
        id: session.id || uuidv4(),
        title: session.title || 'New Chat',
        messages: formattedMessages,
        model: session.model || 'default',
        style: session.style || 'supportive',
        userId: session.userId || currentUser.uid,
        createdAt: session.createdAt 
          ? (typeof session.createdAt === 'string' 
              ? new Date(session.createdAt) 
              : session.createdAt)
          : new Date(),
        updatedAt: session.updatedAt 
          ? (typeof session.updatedAt === 'string' 
              ? new Date(session.updatedAt) 
              : session.updatedAt)
          : new Date(),
      };
      
      // Update the current session ID and messages
      setCurrentSessionId(updatedSession.id);
      setMessages(updatedSession.messages.length > 0 ? updatedSession.messages : [getInitialBotMessage()]);
      
      // Update URL with session ID
      window.history.pushState({}, '', `/chat/${sessionId}`);
      
      // Update the sessions list with the latest session data
      setSessions(prevSessions => {
        const existingIndex = prevSessions.findIndex(s => s.id === sessionId);
        if (existingIndex >= 0) {
          const updatedSessions = [...prevSessions];
          updatedSessions[existingIndex] = updatedSession;
          return updatedSessions;
        }
        return [updatedSession, ...prevSessions];
      });
      
      console.log('Session loaded successfully:', updatedSession);
      return true;
    } catch (error) {
      console.error('Error loading session:', error);
      setSessionError(error);
      return false;
    } finally {
      setIsLoadingSession(false);
    }
  }, [currentUser?.uid]);

  // Switch to a different session
  const switchSession = useCallback((sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return false;
    
    setCurrentSessionId(session.id);
    
    // Update URL with session ID
    window.history.pushState({}, '', `/chat/${sessionId}`);
    
    return true;
  }, [sessions]);

  // Clear all chat sessions

  // Create a new session
  const createNewSession = useCallback(async () => {
    if (!currentUser?.uid) {
      console.warn('No user authenticated, cannot create session');
      return null;
    }
    
    try {
      setIsCreatingSession(true);
      
      const newSession = {
        id: `conv_${Date.now()}`,
        title: 'New Chat',
        messages: [],
        model: 'default',
        style: 'supportive',
        userId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('Creating new session:', newSession);
      
      try {
        // Try to save to backend first
        const savedSession = await chatApi.saveConversation(newSession);
        
        // Use the saved session or fallback to the new session
        const sessionToUse = savedSession || newSession;
        
        // Update state
        setCurrentSessionId(sessionToUse.id);
        setSessions(prev => [sessionToUse, ...prev]);
        
        // Update URL
        window.history.pushState({}, '', `/chat/${sessionToUse.id}`);
        
        console.log('Session created successfully:', sessionToUse);
        return sessionToUse;
      } catch (backendError) {
        console.error('Error saving to backend, creating local session:', backendError);
        
        // Create a local session if backend save fails
        const localSession = {
          ...newSession,
          id: `local_${Date.now()}`,
          title: 'New Chat (Local)',
          isLocal: true
        };
        
        setCurrentSessionId(localSession.id);
        setSessions(prev => [localSession, ...prev]);
        window.history.pushState({}, '', `/chat/${localSession.id}`);
        
        console.log('Local session created successfully:', localSession);
        return localSession;
      }
    } catch (error) {
      console.error('Unexpected error in createNewSession:', error);
      throw error; // Re-throw to be caught by the caller
    } finally {
      setIsCreatingSession(false);
    }
  }, [currentUser?.uid]);

  const clearAllSessions = useCallback(async () => {
    if (!currentUser) return false;
    
    try {
      // Delete all sessions from Firestore
      await Promise.all(
        sessions.map(session => 
          chatApi.deleteConversation(session.id).catch(console.error)
        )
      );
      
      // Clear local state
      setSessions([]);
      setCurrentSessionId(null);
      setMessages([getInitialBotMessage()]);
      
      // Create a new empty session
      await createNewSession();
      
      return true;
    } catch (error) {
      console.error('Error clearing all sessions:', error);
      return false;
    }
  },[sessions, currentUser, createNewSession]);


  // Load conversations on mount and when currentUser changes
  // Track if we've already attempted to load data
  const hasLoadedData = useRef(false);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      // Skip if no user or we've already loaded data
      if (!currentUser?.uid || hasLoadedData.current) {
        return;
      }
      
      console.log('Loading chat data...');
      hasLoadedData.current = true;
      
      try {
        setIsLoadingSessions(true);
        const sessions = await fetchConversations();
        
        if (!isMounted) return;
        
        console.log(`Loaded ${sessions.length} sessions`);
        
        // Only create a new session on initial load if there are no sessions
        if (isInitialLoad.current) {
          isInitialLoad.current = false;
          
          if (sessions.length > 0) {
            // If we have sessions, load the first one
            if (!currentSessionId) {
              console.log('Loading first session:', sessions[0].id);
              await loadSession(sessions[0].id);
            }
          } else {
            // If no sessions, create a new one
            console.log('No sessions found, creating new session');
            await createNewSession();
          }
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
        // Only create a new session on initial load if we encounter an error
        if (isMounted && isInitialLoad.current) {
          console.log('Error loading sessions, creating new session');
          await createNewSession();
          isInitialLoad.current = false;
        }
      } finally {
        if (isMounted) {
          console.log('Finished loading chat data');
          setIsLoadingSessions(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [currentUser?.uid, currentSessionId]); // Removed dependencies that could cause loops
  
  // Group chats by date for the sidebar
  const groupedSessions = useMemo(() => {
    const now = new Date();
    const today = [];
    const yesterday = [];
    const last7Days = [];
    const older = [];
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.updatedAt || session.createdAt);
      
      if (isToday(sessionDate)) {
        today.push(session);
      } else if (isYesterday(sessionDate)) {
        yesterday.push(session);
      } else if (sessionDate > subDays(now, 7)) {
        last7Days.push(session);
      } else {
        older.push(session);
      }
    });
    
    return { today, yesterday, last7Days, older };
  }, [sessions]);

  // Update messages when session changes
  useEffect(() => {
    if (!currentSessionId) {
      const welcomeMessage = getInitialBotMessage();
      setMessages([welcomeMessage]);
      return;
    }
    
    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (currentSession) {
      // If the session has no messages, add the welcome message
      if (!currentSession.messages || currentSession.messages.length === 0) {
        const welcomeMessage = getInitialBotMessage();
        const updatedSession = {
          ...currentSession,
          messages: [welcomeMessage],
          lastMessage: welcomeMessage.content
        };
        
        setMessages([welcomeMessage]);
        
        // Update the session in the sessions list
        setSessions(prev => 
          prev.map(s => s.id === currentSessionId ? updatedSession : s)
        );
      } else {
        // If the session already has messages, use them
        setMessages(currentSession.messages);
      }
    } else {
      // If no session is found, show the welcome message
      const welcomeMessage = getInitialBotMessage();
      setMessages([welcomeMessage]);
    }
  }, [currentSessionId, sessions]);

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
  }, []);

  // Abort any ongoing requests when needed
  const abortCurrentRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Update a session with new data
  const updateSession = useCallback(async (sessionId, updates) => {
    if (!currentUser?.uid) {
      console.warn('No user authenticated, cannot update session');
      return false;
    }
    
    try {
      console.log(`Updating session ${sessionId}:`, updates);
      
      // Find the current session
      const currentSession = sessions.find(s => s.id === sessionId);
      if (!currentSession) {
        console.warn(`Session ${sessionId} not found for update`);
        return false;
      }
      
      // Prepare the updated session
      const updatedSession = {
        ...currentSession,
        ...updates,
        updatedAt: new Date(),
        // Ensure we don't override critical fields
        id: sessionId,
        userId: currentUser.uid
      };
      
      // Update in the backend
      const savedSession = await chatApi.saveConversation(updatedSession);
      
      // Use the server's response or fall back to our local update
      const finalSession = savedSession || updatedSession;
      
      // Update local state
      setSessions(prevSessions => 
        prevSessions.map(s => 
          s.id === sessionId ? { ...finalSession } : s
        )
      );
      
      // Update current session if it's the active one
      if (currentSession?.id === sessionId) {
        setCurrentSessionId(finalSession.id);
      }
      
      console.log('Session updated successfully:', finalSession);
      return true;
    } catch (error) {
      console.error(`Error updating session ${sessionId}:`, error);
      return false;
    }
  }, [sessions, currentUser?.uid]);

  // Delete a chat session
  const deleteSession = useCallback(async (sessionId) => {
    if (!currentUser?.uid) {
      console.warn('No user authenticated, cannot delete session');
      return false;
    }
    
    try {
      console.log(`Deleting session ${sessionId}...`);
      
      // Optimistically update the UI
      setSessions(prevSessions => prevSessions.filter(s => s.id !== sessionId));
      
      // If the deleted session is the current one, clear it
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([getInitialBotMessage()]);
      }
      
      // Delete from the backend
      await chatApi.deleteConversation(sessionId);
      
      console.log(`Session ${sessionId} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`Error deleting session ${sessionId}:`, error);
      
      // Re-fetch sessions to restore the correct state
      await fetchConversations();
      
      return false;
    }
  }, [currentUser?.uid, currentSessionId, fetchConversations]);

  // Handle sending a message
  const sendMessage = useCallback(async (content) => {
    if (!currentUser?.uid || !currentSessionId) {
      console.error('No user or active session');
      return false;
    }
    
    try {
      setIsSending(true);
      
      // Get the current session from sessions state
      const currentSessionFromState = sessions.find(s => s.id === currentSessionId);
      if (!currentSessionFromState) {
        console.error('Current session not found');
        return false;
      }
      
      // Create user message
      const userMessage = {
        id: uuidv4(),
        type: 'user',
        content: content.trim(),
        timestamp: new Date(),
        model: currentSessionFromState.model || 'default',
        style: currentSessionFromState.style || 'supportive'
      };
      
      // Optimistically update the UI
      const updatedMessages = [...(currentSessionFromState.messages || []), userMessage];
      const updatedSession = {
        ...currentSessionFromState,
        messages: updatedMessages,
        updatedAt: new Date(),
        // Update title if it's the first message
        title: currentSessionFromState.title || 
               (content.length > 30 ? content.substring(0, 27) + '...' : content) || 'New Chat'
      };
      
      // Update the sessions state with the updated session
      setSessions(prevSessions => 
        prevSessions.map(s => 
          s.id === currentSessionId ? updatedSession : s
        )
      );
      
      // Update sessions list with the new title if this is the first message
      if (!currentSessionFromState.title) {
        setSessions(prevSessions => 
          prevSessions.map(s => 
            s.id === updatedSession.id ? updatedSession : s
          )
        );
      }
      
      // Send the message to the backend
      const response = await chatApi.sendMessage({
        message: content,
        model: currentSessionFromState.model || 'default',
        style: currentSessionFromState.style || 'supportive',
        conversationId: currentSessionId
      });
      
      if (response?.response) {
        const botMessage = {
          id: uuidv4(),
          type: 'bot',
          content: response.response,
          timestamp: new Date(),
          model: currentSession.model || 'default',
          style: currentSession.style || 'supportive'
        };
        
        const finalMessages = [...updatedMessages, botMessage];
        const finalSession = {
          ...updatedSession,
          messages: finalMessages,
          updatedAt: new Date()
        };
        
        // Update the backend with the complete conversation
        await chatApi.saveConversation(finalSession);
        
        // Update the UI with the bot's response
        setCurrentSessionId(finalSession.id);
        setSessions(prevSessions => 
          prevSessions.map(s => 
            s.id === finalSession.id ? finalSession : s
          )
        );
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error message to user
      const errorMessage = {
        id: uuidv4(),
        type: 'system',
        content: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date(),
        isError: true,
        userId: currentUser?.uid
      };
      
      // Add error message to the conversation
      setCurrentSessionId(currentSessionId);
      setMessages(prev => [...prev, errorMessage]);
      
      return false;
    } finally {
      setIsSending(false);
    }
  }, [currentUser?.uid, currentSessionId, sessions]);

  // Handle model change
  const handleModelChange = useCallback((model) => {
    setSelectedModel(model);
    setShowModelDropdown(false);
  }, []);

  // Toggle options menu
  const toggleOptions = useCallback(() => {
    setShowOptions(prev => !prev);
  }, []);

  // Add a message to the current session
  const addMessage = useCallback(async (message) => {
    if (!currentSessionId) return false;
    
    try {
      const newMessage = {
        id: uuidv4(),
        ...message,
        timestamp: message.timestamp || new Date(),
        model: message.model || selectedModel,
        style: message.style || conversationStyle
      };
      
      // Update local state and get the updated session
      let updatedSession = null;
      
      setSessions(prevSessions => {
        const updatedSessions = prevSessions.map(session => 
          session.id === currentSessionId
            ? {
                ...session,
                messages: [...(session.messages || []), newMessage],
                updatedAt: new Date()
              }
            : session
        );
        
        // Get the updated session from the new state
        updatedSession = updatedSessions.find(s => s.id === currentSessionId) || null;
        return updatedSessions;
      });
      
      // Save to backend if needed
      if (currentUser?.uid) {
        // Get the latest messages including the new one
        const sessionMessages = updatedSession?.messages || [];
        await chatApi.saveConversation({
          id: currentSessionId,
          messages: sessionMessages,
          updatedAt: new Date()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error adding message:', error);
      return false;
    }
  }, [currentSessionId, currentUser?.uid, selectedModel, conversationStyle]);

  // Update the title of a specific session
  const updateSessionTitle = useCallback(async (sessionId, newTitle) => {
    if (!sessionId) return false;
    
    try {
      const trimmedTitle = newTitle.trim();
      if (!trimmedTitle) return false;
      
      // Update local state
      setSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === sessionId 
            ? { ...session, title: trimmedTitle, updatedAt: new Date() }
            : session
        )
      );
      
      // Update current session if it's the one being modified
      if (currentSessionId === sessionId) {
        setCurrentSessionId(sessionId);
      }
      
      // Save to backend
      if (currentUser?.uid) {
        await chatApi.saveConversation({
          id: sessionId,
          title: trimmedTitle
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error updating session title:', error);
      // Re-fetch to ensure consistency
      await fetchConversations();
      return false;
    }
  }, [currentSessionId, currentUser?.uid, fetchConversations]);

  // Update the current session with new data
  const updateCurrentSession = useCallback((updates) => {
    if (!currentSessionId) return;
    
    setSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === currentSessionId 
          ? { ...session, ...updates, updatedAt: new Date() }
          : session
      )
    );
    
    // Also update the current session if it's the one being updated
    setCurrentSessionId(currentSessionId);
    
    // Save to backend if needed
    if (currentUser?.uid) {
      chatApi.saveConversation({
        id: currentSessionId,
        ...updates
      }).catch(error => {
        console.error('Error updating session in backend:', error);
      });
    }
  }, [currentSessionId, currentUser?.uid]);

  // Export session as JSON
  const exportSession = useCallback(async (sessionId) => {
    try {
      const sessionToExport = sessions.find(s => s.id === sessionId);
      if (!sessionToExport) {
        console.error('Session not found for export');
        return null;
      }

      // Create a clean copy of the session without any circular references
      const sessionCopy = {
        id: sessionToExport.id,
        title: sessionToExport.title || 'Exported Chat',
        messages: sessionToExport.messages || [],
        model: sessionToExport.model || 'default',
        style: sessionToExport.style || 'supportive',
        createdAt: sessionToExport.createdAt,
        updatedAt: sessionToExport.updatedAt
      };

      // Convert to JSON string with pretty formatting
      const jsonString = JSON.stringify(sessionCopy, null, 2);
      
      // Create a blob and download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${sessionCopy.id}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
      return sessionCopy;
    } catch (error) {
      console.error('Error exporting session:', error);
      throw error;
    }
  }, [sessions]);

  // Calculate current session based on currentSessionId
  const currentSession = useMemo(() => 
    sessions.find(s => s.id === currentSessionId) || null, 
    [sessions, currentSessionId]
  );

  // Context value - only includes stable values and functions
  const contextValue = useMemo(() => ({
    // State
    sessions,
    currentSessionId,
    messages,
    selectedModel,
    conversationStyle,
    showModelDropdown,
    isLoading: isLoading || isLoadingSessions,
    isSending,
    isTyping,
    showOptions,
    activeChatDropdown,
    modelButtonRef,
    
    // Session Actions
    createNewSession,
    updateCurrentSession,
    deleteSession,
    switchSession,
    updateSessionTitle,
    
    // Message Actions
    addMessage,
    sendMessage,
    clearAllSessions,
    
    // UI Actions
    setSelectedModel: handleModelChange,
    setConversationStyle,
    setShowModelDropdown,
    setIsLoading,
    setIsSending,
    toggleOptions,
    
    // For backward compatibility
    currentChatTitle: currentSession?.title || 'New Chat',
    conversationId: currentSessionId,
    setCurrentChatTitle: (title) => updateSessionTitle(currentSessionId, title),
    resetChat: clearAllSessions,
    loadChatHistory: (chat) => {
      if (chat?.id) {
        switchSession(chat.id);
      }
    },
    
    // New functions for chat history
    getCurrentSession: () => currentSession,
    getSessionById: (id) => sessions.find(s => s.id === id) || null,
    getSessionMessages: (id) => {
      const session = sessions.find(s => s.id === id);
      return session?.messages || [];
    },
    updateSession: (id, updates) => {
      setSessions(prev => 
        prev.map(session => 
          session.id === id 
            ? { ...session, ...updates, updatedAt: new Date() }
            : session
        )
      );
    },
    exportSession,
    
    // Grouped sessions for sidebar
    groupedSessions,
    
    // Error handling
    error: sessionsError,
    
    // Refresh function
    refreshConversations: fetchConversations
  }), [
    sessions,
    currentSessionId,
    messages,
    selectedModel,
    conversationStyle,
    showModelDropdown,
    isLoading,
    isLoadingSessions,
    isSending,
    isTyping,
    showOptions,
    activeChatDropdown,
    createNewSession,
    deleteSession,
    switchSession,
    exportSession,
    sendMessage,
    handleModelChange,
    groupedSessions,
    sessionsError,
    fetchConversations
  ]);

  // Update context value with current session and derived values
  const finalContextValue = useMemo(() => ({
    ...contextValue,
    currentSession,
    currentChatTitle: currentSession?.title || 'New Chat',
    getCurrentSession: () => currentSession,
    getSessionMessages: (id) => {
      const session = id === currentSessionId ? currentSession : sessions.find(s => s.id === id);
      return session?.messages || [];
    },
    setCurrentChatTitle: (title) => updateSessionTitle(currentSessionId, title)
  }), [contextValue, currentSession, currentSessionId, sessions, updateSessionTitle]);

  return (
    <ChatContext.Provider value={finalContextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;
