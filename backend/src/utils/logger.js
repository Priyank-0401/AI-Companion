import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import config from '../config/index.js';

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, align } = format;

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  const msg = stack || message;
  return `${timestamp} [${level}]: ${msg}`;
});

// Define different formats for console and file
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  logFormat
);

const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.json()
);

// Create logger instance
const logger = createLogger({
  level: config.app.logLevel || 'info',
  format: fileFormat,
  defaultMeta: { service: config.app.name },
  transports: [
    // Write all logs with level `error` and below to `error.log`
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: config.app.logMaxSize || 10485760, // 10MB
      maxFiles: config.app.logMaxFiles || 7,
    }),
    // Write all logs with level `info` and below to `combined.log`
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: config.app.logMaxSize || 10485760, // 10MB
      maxFiles: config.app.logMaxFiles || 7,
    }),
  ],
  exitOnError: false, // Don't exit on handled exceptions
});

// If we're not in production, log to the console as well
if (config.app.env !== 'production') {
  logger.add(
    new transports.Console({
      format: consoleFormat,
    })
  );
}

// Create a stream for Morgan to use with Winston
export const stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

export default logger;

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection at: ${reason.stack || reason}`);
  // Recommended: send the information to sentry.io or other error tracking service
});

export { logger };
