import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useConversationContext } from '../../contexts/ConversationContext';
import { useAuth } from '../../auth/context/AuthContext';
import MessageList from '../chat/MessageList';
import ChatInput from '../chat/ChatInput';
import { Loader2, Mic, Paperclip, Smile, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'react-hot-toast';

// Skeleton loader for messages
const MessageSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-4 px-4 py-2">
      {Array(count).fill(0).map((_, i) => (
        <div 
          key={i} 
          className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl rounded-lg p-3 ${
            i % 2 === 0 
              ? 'bg-indigo-100 dark:bg-indigo-900/30 rounded-tr-none' 
              : 'bg-gray-100 dark:bg-gray-800 rounded-tl-none'
          }`}>
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Error state component
const ErrorState = ({ message, onRetry, isLoading }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
    <div className="max-w-md mx-auto">
      <div className="flex flex-col items-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Something went wrong</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
        <button
          onClick={onRetry}
          disabled={isLoading}
          className="mt-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center space-x-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span>Retry</span>
        </button>
      </div>
    </div>
  </div>
);

const ConversationChatArea = () => {
  const { currentUser } = useAuth();
  const {
    currentConversation,
    messages,
    loadingStates,
    error,
    sendMessage: sendMessageToContext,
    addMessage,
    loadConversation,
  } = useConversationContext();
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [localError, setLocalError] = useState(null);
  
  // Memoize derived states
  const isLoading = useMemo(() => 
    loadingStates.currentConversation || loadingStates.messages, 
    [loadingStates.currentConversation, loadingStates.messages]
  );
  
  const isSending = useMemo(() => 
    loadingStates.sendingMessage,
    [loadingStates.sendingMessage]
  );
  
  // Handle retry loading conversation
  const handleRetry = useCallback(() => {
    if (currentConversation?.id) {
      setLocalError(null);
      loadConversation(currentConversation.id);
    }
  }, [currentConversation?.id, loadConversation]);
  
  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingStates.messages]);
  
  // Handle errors from context
  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);
  
  // Handle message copy
  const handleCopyMessage = useCallback((messageId) => {
    const message = messages?.find(m => m.id === messageId);
    if (message) {
      navigator.clipboard.writeText(message.content)
        .then(() => {
          toast.success('Message copied to clipboard');
        })
        .catch(() => {
          toast.error('Failed to copy message');
        });
    }
  }, [messages]);

  // Handle message delete
  const handleDeleteMessage = useCallback((messageId) => {
    // In a real app, you would call an API to delete the message
    console.log('Delete message:', messageId);
  }, []);

  // Handle text-to-speech
  const handleSpeak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = window.speechSynthesis.getVoices()[0];
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error('Text-to-speech is not supported in your browser');
    }
  }, []);
  
  const handleSendMessage = useCallback(async (content) => {
    if (!content.trim() || isSending) return;
    
    try {
      setLocalError(null);
      // Optimistically add the message
      const tempId = `temp-${Date.now()}`;
      const userMessage = {
        id: tempId,
        content,
        role: 'user',
        senderId: currentUser?.uid,
        timestamp: new Date().toISOString(),
        status: 'sending',
        isOptimistic: true
      };
      
      // Add to local state immediately
      addMessage(userMessage);
      setInputMessage('');
      
      // Send to server
      await sendMessageToContext({
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
      });
      
      // The actual message from server will replace the temp one
    } catch (error) {
      console.error('Failed to send message:', error);
      setLocalError(error.message || 'Failed to send message');
      toast.error('Failed to send message');
      
      // Update message status to failed in the UI
      // This would be handled by your state management
    }
  }, [sendMessageToContext, currentUser, addMessage, isSending]);
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Handle file upload logic here
    console.log('File selected:', file);
    // You would typically upload the file to storage and get a URL
    // Then send a message with the file URL
  };
  
  const handleEmojiClick = (emojiData) => {
    setInputMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };
  
  const toggleRecording = () => {
    // Implement voice recording logic
    setIsRecording(!isRecording);
  };
  
  const toggleTextToSpeech = () => {
    // Implement text-to-speech for the last message
    setIsSpeaking(!isSpeaking);
  };
  
  // Loading state - initial load or refreshing
  if (isLoading && !currentConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading conversation...</p>
      </div>
    );
  }
  
  // Error state
  if (localError && !isLoading) {
    return (
      <ErrorState 
        message={localError} 
        onRetry={handleRetry}
        isLoading={loadingStates.currentConversation}
      />
    );
  }
  
  // No conversation selected
  if (!currentConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-gray-900 p-6 text-center">
        <div className="max-w-md mx-auto">
          <div className="flex flex-col items-center space-y-4">
            <MessageSquare className="h-12 w-12 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              No conversation selected
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Select an existing conversation or start a new one to begin chatting.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-auto">
        {loadingStates.messages && messages.length === 0 ? (
          <MessageSkeleton count={5} />
        ) : (
          <MessageList
            messages={messages || []}
            currentUserId={currentUser?.uid}
            onSpeak={handleSpeak}
            onCopy={handleCopyMessage}
            onDelete={handleDeleteMessage}
            isTyping={loadingStates.sendingMessage}
          />
        )}
        
        {/* Loading indicator for new messages */}
        {loadingStates.sendingMessage && (
          <div className="flex justify-start px-4 py-2">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 rounded-tl-none">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Sending...</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 relative">
        <div className="relative">
          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2 z-10">
              <EmojiPicker 
                onEmojiClick={handleEmojiClick}
                width={300}
                height={350}
                searchDisabled={false}
              />
            </div>
          )}
          
          <div className="flex items-center space-x-2 mb-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              title="Attach file"
            >
              <Paperclip className="h-5 w-5" />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
            </button>
            
            <button 
              onClick={toggleRecording}
              className={`p-2 rounded-full ${isRecording ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-gray-700`}
              title={isRecording ? 'Stop recording' : 'Record voice message'}
            >
              <Mic className="h-5 w-5" />
            </button>
            
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              title="Insert emoji"
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>
          
          <ChatInput 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onSend={handleSendMessage}
            isSending={isSending || loadingStates.sendingMessage}
            disabled={loadingStates.sendingMessage}
            placeholder={loadingStates.sendingMessage ? 'Sending message...' : 'Type your message...'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isSending) {
                e.preventDefault();
                handleSendMessage(inputMessage);
              }
            }}
          />
        </div>
        
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default ConversationChatArea;
