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

// Initial sample data
const getInitialEntries = () => {
  const savedEntries = localStorage.getItem('journalEntries');
  if (savedEntries) {
    try {
      return JSON.parse(savedEntries);
    } catch (e) {
      console.error('Failed to parse saved entries', e);
    }
  }
  
  return [
    {
      id: 1,
      date: new Date('2025-06-01').toISOString(),
      title: 'First Day of Summer',
      content: 'Today marks the beginning of summer, and I\'m feeling excited about the possibilities ahead. The weather is beautiful, and I spent some time in the garden this morning. The flowers are in full bloom, and the birds are singing. It\'s moments like these that make me appreciate the simple joys in life.',
      mood: 'positive',
      tags: ['gratitude', 'nature', 'summer']
    },
    {
      id: 2,
      date: new Date('2025-05-31').toISOString(),
      title: 'Reflection on Growth',
      content: 'Been thinking a lot about personal growth lately. It\'s amazing how much can change in just a few months when you\'re intentional about your development. I\'ve been working on being more present and mindful in my daily life, and I can already see the positive impact it\'s having on my relationships and overall well-being.',
      mood: 'neutral',
      tags: ['growth', 'reflection', 'mindfulness']
    },
    {
      id: 3,
      date: new Date('2025-05-28').toISOString(),
      title: 'Overcoming Challenges',
      content: 'Faced some unexpected challenges at work today. The project deadline was moved up, and we had to scramble to get everything done. While it was stressful, I\'m proud of how the team came together to deliver. It\'s in these challenging moments that we often discover our true strengths.',
      mood: 'challenging',
      tags: ['work', 'challenges', 'teamwork']
    }
  ];
};

const JournalPage = () => {
  // State management
  const [entries, setEntries] = useState(getInitialEntries);
  const [entryType, setEntryType] = useState(null); // 'text', 'audio', 'video'
  const [showEntrySelector, setShowEntrySelector] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [viewEntry, setViewEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState('all');
  const [notification, setNotification] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mediaBlob, setMediaBlob] = useState(null);

  // Save entries to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('journalEntries', JSON.stringify(entries));
    } catch (e) {
      console.error('Failed to save entries to localStorage', e);
    }
  }, [entries]);

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
  const handleSaveEntry = (entryData) => {
    setIsSaving(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      try {
        const entryToSave = {
          ...entryData,
          type: entryType || 'text',
          ...(mediaBlob && { media: [mediaBlob] })
        };

        if (entryData.id) {
          // Update existing entry
          setEntries(prev => prev.map(entry => 
            entry.id === entryData.id ? { 
              ...entry, 
              ...entryToSave,
              date: new Date().toISOString() 
            } : entry
          ));
          showNotification('Entry updated successfully', 'success');
        } else {
          // Create new entry
          const newEntry = {
            ...entryToSave,
            id: Date.now(),
            date: new Date().toISOString()
          };
          setEntries(prev => [newEntry, ...prev]);
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
    }, 500);
  };

  // Handle media recording completion
  const handleMediaRecorded = (mediaData) => {
    setMediaBlob(mediaData);
    setEntryType(mediaData.type);
    setIsWriting(true);
  };

  // Handle deleting an entry
  const handleDeleteEntry = (id) => {
    if (window.confirm('Are you sure you want to delete this entry? This cannot be undone.')) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
      if (viewEntry?.id === id) {
        setViewEntry(null);
      }
      showNotification('Entry deleted', 'success');
    }
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
    <div className="min-h-screen bg-background-primary overflow-y-auto pt-4 pb-20">
      {/* Notification */}
      <Notification 
        notification={notification} 
        onClose={() => setNotification(null)} 
      />

      {/* Entry Type Selector */}
      {showEntrySelector && (
        <EntryTypeSelector 
          onSelect={handleEntryTypeSelect}
          onClose={() => setShowEntrySelector(false)}
        />
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <JournalHeader 
          entryCount={filteredEntries.length} 
          onNewEntry={handleNewEntryClick}
        />

        {/* Search and Filter */}
        <JournalFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedMoodFilter={selectedMoodFilter}
          onMoodFilterChange={setSelectedMoodFilter}
          moods={MOODS}
          onClearFilters={handleClearFilters}
        />

        {/* Entries List */}
        <JournalEntryList
          entries={filteredEntries}
          moods={MOODS}
          searchTerm={searchTerm}
          selectedMoodFilter={selectedMoodFilter}
          onEntryClick={setViewEntry}
          onNewEntry={() => setIsWriting(true)}
        />
      </div>

      {/* Media Recorder */}
      {entryType && ['audio', 'video'].includes(entryType) && !isWriting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background-secondary rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-background-tertiary">
            <div className="px-6 py-5 border-b border-background-tertiary bg-background-secondary/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-text-primary">
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
              <p className="text-sm text-text-secondary mt-1">
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
        />
      )}

      {/* Entry Viewer Modal */}
      {viewEntry && (
        <JournalEntryViewer
          entry={viewEntry}
          moods={MOODS}
          onEdit={() => handleEditEntry(viewEntry)}
          onClose={() => setViewEntry(null)}
        />
      )}

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={() => setIsWriting(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary-500 hover:bg-primary-600 text-white shadow-lg flex items-center justify-center transition-colors"
        aria-label="New entry"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default JournalPage;
