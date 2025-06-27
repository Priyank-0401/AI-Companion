import { useState } from 'react';
import { useMoodTracking } from '../hooks/useMoodTracking';
import { 
  Loader2, 
  Heart, 
  HeartOff, 
  HeartPulse, 
  HeartCrack, 
  HeartPulseIcon,
  MessageSquarePlus,
  CheckCircle2
} from 'lucide-react'; // Using heart icons for a more positive spin

const MoodTracker = ({ userId }) => {
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const { mood, loading, error, logMood } = useMoodTracking(userId);

  const handleMoodSelect = async (moodValue) => {
    if (moodValue >= 1 && moodValue <= 5) {
      if (moodValue <= 3) {
        setShowNotes(true);
      } else {
        await logMood(moodValue);
      }
    }
  };

  const handleSubmitNotes = async (e) => {
    e.preventDefault();
    await logMood(3, notes);
    setNotes('');
    setShowNotes(false);
  };

  const moods = [
    { 
      value: 1, 
      icon: <HeartCrack size={28} className="text-red-400" />, 
      label: 'Struggling', 
      color: 'from-red-500/20 to-red-600/10',
      border: 'border-red-500/30',
      hover: 'hover:bg-red-500/10'
    },
    { 
      value: 2, 
      icon: <HeartOff size={28} className="text-orange-400" />, 
      label: 'Not Great', 
      color: 'from-orange-500/20 to-orange-600/10',
      border: 'border-orange-500/30',
      hover: 'hover:bg-orange-500/10'
    },
    { 
      value: 3, 
      icon: <HeartPulse size={28} className="text-yellow-400" />, 
      label: 'Okay', 
      color: 'from-yellow-500/20 to-yellow-600/10',
      border: 'border-yellow-500/30',
      hover: 'hover:bg-yellow-500/10'
    },
    { 
      value: 4, 
      icon: <HeartPulseIcon size={28} className="text-blue-400" />, 
      label: 'Good', 
      color: 'from-blue-500/20 to-blue-600/10',
      border: 'border-blue-500/30',
      hover: 'hover:bg-blue-500/10'
    },
    { 
      value: 5, 
      icon: <Heart size={28} className="text-green-400" />, 
      label: 'Amazing!', 
      color: 'from-green-500/20 to-green-600/10',
      border: 'border-green-500/30',
      hover: 'hover:bg-green-500/10'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin h-8 w-8 text-[#00ADB5]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (mood) {
    const currentMood = moods.find(m => m.value === mood);
    return (
      <div className="text-center p-6 bg-gradient-to-br from-[#00ADB5]/10 to-transparent border border-[#00ADB5]/20 rounded-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00ADB5]/10 mb-4">
          {currentMood?.icon}
        </div>
        <h3 className="text-xl font-medium mb-2">Thanks for sharing!</h3>
        <p className="text-[#EEEEEE]/70">
          Your <span className="font-medium text-[#00ADB5]">{currentMood?.label}</span> mood has been recorded
        </p>
        <button 
          onClick={() => setMood(null)}
          className="mt-4 text-sm text-[#00ADB5] hover:underline inline-flex items-center"
        >
          <MessageSquarePlus size={16} className="mr-1" /> Add more details
        </button>
      </div>
    );
  }

  if (showNotes) {
    return (
      <form onSubmit={handleSubmitNotes} className="bg-[#393E46]/50 p-6 rounded-xl">
        <h3 className="text-lg font-medium mb-3">Would you like to share more about how you're feeling?</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-3 bg-[#222831] rounded-lg mb-4 min-h-[100px]"
          placeholder="What's on your mind? (Optional)"
        />
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setShowNotes(false);
              setNotes('');
            }}
            className="px-4 py-2 rounded-lg bg-[#393E46] hover:bg-[#444b57] transition-colors"
          >
            Skip
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-[#00ADB5] hover:bg-[#0097a7] transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Submit'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-[#393E46]/50 p-6 rounded-xl border border-[#00ADB5]/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">How are you feeling today?</h3>
        <div className="flex items-center text-sm text-[#EEEEEE]/60">
          <Heart className="w-4 h-4 mr-1 text-red-400" />
          <span>Daily Check-in</span>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {moods.map((moodItem) => (
          <button
            key={moodItem.value}
            onClick={() => handleMoodSelect(moodItem.value)}
            disabled={loading}
            className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all border ${moodItem.border} ${moodItem.hover} ${
              loading ? 'opacity-50' : ''
            }`}
          >
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${moodItem.color} flex items-center justify-center mb-2`}>
              {moodItem.icon}
            </div>
            <span className="text-sm font-medium">{moodItem.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodTracker;
