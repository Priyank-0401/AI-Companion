import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ChatWrapper from '../components/chat/ChatWrapper';
import Sidebar from '../components/chat/Sidebar';
import ThemeContext from '../contexts/ThemeContext';
import { useChat } from '../contexts/ChatContext';
import { chatApi } from '../services/api';
import { v4 as uuid } from 'uuid';

const ChatPage = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { theme } = useContext(ThemeContext);
  const {
    messages, 
    conversationId,
    chatHistory = [],
    currentChatTitle,
    selectedModel,
    conversationStyle,
    isLoading = false,
    isSending = false,
    resetChat,
    loadChatHistory,
    createNewSession,
    switchSession,
    deleteSession,
    showModelDropdown = false,
    setShowModelDropdown = () => {},
    showOptions = false,
    setShowOptions = () => {},
    activeChatDropdown = null,
    setActiveChatDropdown = () => {}
  } = useChat();

  // Group chat history by date
  const groupedChatHistory = (chatHistory || []).reduce((groups, chat) => {
    if (chat && chat.lastActivity) {
      const date = new Date(chat.lastActivity).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(chat);
    }
    return groups;
  }, {});

  // Load a specific chat
  const loadChat = useCallback((chatId) => {
    // Switch to the selected session
    switchSession(chatId);
    setMobileSidebarOpen(false);
  }, [switchSession]);

  // Start a new chat
  const startNewChat = useCallback(() => {
    // Create a new chat through the context
    createNewSession();
    setMobileSidebarOpen(false);
    
    // Scroll to top of message list
    const messageList = document.querySelector('.message-list');
    if (messageList) {
      messageList.scrollTop = 0;
    }
  }, [createNewSession]);

  // Export chat
  const exportChat = useCallback((chatId = null) => {
    const chat = chatId 
      ? chatHistory.find(c => c.id === chatId)
      : conversationId
        ? chatHistory.find(c => c.id === conversationId)
        : { messages, title: currentChatTitle || 'Untitled Chat' };
    
    if (!chat) return;
    
    const formattedMessages = chat.messages
      .map(msg => {
        const sender = msg.type === 'user' ? 'You' : 'Seriva';
        return `${sender} (${new Date(msg.timestamp).toLocaleString()}):\n${msg.content}\n`;
      })
      .join('\n');
    
    const blob = new Blob([formattedMessages], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.title.replace(/[^\w\s]/gi, '')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [conversationId, currentChatTitle, chatHistory, messages]);

  // Delete chat from history
  const deleteChatFromHistory = useCallback(async (chatId) => {
    try {
      // Use the context's deleteSession function
      deleteSession(chatId);
      
      // If we're currently viewing the deleted chat, start a new one
      if (conversationId === chatId) {
        startNewChat();
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  }, [conversationId, deleteSession, startNewChat]);

  // Save chat as text
  const saveChatAsTxt = useCallback((chatId) => {
    exportChat(chatId);
  }, [exportChat]);

  // Reset chat handler
  const resetChatHandler = useCallback(() => {
    startNewChat();
  }, [startNewChat]);

  // Initial load
  useEffect(() => {
    // Load any initial data if needed
    // Chat history is already loaded in the ChatProvider
  }, []);

  // Model options
  const modelOptions = [
    { 
      id: 'default', 
      name: 'Seriva (Default)', 
      description: 'Balanced wellness companion',
      icon: 'sparkles'
    },
    { 
      id: 'supportive', 
      name: 'Supportive Seriva', 
      description: 'Extra empathetic responses',
      icon: 'heart'
    },
    { 
      id: 'analytical', 
      name: 'Analytical Seriva', 
      description: 'Logical and analytical approach',
      icon: 'brain'
    }
  ];

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} text-gray-900 dark:text-gray-100 overflow-hidden`}>
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 md:static md:block">
        <Sidebar 
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
          chatHistory={chatHistory}
          currentConversationId={conversationId}
          loadChat={loadChat}
          startNewChat={startNewChat}
          deleteChatFromHistory={deleteChatFromHistory}
          saveChatAsTxt={saveChatAsTxt}
        />
      </div>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Chat area */}
        <div className="flex-1 overflow-hidden">
          <ChatWrapper 
            mobileSidebarOpen={mobileSidebarOpen}
            setMobileSidebarOpen={setMobileSidebarOpen}
          />
        </div>
      </main>
    </div>
  );
};

export default ChatPage;