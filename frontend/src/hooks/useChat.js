import { useContext } from 'react';
import { ChatContext } from '../contexts/ChatContext/index';

/**
 * Custom hook to access the chat context
 * @returns {Object} The chat context value
 * @throws {Error} If used outside of a ChatProvider
 */
const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export { useChat };
