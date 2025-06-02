const http = require('http')
const url = require('url')
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables
dotenv.config()

// Import handlers
const chatHandler = require('./routes/chatHandler')
const wellnessHandler = require('./routes/wellnessHandler')
const journalHandler = require('./routes/journalHandler')
const settingsHandler = require('./routes/settingsHandler')

// Import Ollama client
const OllamaClient = require('./utils/ollamaClient')

// Configuration
const PORT = process.env.PORT || 3001
const HOST = process.env.HOST || 'localhost'

// Initialize Ollama client globally
global.ollamaClient = new OllamaClient()

/**
 * Send JSON response with proper headers
 */
function sendJsonResponse(res, statusCode, data) {
  res.setHeader('Content-Type', 'application/json')
  res.statusCode = statusCode
  res.end(JSON.stringify(data, null, 2))
}

/**
 * Send error response with consistent format
 */
function sendErrorResponse(res, statusCode, message, details = null) {
  const response = {
    error: true,
    message: message,
    timestamp: new Date().toISOString()
  }
  
  // Add details only in development mode
  if (details && process.env.NODE_ENV === 'development') {
    response.details = details
  }
  
  res.setHeader('Content-Type', 'application/json')
  res.statusCode = statusCode
  res.end(JSON.stringify(response, null, 2))
}

/**
 * Parse request body for POST/PUT requests
 */
async function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    
    req.on('data', chunk => {
      body += chunk.toString()
    })
    
    req.on('end', () => {
      try {
        const parsedBody = body ? JSON.parse(body) : {}
        resolve(parsedBody)
      } catch (error) {
        reject(new Error('Invalid JSON in request body'))
      }
    })
    
    req.on('error', reject)
  })
}

/**
 * Validate required fields in request data
 */
function validateRequiredFields(data, requiredFields) {
  const missing = requiredFields.filter(field => 
    data[field] === undefined || data[field] === null || data[field] === ''
  )
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`)
  }
}

/**
 * Setup CORS headers
 */
function setupCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')
}

/**
 * Route handler
 */
async function handleRequest(req, res) {
  try {
    // Setup CORS
    setupCors(res)
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.statusCode = 200
      res.end()
      return
    }
    
    // Parse URL
    const parsedUrl = url.parse(req.url, true)
    const pathname = parsedUrl.pathname
    const method = req.method
    
    console.log(`${method} ${pathname}`)
    
    // Add helper functions to request object
    req.sendJsonResponse = sendJsonResponse
    req.sendErrorResponse = sendErrorResponse
    req.parseRequestBody = parseRequestBody
    req.validateRequiredFields = validateRequiredFields
    
    // Route handling
    if (pathname.startsWith('/api/chat')) {
      await chatHandler(req, res)
    } else if (pathname.startsWith('/api/wellness')) {
      await wellnessHandler(req, res)
    } else if (pathname.startsWith('/api/journal')) {
      await journalHandler(req, res)
    } else if (pathname.startsWith('/api/settings')) {
      await settingsHandler(req, res)
    } else if (pathname === '/api/health') {
      // Health check endpoint
      sendJsonResponse(res, 200, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        ollama: await global.ollamaClient.checkHealth()
      })
    } else {
      // 404 - Not Found
      sendErrorResponse(res, 404, 'Route not found')
    }
    
  } catch (error) {
    console.error('Server error:', error)
    sendErrorResponse(res, 500, 'Internal server error', error.message)
  }
}

// Create and start server
const server = http.createServer(handleRequest)

server.listen(PORT, HOST, () => {
  console.log(`🚀 AI Companion Backend Server running on http://${HOST}:${PORT}`)
  console.log(`📋 Available endpoints:`)
  console.log(`   POST /api/chat/send - Send message to AI`)
  console.log(`   GET  /api/wellness - Get wellness content`)
  console.log(`   POST /api/wellness/exercises - Create wellness exercise`)
  console.log(`   GET  /api/journal/entries - Get journal entries`)
  console.log(`   POST /api/journal/entries - Create journal entry`)
  console.log(`   GET  /api/settings - Get settings`)
  console.log(`   POST /api/settings - Update settings`)
  console.log(`   GET  /api/health - Health check`)
  console.log(`🤖 Ollama model: ${process.env.OLLAMA_MODEL || 'llama3:latest'}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Process terminated')
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('Process terminated')
  })
})