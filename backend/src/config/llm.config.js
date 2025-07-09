/**
 * LLM Service Configuration
 * 
 * This file contains configuration for the LLM service providers.
 * It includes settings for different LLM providers, rate limits, and defaults.
 */

const config = {
  // Default provider to use if not specified
  defaultProvider: 'openrouter',
  
  // Provider-specific configurations
  providers: {
    groq: {
      baseUrl: 'https://api.groq.com/openai/v1',
      defaultModel: 'llama3-8b-8192',
      timeout: 30000, // 30 seconds
      maxRetries: 3,
      rateLimit: {
        requestsPerMinute: 60,
      },
      models: {
        'llama3-8b-8192': {
          displayName: 'LLaMA 3 8B',
          maxTokens: 8192,
          supportsStreaming: true,
        },
        'llama3-70b-8192': {
          displayName: 'LLaMA 3 70B',
          maxTokens: 8192,
          supportsStreaming: true,
        },
        'mixtral-8x7b-32768': {
          displayName: 'Mixtral 8x7B',
          maxTokens: 32768,
          supportsStreaming: true,
        },
      },
    },
    
    openrouter: {
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: 'anthropic/claude-3-haiku',
      timeout: 60000, // 60 seconds
      maxRetries: 3,
      rateLimit: {
        requestsPerMinute: 30,
      },
      models: {
        'anthropic/claude-3-haiku': {
          displayName: 'Claude 3 Haiku',
          maxTokens: 200000,
          supportsStreaming: false,
        },
        'anthropic/claude-3-opus': {
          displayName: 'Claude 3 Opus',
          maxTokens: 200000,
          supportsStreaming: false,
        },
        'mistralai/mistral-7b-instruct': {
          displayName: 'Mistral 7B',
          maxTokens: 8192,
          supportsStreaming: true,
        },
        'mistralai/mixtral-8x7b-instruct': {
          displayName: 'Mixtral 8x7B',
          maxTokens: 32768,
          supportsStreaming: true,
        },
        'openai/gpt-3.5-turbo': {
          displayName: 'GPT-3.5 Turbo',
          maxTokens: 4096,
          supportsStreaming: true,
        },
        'openai/gpt-4': {
          displayName: 'GPT-4',
          maxTokens: 8192,
          supportsStreaming: true,
        },
      },
    },
  },
  
  // Default generation parameters
  defaults: {
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  },
  
  // Rate limiting configuration
  rateLimiting: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // Limit each IP to 100 requests per windowMs
  },
  
  // Timeout configuration
  timeouts: {
    short: 10000, // 10 seconds
    medium: 30000, // 30 seconds
    long: 120000, // 2 minutes
  },
};

export default config;
