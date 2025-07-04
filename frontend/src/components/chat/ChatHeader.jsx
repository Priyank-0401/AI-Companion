import { FiMenu, FiSettings, FiUser, FiLogOut } from 'react-icons/fi';
import useAuth from '../../auth/hooks/useAuth';

export const ChatHeader = ({ onMenuClick, onSettingsClick }) => {
  const { user, logout } = useAuth();

  return (
    <div className="h-16 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center space-x-2">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200"
          aria-label="Toggle menu"
        >
          <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
          AI Companion
        </h1>
      </div>
      
      <div className="flex items-center space-x-3">
        <button
          onClick={onSettingsClick}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200"
          aria-label="Settings"
        >
          <FiSettings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        
        <div className="relative group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/80 dark:to-indigo-900/80 flex items-center justify-center text-blue-600 dark:text-blue-300 font-medium cursor-pointer shadow-sm border border-gray-100 dark:border-gray-700/50">
            {user?.displayName?.[0]?.toUpperCase() || 'U'}
          </div>
          
          <div className="absolute right-0 mt-2 w-56 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700/50 py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.displayName || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
            >
              <FiLogOut className="mr-3 w-4 h-4 opacity-75" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
