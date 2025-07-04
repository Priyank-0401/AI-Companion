import React from 'react';
import PropTypes from 'prop-types';
import { FiMenu, FiMoreVertical, FiMessageSquare, FiArchive } from 'react-icons/fi';

const ChatHeader = ({ 
  title = 'New Chat', 
  onMenuClick, 
  onArchive, 
  onNewChat,
  onToggleSidebar,
  isSidebarOpen,
  className = ''
}) => {
  return (
    <header className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          <button 
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            aria-label="Toggle menu"
          >
            <FiMenu className="w-5 h-5" />
          </button>
          {onToggleSidebar && (
            <button 
              onClick={onToggleSidebar}
              className="hidden md:block p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <FiMenu className={`w-5 h-5 transition-transform duration-200 ${isSidebarOpen ? 'transform rotate-90' : ''}`} />
            </button>
          )}
        </div>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
          {title}
        </h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={onNewChat}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          aria-label="New chat"
        >
          <FiMessageSquare className="w-5 h-5" />
        </button>
        <button
          onClick={onArchive}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          aria-label="Archive chat"
        >
          <FiArchive className="w-5 h-5" />
        </button>
        <button
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          aria-label="More options"
        >
          <FiMoreVertical className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

ChatHeader.propTypes = {
  title: PropTypes.string,
  onMenuClick: PropTypes.func,
  onArchive: PropTypes.func,
  onNewChat: PropTypes.func,
  onToggleSidebar: PropTypes.func,
  isSidebarOpen: PropTypes.bool,
  className: PropTypes.string,
};

export default ChatHeader;
