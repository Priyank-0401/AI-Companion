/**
 * Generates a concise, meaningful title based on chat content
 * @param {Array} messages - Array of message objects
 * @returns {string} Generated title
 */
export const generateChatTitle = (messages) => {
  if (!messages || messages.length === 0) return 'New Conversation';
  
  // Get the first few messages to determine the topic
  const recentMessages = messages.slice(0, 3).map(m => m.content).join(' ').toLowerCase();
  
  // Common patterns and their corresponding titles
  const patterns = [
    { 
      regex: /(how.*feel|mood|emotion|anxious|stressed|worried|sad|happy|excited)/, 
      titles: [
        'Checking In', 'Mood Check', 'Feeling Chat', 
        'Emotional Update', 'Daily Check-in'
      ] 
    },
    { 
      regex: /(help|support|advice|guidance|suggestion)/, 
      titles: [
        'Seeking Advice', 'Need Help', 'Support Chat',
        'Guidance Needed', 'Looking For Help'
      ] 
    },
    { 
      regex: /(work|job|career|project|meeting|deadline)/, 
      titles: [
        'Work Chat', 'Career Talk', 'Project Discussion',
        'Work Update', 'Job Related'
      ] 
    },
    { 
      regex: /(friend|family|relationship|partner|date)/, 
      titles: [
        'Relationship Talk', 'Friend Chat', 'Family Matters',
        'Personal Update', 'Life Update'
      ] 
    },
    { 
      regex: /(goal|plan|future|dream|aspiration)/, 
      titles: [
        'Future Plans', 'Goal Setting', 'Dream Chat',
        'Planning Ahead', 'Looking Forward'
      ] 
    }
  ];

  // Find a matching pattern or use a default
  const match = patterns.find(p => p.regex.test(recentMessages));
  const defaultTitles = [
    'New Chat Started', 'Our Conversation', 'Chat With Me',
    'Talking Together', 'Our Discussion'
  ];
  
  const possibleTitles = match ? match.titles : defaultTitles;
  
  // Select a random title from the possible options
  return possibleTitles[Math.floor(Math.random() * possibleTitles.length)];
};

// Helper function to format user's first message as a title
export const getTitleFromFirstMessage = (message) => {
  if (!message) return 'New Chat';
  
  // Clean and trim the message
  let title = message.trim()
    .replace(/^[^\w]+/, '') // Remove leading non-word chars
    .replace(/\s+/g, ' ')    // Collapse multiple spaces
    .trim();
  
  // Truncate to 3-5 words
  const words = title.split(' ');
  const maxWords = Math.min(Math.max(3, words.length), 5);
  title = words.slice(0, maxWords).join(' ');
  
  // Capitalize first letter of each word
  title = title.replace(/\b\w/g, l => l.toUpperCase());
  
  return title || 'New Chat';
};
