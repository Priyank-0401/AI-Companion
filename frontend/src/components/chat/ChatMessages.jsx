import { motion, AnimatePresence } from 'framer-motion';

const Message = ({ message, isUser }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
  >
    <div
      className={`max-w-3/4 px-4 py-2 rounded-lg ${
        isUser
          ? 'bg-blue-500 text-white rounded-tr-none'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
      }`}
    >
      <div className="whitespace-pre-wrap">{message.content}</div>
      <div className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  </motion.div>
);

export const ChatMessages = ({ messages = [], isLoading = false }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto w-full">
        <AnimatePresence>
          {messages.map((message, index) => (
            <Message
              key={message.id || index}
              message={message}
              isUser={message.role === 'user'}
            />
          ))}
          
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 rounded-tl-none">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatMessages;
