import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMessageSquare, FiCheck, FiCheckCircle } from 'react-icons/fi';
import useAuth from '../../auth/hooks/useAuth';

const Message = ({ message, isUser, isFirstInGroup, isLastInGroup }) => {
  const { user } = useAuth();
  const displayName = user?.displayName || 'You';
  const timeString = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} px-2 sm:px-4 py-1.5`}
    >
      <div className="flex w-full">
        {/* Left side for assistant's avatar */}
        {!isUser ? (
          <div className="flex-shrink-0 mr-3 self-end mb-1">
            <img 
              src="/logo.png" 
              alt="Seriva" 
              className="h-10 w-10 object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/logo.svg';
              }}
            />
          </div>
        ) : (
          <div className="flex-grow" />
        )}
        
        {/* Message content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`} style={{ maxWidth: 'calc(100% - 6rem)' }}>
          {/* Sender Name */}
          {isFirstInGroup && (
            <div className={`text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ${isUser ? 'mr-1' : 'ml-1'}`}>
              {isUser ? displayName : 'Seriva'}
            </div>
          )}
          
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className={`px-5 py-3 rounded-2xl shadow-sm transition-all duration-200 ${
              isUser 
                ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-br-sm' 
                : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
            }`} style={{ maxWidth: '48rem' }}
          >
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </div>
            
            {/* Message Metadata */}
            <div className={`flex items-center mt-1.5 space-x-2 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}>
              <span className={isUser ? 'text-indigo-100/90' : 'text-gray-500 dark:text-gray-400'}>
                {timeString}
              </span>
              
              {isUser && (
                <span className="flex items-center" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {message.status === 'sending' && (
                    <motion.span 
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <FiCheck className="w-3 h-3" />
                    </motion.span>
                  )}
                  {message.status === 'sent' && <FiCheck className="w-3 h-3" />}
                  {message.status === 'delivered' && (
                    <span className="flex">
                      <FiCheck className="w-3 h-3 -mr-1" />
                      <FiCheck className="w-3 h-3" />
                    </span>
                  )}
                  {message.status === 'read' && (
                    <span className="flex text-blue-200">
                      <FiCheckCircle className="w-3 h-3 -mr-1" />
                      <FiCheckCircle className="w-3 h-3" />
                    </span>
                  )}
                </span>
              )}
            </div>
          </motion.div>
        </div>
        
        {/* Right side for user's avatar */}
        {isUser ? (
          <div className="flex-shrink-0 ml-3 self-end mb-1">
            <div className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-blue-400 flex items-center justify-center text-white shadow-sm">
              <FiUser className="w-4 h-4" />
            </div>
          </div>
        ) : (
          <div className="flex-grow" />
        )}
      </div>
    </motion.div>
  );
};

export const ChatMessages = ({ messages = [], isLoading = false }) => {
  // Group consecutive messages from the same sender
  const groupedMessages = [];
  let currentGroup = [];
  
  messages.forEach((message, index) => {
    const isUser = message.role === 'user';
    const prevMessage = messages[index - 1];
    const nextMessage = messages[index + 1];
    const isFirstInGroup = !prevMessage || prevMessage.role !== message.role;
    const isLastInGroup = !nextMessage || nextMessage.role !== message.role;
    
    groupedMessages.push({
      ...message,
      isFirstInGroup,
      isLastInGroup
    });
  });

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pt-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
      <div className="max-w-6xl mx-auto w-full px-4">
        <AnimatePresence initial={false}>
          {groupedMessages.map((message, index) => (
            <Message
              key={message.id || index}
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
              className="flex items-start mb-4"
            >
              <div className="flex-shrink-0 mr-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-500 dark:text-indigo-300">
                  <FiMessageSquare className="w-4 h-4" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
                  AI Assistant is typing
                </span>
                <div className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-700/50">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 dark:bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-indigo-400 dark:bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-indigo-400 dark:bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatMessages;
