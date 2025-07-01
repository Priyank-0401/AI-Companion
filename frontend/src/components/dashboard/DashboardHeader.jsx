import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

const DashboardHeader = () => {
  const { currentUser } = useAuth();
  
  return (
    <header className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {currentUser?.displayName || 'Friend'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="inline-flex items-center px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              Your wellness dashboard
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
