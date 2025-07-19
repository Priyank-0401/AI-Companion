import { FileText, Plus } from 'lucide-react';
import { useTheme } from '../../contexts/useTheme';
import { JournalEntryCard } from './JournalEntryCard';

export const JournalEntryList = ({
  entries,
  moods,
  searchTerm,
  selectedMoodFilter,
  onEntryClick,
  onDelete,
  onNewEntry,
  theme
}) => {
  const { theme: contextTheme } = useTheme();
  const currentTheme = theme || contextTheme;
  
  // Theme colors
  const themeColors = {
    light: {
      emptyStateBg: 'bg-gray-100',
      emptyStateIcon: 'text-gray-400',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      buttonPrimary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl',
    },
    dark: {
      emptyStateBg: 'bg-gray-700',
      emptyStateIcon: 'text-gray-400',
      text: 'text-gray-100',
      textSecondary: 'text-gray-300',
      buttonPrimary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl',
    }
  };
  
  const colors = themeColors[currentTheme] || themeColors.light;
  if (entries.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <div className={`mx-auto w-16 h-16 rounded-full ${colors.emptyStateBg} flex items-center justify-center mb-4`}>
          <FileText className={`w-8 h-8 ${colors.emptyStateIcon}`} />
        </div>
        <h3 className={`text-lg font-medium ${colors.text} mb-1`}>No entries found</h3>
        <p className={`${colors.textSecondary} max-w-md mx-auto`}>
          {searchTerm || selectedMoodFilter !== 'all' 
            ? 'Try adjusting your search or filter'
            : 'Start by creating your first journal entry'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <JournalEntryCard
          key={entry.id}
          entry={entry}
          moods={moods}
          onClick={() => onEntryClick(entry)}
          onDelete={onDelete}
          theme={currentTheme}
        />
      ))}
    </div>
  );
};
