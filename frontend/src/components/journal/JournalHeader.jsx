import { Plus } from 'lucide-react';

export const JournalHeader = ({ entryCount, onNewEntry }) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
    <div>
      <h1 className="text-3xl font-bold text-text-primary">Journal</h1>
      <p className="text-text-secondary mt-2">
        {entryCount} {entryCount === 1 ? 'entry' : 'entries'} found
      </p>
    </div>
    <button
      onClick={onNewEntry}
      className="mt-4 md:mt-0 flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl transition-colors"
    >
      <Plus className="w-5 h-5" />
      <span>New Entry</span>
    </button>
  </div>
);
