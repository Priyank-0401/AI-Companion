import { useState, useEffect } from 'react';
import { X, Save, Clock, Mic, Video, Image as ImageIcon, Trash2 } from 'lucide-react';
import { MediaRecorderComponent } from './MediaRecorder';
import { MediaAttachment } from './MediaAttachment';

export const JournalEditor = ({
  entry,
  moods,
  onSave,
  onCancel,
  isSaving = false
}) => {
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

  const isFormValid = title.trim() && content.trim();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background-secondary rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-background-tertiary">
        <div className="px-6 py-5 border-b border-background-tertiary bg-background-secondary/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text-primary">
              {entry?.id ? 'Edit Entry' : 'New Journal Entry'}
            </h2>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg hover:bg-background-tertiary text-text-tertiary hover:text-text-primary transition-colors"
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
              <label htmlFor="entry-title" className="block text-sm font-medium text-text-primary">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="entry-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your entry a title..."
                className="w-full px-4 py-3 bg-background-tertiary/70 border border-background-tertiary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-text-primary placeholder-text-tertiary"
                autoFocus
                required
              />
            </div>

            {/* Mood Selection */}
            <div className="space-y-3">
              <span className="block text-sm font-medium text-text-primary">
                How are you feeling?
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {Object.entries(moods).map(([key, moodData]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMood(key)}
                    className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                      mood === key
                        ? 'border-primary-500 bg-primary-500/10 scale-105'
                        : 'border-background-tertiary hover:border-primary-500/50 bg-background-tertiary/50'
                    }`}
                    aria-pressed={mood === key}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      mood === key ? 'bg-primary-500/10' : 'bg-background-tertiary'
                    }`}>
                      <span className={mood === key ? 'text-primary-500' : 'text-text-secondary'}>
                        {moodData.icon}
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${
                      mood === key ? 'text-primary-500' : 'text-text-secondary'
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
                <label htmlFor="entry-content" className="block text-sm font-medium text-text-primary">
                  {entryType === 'video' ? 'Video Notes' : 'Your Thoughts'} 
                  {entryType === 'text' && <span className="text-red-500">*</span>}
                  {entryType === 'text' && (
                    <div className="text-xs text-text-tertiary flex items-center mt-1">
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
                    className="w-full min-h-[200px] px-4 py-3 bg-background-tertiary/70 border border-background-tertiary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-text-primary placeholder-text-tertiary resize-none"
                    required={entryType === 'text'}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-text-tertiary">
                    {content.length} characters • {getWordCount(content)} words
                  </div>
                </div>
              </div>
            )}

            {/* Media Attachments */}
            {showMediaControls && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">
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
                        setMedia([newMedia]);
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
                    <h4 className="text-sm font-medium text-text-primary mb-1">
                      No {entryType} recorded yet
                    </h4>
                    <p className="text-xs text-text-tertiary mb-4">
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
              <label htmlFor="entry-tags" className="block text-sm font-medium text-text-primary">
                Tags (comma separated)
              </label>
              <input
                id="entry-tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., gratitude, reflection, goals"
                className="w-full px-4 py-3 bg-background-tertiary/70 border border-background-tertiary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-text-primary placeholder-text-tertiary"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 pt-4 border-t border-background-tertiary bg-background-secondary/80 backdrop-blur-sm">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2 rounded-xl border border-background-tertiary text-text-secondary hover:bg-background-tertiary/50 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormValid || isSaving}
                className={`px-5 py-2 rounded-xl font-medium transition-colors flex items-center space-x-2 ${
                  !isFormValid || isSaving
                    ? 'bg-background-tertiary text-text-tertiary cursor-not-allowed'
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
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
