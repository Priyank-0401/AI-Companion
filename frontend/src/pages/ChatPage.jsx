import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  User, 
  Loader2, 
  RotateCcw, 
  Download, 
  Settings, 
  MessageSquare,
  Brain,
  Heart,
  Smile,
  Coffee,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Trash2,
  Bot,
  MoreVertical,
  FileText,
  Bookmark,
  Star,
  Mic,
  MicOff,
  Play,
  Pause,
  Plus,
  ChevronRight,
  Menu,
  X,
  Save
} from 'lucide-react'
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { chatApi } from '../services/api';

const ChatPage = () => {
  const { resetChat } = useChat();
  const { currentUser } = useAuth();

  // Model options
  const modelOptions = [
    { id: 'default', name: 'Seriva (Default)', description: 'Balanced wellness companion' },
    { id: 'supportive', name: 'Supportive Seriva', description: 'Extra empathetic responses' },
    { id: 'analytical', name: 'Analytical Seriva', description: 'Logical and analytical approach' }
  ];
    // State for chat history and current conversation
  const [chatHistory, setChatHistory] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentChatTitle, setCurrentChatTitle] = useState(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Welcome! It's wonderful to see you. I'm Seriva, a friendly presence here to listen without judgment, offer support, and explore any thoughts or feelings you'd like to share. How can I help you feel more supported today?",
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationStyle, setConversationStyle] = useState('supportive');
  const [showOptions, setShowOptions] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);  const [selectedModel, setSelectedModel] = useState('default');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
  const [listeningTimeout, setListeningTimeout] = useState(null);
  const [activeChatDropdown, setActiveChatDropdown] = useState(null);
  const messagesEndRef = useRef(null);
  const initialLoadDoneRef = useRef(false);
  const chatScrollContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const inputRef = useRef(null);
    const addMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  // Generate a chat title from the first user message
  const generateChatTitle = (firstMessage) => {
    if (!firstMessage) return "New Chat";
    const words = firstMessage.split(' ');  
    if (words.length <= 4) return firstMessage;
    return words.slice(0, 4).join(' ') + '...';
  };

  // Save current chat to history
  const saveCurrentChatToHistory = () => {
    if (!currentConversationId || messages.length <= 1) return;

    const chatToSave = {
      id: currentConversationId,
      title: currentChatTitle || generateChatTitle(messages.find(m => m.type === 'user')?.content),
      messages: messages,
      date: new Date(),
      lastActivity: new Date()
    };

    const savedChats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    const existingIndex = savedChats.findIndex(chat => chat.id === currentConversationId);
    
    if (existingIndex >= 0) {
      savedChats[existingIndex] = chatToSave;
    } else {
      savedChats.unshift(chatToSave);
    }

    // Keep only the last 50 chats
    if (savedChats.length > 50) {
      savedChats.splice(50);
    }

    localStorage.setItem('chatHistory', JSON.stringify(savedChats));
    setChatHistory(savedChats);
  };

  // Load chat history from localStorage
  const loadChatHistory = () => {
    const savedChats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    setChatHistory(savedChats.map(chat => ({
      ...chat,
      date: new Date(chat.date),
      lastActivity: new Date(chat.lastActivity)
    })));
    return savedChats;
  };

  // Load a specific chat
  const loadChat = (chatId) => {
    const savedChats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    const chat = savedChats.find(c => c.id === chatId);
    
    if (chat) {
      setMessages(chat.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
      setCurrentConversationId(chat.id);
      setCurrentChatTitle(chat.title);
      setMobileSidebarOpen(false);
      
      // Update last activity
      chat.lastActivity = new Date();
      localStorage.setItem('chatHistory', JSON.stringify(savedChats));
      setChatHistory(savedChats.map(c => ({
        ...c,
        date: new Date(c.date),
        lastActivity: new Date(c.lastActivity)      })));
    }
  };

  // Save chat as TXT file
  const saveChatAsTxt = (chat) => {
    const formattedDate = new Date(chat.date).toISOString().split('T')[0];
    const filename = `${chat.title.replace(/[^a-zA-Z0-9]/g, '_')}_${formattedDate}.txt`;
    
    const content = chat.messages
      .filter(m => m.type !== 'system') // Filter out system messages if any
      .map(m => `[${m.type.toUpperCase()}] ${new Date(m.timestamp).toLocaleString()}\n${m.content}\n`)
      .join('\n---\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
    setActiveChatDropdown(null); // Close dropdown
  };

  // Delete chat from history
  const deleteChatFromHistory = (chatId) => {
    const savedChats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    const updatedChats = savedChats.filter(chat => chat.id !== chatId);
    
    localStorage.setItem('chatHistory', JSON.stringify(updatedChats));
    setChatHistory(updatedChats.map(chat => ({
      ...chat,
      date: new Date(chat.date),
      lastActivity: new Date(chat.lastActivity)
    })));
    
    // If the deleted chat is the current one, reset to welcome message
    if (currentConversationId === chatId) {
      resetChatHandler();
    }
    
    setActiveChatDropdown(null); // Close dropdown
  };
  const resetChatHandler = () => {
    setMessages([{
      id: 1,
      type: 'bot',
      content: "Welcome! It's wonderful to see you. I'm Seriva, a friendly presence here to listen without judgment, offer support, and explore any thoughts or feelings you'd like to share. How can I help you feel more supported today?",
      timestamp: new Date()
    }]);
    setCurrentConversationId(null);
    setCurrentChatTitle(null);
    initialLoadDoneRef.current = false;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!initialLoadDoneRef.current && messages.length === 1) { 
      const timer = setTimeout(() => {
        chatScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
        initialLoadDoneRef.current = true;
      }, 0);
      return () => clearTimeout(timer);
    } else if (initialLoadDoneRef.current && messages.length > 1) {
      const timer = setTimeout(() => {
        chatScrollContainerRef.current?.scrollTo({
          top: chatScrollContainerRef.current.scrollHeight - chatScrollContainerRef.current.clientHeight,
          behavior: 'smooth'
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages]);
  // Load and save messages to localStorage
  useEffect(() => {
    // Load chat history first
    const savedChats = loadChatHistory();
    
    // Load current conversation from localStorage
    const savedCurrentConversationId = localStorage.getItem('currentConversationId');
    const savedMessages = localStorage.getItem('chatMessages');
    
    if (savedCurrentConversationId && savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
          setCurrentConversationId(savedCurrentConversationId);
          
          // Try to get title from chat history
          const existingChat = savedChats.find(chat => chat.id === savedCurrentConversationId);
          if (existingChat) {
            setCurrentChatTitle(existingChat.title);
          }
          return; // Exit early if valid messages are found
        }
      } catch (e) {
        console.error('Parsing error:', e);
      }
    }

    // Only set welcome message if no valid saved messages
    setMessages([{
      id: 1,
      type: 'bot',
      content: "Welcome! It's wonderful to see you. I'm Seriva, a friendly presence here to listen without judgment, offer support, and explore any thoughts or feelings you'd like to share. How can I help you feel more supported today?",
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    // Save current messages and conversation ID
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    if (currentConversationId) {
      localStorage.setItem('currentConversationId', currentConversationId);
    }
    
    // Auto-save to history if conversation has real messages
    if (currentConversationId && messages.length > 1 && messages.some(m => m.type === 'user')) {
      const timeoutId = setTimeout(() => {
        saveCurrentChatToHistory();
      }, 2000); // Auto-save after 2 seconds of inactivity
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, currentConversationId]);

  // Handle speech recognition and synthesis
  useEffect(() => {
    // Check for speech recognition support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      console.log('Speech Recognition API is available in this browser')
      setSpeechSupported(true)
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      console.log('Speech Recognition instance created successfully')
      recognitionRef.current.continuous = true  // Keep listening
      recognitionRef.current.interimResults = true  // Show interim results
      recognitionRef.current.lang = 'en-US'
      recognitionRef.current.maxAlternatives = 1      
      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started')
        setIsListening(true)
      }      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        // Log the raw speech recognition results for debugging
        console.log('Speech recognition results:', event.results)
        
        // Make sure we have results before processing
        if (event.results && event.results.length > 0) {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            // Add defensive check to ensure the result and first alternative exist
            if (event.results[i] && event.results[i][0]) {
              const transcript = event.results[i][0].transcript
              console.log(`Transcript ${i}: "${transcript}" (confidence: ${event.results[i][0].confidence.toFixed(2)})`)
              
              if (event.results[i].isFinal) {
                finalTranscript += transcript
                console.log(`Adding to final: "${transcript}"`)
              } else {
                interimTranscript += transcript
                console.log(`Adding to interim: "${transcript}"`)
              }
            } else {
              console.warn(`Invalid speech result at index ${i}`)
            }
          }
        } else {
          console.warn('Speech recognition event had no results')
        }
        
        // Update input with interim results
        const currentTranscript = finalTranscript || interimTranscript
        console.log(`Current transcript: "${currentTranscript}"`)
        
        if (currentTranscript.trim()) {
          console.log(`Setting input to: "${currentTranscript.trim()}"`)
          // Force update of React state with setTimeout to ensure state changes are processed
          setTimeout(() => {
            setInput(currentTranscript.trim())
          }, 0)
        }
        
        // If we have a final result with meaningful content, stop listening
        // but only after a longer delay to ensure user is done speaking
        if (finalTranscript.trim() && finalTranscript.trim().length > 2) {
          console.log('Final transcript:', finalTranscript.trim())
          setTimeout(() => {
            if (recognitionRef.current && isListening) {
              console.log('Stopping recognition after final transcript')
              recognitionRef.current.stop()
            }
          }, 1500) // Increased delay to give user time to continue speaking
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        
        // Clear timeout on error
        if (listeningTimeout) {
          clearTimeout(listeningTimeout)
          setListeningTimeout(null)
        }
        
        // Handle specific errors with user-friendly messages
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access in your browser settings and try again.')        } else if (event.error === 'no-speech') {
          console.log('No speech detected - you can try again')
          // Don't show error for no-speech, it's normal
        } else if (event.error === 'audio-capture') {
          alert('No microphone found. Please check that your microphone is connected and try again.')
        } else if (event.error === 'network') {
          console.log('Network error during speech recognition')
        } else {
          console.log('Speech recognition error:', event.error)
        }
      }

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended')
        setIsListening(false)
        
        // Clear timeout when recognition ends
        if (listeningTimeout) {
          clearTimeout(listeningTimeout)
          setListeningTimeout(null)
        }
      }
    }

    // Check for speech synthesis support
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
        // Load available voices
      const loadVoices = () => {
        const voices = synthRef.current.getVoices();
        if (voices.length > 0) {
          // Filter for better quality voices, include more voice providers
          const filteredVoices = voices.filter(voice => {
            // Include Google, Apple, native browser voices, and exclude only poor quality ones
            const name = voice.name.toLowerCase();
            const isGoodQuality = 
              name.includes('google') ||
              name.includes('apple') ||
              name.includes('natural') ||
              name.includes('neural') ||
              name.includes('premium') ||
              (!name.includes('microsoft') || name.includes('neural')) || // Include only Neural Microsoft voices
              voice.localService === true; // Include high-quality local voices
            
            return isGoodQuality;
          });
          
          // Sort voices: Google first, then Apple, then others, prioritizing English
          const sortedVoices = filteredVoices.sort((a, b) => {
            // Priority scoring
            const getVoicePriority = (voice) => {
              let score = 0;
              const name = voice.name.toLowerCase();
              
              // Provider priority
              if (name.includes('google')) score += 100;
              else if (name.includes('apple')) score += 80;
              else if (name.includes('neural')) score += 60;
              else if (name.includes('natural')) score += 40;
              else if (voice.localService) score += 20;
              
              // Language priority
              if (voice.lang === 'en-US') score += 50;
              else if (voice.lang.startsWith('en-')) score += 30;
              
              // Gender variety (prefer having both male and female options)
              if (name.includes('female') || name.includes('woman')) score += 10;
              if (name.includes('male') || name.includes('man')) score += 10;
              
              return score;
            };
            
            const scoreA = getVoicePriority(a);
            const scoreB = getVoicePriority(b);
            
            if (scoreA !== scoreB) return scoreB - scoreA; // Higher score first
            
            // If same score, alphabetical order
            return a.name.localeCompare(b.name);
          });
          
          setAvailableVoices(sortedVoices);
          
          // Set a default voice - prefer a high-quality English voice
          const defaultVoice = sortedVoices.find(voice => 
            voice.name.toLowerCase().includes('google') && 
            (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman')) && 
            voice.lang === 'en-US'
          ) || 
          sortedVoices.find(voice => voice.name.toLowerCase().includes('google') && voice.lang === 'en-US') ||
          sortedVoices.find(voice => voice.name.toLowerCase().includes('apple') && voice.lang === 'en-US') ||
          sortedVoices.find(voice => voice.lang === 'en-US') ||
          sortedVoices[0];
          
          setSelectedVoice(defaultVoice);
          
          // Debug log to see available voices
          console.log('Available voices loaded:', sortedVoices.map(v => ({
            name: v.name,
            lang: v.lang,
            localService: v.localService
          })));
        }
      };
      
      // Chrome needs to wait for the voiceschanged event
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
      
      // For browsers that don't fire onvoiceschanged
      loadVoices();
    }

    // Cleanup for speech recognition and synthesis
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        // Nullify handlers to help prevent potential memory leaks
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []); // End of speech/synth initialization useEffect

  // Effect to clean up listeningTimeout if it's active when the component unmounts or listeningTimeout changes
  useEffect(() => {
    return () => {
      if (listeningTimeout) {
        clearTimeout(listeningTimeout);
      }
    };  }, [listeningTimeout]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeChatDropdown) {
        setActiveChatDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeChatDropdown]);

  // Auto-speak bot messages when voice is enabled
  useEffect(() => {
    if (voiceEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.type === 'bot' && lastMessage.id !== 1) {
        speakMessage(lastMessage.content)
      }
    }
  }, [messages, voiceEnabled])

  const startListening = () => {
    if (recognitionRef.current && speechSupported && !isListening) {
      try {
        // Clear any existing input and timeout
        setInput('')
        if (listeningTimeout) {
          clearTimeout(listeningTimeout)
          setListeningTimeout(null)
        }
        
        console.log('Starting speech recognition...')
        recognitionRef.current.start()
          // Set a timeout to stop listening after 20 seconds of no speech
        const timeout = setTimeout(() => {
          if (recognitionRef.current && isListening) {
            console.log('Speech recognition timeout - no speech detected for 20 seconds')
            recognitionRef.current.stop()
          }
        }, 20000) // Increased to 20 seconds for better user experience
        setListeningTimeout(timeout)
        
      } catch (error) {
        console.error('Error starting speech recognition:', error)
        setIsListening(false)
        
        // If already running, stop and restart
        if (error.message.includes('already started')) {
          recognitionRef.current.stop()
          setTimeout(() => {
            try {
              recognitionRef.current.start()
            } catch (retryError) {
              console.error('Retry error:', retryError)
            }
          }, 100)
        }
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      console.log('Stopping speech recognition...')
      recognitionRef.current.stop()
    }
    
    // Clear timeout
    if (listeningTimeout) {
      clearTimeout(listeningTimeout)
      setListeningTimeout(null)
    }
  }
  const speakMessage = (text) => {
    if (synthRef.current && voiceEnabled && selectedVoice) {
      // Cancel any ongoing speech
      synthRef.current.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = selectedVoice
      utterance.rate = 0.9
      utterance.pitch = 1.1
      utterance.volume = 0.8

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      synthRef.current.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled)
    if (voiceEnabled && isSpeaking) {
      stopSpeaking()
    }
  }  // Handle form submission and send message
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;
    
    // Generate conversation ID on first user message
    if (!currentConversationId) {
      const newConversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentConversationId(newConversationId);
      
      // Generate title from first message
      const title = generateChatTitle(input.trim());
      setCurrentChatTitle(title);
    }
    
    // Create and add user message
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };
    addMessage(userMessage);
    
    // Store the input for API call
    const userInput = input.trim();
    
    // Clear input and start loading
    setInput('');
    setIsLoading(true);
      try {
      // Call the real Ollama API
      const response = await chatApi.sendMessage(
        userInput, 
        currentConversationId, // Use the current conversation ID
        conversationStyle // Use the selected conversation style
      );
      
      console.log('API Response:', response); // Debug log
      
      // Create and add bot response
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        content: response.response || response.message || response.content || 'I apologize, but I encountered an issue processing your message. Could you please try again?',
        timestamp: new Date()
      };
      addMessage(botResponse);
      
      // Speak the response if voice is enabled
      if (voiceEnabled) {
        speakMessage(botResponse.content);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorResponse = {
        id: messages.length + 2,
        type: 'bot',
        content: 'I apologize, but I\'m having trouble connecting to my AI brain right now. Please check your connection and try again. If the problem persists, the Ollama service might not be running.',
        timestamp: new Date()
      };
      addMessage(errorResponse);
      
      // Speak error message if voice is enabled
      if (voiceEnabled) {
        speakMessage(errorResponse.content);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle copy message
  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(content);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Export chat
  const exportChat = () => {
    const formattedDate = new Date().toISOString().split('T')[0];
    const filename = `seriva-chat-${formattedDate}.txt`;
    const content = messages
      .map(m => `[${m.type.toUpperCase()}] ${m.timestamp.toLocaleString()}\n${m.content}\n`)
      .join('\n---\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  };  const startNewChat = () => {
    // Save current chat to history if it has real conversations (more than welcome message)
    if (messages.length > 1 && messages.some(m => m.type === 'user')) {
      saveCurrentChatToHistory();
    }
    
    // Reset to new chat
    resetChatHandler();
    setMobileSidebarOpen(false);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(prev => !prev);
  };

  const conversationStyles = [
    { value: 'supportive', label: 'Supportive', icon: Heart, color: 'text-red-400' },
    { value: 'practical', label: 'Practical', icon: Coffee, color: 'text-yellow-400' },
    { value: 'reflective', label: 'Reflective', icon: Brain, color: 'text-blue-400' },
    { value: 'cheerful', label: 'Cheerful', icon: Smile, color: 'text-green-400' }
  ];

  // Format date for chat history
  const formatDate = (date) => {
    const now = new Date();
    const diff = now - date;
    const dayInMs = 86400000;
    
    if (diff < dayInMs) return 'Today';
    if (diff < dayInMs * 2) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Group chat history by date
  const groupedChatHistory = chatHistory.reduce((acc, chat) => {
    const dateKey = formatDate(chat.date);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(chat);
    return acc;
  }, {});
  return (
    <div className="flex h-screen pt-20 bg-[#222831]">
      {/* Mobile Sidebar Toggle Button */}
      <div className="md:hidden fixed bottom-4 left-4 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleMobileSidebar}
          className="p-3 bg-[#00ADB5] rounded-full shadow-lg"
        >
          {mobileSidebarOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </motion.button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileSidebarOpen(false)} 
        />
      )}
        {/* Sidebar - Permanently visible on desktop */}
      <aside className={`fixed md:static h-[calc(100vh-4rem)] pt-2 bg-[#393E46] w-72 z-50 flex flex-col shadow-xl ${mobileSidebarOpen ? 'block' : 'hidden md:flex'}`}>
            {/* New Chat Button */}
            <div className="p-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startNewChat}
                className="flex items-center justify-center w-full py-3 px-4 bg-[#00ADB5] hover:bg-[#00ADB5]/90 text-white rounded-lg shadow-md transition-colors gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">New Chat</span>
              </motion.button>
            </div>

            {/* Model Selection */}
            <div className="px-4 mb-4">
              <div className="relative">
                <button 
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="flex items-center justify-between w-full p-3 bg-[#222831] hover:bg-[#222831]/80 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-[#00ADB5]" />
                    <span className="text-sm font-medium text-[#EEEEEE]">
                      {modelOptions.find(m => m.id === selectedModel)?.name || 'Select Model'}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-[#EEEEEE]/70 transition-transform ${showModelDropdown ? 'rotate-90' : ''}`} />
                </button>

                {/* Model Dropdown */}
                <AnimatePresence>
                  {showModelDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute left-0 right-0 mt-2 bg-[#222831] border border-[#00ADB5]/20 rounded-lg shadow-lg z-10 overflow-hidden"
                    >
                      {modelOptions.map(model => (
                        <button
                          key={model.id}
                          className={`flex flex-col w-full text-left p-3 hover:bg-[#00ADB5]/10 transition-colors ${model.id === selectedModel ? 'bg-[#00ADB5]/20' : ''}`}
                          onClick={() => {
                            setSelectedModel(model.id);
                            setShowModelDropdown(false);
                          }}
                        >
                          <span className="font-medium text-sm text-[#EEEEEE]">{model.name}</span>
                          <span className="text-xs text-[#EEEEEE]/60">{model.description}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Quick Actions Section */}
            <div className="px-4 mb-4">
              <div className="mb-2">
                <h3 className="text-xs uppercase font-semibold text-[#EEEEEE]/50 tracking-wider px-1">Quick Actions</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {/* Export Chat Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={exportChat}
                  className="flex items-center justify-center p-3 bg-[#222831] hover:bg-[#222831]/80 rounded-lg transition-colors group"
                  title="Export Chat"
                >
                  <Download className="w-4 h-4 text-[#00ADB5] mr-2" />
                  <span className="text-xs font-medium text-[#EEEEEE]">Export</span>
                </motion.button>

                {/* Reset Chat Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetChatHandler}
                  className="flex items-center justify-center p-3 bg-[#222831] hover:bg-red-500/20 rounded-lg transition-colors group"
                  title="Reset Chat"
                >
                  <Trash2 className="w-4 h-4 text-[#EEEEEE]/70 group-hover:text-red-400 mr-2" />
                  <span className="text-xs font-medium text-[#EEEEEE] group-hover:text-red-400">Reset</span>
                </motion.button>
              </div>
              
              {/* Conversation Style */}
              <div className="mt-2 relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="flex items-center justify-between w-full p-3 bg-[#222831] hover:bg-[#222831]/80 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MoreVertical className="w-4 h-4 text-[#00ADB5]" />
                    <span className="text-sm font-medium text-[#EEEEEE]">Conversation Style</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-[#EEEEEE]/70 transition-transform ${showOptions ? 'rotate-90' : ''}`} />
                </button>

                {/* Style Options Dropdown */}
                <AnimatePresence>
                  {showOptions && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute left-0 right-0 mt-2 bg-[#222831] border border-[#00ADB5]/20 rounded-lg shadow-lg z-10 overflow-hidden"
                    >
                      {conversationStyles.map((style) => {
                        const Icon = style.icon;
                        return (
                          <motion.button
                            key={style.value}
                            whileHover={{ backgroundColor: 'rgba(0, 173, 181, 0.1)' }}
                            onClick={() => {
                              setConversationStyle(style.value);
                              setShowOptions(false);
                            }}
                            className={`w-full flex items-center space-x-3 px-3 py-2 text-left transition-colors ${
                              conversationStyle === style.value ? 'bg-[#00ADB5]/20' : ''
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${style.color}`} />
                            <span className="text-sm text-[#EEEEEE]">{style.label}</span>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Voice Options Section */}
            <div className="px-4 mb-4">
              <div className="mb-2">
                <h3 className="text-xs uppercase font-semibold text-[#EEEEEE]/50 tracking-wider px-1">Voice Options</h3>
              </div>
              
              {/* Voice Toggle */}
              <div className="flex items-center justify-between p-3 bg-[#222831] rounded-lg mb-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#00ADB5]" />
                  <span className="text-sm font-medium text-[#EEEEEE]">Voice Enabled</span>
                </div>
                <button 
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${voiceEnabled ? 'bg-[#00ADB5]' : 'bg-[#393E46]'}`}
                >
                  <motion.div 
                    className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white"
                    animate={{ x: voiceEnabled ? '1.25rem' : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
              
              {/* Voice Selection - Only show if voice is enabled */}
              {voiceEnabled && (
                <div className="relative">
                  <button 
                    onClick={() => setShowVoiceDropdown(!showVoiceDropdown)}
                    disabled={!voiceEnabled || availableVoices.length === 0}
                    className={`flex items-center justify-between w-full p-3 bg-[#222831] hover:bg-[#222831]/80 rounded-lg transition-colors ${!voiceEnabled || availableVoices.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#00ADB5]" />
                      <span className="text-sm font-medium text-[#EEEEEE] truncate max-w-[150px]">
                        {availableVoices.length === 0 ? 'Loading voices...' : 
                          selectedVoice ? selectedVoice.name.replace('Google ', '') : 'Select Voice'}
                      </span>
                    </div>
                    {(voiceEnabled && availableVoices.length > 0) && (
                      <ChevronRight className={`w-4 h-4 text-[#EEEEEE]/70 transition-transform ${showVoiceDropdown ? 'rotate-90' : ''}`} />
                    )}
                  </button>

                  {/* Voice Dropdown */}
                  <AnimatePresence>
                    {showVoiceDropdown && voiceEnabled && availableVoices.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 right-0 mt-2 bg-[#222831] border border-[#00ADB5]/20 rounded-lg shadow-lg z-10 overflow-y-auto max-h-60"
                      >
                        {availableVoices.map((voice, index) => (
                          <button
                            key={`${voice.name}-${index}`}
                            className={`flex flex-col w-full text-left p-3 hover:bg-[#00ADB5]/10 transition-colors ${selectedVoice && voice.name === selectedVoice.name ? 'bg-[#00ADB5]/20' : ''}`}
                            onClick={() => {
                              setSelectedVoice(voice);
                              setShowVoiceDropdown(false);
                              
                              // Say a short sample
                              if (synthRef.current) {
                                synthRef.current.cancel();
                                const utterance = new SpeechSynthesisUtterance("Hello, I'm Seriva.");
                                utterance.voice = voice;
                                utterance.volume = 0.8;
                                utterance.onstart = () => setIsSpeaking(true);
                                utterance.onend = () => setIsSpeaking(false);
                                synthRef.current.speak(utterance);
                              }
                            }}
                          >
                            <span className="font-medium text-sm text-[#EEEEEE] truncate">{voice.name.replace('Google ', '')}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#EEEEEE]/60">{voice.lang}</span>
                              {voice.name.includes('Google') && (
                                <span className="text-[7px] uppercase bg-[#00ADB5]/30 text-[#00ADB5] px-1 rounded">Google</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              {/* Voice Status Indicators */}
              {voiceEnabled && (
                <div className="mt-2 px-1">
                  {isSpeaking && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#00ADB5] flex items-center gap-1">
                        <motion.span
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >⬤</motion.span>
                        Speaking...
                      </span>
                      <button
                        onClick={stopSpeaking}
                        className="text-xs text-red-400 hover:text-red-500"
                      >
                        Stop
                      </button>
                    </div>
                  )}
                  
                  {availableVoices.length === 0 && (
                    <span className="text-xs text-yellow-400">Loading available voices...</span>
                  )}
                </div>
              )}
            </div>            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-2">
              <div className="px-2 mb-2">
                <h2 className="text-xs uppercase font-semibold text-[#EEEEEE]/50 tracking-wider">Chat History</h2>
              </div>
              
              {Object.entries(groupedChatHistory).map(([date, chats]) => (
                <div key={date} className="mb-4">
                  <div className="px-2 mb-2">
                    <h3 className="text-xs font-medium text-[#EEEEEE]/60">{date}</h3>
                  </div>
                    {chats.map(chat => (
                    <div key={chat.id} className="relative group">
                      <motion.button
                        whileHover={{ x: 4 }}
                        onClick={() => loadChat(chat.id)}
                        className={`flex items-start w-full p-2 rounded-lg hover:bg-[#00ADB5]/10 transition-colors text-left ${
                          currentConversationId === chat.id ? 'bg-[#00ADB5]/20 border-l-2 border-[#00ADB5]' : ''
                        }`}
                      >
                        <MessageSquare className="w-4 h-4 mt-0.5 mr-3 text-[#EEEEEE]/70" />
                        <div className="flex-1 overflow-hidden">
                          <h4 className="text-sm font-medium text-[#EEEEEE] truncate">{chat.title}</h4>
                          <p className="text-xs text-[#EEEEEE]/60 truncate">
                            {chat.lastActivity ? chat.lastActivity.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                             chat.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.button>
                      
                      {/* Dropdown Menu Button */}
                      <div className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveChatDropdown(activeChatDropdown === chat.id ? null : chat.id);
                          }}
                          className="p-1 rounded hover:bg-[#393E46] transition-colors"
                        >
                          <MoreVertical className="w-3 h-3 text-[#EEEEEE]/70" />
                        </motion.button>
                        
                        {/* Dropdown Menu */}
                        <AnimatePresence>
                          {activeChatDropdown === chat.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 top-full mt-1 w-32 bg-[#393E46] border border-[#00ADB5]/20 rounded-lg shadow-lg z-50 overflow-hidden"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveChatAsTxt(chat);
                                }}
                                className="flex items-center w-full px-3 py-2 text-sm text-[#EEEEEE] hover:bg-[#00ADB5]/10 transition-colors"
                              >
                                <Save className="w-3 h-3 mr-2 text-[#00ADB5]" />
                                Save as TXT
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteChatFromHistory(chat.id);
                                }}
                                className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-3 h-3 mr-2" />
                                Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Empty State */}
              {Object.keys(groupedChatHistory).length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
                  <MessageSquare className="w-8 h-8 text-[#EEEEEE]/30 mb-2" />
                  <p className="text-sm text-[#EEEEEE]/50">No chat history yet</p>                  <p className="text-xs text-[#EEEEEE]/30">Start a new conversation</p>
                </div>
              )}
            </div>
          </aside>{/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Chat Messages */}
        <div 
          ref={chatScrollContainerRef}
          className="flex-1 overflow-y-auto px-4 py-5 space-y-6" 
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#00ADB5 transparent'
          }}
        >
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.02,
                }}
                className={`flex max-w-4xl mx-auto ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-3 max-w-[85%] group ${
                  message.type === 'user' ? 'flex-row-reverse' : ''
                }`}>                  
                {/* Avatar */}
                  <motion.div 
                    className={`w-14 h-14 flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'rounded-full bg-gradient-to-br from-[#00ADB5] to-[#00ADB5]/80' 
                        : ''
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {message.type === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <img 
                        src="/logo.png" 
                        alt="Seriva" 
                        className="w-12 h-12 object-contain"
                      />
                    )}
                  </motion.div>

                  {/* Message Bubble */}
                  <motion.div 
                    className={`relative ${
                      message.type === 'user'
                        ? 'bg-[#00ADB5] text-white' 
                        : 'bg-[#393E46] text-[#EEEEEE] border border-[#393E46]/70'
                    } rounded-2xl px-5 py-3 shadow-lg`}
                    whileHover={{ scale: 1.01 }}
                  >
                    {/* Message Content */}
                    <p className="leading-relaxed whitespace-pre-wrap text-sm">
                      {message.content}
                    </p>
                    
                    {/* Message Footer */}
                    <div className="flex items-center justify-between mt-3 gap-3">
                      <span className={`text-xs ${
                        message.type === 'user' ? 'text-white/70' : 'text-[#EEEEEE]/50'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      
                      {/* Message Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {message.type === 'bot' && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => speakMessage(message.content)}
                            className="p-1 rounded transition-colors hover:bg-[#00ADB5]/20"
                            title="Read aloud"
                            disabled={isSpeaking}
                          >
                            {isSpeaking ? (
                              <Pause className="w-3 h-3 text-[#00ADB5]" />
                            ) : (
                              <Play className="w-3 h-3 text-[#EEEEEE]/70" />
                            )}
                          </motion.button>
                        )}
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => copyMessage(message.content)}
                          className="p-1 rounded transition-colors hover:bg-[#00ADB5]/20"
                          title="Copy message"
                        >
                          {copiedMessageId === message.content ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-[#EEEEEE]/70" />
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start max-w-4xl mx-auto"
              >                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <img 
                      src="/logo.png" 
                      alt="Seriva" 
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <div className="px-4 py-3 bg-[#393E46] rounded-2xl shadow-lg">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.4, 1, 0.4]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="w-2 h-2 bg-[#00ADB5] rounded-full"
                      />
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.4, 1, 0.4]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.2
                        }}
                        className="w-2 h-2 bg-[#00ADB5] rounded-full"
                      />
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.4, 1, 0.4]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.4
                        }}
                        className="w-2 h-2 bg-[#00ADB5] rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty space for scrolling and reference for auto-scroll */}
          <div ref={messagesEndRef} style={{ height: '100px' }}></div>
        </div>        {/* Input Area */}
        <div className="px-4 py-2 border-t border-[#00ADB5]/10 bg-[#222831] sticky bottom-0">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Share your thoughts... I'm here to listen with empathy and understanding."
                className="w-full py-3 px-4 pr-24 bg-[#393E46]/80 border border-[#00ADB5]/20 rounded-xl text-[#EEEEEE] placeholder-[#EEEEEE]/40 focus:outline-none focus:ring-2 focus:ring-[#00ADB5]/50 focus:border-[#00ADB5]"
              />
              
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {/* Speech Recognition Button */}
                {speechSupported && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => isListening ? stopListening() : startListening()}
                    className={`p-2 rounded-lg transition-all ${
                      isListening 
                        ? 'bg-red-500/30 hover:bg-red-500/40 text-red-400' 
                        : 'bg-[#393E46] hover:bg-[#00ADB5]/20 text-[#EEEEEE]/70 hover:text-[#00ADB5]'
                    }`}
                  >
                    {isListening ? (
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                        }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity,
                          ease: "easeOut"
                        }}
                      >
                        <MicOff className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </motion.button>
                )}
                
                {/* Send Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading || input.trim() === ''}
                  whileHover={{ scale: input.trim() ? 1.05 : 1 }}
                  whileTap={{ scale: input.trim() ? 0.95 : 1 }}
                  className={`p-2 rounded-lg ${
                    input.trim() 
                      ? 'bg-[#00ADB5] hover:bg-[#00ADB5]/90 text-white' 
                      : 'bg-[#393E46] text-[#EEEEEE]/30 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </form>
            
            {/* Voice and Style Status */}
            <div className="flex items-center justify-center mt-2 space-x-2">
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center space-x-2"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-2 h-2 bg-red-400 rounded-full"
                    />
                    <span className="text-xs text-red-400 font-medium">
                      Listening... Speak clearly or click mic to stop
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {!isListening && (
                <span className="text-xs text-[#EEEEEE]/40">
                  {selectedModel === 'default' ? 'Seriva is ready to chat' : `Using ${modelOptions.find(m => m.id === selectedModel)?.name}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;