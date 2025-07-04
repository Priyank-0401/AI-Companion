import React, { createContext, useContext, useReducer, useCallback, useState, useEffect } from 'react';
import { useAuth } from '../auth/context/AuthContext';
import { useFirestoreConversations } from '../hooks/useFirestoreConversations';

// Create context
const ConversationContext = createContext();

// Action types
const SET_CURRENT_CONVERSATION = 'SET_CURRENT_CONVERSATION';
const ADD_MESSAGE = 'ADD_MESSAGE';
const UPDATE_CONVERSATION = 'UPDATE_CONVERSATION';
const SET_LOADING = 'SET_LOADING';
const SET_ERROR = 'SET_ERROR';
const SET_CONVERSATIONS = 'SET_CONVERSATIONS';
const RESET_CONVERSATION_STATE = 'RESET_CONVERSATION_STATE';

// Reducer function
const conversationReducer = (state, action) => {
  switch (action.type) {
    case SET_CURRENT_CONVERSATION:
      return {
        ...state,
        currentConversation: action.payload,
        messages: action.payload?.messages || [],
        loadingStates: {
          ...state.loadingStates,
          messages: false,
          currentConversation: false
        },
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
        } : null,
        loadingStates: {
          ...state.loadingStates,
          sendingMessage: false
        }
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
        ),
        loadingStates: {
          ...state.loadingStates,
          updatingConversation: false
        }
      };
    }
    
    case SET_CONVERSATIONS: {
      return {
        ...state,
        conversations: action.payload.conversations,
        loadingStates: {
          ...state.loadingStates,
          conversations: false
        },
        error: null
      };
    }
    
    case SET_LOADING: {
      const { key, isLoading } = action.payload;
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [key]: isLoading
        },
        error: isLoading ? state.error : null
      };
    }
      
    case SET_ERROR: {
      const { key, error } = action.payload;
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [key]: false
        },
        error: error || 'An error occurred'
      };
    }
    
    case RESET_CONVERSATION_STATE: {
      return {
        conversations: [],
        currentConversation: null,
        messages: [],
        error: null,
        loadingStates: {
          conversations: false,
          messages: false,
          currentConversation: false,
          sendingMessage: false,
          updatingConversation: false,
          deletingConversation: false
        }
      };
    }
      
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
    error: null,
    loadingStates: {
      conversations: false,
      messages: false,
      currentConversation: false,
      sendingMessage: false,
      updatingConversation: false,
      deletingConversation: false
    }
  });
  
  const {
    conversations: hookConversations,
    currentConversation: hookCurrentConversation,
    messages: hookMessages,
    loading: hookLoading,
    error: hookError,
    loadConversations: hookLoadConversations,
    loadConversation: hookLoadConversation,
    createConversation: hookCreateConversation,
    updateConversation: hookUpdateConversation,
    deleteConversation: hookDeleteConversation,
    addMessage: hookAddMessage,
    sendMessage: hookSendMessage,
  } = useFirestoreConversations();
  
  // Sync hook state with context state
  useEffect(() => {
    if (hookConversations) {
      dispatch({ 
        type: SET_CONVERSATIONS, 
        payload: { conversations: hookConversations } 
      });
    }
    
    if (hookCurrentConversation) {
      dispatch({ 
        type: SET_CURRENT_CONVERSATION, 
        payload: hookCurrentConversation 
      });
    }
    
    if (hookError) {
      dispatch({ 
        type: SET_ERROR, 
        payload: { 
          key: 'general', 
          error: typeof hookError === 'string' ? hookError : hookError?.message || 'An error occurred' 
        } 
      });
    }
    
    // Sync loading states
    if (hookLoading) {
      Object.entries(hookLoading).forEach(([key, value]) => {
        if (key === 'sending') {
          dispatch({ 
            type: SET_LOADING, 
            payload: { 
              key: 'sendingMessage', 
              isLoading: value 
            } 
          });
        } else if (['conversations', 'messages', 'currentConversation'].includes(key)) {
          dispatch({ 
            type: SET_LOADING, 
            payload: { 
              key, 
              isLoading: value 
            } 
          });
        }
      });
    }
  }, [hookConversations, hookCurrentConversation, hookError, hookLoading]);
  
  // Load conversations
  const loadConversationsList = useCallback(async () => {
    dispatch({ type: SET_LOADING, payload: { key: 'conversations', isLoading: true } });
    try {
      await hookLoadConversations();
    } catch (error) {
      const errorMessage = error?.message || 'Failed to load conversations';
      dispatch({ type: SET_ERROR, payload: { key: 'conversations', error: errorMessage } });
      throw new Error(errorMessage);
    }
  }, [hookLoadConversations]);
  
  // Load a specific conversation
  const loadConversationById = useCallback(async (conversationId) => {
    if (!conversationId) {
      dispatch({ type: SET_CURRENT_CONVERSATION, payload: null });
      return null;
    }
    
    dispatch({ type: SET_LOADING, payload: { key: 'currentConversation', isLoading: true } });
    try {
      const conversation = await hookLoadConversation(conversationId);
      dispatch({ type: SET_CURRENT_CONVERSATION, payload: conversation });
      return conversation;
    } catch (error) {
      const errorMessage = error?.message || 'Failed to load conversation';
      console.error('Error loading conversation:', errorMessage);
      dispatch({ type: SET_ERROR, payload: { key: 'currentConversation', error: errorMessage } });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: SET_LOADING, payload: { key: 'currentConversation', isLoading: false } });
    }
  }, [hookLoadConversation]);
  
  // Create a new conversation
  const createNewConversation = useCallback(async (conversationData) => {
    const loadingKey = 'currentConversation';
    
    try {
      dispatch({ type: SET_LOADING, payload: { key: loadingKey, isLoading: true } });
      
      const newConversation = await hookCreateConversation(conversationData);
      
      // Update the conversations list and set the current conversation
      dispatch({ 
        type: UPDATE_CONVERSATION,
        payload: { 
          updates: newConversation
        }
      });
      
      dispatch({ 
        type: SET_CURRENT_CONVERSATION, 
        payload: newConversation 
      });
      
      return newConversation;
    } catch (error) {
      const errorMessage = error?.message || 'Failed to create conversation';
      console.error('Failed to create conversation:', errorMessage);
      dispatch({ 
        type: SET_ERROR, 
        payload: { 
          key: loadingKey, 
          error: errorMessage
        } 
      });
      throw new Error(errorMessage);
    } finally {
      dispatch({ 
        type: SET_LOADING, 
        payload: { key: loadingKey, isLoading: false } 
      });
    }
  }, [hookCreateConversation]);
  
  // Update a conversation
  const updateConversation = useCallback(async (conversationId, updates) => {
    dispatch({ type: SET_LOADING, payload: { key: 'updatingConversation', isLoading: true } });
    try {
      const updatedConversation = await hookUpdateConversation(conversationId, updates);
      dispatch({ 
        type: UPDATE_CONVERSATION, 
        payload: { updates: { ...updates, id: conversationId } } 
      });
      return updatedConversation;
    } catch (error) {
      const errorMessage = error?.message || 'Failed to update conversation';
      dispatch({ 
        type: SET_ERROR, 
        payload: { 
          key: 'updatingConversation', 
          error: errorMessage 
        } 
      });
      throw new Error(errorMessage);
    } finally {
      dispatch({ 
        type: SET_LOADING, 
        payload: { key: 'updatingConversation', isLoading: false } 
      });
    }
  }, [hookUpdateConversation]);
  
  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId) => {
    dispatch({ type: SET_LOADING, payload: { key: 'deletingConversation', isLoading: true } });
    try {
      await hookDeleteConversation(conversationId);
      if (state.currentConversation?.id === conversationId) {
        dispatch({ type: SET_CURRENT_CONVERSATION, payload: null });
      }
      return true;
    } catch (error) {
      const errorMessage = error?.message || 'Failed to delete conversation';
      dispatch({ 
        type: SET_ERROR, 
        payload: { 
          key: 'deletingConversation', 
          error: errorMessage 
        } 
      });
      throw new Error(errorMessage);
    } finally {
      dispatch({ 
        type: SET_LOADING, 
        payload: { key: 'deletingConversation', isLoading: false } 
      });
    }
  }, [hookDeleteConversation, state.currentConversation]);
  
  // Add a message to the current conversation
  const addMessage = useCallback(async (messageData) => {
    dispatch({ type: SET_LOADING, payload: { key: 'sendingMessage', isLoading: true } });
    try {
      const newMessage = await hookAddMessage(messageData);
      dispatch({ type: ADD_MESSAGE, payload: { message: newMessage } });
      return newMessage;
    } catch (error) {
      const errorMessage = error?.message || 'Failed to add message';
      dispatch({ 
        type: SET_ERROR, 
        payload: { 
          key: 'sendingMessage', 
          error: errorMessage 
        } 
      });
      throw new Error(errorMessage);
    } finally {
      dispatch({ 
        type: SET_LOADING, 
        payload: { key: 'sendingMessage', isLoading: false } 
      });
    }
  }, [hookAddMessage]);
  
  // Effect to sync with hook state
  React.useEffect(() => {
    if (hookConversations) {
      dispatch({ 
        type: SET_CONVERSATIONS, 
        payload: { conversations: hookConversations } 
      });
    }
  }, [hookConversations]);
  
  // Helper function to get loading state
  const getIsLoading = useCallback((key) => {
    return state.loadingStates[key] || false;
  }, [state.loadingStates]);
  
  // Effect to load conversations when user changes
  React.useEffect(() => {
    if (currentUser) {
      loadConversationsList();
    } else {
      dispatch({ type: 'RESET_CONVERSATION_STATE' });
    }
  }, [currentUser, loadConversationsList]);
  
  // Context value
  const contextValue = {
    // State
    conversations: state.conversations,
    currentConversation: state.currentConversation,
    messages: state.messages,
    error: state.error,
    
    // Loading states
    isLoading: Object.values(state.loadingStates).some(Boolean),
    loadingStates: state.loadingStates,
    
    // Actions
    loadConversations: loadConversationsList,
    loadConversation: loadConversationById,
    createConversation: createNewConversation,
    updateConversation,
    deleteConversation,
    addMessage,
    sendMessage: hookSendMessage,
    
    // Derived state
    hasConversations: state.conversations?.length > 0,
  };

  return (
    <ConversationContext.Provider value={contextValue}>
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

// Export the context as a named export
export { ConversationContext };

// Default export the provider for cleaner imports
export default ConversationProvider;
