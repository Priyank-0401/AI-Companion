import BaseProvider from './BaseProvider.js';
import { logger } from '../../../../../utils/logger.js';

export default class OpenRouterService extends BaseProvider {
  constructor() {
    super();
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.apiKey = process.env.OPENROUTER_API_KEY;
    
    // Pricing per 1M tokens (input/output)
    this.tokenUsage.pricing = {
      // Claude models
      'anthropic/claude-3-haiku': {
        input: 0.25,
        output: 1.25
      },
      'anthropic/claude-3-opus': {
        input: 15.00,
        output: 75.00
      },
      // Mistral models
      'mistralai/mistral-7b-instruct': {
        input: 0.15,
        output: 0.15
      },
      'mistralai/mixtral-8x7b-instruct': {
        input: 0.27,
        output: 0.27
      },
      // OpenAI models
      'openai/gpt-3.5-turbo': {
        input: 0.50,
        output: 1.50
      },
      'openai/gpt-4': {
        input: 30.00,
        output: 60.00
      }
    };
  }

  /**
   * Get chat completion from OpenRouter
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Completion response
   */
  async chatCompletion(messages, options = {}) {
    const startTime = Date.now();
    const model = options.model || 'anthropic/claude-3-haiku';
    
    try {
      const response = await this._makeRequest(
        '/chat/completions',
        {
          model,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000,
          stream: false // OpenRouter's Claude doesn't support streaming
        },
        {
          headers: {
            'HTTP-Referer': process.env.APP_URL || 'https://your-app.com',
            'X-Title': 'AI Companion',
            'Content-Type': 'application/json'
          }
        }
      );

      // Log token usage
      if (response.usage) {
        const { prompt_tokens, completion_tokens } = response.usage;
        this.logUsage(model, prompt_tokens, completion_tokens, startTime);
      }

      return response;
    } catch (error) {
      logger.error('OpenRouter API error:', {
        error: error.message,
        model,
        options
      });
      throw error;
    }
  }

  /**
   * Simulate streaming for providers that don't support it natively
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Generation options
   * @returns {AsyncGenerator} Simulated stream of response chunks
   */
  async *streamChatCompletion(messages, options = {}) {
    const model = options.model || 'anthropic/claude-3-haiku';
    const chunkSize = options.chunkSize || 10; // Number of words per chunk
    
    try {
      // Get the full response first
      const response = await this.chatCompletion(messages, {
        ...options,
        stream: false
      });

      const content = response.choices[0]?.message?.content || '';
      const words = content.split(/\s+/);
      
      // Split into chunks and yield them with a small delay
      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        
        yield {
          choices: [{
            delta: { content: chunk + ' ' },
            finish_reason: null
          }]
        };
        
        // Small delay to simulate real streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Final chunk
      yield {
        choices: [{
          delta: {},
          finish_reason: 'stop'
        }]
      };
    } catch (error) {
      logger.error('OpenRouter streaming simulation error:', {
        error: error.message,
        model,
        options
      });
      throw error;
    }
  }
}
