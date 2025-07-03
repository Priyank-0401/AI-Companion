import React, { useState, useCallback, useEffect } from 'react';
import { useConversationContext } from '../../contexts/ConversationContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Loader2, MessageSquare, X, RefreshCw, AlertCircle } from 'lucide-react';

// Skeleton loader for conversation items
const ConversationSkeleton = ({ count = 5 }) => {
  return Array(count).fill(0).map((_, i) => (
    <div key={i} className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="animate-pulse space-y-2">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  ));
};

// Error state component
const ErrorState = ({ message, onRetry, isLoading }) => (
  <div className="p-4 text-center">
    <div className="flex flex-col items-center justify-center space-y-2">
      <AlertCircle className="h-8 w-8 text-red-500" />
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
      <button
        onClick={onRetry}
        disabled={isLoading}
        className="mt-2 px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center space-x-1"
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <RefreshCw className="h-3 w-3" />
        )}
        <span>Retry</span>
      </button>
    </div>
  </div>
);

const ConversationSidebar = ({ isMobileOpen, onClose }) => {
  const {
    conversations,
    currentConversation,
    loadingStates,
    error,
    createConversation,
    loadConversations: refreshConversations,
  } = useConversationContext();
  
  const [localError, setLocalError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  
  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => 
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.messages?.some(msg => 
      msg.content?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  
  // Handle creating a new conversation
  const handleNewConversation = useCallback(async () => {
    console.log('=== Starting handleNewConversation ===');
    
    // Prevent multiple clicks while creating
    if (isCreating) {
      console.log('⚠️ Prevented duplicate conversation creation - already in progress');
      return;
    }

    console.log('🚀 Starting new conversation creation...');
    setIsCreating(true);
    setLocalError(null);
    
    try {
      console.log('📝 Calling createConversation...');
      const newConv = await createConversation({
        title: 'New Conversation',
        // Let the server handle timestamps
      });
      
      if (!newConv || !newConv.id) {
        throw new Error('Invalid response from server: Missing conversation ID');
      }
      
      console.log('✅ Conversation created successfully, ID:', newConv.id);
      
      // Navigate to the new conversation
      const navOptions = { 
        replace: true,
        state: { fromNew: true }
      };
      
      console.log('🔄 Navigating to:', `/conversations/${newConv.id}`);
      navigate(`/conversations/${newConv.id}`, navOptions);
      
      // Close mobile sidebar if open
      if (onClose) {
        console.log('📱 Closing mobile sidebar');
        onClose();
      }
      
      console.log('=== handleNewConversation completed successfully ===');
      
    } catch (error) {
      console.error('❌ ERROR in handleNewConversation:', {
        name: error.name,
        message: error.message,
        status: error.status,
        stack: error.stack
      });
      
      setLocalError(error.message || 'Failed to create conversation');
      
      // Show error to user (you might want to use a toast notification here)
      // toast.error(error.message || 'Failed to create conversation');
      
      // Re-throw to allow error boundaries to catch it if needed
      throw error;
    } finally {
      console.log('🧹 Cleaning up loading state...');
      // Use setTimeout to ensure state updates don't interfere with navigation
      setTimeout(() => {
        setIsCreating(false);
        console.log('🧹 Loading state cleaned up');
      }, 0);
    }
  }, [createConversation, navigate, onClose]);
  
  // Handle refreshing conversations
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setLocalError(null);
      await refreshConversations();
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
      setLocalError(error.message || 'Failed to load conversations');
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshConversations]);
  
  // Format date to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };
  
  // Close sidebar when a conversation is selected on mobile
  const handleConversationSelect = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);
  
  // Initial load
  useEffect(() => {
    if (!loadingStates.conversations && !conversations.length) {
      handleRefresh();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  return (
    <div className={`${isMobileOpen ? 'block' : 'hidden'} md:block h-full w-full md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Conversations</h2>
            {(loadingStates.conversations || isRefreshing) && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={loadingStates.conversations || isRefreshing}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              title="Refresh conversations"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleNewConversation}
              disabled={isCreating || loadingStates.conversations}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              title="New conversation"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>
      
      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {/* Error state */}
        {(error || localError) && (
          <ErrorState 
            message={localError || error} 
            onRetry={handleRefresh}
            isLoading={loadingStates.conversations || isRefreshing}
          />
        )}
        
        {/* Loading state */}
        {!error && !localError && (loadingStates.conversations || isRefreshing) && !conversations.length ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <ConversationSkeleton count={5} />
          </div>
        ) : null}
        
        {/* Empty state */}
        {!error && !localError && !loadingStates.conversations && !isRefreshing && filteredConversations.length === 0 && (
          <div className="p-4 text-center">
            <div className="flex flex-col items-center justify-center space-y-2">
              <MessageSquare className="h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No matching conversations' : 'No conversations yet'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleNewConversation}
                  disabled={isCreating || loadingStates.conversations}
                  className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                >
                  {isCreating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                  <span>Create your first conversation</span>
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Conversation list */}
        {!error && !localError && !loadingStates.conversations && !isRefreshing && filteredConversations.length > 0 && (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredConversations.map((conversation) => {
              const isActive = currentConversation?.id === conversation.id;
              const lastMessage = conversation.messages?.[conversation.messages?.length - 1];
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => {
                    navigate(`/conversations/${conversation.id}`);
                    handleConversationSelect();
                  }}
                  className={`p-4 cursor-pointer transition-colors ${isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className={`text-sm font-medium truncate ${isActive ? 'text-indigo-700 dark:text-indigo-200' : 'text-gray-900 dark:text-white'}`}>
                      {conversation.title || 'New Conversation'}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(conversation.updatedAt || conversation.createdAt)}
                    </span>
                  </div>
                  {lastMessage && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                      {lastMessage.content?.substring(0, 60)}{lastMessage.content?.length > 60 ? '...' : ''}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationSidebar;
