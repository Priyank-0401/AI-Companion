import React, { useState, useCallback, useMemo } from 'react';
import { format, isToday, isYesterday, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Trash2, Plus, Loader2 } from 'lucide-react';

const groupConversations = (conversations = []) => {
  const today = [];
  const yesterday = [];
  const last7Days = [];
  const older = [];

  const validConversations = conversations
    .filter(conv => conv && conv.id)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  validConversations.forEach(conv => {
    const convDate = new Date(conv.updatedAt);
    if (isToday(convDate)) {
      today.push(conv);
    } else if (isYesterday(convDate)) {
      yesterday.push(conv);
    } else if (convDate > subDays(new Date(), 7)) {
      last7Days.push(conv);
    } else {
      older.push(conv);
    }
  });

  return { today, yesterday, last7Days, older };
};

const ConversationItem = ({ 
  conversation, 
  isActive, 
  onSelect, 
  onDelete,
  isDeletingId 
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSelect = useCallback(() => {
    onSelect(conversation);
  }, [conversation, onSelect]);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async (e) => {
    e.stopPropagation();
    await onDelete(conversation.id);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const formattedTime = useMemo(() => {
    if (!conversation.updatedAt) return '';
    return format(new Date(conversation.updatedAt), 'h:mm a');
  }, [conversation.updatedAt]);

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
        className={`group relative flex items-start px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
          isActive 
            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
        }`}
        onClick={handleSelect}
      >
        <div className="flex-shrink-0 mt-0.5">
          <MessageSquare className="h-4 w-4 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400" />
        </div>
        
        <div className="ml-3 min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {conversation.title || 'New Chat'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {formattedTime}
          </p>
        </div>
        
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
          <button
            onClick={handleDeleteClick}
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
            disabled={isDeletingId === conversation.id}
          >
            {isDeletingId === conversation.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </motion.div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Conversation
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this conversation? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                disabled={isDeletingId === conversation.id}
              >
                {isDeletingId === conversation.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DateGroup = ({ title, conversations, isOpen, onToggle, onSelect, selectedId, onDelete, isDeletingId }) => {
  if (conversations.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="flex items-center w-full text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-3 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span>{title}</span>
        <span className="ml-2 text-gray-400 dark:text-gray-500">
          {conversations.length}
        </span>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto' },
              collapsed: { opacity: 0, height: 0 }
            }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="space-y-1"
          >
            {conversations.map(conversation => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={selectedId === conversation.id}
                onSelect={onSelect}
                onDelete={onDelete}
                isDeletingId={isDeletingId}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ConversationList = ({
  conversations = [],
  selectedConversationId,
  onSelectConversation,
  onDeleteConversation,
  onCreateNew,
  isLoading = false,
  className = ''
}) => {
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [openGroups, setOpenGroups] = useState({
    today: true,
    yesterday: true,
    last7Days: true,
    older: true
  });

  const { today, yesterday, last7Days, older } = useMemo(
    () => groupConversations(conversations),
    [conversations]
  );

  const toggleGroup = useCallback((group) => {
    setOpenGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  }, []);

  const handleDelete = useCallback(async (conversationId) => {
    try {
      setIsDeletingId(conversationId);
      await onDeleteConversation(conversationId);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    } finally {
      setIsDeletingId(null);
    }
  }, [onDeleteConversation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex justify-between items-center mb-4 px-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Conversations
        </h2>
        <button
          onClick={onCreateNew}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="New Conversation"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-1 py-1">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageSquare className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No conversations yet
            </p>
            <button
              onClick={onCreateNew}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Conversation
            </button>
          </div>
        ) : (
          <>
            <DateGroup
              title="Today"
              conversations={today}
              isOpen={openGroups.today}
              onToggle={() => toggleGroup('today')}
              onSelect={onSelectConversation}
              selectedId={selectedConversationId}
              onDelete={handleDelete}
              isDeletingId={isDeletingId}
            />
            
            <DateGroup
              title="Yesterday"
              conversations={yesterday}
              isOpen={openGroups.yesterday}
              onToggle={() => toggleGroup('yesterday')}
              onSelect={onSelectConversation}
              selectedId={selectedConversationId}
              onDelete={handleDelete}
              isDeletingId={isDeletingId}
            />
            
            <DateGroup
              title="Previous 7 Days"
              conversations={last7Days}
              isOpen={openGroups.last7Days}
              onToggle={() => toggleGroup('last7Days')}
              onSelect={onSelectConversation}
              selectedId={selectedConversationId}
              onDelete={handleDelete}
              isDeletingId={isDeletingId}
            />
            
            <DateGroup
              title="Older"
              conversations={older}
              isOpen={openGroups.older}
              onToggle={() => toggleGroup('older')}
              onSelect={onSelectConversation}
              selectedId={selectedConversationId}
              onDelete={handleDelete}
              isDeletingId={isDeletingId}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(ConversationList);
