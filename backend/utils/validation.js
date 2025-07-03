const Joi = require('joi');
const { Types } = require('mongoose');
const { logger } = require('../middleware/logger');
const ApiError = require('./ApiError');
const httpStatus = require('http-status');

// Custom Joi validators
const objectId = (value, helpers) => {
  if (!Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

const password = (value, helpers) => {
  if (value.length < 8) {
    return helpers.error('password.min', { limit: 8 });
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.error('password.complexity');
  }
  return value;
};

const email = (value, helpers) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return helpers.error('any.invalid');
  }
  return value.toLowerCase();
};

// Common validation schemas
const schemas = {
  // Auth schemas
  register: Joi.object({
    email: Joi.string().required().email().external(email),
    password: Joi.string().required().min(8).external(password),
    displayName: Joi.string().min(2).max(30).trim(),
  }),

  login: Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),

  // User schemas
  updateProfile: Joi.object({
    displayName: Joi.string().min(2).max(30).trim(),
    avatar: Joi.string().uri(),
    preferences: Joi.object({
      theme: Joi.string().valid('light', 'dark', 'system'),
      notifications: Joi.boolean(),
      language: Joi.string().length(2).default('en'),
    }),
  }),

  // Journal entry schemas
  createEntry: Joi.object({
    title: Joi.string().required().min(3).max(100).trim(),
    content: Joi.string().required().min(10).max(10000),
    mood: Joi.string().valid('happy', 'sad', 'angry', 'anxious', 'neutral', 'excited'),
    tags: Joi.array().items(Joi.string().min(2).max(20)).max(10),
    isPrivate: Joi.boolean().default(false),
  }),

  updateEntry: Joi.object({
    title: Joi.string().min(3).max(100).trim(),
    content: Joi.string().min(10).max(10000),
    mood: Joi.string().valid('happy', 'sad', 'angry', 'anxious', 'neutral', 'excited'),
    tags: Joi.array().items(Joi.string().min(2).max(20)).max(10),
    isPrivate: Joi.boolean(),
  }),

  // Common query params
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().pattern(/^[a-zA-Z0-9_]+:(asc|desc)$/),
    search: Joi.string().min(2).max(50).trim(),
  }),
};

// Custom error messages
const customMessages = {
  'any.required': '{{#label}} is required',
  'string.empty': '{{#label}} cannot be empty',
  'string.min': '{{#label}} must be at least {{#limit}} characters',
  'string.max': '{{#label}} must not exceed {{#limit}} characters',
  'string.email': 'Please enter a valid email address',
  'string.pattern.base': '{{#label}} must be a valid {{#label}}',
  'any.only': '{{#label}} must be one of {{#valids}}',
  'array.max': '{{#label}} must not exceed {{#limit}} items',
  'array.base': '{{#label}} must be an array',
  'object.unknown': '{{#label}} is not allowed',
  'any.invalid': 'Invalid {{#label}}',
  'password.min': 'Password must be at least {{#limit}} characters',
  'password.complexity': 'Password must contain at least one letter and one number',
};

/**
 * Validate request data against a Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Where to get the data from (body, query, params)
 * @returns {Function} Express middleware function
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
      messages: customMessages,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      
      logger.warn(`Validation error: ${errorMessage}`, {
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params,
      });

      return next(
        new ApiError(
          httpStatus.BAD_REQUEST,
          `Validation error: ${errorMessage}`,
          true
        )
      );
    }

    // Replace req[source] with validated value
    req[source] = value;
    next();
  };
};

module.exports = {
  schemas,
  validate,
  objectId,
  password,
  email,
};
