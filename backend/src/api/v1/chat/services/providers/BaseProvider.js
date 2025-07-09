import { logger } from '../../../../../utils/logger.js';

export default class BaseProvider {
  constructor() {
    if (this.constructor === BaseProvider) {
      throw new Error("BaseProvider is an abstract class and cannot be instantiated directly.");
    }
    this.baseUrl = '';
    this.apiKey = '';
    this.tokenUsage = {
      totalTokens: 0,
      totalCost: 0,
      requests: 0,
      pricing: {}
    };
  }

  /**
   * Make an API request to the provider
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API response
   */
  async _makeRequest(endpoint, data = {}, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `API request failed with status ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      logger.error(`API request failed: ${error.message}`, {
        endpoint,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Calculate cost based on token usage
   * @param {string} model - Model identifier
   * @param {number} inputTokens - Number of input tokens
   * @param {number} outputTokens - Number of output tokens
   * @returns {number} Cost in USD
   */
  calculateCost(model, inputTokens, outputTokens) {
    const pricing = this.tokenUsage.pricing[model];
    if (!pricing) return 0;
    
    const inputCost = (inputTokens / 1_000_000) * (pricing.input || 0);
    const outputCost = (outputTokens / 1_000_000) * (pricing.output || 0);
    return inputCost + outputCost;
  }

  /**
   * Log token usage and cost
   * @param {string} model - Model identifier
   * @param {number} inputTokens - Number of input tokens
   * @param {number} outputTokens - Number of output tokens
   * @param {number} startTime - Start time of the request
   */
  logUsage(model, inputTokens, outputTokens, startTime) {
    const duration = Date.now() - startTime;
    const cost = this.calculateCost(model, inputTokens, outputTokens);
    
    this.tokenUsage.totalTokens += (inputTokens + outputTokens);
    this.tokenUsage.totalCost += cost;
    this.tokenUsage.requests += 1;

    logger.info('LLM API Usage', {
      provider: this.constructor.name.replace('Service', ''),
      model,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cost: cost.toFixed(6),
      duration: `${duration}ms`,
      totalCostSoFar: this.tokenUsage.totalCost.toFixed(4),
      avgTokensPerRequest: Math.round(this.tokenUsage.totalTokens / Math.max(1, this.tokenUsage.requests))
    });

    return {
      inputTokens,
      outputTokens,
      cost,
      duration
    };
  }
}
