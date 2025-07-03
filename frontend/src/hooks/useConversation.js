import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getConversations, 
  getConversation, 
  createConversation as createConversationApi,
  updateConversation as updateConversationApi,
  deleteConversation as deleteConversationApi,
  addMessage as addMessageApi,
  subscribeToConversation
} from '../services/conversationService';
import { useAuth } from '../contexts/AuthContext';

export const useConversation = () => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  // Load user's conversations
  const loadConversations = useCallback(async () => {
    if (!currentUser) {
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getConversations();
      setConversations(data || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError(err.message || 'Failed to load conversations');
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Load a specific conversation
  const loadConversation = useCallback(async (conversationId) => {
    if (!conversationId || !currentUser) {
      setCurrentConversation(null);
      setMessages([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Unsubscribe from previous subscription if exists
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      // Load conversation data
      const conversation = await getConversation(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      setCurrentConversation(conversation);
      setMessages(conversation.messages || []);
      
      // Subscribe to real-time updates
      unsubscribeRef.current = subscribeToConversation(conversationId, (err, data) => {
        if (err) {
          console.error('Error in conversation subscription:', err);
          setError('Connection to conversation lost. Please refresh the page.');
          return;
        }
        
        if (data) {
          setCurrentConversation(prev => ({
            ...prev,
            ...data,
            messages: data.messages || []
          }));
          setMessages(data.messages || []);
        }
      });
      
      return conversation;
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setError(err.message || 'Failed to load conversation');
      setCurrentConversation(null);
      setMessages([]);
      throw err; // Re-throw to allow error handling in the component
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Create a new conversation
  const createConversation = useCallback(async (conversationData) => {
    console.log('=== Starting createConversation ===');
    console.log('Initial loading state:', isLoading);
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Calling createConversationApi with data:', {
        title: conversationData.title || 'New Conversation',
        model: conversationData.model || 'default',
        tags: conversationData.tags || [],
        messages: []
      });
      
      const newConversation = await createConversationApi({
        title: conversationData.title || 'New Conversation',
        model: conversationData.model || 'default',
        tags: conversationData.tags || [],
        messages: []
      });
      
      console.log('Successfully created conversation:', newConversation);
      
      // Update local state optimistically
      console.log('Updating local state...');
      setConversations(prev => {
        console.log('Previous conversations:', prev);
        const updated = [newConversation, ...prev];
        console.log('Updated conversations:', updated);
        return updated;
      });
      
      console.log('Setting current conversation...');
      setCurrentConversation(newConversation);
      setMessages([]);
      
      console.log('=== createConversation completed successfully ===');
      return newConversation;
    } catch (err) {
      console.error('=== ERROR in createConversation ===');
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        status: err.status,
        stack: err.stack
      });
      setError(err.message || 'Failed to create conversation');
      throw err; // Re-throw to allow components to handle the error
    } finally {
      console.log('Cleaning up loading state...');
      setIsLoading(false);
      console.log('Final loading state:', false);
    }
  }, [currentUser]);

  // Update a conversation
  const updateConversation = useCallback(async (conversationId, updates) => {
    try {
      const updatedConversation = await updateConversationApi(conversationId, updates);
      
      // Update in the conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, ...updates } : conv
        )
      );
      
      // Update current conversation if it's the one being updated
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(prev => ({
          ...prev,
          ...updates,
          id: conversationId
        }));
      }
      
      return updatedConversation;
    } catch (err) {
      console.error('Failed to update conversation:', err);
      setError(err.message || 'Failed to update conversation');
      throw err;
    }
  }, [currentConversation, currentUser]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId) => {
    try {
      await deleteConversationApi(conversationId);
      
      // Remove from the conversations list
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // Clear current conversation if it's the one being deleted
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setError(err.message || 'Failed to delete conversation');
      throw err;
    }
  }, [currentConversation, currentUser]);

  // Add a message to the current conversation
  const addMessage = useCallback(async (messageData) => {
    if (!currentConversation) {
      throw new Error('No active conversation');
    }
    
    try {
      const newMessage = await addMessageApi(currentConversation.id, {
        role: messageData.role,
        content: messageData.content,
        model: messageData.model || currentConversation.model
      });
      
      // Optimistically update the UI
      setMessages(prev => [...prev, newMessage]);
      
      // Update the conversation's updatedAt timestamp
      const now = new Date().toISOString();
      setCurrentConversation(prev => ({
        ...prev,
        updatedAt: now
      }));
      
      // Update the conversation in the list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConversation.id 
            ? { ...conv, updatedAt: now }
            : conv
        )
      );
      
      return newMessage;
    } catch (err) {
      console.error('Failed to add message:', err);
      setError(err.message || 'Failed to send message');
      throw err;
    }
  }, [currentConversation, currentUser]);

  // Clean up subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Load conversations when user changes
  useEffect(() => {
    if (currentUser) {
      loadConversations();
    } else {
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [currentUser, loadConversations]);

  return {
    // State
    conversations,
    currentConversation,
    messages,
    isLoading,
    error,
    
    // Actions
    loadConversations,
    loadConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    addMessage,
    
    // Derived state
    hasConversations: conversations.length > 0
  };
};

export default useConversation;
