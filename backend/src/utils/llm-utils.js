import config from '../config/index.js';
import { logger } from './logger.js';

/**
 * Get the appropriate LLM provider based on the request
 * @param {Object} options - Options for provider selection
 * @param {string} [options.provider] - Preferred provider
 * @param {string} [options.model] - Preferred model
 * @param {boolean} [options.streaming] - Whether streaming is required
 * @returns {Object} Provider configuration
 */
export function getLLMProvider({ provider, model, streaming = false }) {
  // Use the specified provider or the default one
  const providerName = provider || config.llm.defaultProvider;
  const providerConfig = config.llm.providers[providerName];
  
  if (!providerConfig) {
    throw new Error(`Provider '${providerName}' is not configured. Available providers: ${Object.keys(config.llm.providers).join(', ')}`);
  }
  
  // Validate the model is supported by the provider
  const modelName = model || providerConfig.defaultModel;
  const modelConfig = providerConfig.models[modelName];
  
  if (!modelConfig) {
    throw new Error(`Model '${modelName}' is not supported by provider '${providerName}'. Available models: ${Object.keys(providerConfig.models).join(', ')}`);
  }
  
  // Check if streaming is supported if required
  if (streaming && !modelConfig.supportsStreaming) {
    logger.warn(`Streaming not supported for ${providerName}/${modelName}, falling back to non-streaming`);
  }
  
  return {
    name: providerName,
    model: modelName,
    config: providerConfig,
    modelConfig,
    supportsStreaming: modelConfig.supportsStreaming && streaming,
    apiKey: process.env[`${providerName.toUpperCase()}_API_KEY`],
    baseUrl: providerConfig.baseUrl
  };
}

/**
 * Format messages for the LLM provider
 * @param {Array} messages - Array of message objects
 * @param {string} [systemPrompt] - Optional system prompt to prepend
 * @returns {Array} Formatted messages
 */
export function formatMessages(messages, systemPrompt) {
  const formatted = [];
  
  // Add system prompt if provided
  if (systemPrompt) {
    formatted.push({
      role: 'system',
      content: systemPrompt
    });
  }
  
  // Add conversation history
  for (const msg of messages) {
    // Skip empty messages
    if (!msg.content || !msg.role) continue;
    
    // Map role if needed (e.g., 'ai' -> 'assistant')
    let role = msg.role.toLowerCase();
    if (role === 'ai') role = 'assistant';
    if (role === 'user') role = 'user';
    
    formatted.push({
      role,
      content: msg.content
    });
  }
  
  return formatted;
}

/**
 * Calculate token usage and cost
 * @param {string} provider - Provider name
 * @param {string} model - Model name
 * @param {number} promptTokens - Number of tokens in the prompt
 * @param {number} completionTokens - Number of tokens in the completion
 * @returns {Object} Token usage and cost information
 */
export function calculateTokenUsage(provider, model, promptTokens, completionTokens) {
  const providerConfig = config.llm.providers[provider];
  if (!providerConfig) {
    throw new Error(`Provider '${provider}' not found in config`);
  }
  
  const modelConfig = providerConfig.models[model];
  if (!modelConfig) {
    throw new Error(`Model '${model}' not found for provider '${provider}'`);
  }
  
  // Get token prices (per 1M tokens)
  const promptPrice = modelConfig.promptPrice || 0;
  const completionPrice = modelConfig.completionPrice || 0;
  
  // Calculate costs
  const promptCost = (promptTokens / 1_000_000) * promptPrice;
  const completionCost = (completionTokens / 1_000_000) * completionPrice;
  const totalCost = promptCost + completionCost;
  
  return {
    provider,
    model,
    tokens: {
      prompt: promptTokens,
      completion: completionTokens,
      total: promptTokens + completionTokens
    },
    cost: {
      prompt: promptCost,
      completion: completionCost,
      total: totalCost,
      currency: 'USD'
    }
  };
}

/**
 * Get the maximum tokens for a model
 * @param {string} provider - Provider name
 * @param {string} model - Model name
 * @returns {number} Maximum tokens
 */
export function getMaxTokens(provider, model) {
  return config.llm.providers[provider]?.models[model]?.maxTokens || 2048;
}

/**
 * Truncate messages to fit within the model's context window
 * @param {Array} messages - Array of message objects
 * @param {string} provider - Provider name
 * @param {string} model - Model name
 * @param {number} [maxTokens] - Maximum tokens to use (defaults to model's max)
 * @returns {Array} Truncated messages
 */
export function truncateMessages(messages, provider, model, maxTokens) {
  const modelMaxTokens = maxTokens || getMaxTokens(provider, model);
  const maxContextTokens = Math.floor(modelMaxTokens * 0.9); // Use 90% of context for safety
  
  // Simple truncation: remove oldest messages until we're under the limit
  // In a real app, you'd want a more sophisticated token counting approach
  let tokenCount = 0;
  const result = [];
  
  // Process messages in reverse order (newest first)
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    // Very rough estimate: 4 tokens per word, 1 token per 4 chars
    const tokenEstimate = Math.ceil((msg.content?.length || 0) / 4) + 10; // +10 for metadata
    
    if (tokenCount + tokenEstimate > maxContextTokens) {
      break;
    }
    
    result.unshift(msg);
    tokenCount += tokenEstimate;
  }
  
  return result;
}
