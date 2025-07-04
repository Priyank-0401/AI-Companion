import React, { useState, useRef, useEffect } from 'react';
import { useFirestoreConversations } from '../../hooks/useFirestoreConversations';
import { FiSend, FiPlus, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';

const ChatInterface = () => {
  const [message, setMessage] = useState('');

  const messagesEndRef = useRef(null);
  
  const {
    conversations,
    currentConversation,
    messages,
    setMessages,
    loading,
    error,
    createConversation,
    sendMessage,
    setActiveConversation,
    updateConversation: updateConversationService,
    deleteConversation
  } = useFirestoreConversations();

  // Track if we should auto-scroll to bottom on new messages
  const prevMessagesLength = useRef(0);
  const isInitialLoad = useRef(true);
  const messagesContainerRef = useRef(null);
  
  // Handle scroll behavior when messages change
  useEffect(() => {
    if (isInitialLoad.current) {
      // On initial load, scroll to top
      messagesContainerRef.current?.scrollTo(0, 0);
      isInitialLoad.current = false;
      return;
    }
    
    // Only auto-scroll to bottom if new messages were added (not when loading previous messages)
    if (messages.length > prevMessagesLength.current) {
      const container = messagesContainerRef.current;
      if (container) {
        // Smooth scroll to bottom when new messages arrive
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
    
    prevMessagesLength.current = messages.length;
  }, [messages.length]);
  
  // Reset scroll position and message count when conversation changes
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
      prevMessagesLength.current = 0;
      isInitialLoad.current = true;
    }
  }, [currentConversation?.id]);

  // Generate a short title from the first message
  const generateTitleFromMessage = (content) => {
    if (!content) return 'New Chat';
    
    // Remove URLs and special characters
    const cleanContent = content
      .replace(/[^\w\s]/g, '') // Remove special chars
      .replace(/\s+/g, ' ')     // Replace multiple spaces with one
      .trim();
    
    // Take first 5 words or less
    const words = cleanContent.split(' ').slice(0, 5);
    if (words.length === 0) return 'New Chat';
    
    // Capitalize first letter of each word
    return words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleNewChat = async () => {
    await createConversation();
  };

  const handleStyleChange = async (style) => {
    if (!currentConversation) {
      // If no conversation is selected, create a new one with the selected style
      await createConversation('New Chat', 'gpt-3.5-turbo', style);
    } else {
      // Update the current conversation's style
      try {
        await updateConversation(currentConversation.id, { style });
      } catch (err) {
        console.error('Failed to update conversation style:', err);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const content = message;
    setMessage('');
    
    // Create a temporary message ID for optimistic UI update
    const tempMessageId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempMessageId,
      role: 'user',
      content: content,
      timestamp: { toDate: () => new Date() }
    };
    
    // Add the message to the UI immediately
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      // If this is the first message, generate a title
      if (messages.length === 0 && currentConversation?.title === 'New Chat') {
        const title = generateTitleFromMessage(content);
        await updateConversationService(currentConversation.id, { title });
      }
      
      // Send the message to Firestore
      await sendMessage(content, 'user');
      // The real-time listener will update the message with the actual ID from Firestore
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove the temporary message if sending fails
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
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
    <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 overflow-hidden transition-colors duration-200">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/95 flex flex-col h-full shadow-sm backdrop-blur-sm">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Chats</h1>
            <button
              onClick={handleNewChat}
              className="flex items-center justify-center p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-md hover:shadow-lg hover:shadow-blue-500/20 dark:shadow-blue-900/30"
              title="New Chat"
            >
              <FiPlus className="w-5 h-5" />
            </button>
          </div>
          
          {/* Conversation Styles */}
          <div className="mb-6 px-1">
            <h3 className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-3 px-2 uppercase tracking-wider">Chat Style</h3>
            <div className="grid grid-cols-2 gap-2">
              {/* Supportive */}
              <button
                onClick={() => handleStyleChange('supportive')}
                className={`group relative flex items-center p-2.5 rounded-lg transition-all duration-200 ${
                  currentConversation?.style === 'supportive'
                    ? 'bg-white/90 dark:bg-gray-700/80 border-2 border-pink-400/50 dark:border-pink-400/40 shadow-sm shadow-pink-100/40 dark:shadow-pink-900/30 backdrop-blur-sm ring-1 ring-pink-200/50 dark:ring-pink-900/30'
                    : 'bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 hover:border-pink-100 dark:hover:border-pink-900/40 hover:shadow-sm hover:bg-white/70 dark:hover:bg-gray-800/70'
                }`}
              >
                <span className={`flex items-center justify-center w-8 h-8 rounded-lg mr-2.5 transition-all duration-200 ${
                  currentConversation?.style === 'supportive' 
                    ? 'text-pink-500 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20'
                    : 'text-gray-500 dark:text-gray-500 group-hover:text-pink-500 dark:group-hover:text-pink-400'
                }`}>
                  <span className="text-lg">❤️</span>
                </span>
                <span className={`text-sm font-normal transition-colors duration-200 ${
                  currentConversation?.style === 'supportive'
                    ? 'text-gray-700 dark:text-gray-200 font-medium'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200'
                }`}>
                  Supportive
                </span>
              </button>

              {/* Practical */}
              <button
                onClick={() => handleStyleChange('practical')}
                className={`group relative flex items-center p-2.5 rounded-lg transition-all duration-200 ${
                  currentConversation?.style === 'practical'
                    ? 'bg-white/90 dark:bg-gray-700/80 border-2 border-amber-400/50 dark:border-amber-400/40 shadow-sm shadow-amber-100/40 dark:shadow-amber-900/30 backdrop-blur-sm ring-1 ring-amber-200/50 dark:ring-amber-900/30'
                    : 'bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 hover:border-amber-100 dark:hover:border-amber-900/40 hover:shadow-sm hover:bg-white/70 dark:hover:bg-gray-800/70'
                }`}
              >
                <span className={`flex items-center justify-center w-8 h-8 rounded-lg mr-2.5 transition-all duration-200 ${
                  currentConversation?.style === 'practical' 
                    ? 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                    : 'text-gray-500 dark:text-gray-500 group-hover:text-amber-500 dark:group-hover:text-amber-400'
                }`}>
                  <span className="text-lg">☕</span>
                </span>
                <span className={`text-sm font-normal transition-colors duration-200 ${
                  currentConversation?.style === 'practical'
                    ? 'text-amber-700 dark:text-amber-200 font-semibold'
                    : 'text-gray-700 dark:text-gray-200 group-hover:text-amber-600 dark:group-hover:text-amber-300'
                }`}>
                  Practical
                </span>
              </button>

              {/* Reflective */}
              <button
                onClick={() => handleStyleChange('reflective')}
                className={`group relative flex items-center p-2.5 rounded-lg transition-all duration-200 ${
                  currentConversation?.style === 'reflective'
                    ? 'bg-white/90 dark:bg-gray-700/80 border-2 border-indigo-400/50 dark:border-indigo-400/40 shadow-sm shadow-indigo-100/40 dark:shadow-indigo-900/30 backdrop-blur-sm ring-1 ring-indigo-200/50 dark:ring-indigo-900/30'
                    : 'bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 hover:border-indigo-100 dark:hover:border-indigo-900/40 hover:shadow-sm hover:bg-white/70 dark:hover:bg-gray-800/70'
                }`}
              >
                <span className={`flex items-center justify-center w-8 h-8 rounded-lg mr-2.5 transition-all duration-200 ${
                  currentConversation?.style === 'reflective' 
                    ? 'text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'text-gray-500 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'
                }`}>
                  <span className="text-lg">🧠</span>
                </span>
                <span className={`text-sm font-normal transition-colors duration-200 ${
                  currentConversation?.style === 'reflective'
                    ? 'text-gray-700 dark:text-gray-200 font-medium'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200'
                }`}>
                  Reflective
                </span>
              </button>

              {/* Cheerful */}
              <button
                onClick={() => handleStyleChange('cheerful')}
                className={`group relative flex items-center p-2.5 rounded-lg transition-all duration-200 ${
                  currentConversation?.style === 'cheerful'
                    ? 'bg-white/90 dark:bg-gray-700/80 border-2 border-emerald-400/50 dark:border-emerald-400/40 shadow-sm shadow-emerald-100/40 dark:shadow-emerald-900/30 backdrop-blur-sm ring-1 ring-emerald-200/50 dark:ring-emerald-900/30'
                    : 'bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 hover:border-emerald-100 dark:hover:border-emerald-900/40 hover:shadow-sm hover:bg-white/70 dark:hover:bg-gray-800/70'
                }`}
              >
                <span className={`flex items-center justify-center w-8 h-8 rounded-lg mr-2.5 transition-all duration-200 ${
                  currentConversation?.style === 'cheerful' 
                    ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'text-gray-500 dark:text-gray-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400'
                }`}>
                  <span className="text-lg">😊</span>
                </span>
                <span className={`text-sm font-normal transition-colors duration-200 ${
                  currentConversation?.style === 'cheerful'
                    ? 'text-gray-700 dark:text-gray-200 font-medium'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200'
                }`}>
                  Cheerful
                </span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 bg-white dark:bg-gray-900">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-3 uppercase tracking-wider">
            Recent Chats
          </h3>
          {conversations.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No conversations yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setActiveConversation(conv.id)}
                className={`group relative px-3 py-2.5 rounded-lg mx-2 cursor-pointer transition-all duration-200 ${
                  currentConversation?.id === conv.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 dark:border-blue-600'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/80 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="truncate pr-6">
                    <div className={`font-medium ${
                      currentConversation?.id === conv.id 
                        ? 'text-blue-600 dark:text-blue-300' 
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {conv.title || 'New Chat'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {conv.updatedAt?.toDate ? format(conv.updatedAt.toDate(), 'MMM d, h:mm a') : ''}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className={`absolute right-2 p-1 rounded-md transition-colors ${
                      currentConversation?.id === conv.id
                        ? 'text-blue-500 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50'
                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 opacity-0 group-hover:opacity-100'
                    }`}
                    title="Delete conversation"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-800/30 transition-colors duration-200">
        {currentConversation ? (
          <>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-800/20 transition-colors duration-200">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">How can I help you today?</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    Ask me anything or share your thoughts. I'm here to assist you with any questions or topics you have in mind.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      } animate-fade-in`}
                      style={{ '--tw-animate-delay': '100ms' }}
                    >
                      <div
                        className={`relative max-w-3xl rounded-2xl px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none shadow-md dark:bg-blue-700 dark:shadow-blue-900/30'
                            : 'bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/80 rounded-bl-none shadow-sm dark:shadow-gray-900/20'
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100">
                          {msg.content}
                        </div>
                        <div className={`flex items-center justify-end mt-1.5 space-x-1.5 text-xs ${
                          msg.role === 'user' 
                            ? 'text-blue-100 dark:text-blue-200/90' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          <span className="text-[0.7rem]">
                            {msg.timestamp?.toDate
                              ? format(msg.timestamp.toDate(), 'h:mm a')
                              : ''}
                          </span>
                          {msg.role === 'user' && (
                            <span className={`w-3 h-3 inline-flex items-center justify-center ${
                              msg.id.endsWith('temp') 
                                ? 'text-yellow-300 dark:text-yellow-400' 
                                : 'text-blue-200 dark:text-blue-300'
                            }`}>
                              {msg.id.endsWith('temp') ? (
                                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </span>
                          )}
                        </div>
                        {/* Tail for message bubble */}
                        {msg.role === 'user' ? (
                          <div className="absolute -right-1.5 bottom-0 w-3 h-3 bg-blue-600 dark:bg-blue-700 transform rotate-45 origin-bottom-right"></div>
                        ) : (
                          <div className="absolute -left-1.5 bottom-0 w-3 h-3 bg-white dark:bg-gray-800 border-l border-b border-gray-100 dark:border-gray-700/80 transform rotate-45 origin-bottom-left"></div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/30 backdrop-blur-sm p-4 transition-colors duration-200">
              <form 
                onSubmit={handleSendMessage} 
                className="relative flex items-end space-x-2"
              >
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Message AI Companion..."
                     className="w-full pl-10 pr-4 py-3 border-0 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:bg-white dark:focus:bg-gray-700/70 transition-all duration-200 resize-none ring-1 ring-gray-200 dark:ring-gray-600/50 focus:ring-offset-0"
                    disabled={loading.sending}
                    rows="1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!message.trim() || loading.sending}
                  className={`inline-flex items-center justify-center h-12 w-12 md:h-12 md:w-auto md:px-6 rounded-xl font-medium transition-all duration-200 ${
                    message.trim()
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 dark:bg-blue-700 dark:hover:bg-blue-600 dark:shadow-blue-900/50'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  }`}
                  title={message.trim() ? 'Send message' : 'Type a message to enable send'}
                >
                  {loading.sending ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                  <span className="sr-only">Send message</span>
                  <span className="hidden md:inline-block ml-1.5">Send</span>
                </button>
              </form>
              <div className="mt-2 text-xs text-center text-gray-400 dark:text-gray-500">
                <span>AI Companion may produce inaccurate information.</span>
              </div>
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
