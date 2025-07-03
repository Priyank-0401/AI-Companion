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
    dispatch({ type: SET_LOADING, payload: { key: 'conversations', isLoading: true } });
    try {
      await loadConversations();
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: { key: 'conversations', error: error.message } });
      throw error;
    }
  }, [loadConversations]);
  
  // Load a specific conversation
  const loadConversation = useCallback(async (conversationId) => {
    if (!conversationId) {
      dispatch({ type: SET_CURRENT_CONVERSATION, payload: null });
      return;
    }
    
    dispatch({ type: SET_LOADING, payload: { key: 'currentConversation', isLoading: true } });
    try {
      const conversation = await loadConversationFromHook(conversationId);
      dispatch({ type: SET_CURRENT_CONVERSATION, payload: conversation });
      return conversation;
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: { key: 'currentConversation', error: error.message } });
      throw error;
    }
  }, [loadConversationFromHook]);
  
  // Create a new conversation
  const createConversation = useCallback(async (conversationData) => {
    const loadingKey = 'currentConversation';
    
    try {
      dispatch({ type: SET_LOADING, payload: { key: loadingKey, isLoading: true } });
      
      const newConversation = await createConversationFromHook(conversationData);
      
      // Update the conversations list and set the current conversation
      dispatch({ 
        type: 'UPDATE_CONVERSATION',
        payload: { 
          updates: {
            ...newConversation,
            id: newConversation.id
          }
        }
      });
      
      dispatch({ 
        type: SET_CURRENT_CONVERSATION, 
        payload: newConversation 
      });
      
      return newConversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      dispatch({ 
        type: SET_ERROR, 
        payload: { 
          key: loadingKey, 
          error: error.message || 'Failed to create conversation' 
        } 
      });
      throw error;
    } finally {
      // Ensure loading state is always reset
      setTimeout(() => {
        dispatch({ 
          type: SET_LOADING, 
          payload: { key: loadingKey, isLoading: false } 
        });
      }, 0);
    }
  }, [createConversationFromHook]);
  
  // Update a conversation
  const updateConversation = useCallback(async (conversationId, updates) => {
    dispatch({ type: SET_LOADING, payload: { key: 'updatingConversation', isLoading: true } });
    try {
      const updatedConversation = await updateConversationFromHook(conversationId, updates);
      dispatch({ 
        type: UPDATE_CONVERSATION, 
        payload: { updates: { ...updates, id: conversationId } } 
      });
      return updatedConversation;
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: { key: 'updatingConversation', error: error.message } });
      throw error;
    }
  }, [updateConversationFromHook]);
  
  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId) => {
    dispatch({ type: SET_LOADING, payload: { key: 'deletingConversation', isLoading: true } });
    try {
      await deleteConversationFromHook(conversationId);
      if (state.currentConversation?.id === conversationId) {
        dispatch({ type: SET_CURRENT_CONVERSATION, payload: null });
      }
      return true;
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: { key: 'deletingConversation', error: error.message } });
      throw error;
    }
  }, [deleteConversationFromHook, state.currentConversation]);
  
  // Add a message to the current conversation
  const addMessage = useCallback(async (messageData) => {
    dispatch({ type: SET_LOADING, payload: { key: 'sendingMessage', isLoading: true } });
    try {
      const newMessage = await addMessageFromHook(messageData);
      dispatch({ type: ADD_MESSAGE, payload: { message: newMessage } });
      return newMessage;
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: { key: 'sendingMessage', error: error.message } });
      throw error;
    }
  }, [addMessageFromHook]);
  
  // Effect to sync with hook state
  React.useEffect(() => {
    if (conversations) {
      dispatch({ 
        type: SET_CONVERSATIONS, 
        payload: { conversations } 
      });
    }
  }, [conversations]);
  
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
  const value = {
    // State
    conversations: state.conversations || conversations,
    currentConversation: state.currentConversation || currentConversation,
    messages: state.messages || messages,
    error: state.error || error,
    
    // Loading states
    isLoading: Object.values(state.loadingStates).some(Boolean),
    loadingStates: {
      conversations: getIsLoading('conversations'),
      messages: getIsLoading('messages'),
      currentConversation: getIsLoading('currentConversation'),
      sendingMessage: getIsLoading('sendingMessage'),
      updatingConversation: getIsLoading('updatingConversation'),
      deletingConversation: getIsLoading('deletingConversation')
    },
    
    // Actions
    loadConversations: loadConversationsList,
    loadConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    addMessage,
    
    // Derived state
    hasConversations: (state.conversations || conversations).length > 0,
    
    // Helper functions
    getIsLoading
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

// Export the context as a named export
export { ConversationContext };

// Default export the provider for cleaner imports
export default ConversationProvider;
