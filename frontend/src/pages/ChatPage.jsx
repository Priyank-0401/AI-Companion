import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';

// Components
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatMessages } from '../components/chat/ChatMessages';
import { ChatInput } from '../components/chat/ChatInput';
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
  
  // Debug auth state
  useEffect(() => {
    console.log('Current user in ChatPage:', currentUser);
    if (currentUser) {
      console.log('User UID:', currentUser.uid);
      // Get the current user from Firebase auth to access the token
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        firebaseUser.getIdToken(true).then(token => {
          console.log('Current user token:', token ? 'Token exists' : 'No token');
        }).catch(error => {
          console.error('Error getting user token:', error);
        });
      }
    } else {
      console.log('No current user, redirecting to login...');
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConversation, setActiveConversation] = useState(null);
  const [isNewChat, setIsNewChat] = useState(false);

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

  // Fetch conversations
  const {
    data: conversations = [],
    isLoading: isLoadingConversations,
    error: conversationsError,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      try {
        if (!currentUser) {
          navigate('/login');
          return [];
        }
        
        // Get fresh token before making the request
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
          navigate('/login');
          return [];
        }
        
        // Force token refresh to ensure it's valid
        await firebaseUser.getIdToken(true);
        
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
            // Use window.location to ensure a full page reload
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
    retry: 1, // Retry once if the first attempt fails
    onError: (error) => {
      console.error('Conversations query error:', error);
      
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
      const newConversation = {
        id: uuidv4(),
        title,
        lastMessage: title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      
      // In a real app, you would save this to your backend
      // const result = await chatApi.saveConversation(newConversation);
      // return result.data;
      
      return newConversation;
    },
    onSuccess: (data) => {
      setActiveConversation(data.id);
      setIsNewChat(true);
      queryClient.setQueryData(['conversations'], (old) => [data, ...(old || [])]);
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content }) => {
      const message = {
        id: uuidv4(),
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
      };

      let updatedConversation;
      
      if (isNewChat) {
        updatedConversation = {
          id: activeConversation,
          title: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
          lastMessage: content,
          updatedAt: new Date().toISOString(),
          messages: [message],
        };
      } else {
        updatedConversation = {
          ...activeConversationData,
          lastMessage: content,
          updatedAt: new Date().toISOString(),
          messages: [...(activeConversationData?.messages || []), message],
        };
      }

      // In a real app, you would save this to your backend
      // await chatApi.saveConversation(updatedConversation);
      
      // Simulate AI response
      setTimeout(() => {
        const aiMessage = {
          id: uuidv4(),
          content: `This is a simulated response to: ${content}`,
          role: 'assistant',
          timestamp: new Date().toISOString(),
        };
        
        const finalConversation = {
          ...updatedConversation,
          messages: [...updatedConversation.messages, aiMessage],
        };
        
        // In a real app, you would update the conversation with the AI response
        // await chatApi.saveConversation(finalConversation);
        
        queryClient.setQueryData(['conversation', activeConversation], finalConversation);
        
        // Update the conversations list
        queryClient.setQueryData(['conversations'], (old) => {
          if (!old) return [finalConversation];
          const index = old.findIndex(c => c.id === finalConversation.id);
          if (index >= 0) {
            const newConversations = [...old];
            newConversations[index] = finalConversation;
            return newConversations;
          }
          return [finalConversation, ...old];
        });
      }, 1000);

      return updatedConversation;
    },
    onMutate: async ({ content }) => {
      await queryClient.cancelQueries(['conversation', activeConversation]);
      
      const previousMessages = queryClient.getQueryData(['conversation', activeConversation])?.messages || [];
      
      queryClient.setQueryData(['conversation', activeConversation], (old) => ({
        ...old,
        messages: [
          ...(old?.messages || []),
          {
            id: uuidv4(),
            content,
            role: 'user',
            timestamp: new Date().toISOString(),
          },
        ],
      }));
      
      return { previousMessages };
    },
    onError: (error, variables, context) => {
      console.error('Error sending message:', error);
      queryClient.setQueryData(
        ['conversation', activeConversation],
        (old) => ({
          ...old,
          messages: context.previousMessages,
        })
      );
    },
  });

  // Handle new chat
  const handleNewChat = () => {
    createConversationMutation.mutate();
  };

  // Handle send message
  const handleSendMessage = (content) => {
    if (!content.trim()) return;
    
    if (isNewChat) {
      // If this is a new chat, first create the conversation
      createConversationMutation.mutate(content, {
        onSuccess: () => {
          // Then send the first message
          sendMessageMutation.mutate({ content });
        },
      });
    } else if (activeConversation) {
      // If this is an existing conversation, just send the message
      sendMessageMutation.mutate({ content });
    }
  };

  // Handle conversation selection
  const handleSelectConversation = (conversationId) => {
    setActiveConversation(conversationId);
    setIsNewChat(false);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // Handle delete conversation
  const handleDeleteConversation = async (conversationId) => {
    // In a real app, you would delete from the backend
    // await chatApi.deleteConversation(conversationId);
    
    // Optimistically update the UI
    queryClient.setQueryData(['conversations'], (old) => 
      old.filter(conv => conv.id !== conversationId)
    );
    
    if (activeConversation === conversationId) {
      setActiveConversation(null);
      setIsNewChat(false);
    }
  };

  // Get messages for the active conversation
  const messages = activeConversationData?.messages || [];
  const isLoading = isLoadingActiveConversation || sendMessageMutation.isLoading;

  // If we're loading conversations, show a loading spinner
  if (isLoadingConversations) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If there was an error loading conversations, show an error message
  if (conversationsError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
            Failed to Load Conversations
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {conversationsError.message || 'An error occurred while loading your conversations.'}
          </p>
          <button
            onClick={() => refetchConversations()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            disabled={isLoadingConversations}
          >
            {isLoadingConversations ? 'Loading...' : 'Try Again'}
          </button>
          {conversationsError.message && (
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
      <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <ChatSidebar
              isOpen={isSidebarOpen}
              conversations={conversations}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onNewChat={handleNewChat}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversation}
            />
          )}
        </AnimatePresence>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <ChatHeader 
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
            onSettingsClick={() => {}}
          />
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <ChatMessages 
              messages={messages} 
              isLoading={isLoading} 
            />
          </div>
          
          {/* Input */}
          <ChatInput 
            onSendMessage={handleSendMessage}
            isSending={isLoading}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ChatPage;
