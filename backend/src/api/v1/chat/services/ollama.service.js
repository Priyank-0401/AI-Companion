import axios from 'axios';
import config from '../../../../config/index.js';
import { logger } from '../../../../utils/logger.js';
import http from 'http';
import https from 'https';

class OllamaService {
  constructor() {
    this.baseUrl = config.ollama.baseUrl || 'http://127.0.0.1:11434';
    this.defaultModel = config.ollama.defaultModel || 'llama3:latest';
    this.timeout = config.ollama.timeout || 300000; // 5 minutes
    this.maxRetries = config.ollama.maxRetries || 2;
    this.agentOptions = {
      keepAlive: true,
      timeout: 60000, // 1 minute
      maxSockets: 20,
      maxFreeSockets: 10,
      keepAliveMsecs: 60000 // 1 minute
    };
  }

  /**
   * Generate a chat completion using Ollama
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Generation options
   * @param {string} options.model - Model to use
   * @param {number} options.temperature - Sampling temperature (0-2)
   * @param {number} options.maxTokens - Maximum number of tokens to generate
   * @param {boolean} options.stream - Whether to stream the response
   * @returns {Promise<Object>} Response from Ollama
   */
  async chatCompletion(messages, options = {}) {
    const {
      model = this.defaultModel,
      temperature = 0.7,
      maxTokens = 2000,
      stream = false,
    } = options;

    const requestData = {
      model,
      messages,
      options: {
        temperature: Math.max(0, Math.min(2, temperature)), // Clamp between 0 and 2
        num_predict: maxTokens,
      },
      stream,
    };

    return this._makeRequest('/api/chat', requestData);
  }

  /**
   * Generate a completion using Ollama
   * @param {string} prompt - The prompt to complete
   * @param {Object} options - Generation options
   * @param {string} options.model - Model to use
   * @param {number} options.temperature - Sampling temperature (0-2)
   * @param {number} options.maxTokens - Maximum number of tokens to generate
   * @param {boolean} options.stream - Whether to stream the response
   * @returns {Promise<Object>} Response from Ollama
   */
  async completion(prompt, options = {}) {
    const {
      model = this.defaultModel,
      temperature = 0.7,
      maxTokens = 2000,
      stream = false,
    } = options;

    const requestData = {
      model,
      prompt,
      options: {
        temperature: Math.max(0, Math.min(2, temperature)),
        num_predict: maxTokens,
      },
      stream,
    };

    return this._makeRequest('/api/generate', requestData);
  }

  /**
   * List available models from Ollama
   * @returns {Promise<Array>} List of available models
   */
  async listModels() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: this.timeout,
      });
      return response.data.models || [];
    } catch (error) {
      logger.error('Error listing models:', error);
      throw new Error('Failed to list models from Ollama');
    }
  }

  /**
   * Get information about a specific model
   * @param {string} modelName - Name of the model to get info for
   * @returns {Promise<Object>} Model information
   */
  async getModelInfo(modelName) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/show`,
        { name: modelName },
        { timeout: this.timeout }
      );
      return response.data;
    } catch (error) {
      logger.error(`Error getting info for model ${modelName}:`, error);
      throw new Error(`Failed to get info for model: ${modelName}`);
    }
  }

  /**
   * Pull a model from Ollama
   * @param {string} modelName - Name of the model to pull
   * @returns {Promise<Object>} Pull status
   */
  async pullModel(modelName) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/pull`,
        { name: modelName, stream: false },
        { timeout: 0 } // No timeout for pull operations as they can take a while
      );
      return response.data;
    } catch (error) {
      logger.error(`Error pulling model ${modelName}:`, error);
      throw new Error(`Failed to pull model: ${modelName}`);
    }
  }

  /**
   * Generate embeddings for a text
   * @param {string} text - Text to generate embeddings for
   * @param {Object} options - Options
   * @param {string} options.model - Model to use for embeddings
   * @returns {Promise<Array>} Embedding vector
   */
  async generateEmbedding(text, options = {}) {
    const { model = this.defaultModel } = options;
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/embeddings`,
        { model, prompt: text },
        { timeout: this.timeout }
      );
      return response.data.embedding || [];
    } catch (error) {
      logger.error('Error generating embeddings:', error);
      throw new Error('Failed to generate embeddings');
    }
  }

  // Private helper methods

  /**
   * Make a request to the Ollama API with retry logic
   * @private
   */
  async _makeRequest(endpoint, data) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('Making request to Ollama:', { url, data });
    
    let lastError;
    let attempt = 0;
    const maxRetries = this.maxRetries;
    
    while (attempt < maxRetries) {
      attempt++;
      try {
        console.log(`Sending request to Ollama (attempt ${attempt}/${maxRetries})...`);
        const response = await axios({
          method: 'post',
          url,
          data,
          timeout: this.timeout,
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Connection': 'keep-alive'
          },
          // Force IPv4 to avoid IPv6 issues
          family: 4,
          httpAgent: new http.Agent(this.agentOptions),
          httpsAgent: new https.Agent(this.agentOptions),
          // Add timeout for the entire request including download
          timeout: 300000, // 5 minutes
          // Add timeout for the connection phase
          connectTimeout: 30000, // 30 seconds
          // Add timeout for the response headers
          responseTimeout: 300000, // 5 minutes
          // Don't throw on non-2xx status codes
          validateStatus: null
        });
        
        console.log('Ollama response received:', {
          status: response.status,
          data: response.data ? 'Received data' : 'No data'
        });
        
        return response.data;
      } catch (error) {
        lastError = error;
        const errorDetails = {
          attempt,
          url,
          error: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
          config: {
            method: error.config?.method,
            timeout: error.config?.timeout,
            headers: error.config?.headers
          }
        };
        
        console.error(`Ollama API attempt ${attempt}/${maxRetries} failed:`, JSON.stringify(errorDetails, null, 2));
        
        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
          const jitter = Math.random() * 1000;
          const delay = baseDelay + jitter;
          console.log(`Retrying in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // If we get here, all retries failed
    if (lastError.code === 'ECONNREFUSED') {
      throw new Error(`Cannot connect to Ollama at ${url}. Make sure Ollama is running and accessible.`);
    } else if (lastError.code === 'ETIMEDOUT') {
      throw new Error(`Request to Ollama timed out after ${this.timeout}ms`);
    } else if (lastError.response) {
      throw new Error(`Ollama API error: ${lastError.response.status} - ${lastError.response.statusText}`);
    } else {
      throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
    }
  }
}

// Create a singleton instance
export default new OllamaService();
