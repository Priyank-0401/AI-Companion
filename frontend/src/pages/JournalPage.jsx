import { useState, useEffect } from 'react';
import { 
  Plus, 
  Smile, 
  Meh, 
  Frown, 
  Heart, 
  Sparkles,
  FileText,
  Mic,
  Video,
  X
} from 'lucide-react';
import { useTheme } from '../contexts/useTheme';
import { journalService } from '../services/journalService';
import { auth } from '../config/firebase';
import { JournalHeader } from '../components/journal/JournalHeader';
import { JournalFilters } from '../components/journal/JournalFilters';
import { JournalEntryList } from '../components/journal/JournalEntryList';
import { JournalEditor } from '../components/journal/JournalEditor';
import { JournalEntryViewer } from '../components/journal/JournalEntryViewer';
import { Notification } from '../components/journal/Notification';
import { EntryTypeSelector } from '../components/journal/EntryTypeSelector';
import { MediaRecorderComponent } from '../components/journal/MediaRecorder';

// Mood configuration
const MOODS = {
  positive: { 
    icon: <Smile className="w-6 h-6" />, 
    label: 'Positive',
    color: 'from-emerald-400 to-green-500',
    bg: 'bg-emerald-500/20' 
  },
  neutral: { 
    icon: <Meh className="w-6 h-6" />, 
    label: 'Neutral',
    color: 'from-blue-400 to-blue-500',
    bg: 'bg-blue-500/20' 
  },
  reflective: { 
    icon: <Sparkles className="w-6 h-6" />, 
    label: 'Reflective',
    color: 'from-purple-400 to-purple-500',
    bg: 'bg-purple-500/20' 
  },
  challenging: { 
    icon: <Frown className="w-6 h-6" />, 
    label: 'Challenging',
    color: 'from-orange-400 to-red-500',
    bg: 'bg-orange-500/20' 
  },
  grateful: { 
    icon: <Heart className="w-6 h-6" />, 
    label: 'Grateful',
    color: 'from-pink-400 to-rose-500',
    bg: 'bg-pink-500/20' 
  }
};

// Load entries from Firebase
const loadEntriesFromFirebase = async () => {
  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      console.log('User not authenticated, returning empty entries');
      return [];
    }
    
    const entries = await journalService.getEntries();
    return entries.map(entry => ({
      ...entry,
      // Ensure date field exists for backward compatibility
      date: entry.createdAt
    }));
  } catch (error) {
    console.error('Error loading entries from Firebase:', error);
    return [];
  }
};

