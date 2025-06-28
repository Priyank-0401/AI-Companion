import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ChatWrapper from '../components/chat/ChatWrapper';
import Sidebar from '../components/chat/Sidebar';
import { useChat } from '../contexts/ChatContext';
import { chatApi } from '../services/api';
import { v4 as uuid } from 'uuid';

const ChatPage = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { 
    messages, 
    setMessages, 
    conversationId,
    setConversationId,
    chatHistory = [],
    setChatHistory,
    currentChatTitle,
    setCurrentChatTitle,
    selectedModel,
    setSelectedModel,
    conversationStyle,
    setConversationStyle,
    isLoading = false,
    isSending = false,
    resetChat,
    loadChatHistory,
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
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      setConversationId(chatId);
      setCurrentChatTitle(chat.title);
      setMobileSidebarOpen(false);
    }
  }, [chatHistory, setMessages, setConversationId, setCurrentChatTitle]);

  // Start a new chat
  const startNewChat = useCallback(() => {
    resetChat();
    setMobileSidebarOpen(false);
  }, [resetChat]);

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
      // Remove from local storage
      const updatedHistory = chatHistory.filter(chat => chat.id !== chatId);
      localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
      
      // Update state
      setChatHistory(updatedHistory);
      
      // If we're currently viewing the deleted chat, start a new one
      if (conversationId === chatId) {
        resetChat();
      }
      
      // Remove from localStorage if it's the current conversation
      const currentId = localStorage.getItem('currentConversationId');
      if (currentId === chatId) {
        localStorage.removeItem('currentConversationId');
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  }, [chatHistory, conversationId, resetChat, setChatHistory]);

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
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 md:static">
        <Sidebar 
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
          chatHistory={chatHistory}
          currentConversationId={conversationId}
          loadChat={loadChat}
          startNewChat={startNewChat}
          exportChat={exportChat}
          resetChatHandler={resetChatHandler}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          showModelDropdown={showModelDropdown}
          setShowModelDropdown={setShowModelDropdown}
          modelOptions={modelOptions}
          conversationStyle={conversationStyle}
          setConversationStyle={setConversationStyle}
          showOptions={showOptions}
          setShowOptions={setShowOptions}
          activeChatDropdown={activeChatDropdown}
          setActiveChatDropdown={setActiveChatDropdown}
          groupedChatHistory={groupedChatHistory}
          deleteChatFromHistory={deleteChatFromHistory}
          saveChatAsTxt={saveChatAsTxt}
        />
      </div>
      
      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <ChatWrapper 
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />
      </main>
    </div>
  );
};

export default ChatPage;