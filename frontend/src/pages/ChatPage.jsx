import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, User, Loader2 } from 'lucide-react'

const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Welcome! It's wonderful to see you. I'm Seriva, a friendly presence here to listen without judgment, offer support, and explore any thoughts or feelings you'd like to share. How can I help you feel more supported today?",
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationStyle, setConversationStyle] = useState('supportive') 
  const messagesEndRef = useRef(null);
  const initialLoadDoneRef = useRef(false);
  const chatScrollContainerRef = useRef(null);

  const addMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const resetChat = () => {
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
          conversationId: null, // Pass conversationId if available
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

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-background-light to-background-dark text-text-light pt-16 pb-16">
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-6xl mx-auto mb-8 text-center px-4"
      >
        <h2 className="text-4xl sm:text-5xl font-bold text-primary-accent mb-3">
          Chat With Seriva
        </h2>
      </motion.header>

      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-6"
        >
          {/* Full Width Chat Container */}
          <div className="flex-1 flex flex-col w-full">
            {/* Messages Area with controlled scroll */}
            <div 
              ref={chatScrollContainerRef} 
              className="h-[580px] overflow-y-auto px-8 py-6 space-y-6"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#475569 transparent'
              }}
            >
              <div className="max-w-5xl mx-auto space-y-6">
                <AnimatePresence mode="popLayout">
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -30, scale: 0.95 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: index * 0.05,
                        type: "spring",
                        stiffness: 200,
                        damping: 20
                      }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start gap-4 max-w-[75%] ${
                        message.type === 'user' ? 'flex-row-reverse' : ''
                      }`}>
                        {/* Enhanced avatar */}
                        <motion.div 
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                          message.type === 'user' 
                            ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                            : ''
                        }`}
                        whileHover={{ scale: 1.05 }}
                      >
                        {message.type === 'user' ? (
                          <User className="w-6 h-6 text-white" />
                        ) : (
                          <img 
                            src="/logo.png" 
                            alt="Application Logo" 
                            className="w-20 h-20 rounded-full object-cover" 
                            style={{ background: 'transparent' }}
                          />
                        )}
                      </motion.div>

                        
                        {/* Enhanced message bubble */}
                        <motion.div 
                          className={`relative group ${
                            message.type === 'user'
                              ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-3xl rounded-br-lg' 
                              : 'bg-gradient-to-br from-slate-700/80 to-slate-800/80 backdrop-blur-sm border border-slate-600/50 rounded-3xl rounded-bl-lg'
                          } p-6 shadow-xl transition-all duration-200`}
                          whileHover={{ scale: 1.01 }}
                        >
                          {/* Message content */}
                          <p className={`leading-relaxed whitespace-pre-wrap text-base ${
                            message.type === 'user' ? 'text-white' : 'text-slate-100'
                          }`}>
                            {message.content}
                          </p>
                          
                          {/* Timestamp */}
                          <p className={`text-xs mt-3 ${
                            message.type === 'user' ? 'text-white/60' : 'text-slate-400'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          
                          {/* Message tail */}
                          <div className={`absolute bottom-0 ${
                            message.type === 'user' 
                              ? '-right-2 border-l-[16px] border-l-purple-500 border-t-[16px] border-t-transparent' 
                              : '-left-2 border-r-[16px] border-r-slate-700/80 border-t-[16px] border-t-transparent'
                          }`} />
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Enhanced loading indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start gap-4 max-w-[75%]">
                      <motion.div 
                        className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-blue-500 flex items-center justify-center shadow-lg"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <User className="w-6 h-6 text-white" />
                      </motion.div>
                      <div className="bg-gradient-to-br from-slate-700/80 to-slate-800/80 backdrop-blur-sm border border-slate-600/50 rounded-3xl rounded-bl-lg p-6 shadow-xl">
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader2 className="w-5 h-5 text-purple-400" />
                          </motion.div>
                          <span className="text-slate-300">Seriva is typing...</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Full Width Chat Input - Fixed at bottom */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="fixed bottom-0 left-0 right-0 flex justify-center border-t border-slate-600/30 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm z-10"
            >
              <div className="w-full max-w-6xl mx-auto px-8 py-6">
                <div className="flex gap-4 items-end">
                  <div className="flex-1 relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Share your thoughts... I'm here to listen with empathy and understanding."
                      className="w-full bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl px-6 py-4 pr-16 text-white placeholder-slate-400 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-base"
                      rows="3"
                      disabled={isLoading}
                    />
                    
                    {/* Enhanced send button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isLoading}
                      className="absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-purple-500/25 transition-all duration-200"
                    >
                      <Send className="w-5 h-5 text-white" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ChatPage