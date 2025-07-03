import morgan from 'morgan';
import winston from 'winston';
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, json } = format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (metadata && Object.keys(metadata).length > 0) {
    msg += `\n${JSON.stringify(metadata, null, 2)}`;
  }
  return msg;
});

// Create logger instance
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  transports: [
    // Write all logs with level `error` and below to `error.log`
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with level `info` and below to `combined.log`
    new transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exitOnError: false, // Don't exit on handled exceptions
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      consoleFormat
    ),
  }));
}

// Morgan token for request ID
morgan.token('id', (req) => req.id);

// Morgan logging format
const morganFormat = ':remote-addr - :remote-user [:date[clf]] "method :method :url HTTP/:http-version" :status :res[content-length] "referrer" "user-agent" - :response-time ms';

// Request logging middleware
const requestLogger = morgan(morganFormat, {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    },
  },
  skip: (req) => {
    // Skip health check logs in production
    return process.env.NODE_ENV === 'production' && req.path === '/api/health';
  },
});

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    query: req.query,
    body: req.body,
    user: req.user ? req.user.uid : 'anonymous',
  });
  
  next(err);
};

const morganMiddleware = requestLogger;

export {
  logger,
  requestLogger,
  errorLogger,
  morganMiddleware
};
