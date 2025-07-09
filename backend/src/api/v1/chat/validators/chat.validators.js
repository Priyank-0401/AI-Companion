import { body, param, query } from 'express-validator';

// Common validation middleware for chat routes
export const validateConversationId = [
  param('conversationId')
    .isString()
    .withMessage('Conversation ID must be a string')
    .notEmpty()
    .withMessage('Conversation ID is required'),
];

export const validateCreateConversation = [
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title cannot be longer than 100 characters'),
  
  body('model')
    .optional()
    .isString()
    .withMessage('Model must be a string')
    .custom(async (value, { req }) => {
      try {
        // Get the list of available models
        const LLMService = (await import('../services/LLMService.js')).default;
        const models = await LLMService.listModels();
        
        // Flatten the models object to get all model IDs
        const allModelIds = [];
        Object.values(models).forEach(providerModels => {
          if (typeof providerModels === 'object' && providerModels !== null) {
            Object.keys(providerModels).forEach(modelId => {
              if (modelId !== 'error') {
                allModelIds.push(modelId);
              }
            });
          }
        });
        
        // If no models were found, use a default set
        if (allModelIds.length === 0) {
          allModelIds.push(
            'llama3-8b-8192',
            'llama3-70b-8192',
            'mixtral-8x7b-32768'
          );
        }
        
        // Check if the provided model is in the list of available models
        if (!allModelIds.includes(value)) {
          throw new Error(`Invalid model selection. Please use one of the available models from the /models endpoint. Received: ${value}`);
        }
        
        return true;
      } catch (error) {
        console.error('Error validating model:', error);
        // If there's an error getting models, allow the request to proceed
        // The LLMService will handle invalid models with appropriate defaults
        return true;
      }
    }),
  
  body('style')
    .optional()
    .isString()
    .withMessage('Style must be a string')
    .isIn(['empathetic', 'coach', 'playful', 'mindful'])
    .withMessage('Invalid conversation style. Must be one of: empathetic, coach, playful, mindful'),
];

export const validateGetConversations = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('startAfter')
    .optional()
    .isString()
    .withMessage('startAfter must be a string'),
];

export const validateUpdateConversation = [
  // Check conversation ID in URL params first, then in body
  param('conversationId')
    .optional()
    .isString()
    .withMessage('Conversation ID must be a string')
    .notEmpty()
    .withMessage('Conversation ID is required in URL'),
    
  // Also allow conversation ID in body for backward compatibility
  body('id')
    .optional()
    .isString()
    .withMessage('Conversation ID in body must be a string')
    .custom((value, { req }) => {
      // If ID is in both params and body, they must match
      if (req.params.conversationId && req.params.conversationId !== value) {
        throw new Error('Conversation ID in URL and body do not match');
      }
      return true;
    }),
  
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title cannot be longer than 100 characters'),
  
  body('isArchived')
    .optional()
    .isBoolean()
    .withMessage('isArchived must be a boolean'),
    
  // Custom middleware to ensure conversationId is available in params
  (req, res, next) => {
    // If conversationId is in body but not in params, move it to params
    if (req.body.id && !req.params.conversationId) {
      req.params.conversationId = req.body.id;
    }
    next();
  }
];

export const validateSendMessage = [
  ...validateConversationId,
  
  body('content')
    .isString()
    .withMessage('Message content must be a string')
    .trim()
    .notEmpty()
    .withMessage('Message content cannot be empty')
    .isLength({ max: 10000 })
    .withMessage('Message cannot be longer than 10000 characters'),
  
  body('stream')
    .optional()
    .isBoolean()
    .withMessage('Stream must be a boolean'),
];

export const validateStreamMessage = [
  ...validateConversationId,
  
  body('content')
    .isString()
    .withMessage('Message content must be a string')
    .trim()
    .notEmpty()
    .withMessage('Message content cannot be empty')
    .isLength({ max: 10000 })
    .withMessage('Message cannot be longer than 10000 characters'),
];

export const validateGetMessages = [
  ...validateConversationId,
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('startAfter')
    .optional()
    .isString()
    .withMessage('startAfter must be a string'),
];
