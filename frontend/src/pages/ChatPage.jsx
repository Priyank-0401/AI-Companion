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
    currentConversationId, 
    setCurrentConversationId,
    chatHistory,
    setChatHistory,
    currentChatTitle,
    setCurrentChatTitle,
    selectedModel,
    setSelectedModel,
    conversationStyle,
    setConversationStyle,
    voiceEnabled,
    setVoiceEnabled,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
    isSpeaking,
    stopSpeaking,
    activeChatDropdown,
    setActiveChatDropdown,
    showModelDropdown,
    setShowModelDropdown,
    showOptions,
    setShowOptions,
    showVoiceDropdown,
    setShowVoiceDropdown,
    isLoading,
    isSending
  } = useChat();

  // Initialize chatHistory as an empty array if undefined
  const safeChatHistory = chatHistory || [];
  
  // Group chat history by date
  const groupedChatHistory = safeChatHistory.reduce((groups, chat) => {
    if (chat && chat.lastActivity) {
      const date = new Date(chat.lastActivity).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(chat);
    }
    return groups;
  }, {});

  // Load chat history
  const loadChatHistory = useCallback(async () => {
    try {
      const response = await chatApi.getConversations();
      setChatHistory(response.data || []);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }, [setChatHistory]);

  // Load a specific chat
  const loadChat = useCallback(async (conversationId) => {
    try {
      const response = await chatApi.getConversation(conversationId);
      setMessages(response.data.messages || []);
      setCurrentConversationId(conversationId);
      setCurrentChatTitle(response.data.title || 'Untitled Chat');
      setMobileSidebarOpen(false);
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  }, [setMessages, setCurrentConversationId, setCurrentChatTitle]);

  // Start a new chat
  const startNewChat = useCallback(() => {
    setMessages([{
      id: uuid(),
      type: 'bot',
      content: "Welcome! It's wonderful to see you. I'm Seriva, a friendly presence here to listen without judgment, offer support, and explore any thoughts or feelings you'd like to share. How can I help you feel more supported today?",
      timestamp: new Date(),
      status: 'delivered'
    }]);
    setCurrentConversationId(null);
    setCurrentChatTitle(null);
  }, [setMessages, setCurrentConversationId, setCurrentChatTitle]);

  // Export chat
  const exportChat = useCallback(() => {
    const chat = currentConversationId 
      ? chatHistory.find(c => c.id === currentConversationId) 
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
  }, [currentConversationId, currentChatTitle, chatHistory, messages]);

  // Delete chat from history
  const deleteChatFromHistory = useCallback(async (conversationId) => {
    try {
      await chatApi.deleteConversation(conversationId);
      setChatHistory(prev => prev.filter(chat => chat.id !== conversationId));
      if (currentConversationId === conversationId) {
        startNewChat();
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  }, [currentConversationId, startNewChat, setChatHistory]);

  // Save chat as text
  const saveChatAsTxt = useCallback((conversationId) => {
    exportChat();
  }, [exportChat]);

  // Reset chat handler
  const resetChatHandler = useCallback(() => {
    startNewChat();
  }, [startNewChat]);

  // Initial load
  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

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
    <div className="flex h-[calc(100vh-4rem)] pt-4">
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
          currentConversationId={currentConversationId}
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
          voiceEnabled={voiceEnabled}
          setVoiceEnabled={setVoiceEnabled}
          availableVoices={availableVoices}
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          showVoiceDropdown={showVoiceDropdown}
          setShowVoiceDropdown={setShowVoiceDropdown}
          isSpeaking={isSpeaking}
          stopSpeaking={stopSpeaking}
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