import { Router } from 'express';
import { body, query } from 'express-validator';
import { protect, restrictTo } from '../../../../middleware/auth.js';
import LLMController from '../controllers/llm.controller.js';
import validateRequest from '../../../../middleware/validate-request.js';

const router = Router();

// Common validation rules for chat endpoints
const chatValidation = [
  body('messages')
    .isArray({ min: 1 })
    .withMessage('Messages must be a non-empty array'),
  body('messages.*.role')
    .isIn(['system', 'user', 'assistant'])
    .withMessage('Invalid message role'),
  body('messages.*.content')
    .isString()
    .notEmpty()
    .withMessage('Message content is required'),
  body('model')
    .optional()
    .isString()
    .withMessage('Model must be a string'),
  body('provider')
    .optional()
    .isIn(['groq', 'openrouter'])
    .withMessage('Invalid provider'),
  body('temperature')
    .optional()
    .isFloat({ min: 0, max: 2 })
    .withMessage('Temperature must be between 0 and 2'),
  body('maxTokens')
    .optional()
    .isInt({ min: 1, max: 32000 })
    .withMessage('Max tokens must be between 1 and 32000'),
  body('stream')
    .optional()
    .isBoolean()
    .withMessage('Stream must be a boolean')
];

// Validation for usage stats
const usageValidation = [
  query('provider')
    .optional()
    .isString()
    .withMessage('Provider must be a string'),
  query('model')
    .optional()
    .isString()
    .withMessage('Model must be a string'),
  query('groupBy')
    .optional()
    .isIn(['hour', 'day', 'week', 'month'])
    .withMessage('Group by must be one of: hour, day, week, month')
];

// Public routes
// Send a message and get a response
router.post('/chat', chatValidation, validateRequest, LLMController.sendMessage);

// Stream a response (SSE)
router.post('/chat/stream', chatValidation, validateRequest, LLMController.streamMessage);

// List available models
router.get('/models', LLMController.listModels);

// Protected admin routes (require authentication and admin role)
router.use(protect, restrictTo('admin'));

// Get usage statistics
router.get('/usage', usageValidation, validateRequest, LLMController.getUsage);

// Reset usage statistics
router.post('/usage/reset', LLMController.resetUsage);

// Get provider status
router.get('/status', LLMController.getStatus);

export default router;
