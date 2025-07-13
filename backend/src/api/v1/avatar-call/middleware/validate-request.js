import Joi from 'joi';
import { logger } from '../../../../utils/logger.js';

/**
 * Validates the request body for avatar call endpoints
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateAvatarCallRequest = (req, res, next) => {
  try {
    // Ensure req.body exists and is an object
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      throw new Error('Request body must be a valid JSON object');
    }

    // Define schema with defaults and validation
    const schema = Joi.object({
      message: Joi.string().required().messages({
        'string.base': 'Message must be a string',
        'string.empty': 'Message cannot be empty',
        'any.required': 'Message is required'
      }),
      model: Joi.string().default('llama3-8b-8192'),
      style: Joi.string().default('empathetic'),
      context: Joi.object({
        emotion: Joi.string().valid(
          'happy', 'sad', 'angry', 'neutral', 'surprised', 'fearful', 'disgusted'
        ).default('neutral'),
        timestamp: Joi.string().isoDate().default(() => new Date().toISOString())
      }).default(() => ({
        emotion: 'neutral',
        timestamp: new Date().toISOString()
      }))
    }).options({ stripUnknown: true });

    // Validate the request body
    const { value, error: validationError } = schema.validate(req.body, { 
      abortEarly: false,
      allowUnknown: true
    });

    if (validationError) {
      const errors = validationError.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      logger.warn('Validation failed:', { errors });
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    // Set the validated and sanitized request body
    req.body = value;
    next();
  } catch (error) {
    logger.error('Validation middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during validation',
      message: error.message
    });
  }
};
