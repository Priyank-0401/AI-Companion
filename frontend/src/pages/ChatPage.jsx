import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Loader2, Trash2, Download } from 'lucide-react'
import { chatApi } from '../services/api'
import { useChat } from '../contexts/ChatContext';

const ChatPage = () => {
  const { messages, addMessage, conversationId, setConversationId, resetChat: resetChatContext } = useChat();
  
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationStyle, setConversationStyle] = useState('supportive') 
  const messagesEndRef = useRef(null);
  const initialLoadDoneRef = useRef(false);
  const chatScrollContainerRef = useRef(null);



  useEffect(() => {
    // Initial load: scroll to top if only the welcome message is present.
    if (!initialLoadDoneRef.current && messages.length === 1) { 
      const timer = setTimeout(() => {
        chatScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
        initialLoadDoneRef.current = true;
      }, 0);
      return () => clearTimeout(timer);
    } else if (initialLoadDoneRef.current && messages.length > 1) {
      // Subsequent messages: scroll to bottom within the container only.
      const timer = setTimeout(() => scrollToBottom(), 100);
      return () => clearTimeout(timer);
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
      const response = await chatApi.sendMessage(
        userMessage.content,
        conversationId, // From context
        conversationStyle
      )

      if (!conversationId && response.conversationId) {
        setConversationId(response.conversationId) // From context
      }
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.response,
        timestamp: new Date()
      }

      addMessage(botMessage);
    } catch (error) {
      console.error('Failed to send message:', error)
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I'm sorry, I'm having trouble connecting right now. Please make sure Ollama is running and try again. You can start Ollama by running 'ollama serve' in your terminal.",
        timestamp: new Date(),
        isError: true
      }
      addMessage(errorMessage);
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  const clearChat = () => {
    resetChatContext();
    initialLoadDoneRef.current = false;
    // useEffect will handle scrolling chatScrollContainerRef to top
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
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto p-4 gap-4 relative overflow-hidden">      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-mediumDark to-dark"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-accent/10 via-transparent to-blue-500/10"></div>
        
        {/* Static Gradient Orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-accent/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Enhanced Chat Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-r from-mediumDark/50 to-dark/50 backdrop-blur-xl rounded-2xl border border-mediumDark/30 p-6 shadow-2xl"
      >
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-blue-500/5 rounded-2xl" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Enhanced avatar with animation */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-accent via-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-xl">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-dark flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </motion.div>
            
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-lightText bg-clip-text text-transparent">
                Your Confidential Conversation Space
              </h1>
              <p className="text-lightText/70 text-lg">A safe place to share, reflect, and be understood.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Enhanced conversation style selector */}
            <div className="flex flex-col">
              <label className="text-sm text-lightText/70 mb-2 font-medium">Conversation Style:</label>
              <select
                value={conversationStyle}
                onChange={(e) => setConversationStyle(e.target.value)}
                className="bg-mediumDark/80 border border-mediumDark rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              >
                <option value="supportive">🤗 Supportive & Empathetic</option>
                <option value="analytical">🔍 Analytical & Structured</option>
                <option value="casual">😊 Casual & Friendly</option>
                <option value="professional">💼 Professional & Clear</option>
              </select>
            </div>
            
            {/* Enhanced action buttons */}
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportChat}
                className="p-3 bg-mediumDark/80 backdrop-blur-sm border border-mediumDark rounded-xl hover:bg-accent/20 hover:border-accent/50 transition-all duration-200 group"
                title="Export Chat"
              >
                <Download className="w-5 h-5 text-lightText group-hover:text-accent transition-colors" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearChat}
                className="p-3 bg-mediumDark/80 backdrop-blur-sm border border-mediumDark rounded-xl hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-200 group"
                title="Clear Chat"
              >
                <Trash2 className="w-5 h-5 text-lightText group-hover:text-red-400 transition-colors" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>      {/* Enhanced Chat Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 bg-gradient-to-b from-mediumDark/30 to-dark/30 backdrop-blur-xl rounded-2xl border border-mediumDark/30 shadow-2xl overflow-hidden flex flex-col"
      >        {/* Messages Area with controlled scroll */}
        <div 
          ref={chatScrollContainerRef} 
          className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll-container"
          style={{
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* Internet Explorer 10+ */
          }}
        >
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
                <div className={`flex items-start gap-4 max-w-[85%] ${
                  message.type === 'user' ? 'flex-row-reverse' : ''
                }`}>
                  {/* Enhanced avatar */}
                  <motion.div 
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-br from-accent to-accent/80' 
                        : 'bg-gradient-to-br from-purple-500 via-purple-600 to-blue-500'
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {message.type === 'user' ? (
                      <User className="w-6 h-6 text-white" />
                    ) : (
                      <Bot className="w-6 h-6 text-white" />
                    )}
                  </motion.div>
                  
                  {/* Enhanced message bubble */}
                  <motion.div 
                    className={`relative group ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-accent to-accent/90 text-white rounded-3xl rounded-br-lg' 
                        : 'bg-gradient-to-br from-mediumDark/80 to-dark/80 backdrop-blur-sm border border-mediumDark/50 rounded-3xl rounded-bl-lg'
                    } p-5 shadow-xl transition-all duration-200`}
                    whileHover={{ scale: 1.01 }}
                  >
                    {/* Message content */}
                    <p className={`leading-relaxed whitespace-pre-wrap ${
                      message.type === 'user' ? 'text-white' : 'text-lightText'
                    }`}>
                      {message.content}
                    </p>
                    
                    {/* Timestamp */}
                    <p className={`text-xs mt-3 ${
                      message.type === 'user' ? 'text-white/60' : 'text-lightText/40'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    
                    {/* Message tail */}
                    <div className={`absolute bottom-0 ${
                      message.type === 'user' 
                        ? '-right-2 border-l-[16px] border-l-accent border-t-[16px] border-t-transparent' 
                        : '-left-2 border-r-[16px] border-r-mediumDark/80 border-t-[16px] border-t-transparent'
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
              <div className="flex items-start gap-4 max-w-[85%]">
                <motion.div 
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-blue-500 flex items-center justify-center shadow-lg"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Bot className="w-6 h-6 text-white" />
                </motion.div>
                <div className="bg-gradient-to-br from-mediumDark/80 to-dark/80 backdrop-blur-sm border border-mediumDark/50 rounded-3xl rounded-bl-lg p-5 shadow-xl">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-5 h-5 text-accent" />
                    </motion.div>
                    <span className="text-lightText/70">Seriva is thoughtfully preparing a response...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>        {/* Enhanced Chat Input - Fixed at bottom */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border-t border-mediumDark/30 bg-gradient-to-r from-mediumDark/20 to-dark/20 backdrop-blur-sm p-6 flex-shrink-0"
        >
          <div className="flex gap-4 items-end">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share your thoughts... I'm here to listen with empathy and understanding."
                className="w-full bg-mediumDark/50 backdrop-blur-sm border border-mediumDark/50 rounded-2xl px-6 py-4 pr-16 text-white placeholder-lightText/50 resize-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 scrollbar-thin scrollbar-thumb-mediumDark scrollbar-track-transparent"
                rows="3"
                disabled={isLoading}
              />
              
              {/* Enhanced send button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-r from-accent to-accent/80 rounded-xl flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-accent/25 transition-all duration-200"
              >
                <Send className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>
          
          <p className="text-xs text-lightText/40 mt-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Press Enter to send • Shift+Enter for new line • Your conversations are private and secure
          </p>
        </motion.div>      </motion.div>
    </div>
  )
}

export default ChatPage