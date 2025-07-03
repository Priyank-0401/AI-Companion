/**
 * Wraps an async function to handle errors and pass them to Express's error handler
 * @param {Function} fn - The async function to wrap
 * @returns {Function} A middleware function that handles errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Export the asyncHandler as default
export default asyncHandler;
