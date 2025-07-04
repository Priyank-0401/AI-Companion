import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from '../contexts/useTheme';

// Components
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatMessages } from '../components/chat/ChatMessages';
import ChatInput from '../components/chat/ChatInput';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Hooks
import useAuth from '../auth/hooks/useAuth';

// Services
import { auth } from "../config/firebase";
import apiClient from '../services/api';

// API methods
const chatApi = {
  getConversations: () => apiClient.get('chat/conversations'),
  getConversation: (id) => apiClient.get(`chat/conversations/${id}`),
  saveConversation: (conversation) => {
    // Ensure model has the correct format (add :latest if needed for llama3)
    let model = conversation.model || 'llama3:latest';
    if (model === 'llama3' || model.startsWith('llama3:')) {
      model = 'llama3:latest';
    }
    
    const sanitizedConversation = {
      ...conversation,
      model
    };
    return apiClient.post('chat/conversations', sanitizedConversation);
  },
  deleteConversation: (id) => apiClient.delete(`chat/conversations/${id}`),
  sendMessage: (messageData) => {
    const { conversationId, content, message, model = 'llama3:latest', style = 'empathetic' } = messageData;
    
    // Ensure content is a non-empty string
    const messageContent = typeof content === 'string' ? content.trim() : String(content || message || '').trim();
    
    if (!messageContent) {
      throw new Error('Message content cannot be empty');
    }
    
    // Log the request payload for debugging
    console.log('Sending message with data:', {
      content: messageContent,
      conversationId,
      model,
      style
    });
    
    return apiClient.post(`chat/conversations/${conversationId}/messages`, {
      content: messageContent,
      model,
      style,
      stream: false
    });
  }
};

