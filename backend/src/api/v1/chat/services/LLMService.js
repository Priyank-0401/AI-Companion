import GroqService from './providers/GroqService.js';
import OpenRouterService from './providers/OpenRouterService.js';
import { logger } from '../../../../utils/logger.js';
import { formatMessages, calculateTokenUsage } from '../../../../utils/llm-utils.js';
import { ERROR_TYPES } from '../../../../utils/llm-errors.js';

class LLMService {
  constructor() {
    this.providers = {
      groq: new GroqService(),
      openrouter: new OpenRouterService()
    };
    
    // Track usage statistics
    this.usage = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      byProvider: {},
      byModel: {}
    };
    
    // Initialize usage tracking
    Object.keys(this.providers).forEach(provider => {
      this.usage.byProvider[provider] = {
        requests: 0,
        tokens: 0,
        cost: 0
      };
    });
  }

  /**
   * Get chat completion from the specified provider with fallback support
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Options including provider and model
   * @param {string} [options.provider] - Preferred provider
   * @param {string} [options.model] - Preferred model
   * @param {number} [options.temperature] - Sampling temperature
   * @param {number} [options.maxTokens] - Maximum tokens to generate
   * @param {boolean} [options.stream] - Whether to stream the response
   * @param {boolean} [options.fallback] - Whether to fallback to another provider on failure
   * @returns {Promise<Object>} Completion response
   */
  async chatCompletion(messages, options = {}) {
    const { 
      provider: preferredProvider = 'groq', // Default to groq if not specified
      model: preferredModel = 'llama3-8b-8192',
      fallback = true,
      ...providerOptions 
    } = options;

    // Determine the list of providers to try
    let providersToTry = [];
    
    // Add preferred provider first
    providersToTry.push({
      provider: preferredProvider,
      model: preferredModel
    });
    
    // Add fallback providers if enabled and different from preferred
    if (fallback) {
      const fallbackProviders = [
        { provider: 'groq', model: 'llama3-8b-8192' },
        { provider: 'openrouter', model: 'anthropic/claude-3-haiku' }
      ];
      
      // Only add fallback providers that are different from the preferred one
      for (const fb of fallbackProviders) {
        if (fb.provider !== preferredProvider || fb.model !== preferredModel) {
          providersToTry.push(fb);
        }
      }
    }

    // If fallback is disabled, just try the first provider
    if (options.fallback === false && providersToTry.length > 0) {
      providersToTry = [providersToTry[0]];
    } else if (options.provider && providersToTry.length > 0) {
      // If a specific provider is requested, only try that one
      providersToTry = providersToTry.filter(p => p.provider === options.provider);
      if (providersToTry.length === 0) {
        throw new Error(`Requested provider '${options.provider}' is not available`);
      }
    }

    let lastError = null;
    let lastSuccessResponse = null;
    let lastProvider;
    
    // Try each provider in sequence until one succeeds
    logger.info(`[LLM] Trying ${providersToTry.length} providers in sequence`);
    for (let i = 0; i < providersToTry.length; i++) {
      const { provider, model: modelToUse = options.model } = providersToTry[i];
      const isLastProvider = i === providersToTry.length - 1;
      
      // Skip if we already tried this exact provider/model combination
      if (lastProvider === `${provider}:${modelToUse}`) {
        logger.debug(`[LLM] Skipping duplicate provider: ${provider}:${modelToUse}`);
        continue;
      }
      lastProvider = `${provider}:${modelToUse}`;
      
      logger.info(`[LLM] Trying provider ${i + 1}/${providersToTry.length}: ${provider} (${modelToUse})`);
      
      try {
        // Get provider instance
        const providerInstance = this.providers[provider];
        if (!providerInstance) {
          throw new Error(`Provider not found: ${provider}`);
        }

        // Log the request
        logger.debug(`[LLM] Sending request to ${provider} with model ${modelToUse}`, {
          messageCount: messages.length,
          options: {
            ...options,
            provider: undefined, // Don't log the provider in the options
            model: undefined    // Don't log the model in the options
          }
        });

        // Make the request
        const response = await providerInstance.chatCompletion(messages, {
          ...options,
          model: modelToUse,
          provider: provider
        });

        // If we got here, the request was successful
        logger.info(`[LLM] Successfully got response from ${provider} (${modelToUse})`);
        
        // Track usage if usage data is available
        if (response && response.usage) {
          this._trackUsage(provider, modelToUse, response.usage);
        }
        
        // Add provider info to the response
        const responseWithProvider = {
          ...response,
          provider,
          model: modelToUse,
          _provider: provider, // For backward compatibility
          _model: modelToUse   // For backward compatibility
        };
        
        // If this is the first successful response, store it in case we need to fall back to it later
        if (!lastSuccessResponse) {
          lastSuccessResponse = responseWithProvider;
        }
        
        // If we're not on the last provider and the response is incomplete, continue to next provider
        if (response.choices?.[0]?.finish_reason === 'length' && !isLastProvider) {
          logger.warn(`[LLM] Response was truncated due to length, trying next provider`);
          continue;
        }
        
        // Otherwise, return the response
        return responseWithProvider;
        
        // Log the raw response for debugging
        try {
          // Handle case where response might be a string
          const responseToLog = typeof response === 'string' ? { content: response } : response;
          
          logger.debug(`[LLM] Raw response from ${provider}:`, {
            model: responseToLog.model,
            id: responseToLog.id,
            hasChoices: Array.isArray(responseToLog.choices) && responseToLog.choices.length > 0,
            choicesCount: responseToLog.choices?.length || 0,
            firstChoice: responseToLog.choices?.[0] ? {
              index: responseToLog.choices[0].index,
              finish_reason: responseToLog.choices[0].finish_reason,
              message: {
                role: responseToLog.choices[0].message?.role,
                content: responseToLog.choices[0].message?.content?.substring(0, 100) + 
                        (responseToLog.choices[0].message?.content?.length > 100 ? '...' : '')
              }
            } : null,
            usage: responseToLog.usage || {}
          });
          
          // If we have a direct content field, convert it to the expected format
          if (responseToLog.content && !responseToLog.choices) {
            responseToLog.choices = [{
              message: {
                role: 'assistant',
                content: responseToLog.content
              },
              finish_reason: 'stop',
              index: 0
            }];
            response = responseToLog; // Update the response object
          }
        } catch (logError) {
          logger.error(`[LLM] Error logging response from ${provider}:`, logError);
          // Continue even if logging fails
        }
        
        // Ensure the response has the expected structure
        if (!response) {
          logger.error(`[LLM] No response received from ${provider}`);
          throw new Error('No response received from the provider');
        }
        
        // Handle different response formats
        if (response.content && !response.choices) {
          // If response has direct content field, convert to standard format
          response.choices = [{
            message: {
              role: 'assistant',
              content: response.content
            },
            finish_reason: 'stop',
            index: 0
          }];
        }
        
        if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
          logger.error(`[LLM] Invalid response structure from ${provider}:`, { 
            error: 'No choices in response',
            response: response
          });
          throw new Error('No choices returned in the response');
        }
        
        const firstChoice = response.choices[0];
        const messageContent = firstChoice.message?.content || firstChoice.content;
        
        if (!messageContent) {
          logger.error(`[LLM] Invalid message content from ${provider}:`, {
            error: 'No message content in response choice',
            choice: firstChoice,
            response: response
          });
          throw new Error('No message content in the response choice');
        }
        
        // Log token usage
        if (response.usage) {
          this._trackUsage(provider, modelToUse, response.usage, responseTime);
        } else {
          // Estimate token usage if not provided
          const content = firstChoice.message?.content || firstChoice.content || '';
          response.usage = {
            prompt_tokens: Math.ceil(JSON.stringify(formattedMessages).length / 4),
            completion_tokens: Math.ceil(content.length / 4),
            total_tokens: 0
          };
          response.usage.total_tokens = response.usage.prompt_tokens + response.usage.completion_tokens;
        }
        
        try {
          logger.info(`[LLM] Success from ${provider} in ${responseTime}ms`, {
            model: modelToUse,
            usage: response.usage || {},
            responseTime,
            finishReason: firstChoice.finish_reason || 'unknown'
          });
        } catch (logError) {
          logger.error(`[LLM] Error logging success from ${provider}:`, logError);
          // Continue even if logging fails
        }
        
        // Process the response
        let responseData;
        try {
          // If response is already in the correct format, use it directly
          if (response.choices && Array.isArray(response.choices) && response.choices.length > 0) {
            responseData = {
              ...response,
              provider: provider,
              model: response.model || model || modelToUse
            };
          } 
          // Handle different response formats
          else {
            const firstChoice = response.choices?.[0] || {
              message: { 
                role: 'assistant', 
                content: response.content || '' 
              }, 
              finish_reason: 'stop' 
            };
            
            responseData = {
              id: response.id || `chatcmpl-${Date.now()}`,
              object: 'chat.completion',
              created: Math.floor(Date.now() / 1000),
              model: response.model || model || modelToUse,
              choices: [{
                message: {
                  role: firstChoice.message?.role || 'assistant',
                  content: firstChoice.message?.content || firstChoice.content || ''
                },
                finish_reason: firstChoice.finish_reason || 'stop',
                index: 0
              }],
              usage: response.usage || {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0
              },
              provider: provider
            };
            
            logger.debug(`[LLM] Successfully processed response from ${provider} (${modelToUse})`, {
              responseId: responseData.id,
              contentLength: responseData.choices[0].message.content?.length || 0,
              finishReason: responseData.choices[0].finish_reason || 'unknown',
              usage: responseData.usage
            });
            
            // Track successful response
            lastSuccessResponse = responseData;
            
            // Track usage
            this._trackUsage(provider, modelToUse, {
              promptTokens: responseData.usage?.prompt_tokens,
              completionTokens: responseData.usage?.completion_tokens,
              totalTokens: responseData.usage?.total_tokens
            });
            
            // Add provider info to response
            responseData.provider = provider;
            
            // Return the successful response
            return responseData;
          }
          
        } catch (processError) {
          logger.error(`[LLM] Error processing response from ${provider}:`, {
            error: processError.message,
            stack: processError.stack,
            response: response,
            provider,
            model: model || modelToUse
          });
          
          // If we have a successful response from a previous provider, use it
          if (lastSuccessResponse) {
            logger.warn(`[LLM] Using successful response from previous provider due to processing error with ${provider}`);
            return lastSuccessResponse;
          }
          
          throw new Error(`Failed to process response from ${provider}: ${processError.message}`);
        }
        
      } catch (error) {
        // Log the error but continue to next provider
        logger.error(`[LLM] Error with ${provider}${modelToUse ? ` (${modelToUse})` : ''}:`, error.message);
        lastError = error;
        
        // If this was a rate limit error, add a delay before trying the next provider
        if (error.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
        }
        
        // If we have a successful response, return it immediately
        if (lastSuccessResponse) {
          logger.warn(`[LLM] Returning successful response from earlier provider due to error with ${provider}`);
          return lastSuccessResponse;
        }
        
        // If this is the last provider and we have no successful response, rethrow the error
        if (i === providersToTry.length - 1) {
          throw error;
        }
      }
    }
    
    // If we get here, all providers failed
    const errorMessage = lastError 
      ? `All providers failed: ${lastError.message}`
      : 'No providers available';
      
    throw new Error(errorMessage);
  }
  
  /**
   * Track token usage and costs
   * @private
   */
  _trackUsage(provider, model, usage = {}) {
    if (!usage.promptTokens && !usage.completionTokens) return;
    
    // Update global stats
    this.usage.totalRequests += 1;
    this.usage.totalTokens += (usage.promptTokens || 0) + (usage.completionTokens || 0);
    
    // Update provider stats
    if (!this.usage.byProvider[provider]) {
      this.usage.byProvider[provider] = { requests: 0, tokens: 0, cost: 0 };
    }
    this.usage.byProvider[provider].requests += 1;
    this.usage.byProvider[provider].tokens += (usage.promptTokens || 0) + (usage.completionTokens || 0);
    
    // Update model stats
    if (model) {
      if (!this.usage.byModel[model]) {
        this.usage.byModel[model] = { requests: 0, tokens: 0, cost: 0 };
      }
      this.usage.byModel[model].requests += 1;
      this.usage.byModel[model].tokens += (usage.promptTokens || 0) + (usage.completionTokens || 0);
    }
    
    // Calculate and update costs if we have price information
    try {
      const costInfo = calculateTokenUsage(
        provider, 
        model, 
        usage.promptTokens || 0, 
        usage.completionTokens || 0
      );
      
      if (costInfo.cost.total > 0) {
        this.usage.totalCost += costInfo.cost.total;
        this.usage.byProvider[provider].cost += costInfo.cost.total;
        
        if (model) {
          this.usage.byModel[model].cost += costInfo.cost.total;
        }
      }
    } catch (error) {
      logger.error('Error calculating token costs:', error);
    }
  }
  
  /**
   * Get usage statistics
   * @returns {Object} Usage statistics
   */
  getUsage() {
    return {
      ...this.usage,
      // Add a timestamp
      timestamp: new Date().toISOString(),
      // Add a summary
      summary: {
        totalCost: this.usage.totalCost,
        totalRequests: this.usage.totalRequests,
        totalTokens: this.usage.totalTokens,
        avgTokensPerRequest: this.usage.totalRequests > 0 
          ? Math.round(this.usage.totalTokens / this.usage.totalRequests) 
          : 0,
        avgCostPerRequest: this.usage.totalRequests > 0 
          ? this.usage.totalCost / this.usage.totalRequests 
          : 0
      }
    };
  }
  
  /**
   * Reset usage statistics
   */
  resetUsage() {
    this.usage = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      byProvider: {},
      byModel: {}
    };
    
    // Re-initialize provider tracking
    Object.keys(this.providers).forEach(provider => {
      this.usage.byProvider[provider] = {
        requests: 0,
        tokens: 0,
        cost: 0
      };
    });
    
    return { success: true, message: 'Usage statistics reset' };
  }

  /**
   * List all available models from all providers
   * @returns {Promise<Object>} Object with models grouped by provider
   */
  async listModels() {
    try {
      logger.info('[LLMService] Fetching available models...');
      
      // Define default models in case provider calls fail
      const defaultModels = {
        groq: {
          'llama3-8b-8192': {
            displayName: 'LLaMA 3 8B',
            maxTokens: 8192,
            supportsStreaming: true,
            description: '8 billion parameter model with 8K context window',
            pricing: { input: 0.10, output: 0.10 }
          },
          'llama3-70b-8192': {
            displayName: 'LLaMA 3 70B',
            maxTokens: 8192,
            supportsStreaming: true,
            description: '70 billion parameter model with 8K context window',
            pricing: { input: 0.80, output: 0.80 }
          },
          'mixtral-8x7b-32768': {
            displayName: 'Mixtral 8x7B',
            maxTokens: 32768,
            supportsStreaming: true,
            description: 'Mixture of Experts model with 32K context window',
            pricing: { input: 0.27, output: 0.27 }
          }
        }
      };

      try {
        // Try to get models from providers
        const models = {};
        
        for (const [providerName, provider] of Object.entries(this.providers)) {
          try {
            if (typeof provider.listModels === 'function') {
              const providerModels = await provider.listModels();
              if (providerModels && Object.keys(providerModels).length > 0) {
                models[providerName] = providerModels;
              } else {
                logger.warn(`[LLMService] No models returned from ${providerName}, using defaults`);
                models[providerName] = defaultModels[providerName] || {};
              }
            } else if (provider.models) {
              models[providerName] = provider.models;
            } else {
              models[providerName] = defaultModels[providerName] || {};
            }
          } catch (error) {
            logger.error(`[LLMService] Error getting models from ${providerName}:`, error);
            models[providerName] = defaultModels[providerName] || { error: 'Failed to load models' };
          }
        }
        
        logger.info(`[LLMService] Successfully retrieved models from ${Object.keys(models).length} providers`);
        return models;
      } catch (error) {
        logger.error('[LLMService] Error getting models, falling back to defaults:', error);
        return defaultModels;
      }
    } catch (error) {
      logger.error('[LLMService] Critical error in listModels:', error);
      // Return default models even in case of critical errors
      return {
        groq: {
          'llama3-8b-8192': {
            displayName: 'LLaMA 3 8B',
            maxTokens: 8192,
            supportsStreaming: true,
            description: '8 billion parameter model with 8K context window',
            pricing: { input: 0.10, output: 0.10 }
          }
        }
      };
    }
  }
}

export default new LLMService();
