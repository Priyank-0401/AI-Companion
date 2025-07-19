import { FileText, Mic, Video, Plus } from 'lucide-react';
import { useTheme } from '../../contexts/useTheme';

const entryTypes = [
  {
    id: 'text',
    title: 'Text Entry',
    description: 'Write your thoughts in a traditional journal format',
    icon: <FileText className="w-6 h-6" />,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    hover: 'hover:bg-blue-500/20'
  },
  {
    id: 'audio',
    title: 'Audio Entry',
    description: 'Record your thoughts with your voice',
    icon: <Mic className="w-6 h-6" />,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    hover: 'hover:bg-purple-500/20'
  },
  {
    id: 'video',
    title: 'Video Entry',
    description: 'Record a video journal entry',
    icon: <Video className="w-6 h-6" />,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    hover: 'hover:bg-red-500/20'
  }
];

export const EntryTypeSelector = ({ onSelect, onClose, theme }) => {
  const { theme: contextTheme } = useTheme();
  const currentTheme = theme || contextTheme;
  
  // Theme colors
  const themeColors = {
    light: {
      overlay: 'bg-black/40',
      backdrop: 'backdrop-blur-md',
      cardBg: 'bg-white',
      border: 'border-gray-200',
      headerBg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      buttonText: 'text-gray-600',
      buttonHover: 'hover:text-gray-800 hover:bg-gray-100',
      divider: 'border-gray-200',
      shadow: 'shadow-2xl shadow-gray-500/10',
      buttonBg: 'bg-gray-50',
      buttonBorder: 'border-gray-200',
      buttonHoverBg: 'hover:bg-gray-100',
    },
    dark: {
      overlay: 'bg-black/60',
      backdrop: 'backdrop-blur-sm',
      cardBg: 'bg-gray-800',
      border: 'border-gray-700',
      headerBg: 'bg-gray-800/80',
      text: 'text-gray-100',
      textSecondary: 'text-gray-300',
      buttonText: 'text-gray-400',
      buttonHover: 'hover:text-gray-200 hover:bg-gray-700',
      divider: 'border-gray-700',
      shadow: 'shadow-2xl shadow-black/50',
      buttonBg: 'bg-gray-700',
      buttonBorder: 'border-gray-600',
      buttonHoverBg: 'hover:bg-gray-600',
    }
  };
  
  const colors = themeColors[currentTheme] || themeColors.light;
  return (
    <div className={`fixed inset-0 ${colors.overlay} ${colors.backdrop} z-50 flex items-center justify-center p-4`}>
      <div className={`${colors.cardBg} rounded-2xl w-full max-w-md overflow-hidden ${colors.shadow} border ${colors.border}`}>
        <div className={`px-6 py-5 border-b ${colors.divider} ${colors.headerBg} ${colors.backdrop}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-bold ${colors.text}`}>
              New Journal Entry
            </h2>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg ${colors.buttonHover} ${colors.buttonText} transition-colors`}
              aria-label="Close"
            >
              <Plus className="w-5 h-5 transform rotate-45" />
            </button>
          </div>
          <p className={`text-sm ${colors.textSecondary} mt-1`}>
            Choose how you'd like to create your entry
          </p>
        </div>

        <div className="p-6 grid gap-4 grid-cols-1">
          {entryTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => onSelect(type.id)}
              className={`w-full h-24 p-3 rounded-xl border ${colors.buttonBorder} ${colors.buttonBg} ${colors.buttonHoverBg} ${type.bg} ${type.hover} transition-all duration-200 text-left flex items-center space-x-3 group`}
            >
              <div className={`p-2 rounded-lg ${type.bg} ${type.color} group-hover:opacity-90 transition-opacity flex-shrink-0`}>
                {type.icon}
              </div>
              <div className="flex-1 min-w-0 -mt-1">
                <h3 className={`font-medium text-sm ${colors.text} ${type.color} group-hover:opacity-90 transition-opacity truncate`}>
                  {type.title}
                </h3>
                <p className={`text-xs ${colors.textSecondary} mt-0.5 line-clamp-2`}>
                  {type.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
