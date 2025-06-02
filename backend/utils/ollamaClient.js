const http = require('http')
const https = require('https')
const url = require('url')

/**
 * Ollama Client for interacting with local Ollama server
 */
class OllamaClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:11434'
    this.timeout = options.timeout || 1200000 // Increased timeout to 60 seconds
    this.defaultModel = options.defaultModel || 'llama3'
    this.conversations = new Map() // Store conversations in memory
  }

  /**
   * Make HTTP request to Ollama API
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {string} method - HTTP method
   * @returns {Promise<Object>} Response data
   */
  async makeRequest(endpoint, data = null, method = 'GET') {
    return new Promise((resolve, reject) => {
      const fullUrl = `${this.baseUrl}${endpoint}`
      const parsedUrl = new URL(fullUrl)
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: this.timeout,
        family: 4 // Force IPv4
      }

      if (data) {
        const postData = JSON.stringify(data)
        options.headers['Content-Length'] = Buffer.byteLength(postData)
      }

      const protocol = parsedUrl.protocol === 'https:' ? https : http
      const req = protocol.request(options, (res) => {
        let responseData = ''

        res.on('data', (chunk) => {
          responseData += chunk
        })

        res.on('end', () => {
          try {
            const parsed = responseData ? JSON.parse(responseData) : {}
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed)
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${parsed.error || 'Unknown error'}`))
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`))
          }
        })
      })

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`))
      })

      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })

      if (data) {
        req.write(JSON.stringify(data))
      }

      req.end()
    })
  }

  /**
   * Generate response from Ollama
   * @param {string} prompt - User prompt
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated response
   */
  async generateResponse(prompt, options = {}) {
    try {
      const model = options.model || this.defaultModel
      const system = options.system || this.getSystemPrompt(options.conversationStyle)
      
      const requestData = {
        model: model,
        prompt: prompt,
        system: system,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          top_k: options.top_k || 40,
          num_predict: this.getMaxTokens(options.responseLength),
          ...options.modelOptions
        }
      }

      const response = await this.makeRequest('/api/generate', requestData, 'POST')
      
      return {
        success: true,
        response: response.response,
        model: response.model,
        prompt_eval_count: response.prompt_eval_count,
        eval_count: response.eval_count,
        eval_duration: response.eval_duration
      }
    } catch (error) {
      console.error('Ollama generation error:', error)
      return {
        success: false,
        error: error.message,
        fallback: this.getFallbackResponse()
      }
    }
  }

  /**
   * Get list of available models
   * @returns {Promise<Object>} List of models
   */
  async listModels() {
    try {
      const response = await this.makeRequest('/api/tags')
      return {
        success: true,
        models: response.models || []
      }
    } catch (error) {
      console.error('Failed to list models:', error)
      return {
        success: false,
        error: error.message,
        models: []
      }
    }
  }

  /**
   * Check if Ollama server is running
   * @returns {Promise<boolean>} Server status
   */
  async isServerRunning() {
    try {
      await this.makeRequest('/api/tags')
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Check Ollama server health
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    try {
      const isRunning = await this.isServerRunning()
      if (!isRunning) {
        return {
          status: 'unhealthy',
          message: 'Ollama server is not responding',
          timestamp: new Date().toISOString()
        }
      }

      const modelsResponse = await this.listModels()
      const hasModels = modelsResponse.success && modelsResponse.models.length > 0
      
      return {
        status: 'healthy',
        message: 'Ollama server is running',
        models_available: hasModels,
        model_count: modelsResponse.models?.length || 0,
        default_model: this.defaultModel,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Health check failed: ${error.message}`,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Get system prompt based on conversation style
   * @param {string} style - Conversation style
   * @returns {string} System prompt
   */
  getSystemPrompt(style = 'supportive') {
    const prompts = {
      supportive: `You are a compassionate AI companion designed to provide emotional support and meaningful conversations. You are empathetic, understanding, and always prioritize the user's wellbeing. Respond with warmth and genuine care, offering gentle guidance when appropriate. Keep responses conversational and avoid being overly clinical or formal.`,
      
      analytical: `You are an analytical AI companion that helps users think through problems systematically. You ask thoughtful questions, help break down complex issues, and provide structured insights. While maintaining empathy, focus on helping users analyze situations objectively and develop practical solutions.`,
      
      casual: `You are a friendly, casual AI companion - like talking to a good friend. Use a relaxed, conversational tone with natural language. Be supportive but keep things light and approachable. You can use humor when appropriate and speak in a more informal way.`,
      
      professional: `You are a professional AI companion that provides thoughtful, well-structured responses. Maintain a respectful and competent tone while being supportive. Focus on providing clear, actionable insights and maintain appropriate boundaries in conversations.`
    }

    return prompts[style] || prompts.supportive
  }

  /**
   * Get max tokens based on response length preference
   * @param {string} length - Response length preference
   * @returns {number} Max tokens
   */
  getMaxTokens(length = 'medium') {
    const lengths = {
      short: 150,
      medium: 300,
      long: 500
    }
    return lengths[length] || lengths.medium
  }
  /**
   * Get fallback response when Ollama is unavailable
   * @returns {string} Fallback response
   */
  getFallbackResponse() {
    const responses = [
      "I'm here to listen and support you. Could you tell me more about what's on your mind?",
      "It sounds like you're going through something important. I'm here to help however I can.",
      "Thank you for sharing that with me. Your feelings are completely valid. How can I best support you right now?",
      "I appreciate you opening up to me. Sometimes it helps to talk through what we're experiencing. What would be most helpful for you?",
      "I hear you, and I want you to know that it's okay to feel the way you do. What's the most pressing thing on your mind today?"
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }

  /**
   * Send a message and get AI response with conversation context
   * @param {string} message - User message
   * @param {string} conversationId - Conversation ID (optional)
   * @param {string} style - Conversation style
   * @returns {Promise<Object>} Response with conversation details
   */
  async sendMessage(message, conversationId = null, style = 'supportive') {
    try {
      // Generate or use existing conversation ID
      const convId = conversationId || this.generateConversationId()
      
      // Get or create conversation
      let conversation = this.conversations.get(convId) || {
        id: convId,
        messages: [],
        style: style,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Add user message to conversation
      const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }
      conversation.messages.push(userMessage)

      // Build context from conversation history
      const context = this.buildContextFromConversation(conversation)
      
      // Generate AI response using Ollama
      const response = await this.generateResponse(context, {
        conversationStyle: style,
        model: this.defaultModel // Reverted to defaultModel
      })

      let aiResponse
      if (response.success) {
        aiResponse = {
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString(),
          model: response.model
        }
      } else {
        // Use fallback if Ollama fails
        aiResponse = {
          role: 'assistant',
          content: response.fallback || this.getFallbackResponse(),
          timestamp: new Date().toISOString(),
          model: 'fallback',
          error: response.error
        }
      }

      // Add AI response to conversation
      conversation.messages.push(aiResponse)
      conversation.updatedAt = new Date().toISOString()
      
      // Store updated conversation
      this.conversations.set(convId, conversation)

      return {
        success: true,
        message: aiResponse.content,
        conversationId: convId,
        timestamp: aiResponse.timestamp,
        model: aiResponse.model
      }

    } catch (error) {
      console.error('Send message error:', error)
      return {
        success: false,
        message: this.getFallbackResponse(),
        conversationId: conversationId || this.generateConversationId(),
        timestamp: new Date().toISOString(),
        error: error.message
      }
    }
  }

  /**
   * Build context string from conversation history
   * @param {Object} conversation - Conversation object
   * @returns {string} Context string for AI
   */
  buildContextFromConversation(conversation) {
    const recentMessages = conversation.messages.slice(-10) // Last 10 messages for context
    
    if (recentMessages.length === 0) {
      return conversation.messages[conversation.messages.length - 1].content
    }

    // Build conversation context
    let context = recentMessages
      .slice(0, -1) // Exclude the current message
      .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
      .join('\n\n')

    // Add current user message
    const currentMessage = recentMessages[recentMessages.length - 1]
    if (context) {
      context += '\n\nHuman: ' + currentMessage.content
    } else {
      context = currentMessage.content
    }

    return context
  }

  /**
   * Generate unique conversation ID
   * @returns {string} Conversation ID
   */
  generateConversationId() {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  /**
   * Get all conversations
   * @returns {Promise<Array>} List of conversations
   */
  async getConversations() {
    try {
      const conversations = Array.from(this.conversations.values())
        .map(conv => ({
          id: conv.id,
          style: conv.style,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          messageCount: conv.messages.length,
          lastMessage: conv.messages[conv.messages.length - 1]?.content?.substring(0, 100) + '...'
        }))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

      return conversations
    } catch (error) {
      console.error('Error getting conversations:', error)
      return []
    }
  }

  /**
   * Get specific conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object|null>} Conversation object
   */
  async getConversation(conversationId) {
    try {
      return this.conversations.get(conversationId) || null
    } catch (error) {
      console.error('Error getting conversation:', error)
      return null
    }
  }

  /**
   * Delete conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteConversation(conversationId) {
    try {
      return this.conversations.delete(conversationId)
    } catch (error) {
      console.error('Error deleting conversation:', error)
      return false
    }
  }

  /**
   * Get available models from Ollama
   * @returns {Promise<Array>} List of available models
   */
  async getAvailableModels() {
    try {
      const response = await this.listModels()
      if (response.success) {
        return response.models.map(model => ({
          name: model.name,
          size: model.size,
          modified_at: model.modified_at
        }))
      }
      return []
    } catch (error) {
      console.error('Error getting available models:', error)
      return []
    }
  }
}

module.exports = OllamaClient