// Format conversation date for display
const formatConversationDate = (dateString) => {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;  
  
  if (date.toLocaleDateString() === new Date().toLocaleDateString()) {
    return 'Today';
  }
  
  if (date.toLocaleDateString() === new Date(new Date().getTime() - 86400000).toLocaleDateString()) {
    return 'Yesterday';
  }
  
  if (date > new Date(new Date().getTime() - 604800000)) {
    return date.toLocaleString('en-US', { weekday: 'long' }); // Day name
  }
  
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const ChatPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser, loading: authLoading, logout } = useAuth();
  const { theme } = useTheme();
  
  // Prevent page scrolling when ChatPage is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  
  // Calculate height to account for navbar (5rem = 80px for h-20)
  const contentHeight = 'calc(100vh - 5rem)';
  
  // Debug auth state
  useEffect(() => {
    if (currentUser) {
      console.log('Current user in ChatPage:', currentUser.uid);
      // Get the current user from Firebase auth to access the token
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        firebaseUser.getIdToken(true).then(token => {
          console.log('Current user token:', token ? 'Token exists' : 'No token');
        }).catch(error => {
          console.error('Error getting user token:', error);
        });
      }
    }
  }, [currentUser]);

  const [activeConversation, setActiveConversation] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNewChat, setIsNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  // Check if mobile view
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      if (!isMobileView) {
        setIsSidebarOpen(true);
      } else if (isMobileView && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // State to track last fetch time and error state
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [fetchError, setFetchError] = useState(null);

  // Main conversations query with improved error handling and request deduplication
  const {
    data: conversations = [],
    isLoading: isLoadingConversations,
    error: conversationsError,
    refetch: refetchConversations,
    isRefetching: isRefreshingConversations,
  } = useQuery({
    queryKey: ['conversations', currentUser?.uid],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes before data is considered stale
    refetchInterval: 30000, // Only refetch every 30 seconds at most
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 2, // Only retry failed requests twice
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    cacheTime: 30 * 60 * 1000, // 30 minutes before cache is garbage collected
    queryFn: async () => {
      try {
        // Wait for auth to initialize
        if (authLoading) return [];
        
        if (!currentUser) {
          console.log('No current user in conversations query');
          return [];
        }
        
        // Get fresh token before making the request
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
          console.log('No Firebase user found');
          return [];
        }
        
        // Only force token refresh if it's about to expire (last 5 minutes)
        const tokenResult = await firebaseUser.getIdTokenResult();
        const tokenExpiration = new Date(tokenResult.expirationTime).getTime();
        const now = Date.now();
        
        if (tokenExpiration - now < 5 * 60 * 1000) { // 5 minutes
          await firebaseUser.getIdToken(true);
        }
        
        const response = await chatApi.getConversations();
        
        // Handle different response formats
        if (Array.isArray(response)) {
          return response;
        } else if (response?.data && Array.isArray(response.data)) {
          return response.data;
        } else if (typeof response === 'object' && response !== null) {
          // Handle case where response is an object with conversation IDs as keys
          return Object.entries(response).map(([id, data]) => ({
            id,
            ...data,
          }));
        }
        
        return [];
      } catch (error) {
        console.error('Error in conversations query:', error);
        
        // Handle rate limiting specifically
        if (error?.response?.status === 429) {
          const retryAfter = error.response?.headers?.['retry-after'] || 30;
          console.warn(`Rate limited. Will retry after ${retryAfter} seconds.`);
          
          // Return cached data if available, or empty array
          return queryClient.getQueryData(['conversations', currentUser?.uid]) || [];
        }
        
        // Re-throw other errors to be handled by React Query's retry mechanism
        throw error;
        
        // Handle authentication errors
        if (error.isAuthError || 
            error?.response?.status === 401 || 
            error?.message?.includes('auth') || 
            error?.message?.includes('Authentication')) {
          try {
            await auth.signOut();
            if (typeof window !== 'undefined') {
              localStorage.removeItem('authToken');
              localStorage.removeItem('authUser');
            }
            window.location.href = '/login';
          } catch (signOutError) {
            console.error('Error during sign out:', signOutError);
            window.location.href = '/login';
          }
          return [];
        }
        
        throw new Error('Failed to load conversations. Please try again later.');
      }
    },
    enabled: !!currentUser,
    onError: (error) => {
      console.error('Conversations query error:', error);
      
      // Handle rate limiting
      if (error?.response?.status === 429) {
        // Already handled in queryFn, just log it
        return;
      }
      
      // Handle auth errors in the onError callback as well
      if (error.isAuthError || 
          error?.response?.status === 401 || 
          error?.message?.includes('auth') ||
          error?.message?.includes('Authentication')) {
        auth.signOut().finally(() => {
          window.location.href = '/login';
        });
      }
    },
  });
  
  // Safe refetch function with cooldown and error handling
  const safeRefetch = useCallback(async () => {
    const now = Date.now();
    // Don't refetch if we just fetched recently or already fetching
    if (now - lastFetchTime < 5000 || isRefreshingConversations || !refetchConversations) {
      return;
    }

    try {
      setLastFetchTime(now);
      await refetchConversations();
      setFetchError(null);
    } catch (error) {
      console.error('Error refetching conversations:', error);
      setFetchError(error);
      // Don't retry immediately on error
      setLastFetchTime(now + 10000); // Wait 10 seconds before allowing another retry
    }
  }, [refetchConversations, lastFetchTime, isRefreshingConversations]);

  // Set up a polling interval for conversations
  useEffect(() => {
    if (!currentUser) return;
    
    // Initial fetch
    safeRefetch();
    
    // Set up interval for polling
    const intervalId = setInterval(() => {
      safeRefetch();
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [currentUser, safeRefetch]);

  // Only refetch when window gains focus if data is stale
  useQuery({
    queryKey: ['conversations', 'refetchOnFocus'],
    queryFn: () => {
      if (document.visibilityState === 'visible') {
        safeRefetch();
      }
      return null;
    },
    enabled: !!currentUser,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Fetch active conversation
  const {
    data: activeConversationData,
    isLoading: isLoadingActiveConversation,
    error: activeConversationError,
  } = useQuery({
    queryKey: ['conversation', activeConversation],
    queryFn: async () => {
      console.log('Fetching active conversation:', activeConversation);
      if (!activeConversation) {
        console.log('No active conversation ID, returning null');
        return null;
      }
      try {
        const data = await chatApi.getConversation(activeConversation);
        console.log('Fetched conversation data:', data);
        return data?.data || null;
      } catch (error) {
        console.error('Error fetching conversation:', error);
        throw error;
      }
    },
    enabled: !!activeConversation && !isNewChat,
    onSuccess: (data) => {
      console.log('Active conversation loaded:', data);
    },
    onError: (error) => {
      console.error('Error loading active conversation:', error);
    }
  });

  // Create new conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (firstMessage) => {
      try {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
          throw new Error('No authenticated user');
        }
        
        // Generate a title from the first message
        const title = firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : '');
        const now = new Date().toISOString();
        
        // Get the current conversation's style and model from activeConversationData or use defaults
        const currentStyle = activeConversationData?.style || 'empathetic';
        const currentModel = activeConversationData?.model || 'llama3';
        
        // Prepare the conversation data with conversation settings or defaults
        const newConversationData = {
          title: title,
          model: currentModel,
          style: currentStyle,
          lastMessage: firstMessage,
          createdAt: now,
          updatedAt: now,
          messages: [{
            id: `temp-${Date.now()}`,
            content: firstMessage,
            role: 'user',
            timestamp: now
          }]
        };
        
        console.log('Creating conversation with data:', newConversationData);
        
        // Save to backend
        const response = await chatApi.saveConversation(newConversationData);
        
        // Handle different response formats
        const conversationData = response?.data || response;
        
        // Check if we have valid conversation data
        if (!conversationData?.id) {
          const errorMsg = response?.message || 'Failed to create conversation: Invalid response format';
          console.error('Error creating conversation:', errorMsg, response);
          throw new Error(errorMsg);
        }
        
        console.log('Successfully created conversation:', conversationData.id);
        return conversationData;
        
      } catch (error) {
        console.error('Error in createConversation:', error);
        if (error.response?.status === 400 && error.response.data?.errors) {
          const validationErrors = error.response.data.errors
            .map(err => `${err.param}: ${err.msg}`)
            .join('\n');
          throw new Error(`Validation error: ${validationErrors}`);
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      if (!data?.id) {
        console.error('Invalid conversation data received:', data);
        throw new Error('Invalid conversation data received from server');
      }
      
      // Update the conversations list
      queryClient.setQueryData(['conversations', currentUser?.uid], (old) => {
        // Remove any temporary conversations
        const existing = Array.isArray(old) ? old.filter(c => !c.id.startsWith('temp-')) : [];
        return [data, ...existing];
      });
      
      // Close sidebar on mobile
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    },
    onError: (error) => {
      console.error('Error in create conversation mutation:', error);
      toast.error(`Failed to create new conversation: ${error.message}`);
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, conversationId }) => {
      console.log('sendMessage mutation called with:', { content, conversationId, contentType: typeof content });
      
      if (!conversationId) {
        throw new Error('No conversation ID provided for message');
      }
      
      // Ensure content is a non-empty string after trimming
      const messageContent = typeof content === 'string' ? content.trim() : String(content).trim();
      if (!messageContent) {
        throw new Error('Message content cannot be empty');
      }

      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }

      // Get a fresh token
      const token = await firebaseUser.getIdToken(true);
      
      try {
        console.log('Sending message with content:', { content, type: typeof content });
        
        // Ensure content is a string
        const messageContent = typeof content === 'string' ? content : String(content);
        
        // Send the message to the backend
        const response = await chatApi.sendMessage({
          content: messageContent,
          conversationId,
          stream: false
        });

        if (!response?.success) {
          throw new Error('Failed to send message');
        }

        // Get the updated conversation with the AI response
        const updatedConversation = await chatApi.getConversation(conversationId);
        
        if (!updatedConversation) {
          throw new Error('Failed to get updated conversation');
        }

        // Update the local cache with the server response
        queryClient.setQueryData(['conversation', conversationId], updatedConversation);
        
        // Update the conversations list to show the latest message
        queryClient.setQueryData(['conversations', firebaseUser.uid], (old) => {
          if (!old) return [updatedConversation];
          
          const index = old.findIndex(c => c.id === conversationId);
          if (index >= 0) {
            const newConversations = [...old];
            newConversations[index] = updatedConversation;
            return newConversations;
          }
          return [updatedConversation, ...old];
        });

        return updatedConversation;
      } catch (error) {
        console.error('Error in sendMessage mutation:', error);
        throw error;
      }
    },
    onMutate: async ({ content, conversationId }) => {
      if (!conversationId) return;
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(['conversation', conversationId]);
      
      // Snapshot the previous value
      const previousConversation = queryClient.getQueryData(['conversation', conversationId]) || {
        id: conversationId,
        messages: [],
        title: 'New Chat',
        lastMessage: content,
        updatedAt: new Date().toISOString()
      };
      
      // Optimistically update the UI
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
        isOptimistic: true
      };
      
      const updatedConversation = {
        ...previousConversation,
        lastMessage: content,
        updatedAt: new Date().toISOString(),
        messages: [...(previousConversation.messages || []), optimisticMessage],
      };
      
      queryClient.setQueryData(['conversation', conversationId], updatedConversation);
      
      // Update the conversations list to show the latest message
      queryClient.setQueryData(['conversations', currentUser?.uid], (old) => {
        if (!old) return [updatedConversation];
        
        const index = old.findIndex(c => c.id === conversationId);
        if (index >= 0) {
          const newConversations = [...old];
          newConversations[index] = updatedConversation;
          return newConversations;
        }
        return [updatedConversation, ...old];
      });
      
      return { previousConversation };
    },
    onError: (error, variables, context) => {
      console.error('Error sending message:', error);
      
      // Revert to the previous state on error
      if (context?.previousConversation && variables.conversationId) {
        queryClient.setQueryData(
          ['conversation', variables.conversationId],
          context.previousConversation
        );
        
        // Also revert the conversations list
        queryClient.setQueryData(['conversations', currentUser?.uid], (old) => {
          if (!old) return [context.previousConversation];
          
          const index = old.findIndex(c => c.id === variables.conversationId);
          if (index >= 0) {
            const newConversations = [...old];
            newConversations[index] = context.previousConversation;
            return newConversations;
          }
          return old;
        });
      }
      
      // Show error to user
      alert(`Failed to send message: ${error.message}`);
    },
  });

  // Handle new chat
  const handleNewChat = async () => {
    try {
      // Show loading state
      const loadingToast = toast.loading('Creating new conversation...');
      
      try {
        // Reset any existing conversation state after showing loading
        setActiveConversation(null);
        setIsNewChat(true);
        
        // Create a new conversation with a default title
        const newConversation = await createConversationMutation.mutateAsync('New Chat');
        
        if (!newConversation?.id) {
          throw new Error('Failed to create conversation: Invalid response from server');
        }
        
        // The onSuccess handler of the mutation will update the UI
        // with the new conversation and set it as active
        
        // Dismiss loading toast
        toast.success('New conversation created', { id: loadingToast });
        
        // Focus the message input after a short delay to ensure it's rendered
        setTimeout(() => {
          const messageInput = document.querySelector('textarea[placeholder="Type a message..."]');
          if (messageInput) {
            messageInput.focus();
          }
        }, 300);
        
        // Close sidebar on mobile
        if (isMobile) {
          setIsSidebarOpen(false);
        }
        
        return newConversation;
      } catch (error) {
        console.error('Error in handleNewChat:', error);
        toast.error(error.message || 'Failed to create conversation', { id: loadingToast });
        throw error;
      }
    } catch (error) {
      console.error('Error in handleNewChat:', error);
      // Error details are already shown by the toast in the inner try-catch
    }
  };

  // Handle send message - removed duplicate implementation
  // The main implementation is now using useCallback above

  // Handle conversation selection
  const handleSelectConversation = (conversationId) => {
    if (!conversationId) return;
    
    console.log('Selecting conversation:', conversationId);
    
    // Reset any existing optimistic updates or errors
    queryClient.cancelQueries(['conversation', activeConversation]);
    
    // Set the new active conversation
    setActiveConversation(conversationId);
    setIsNewChat(false);
    
    // Prefetch the conversation data
    queryClient.prefetchQuery({
      queryKey: ['conversation', conversationId],
      queryFn: async () => {
        const data = await chatApi.getConversation(conversationId);
        return data?.data || null;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
    
    // Close sidebar on mobile
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // Handle delete conversation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId) => {
      console.log('Starting delete mutation for:', conversationId);
      try {
        const response = await chatApi.deleteConversation(conversationId);
        
        // Handle different response formats
        const isSuccess = response?.success || response?.data?.success || response === true;
        
        if (!isSuccess) {
          const errorMessage = response?.message || 'Failed to delete conversation';
          console.error('Delete failed:', errorMessage);
          throw new Error(errorMessage);
        }
        
        return conversationId;
      } catch (error) {
        console.error('Error in delete mutation:', error);
        throw error;
      }
    },
    onMutate: async (conversationId) => {
      console.log('Optimistic update for conversation:', conversationId);
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(['conversations']);
      
      // Snapshot the previous value
      const previousConversations = queryClient.getQueryData(['conversations', currentUser?.uid]) || [];
      
      // Optimistically update the UI
      queryClient.setQueryData(['conversations', currentUser?.uid], (old = []) => {
        if (!Array.isArray(old)) {
          console.warn('Unexpected conversations data format:', old);
          return [];
        }
        const newData = old.filter(conv => conv && conv.id !== conversationId);
        console.log('Updated conversations after deletion:', newData);
        return newData;
      });
      
      if (activeConversation === conversationId) {
        console.log('Active conversation deleted, resetting state');
        setActiveConversation(null);
        setIsNewChat(false);
      }
      
      return { previousConversations };
    },
    onError: (error, conversationId, context) => {
      console.error('Error in delete mutation:', error);
      // Rollback on error
      if (context?.previousConversations) {
        console.log('Reverting to previous conversations due to error');
        queryClient.setQueryData(['conversations', currentUser?.uid], context.previousConversations);
      }
      
      // Show error to user
      toast.error(`Failed to delete conversation: ${error.message}`);
    },
    onSuccess: (conversationId) => {
      console.log('Successfully deleted conversation:', conversationId);
      toast.success('Conversation deleted successfully');
    },
    onSettled: () => {
      console.log('Delete mutation settled, invalidating queries');
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries(['conversations', currentUser?.uid]);
    }
  });
  
  const handleDeleteConversation = (conversationId) => {
    if (!conversationId) {
      console.error('No conversation ID provided for deletion');
      return;
    }
    setConversationToDelete(conversationId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!conversationToDelete) return;
    
    try {
      console.log('Initiating delete for conversation:', conversationToDelete);
      await deleteConversationMutation.mutateAsync(conversationToDelete);
      setShowDeleteDialog(false);
      setConversationToDelete(null);
    } catch (error) {
      console.error('Error in handleDeleteConversation:', error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setConversationToDelete(null);
  };

  // Handle sending a message
  const handleSendMessage = useCallback(async (content) => {
    // Ensure content is a string and trim whitespace
    const messageContent = typeof content === 'string' ? content.trim() : String(content).trim();
    
    if (!messageContent) {
      console.log('Empty message after trimming, not sending');
      toast.error('Message cannot be empty');
      return;
    }

    console.log('handleSendMessage called with content:', { 
      originalContent: content,
      messageContent,
      type: typeof content,
      trimmedLength: messageContent.length 
    });

    if (!activeConversation) {
      console.log('No active conversation, creating a new one');
      try {
        // Get the current style and model from activeConversationData or use defaults
        const currentStyle = activeConversationData?.style || 'empathetic';
        const currentModel = activeConversationData?.model || 'llama3';
        
        console.log('Creating new conversation with settings:', {
          currentStyle,
          currentModel,
          hasActiveConversationData: !!activeConversationData,
          content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
        });
        
        const newConversation = await createConversationMutation.mutateAsync({
          title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
          lastMessage: content,
          model: currentModel,
          style: currentStyle,
          messages: [{
            content: content,
            role: 'user',
            timestamp: new Date().toISOString()
          }]
        });
        
        console.log('New conversation created:', {
          id: newConversation?.id,
          title: newConversation?.title,
          style: newConversation?.style,
          model: newConversation?.model
        });
        
        if (newConversation?.id) {
          console.log('Setting active conversation to:', newConversation.id);
          setActiveConversation(newConversation.id);
          
          // Now send the first message to the new conversation
          console.log('Sending first message to new conversation:', {
            conversationId: newConversation.id,
            model: currentModel,
            style: currentStyle,
            content: content
          });
          
          await sendMessageMutation.mutateAsync({
            content: content,
            conversationId: newConversation.id,
            model: currentModel,
            style: currentStyle
          });
        }
      } catch (error) {
        console.error('Error creating new conversation:', error);
        toast.error('Failed to start new conversation');
      }
    } else {
      // Existing conversation, send message with current conversation settings
      console.log('Sending message to existing conversation:', {
        conversationId: activeConversation,
        hasActiveConversationData: !!activeConversationData,
        content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
      });
      
      try {
        // Get the current conversation's style and model from activeConversationData
        const currentStyle = activeConversationData?.style || 'empathetic';
        const currentModel = activeConversationData?.model || 'llama3';
        
        console.log('Sending message with settings:', {
          style: currentStyle,
          model: currentModel,
          conversationId: activeConversation,
          activeConversationData: {
            id: activeConversationData?.id,
            style: activeConversationData?.style,
            model: activeConversationData?.model,
            title: activeConversationData?.title
          }
        });
        
        const messageData = {
          content: content,
          conversationId: activeConversation,
          model: currentModel,
          style: currentStyle
        };
        
        console.log('Sending message with data:', {
          ...messageData,
          content: messageData.content.substring(0, 30) + (messageData.content.length > 30 ? '...' : '')
        });
        
        await sendMessageMutation.mutateAsync(messageData);
      } catch (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
      }
    }
  }, [
    activeConversation, 
    createConversationMutation, 
    sendMessageMutation, 
    activeConversationData?.style, 
    activeConversationData?.model
  ]);

  // Get messages for the active conversation
  const messages = activeConversationData?.messages || [];
  const isLoading = isLoadingActiveConversation || sendMessageMutation.isLoading;

  // If we're loading conversations, show a loading spinner
  if (isLoadingConversations) {
    return (
      <div className="fixed top-20 left-0 right-0 bottom-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-100/50 to-transparent dark:from-indigo-900/20 dark:to-transparent opacity-50"></div>
        <LoadingSpinner />
      </div>
    );
  }

  // If there was an error loading conversations, show an error message
  if (conversationsError) {
    return (
      <div className="fixed top-20 left-0 right-0 bottom-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-100/50 to-transparent dark:from-indigo-900/20 dark:to-transparent opacity-50"></div>
        <div className="max-w-md w-full bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl p-8 text-center border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Failed to Load Conversations
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {conversationsError.message || 'An error occurred while loading your conversations.'}
          </p>
          <button
            onClick={() => refetchConversations()}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoadingConversations}
          >
            {isLoadingConversations ? 'Loading...' : 'Try Again'}
          </button>
          {conversationsError?.message && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              If the problem persists, please check your connection and try again later.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-20 w-72 flex flex-col border-r border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-transform duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
          <ChatSidebar
            isOpen={isSidebarOpen}
            conversations={conversations}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNewChat={handleNewChat}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            selectedConversation={activeConversation}
          />
        </div>

        {/* Mobile sidebar backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-10 bg-black/50 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Mobile header */}
          <div className="md:hidden p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <h1 className="ml-4 text-lg font-semibold text-gray-900 dark:text-white">
              {activeConversationData?.title || 'New Chat'}
            </h1>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white dark:bg-gray-900">
            {isLoadingActiveConversation ? (
              <div className="h-full flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : activeConversationError ? (
              <ErrorMessage message="Failed to load conversation" />
            ) : (
              <ChatMessages 
                messages={messages} 
                isLoading={sendMessageMutation.isLoading} 
              />
            )}
          </div>
          
          {/* Input Area */}
          <div className="bg-white dark:bg-gray-900 p-4 pb-16">
            <div className="max-w-3xl mx-auto w-full">
              <ChatInput 
                onSendMessage={handleSendMessage} 
                isSending={sendMessageMutation.isLoading} 
              />
              <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                Press Shift+Enter for new line. Press Enter to send.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDeleting={deleteConversationMutation.isLoading}
      />
    </ErrorBoundary>
  );
};

export default ChatPage;
