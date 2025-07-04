import { FiPlus, FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

const ConversationItem = ({ 
  conversation, 
  isActive, 
  onSelect, 
  onDelete 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
        isActive 
          ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
      onClick={() => onSelect(conversation.id)}
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {conversation.title || 'New Chat'}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {conversation.lastMessage || 'No messages yet'}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(conversation.id);
        }}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
        aria-label="Delete conversation"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </motion.div>
  );
};

export const ChatSidebar = ({
  isOpen = true,
  conversations = [],
  searchQuery = '',
  onSearchChange = () => {},
  onNewChat = () => {},
  onSelectConversation = () => {},
  onDeleteConversation = () => {}
}) => {
  if (!isOpen) return null;

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
        >
          <FiPlus className="mr-2" />
          New Chat
        </button>
      </div>
      
      <div className="px-4 pb-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <AnimatePresence>
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
              No conversations found
            </div>
          ) : (
            conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={false} // Will be handled by parent
                onSelect={onSelectConversation}
                onDelete={onDeleteConversation}
              />
            ))
          )}
        </AnimatePresence>
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-medium text-sm">
            U
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900 dark:text-white">User</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Free Plan</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