const JournalPage = () => {
  // Theme and state management
  const { theme } = useTheme();
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [entryType, setEntryType] = useState(null); // 'text', 'audio', 'video'
  const [showEntrySelector, setShowEntrySelector] = useState(false);
  
  // Theme colors
  const themeColors = {
    light: {
      bg: 'bg-gray-50',
      cardBg: 'bg-white',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      textTertiary: 'text-gray-500',
      border: 'border-gray-200',
      borderHover: 'hover:border-gray-300',
      inputBg: 'bg-white',
      inputBorder: 'border-gray-300',
      inputFocus: 'focus:border-blue-500 focus:ring-blue-500/20',
      hoverBg: 'hover:bg-gray-100',
      activeBg: 'bg-gray-100',
      divider: 'border-gray-200',
      shadow: 'shadow-sm',
      shadowHover: 'hover:shadow-md',
      overlay: 'bg-black/50',
      backdropBlur: 'backdrop-blur-sm',
    },
    dark: {
      bg: 'bg-gray-900',
      cardBg: 'bg-gray-800',
      text: 'text-gray-100',
      textSecondary: 'text-gray-300',
      textTertiary: 'text-gray-400',
      border: 'border-gray-700',
      borderHover: 'hover:border-gray-600',
      inputBg: 'bg-gray-700',
      inputBorder: 'border-gray-600',
      inputFocus: 'focus:border-blue-400 focus:ring-blue-400/20',
      hoverBg: 'hover:bg-gray-700',
      activeBg: 'bg-gray-700',
      divider: 'border-gray-700',
      shadow: 'shadow-lg shadow-black/20',
      shadowHover: 'hover:shadow-xl hover:shadow-black/30',
      overlay: 'bg-black/60',
      backdropBlur: 'backdrop-blur-sm',
    }
  };
  
  const colors = themeColors[theme] || themeColors.light;
  const [isWriting, setIsWriting] = useState(false);
  const [viewEntry, setViewEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState('all');
  const [notification, setNotification] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mediaBlob, setMediaBlob] = useState(null);

  // Cleanup function to ensure all media resources are released
  useEffect(() => {
    // This will run when the component unmounts
    return () => {
      console.log('JournalPage unmounting - cleaning up resources');
      
      // If there's an active media recording, stop it and clean up
      if (mediaBlob) {
        console.log('Cleaning up media blob');
        if (mediaBlob.blob && typeof mediaBlob.blob === 'object' && 'type' in mediaBlob.blob) {
          // If it's a blob with type, revoke its URL if it exists
          if (mediaBlob.blobUrl) {
            URL.revokeObjectURL(mediaBlob.blobUrl);
          }
        }
        setMediaBlob(null);
      }
      
      // Reset any media-related states
      setEntryType(null);
      setShowEntrySelector(false);
    };
  }, [mediaBlob]);

  // Load entries from Firebase when component mounts or auth state changes
  useEffect(() => {
    const loadEntries = async () => {
      try {
        setIsLoading(true);
        const firebaseEntries = await loadEntriesFromFirebase();
        setEntries(firebaseEntries);
      } catch (error) {
        console.error('Error loading entries:', error);
        showNotification('Failed to load journal entries', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    // Load entries when user is authenticated
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadEntries();
      } else {
        setEntries([]);
        setIsLoading(false);
      }
    });

    return () => {
      // Clean up auth subscription
      unsubscribe();
      console.log('Auth subscription cleaned up');
    };
  }, []);

  // Filter entries based on search term and mood filter
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       entry.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMood = selectedMoodFilter === 'all' || entry.mood === selectedMoodFilter;
    return matchesSearch && matchesMood;
  });

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle saving an entry (create or update)
  const handleSaveEntry = async (entryData) => {
    setIsSaving(true);
    
    try {
      const entryToSave = {
        ...entryData,
        type: entryType || 'text',
        ...(mediaBlob && { media: [mediaBlob] })
      };

      if (entryData.id) {
        // Update existing entry
        const updatedEntry = await journalService.updateEntry(entryData.id, entryToSave);
        setEntries(prev => prev.map(entry => 
          entry.id === entryData.id ? { 
            ...updatedEntry,
            date: updatedEntry.createdAt // For compatibility
          } : entry
        ));
        showNotification('Entry updated successfully', 'success');
      } else {
        // Create new entry
        const newEntry = await journalService.createEntry(entryToSave);
        setEntries(prev => [{
          ...newEntry,
          date: newEntry.createdAt // For compatibility
        }, ...prev]);
        showNotification('New entry created', 'success');
      }
      
      // Reset states
      setIsWriting(false);
      setEditingEntry(null);
      setEntryType(null);
      setMediaBlob(null);
    } catch (error) {
      console.error('Error saving entry:', error);
      showNotification('Failed to save entry', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle media recording completion
  const handleMediaRecorded = (mediaData) => {
    // Extract the actual blob from mediaData and store it
    setMediaBlob(mediaData.blob);
    setEntryType(mediaData.type);
    setIsWriting(true);
  };

  // Handle deleting an entry
  const handleDeleteEntry = async (id) => {
    try {
      await journalService.deleteEntry(id);
      setEntries(prev => prev.filter(entry => entry.id !== id));
      if (viewEntry?.id === id) {
        setViewEntry(null);
      }
      showNotification('Entry deleted', 'success');
    } catch (error) {
      console.error('Error deleting entry:', error);
      showNotification('Failed to delete entry', 'error');
    }
  };

  // Handle viewing an entry
  const handleViewEntry = (entry) => {
    setViewEntry(entry);
  };

  // Handle editing an entry
  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setViewEntry(null);
    setEntryType(entry.type || 'text');
    setMediaBlob(entry.media?.[0] || null);
    setIsWriting(true);
  };

  // Handle clearing all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedMoodFilter('all');
  };

  // Handle new entry button click
  const handleNewEntryClick = () => {
    setShowEntrySelector(true);
  };

  // Handle entry type selection
  const handleEntryTypeSelect = (type) => {
    setEntryType(type);
    setShowEntrySelector(false);
    
    if (type === 'text') {
      setIsWriting(true);
    }
    // For audio/video, we'll show the recorder first
  };

  // Handle canceling entry creation
  const handleCancelEntry = () => {
    setEntryType(null);
    setMediaBlob(null);
    setIsWriting(false);
    setEditingEntry(null);
  };

  return (
    <div className={`min-h-screen ${colors.bg} ${colors.text} transition-colors duration-200`}>
      {/* Notification */}
      {notification && (
        <Notification 
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
          theme={theme}
        />
      )}

      {/* Entry Type Selector */}
      {showEntrySelector && (
        <EntryTypeSelector 
          isOpen={showEntrySelector}
          onClose={() => setShowEntrySelector(false)}
          onSelect={handleEntryTypeSelect}
          theme={theme}
        />
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <JournalHeader 
          entryCount={filteredEntries.length} 
          onNewEntry={handleNewEntryClick}
          theme={theme}
        />

        {/* Search and Filter */}
        <JournalFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedMoodFilter={selectedMoodFilter}
          onMoodFilterChange={setSelectedMoodFilter}
          moods={MOODS}
          onClearFilters={handleClearFilters}
          theme={theme}
        />

        {/* Entries List */}
        <JournalEntryList
          entries={filteredEntries}
          moods={MOODS}
          searchTerm={searchTerm}
          selectedMoodFilter={selectedMoodFilter}
          onEntryClick={setViewEntry}
          onDelete={handleDeleteEntry}
          onView={handleViewEntry}
          theme={theme}
        />
      </div>

      {/* Media Recorder */}
      {entryType && ['audio', 'video'].includes(entryType) && !isWriting && (
        <div className={`fixed inset-0 ${colors.overlay} ${colors.backdropBlur} z-50 flex items-center justify-center p-4`}>
          <div className={`${colors.cardBg} rounded-2xl w-full max-w-2xl overflow-hidden ${colors.shadow} border ${colors.border}`}>
            <div className={`px-6 py-5 border-b ${colors.divider} ${colors.cardBg} ${colors.backdropBlur}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${colors.text}`}>
                  New {entryType === 'audio' ? 'Audio' : 'Video'} Entry
                </h2>
                <button
                  onClick={handleCancelEntry}
                  className="p-1.5 rounded-lg hover:bg-background-tertiary text-text-tertiary hover:text-text-primary transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className={`text-sm ${colors.textSecondary} mt-1`}>
                Record your {entryType} entry below
              </p>
            </div>
            <div className="p-6">
              <MediaRecorderComponent
                type={entryType}
                onRecordingComplete={handleMediaRecorded}
                onCancel={handleCancelEntry}
              />
            </div>
          </div>
        </div>
      )}

      {/* Entry Editor Modal */}
      {isWriting && (
        <JournalEditor
          entry={editingEntry || { 
            title: '', 
            content: '', 
            mood: 'neutral', 
            tags: [],
            type: entryType || 'text',
            media: mediaBlob ? [mediaBlob] : []
          }}
          moods={MOODS}
          onSave={handleSaveEntry}
          onCancel={handleCancelEntry}
          isSaving={isSaving}
          theme={theme}
        />
      )}

      {/* Entry Viewer Modal */}
      {viewEntry && (
        <JournalEntryViewer
          entry={viewEntry}
          moods={MOODS}
          onEdit={() => handleEditEntry(viewEntry)}
          onClose={() => setViewEntry(null)}
          theme={theme}
        />
      )}
    </div>
  );
};

export default JournalPage;
