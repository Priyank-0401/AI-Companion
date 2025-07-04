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
  getConversations: () => apiClient.get('conversations'),
  getConversation: (id) => apiClient.get(`conversations/${id}`),
  saveConversation: (conversation) => apiClient.post('conversations', conversation),
  deleteConversation: (id) => apiClient.delete(`conversations/${id}`),
  sendMessage: (messageData) => apiClient.post('chat', messageData)
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
      if (!activeConversation) return null;
      const data = await chatApi.getConversation(activeConversation);
      return data?.data || null;
    },
    enabled: !!activeConversation && !isNewChat,
  });

  // Create new conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (title = 'New Chat') => {
      try {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
          throw new Error('No authenticated user');
        }
        
        // Get a fresh token
        const token = await firebaseUser.getIdToken(true);
        
        // Prepare the conversation data according to the backend model
        const newConversationData = {
          title: title,
          model: 'llama3:latest',
          style: 'supportive',
          // Don't include userId here, it will be added by the backend from the auth token
        };
        
        console.log('Creating conversation with data:', newConversationData);
        
        // Save to backend
        const response = await chatApi.saveConversation(newConversationData);
        
        // Log the full response for debugging
        console.log('Create conversation response:', response);
        
        // Handle different response formats
        let conversationData = response;
        
        // If the response has a data property, use that
        if (response && typeof response === 'object' && 'data' in response) {
          conversationData = response.data;
        }
        
        // Check if we have valid conversation data
        if (!conversationData || !conversationData.id) {
          const errorMsg = response?.message || 'Failed to create conversation: Invalid response format';
          console.error('Error creating conversation:', errorMsg, response);
          throw new Error(errorMsg);
        }
        
        // Return the created conversation with required fields
        return {
          id: conversationData.id,
          title: conversationData.title || title,
          model: conversationData.model || 'llama3:latest',
          style: conversationData.style || 'supportive',
          userId: firebaseUser.uid,
          createdAt: conversationData.createdAt || new Date().toISOString(),
          updatedAt: conversationData.updatedAt || new Date().toISOString(),
          lastMessage: conversationData.lastMessage || '',
          messages: conversationData.messages || []
        };
      } catch (error) {
        console.error('Error creating conversation:', error);
        // Add more detailed error information
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
          
          // Handle validation errors specifically
          if (error.response.status === 400 && error.response.data?.errors) {
            const validationErrors = error.response.data.errors
              .map(err => `${err.param}: ${err.msg}`)
              .join('\n');
            throw new Error(`Validation error: ${validationErrors}`);
          }
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Error setting up request:', error.message);
        }
        
        throw error;
      }
    },
    onSuccess: (data) => {
      if (!data?.id) {
        console.error('No conversation ID in create success');
        return;
      }
      
      console.log('Successfully created conversation:', data.id);
      
      // Update the active conversation
      setActiveConversation(data.id);
      setIsNewChat(true);
      
      // Update the conversations list
      queryClient.setQueryData(['conversations', currentUser?.uid], (old) => {
        return [data, ...(old || [])];
      });
      
      // Close sidebar on mobile
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    },
    onError: (error) => {
      console.error('Error in create conversation mutation:', error);
      alert(`Failed to create new conversation: ${error.message}`);
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, conversationId }) => {
      if (!conversationId) {
        throw new Error('No conversation ID provided for message');
      }

      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }

      // Get a fresh token
      const token = await firebaseUser.getIdToken(true);
      
      // Create the message object
      const message = {
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
      };

      try {
        // Send the message to the backend
        const response = await chatApi.sendMessage({
          conversationId,
          message: content,
          userId: firebaseUser.uid,
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
      // Reset any existing conversation state
      setActiveConversation(null);
      setIsNewChat(true);
      
      // Show loading state
      const loadingToast = toast.loading('Creating new conversation...');
      
      try {
        // Create a new conversation with a default title
        const newConversation = await createConversationMutation.mutateAsync('New Chat');
        
        if (!newConversation?.id) {
          throw new Error('Failed to create conversation: Invalid response from server');
        }
        
        // Update the active conversation with the new ID
        setActiveConversation(newConversation.id);
        setIsNewChat(false);
        
        // Update the conversations list
        queryClient.setQueryData(['conversations', currentUser?.uid], (old) => {
          return [newConversation, ...(old || [])];
        });
        
        // Show success message
        toast.success('New conversation created!', { id: loadingToast });
        
        // Focus the message input after a short delay to ensure it's mounted
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

  // Handle send message
  const handleSendMessage = async (content) => {
    if (!content.trim()) return;
    
    try {
      if (isNewChat) {
        // If this is a new chat, first create the conversation
        const newConversation = await createConversationMutation.mutateAsync(content);
        
        if (newConversation?.id) {
          // Then send the first message
          await sendMessageMutation.mutateAsync({ 
            content,
            conversationId: newConversation.id 
          });
        }
      } else if (activeConversation) {
        // If this is an existing conversation, just send the message
        await sendMessageMutation.mutateAsync({ 
          content,
          conversationId: activeConversation 
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Error handling is done in the mutations' onError
    }
  };

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
      <div className="fixed top-0 left-0 right-0 bottom-0 flex w-full h-screen overflow-hidden bg-white dark:bg-gray-900">
        {/* Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <div className="h-full flex-shrink-0">
              <div className="h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <ChatSidebar
                  isOpen={isSidebarOpen}
                  conversations={conversations}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onNewChat={handleNewChat}
                  onSelectConversation={handleSelectConversation}
                  onDeleteConversation={handleDeleteConversation}
                />
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
          {/* Messages Area */}
          <div className="flex-1 overflow-hidden relative">
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
          <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isSending={sendMessageMutation.isLoading} 
            />
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
