import React, { useState, useRef, useEffect } from 'react';
import { useFirestoreConversations } from '../../hooks/useFirestoreConversations';
import { FiSend, FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { format } from 'date-fns';

const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const messagesEndRef = useRef(null);
  
  const {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    createConversation,
    sendMessage,
    setActiveConversation,
    updateConversation,
    deleteConversation
  } = useFirestoreConversations();

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set new title when conversation changes
  useEffect(() => {
    setNewTitle(currentConversation?.title || '');
  }, [currentConversation?.id]);

  const handleNewChat = async () => {
    await createConversation();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const content = message;
    setMessage('');
    
    try {
      await sendMessage(content, 'user');
      // The AI response will be handled by the real-time listener
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleUpdateTitle = async () => {
    if (!currentConversation || !newTitle.trim()) return;
    
    try {
      await updateConversation(currentConversation.id, { title: newTitle });
      setIsEditingTitle(false);
    } catch (err) {
      console.error('Failed to update title:', err);
    }
  };

  const handleDeleteConversation = async (e, conversationId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await deleteConversation(conversationId);
        if (currentConversation?.id === conversationId) {
          setActiveConversation(null);
        }
      } catch (err) {
        console.error('Failed to delete conversation:', err);
      }
    }
  };

  if (loading.conversations) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto">
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="mr-2" />
            New Chat
          </button>
        </div>
        
        <div className="px-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveConversation(conv.id)}
              className={`p-3 rounded-lg mb-1 cursor-pointer flex justify-between items-center ${
                currentConversation?.id === conv.id
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="truncate flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {conv.title || 'Untitled Chat'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {conv.updatedAt?.toDate ? format(conv.updatedAt.toDate(), 'MMM d, h:mm a') : ''}
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteConversation(e, conv.id)}
                className="p-1 text-gray-400 hover:text-red-500"
                title="Delete conversation"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center">
              {isEditingTitle ? (
                <div className="flex-1 flex">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onBlur={handleUpdateTitle}
                    onKeyPress={(e) => e.key === 'Enter' && handleUpdateTitle()}
                    className="flex-1 bg-transparent border-b border-blue-500 outline-none text-lg font-medium"
                    autoFocus
                  />
                </div>
              ) : (
                <h2 className="text-lg font-medium text-gray-900 dark:text-white flex-1">
                  {currentConversation.title || 'Untitled Chat'}
                </h2>
              )}
              <button
                onClick={() => setIsEditingTitle(!isEditingTitle)}
                className="p-1 text-gray-400 hover:text-blue-500"
                title="Edit title"
              >
                <FiEdit2 size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  Start a new conversation
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-3xl rounded-lg px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                          : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <div className="text-xs mt-1 opacity-50">
                        {msg.timestamp?.toDate
                          ? format(msg.timestamp.toDate(), 'h:mm a')
                          : ''}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading.sending}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || loading.sending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading.sending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FiSend />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-6 max-w-md">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                No conversation selected
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Start a new conversation or select an existing one from the sidebar.
              </p>
              <button
                onClick={handleNewChat}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlus className="inline mr-2" />
                New Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
