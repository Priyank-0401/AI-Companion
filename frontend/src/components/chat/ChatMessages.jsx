import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMessageSquare } from 'react-icons/fi';
import { useEffect, useRef } from 'react';
import useAuth from '../../auth/hooks/useAuth';

const SerivaAvatar = () => (
  <div className="flex-shrink-0 mr-3 self-end mb-1">
    <div className="h-12 w-12 rounded-full flex items-center justify-center shadow-md">
      <img 
        src="/logo.svg" 
        alt="Seriva" 
        className="h-12 w-12"
      />
    </div>
  </div>
);

const UserAvatar = () => {
  const { user } = useAuth();
  const displayName = user?.displayName || user?.name || 'User';
  
  // Get user initials
  const getUserInitials = (name) => {
    if (!name || name.trim() === '') return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  
  // Always use blue color for user avatar
  const getAvatarColor = () => {
    return '#3b82f6'; // blue-500
  };
  
  const initials = getUserInitials(displayName);
  const backgroundColor = getAvatarColor();
  
  return (
    <div className="flex-shrink-0 ml-3 self-end mb-1">
      <div 
        className="h-12 w-12 rounded-full flex items-center justify-center text-white shadow-md font-bold"
        style={{ backgroundColor }}
      >
        {initials}
      </div>
    </div>
  );
};

const Message = ({ message, isUser, isFirstInGroup, isLastInGroup }) => {
  const { user } = useAuth();
  const displayName = user?.displayName || 'You';
  
  const safeMessage = message || {};
  const safeContent = safeMessage.content || '';
  const safeTimestamp = safeMessage.timestamp || new Date().toISOString();
  
  const timeString = new Date(safeTimestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} px-2 sm:px-4 py-1`}
    >
      <div className={`flex items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`} style={{ maxWidth: '80%' }}>
        {isLastInGroup && (isUser ? <UserAvatar /> : <SerivaAvatar />)}
        {!isLastInGroup && <div className="w-11" />}

        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {isFirstInGroup && (
            <span className={`text-xs font-medium mb-1 px-3 ${isUser ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}`}>
              {isUser ? displayName : 'Seriva'}
            </span>
          )}
          
          <div 
            className={`px-4 py-3 rounded-2xl shadow-md transition-all duration-200 ${isUser 
                ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-br-lg'
                : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-lg'
            }`}
          >
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {safeContent}
            </div>
          </div>
          <div className="px-3 mt-1">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {timeString}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const ChatMessages = ({ messages = [], isLoading = false }) => {
  const groupedMessages = [];
  const messagesEndRef = useRef(null);
  
  if (messages) {
    messages.forEach((message, index) => {
      const prevMessage = messages[index - 1];
      const nextMessage = messages[index + 1];
      groupedMessages.push({
        ...message,
        isFirstInGroup: !prevMessage || prevMessage.role !== message.role,
        isLastInGroup: !nextMessage || nextMessage.role !== message.role,
      });
    });
  }

  // Auto-scroll to bottom when messages change
  const scrollContainerRef = useRef(null);
  
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current;
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 pt-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
      <div className="max-w-6xl mx-auto w-full px-4">
        <AnimatePresence initial={false}>
          {groupedMessages.map((message) => (
            <Message
              key={message.id}
              message={message}
              isUser={message.role === 'user'}
              isFirstInGroup={message.isFirstInGroup}
              isLastInGroup={message.isLastInGroup}
            />
          ))}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start mb-4 px-2 sm:px-4 py-1"
            >
              <SerivaAvatar />
              <div className="flex flex-col items-start">
                <span className="text-xs font-medium mb-1 px-3 text-purple-600 dark:text-purple-400">
                  Seriva is typing...
                </span>
                <div className="px-4 py-3 rounded-2xl bg-white dark:bg-gray-700 shadow-md">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-purple-400 dark:bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-purple-400 dark:bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-purple-400 dark:bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatMessages;
