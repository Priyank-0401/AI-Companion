import { FileText, Plus } from 'lucide-react';
import { JournalEntryCard } from './JournalEntryCard';

export const JournalEntryList = ({
  entries,
  moods,
  searchTerm,
  selectedMoodFilter,
  onEntryClick,
  onNewEntry
}) => {
  if (entries.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <div className="mx-auto w-16 h-16 rounded-full bg-background-tertiary flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-text-tertiary" />
        </div>
        <h3 className="text-lg font-medium text-text-primary mb-1">No entries found</h3>
        <p className="text-text-secondary max-w-md mx-auto">
          {searchTerm || selectedMoodFilter !== 'all' 
            ? 'Try adjusting your search or filter'
            : 'Start by creating your first journal entry'}
        </p>
        {!searchTerm && selectedMoodFilter === 'all' && (
          <button
            onClick={onNewEntry}
            className="mt-4 inline-flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        )}
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
        />
      ))}
    </div>
  );
};
