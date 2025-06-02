const { parseRequestBody, sendJsonResponse, sendErrorResponse } = require('../utils/helpers');
const url = require('url');

/**
 * Handle chat-related requests
 */
async function chatHandler(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  const ollamaClient = global.ollamaClient;

  try {
    // POST /api/chat/send - Send message to AI
    if (pathname === '/api/chat/send' && method === 'POST') {
      const body = await parseRequestBody(req);
      
      if (!body.message) {
        return sendErrorResponse(res, 400, 'Message is required');
      }

      const { message, conversationId, style = 'supportive' } = body;
      
      try {
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

    // GET /api/chat/conversations - Get conversation history
    if (pathname === '/api/chat/conversations' && method === 'GET') {
      try {
        const conversations = await ollamaClient.getConversations();
        return sendJsonResponse(res, 200, conversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        return sendErrorResponse(res, 500, 'Failed to fetch conversations');
      }
    }

    // GET /api/chat/conversation/:id - Get specific conversation
    if (pathname.startsWith('/api/chat/conversation/') && method === 'GET') {
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

    // DELETE /api/chat/conversation/:id - Delete conversation
    if (pathname.startsWith('/api/chat/conversation/') && method === 'DELETE') {
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
