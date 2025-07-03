const { StatusCodes } = require('http-status-codes');
const ApiError = require('../utils/ApiError');

/**
 * Validate request data against a Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} source - Where to get the data from (body, query, params)
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      
      return next(
        new ApiError(
          StatusCodes.BAD_REQUEST,
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

module.exports = validate;
