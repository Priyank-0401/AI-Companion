import { useState, useEffect } from 'react';
import { X, Save, Clock, Mic, Video, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/useTheme';
import { MediaRecorderComponent } from './MediaRecorder';
import { MediaAttachment } from './MediaAttachment';

export const JournalEditor = ({
  entry,
  moods,
  onSave,
  onCancel,
  isSaving = false
}) => {
  const { theme } = useTheme();
  
  // Theme colors
  const themeColors = {
    light: {
      overlay: 'bg-black/40',
      backdrop: 'backdrop-blur-md',
      cardBg: 'bg-white',
      border: 'border-gray-200',
      headerBg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
      text: 'text-gray-900',
      textSecondary: 'text-gray-700',
      textTertiary: 'text-gray-500',
      inputBg: 'bg-gray-50',
      inputBorder: 'border-gray-300',
      inputFocus: 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white',
      textareaBg: 'bg-gray-50',
      textareaFocus: 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white',
      hoverBg: 'hover:bg-gray-50',
      buttonText: 'text-gray-600',
      buttonHover: 'hover:text-gray-800 hover:bg-gray-100',
      buttonPrimary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl',
      buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300',
      buttonDanger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg',
      divider: 'border-gray-200',
      shadow: 'shadow-2xl shadow-gray-500/10',
      selectBg: 'bg-gray-50',
      selectBorder: 'border-gray-300',
      selectFocus: 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
      moodButton: 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50',
      moodButtonActive: 'border-blue-500 bg-blue-50 shadow-md',
      moodIcon: 'bg-gray-100',
      moodIconActive: 'bg-blue-100',
      labelText: 'text-gray-800',
      placeholderText: 'placeholder-gray-400',
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
      inputBg: 'bg-gray-700',
      inputBorder: 'border-gray-600',
      inputFocus: 'focus:border-blue-400 focus:ring-blue-400/20',
      hoverBg: 'hover:bg-gray-700',
      buttonText: 'text-gray-400',
      buttonHover: 'hover:text-gray-200',
      buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
      buttonSecondary: 'bg-gray-700 hover:bg-gray-600 text-gray-300',
      buttonDanger: 'bg-red-600 hover:bg-red-700 text-white',
      divider: 'border-gray-700',
      shadow: 'shadow-2xl shadow-black/50',
      selectBg: 'bg-gray-700',
      selectBorder: 'border-gray-600',
    }
  };
  
  const colors = themeColors[theme] || themeColors.light;
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [mood, setMood] = useState(entry?.mood || 'neutral');
  const [tags, setTags] = useState(entry?.tags?.join(', ') || '');
  const [media, setMedia] = useState(entry?.media || []);
  const [entryType, setEntryType] = useState(entry?.type || 'text');
  const [showMediaRecorder, setShowMediaRecorder] = useState(false);

  useEffect(() => {
    if (entry) {
      setTitle(entry.title || '');
      setContent(entry.content || '');
      setMood(entry.mood || 'neutral');
      setTags(entry.tags?.join(', ') || '');
      setMedia(entry.media || []);
      setEntryType(entry.type || 'text');
    }
  }, [entry]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...entry,
      title: title.trim(),
      content: content.trim(),
      mood,
      type: entryType,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      media
    });
  };

  // Check if we should show the content field
  const showContentField = entryType === 'text' || entryType === 'video';
  
  // Check if we should show media controls
  const showMediaControls = entryType === 'audio' || entryType === 'video';

  const getWordCount = (text) => {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  };

  const getReadingTime = (text) => {
    const wordsPerMinute = 200;
    const wordCount = getWordCount(text);
    return Math.ceil(wordCount / wordsPerMinute) || 1;
  };

  // Form validation: title is always required, plus either content or media
  const isFormValid = title.trim() && (content.trim() || media.length > 0);

  return (
    <div className={`fixed inset-0 ${colors.overlay} ${colors.backdrop} z-50 flex items-center justify-center p-4`}>
      <div className={`${colors.cardBg} rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden ${colors.shadow} border ${colors.border}`}>
        <div className={`px-6 py-5 border-b ${colors.divider} ${colors.headerBg} ${colors.backdrop}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-bold ${colors.text}`}>
              {entry?.id ? 'Edit Entry' : 'New Journal Entry'}
            </h2>
            <button
              onClick={onCancel}
              className={`p-1.5 rounded-lg ${colors.hoverBg} ${colors.buttonText} ${colors.buttonHover} transition-colors`}
              aria-label="Close editor"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Title Input */}
            <div className="space-y-2">
              <label htmlFor="entry-title" className={`block text-sm font-medium ${colors.labelText}`}>
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="entry-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your entry a title..."
                className={`w-full px-4 py-3 ${colors.inputBg} border ${colors.inputBorder} rounded-xl focus:outline-none ${colors.inputFocus} ${colors.text} ${colors.placeholderText} transition-all duration-200`}
                autoFocus
                required
              />
            </div>

            {/* Mood Selection */}
            <div className="space-y-3">
              <span className={`block text-sm font-medium ${colors.labelText}`}>
                How are you feeling?
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {Object.entries(moods).map(([key, moodData]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMood(key)}
                    className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 ${
                      mood === key
                        ? colors.moodButtonActive
                        : colors.moodButton
                    }`}
                    aria-pressed={mood === key}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                      mood === key ? colors.moodIconActive : colors.moodIcon
                    }`}>
                      <span className={mood === key ? 'text-blue-600' : colors.textSecondary}>
                        {moodData.icon}
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${
                      mood === key ? 'text-blue-600' : colors.textSecondary
                    }`}>
                      {moodData.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Input */}
            {showContentField && (
              <div className="space-y-2">
                <label htmlFor="entry-content" className={`block text-sm font-medium ${colors.labelText}`}>
                  {entryType === 'video' ? 'Video Notes (Optional)' : 'Your Thoughts'} 
                  {entryType === 'text' && <span className="text-red-500">*</span>}
                  {entryType === 'text' && (
                    <div className={`text-xs ${colors.textTertiary} flex items-center mt-1`}>
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{getReadingTime(content)} min read</span>
                    </div>
                  )}
                </label>
                <div className="relative">
                  <textarea
                    id="entry-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={entryType === 'video' 
                      ? 'Add notes about your video...' 
                      : 'Write your thoughts here...'}
                    className={`w-full min-h-[200px] px-4 py-3 ${colors.textareaBg} border ${colors.inputBorder} rounded-xl focus:outline-none ${colors.textareaFocus} ${colors.text} ${colors.placeholderText} resize-none transition-all duration-200`}
                    required={entryType === 'text'}
                  />
                  <div className={`absolute bottom-3 right-3 text-xs ${colors.textTertiary}`}>
                    {content.length} characters • {getWordCount(content)} words
                  </div>
                </div>
              </div>
            )}

            {/* Media Attachments */}
            {showMediaControls && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${colors.labelText}`}>
                    {entryType === 'audio' ? 'Audio Recording' : 'Video Recording'}
                  </span>
                  {media.length === 0 && !showMediaRecorder && (
                    <button
                      type="button"
                      onClick={() => setShowMediaRecorder(true)}
                      className="px-3 py-1.5 text-sm bg-primary-500/10 text-primary-500 hover:bg-primary-500/20 rounded-lg transition-colors flex items-center"
                    >
                      <Mic className="w-4 h-4 mr-1.5" />
                      {entryType === 'audio' ? 'Record Audio' : 'Record Video'}
                    </button>
                  )}
                </div>

                {media.length > 0 ? (
                  <div className="mt-2">
                    <MediaAttachment 
                      media={media[0]} 
                      onRemove={() => setMedia([])}
                      showRemove={!entry?.id} // Don't allow removing media when editing existing entry
                    />
                  </div>
                ) : showMediaRecorder ? (
                  <div className="mt-4 p-4 bg-background-tertiary/50 rounded-xl">
                    <MediaRecorderComponent
                      type={entryType}
                      onRecordingComplete={(newMedia) => {
                        // Convert blob to URL for preview in MediaAttachment
                        const mediaWithUrl = {
                          ...newMedia,
                          url: URL.createObjectURL(newMedia.blob)
                        };
                        setMedia([mediaWithUrl]);
                        setShowMediaRecorder(false);
                      }}
                      onCancel={() => setShowMediaRecorder(false)}
                    />
                  </div>
                ) : (
                  <div className="p-6 border-2 border-dashed border-background-tertiary/50 rounded-xl text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3">
                      {entryType === 'audio' ? (
                        <Mic className="w-6 h-6" />
                      ) : (
                        <Video className="w-6 h-6" />
                      )}
                    </div>
                    <h4 className={`text-sm font-medium ${colors.labelText} mb-1`}>
                      No {entryType} recorded yet
                    </h4>
                    <p className={`text-xs ${colors.textTertiary} mb-4`}>
                      {entryType === 'audio' 
                        ? 'Record your audio entry to get started.' 
                        : 'Record your video entry to get started.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowMediaRecorder(true)}
                      className="px-4 py-2 text-sm bg-primary-500 text-white hover:bg-primary-600 rounded-lg transition-colors flex items-center mx-auto"
                    >
                      {entryType === 'audio' ? 'Record Audio' : 'Record Video'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tags Input */}
            <div className="space-y-2">
              <label htmlFor="entry-tags" className={`block text-sm font-medium ${colors.labelText}`}>
                Tags (comma separated)
              </label>
              <input
                id="entry-tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., gratitude, reflection, goals"
                className={`w-full px-4 py-3 ${colors.inputBg} border ${colors.inputBorder} rounded-xl focus:outline-none ${colors.inputFocus} ${colors.text} ${colors.placeholderText} transition-all duration-200`}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`p-6 pt-4 border-t ${colors.divider} ${colors.headerBg} ${colors.backdrop}`}>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className={`px-5 py-2.5 rounded-xl ${colors.buttonSecondary} transition-all duration-200 font-medium ${colors.buttonSecondaryHover}`}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormValid || isSaving}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                  !isFormValid || isSaving
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : colors.buttonPrimary
                }`}
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{entry?.id ? 'Update Entry' : 'Save Entry'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
