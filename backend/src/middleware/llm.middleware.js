import { logger } from '../utils/logger.js';
import config from '../config/index.js';

/**
 * Middleware to validate LLM provider configurations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const validateLLMConfig = (req, res, next) => {
  const { provider } = req.body;
  const validProviders = Object.keys(config.llm.providers);
  
  // If no provider specified, use default
  if (!provider) {
    req.body.provider = config.llm.defaultProvider;
    return next();
  }
  
  // Check if provider is valid
  if (!validProviders.includes(provider)) {
    return res.status(400).json({
      success: false,
      error: `Invalid LLM provider. Valid providers are: ${validProviders.join(', ')}`
    });
  }
  
  // Check if provider is properly configured
  const providerConfig = config.llm.providers[provider];
  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  
  if (!apiKey) {
    return res.status(400).json({
      success: false,
      error: `${provider} API key is not configured. Please set ${provider.toUpperCase()}_API_KEY in your environment variables.`
    });
  }
  
  next();
};

/**
 * Middleware to validate model for the specified provider
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const validateModel = (req, res, next) => {
  const { provider, model } = req.body;
  const providerConfig = config.llm.providers[provider || config.llm.defaultProvider];
  
  // If no model specified, use default
  if (!model) {
    req.body.model = providerConfig.defaultModel;
    return next();
  }
  
  // Check if model is valid for the provider
  const validModels = Object.keys(providerConfig.models);
  if (!validModels.includes(model)) {
    return res.status(400).json({
      success: false,
      error: `Invalid model for ${provider}. Valid models are: ${validModels.join(', ')}`
    });
  }
  
  next();
};

/**
 * Middleware to check if streaming is supported for the provider/model
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const checkStreamingSupport = (req, res, next) => {
  // Skip if not a streaming request
  if (!req.path.includes('/stream')) {
    return next();
  }
  
  const { provider, model } = req.body;
  const providerConfig = config.llm.providers[provider || config.llm.defaultProvider];
  const modelConfig = providerConfig.models[model || providerConfig.defaultModel];
  
  if (!modelConfig.supportsStreaming) {
    logger.warn(`Streaming not supported for ${provider}/${model}, falling back to non-streaming`);
    // Modify the request to use non-streaming
    req.streaming = false;
  } else {
    req.streaming = true;
  }
  
  next();
};

export { validateLLMConfig, validateModel, checkStreamingSupport };
