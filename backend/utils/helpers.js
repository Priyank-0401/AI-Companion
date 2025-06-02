/**
 * Helper utilities for the server
 */
const fs = require('fs').promises;
const path = require('path');

/**
 * Read JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<Object>} Parsed JSON data
 */
async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Write JSON file
 * @param {string} filePath - Path to JSON file
 * @param {Object} data - Data to write
 * @returns {Promise<void>}
 */
async function writeJsonFile(filePath, data) {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    throw error;
  }
}

/**
 * Parse request body from stream
 * @param {Object} req - HTTP request object
 * @returns {Promise<Object>} Parsed JSON body
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    
    req.on('data', (chunk) => {
      body += chunk.toString()
    })
    
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {}
        resolve(parsed)
      } catch (error) {
        reject(new Error('Invalid JSON in request body'))
      }
    })
    
    req.on('error', (error) => {
      reject(error)
    })
  })
}

/**
 * Send JSON response
 * @param {Object} res - HTTP response object
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Response data
 */
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

/**
 * Send error response
 * @param {Object} res - HTTP response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 */
function sendError(res, statusCode, message) {
  sendJSON(res, statusCode, { error: message })
}

/**
 * CORS headers
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

/**
 * Validate required fields in request body
 * @param {Object} body - Request body
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object|null} Validation error or null if valid
 */
function validateRequiredFields(body, requiredFields) {
  const missing = requiredFields.filter(field => !body || !body[field])
  
  if (missing.length > 0) {
    return {
      error: `Missing required fields: ${missing.join(', ')}`
    }
  }
  
  return null
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * Format date to ISO string
 * @param {Date} date - Date object
 * @returns {string} ISO string
 */
function formatDate(date = new Date()) {
  return date.toISOString()
}

/**
 * Safe file operations wrapper
 * @param {Function} operation - File operation function
 * @returns {Promise} Result of operation
 */
async function safeFileOperation(operation) {
  try {
    return await operation()
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null // File doesn't exist
    }
    throw error
  }
}

module.exports = {
  parseRequestBody: parseBody,
  sendJsonResponse: sendJSON,
  sendErrorResponse: sendError,
  readJsonFile,
  writeJsonFile,
  corsHeaders,
  validateRequiredFields,
  generateId,
  formatDate,
  safeFileOperation
}
