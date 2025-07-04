import React from 'react';
import PropTypes from 'prop-types';
import { format, isToday, isYesterday } from 'date-fns';
import { FiMessageSquare, FiTrash2, FiArchive } from 'react-icons/fi';

const ConversationItem = ({ 
  conversation, 
  isActive, 
  onSelect, 
  onDelete,
  onArchive
}) => {
  const { id, title, lastMessage, updatedAt, unreadCount = 0 } = conversation;
  
  const formatDate = (date) => {
    if (!date) return '';
    
    const messageDate = new Date(date);
    
    if (isToday(messageDate)) {
      return format(messageDate, 'h:mm a');
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMM d');
    }
  };

  return (
    <div 
      className={`group relative flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
        isActive ? 'bg-gray-100 dark:bg-gray-700' : ''
      }`}
      onClick={() => onSelect(conversation)}
    >
      <div className="flex-shrink-0 mr-3 text-blue-500">
        <FiMessageSquare className="w-5 h-5" />
      </div>
      
      <div className="min-w-0 flex-1">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {title || 'New Chat'}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(updatedAt)}
          </span>
        </div>
        
        <div className="flex justify-between items-center mt-0.5">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {lastMessage || 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 text-xs font-medium text-white bg-blue-500 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </div>
      
      <div className="absolute right-2 flex space-x-1 opacity-0 group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive(conversation);
          }}
          className="p-1 text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
          title="Archive"
        >
          <FiArchive className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(conversation);
          }}
          className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
          title="Delete"
        >
          <FiTrash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ConversationList = ({ 
  conversations = [], 
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onArchiveConversation 
}) => {
  const handleDelete = (conversation) => {
    if (onDeleteConversation) {
      onDeleteConversation(conversation);
    }
  };

  const handleArchive = (conversation) => {
    if (onArchiveConversation) {
      onArchiveConversation(conversation);
    }
  };

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {conversations.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <FiMessageSquare className="w-8 h-8 mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No conversations yet
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Start a new conversation to get started
          </p>
        </div>
      ) : (
        conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={currentConversationId === conversation.id}
            onSelect={onSelectConversation}
            onDelete={handleDelete}
            onArchive={handleArchive}
          />
        ))
      )}
    </div>
  );
};

ConversationList.propTypes = {
  conversations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string,
      lastMessage: PropTypes.string,
      updatedAt: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(Date)
      ]),
      unreadCount: PropTypes.number,
    })
  ),
  currentConversationId: PropTypes.string,
  onSelectConversation: PropTypes.func,
  onDeleteConversation: PropTypes.func,
  onArchiveConversation: PropTypes.func
};

export default ConversationList;
