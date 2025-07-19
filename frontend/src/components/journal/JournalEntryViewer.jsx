import { X, Edit, Clock, Play, Mic, Video as VideoIcon } from 'lucide-react';
import { useTheme } from '../../contexts/useTheme';
import { MediaAttachment } from './MediaAttachment';

export const JournalEntryViewer = ({ entry, moods, onEdit, onClose }) => {
  const { theme } = useTheme();
  
  // Theme colors
  const themeColors = {
    light: {
      overlay: 'bg-black/50',
      backdrop: 'backdrop-blur-sm',
      cardBg: 'bg-white',
      border: 'border-gray-200',
      headerBg: 'bg-white/80',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      textTertiary: 'text-gray-500',
      hoverBg: 'hover:bg-gray-100',
      buttonText: 'text-gray-500',
      buttonHover: 'hover:text-gray-700',
      divider: 'border-gray-200',
      tagBg: 'bg-gray-100',
      tagText: 'text-gray-700',
      mediaBg: 'bg-gray-50',
      shadow: 'shadow-2xl',
    },
    dark: {
      overlay: 'bg-black/60',
      backdrop: 'backdrop-blur-sm',
      cardBg: 'bg-gray-800',
      border: 'border-gray-700',
      headerBg: 'bg-gray-800/80',
      text: 'text-gray-100',
      textSecondary: 'text-gray-300',
      textTertiary: 'text-gray-400',
      hoverBg: 'hover:bg-gray-700',
      buttonText: 'text-gray-400',
      buttonHover: 'hover:text-gray-200',
      divider: 'border-gray-700',
      tagBg: 'bg-gray-700',
      tagText: 'text-gray-300',
      mediaBg: 'bg-gray-700/50',
      shadow: 'shadow-2xl shadow-black/50',
    }
  };
  
  const colors = themeColors[theme] || themeColors.light;
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
    <div className={`fixed inset-0 ${colors.overlay} ${colors.backdrop} z-50 flex items-center justify-center p-4`}>
      <div className={`${colors.cardBg} rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden ${colors.shadow} border ${colors.border}`}>
        <div className={`px-6 py-5 border-b ${colors.divider} ${colors.headerBg} ${colors.backdrop}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-bold ${colors.text}`}>Journal Entry</h2>
            <div className="flex space-x-2">
              <button
                onClick={onEdit}
                className={`p-1.5 rounded-lg ${colors.hoverBg} ${colors.buttonText} ${colors.buttonHover} transition-colors`}
                aria-label="Edit entry"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg ${colors.hoverBg} ${colors.buttonText} ${colors.buttonHover} transition-colors`}
                aria-label="Close viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div>
            <h3 className={`text-2xl font-bold ${colors.text} mb-2`}>{entry.title}</h3>
            
            <div className={`flex flex-wrap items-center gap-3 text-sm ${colors.textSecondary} mb-6`}>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${moods[entry.mood]?.bg} ${colors.text}`}>
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
            
            <div className={`prose max-w-none ${colors.text} text-base leading-relaxed whitespace-pre-line mb-6`}>
              {entry.content}
            </div>

            {/* Media Attachments */}
            {entry.media?.length > 0 && (
              <div className="mt-6">
                <h4 className={`text-sm font-medium ${colors.textSecondary} mb-3`}>Media</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {entry.media.map((mediaItem, index) => (
                    <div key={index} className={`${colors.mediaBg} rounded-xl overflow-hidden`}>
                      <MediaAttachment media={mediaItem} theme={theme} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {entry.tags?.length > 0 && (
              <div className={`mt-8 pt-6 border-t ${colors.divider}`}>
                <h4 className={`text-sm font-medium ${colors.textSecondary} mb-3`}>Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag, i) => (
                    <span 
                      key={i}
                      className={`px-3 py-1 ${colors.tagBg} rounded-full text-xs ${colors.tagText}`}
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
