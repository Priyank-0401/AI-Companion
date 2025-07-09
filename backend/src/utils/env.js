import { logger } from './logger.js';

/**
 * Validate required environment variables
 * @param {string[]} requiredVars - Array of required environment variable names
 * @throws {Error} If any required variables are missing
 */
export function validateEnvVars(requiredVars) {
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Get environment variable with optional default value
 * @param {string} varName - Environment variable name
 * @param {*} defaultValue - Default value if variable is not set
 * @returns {string} Environment variable value or default value
 */
export function getEnv(varName, defaultValue = '') {
  return process.env[varName] || defaultValue;
}

/**
 * Get required environment variable
 * @param {string} varName - Environment variable name
 * @returns {string} Environment variable value
 * @throws {Error} If variable is not set
 */
export function getRequiredEnv(varName) {
  const value = process.env[varName];
  if (!value) {
    throw new Error(`Required environment variable ${varName} is not set`);
  }
  return value;
}

// Validate LLM provider configurations
export function validateLLMConfig() {
  const activeProviders = [];
  
  if (process.env.GROQ_API_KEY) {
    activeProviders.push('Groq');
  }
  
  if (process.env.OPENROUTER_API_KEY) {
    activeProviders.push('OpenRouter');
  }
  
  if (activeProviders.length === 0) {
    logger.warn('No LLM providers configured. Please set at least one of: GROQ_API_KEY, OPENROUTER_API_KEY');
  } else {
    logger.info(`Active LLM providers: ${activeProviders.join(', ')}`);
  }
  
  return activeProviders;
}
