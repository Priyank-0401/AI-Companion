import { Plus } from 'lucide-react';

export const JournalHeader = ({ entryCount, onNewEntry, theme = 'light' }) => {
  const themeClasses = {
    light: {
      title: 'text-gray-900',
      subtitle: 'text-gray-600',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      buttonHover: 'hover:bg-blue-700',
    },
    dark: {
      title: 'text-white',
      subtitle: 'text-gray-300',
      button: 'bg-blue-500 hover:bg-blue-600 text-white',
      buttonHover: 'hover:bg-blue-600',
    }
  };
  
  const colors = themeClasses[theme] || themeClasses.light;
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div>
        <h1 className={`text-3xl font-bold ${colors.title}`}>Journal</h1>
        <p className={`${colors.subtitle} mt-2`}>
          {entryCount} {entryCount === 1 ? 'entry' : 'entries'} found
        </p>
      </div>
      <button
        onClick={onNewEntry}
        className={`mt-4 md:mt-0 flex items-center space-x-2 ${colors.button} px-5 py-2.5 rounded-xl transition-colors`}
      >
        <Plus className="w-5 h-5" />
        <span>New Entry</span>
      </button>
    </div>
  );
};
