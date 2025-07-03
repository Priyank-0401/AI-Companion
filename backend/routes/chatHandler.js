import { parseRequestBody, sendJsonResponse, sendErrorResponse } from '../utils/helpers.js';
import { URL } from 'url';
import chatService from '../services/chatService.js';

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
    if (pathname === '/conversations' || pathname === '/conversations/') {
      if (method === 'GET') {
        try {
          if (!req.user?.uid) {
            console.warn('No authenticated user');
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
      
      // Handle unsupported methods
      return sendErrorResponse(res, 405, 'Method not allowed');
    }

    // Get single conversation
    if (pathname.startsWith('/conversations/') && method === 'GET') {
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
        return sendErrorResponse(res, 500, 'Failed to get conversation', error.message);
      }
    }

    // Create or update conversation
    if (pathname.startsWith('/conversations') && (method === 'POST' || method === 'PUT')) {
      try {
        if (!req.user?.uid) {
          return sendErrorResponse(res, 401, 'Unauthorized');
        }

        const userId = req.user.uid;
        const body = await parseRequestBody(req);
        
        if (!body) {
          return sendErrorResponse(res, 400, 'Invalid request body');
        }

        let conversation;
        if (method === 'POST') {
          // Create new conversation
          conversation = {
            ...body,
            userId,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          const created = await chatService.createConversation(conversation);
          return sendJsonResponse(res, 201, created);
          
        } else {
          // Update existing conversation
          if (!body.id) {
            return sendErrorResponse(res, 400, 'Conversation ID is required');
          }
          
          conversation = {
            ...body,
            userId,
            updatedAt: new Date()
          };
          
          const updated = await chatService.updateConversation(conversation);
          if (!updated) {
            return sendErrorResponse(res, 404, 'Conversation not found');
          }
          
          return sendJsonResponse(res, 200, updated);
        }
        
      } catch (error) {
        console.error('Error saving conversation:', error);
        return sendErrorResponse(res, 500, 'Failed to save conversation', error.message);
      }
    }

    // Delete conversation
    if (pathname.startsWith('/conversations/') && method === 'DELETE') {
      const conversationId = pathname.split('/').pop();
      const userId = req.user?.uid;
      
      if (!userId) {
        return sendErrorResponse(res, 401, 'Unauthorized');
      }
      
      try {
        const success = await chatService.deleteConversation(conversationId, userId);
        if (!success) {
          return sendErrorResponse(res, 404, 'Conversation not found');
        }
        return sendJsonResponse(res, 200, { success: true });
      } catch (error) {
        console.error('Error deleting conversation:', error);
        return sendErrorResponse(res, 500, 'Failed to delete conversation', error.message);
      }
    }

    // Send message
    if (pathname === '/message' && method === 'POST') {
      try {
        if (!req.user?.uid) {
          return sendErrorResponse(res, 401, 'Unauthorized');
        }
        
        const userId = req.user.uid;
        const body = await parseRequestBody(req);
        
        if (!body || !body.conversationId || !body.content) {
          return sendErrorResponse(res, 400, 'Missing required fields');
        }
        
        const message = {
          ...body,
          userId,
          timestamp: new Date()
        };
        
        const savedMessage = await chatService.saveMessage(message);
        return sendJsonResponse(res, 201, savedMessage);
        
      } catch (error) {
        console.error('Error sending message:', error);
        return sendErrorResponse(res, 500, 'Failed to send message', error.message);
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
          return sendErrorResponse(res, 500, 'Failed to get AI response', error.message);
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
        return sendErrorResponse(res, 500, 'Failed to fetch conversations', error.message);
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
        return sendErrorResponse(res, 500, 'Failed to fetch conversation', error.message);
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
        return sendErrorResponse(res, 500, 'Failed to delete conversation', error.message);
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
        return sendErrorResponse(res, 500, 'Failed to export conversation', error.message);
      }
    }

    // GET /api/chat/models - Get available models
    if (pathname === '/api/chat/models' && method === 'GET') {
      try {
        const models = await ollamaClient.getAvailableModels();
        return sendJsonResponse(res, 200, models);
      } catch (error) {
        console.error('Error fetching models:', error);
        return sendErrorResponse(res, 500, 'Failed to fetch models', error.message);
      }
    }

    // If no routes matched
    return sendErrorResponse(res, 404, 'Endpoint not found');
    
  } catch (error) {
    console.error('Unexpected error in chat handler:', error);
    if (!res.headersSent) {
      return sendErrorResponse(res, 500, 'Internal server error', error.message);
    }
  }
}

// Export the chatHandler as default
export default chatHandler;
