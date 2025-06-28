import { FileText, Mic, Video, Plus } from 'lucide-react';

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

export const EntryTypeSelector = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background-secondary rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-background-tertiary">
        <div className="px-6 py-5 border-b border-background-tertiary bg-background-secondary/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text-primary">
              New Journal Entry
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-background-tertiary text-text-tertiary hover:text-text-primary transition-colors"
              aria-label="Close"
            >
              <Plus className="w-5 h-5 transform rotate-45" />
            </button>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Choose how you'd like to create your entry
          </p>
        </div>

        <div className="p-6 grid gap-4 grid-cols-1">
          {entryTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => onSelect(type.id)}
              className={`w-full h-24 p-3 rounded-xl border border-background-tertiary ${type.bg} ${type.hover} transition-colors text-left flex items-center space-x-3 group`}
            >
              <div className={`p-2 rounded-lg ${type.bg} ${type.color} group-hover:opacity-90 transition-opacity flex-shrink-0`}>
                {type.icon}
              </div>
              <div className="flex-1 min-w-0 -mt-1">
                <h3 className={`font-medium text-sm text-text-primary ${type.color} group-hover:opacity-90 transition-opacity truncate`}>
                  {type.title}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
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
