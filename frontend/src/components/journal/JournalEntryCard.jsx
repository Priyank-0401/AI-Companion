import { Clock } from 'lucide-react';

export const JournalEntryCard = ({ entry, moods, onClick, onEdit, onDelete }) => {
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric',
      month: 'short',
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getReadingTime = (text) => {
    const wordsPerMinute = 200;
    const wordCount = text.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute) || 1;
  };

  return (
    <div 
      className="bg-background-secondary/80 backdrop-blur-lg rounded-2xl p-6 border border-background-tertiary hover:border-primary-500/30 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-text-primary line-clamp-2">
          {entry.title || 'Untitled Entry'}
        </h3>
        <div className="flex space-x-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${moods[entry.mood]?.bg} text-text-primary`}>
            {moods[entry.mood]?.label}
          </div>
        </div>
      </div>
      
      <p className="text-text-secondary text-sm mb-4 line-clamp-3">
        {entry.content}
      </p>
      
      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <span>{formatDate(entry.date)}</span>
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          <span>{getReadingTime(entry.content)} min read</span>
        </div>
      </div>
      
      {entry.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-background-tertiary">
          {entry.tags.slice(0, 3).map((tag, i) => (
            <span 
              key={i}
              className="px-2 py-0.5 bg-background-tertiary rounded-full text-xs text-text-secondary"
            >
              {tag}
            </span>
          ))}
          {entry.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-background-tertiary rounded-full text-xs text-text-tertiary">
              +{entry.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
