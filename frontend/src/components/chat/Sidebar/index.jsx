import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FiPlus, FiSettings, FiMoon, FiSun, FiMessageSquare } from 'react-icons/fi';
import ConversationList from './ConversationList';
import UserProfile from './UserProfile';
import { useTheme } from '../../../contexts/useTheme';

const Sidebar = ({ 
  isSidebarOpen = true, 
  toggleSidebar,
  conversations = [], 
  currentConversation,
  onSelectConversation,
  onDeleteConversation,
  onArchiveConversation,
  onCreateNewConversation,
  isMobileOpen = false
}) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      className={`${isSidebarOpen ? 'w-64' : 'w-20'} 
        ${isMobileOpen ? 'fixed inset-y-0 left-0 z-50 w-72' : 'hidden md:block'}
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
        flex flex-col transition-all duration-300 h-full`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onCreateNewConversation}
          className="flex items-center justify-center w-full px-4 py-2 space-x-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-200"
        >
          <FiPlus className="w-5 h-5" />
          {isSidebarOpen && <span>New Chat</span>}
        </button>
      </div>

      {/* Search - Only show when sidebar is open */}
      {isSidebarOpen && (
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 text-sm bg-gray-100 border-0 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <svg
              className="absolute w-5 h-5 text-gray-400 left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        <ConversationList 
          conversations={filteredConversations}
          currentConversationId={currentConversation?.id}
          onSelectConversation={(conv) => {
            if (onSelectConversation) onSelectConversation(conv);
            if (isMobileOpen && toggleSidebar) toggleSidebar();
          }}
          onDeleteConversation={onDeleteConversation}
          onArchiveConversation={onArchiveConversation}
        />
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleTheme}
            className="flex items-center p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <FiSun className="w-5 h-5" />
            ) : (
              <FiMoon className="w-5 h-5" />
            )}
          </button>
          
          <button
            className="flex items-center p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Settings"
          >
            <FiSettings className="w-5 h-5" />
          </button>
          
          <UserProfile />
        </div>
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  isSidebarOpen: PropTypes.bool,
  toggleSidebar: PropTypes.func,
  conversations: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    lastMessage: PropTypes.string,
    updatedAt: PropTypes.string,
    unreadCount: PropTypes.number
  })),
  currentConversation: PropTypes.object,
  onSelectConversation: PropTypes.func,
  onDeleteConversation: PropTypes.func,
  onArchiveConversation: PropTypes.func,
  onCreateNewConversation: PropTypes.func.isRequired,
  isMobileOpen: PropTypes.bool
};

export default Sidebar;
