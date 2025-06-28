import { X, Edit, Clock, Play, Mic, Video as VideoIcon } from 'lucide-react';
import { MediaAttachment } from './MediaAttachment';

export const JournalEntryViewer = ({ entry, moods, onEdit, onClose }) => {
  if (!entry) return null;

  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getReadingTime = (text) => {
    const wordsPerMinute = 200;
    const wordCount = text.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute) || 1;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background-secondary rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-background-tertiary">
        <div className="px-6 py-5 border-b border-background-tertiary bg-background-secondary/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text-primary">Journal Entry</h2>
            <div className="flex space-x-2">
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg hover:bg-background-tertiary text-text-tertiary hover:text-text-primary transition-colors"
                aria-label="Edit entry"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-background-tertiary text-text-tertiary hover:text-text-primary transition-colors"
                aria-label="Close viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div>
            <h3 className="text-2xl font-bold text-text-primary mb-2">{entry.title}</h3>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${moods[entry.mood]?.bg} text-text-primary`}>
                {moods[entry.mood]?.label}
              </span>
              <span>•</span>
              <span>{formatDate(entry.date)}</span>
              <span>•</span>
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1" />
                {getReadingTime(entry.content)} min read
              </span>
            </div>
            
            <div className="prose prose-invert max-w-none text-text-primary text-base leading-relaxed whitespace-pre-line mb-6">
              {entry.content}
            </div>

            {/* Media Attachments */}
            {entry.media?.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-text-secondary mb-3">Media</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {entry.media.map((mediaItem, index) => (
                    <div key={index} className="bg-background-tertiary/50 rounded-xl overflow-hidden">
                      <MediaAttachment media={mediaItem} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {entry.tags?.length > 0 && (
              <div className="mt-8 pt-6 border-t border-background-tertiary">
                <h4 className="text-sm font-medium text-text-secondary mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 bg-background-tertiary rounded-full text-xs text-text-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
