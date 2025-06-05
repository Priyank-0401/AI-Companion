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
  Pause
} from 'lucide-react'
import { useChat } from '../contexts/ChatContext';

const ChatPage = () => {
  const { resetChat } = useChat();

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Welcome! It's wonderful to see you. I'm Seriva, a friendly presence here to listen without judgment, offer support, and explore any thoughts or feelings you'd like to share. How can I help you feel more supported today?",
      timestamp: new Date()
    }  ]);
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationStyle, setConversationStyle] = useState('supportive')
  const [showOptions, setShowOptions] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [listeningTimeout, setListeningTimeout] = useState(null)
  const messagesEndRef = useRef(null);
  const initialLoadDoneRef = useRef(false);
  const chatScrollContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  const addMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const resetChatHandler = () => {
    setMessages([{
      id: 1,
      type: 'bot',
      content: "Welcome! It's wonderful to see you. I'm Seriva, a friendly presence here to listen without judgment, offer support, and explore any thoughts or feelings you'd like to share. How can I help you feel more supported today?",
      timestamp: new Date()
    }]);
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

    // Ensure padding remains consistent
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.style.paddingTop = '4rem';
    }
  }, [messages]);

  useEffect(() => {
    // Load messages from local storage on component mount
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
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
    console.log("Saving messages to localStorage", messages);
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);
  // Initialize speech recognition and synthesis
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
      synthRef.current = window.speechSynthesis
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
    };
  }, [listeningTimeout]);
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
    if (synthRef.current && voiceEnabled) {
      // Cancel any ongoing speech
      synthRef.current.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = synthRef.current.getVoices().find(voice => 
        voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Karen')
      ) || synthRef.current.getVoices()[0]
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
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    addMessage(userMessage);
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:3001/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: null,
          style: conversationStyle
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI response');
      }

      const data = await response.json();
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.response,
        timestamp: new Date()
      };

      addMessage(botMessage);
      
      // Auto-speak bot response if voice is enabled
      if (voiceEnabled) {
        setTimeout(() => speakMessage(data.response), 500)
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I encountered an error while processing your request.',
        timestamp: new Date()
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  const exportChat = () => {
    const chatData = messages.map(msg => ({
      type: msg.type,
      content: msg.content,
      timestamp: msg.timestamp.toISOString()
    }))
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-companion-chat-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyMessage = (messageId, content) => {
    navigator.clipboard.writeText(content)
    setCopiedMessageId(messageId)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }
  const conversationStyles = [
    { value: 'supportive', label: 'Supportive', icon: Heart, color: 'text-pink-400' },
    { value: 'analytical', label: 'Analytical', icon: Brain, color: 'text-blue-400' },
    { value: 'casual', label: 'Casual', icon: Smile, color: 'text-yellow-400' },
    { value: 'professional', label: 'Professional', icon: FileText, color: 'text-green-400' }
  ]

  return (
    <div className="w-full min-h-screen bg-[#222831] text-[#EEEEEE]">
      {/* Enhanced Header with Chat Controls */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-16 z-40 bg-[#222831]/95 backdrop-blur-sm border-b border-[#393E46]/50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-[#00ADB5] to-[#00ADB5]/80 rounded-xl flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
              >
                <Bot className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-[#00ADB5]">Chat with Seriva</h1>
                <p className="text-sm text-[#EEEEEE]/70">Your AI Wellness Companion</p>
              </div>
            </div>

            {/* Chat Controls */}
            <div className="flex items-center space-x-3">
              {/* Conversation Style Selector */}
              <div className="relative">                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowOptions(!showOptions)}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#393E46] hover:bg-[#393E46]/80 rounded-lg transition-colors"
                >
                  {(() => {
                    const currentStyle = conversationStyles.find(s => s.value === conversationStyle);
                    const Icon = currentStyle?.icon;
                    return Icon ? <Icon className={`w-4 h-4 ${currentStyle.color}`} /> : null;
                  })()}
                  <span className="text-sm text-[#EEEEEE]">
                    {conversationStyles.find(s => s.value === conversationStyle)?.label}
                  </span>
                  <MoreVertical className="w-4 h-4 text-[#EEEEEE]/70" />
                </motion.button>

                {/* Style Options Dropdown */}
                <AnimatePresence>
                  {showOptions && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full right-0 mt-2 w-48 bg-[#393E46] rounded-lg border border-[#00ADB5]/20 shadow-xl z-50"
                    >
                      <div className="p-2">
                        {conversationStyles.map((style) => {
                          const Icon = style.icon
                          return (
                            <motion.button
                              key={style.value}
                              whileHover={{ backgroundColor: 'rgba(0, 173, 181, 0.1)' }}
                              onClick={() => {
                                setConversationStyle(style.value)
                                setShowOptions(false)
                              }}
                              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                                conversationStyle === style.value ? 'bg-[#00ADB5]/20' : ''
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${style.color}`} />
                              <span className="text-sm text-[#EEEEEE]">{style.label}</span>
                            </motion.button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Export Chat Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportChat}
                className="p-2 bg-[#393E46] hover:bg-[#393E46]/80 rounded-lg transition-colors"
                title="Export Chat"
              >
                <Download className="w-5 h-5 text-[#00ADB5]" />
              </motion.button>

              {/* Reset Chat Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetChatHandler}
                className="p-2 bg-[#393E46] hover:bg-red-500/20 rounded-lg transition-colors group"
                title="Reset Chat"
              >
                <Trash2 className="w-5 h-5 text-[#EEEEEE]/70 group-hover:text-red-400" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>      {/* Enhanced Chat Container */}
      <div className="max-w-7xl mx-auto px-6 pb-32">
        {/* Messages Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#393E46]/30 backdrop-blur-sm rounded-2xl border border-[#393E46]/50 overflow-hidden"
        >
          <div 
            ref={chatScrollContainerRef} 
            className="h-[calc(100vh-300px)] overflow-y-auto px-6 py-6 space-y-4"
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
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-3 max-w-[80%] group ${
                    message.type === 'user' ? 'flex-row-reverse' : ''
                  }`}>
                    {/* Enhanced Avatar */}
                    <motion.div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-br from-[#00ADB5] to-[#00ADB5]/80' 
                          : 'bg-gradient-to-br from-[#393E46] to-[#393E46]/80'
                      }`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {message.type === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-[#00ADB5]" />
                      )}
                    </motion.div>

                    {/* Enhanced Message Bubble */}
                    <motion.div 
                      className={`relative ${
                        message.type === 'user'
                          ? 'bg-[#00ADB5] text-white' 
                          : 'bg-[#393E46] text-[#EEEEEE] border border-[#393E46]/70'
                      } rounded-2xl p-4 shadow-lg`}
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
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                            onClick={() => copyMessage(message.id, message.content)}
                            className={`p-1 rounded transition-colors ${
                              message.type === 'user' 
                                ? 'hover:bg-white/20' 
                                : 'hover:bg-[#00ADB5]/20'
                            }`}
                            title="Copy message"
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className={`w-3 h-3 ${
                                message.type === 'user' ? 'text-white/70' : 'text-[#EEEEEE]/70'
                              }`} />
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Enhanced Loading Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-start gap-3 max-w-[80%]">
                  <motion.div 
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#393E46] to-[#393E46]/80 flex items-center justify-center"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Bot className="w-5 h-5 text-[#00ADB5]" />
                  </motion.div>
                  <div className="bg-[#393E46] text-[#EEEEEE] border border-[#393E46]/70 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="w-4 h-4 text-[#00ADB5]" />
                      </motion.div>
                      <span className="text-sm text-[#EEEEEE]/80">Seriva is thinking...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </motion.div>
      </div>      {/* Enhanced Chat Input - Fixed at bottom */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="fixed bottom-0 left-0 right-0 bg-[#222831]/95 backdrop-blur-sm border-t border-[#393E46]/50 z-30"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share your thoughts... I'm here to listen with empathy and understanding."
                className="w-full bg-[#393E46]/80 backdrop-blur-sm border border-[#393E46] rounded-xl px-4 py-3 pr-16 text-[#EEEEEE] placeholder-[#EEEEEE]/50 resize-none focus:ring-2 focus:ring-[#00ADB5] focus:border-[#00ADB5] transition-all duration-200 text-sm"
                rows="2"
                disabled={isLoading}
              />
              
              {/* Enhanced Send Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="absolute bottom-2 right-2 w-10 h-10 bg-[#00ADB5] hover:bg-[#00ADB5]/90 rounded-lg flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Send className="w-4 h-4 text-white" />
              </motion.button>
            </div>
              {/* Voice Input and Actions */}
            <div className="flex gap-2">              {/* Voice Input Button */}
              {speechSupported && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isListening ? stopListening : startListening}
                  className={`p-2 rounded-lg transition-colors relative ${
                    isListening 
                      ? 'bg-red-500/30 hover:bg-red-500/40 ring-2 ring-red-400 ring-opacity-50' 
                      : 'bg-[#393E46]/80 hover:bg-[#393E46]'
                  }`}
                  title={isListening ? "Stop listening (click or wait)" : "Voice input"}
                  disabled={isLoading}
                >
                  {isListening ? (
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0] 
                      }}
                      transition={{ 
                        duration: 0.8, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="relative"
                    >
                      <Mic className="w-5 h-5 text-red-400" />
                      {/* Listening pulse effect */}
                      <motion.div
                        className="absolute inset-0 rounded-full bg-red-400"
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0.3, 0, 0.3]
                        }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity,
                          ease: "easeOut"
                        }}
                      />
                    </motion.div>
                  ) : (
                    <Mic className="w-5 h-5 text-[#00ADB5]" />
                  )}
                </motion.button>
              )}
              
              {/* Voice Toggle Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleVoice}
                className={`p-2 rounded-lg transition-colors ${
                  voiceEnabled 
                    ? 'bg-[#00ADB5]/20 hover:bg-[#00ADB5]/30' 
                    : 'bg-[#393E46]/80 hover:bg-[#393E46]'
                }`}
                title={voiceEnabled ? "Disable voice responses" : "Enable voice responses"}
              >
                {voiceEnabled ? (
                  <Volume2 className="w-5 h-5 text-[#00ADB5]" />
                ) : (
                  <VolumeX className="w-5 h-5 text-[#EEEEEE]/50" />
                )}
              </motion.button>
              
              {/* Stop Speaking Button */}
              {isSpeaking && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopSpeaking}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                  title="Stop speaking"
                >
                  <Pause className="w-5 h-5 text-red-400" />
                </motion.button>
              )}
            </div>
          </div>
            {/* Conversation Style and Voice Status Indicators */}
          <div className="flex items-center justify-center mt-2 space-y-1 flex-col">
            <span className="text-xs text-[#EEEEEE]/50">
              Conversation style: {conversationStyles.find(s => s.value === conversationStyle)?.label}
            </span>
            
            {/* Voice Listening Status */}
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
                  />                  <span className="text-xs text-red-400 font-medium">
                    Listening... Speak clearly or click mic to stop (20s timeout)
                  </span>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                    className="w-2 h-2 bg-red-400 rounded-full"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Speech Not Supported Warning */}
            {!speechSupported && (
              <span className="text-xs text-yellow-400">
                Voice input not supported in this browser
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ChatPage