const { parseRequestBody, sendJsonResponse, sendErrorResponse } = require('../utils/helpers');
const url = require('url');
const chatService = require('../services/chatService');

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': 86400 // 24 hours
};

// Setup CORS function
function setupCors(res) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

/**
 * Handle chat-related requests
 */
async function chatHandler(req, res) {
  console.log('\n=== New Request ===');
  console.log('Full URL:', req.url);
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  
  // Get the original URL and parse it
  const baseUrl = 'http://' + req.headers.host;
  const parsedUrl = new URL(req.url, baseUrl);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  const ollamaClient = global.ollamaClient;

  console.log('Path:', pathname);
  console.log(`[Chat Handler] Received ${method} request for ${pathname}`);
  console.log(`[Chat Handler] Full URL: ${req.url}`);
  console.log(`[Chat Handler] Headers:`, req.headers);

  // Handle preflight requests
  if (method === 'OPTIONS') {
    setupCors(res);
    res.statusCode = 204;
    res.end();
    return;
  }

  // Set CORS headers for all responses
  setupCors(res);

  try {
    // Conversation endpoints
    if (pathname === '/chat/conversations' || pathname === '/chat/conversations/') {
      if (method === 'GET') {
        try {
          if (!req.user?.uid) {
            console.error('No authenticated user');
            return sendJsonResponse(res, 200, []);
          }
          
          const userId = req.user.uid;
          console.log(`[Chat Handler] Fetching conversations for user: ${userId}`);
          
          const conversations = await chatService.getUserConversations(userId);
          console.log(`[Chat Handler] Found ${conversations.length} conversations`);
          
          // Ensure we always return an array, even if empty
          const response = Array.isArray(conversations) ? conversations : [];
          return sendJsonResponse(res, 200, response);
        } catch (error) {
          console.error('Error getting conversations:', error);
          // Return empty array instead of error to prevent frontend from retrying
          return sendJsonResponse(res, 200, []);
        }
      }
      
      // Handle other methods
      setupCors(res);
      if (method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }
      
      return sendErrorResponse(res, 405, 'Method not allowed');
    }

    // Get single conversation
    if (pathname.startsWith('/chat/conversations/') && method === 'GET') {
      const conversationId = pathname.split('/').pop();
      const userId = req.user?.uid;
      
      try {
        const conversation = await chatService.getConversation(conversationId, userId);
        if (!conversation) {
          return sendErrorResponse(res, 404, 'Conversation not found');
        }
        return sendJsonResponse(res, 200, conversation);
      } catch (error) {
        console.error('Error getting conversation:', error);
        return sendErrorResponse(res, 500, 'Failed to fetch conversation');
      }
    }

    // Delete conversation
    if (pathname.startsWith('/chat/conversations/') && method === 'DELETE') {
      const conversationId = pathname.split('/').pop();
      const userId = req.user?.uid;
      
      try {
        await chatService.deleteConversation(conversationId, userId);
        return sendJsonResponse(res, 200, { success: true });
      } catch (error) {
        console.error('Error deleting conversation:', error);
        return sendErrorResponse(res, 500, 'Failed to delete conversation');
      }
    }

    // Update conversation
    if (pathname.startsWith('/chat/conversations/') && method === 'PUT') {
      const conversationId = pathname.split('/').pop();
      const userId = req.user?.uid;
      
      if (!userId) {
        return sendErrorResponse(res, 401, 'Authentication required');
      }
      
      try {
        const body = await parseRequestBody(req);
        if (!body || typeof body !== 'object') {
          return sendErrorResponse(res, 400, 'Invalid request body');
        }
        
        console.log(`[Chat Handler] Updating conversation ${conversationId} for user ${userId}`);
        const updatedConversation = await chatService.updateConversation(conversationId, body, userId);
        
        if (!updatedConversation) {
          return sendErrorResponse(res, 404, 'Conversation not found or access denied');
        }
        
        console.log(`[Chat Handler] Successfully updated conversation ${conversationId}`);
        return sendJsonResponse(res, 200, updatedConversation);
      } catch (error) {
        console.error('Error updating conversation:', error);
        return sendErrorResponse(res, 500, 'Failed to update conversation');
      }
    }

    // Chat message endpoint
    if (pathname.endsWith('/chat/send')) {
      if (method === 'GET') {
        // For testing - return a simple response
        console.log('[Chat Handler] GET request to /chat/send - returning test response');
        return sendJsonResponse(res, 200, {
          message: 'Chat endpoint is working! Send a POST request with a message to chat.',
          timestamp: new Date().toISOString()
        });
      }
      
      // Handle POST request
      if (method === 'POST') {
        console.log('[Chat Handler] Processing chat message');
        try {
          const body = await parseRequestBody(req);
          
          if (!body.message) {
            return sendErrorResponse(res, 400, 'Message is required');
          }

          const { message, conversationId, style = 'supportive' } = body;
          
          const response = await ollamaClient.sendMessage(message, conversationId, style);
          return sendJsonResponse(res, 200, {
            response: response.message,
            conversationId: response.conversationId,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Chat error:', error);
          return sendErrorResponse(res, 500, 'Failed to get AI response');
        }
      }

    }

    // GET /chat/conversations - Get conversation history
    if (pathname.endsWith('/chat/conversations') && method === 'GET') {
      try {
        const conversations = await ollamaClient.getConversations();
        return sendJsonResponse(res, 200, conversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        return sendErrorResponse(res, 500, 'Failed to fetch conversations');
      }
    }

    // GET /conversation/:id - Get specific conversation
    if (pathname.startsWith('/conversations/') && method === 'GET') {
      const conversationId = pathname.split('/').pop();
      
      try {
        const conversation = await ollamaClient.getConversation(conversationId);
        if (!conversation) {
          return sendErrorResponse(res, 404, 'Conversation not found');
        }
        return sendJsonResponse(res, 200, conversation);
      } catch (error) {
        console.error('Error fetching conversation:', error);
        return sendErrorResponse(res, 500, 'Failed to fetch conversation');
      }
    }

    // DELETE /chat/conversations/:id - Delete conversation
    if ((pathname.startsWith('/chat/conversations/') || pathname.startsWith('/chat/conversation/')) && method === 'DELETE') {
      const conversationId = pathname.split('/').pop();
      
      try {
        const deleted = await ollamaClient.deleteConversation(conversationId);
        if (!deleted) {
          return sendErrorResponse(res, 404, 'Conversation not found');
        }
        return sendJsonResponse(res, 200, { message: 'Conversation deleted successfully' });
      } catch (error) {
        console.error('Error deleting conversation:', error);
        return sendErrorResponse(res, 500, 'Failed to delete conversation');
      }
    }

    // POST /api/chat/export - Export conversation
    if (pathname === '/api/chat/export' && method === 'POST') {
      const body = await parseRequestBody(req);
      const { conversationId, format = 'json' } = body;
      
      if (!conversationId) {
        return sendErrorResponse(res, 400, 'Conversation ID is required');
      }

      try {
        const conversation = await ollamaClient.getConversation(conversationId);
        if (!conversation) {
          return sendErrorResponse(res, 404, 'Conversation not found');
        }

        if (format === 'txt') {
          const textContent = conversation.messages
            .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
            .join('\n\n');
          
          res.setHeader('Content-Type', 'text/plain');
          res.setHeader('Content-Disposition', `attachment; filename="conversation-${conversationId}.txt"`);
          res.writeHead(200);
          res.end(textContent);
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="conversation-${conversationId}.json"`);
          res.writeHead(200);
          res.end(JSON.stringify(conversation, null, 2));
        }
      } catch (error) {
        console.error('Export error:', error);
        return sendErrorResponse(res, 500, 'Failed to export conversation');
      }
    }

    // GET /api/chat/models - Get available models
    if (pathname === '/api/chat/models' && method === 'GET') {
      try {
        const models = await ollamaClient.getAvailableModels();
        return sendJsonResponse(res, 200, models);
      } catch (error) {
        console.error('Error fetching models:', error);
        return sendErrorResponse(res, 500, 'Failed to fetch models');
      }
    }

    // If no route matches
    return sendErrorResponse(res, 404, 'Chat endpoint not found');

  } catch (error) {
    console.error('Chat handler error:', error);
    return sendErrorResponse(res, 500, 'Internal server error');
  }
}

module.exports = chatHandler;
