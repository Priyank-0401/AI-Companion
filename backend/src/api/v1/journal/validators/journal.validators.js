import { body, param, query } from 'express-validator';

// Common validation middleware for journal routes
export const validateEntryId = [
  param('entryId')
    .isString()
    .withMessage('Entry ID must be a string')
    .notEmpty()
    .withMessage('Entry ID is required'),
];

export const validateCreateEntry = [
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot be longer than 200 characters'),
  
  body('content')
    .optional()
    .isString()
    .withMessage('Content must be a string'),
    
  body('mood')
    .optional()
    .isString()
    .withMessage('Mood must be a string')
    .isIn(['positive', 'neutral', 'reflective', 'challenging'])
    .withMessage('Mood must be one of: positive, neutral, reflective, challenging'),
    
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
    
  body('type')
    .optional()
    .isString()
    .withMessage('Type must be a string')
    .isIn(['text', 'audio', 'video'])
    .withMessage('Type must be one of: text, audio, video'),
];

export const validateUpdateEntry = [
  ...validateEntryId,
  
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot be longer than 200 characters'),
  
  body('content')
    .optional()
    .isString()
    .withMessage('Content must be a string'),
    
  body('mood')
    .optional()
    .isString()
    .withMessage('Mood must be a string')
    .isIn(['positive', 'neutral', 'reflective', 'challenging'])
    .withMessage('Mood must be one of: positive, neutral, reflective, challenging'),
    
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
];

export const validateGetEntries = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100')
    .toInt(),
  
  query('startAfter')
    .optional()
    .isString()
    .withMessage('StartAfter must be a string'),
];

export const validateGetEntriesByMood = [
  param('mood')
    .isString()
    .withMessage('Mood must be a string')
    .isIn(['positive', 'neutral', 'reflective', 'challenging'])
    .withMessage('Mood must be one of: positive, neutral, reflective, challenging'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100')
    .toInt(),
];

export const validateSearchEntries = [
  query('searchTerm')
    .isString()
    .withMessage('Search term must be a string')
    .notEmpty()
    .withMessage('Search term is required')
    .trim(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100')
    .toInt(),
];
