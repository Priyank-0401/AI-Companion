import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMessageSquare } from 'react-icons/fi';

const Message = ({ message, isUser, isFirstInGroup, isLastInGroup }) => {
  const timeString = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-1`}
    >
      <div className={`flex max-w-3/4 ${!isUser ? 'items-start' : ''} ${isLastInGroup ? 'mb-4' : 'mb-1'}`}>
        {!isUser && (
          <div className="flex-shrink-0 mr-2 mt-1">
            {isFirstInGroup ? (
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-500 dark:text-indigo-300">
                <FiMessageSquare className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 flex items-center justify-center opacity-0">
                <FiMessageSquare className="w-4 h-4" />
              </div>
            )}
          </div>
        )}
        
        <div className="flex flex-col">
          {isFirstInGroup && !isUser && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
              AI Assistant
            </span>
          )}
          
          <div
            className={`relative px-4 py-2.5 rounded-xl ${
              isUser
                ? 'bg-gradient-to-br from-indigo-500 to-blue-500 text-white rounded-br-sm'
                : 'bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 rounded-bl-sm shadow-sm border border-gray-100 dark:border-gray-700/50'
            } ${isFirstInGroup ? 'rounded-tl-xl' : 'rounded-tl-sm'} ${
              isLastInGroup ? (isUser ? 'rounded-br-xl' : 'rounded-bl-xl') : ''
            }`}
          >
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </div>
            <div 
              className={`text-[10px] mt-1.5 text-right ${
                isUser ? 'text-indigo-100' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {timeString}
            </div>
          </div>
        </div>
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
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
      <div className="max-w-3xl mx-auto w-full">
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
