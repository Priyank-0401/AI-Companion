import { Clock, Play, Mic } from 'lucide-react';
import { MediaAttachment } from './MediaAttachment';

export const JournalEntryCard = ({ entry, moods, onClick, onEdit, onDelete, theme = 'light' }) => {
  const themeClasses = {
    light: {
      bg: 'bg-white',
      border: 'border-gray-200',
      hoverBorder: 'hover:border-blue-500',
      text: 'text-gray-800',
      textSecondary: 'text-gray-600',
      divider: 'border-gray-100',
      mediaBg: 'bg-gray-50',
      audioBg: 'bg-blue-50',
      audioIcon: 'text-blue-600',
      playButton: 'bg-white/80 text-gray-800',
      moodBg: 'bg-gray-100',
      moodText: 'text-gray-700',
      timeText: 'text-gray-500',
      actionHover: 'hover:bg-gray-100',
      actionText: 'text-gray-600',
    },
    dark: {
      bg: 'bg-gray-800',
      border: 'border-gray-700',
      hoverBorder: 'hover:border-blue-400',
      text: 'text-gray-100',
      textSecondary: 'text-gray-300',
      divider: 'border-gray-700',
      mediaBg: 'bg-gray-700',
      audioBg: 'bg-blue-900/30',
      audioIcon: 'text-blue-400',
      playButton: 'bg-white/20 text-white',
      moodBg: 'bg-gray-700',
      moodText: 'text-gray-200',
      timeText: 'text-gray-400',
      actionHover: 'hover:bg-gray-700',
      actionText: 'text-gray-300',
    }
  };
  
  const colors = themeClasses[theme] || themeClasses.light;
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
      className={`${colors.bg} rounded-xl overflow-hidden border ${colors.border} ${colors.hoverBorder} transition-colors cursor-pointer flex flex-col h-full`}
      onClick={onClick}
    >
      {/* Media Thumbnail */}
      {firstMedia && (
        <div className={`relative h-32 ${firstMedia.type === 'audio' ? colors.audioBg : colors.mediaBg} overflow-hidden`}>
          {firstMedia.type === 'video' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className={`w-10 h-10 rounded-full ${colors.playButton} backdrop-blur-sm flex items-center justify-center`}>
                <Play className="w-5 h-5" />
              </div>
            </div>
          ) : firstMedia.type === 'audio' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-10 h-10 rounded-full ${colors.audioBg} flex items-center justify-center ${colors.audioIcon}`}>
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

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className={`font-medium ${colors.text} line-clamp-1`}>
            {entry.title || 'Untitled Entry'}
          </h3>
          <span className={`text-xs px-2 py-1 rounded-full ${moods[entry.mood]?.bg} ${moods[entry.mood]?.color.replace('from-', 'text-').split(' ')[0]}`}>
            {moods[entry.mood]?.label || entry.mood}
          </span>
        </div>
        
        <p className={`text-sm ${colors.textSecondary} line-clamp-2 mb-3`}>
          {entry.content}
        </p>
        
        <div className={`mt-auto pt-2 border-t ${colors.divider} flex justify-between items-center`}>
          <div className={`flex items-center text-xs ${colors.timeText}`}>
            <Clock className="w-3.5 h-3.5 mr-1" />
            {formatDate(entry.date)}
            <span className="mx-1">•</span>
            {getReadingTime(entry.content)} min read
          </div>
          {entry.media?.length > 0 && (
            <div className="flex items-center">
              {entry.media.some(m => m.type === 'video') && (
                <Video className="w-3.5 h-3.5 ml-2" />
              )}
              {entry.media.some(m => m.type === 'audio') && (
                <Mic className="w-3.5 h-3.5 ml-2" />
              )}
            </div>
          )}
        </div>
      </div>
      
        {entry.tags?.length > 0 && (
          <div className={`flex flex-wrap gap-2 p-4 pt-3 border-t ${colors.divider}`}>
            {entry.tags.slice(0, 3).map((tag, i) => (
              <span 
                key={i}
                className={`px-2 py-0.5 rounded-full text-xs ${colors.moodBg} ${colors.textSecondary}`}
              >
                {tag}
              </span>
            ))}
            {entry.tags.length > 3 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${colors.moodBg} ${colors.textSecondary}`}>
                +{entry.tags.length - 3}
              </span>
            )}
          </div>
        )}
    </div>
  );
};
