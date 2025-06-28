import { Search, Filter, X } from 'lucide-react';

export const JournalFilters = ({
  searchTerm,
  onSearchChange,
  selectedMoodFilter,
  onMoodFilterChange,
  moods,
  onClearFilters
}) => {
  const hasActiveFilters = searchTerm || selectedMoodFilter !== 'all';
  
  return (
    <div className="bg-background-secondary/80 backdrop-blur-lg rounded-2xl p-6 border border-background-tertiary shadow-lg mb-8">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-text-tertiary" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search your journal entries..."
            className="block w-full pl-10 pr-4 py-3 bg-background-tertiary/70 border border-background-tertiary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-text-primary placeholder-text-tertiary"
          />
        </div>
        
        <div className="relative w-full md:w-48">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-text-tertiary" />
          </div>
          <select
            value={selectedMoodFilter}
            onChange={(e) => onMoodFilterChange(e.target.value)}
            className="appearance-none block w-full pl-10 pr-10 py-3 bg-background-tertiary/70 border border-background-tertiary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-text-primary cursor-pointer"
          >
            <option value="all">All Moods</option>
            {Object.entries(moods).map(([key, mood]) => (
              <option key={key} value={key}>
                {mood.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-tertiary">
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
            className="text-xs text-primary-500 hover:text-primary-600 flex items-center"
          >
            <X className="w-3 h-3 mr-1" />
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};
