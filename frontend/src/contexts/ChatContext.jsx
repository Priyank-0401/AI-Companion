import React, { createContext, useState, useContext, useEffect } from 'react';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

// Helper function to create the initial bot message with a fresh Date object
const getInitialBotMessage = () => ({
  id: 1,
  type: 'bot',
  content: "Welcome! It's wonderful to see you. I'm Seriva, a friendly presence here to listen without judgment, offer support, and explore any thoughts or feelings you'd like to share. How can I help you feel more supported today?",
  timestamp: new Date() // Use a new Date object directly
});

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState(() => {
    try {
      const storedMessages = localStorage.getItem('chatMessages');
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        // If localStorage has messages, parse them and their timestamps
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          return parsedMessages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp) 
          }));
        }
      }
    } catch (error) {
      console.error("Error loading messages from localStorage:", error);
    }
    // If localStorage is empty, has an empty array, or an error occurred, return the initial bot message
    return [getInitialBotMessage()];
  });

  const [conversationId, setConversationId] = useState(() => {
    try {
      const storedConversationId = localStorage.getItem('chatConversationId');
      return storedConversationId ? JSON.parse(storedConversationId) : null;
    } catch (error) {
      console.error("Error loading conversationId from localStorage:", error);
      return null;
    }
  });

  // We can also move conversationStyle here if it needs to be persisted globally
  // const [conversationStyle, setConversationStyle] = useState('supportive'); 

  // Effect to save messages to localStorage
  useEffect(() => {
    try {
      // Store timestamps as ISO strings for proper serialization
      localStorage.setItem('chatMessages', JSON.stringify(messages.map(msg => ({
        ...msg,
        // Ensure timestamp is converted to ISO string before saving
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : new Date(msg.timestamp).toISOString()
      }))));

    } catch (error) {
      console.error("Error saving messages to localStorage:", error);
    }
  }, [messages]);

  // Effect to save conversationId to localStorage
  useEffect(() => {
    try {
      if (conversationId === null) {
        localStorage.removeItem('chatConversationId');
      } else {
        localStorage.setItem('chatConversationId', JSON.stringify(conversationId));
      }
    } catch (error) {
      console.error("Error saving conversationId to localStorage:", error);
    }
  }, [conversationId]);

  const addMessage = (message) => {
    // Ensure timestamp is a Date object before adding
    const messageWithDate = {
        ...message,
        timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)
    };
    setMessages(prevMessages => [...prevMessages, messageWithDate]);
  };

  const resetChat = () => {
    // Use the helper function to ensure a fresh Date object for the timestamp
    setMessages([getInitialBotMessage()]);
    setConversationId(null);
  };

  const value = {
    messages,
    addMessage,
    conversationId,
    setConversationId,
    resetChat,
    // conversationStyle, // if moved
    // setConversationStyle, // if moved
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
