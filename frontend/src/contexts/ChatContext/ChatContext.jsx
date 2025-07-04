import { createContext } from 'react';

const ChatContext = createContext({
  // Chat state
  messages: [],
  currentMessage: '',
  isTyping: false,
  error: null,
  activeChat: null,
  conversations: [],
  
  // Chat actions
  sendMessage: () => {},
  setCurrentMessage: () => {},
  startNewChat: () => {},
  switchConversation: () => {},
  deleteConversation: () => {},
  updateConversationTitle: () => {},
  clearConversation: () => {},
  
  // Loading states
  loading: {
    messages: false,
    conversations: false,
    sending: false,
    deleting: false,
    updating: false,
  },
});

export default ChatContext;
