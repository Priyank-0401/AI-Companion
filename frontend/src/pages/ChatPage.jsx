import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { generateChatTitle, getTitleFromFirstMessage } from '../utils/titleGenerator';
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
import api from '../services/api';

// API methods
const chatApi = {
  getConversations: (params) => api.getConversations(params),
  getConversation: (id) => api.getConversation(id),
  saveConversation: (conversation) => {
    // Ensure model has the correct format (add :latest if needed for llama3)
    let model = conversation.model || 'llama3-8b-8192';
    if (model === 'llama3' || model.startsWith('llama3:')) {
      model = 'llama3-8b-8192';
    }
    
    const sanitizedConversation = {
      ...conversation,
      model
    };
    
    if (conversation.id) {
      return api.updateConversation(conversation.id, sanitizedConversation);
    } else {
      return api.createConversation(sanitizedConversation);
    }
  },
  deleteConversation: (id) => api.deleteConversation(id),
  sendMessage: (messageData) => {
    // Add null/undefined check for messageData
    if (!messageData) {
      console.error('Message data is required');
      throw new Error('Message data is required');
    }

    // Add type check for messageData
    if (typeof messageData !== 'object') {
      console.error('Message data must be an object', { type: typeof messageData, value: messageData });
      throw new Error('Message data must be an object');
    }

    // Destructure with defaults after validation
    const { 
      conversationId, 
      content, 
      message, 
      model = 'llama3-8b-8192', 
      style = 'empathetic' 
    } = messageData;
    
    // Validate required fields
    if (!conversationId) {
      console.error('conversationId is required');
      throw new Error('conversationId is required');
    }
    
    // Ensure content is a non-empty string
    const messageContent = typeof content === 'string' ? content.trim() : String(content || message || '').trim();
    
    if (!messageContent) {
      console.error('Message content cannot be empty');
      throw new Error('Message content cannot be empty');
    }
    
    // Log the request payload for debugging
    console.log('Sending message with data:', {
      content: messageContent.length > 50 ? 
        `${messageContent.substring(0, 50)}...` : 
        messageContent,
      conversationId,
      model,
      style
    });
    
    return api.sendMessage({
      conversationId,
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

// Debug helper function
const debugLog = (message, data = {}) => {
  const timestamp = new Date().toISOString();
};

const ChatPage = () => {  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser, loading: authLoading, logout } = useAuth();
  const { theme } = useTheme();
  
  // Define valid styles for safety check
  const validStyles = ['empathetic', 'coach', 'playful', 'mindful'];
  const defaultStyle = 'empathetic';
  
  // State declarations
  const [conversationStyle, setConversationStyle] = useState(defaultStyle);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isNewChat, setIsNewChat] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Debug effect for tracking component mounts/unmounts
  useEffect(() => {
    debugLog('ChatPage mounted');
    return () => {
      debugLog('ChatPage unmounting');
    };
  }, []);
  
  // Debug effect for tracking auth state
  useEffect(() => {
    debugLog('Auth state changed', { 
      isAuthenticated: !!currentUser,
      userId: currentUser?.uid || 'no user'
    });
  }, [currentUser]);
  
  // Debug effect for tracking active conversation changes
  useEffect(() => {
    debugLog('Active conversation changed', { 
      activeConversationId: activeConversation,
      hasStyle: activeConversation && activeConversation.style ? true : 'no style property',
      style: activeConversation?.style || 'no style'
    });
    
    // Safely update conversation style when active conversation changes
    if (activeConversation?.style) {
      setSafeConversationStyle(activeConversation.style);
    } else {
      setSafeConversationStyle(defaultStyle);
    }
  }, [activeConversation]);
  
  // Debug effect for tracking style changes
  useEffect(() => {
    debugLog('Conversation style state changed', { conversationStyle });
  }, [conversationStyle]);
  
  // Safe setter for conversation style with validation and debug logging
  const setSafeConversationStyle = (style) => {
    try {
      debugLog('setSafeConversationStyle called', { 
        inputStyle: style,
        isValidStyle: style && validStyles.includes(style),
        validStyles
      });
      
      // If style is valid, use it; otherwise fall back to default
      const newStyle = (style && validStyles.includes(style)) ? style : defaultStyle;
      
      debugLog('Setting conversation style', { 
        oldStyle: conversationStyle,
        newStyle,
        styleChanged: newStyle !== conversationStyle
      });
      
      // Only update if the style has actually changed
      if (newStyle !== conversationStyle) {
        setConversationStyle(newStyle);
      }
      
      return newStyle;
    } catch (error) {
      console.error('Error in setSafeConversationStyle:', error);
      // Ensure we always have a valid style even if there's an error
      setConversationStyle(defaultStyle);
      return defaultStyle;
    }
  };
  
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
      // Always ensure we have a valid style
      const defaultStyle = 'empathetic';
      const newStyle = data?.style || defaultStyle;
      
      // Only update if different to prevent unnecessary re-renders
      if (newStyle !== conversationStyle) {
        console.log('Setting conversation style to:', newStyle);
        setConversationStyle(newStyle);
      }
    },
    onError: (error) => {
      console.error('Error loading active conversation:', error);
    }
  });

  // Create new conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (conversationData = {}) => {
      try {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
          throw new Error('No authenticated user');
        }
        
        // Default title for new conversations
        let title = conversationData.title || 'New Chat';
        
        // If there are messages, use the first one to generate a title
        if (conversationData.messages?.length > 0 && conversationData.messages[0]?.content) {
          const firstMessage = conversationData.messages[0].content;
          title = firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : '');
        }
        
        const now = new Date().toISOString();
        
        // Use provided values or fall back to defaults
        const currentStyle = conversationData.style || conversationStyle;
        const currentModel = conversationData.model || 'llama3-8b';
        
        // Generate title from first message if available
        const firstMessage = conversationData.messages?.[0]?.content || '';
        const conversationTitle = firstMessage 
          ? getTitleFromFirstMessage(firstMessage)
          : 'New Chat';
          
        // Prepare the conversation data with conversation settings or defaults
        const newConversationData = {
          title: conversationTitle,
          model: currentModel,
          style: currentStyle,
          lastMessage: firstMessage,
          createdAt: now,
          updatedAt: now,
          messages: conversationData.messages || [],
          isNew: false // Mark as not new since we're creating it with messages
        };
        
        console.log('Creating conversation with data:', newConversationData);
        
        // Save to backend
        const response = await chatApi.saveConversation(newConversationData);
        
        // Handle different response formats
        const responseData = response?.data || response;
        
        // Check if we have valid conversation data
        if (!responseData?.id) {
          const errorMsg = response?.message || 'Failed to create conversation: Invalid response format';
          console.error('Error creating conversation:', errorMsg, response);
          throw new Error(errorMsg);
        }
        
        console.log('Successfully created conversation:', responseData.id);
        return responseData;
        
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

  // Send message mutation with optimized updates
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, conversationId, model = 'llama3-8b-8192', style = 'empathetic' }) => {
      // Input validation
      if (!conversationId) {
        throw new Error('No conversation ID provided for message');
      }
      
      // Ensure content is a non-empty string after trimming
      const messageContent = typeof content === 'string' ? content.trim() : String(content).trim();
      if (!messageContent) {
        throw new Error('Message content cannot be empty');
      }

      // Verify user is authenticated
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }

      // Get current timestamp for optimistic updates
      const now = new Date().toISOString();
      
      // Generate temporary IDs for optimistic updates
      const tempMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const tempAIMessageId = `temp-ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate title if this is the first message in a new conversation
      const isFirstMessage = activeConversationData?.isNew || 
                           (!activeConversationData?.messages?.length);
      
      let title = activeConversationData?.title || 'New Chat';
      if (isFirstMessage) {
        title = getTitleFromFirstMessage(messageContent);
      }

      // Create optimistic updates
      const optimisticUserMessage = {
        id: tempMessageId,
        content: messageContent,
        role: 'user',
        timestamp: now,
        status: 'sending',
        isOptimistic: true
      };

      const optimisticAIMessage = {
        id: tempAIMessageId,
        content: '...',
        role: 'assistant',
        timestamp: now,
        status: 'sending',
        isOptimistic: true
      };
      
      // Get current conversation data
      const previousData = queryClient.getQueryData(['conversation', conversationId]) || {
        id: conversationId,
        messages: [],
        title: 'New Chat',
        model,
        style,
        createdAt: now,
        updatedAt: now
      };
      
      // Create optimistic update
      const optimisticUpdate = {
        ...previousData,
        title: title, // Use generated title
        lastMessage: messageContent,
        updatedAt: now,
        messages: [
          ...(previousData.messages || []),
          optimisticUserMessage,
          optimisticAIMessage
        ],
        isNew: false // Clear the new flag after first message
      };
      
      // Update both queries at once to minimize re-renders
      queryClient.setQueriesData(
        [['conversation', conversationId], ['conversations', firebaseUser.uid]],
        (old) => {
          if (Array.isArray(old)) {
            // Update conversations list
            const index = old.findIndex(c => c.id === conversationId);
            if (index >= 0) {
              const updated = [...old];
              updated[index] = {
                ...updated[index],
                lastMessage: messageContent,
                updatedAt: now,
                model,
                style
              };
              return updated;
            }
            return [{
              ...optimisticUpdate,
              title: messageContent.substring(0, 30) + (messageContent.length > 30 ? '...' : '')
            }, ...old];
          }
          // Update single conversation
          return optimisticUpdate;
        }
      );
      
      try {
        // Send the message to the backend
        const response = await Promise.race([
          chatApi.sendMessage({
            content: messageContent,
            conversationId,
            model,
            style,
            stream: false
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timed out')), 60000)
          )
        ]);

        if (!response?.success) {
          throw new Error(response?.message || 'Failed to get a valid response');
        }

        // Invalidate queries to refetch fresh data
        await Promise.all([
          queryClient.invalidateQueries(['conversation', conversationId]),
          queryClient.invalidateQueries(['conversations', firebaseUser.uid])
        ]);

        return response.data;
        
      } catch (error) {
        console.error('Error sending message:', error);
        
        // Revert optimistic updates on error
        queryClient.setQueriesData(
          [['conversation', conversationId], ['conversations', firebaseUser.uid]],
          (old) => {
            if (Array.isArray(old)) {
              // Revert conversations list
              return old.map(conv => 
                conv.id === conversationId 
                  ? { ...conv, updatedAt: previousData.updatedAt, lastMessage: previousData.lastMessage }
                  : conv
              );
            }
            // Revert single conversation
            return {
              ...(old || {}),
              messages: (old?.messages || []).filter(m => 
                m.id !== tempMessageId && m.id !== tempAIMessageId
              )
            };
          }
        );
        
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
      
      // Return context with previous conversation data
      return { previousConversation };
    },
    onError: (error, variables, context) => {
      console.error('Message send error:', error);
      
      // If we have previous data, revert to it
      if (context?.previousConversation) {
        queryClient.setQueryData(
          ['conversation', variables.conversationId],
          context.previousConversation
        );
      }
      
      // Show user-friendly error message
      let errorMessage = 'Failed to send message';
      if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        errorMessage = 'Request timed out. The server might be busy.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
    onSettled: (data, error, variables) => {
      // Always refetch conversation after error or success to ensure we have latest data
      if (variables?.conversationId) {
        queryClient.invalidateQueries(['conversation', variables.conversationId]);
        queryClient.invalidateQueries(['conversations', currentUser?.uid]);
      }
    }
  });

  // Handle new chat
  const handleNewChat = async () => {
    // Show loading state
    const loadingToast = toast.loading('Creating new conversation...');
    
    try {
      // Reset any existing conversation state after showing loading
      setActiveConversation(null);
      setIsNewChat(true);
      
      // Create a new conversation with default settings
      const newConversation = await createConversationMutation.mutateAsync({
        title: 'New Chat',
        model: 'llama3-8b-8192',  // Default model
        style: conversationStyle, // Default style
        messages: []
      });
      
      if (!newConversation?.id) {
        throw new Error('Failed to create conversation: Invalid response from server');
      }
      
      // Set the new active conversation
      setActiveConversation(newConversation.id);
      setIsNewChat(false);
      
      // Invalidate the conversations list to refresh it
      await queryClient.invalidateQueries(['conversations', currentUser?.uid]);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      toast.success('New conversation created');
      
      // Close sidebar on mobile
      if (isMobile) {
        setIsSidebarOpen(false);
      }
      
      return newConversation;
    } catch (error) {
      console.error('Error creating new conversation:', error);
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to create new conversation');
      throw error;
    }
  };

  // Handle conversation selection
  const handleSelectConversation = (conversationId, style) => {
    try {
      debugLog('handleSelectConversation called', { 
        conversationId, 
        style,
        currentActiveConversation: activeConversation,
        hasStyleProp: style !== undefined && style !== null
      });
      
      if (!conversationId) {
        debugLog('No conversationId provided to handleSelectConversation');
        return;
      }
      
      // Cancel any ongoing queries for the previous conversation
      debugLog('Cancelling queries for previous conversation', { previousConversationId: activeConversation });
      queryClient.cancelQueries(['conversation', activeConversation]);
      
      // Set the new active conversation
      debugLog('Setting new active conversation', { conversationId });
      setActiveConversation(conversationId);
      
      // Update the conversation style safely with a default fallback
      const safeStyle = validStyles.includes(style) ? style : defaultStyle;
      debugLog('Setting conversation style', { 
        requestedStyle: style,
        safeStyle,
        isValidStyle: validStyles.includes(safeStyle)
      });
      setSafeConversationStyle(safeStyle);
      
      // Mark that we're not in a new chat
      debugLog('Setting isNewChat to false');
      setIsNewChat(false);
      
      // Prefetch the conversation data
      debugLog('Prefetching conversation data', { conversationId });
      queryClient.prefetchQuery({
        queryKey: ['conversation', conversationId],
        queryFn: async () => {
          try {
            debugLog('Fetching conversation data', { conversationId });
            const data = await chatApi.getConversation(conversationId);
            
            debugLog('Received conversation data', { 
              hasData: !!data,
              hasStyle: !!data?.data?.style,
              style: data?.data?.style || 'no style'
            });
            
            // Update the style when prefetching if it's available in the response
            const newStyle = data?.data?.style;
            if (newStyle && validStyles.includes(newStyle)) {
              debugLog('Updating style from conversation data', { style: newStyle });
              setSafeConversationStyle(newStyle);
            } else {
              debugLog('Using default style, invalid or missing style in response', { 
                hasStyle: !!newStyle,
                isValid: newStyle ? validStyles.includes(newStyle) : false
              });
            }
            
            return data?.data || null;
          } catch (error) {
            console.error('Error in conversation prefetch:', error);
            throw error;
          }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
      
      // Close sidebar on mobile
      if (isMobile) {
        debugLog('Closing mobile sidebar');
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error in handleSelectConversation:', error);
      // Optionally show error to user
      toast.error('Failed to select conversation');
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
  
  // Delete conversation handlers
  const promptDelete = (conversationId) => {
    setConversationToDelete(conversationId);
    setShowDeleteDialog(true);
  };

  const cancelDelete = () => {
    setConversationToDelete(null);
    setShowDeleteDialog(false);
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

  // Handle sending a message
  const handleSendMessage = useCallback(async (content) => {
    // Ensure content is a string and trim whitespace
    const messageContent = typeof content === 'string' ? content.trim() : String(content || '').trim();
    
    if (!messageContent) {
      console.log('Empty message content, not sending');
      return;
    }
    
    // Define default values
    const defaultModel = 'llama3-8b-8192'; // Updated to valid Groq model name
    const defaultStyle = 'empathetic';

    // Function to send a message with retry logic
    const sendMessageWithRetry = async (messageData, isNewConversation = false) => {
      try {
        // If it's a new conversation, create it first
        if (isNewConversation) {
          console.log('Creating new conversation for message...');
          
          const newConversation = await createConversationMutation.mutateAsync({
            title: messageData.content.slice(0, 30) + (messageData.content.length > 30 ? '...' : ''),
            lastMessage: messageData.content,
            model: messageData.model,
            style: messageData.style,
            messages: [{
              content: messageData.content,
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
            setIsNewChat(false);
            
            // Now send the first message to the new conversation
            console.log('Sending first message to new conversation:', {
              conversationId: newConversation.id,
              model: messageData.model,
              style: messageData.style,
              content: messageData.content
            });
            
            return sendMessageMutation.mutateAsync({
              content: messageData.content,
              conversationId: newConversation.id,
              model: messageData.model,
              style: messageData.style
            });
          }
        } else {
          // For existing conversation, just send the message
          return sendMessageMutation.mutateAsync(messageData);
        }
      } catch (error) {
        console.error('Error in message sending:', error);
        
        // If it's an authentication error, refresh the token and retry once
        if (error?.response?.status === 401 && !messageData.retried) {
          console.log('Authentication error, refreshing token and retrying...');
          try {
            // Refresh the token
            const user = auth.currentUser;
            if (user) {
              const newToken = await user.getIdToken(true);
              console.log('Token refreshed, retrying message send...');
              
              // Retry with the new token
              return sendMessageWithRetry({
                ...messageData,
                retried: true,
                headers: {
                  ...messageData.headers,
                  Authorization: `Bearer ${newToken}`
                }
              }, isNewConversation);
            }
          } catch (refreshError) {
            console.error('Error refreshing token:', refreshError);
            toast.error('Session expired. Please log in again.');
            window.location.href = '/login';
            return;
          }
        }
        
        // For other errors, show a user-friendly message
        const errorMessage = error.response?.data?.message || error.message || 'Failed to send message';
        toast.error(errorMessage);
        throw error;
      }
    };
    
    try {
      // Get current conversation settings with fallbacks
      const currentStyle = activeConversationData?.style || conversationStyle || defaultStyle;
      const currentModel = activeConversationData?.model || defaultModel;
      
      if (!activeConversation || isNewChat) {
        // For new conversations
        if (!messageContent.trim()) return;
        
        await sendMessageWithRetry({
          content: messageContent,
          model: currentModel,
          style: currentStyle,
          retried: false
        }, true);
      } else {
        // For existing conversations
        if (!activeConversation) {
          console.error('No active conversation ID available');
          toast.error('No active conversation');
          return;
        }
        
        console.log('Sending message to existing conversation:', {
          conversationId: activeConversation,
          content: messageContent.substring(0, 30) + (messageContent.length > 30 ? '...' : '')
        });
        
        await sendMessageWithRetry({
          content: messageContent,
          conversationId: activeConversation,
          model: currentModel,
          style: currentStyle,
          retried: false
        });
      }
    } catch (error) {
      console.error('Error in message sending flow:', error);
      // Error is already handled in sendMessageWithRetry
    }
  }, [activeConversation, isNewChat, activeConversationData, conversationStyle, createConversationMutation, sendMessageMutation]);

  // Handle style change with immediate UI update and optimistic updates
  const handleStyleChange = useCallback((newStyle) => {
    if (!newStyle || !validStyles.includes(newStyle)) {
      console.warn('Invalid style provided:', newStyle);
      return;
    }
    
    // Update local state immediately for better UX
    const previousStyle = conversationStyle;
    setConversationStyle(newStyle);
    
    // Update the active conversation's style if we have valid data
    if (activeConversation && activeConversationData) {
      const updatedConversation = {
        ...activeConversationData,
        style: newStyle,
        updatedAt: new Date().toISOString()
      };
      
      // Update the local cache immediately for instant UI update
      queryClient.setQueryData(['conversation', activeConversation], updatedConversation);
      
      // Also update the conversations list to reflect the style change
      queryClient.setQueryData(['conversations', currentUser?.uid], (old = []) => {
        if (!Array.isArray(old)) return old;
        return old.map(conv => 
          conv.id === activeConversation 
            ? { ...conv, style: newStyle, updatedAt: updatedConversation.updatedAt }
            : conv
        );
      });
      
      // Then save to the server in the background
      chatApi.saveConversation(updatedConversation)
        .then(() => {
          debugLog('Successfully updated conversation style', { style: newStyle });
        })
        .catch(error => {
          console.error('Failed to update conversation style:', error);
          // Revert on error
          setConversationStyle(previousStyle);
          
          // Revert the conversation data
          queryClient.setQueryData(['conversation', activeConversation], {
            ...updatedConversation,
            style: previousStyle
          });
          
          // Show error to user
          toast.error('Failed to update conversation style');
        });
    }
  }, [activeConversation, activeConversationData, conversationStyle, currentUser?.uid, queryClient]);

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
            onDeleteConversation={promptDelete}
            selectedConversation={activeConversation}
            conversationStyle={conversationStyle}
            onStyleChange={handleStyleChange}
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
