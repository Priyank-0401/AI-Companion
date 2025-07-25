import { validationResult } from 'express-validator';
import LLMService from '../services/LLMService.js';
import { logger } from '../../../../utils/logger.js';
import config from '../../../../config/index.js';
import { ERROR_TYPES, createError } from '../../../../utils/llm-errors.js';

class LLMController {
  /**
   * Send a message and get a response from the LLM
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async sendMessage(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { messages, model, provider, temperature, maxTokens, context } = req.body;
      
      // Validate required fields
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Messages array is required and cannot be empty'
        });
      }

      // Call the LLM service with context
      const response = await LLMService.chatCompletion(messages, {
        provider,
        model,
        temperature: temperature || 0.7,
        maxTokens: maxTokens || 2000,
        stream: false,
        context: context || {}
      });

      // Return the response
      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      logger.error('Error in sendMessage:', error);
      next(error);
    }
  }

  /**
   * Stream a response from the LLM
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async streamMessage(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { messages, model, provider, temperature, maxTokens, context } = req.body;
      
      // Validate required fields
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Messages array is required and cannot be empty'
        });
      }

      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Handle client disconnect
      req.on('close', () => {
        logger.info('Client disconnected from stream');
        res.end();
      });

      // Inject Seriva's system prompt into messages with context
      const processedMessages = LLMService.injectSerivaSystemPrompt(messages, context || {});

      // Choose the appropriate streaming method based on provider
      const stream = provider === 'groq' 
        ? LLMService.providers.groq.streamChatCompletion(processedMessages, {
            model,
            temperature: temperature || 0.7,
            maxTokens: maxTokens || 2000
          })
        : LLMService.providers.openrouter.streamChatCompletion(processedMessages, {
            model: model || 'anthropic/claude-3-haiku',
            temperature: temperature || 0.7,
            maxTokens: maxTokens || 2000
          });

      // Stream the response
      for await (const chunk of stream) {
        if (chunk.choices && chunk.choices[0]) {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          // @ts-ignore - flush is not in the type definitions but exists in Express
          if (typeof res.flush === 'function') {
            // @ts-ignore
            res.flush();
          }
        }
      }

      // Send the final chunk
      res.write('data: [DONE]\n\n');
      res.end();

    } catch (error) {
      logger.error('Error in streamMessage:', error);
      
      // If headers haven't been sent yet, send an error response
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error: 'Error streaming response'
        });
      }
      
      // Otherwise, send an error event
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }

  /**
   * List available models from all providers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async listModels(req, res, next) {
    try {
      // Return a static list of supported models with their providers
      const models = [
        // Groq models
        { id: 'llama3-8b-8192', name: 'LLaMA 3 8B', provider: 'groq' },
        { id: 'llama3-70b-8192', name: 'LLaMA 3 70B', provider: 'groq' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'groq' },
        
        // OpenRouter models
        { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'openrouter' },
        { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'openrouter' },
        { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B', provider: 'openrouter' },
        { id: 'mistralai/mixtral-8x7b-instruct', name: 'Mixtral 8x7B', provider: 'openrouter' },
        { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openrouter' },
        { id: 'openai/gpt-4', name: 'GPT-4', provider: 'openrouter' },
      ];

      res.json({
        success: true,
        data: models
      });
    } catch (error) {
      logger.error('Error listing models:', error);
      next(error);
    }
  }

  /**
   * Get usage statistics for LLM API calls
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getUsage(req, res, next) {
    try {
      const { provider, model, groupBy } = req.query;
      
      // Get usage statistics from the LLM service
      const usage = LLMService.getUsage();
      
      // Filter by provider if specified
      let filteredUsage = { ...usage };
      
      if (provider) {
        if (!usage.byProvider[provider]) {
          throw createError(
            `Provider '${provider}' not found`,
            ERROR_TYPES.PROVIDER_NOT_FOUND
          );
        }
        
        filteredUsage.byProvider = { [provider]: usage.byProvider[provider] };
        
        // Filter models for this provider
        if (model) {
          if (!usage.byModel[model]) {
            throw createError(
              `Model '${model}' not found for provider '${provider}'`,
              ERROR_TYPES.MODEL_NOT_FOUND
            );
          }
          
          filteredUsage.byModel = { [model]: usage.byModel[model] };
        } else {
          // Only include models for this provider
          const providerModels = Object.entries(usage.byModel)
            .filter(([modelId]) => modelId.startsWith(provider))
            .reduce((acc, [modelId, modelData]) => ({
              ...acc,
              [modelId]: modelData
            }), {});
            
          filteredUsage.byModel = providerModels;
        }
      } else if (model) {
        // Filter by model only
        if (!usage.byModel[model]) {
          throw createError(
            `Model '${model}' not found`,
            ERROR_TYPES.MODEL_NOT_FOUND
          );
        }
        
        filteredUsage.byModel = { [model]: usage.byModel[model] };
      }
      
      // Group by time period if specified
      if (groupBy) {
        // Implement time-based grouping logic here
        // This is a simplified example - you'd want to store timestamps with each request
        // to properly group by time periods
        filteredUsage.groupedBy = groupBy;
        filteredUsage.timeSeries = {
          message: 'Time-based grouping not yet implemented. Please store timestamps with each request to enable this feature.'
        };
      }
      
      res.json({
        success: true,
        data: filteredUsage
      });
      
    } catch (error) {
      logger.error('Error getting usage statistics:', error);
      next(error);
    }
  }
  
  /**
   * Reset usage statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async resetUsage(req, res, next) {
    try {
      const result = LLMService.resetUsage();
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('Error resetting usage statistics:', error);
      next(error);
    }
  }
  
  /**
   * Get status of LLM providers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getStatus(req, res, next) {
    try {
      const providers = Object.keys(config.llm.providers);
      const status = {};
      
      // Check each provider's status
      for (const provider of providers) {
        try {
          const providerInstance = LLMService.providers[provider];
          
          if (providerInstance && typeof providerInstance.getStatus === 'function') {
            status[provider] = await providerInstance.getStatus();
          } else {
            // Basic status check if getStatus is not implemented
            status[provider] = {
              status: 'unknown',
              message: 'Status check not implemented for this provider'
            };
          }
        } catch (error) {
          logger.error(`Error checking status for provider ${provider}:`, error);
          status[provider] = {
            status: 'error',
            message: error.message,
            error: error.toString()
          };
        }
      }
      
      res.json({
        success: true,
        data: status
      });
      
    } catch (error) {
      logger.error('Error getting provider status:', error);
      next(error);
    }
  }
}

export default new LLMController();
