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
    const requestId = Math.random().toString(36).substring(2, 8);
    
    try {
      // Log the start of the chat completion
      logger.info(`[GroqService] [${requestId}] Starting chat completion with model: ${model}`, {
        model,
        messageCount: messages.length,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        stream: options.stream || false
      });

      // Prepare the request data
      const requestData = {
        model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        stream: options.stream || false
      };

      // Log the request payload (without sensitive data)
      logger.debug(`[GroqService] [${requestId}] Request payload:`, {
        model,
        messageCount: messages.length,
        temperature: requestData.temperature,
        max_tokens: requestData.max_tokens,
        stream: requestData.stream,
        sampleMessages: messages.slice(0, 2).map(m => ({
          role: m.role,
          content: m.content.substring(0, 50) + (m.content.length > 50 ? '...' : '')
        }))
      });

      // Make the API request
      const response = await this._makeRequest('/chat/completions', requestData);
      
      // Debug the raw response structure
      console.log('Raw Groq API Response:', JSON.stringify(response, null, 2));

      // Validate the response
      if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
        throw new Error('No choices returned in the response');
      }

      const firstChoice = response.choices[0];
      if (!firstChoice || !firstChoice.message) {
        throw new Error('Invalid response format: missing message in choice');
      }
      
      // Handle the response content
      let content = firstChoice.message.content;
      if (content === undefined || content === null) {
        throw new Error('Message content is null or undefined in the response');
      }
      
      // If content is an object, try to stringify it
      if (typeof content === 'object') {
        try {
          content = JSON.stringify(content);
        } catch (e) {
          logger.warn(`[GroqService] [${requestId}] Failed to stringify message content`, {
            error: e.message,
            content: content
          });
          content = 'Received an object that could not be stringified';
        }
      }

      // Ensure the response has the expected structure
      const result = {
        id: response.id || `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: [{
          index: 0,
          message: {
            role: firstChoice.message.role || 'assistant',
            content: content
          },
          finish_reason: firstChoice.finish_reason || 'stop'
        }],
        usage: response.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        },
        // Include the provider name for tracking
        provider: 'groq'
      };

      // Log token usage if available
      if (response.usage) {
        const { prompt_tokens, completion_tokens } = response.usage;
        this.logUsage(model, prompt_tokens, completion_tokens, startTime);
        
        logger.info(`[GroqService] [${requestId}] Token usage - Input: ${prompt_tokens}, Output: ${completion_tokens}, Total: ${prompt_tokens + completion_tokens}`, {
          model,
          promptTokens: prompt_tokens,
          completionTokens: completion_tokens,
          totalTokens: prompt_tokens + completion_tokens,
          responseTime: Date.now() - startTime,
          finishReason: firstChoice.finish_reason || 'unknown'
        });
      } else {
        logger.warn(`[GroqService] [${requestId}] No token usage information in response`, {
          model,
          responseTime: Date.now() - startTime,
          hasChoices: response.choices && response.choices.length > 0
        });
      }

      // Log the final response being returned
      logger.debug(`[GroqService] [${requestId}] Returning response:`, {
        model: result.model,
        contentLength: result.choices[0].message.content?.length || 0,
        finishReason: result.choices[0].finish_reason || 'unknown',
        usage: result.usage
      });

      return result;

    } catch (error) {
      // Log the error with detailed context
      const errorContext = {
        error: error.message,
        stack: error.stack,
        model: options.model,
        messageCount: messages.length,
        requestId
      };
      
      // Add more context for specific error types
      if (error.response) {
        errorContext.response = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
      }
      
      logger.error(`[GroqService] [${requestId}] Error in chat completion:`, errorContext);
      
      // Enhance the error with more context
      const enhancedError = new Error(`Groq API error: ${error.message}`);
      enhancedError.status = error.status || 500;
      enhancedError.originalError = error;
      
      // Handle specific error cases
      if (error.message.includes('No auth credentials found') || 
          error.message.includes('Incorrect API key provided')) {
        enhancedError.message = 'Groq API key is missing or invalid. Please check your GROQ_API_KEY environment variable.';
        enhancedError.status = 401;
      } else if (error.message.includes('rate limit') || error.status === 429) {
        enhancedError.message = 'Rate limit exceeded for Groq API. Please try again later.';
        enhancedError.status = 429;
      } else if (error.message.includes('model not found')) {
        enhancedError.message = `The requested model '${options.model}' was not found. Please check the model name and try again.`;
        enhancedError.status = 400;
      }
      
      throw enhancedError;
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

  /**
   * List available models from Groq
   * @returns {Object} Available models with their configurations
   */
  /**
   * Make a request to the Groq API with detailed logging
   * @private
   */
  async _makeRequest(endpoint, data) {
    const url = `${this.baseUrl}${endpoint}`;
    const requestId = Math.random().toString(36).substring(2, 8);
    const startTime = Date.now();
    
    // Log the request details (without sensitive data)
    logger.debug(`[GroqService] [${requestId}] Making request to: ${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer [REDACTED]' // Don't log the actual API key
      },
      body: {
        model: data.model,
        temperature: data.temperature,
        max_tokens: data.max_tokens,
        stream: data.stream,
        messageCount: data.messages?.length || 0,
        // Include a sample of the first message for debugging
        sampleMessage: data.messages?.[0]?.content?.substring(0, 50) || ''
      }
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(data)
      });

      const responseTime = Date.now() - startTime;
      let responseData;
      let responseText;
      
      try {
        responseText = await response.text();
        responseData = responseText ? JSON.parse(responseText) : {};
        
        logger.debug(`[GroqService] [${requestId}] Successfully parsed JSON response`, {
          status: response.status,
          hasChoices: Array.isArray(responseData.choices) && responseData.choices.length > 0,
          choiceCount: responseData.choices?.length || 0,
          hasUsage: !!responseData.usage
        });
      } catch (parseError) {
        logger.error(`[GroqService] [${requestId}] Failed to parse JSON response`, {
          status: response.status,
          statusText: response.statusText,
          error: parseError.message,
          responseText: responseText ? 
            (responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '')) : 
            '[No response text]',
          responseTime
        });
        throw new Error(`Failed to parse JSON response: ${parseError.message}`);
      }

      if (!response.ok) {
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          url,
          responseTime,
          error: responseData.error || 'No error details in response'
        };
        
        logger.error(`[GroqService] [${requestId}] API request failed`, errorDetails);
        
        const error = new Error(responseData.error?.message || `API request failed with status ${response.status}`);
        error.status = response.status;
        error.response = responseData;
        error.details = errorDetails;
        throw error;
      }

      logger.debug(`[GroqService] [${requestId}] Request successful`, {
        status: response.status,
        responseTime,
        responseId: responseData.id,
        model: responseData.model,
        hasChoices: Array.isArray(responseData.choices) ? responseData.choices.length : 0,
        usage: responseData.usage || {}
      });

      return responseData;
    } catch (error) {
      const errorContext = {
        error: error.message,
        endpoint,
        url,
        responseTime: Date.now() - startTime,
        stack: error.stack
      };
      
      // If this is a fetch error (like network error), it won't have status
      if (!error.status && error.name === 'FetchError') {
        errorContext.errorType = 'NetworkError';
        errorContext.details = error.message;
      }
      
      logger.error(`[GroqService] [${requestId}] Request error`, errorContext);
      
      // Enhance the error with additional context
      error.endpoint = endpoint;
      error.url = url;
      error.requestId = requestId;
      
      throw error;
    }
  }

  /**
   * List available models from Groq
   * @returns {Object} Available models with their configurations
   */
  async listModels() {
    return {
      'llama3-8b-8192': {
        displayName: 'LLaMA 3 8B',
        maxTokens: 8192,
        supportsStreaming: true,
        description: '8 billion parameter model with 8K context window',
        pricing: this.tokenUsage.pricing['llama3-8b-8192']
      },
      'llama3-70b-8192': {
        displayName: 'LLaMA 3 70B',
        maxTokens: 8192,
        supportsStreaming: true,
        description: '70 billion parameter model with 8K context window',
        pricing: this.tokenUsage.pricing['llama3-70b-8192']
      },
      'mixtral-8x7b-32768': {
        displayName: 'Mixtral 8x7B',
        maxTokens: 32768,
        supportsStreaming: true,
        description: 'Mixture of Experts model with 32K context window',
        pricing: this.tokenUsage.pricing['mixtral-8x7b-32768']
      }
    };
  }
}
