import { useState, useEffect, useCallback } from 'react';
import { conversationService, messageService } from '../services/firestoreService';
import { useAuth } from '../auth/context/AuthContext';

export const useFirestoreConversations = () => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState({
    conversations: true,
    messages: true,
    sending: false
  });
  const [error, setError] = useState(null);

  // Load conversations
  const loadConversations = useCallback(() => {
    if (!currentUser) return;
    
    setLoading(prev => ({ ...prev, conversations: true }));
    setError(null);
    
    try {
      // Set up real-time listener for conversations
      const unsubscribe = conversationService.subscribeToConversations((updatedConversations) => {
        setConversations(updatedConversations);
        setLoading(prev => ({ ...prev, conversations: false }));
      });
      
      // Return cleanup function
      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
      setLoading(prev => ({ ...prev, conversations: false }));
      
      // Return a no-op function if there's an error
      return () => {};
    }
  }, [currentUser]);

  // Load messages for current conversation

  // Create a new conversation
  const createConversation = async (title = 'New Chat', model = 'gpt-3.5-turbo') => {
    setLoading(prev => ({ ...prev, sending: true }));
    setError(null);
    
    try {
      const newConversation = await conversationService.createConversation(title, model);
      setCurrentConversation(newConversation);
      setMessages([]);
      return newConversation;
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
      throw err;
    } finally {
      setLoading(prev => ({ ...prev, sending: false }));
    }
  };

  // Send a message
  const sendMessage = async (content, role = 'user', model = 'gpt-3.5-turbo') => {
    if (!currentConversation?.id) {
      throw new Error('No active conversation');
    }
    
    setLoading(prev => ({ ...prev, sending: true }));
    setError(null);
    
    try {
      const newMessage = await messageService.addMessage(
        currentConversation.id,
        { role, content, model }
      );
      
      // If this is the first message, update the conversation title
      if (messages.length === 0 && role === 'user') {
        const title = content.length > 30 ? `${content.substring(0, 30)}...` : content;
        await conversationService.updateConversation(currentConversation.id, { title });
      }
      
      return newMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      throw err;
    } finally {
      setLoading(prev => ({ ...prev, sending: false }));
    }
  };

  // Set current conversation and load its messages
  const setActiveConversation = useCallback(async (conversationId) => {
    if (!conversationId) {
      setCurrentConversation(null);
      setMessages([]);
      return;
    }
    
    try {
      const conversation = await conversationService.getConversation(conversationId);
      setCurrentConversation(conversation);
      return conversation;
    } catch (err) {
      console.error('Error setting active conversation:', err);
      setError('Failed to load conversation');
      throw err;
    }
  }, []);

  // Initialize
  useEffect(() => {
    const cleanup = loadConversations();
    
    // Cleanup function that will be called when the component unmounts
    // or when the dependencies change
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [loadConversations]);
  
  // Load messages for the current conversation
  const loadMessages = useCallback((conversationId) => {
    setLoading(prev => ({ ...prev, messages: true }));
    setError(null);
    
    try {
      const unsubscribe = messageService.subscribeToMessages(conversationId, (messages) => {
        setMessages(messages);
        setLoading(prev => ({ ...prev, messages: false }));
      });
      
      return unsubscribe;
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
      setLoading(prev => ({ ...prev, messages: false }));
      return () => {}; // Return empty cleanup function
    }
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (!currentConversation?.id) {
      setMessages([]);
      return;
    }
    
    const unsubscribe = loadMessages(currentConversation.id);
    
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentConversation?.id, loadMessages]);

  return {
    conversations,
    currentConversation,
    messages,
    setMessages, // Expose setMessages to allow optimistic updates
    loading,
    error,
    createConversation,
    sendMessage,
    setActiveConversation,
    updateConversation: conversationService.updateConversation,
    deleteConversation: conversationService.deleteConversation
  };
};
