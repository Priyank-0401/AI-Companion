import http from 'http';
import https from 'https';
import { URL } from 'url';
import { logger } from './logger.js';
import AppError from './AppError.js';
import httpStatus from 'http-status';

/**
 * Ollama Client for interacting with local Ollama server
 */
class OllamaClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:11434';
    this.timeout = options.timeout || 1200000; // 20 minutes timeout for long-running generations
    this.defaultModel = options.defaultModel || 'llama3';
    this.conversations = new Map(); // Store conversations in memory
  }

  /**
   * Make HTTP request to Ollama API
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {string} method - HTTP method
   * @returns {Promise<Object>} Response data
   */
  async _request(endpoint, data = {}, method = 'POST') {
    const url = new URL(endpoint, this.baseUrl);
    const postData = JSON.stringify(data);

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: this.timeout,
    };

    return new Promise((resolve, reject) => {
      const req = (url.protocol === 'https:' ? https : http).request(
        url.toString(),
        options,
        (res) => {
          let responseData = '';
          
          res.on('data', (chunk) => {
            responseData += chunk;
          });

          res.on('end', () => {
            try {
              if (responseData) {
                const result = JSON.parse(responseData);
                if (res.statusCode >= 400) {
                  reject(new Error(result.error || `HTTP error ${res.statusCode}`));
                } else {
                  resolve(result);
                }
              } else {
                resolve({});
              }
            } catch (error) {
              reject(new Error(`Failed to parse response: ${error.message}`));
            }
          });
        }
      );

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (method === 'POST' || method === 'PUT') {
        req.write(postData);
      }
      
      req.end();
    });
  }

  /**
   * Generate text using a prompt
   * @param {string} prompt - The prompt to generate text from
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Generated text
   */
  async generate(prompt, options = {}) {
    try {
      const response = await this._request('/api/generate', {
        model: options.model || this.defaultModel,
        prompt,
        stream: false,
        ...options,
      });

      return response.response || '';
    } catch (error) {
      logger.error('Error generating text:', error);
      throw new AppError(
        'Failed to generate text',
        httpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  /**
   * Start a new conversation
   * @param {string} systemPrompt - System prompt to set the context
   * @param {string} model - Model to use for the conversation
   * @returns {string} Conversation ID
   */
  startConversation(systemPrompt = '', model = this.defaultModel) {
    const conversationId = `conv_${Date.now()}`;
    this.conversations.set(conversationId, {
      model,
      messages: systemPrompt ? [{ role: 'system', content: systemPrompt }] : [],
    });
    return conversationId;
  }

  /**
   * Send a message in a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} message - User message
   * @param {Object} options - Generation options
   * @returns {Promise<string>} AI response
   */
  async chat(conversationId, message, options = {}) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', httpStatus.NOT_FOUND);
    }

    try {
      // Add user message to conversation
      conversation.messages.push({ role: 'user', content: message });

      const response = await this._request('/api/chat', {
        model: conversation.model,
        messages: conversation.messages,
        stream: false,
        ...options,
      });

      // Add assistant response to conversation
      if (response.message) {
        conversation.messages.push(response.message);
        return response.message.content;
      }

      return '';
    } catch (error) {
      logger.error('Error in chat:', error);
      throw new AppError(
        'Failed to process chat message',
        httpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  /**
   * Get conversation history
   * @param {string} conversationId - Conversation ID
   * @returns {Array} Conversation messages
   */
  getConversation(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', httpStatus.NOT_FOUND);
    }
    return [...conversation.messages];
  }

  /**
   * End a conversation
   * @param {string} conversationId - Conversation ID
   */
  endConversation(conversationId) {
    this.conversations.delete(conversationId);
  }
}

// Create a singleton instance
const ollamaClient = new OllamaClient({
  baseUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434',
  defaultModel: process.env.OLLAMA_DEFAULT_MODEL || 'llama3',
});

export default ollamaClient;
