import axios from 'axios';
import config from '../../../../config/index.js';
import { logger } from '../../../../utils/logger.js';

class OllamaService {
  constructor() {
    this.baseUrl = config.ollama.baseUrl || 'http://localhost:11434';
    this.defaultModel = config.ollama.defaultModel || 'llama3:latest';
    this.timeout = config.ollama.timeout || 30000; // 30 seconds
    this.maxRetries = config.ollama.maxRetries || 3;
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
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `${this.baseUrl}${endpoint}`,
          data,
          {
            timeout: this.timeout,
            headers: {
              'Content-Type': 'application/json',
            },
            responseType: data.stream ? 'stream' : 'json',
          }
        );

        // For streaming responses, return the response stream directly
        if (data.stream) {
          return response.data;
        }

        return response.data;
      } catch (error) {
        lastError = error;
        
        // Log the error
        logger.error(
          `Attempt ${attempt}/${this.maxRetries} failed for ${endpoint}:`,
          error.message
        );

        // If this is the last attempt, rethrow the error
        if (attempt === this.maxRetries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // If we get here, all retries failed
    throw new Error(
      `Failed to complete request to Ollama after ${this.maxRetries} attempts: ${lastError.message}`
    );
  }
}

// Create a singleton instance
export default new OllamaService();
