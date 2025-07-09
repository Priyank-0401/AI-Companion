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
      provider: preferredProvider, 
      model: preferredModel,
      fallback = true,
      ...providerOptions 
    } = options;

    // Determine the list of providers to try
    const providersToTry = [];
    
    // Add preferred provider if specified
    if (preferredProvider) {
      providersToTry.push({
        provider: preferredProvider,
        model: preferredModel
      });
    }
    
    // Add fallback providers if enabled
    if (fallback) {
      providersToTry.push(
        { provider: 'openrouter', model: 'anthropic/claude-3-haiku' },
        { provider: 'groq', model: 'llama3-8b-8192' },
        { provider: 'openrouter', model: 'mistralai/mixtral-8x7b-instruct' }
      );
    }

    let lastError;
    let lastProvider;
    
    // Try each provider until one succeeds
    for (const { provider, model } of providersToTry) {
      // Skip if we already tried this exact provider/model combination
      if (lastProvider === `${provider}:${model}`) continue;
      lastProvider = `${provider}:${model}`;
      
      try {
        // Get provider instance
        const providerInstance = this.providers[provider];
        if (!providerInstance) {
          throw new Error(`Provider '${provider}' not found`);
        }
        
        // Format messages for the provider
        const formattedMessages = formatMessages(messages, providerOptions.systemPrompt);
        
        // Log the request
        logger.info(`[LLM] Request to ${provider}${model ? ` (${model})` : ''}`, {
          messageCount: formattedMessages.length,
          options: { ...providerOptions, model }
        });
        
        // Make the request
        const startTime = Date.now();
        const response = await providerInstance.chatCompletion(
          formattedMessages,
          { 
            ...providerOptions,
            model: model || providerOptions.model
          }
        );
        
        // Calculate request duration
        const duration = Date.now() - startTime;
        
        // Track usage
        this._trackUsage(provider, model, response.usage);
        
        // Log successful response
        logger.info(`[LLM] Success from ${provider} in ${duration}ms`, {
          provider,
          model: model || providerOptions.model,
          duration,
          usage: response.usage
        });
        
        return response;
        
      } catch (error) {
        // Log the error but continue to next provider
        logger.error(`[LLM] Error with ${provider}${model ? ` (${model})` : ''}:`, error.message);
        lastError = error;
        
        // If this was a rate limit error, add a delay before trying the next provider
        if (error.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
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
}

export default new LLMService();
