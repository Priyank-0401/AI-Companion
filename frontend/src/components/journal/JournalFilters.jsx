import { Search, Filter, X } from 'lucide-react';

export const JournalFilters = ({
  searchTerm,
  onSearchChange,
  selectedMoodFilter,
  onMoodFilterChange,
  moods,
  onClearFilters,
  theme = 'light'
}) => {
  const themeClasses = {
    light: {
      bg: 'bg-white',
      border: 'border-gray-200',
      inputBg: 'bg-gray-50',
      inputBorder: 'border-gray-200',
      inputText: 'text-gray-800',
      placeholder: 'text-gray-400',
      icon: 'text-gray-400',
      selectBg: 'bg-white',
      selectText: 'text-gray-800',
      clearBtn: 'text-gray-600 hover:bg-gray-100',
      clearBtnText: 'text-gray-600',
      divider: 'border-gray-200',
    },
    dark: {
      bg: 'bg-gray-800',
      border: 'border-gray-700',
      inputBg: 'bg-gray-700',
      inputBorder: 'border-gray-600',
      inputText: 'text-gray-100',
      placeholder: 'text-gray-400',
      icon: 'text-gray-400',
      selectBg: 'bg-gray-700',
      selectText: 'text-gray-100',
      clearBtn: 'text-gray-300 hover:bg-gray-700',
      clearBtnText: 'text-gray-300',
      divider: 'border-gray-700',
    }
  };
  
  const colors = themeClasses[theme] || themeClasses.light;
  const hasActiveFilters = searchTerm || selectedMoodFilter !== 'all';
  
  return (
    <div className={`${colors.bg} rounded-2xl p-6 border ${colors.border} shadow-lg mb-8`}>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${colors.icon}`}>
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search your journal entries..."
            className={`block w-full pl-10 pr-4 py-3 ${colors.inputBg} border ${colors.inputBorder} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.inputText} placeholder-${colors.placeholder.replace('text-', '')} transition-colors`}
          />
        </div>
        
        <div className="relative w-full md:w-48">
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${colors.icon}`}>
            <Filter className="h-5 w-5" />
          </div>
          <select
            value={selectedMoodFilter}
            onChange={(e) => onMoodFilterChange(e.target.value)}
            className={`appearance-none block w-full pl-10 pr-10 py-3 ${colors.selectBg} border ${colors.inputBorder} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.selectText} cursor-pointer transition-colors`}
          >
            <option value="all">All Moods</option>
            {Object.entries(moods).map(([key, mood]) => (
              <option key={key} value={key}>
                {mood.label}
              </option>
            ))}
          </select>
          <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${colors.icon}`}>
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>
      
      {hasActiveFilters && (
        <div className="mt-4 flex items-center space-x-2">
          <button
            onClick={onClearFilters}
            className={`flex items-center justify-center px-4 py-3 text-sm font-medium ${colors.clearBtnText} hover:${colors.clearBtn.replace('hover:', '')} rounded-xl transition-colors`}
          >
            <X className="w-4 h-4 mr-1.5" />
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};
