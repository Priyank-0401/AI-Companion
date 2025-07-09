import BaseProvider from './BaseProvider.js';
import { logger } from '../../../../../utils/logger.js';

export default class GroqService extends BaseProvider {
  constructor() {
    super();
    this.baseUrl = 'https://api.groq.com/openai/v1';
    this.apiKey = process.env.GROQ_API_KEY;
    
    // Pricing per 1M tokens (input/output)
    this.tokenUsage.pricing = {
      'llama3-8b-8192': {
        input: 0.10,
        output: 0.10
      },
      'llama3-70b-8192': {
        input: 0.80,
        output: 0.80
      },
      'mixtral-8x7b-32768': {
        input: 0.27,
        output: 0.27
      }
    };
  }

  /**
   * Get chat completion from Groq
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Completion response
   */
  async chatCompletion(messages, options = {}) {
    const startTime = Date.now();
    const model = options.model || 'llama3-8b-8192';
    
    try {
      const response = await this._makeRequest('/chat/completions', {
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        stream: options.stream || false
      });

      // Log token usage
      if (response.usage) {
        const { prompt_tokens, completion_tokens } = response.usage;
        this.logUsage(model, prompt_tokens, completion_tokens, startTime);
      }

      return response;
    } catch (error) {
      logger.error('Groq API error:', {
        error: error.message,
        model,
        options
      });
      throw error;
    }
  }

  /**
   * Stream chat completion from Groq
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Generation options
   * @returns {AsyncGenerator} Stream of response chunks
   */
  async *streamChatCompletion(messages, options = {}) {
    const model = options.model || 'llama3-8b-8192';
    const url = `${this.baseUrl}/chat/completions`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000,
          stream: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to stream from Groq API');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // Keep the last incomplete line in the buffer

        for (const line of lines) {
          if (line.trim() === 'data: [DONE]') {
            return;
          }
          
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              yield data;
            } catch (e) {
              logger.error('Error parsing stream chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Groq streaming error:', {
        error: error.message,
        model,
        options
      });
      throw error;
    }
  }
}
