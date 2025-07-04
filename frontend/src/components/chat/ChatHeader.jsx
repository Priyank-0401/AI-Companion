import { FiMenu, FiSettings, FiUser, FiLogOut } from 'react-icons/fi';
import useAuth from '../../auth/hooks/useAuth';

export const ChatHeader = ({ onMenuClick, onSettingsClick }) => {
  const { user, logout } = useAuth();

  return (
    <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 mr-2"
          aria-label="Toggle menu"
        >
          <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white">AI Companion</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={onSettingsClick}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Settings"
        >
          <FiSettings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="relative group">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-medium cursor-pointer">
            {user?.displayName?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FiLogOut className="mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
