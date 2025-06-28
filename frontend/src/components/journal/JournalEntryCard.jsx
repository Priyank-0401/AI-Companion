import { Clock, Play, Mic } from 'lucide-react';
import { MediaAttachment } from './MediaAttachment';

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

  // Get the first media item (if any)
  const firstMedia = entry.media?.[0];

  return (
    <div 
      className="bg-background-secondary/80 backdrop-blur-lg rounded-2xl overflow-hidden border border-background-tertiary hover:border-primary-500/30 transition-colors cursor-pointer flex flex-col h-full"
      onClick={onClick}
    >
      {/* Media Thumbnail */}
      {firstMedia && (
        <div className="relative h-32 bg-background-tertiary overflow-hidden">
          {firstMedia.type === 'video' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
            </div>
          ) : firstMedia.type === 'audio' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                <Mic className="w-5 h-5" />
              </div>
            </div>
          ) : null}
          {firstMedia.thumbnail && (
            <img 
              src={firstMedia.thumbnail} 
              alt="" 
              className="w-full h-full object-cover"
            />
          )}
          {entry.media.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              +{entry.media.length - 1} more
            </div>
          )}
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-text-primary line-clamp-2">
            {entry.title || 'Untitled Entry'}
          </h3>
          <div className="flex-shrink-0 ml-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${moods[entry.mood]?.bg} text-text-primary`}>
              {moods[entry.mood]?.label}
            </div>
          </div>
        </div>
        
        <p className="text-text-secondary text-sm mb-4 line-clamp-3 flex-1">
          {entry.content}
        </p>
      
        <div className="flex items-center justify-between text-xs text-text-tertiary mt-auto pt-3 border-t border-background-tertiary">
          <span>{formatDate(entry.date)}</span>
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            <span>{getReadingTime(entry.content)} min read</span>
            {entry.media?.length > 0 && (
              <span className="ml-2 flex items-center">
                {entry.media.some(m => m.type === 'video') && (
                  <Video className="w-3 h-3 mr-1 text-text-tertiary" />
                )}
                {entry.media.some(m => m.type === 'audio') && (
                  <Mic className="w-3 h-3 mr-1 text-text-tertiary" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
      
        {entry.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 px-5 pb-4 border-t border-background-tertiary">
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
