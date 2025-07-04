/**
 * Wraps an async function to catch errors and pass them to the next middleware
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function with error handling
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};

export default catchAsync;
