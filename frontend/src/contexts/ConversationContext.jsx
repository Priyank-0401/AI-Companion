import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useConversation } from '../hooks/useConversation';

// Create context
const ConversationContext = createContext();

// Action types
const SET_CURRENT_CONVERSATION = 'SET_CURRENT_CONVERSATION';
const ADD_MESSAGE = 'ADD_MESSAGE';
const UPDATE_CONVERSATION = 'UPDATE_CONVERSATION';
const SET_LOADING = 'SET_LOADING';
const SET_ERROR = 'SET_ERROR';

// Reducer function
const conversationReducer = (state, action) => {
  switch (action.type) {
    case SET_CURRENT_CONVERSATION:
      return {
        ...state,
        currentConversation: action.payload,
        messages: action.payload?.messages || [],
        isLoading: false,
        error: null
      };
      
    case ADD_MESSAGE: {
      const { message } = action.payload;
      return {
        ...state,
        messages: [...state.messages, message],
        currentConversation: state.currentConversation ? {
          ...state.currentConversation,
          updatedAt: new Date().toISOString()
        } : null
      };
    }
    
    case UPDATE_CONVERSATION: {
      const { updates } = action.payload;
      return {
        ...state,
        currentConversation: state.currentConversation ? {
          ...state.currentConversation,
          ...updates
        } : null,
        conversations: state.conversations.map(conv => 
          conv.id === updates.id ? { ...conv, ...updates } : conv
        )
      };
    }
    
    case SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? state.error : null
      };
      
    case SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
      
    default:
      return state;
  }
};

export const ConversationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [state, dispatch] = useReducer(conversationReducer, {
    conversations: [],
    currentConversation: null,
    messages: [],
    isLoading: false,
    error: null
  });
  
  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    error,
    loadConversations,
    loadConversation: loadConversationFromHook,
    createConversation: createConversationFromHook,
    updateConversation: updateConversationFromHook,
    deleteConversation: deleteConversationFromHook,
    addMessage: addMessageFromHook
  } = useConversation();
  
  // Load conversations
  const loadConversationsList = useCallback(async () => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      await loadConversations();
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: error.message });
    }
  }, [loadConversations]);
  
  // Load a specific conversation
  const loadConversation = useCallback(async (conversationId) => {
    if (!conversationId) {
      dispatch({ type: SET_CURRENT_CONVERSATION, payload: null });
      return;
    }
    
    dispatch({ type: SET_LOADING, payload: true });
    try {
      await loadConversationFromHook(conversationId);
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: error.message });
    }
  }, [loadConversationFromHook]);
  
  // Create a new conversation
  const createConversation = useCallback(async (conversationData) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const newConversation = await createConversationFromHook(conversationData);
      dispatch({ type: SET_CURRENT_CONVERSATION, payload: newConversation });
      return newConversation;
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: error.message });
      throw error;
    }
  }, [createConversationFromHook]);
  
  // Update a conversation
  const updateConversation = useCallback(async (conversationId, updates) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const updatedConversation = await updateConversationFromHook(conversationId, updates);
      dispatch({ 
        type: UPDATE_CONVERSATION, 
        payload: { updates: { ...updates, id: conversationId } } 
      });
      return updatedConversation;
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: error.message });
      throw error;
    }
  }, [updateConversationFromHook]);
  
  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      await deleteConversationFromHook(conversationId);
      if (state.currentConversation?.id === conversationId) {
        dispatch({ type: SET_CURRENT_CONVERSATION, payload: null });
      }
      return true;
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: error.message });
      throw error;
    }
  }, [deleteConversationFromHook, state.currentConversation]);
  
  // Add a message to the current conversation
  const addMessage = useCallback(async (messageData) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const newMessage = await addMessageFromHook(messageData);
      dispatch({ type: ADD_MESSAGE, payload: { message: newMessage } });
      return newMessage;
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: error.message });
      throw error;
    }
  }, [addMessageFromHook]);
  
  // Effect to sync with hook state
  React.useEffect(() => {
    if (conversations) {
      dispatch({ 
        type: 'SET_CONVERSATIONS', 
        payload: { conversations } 
      });
    }
  }, [conversations]);
  
  // Effect to load conversations when user changes
  React.useEffect(() => {
    if (currentUser) {
      loadConversationsList();
    } else {
      dispatch({ type: 'RESET_CONVERSATION_STATE' });
    }
  }, [currentUser, loadConversationsList]);
  
  // Context value
  const value = {
    // State
    conversations: state.conversations || conversations,
    currentConversation: state.currentConversation || currentConversation,
    messages: state.messages || messages,
    isLoading: state.isLoading || isLoading,
    error: state.error || error,
    
    // Actions
    loadConversations: loadConversationsList,
    loadConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    addMessage,
    
    // Derived state
    hasConversations: (state.conversations || conversations).length > 0
  };
  
  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

// Custom hook to use the conversation context
export const useConversationContext = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversationContext must be used within a ConversationProvider');
  }
  return context;
};

export default ConversationContext;
