import { Play, Mic, Video as VideoIcon, X } from 'lucide-react';
import { useTheme } from '../../contexts/useTheme';

export const MediaAttachment = ({ media, onRemove, className = '', theme }) => {
  const { theme: contextTheme } = useTheme();
  const currentTheme = theme || contextTheme;
  
  // Theme colors
  const themeColors = {
    light: {
      bg: 'bg-gray-100',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      textTertiary: 'text-gray-500',
      audioBg: 'bg-blue-50',
      audioIcon: 'text-blue-600',
      removeBtn: 'bg-red-500 hover:bg-red-600 text-white',
    },
    dark: {
      bg: 'bg-gray-700',
      text: 'text-gray-100',
      textSecondary: 'text-gray-300',
      textTertiary: 'text-gray-400',
      audioBg: 'bg-blue-900/30',
      audioIcon: 'text-blue-400',
      removeBtn: 'bg-red-600 hover:bg-red-700 text-white',
    }
  };
  
  const colors = themeColors[currentTheme] || themeColors.light;
  const isVideo = media.type === 'video';
  const isAudio = media.type === 'audio';

  const renderThumbnail = () => {
    if (isVideo) {
      return (
        <div className="relative w-full h-full group">
          <video 
            src={media.url} 
            controls
            className="w-full h-full object-cover rounded-lg"
            preload="metadata"
          />
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className={`w-full p-4 ${colors.audioBg} rounded-lg flex items-center space-x-3`}>
          <div className={`w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center ${colors.audioIcon}`}>
            <Mic className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${colors.text} truncate`}>
              Audio Recording
            </p>
            <p className={`text-xs ${colors.textTertiary}`}>
              {formatDuration(media.duration)}
            </p>
          </div>
          <audio 
            src={media.url} 
            controls
            className="flex-1 max-w-[200px] h-10"
          />
        </div>
      );
    }

    return null;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative group ${className}`}>
      {renderThumbnail()}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 z-10"
          title="Remove media"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export const MediaPlaceholder = ({ type, onClick, className = '' }) => {
  const config = {
    audio: {
      icon: <Mic className="w-5 h-5" />,
      label: 'Add Audio',
      bg: 'bg-blue-500/10',
      text: 'text-blue-500',
      hover: 'hover:bg-blue-500/20'
    },
    video: {
      icon: <VideoIcon className="w-5 h-5" />,
      label: 'Add Video',
      bg: 'bg-red-500/10',
      text: 'text-red-500',
      hover: 'hover:bg-red-500/20'
    }
  }[type];

  return (
    <button
      onClick={onClick}
      className={`w-full h-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-background-tertiary ${config.bg} ${config.hover} transition-colors ${className}`}
    >
      <div className={`w-12 h-12 rounded-full ${config.bg} ${config.text} flex items-center justify-center mb-2`}>
        {config.icon}
      </div>
      <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
    </button>
  );
};
