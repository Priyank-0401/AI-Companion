import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@mui/material';
import { Menu, X } from 'lucide-react';

// Context
import { useConversationContext } from '../contexts/ConversationContext';

// Components
import ConversationSidebar from '../components/conversations/ConversationSidebar';
import ConversationChatArea from '../components/conversations/ConversationChatArea';

const Conversations = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  const { 
    currentConversation,
    isLoading,
    loadConversation,
  } = useConversationContext();

  // Load conversation when ID changes
  useEffect(() => {
    if (conversationId) {
      console.log('Loading conversation:', conversationId);
      loadConversation(conversationId).catch(error => {
        console.error('Error loading conversation:', error);
        // Handle error (e.g., show error message or redirect)
      });
    } else {
      // Handle case when there's no conversation ID (new conversation)
      console.log('No conversation ID - new conversation flow');
    }
  }, [conversationId, loadConversation]);

  // Close mobile sidebar when conversation is selected
  useEffect(() => {
    if (mobileSidebarOpen && conversationId) {
      console.log('Closing mobile sidebar after conversation selection');
      setMobileSidebarOpen(false);
    }
  }, [conversationId, mobileSidebarOpen]);

  // Toggle mobile sidebar
  const toggleSidebar = useCallback(() => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  }, [mobileSidebarOpen]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 flex items-center justify-between">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          aria-label="Toggle sidebar"
        >
          {mobileSidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          {currentConversation?.title || 'New Chat'}
        </h1>
        <div className="w-9"></div> {/* Spacer for alignment */}
      </div>

      {/* Sidebar */}
      <ConversationSidebar 
        isMobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content */}
      <div className={`flex-1 flex flex-col h-full pt-12 md:pt-0`}>
        <ConversationChatArea />
      </div>
    </div>
  );
};

export default Conversations;
