import FirestoreService from '../services/firestoreService.js';
import { parseRequestBody, sendJsonResponse, sendErrorResponse } from '../utils/helpers.js';

/**
 * Handle conversation-related requests
 */
async function conversationHandler(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  const searchParams = Object.fromEntries(parsedUrl.searchParams);
  const userId = req.user?.uid;

  if (!userId) {
    return sendErrorResponse(res, 401, 'Unauthorized');
  }

  try {
    // Handle conversations endpoint
    if (pathname === '/' || pathname === '' || pathname === '/conversations') {
      // GET / - Get all conversations for the user
      if (method === 'GET') {
        const { limit = 50, offset = 0 } = searchParams;
        const conversations = await FirestoreService.listConversations(userId, {
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
        return sendJsonResponse(res, 200, conversations);
      }
      
      // POST / - Create a new conversation
      if (method === 'POST') {
        try {
          console.log('Received POST request to create conversation');
          const body = await parseRequestBody(req);
          console.log('Request body:', JSON.stringify(body, null, 2));
          
          const { title = 'New Conversation', model = 'default', tags = [] } = body;
          
          console.log('Creating conversation with data:', { title, model, tags });
          
          const conversation = await FirestoreService.createConversation(userId, {
            title,
            model,
            tags: Array.isArray(tags) ? tags : [],
            messages: []
          });
          
          console.log('Successfully created conversation:', conversation.id);
          return sendJsonResponse(res, 201, conversation);
          
        } catch (error) {
          console.error('Error creating conversation:', error);
          return sendErrorResponse(res, 500, `Failed to create conversation: ${error.message}`);
        }
      }
      
      return sendErrorResponse(res, 405, 'Method not allowed');
    }
    
    // Handle specific conversation endpoints
    const pathSegments = pathname.split('/').filter(Boolean);
    const conversationId = pathSegments[pathSegments.length - 1];
    if (!conversationId) {
      return sendErrorResponse(res, 400, 'Invalid conversation ID');
    }
    
    // GET /:id - Get a single conversation with messages
    if (method === 'GET') {
      const conversation = await FirestoreService.getConversation(userId, conversationId);
      const messages = await FirestoreService.getMessages(userId, conversationId);
      
      return sendJsonResponse(res, 200, {
        ...conversation,
        messages
      });
    }
    
    // PATCH /:id - Update a conversation
    if (method === 'PATCH') {
      const updates = await parseRequestBody(req);
      
      // Only allow certain fields to be updated
      const allowedUpdates = ['title', 'model', 'tags', 'isArchived'];
      const isValidUpdate = Object.keys(updates).every(update => 
        allowedUpdates.includes(update)
      );
      
      if (!isValidUpdate) {
        return sendErrorResponse(res, 400, 'Invalid updates! Only title, model, tags, and isArchived can be updated');
      }
      
      const updated = await FirestoreService.updateConversation(userId, conversationId, updates);
      return sendJsonResponse(res, 200, updated);
    }
    
    // DELETE /:id - Delete a conversation
    if (method === 'DELETE') {
      await FirestoreService.deleteConversation(userId, conversationId);
      return sendJsonResponse(res, 200, { id: conversationId });
    }
    
    // Handle /:id/messages endpoints
    if (pathname.endsWith('/messages')) {
      // POST /:id/messages - Add a message to a conversation
      if (method === 'POST') {
        const { role, content } = await parseRequestBody(req);
        
        if (!['user', 'assistant'].includes(role)) {
          return sendErrorResponse(res, 400, 'Invalid message role. Must be either "user" or "assistant"');
        }
        
        if (!content || typeof content !== 'string') {
          return sendErrorResponse(res, 400, 'Message content is required and must be a string');
        }
        
        const message = await FirestoreService.addMessage(userId, conversationId, {
          role,
          content,
          timestamp: new Date().toISOString()
        });
        
        return sendJsonResponse(res, 201, message);
      }
      
      return sendErrorResponse(res, 405, 'Method not allowed');
    }
    
    // Handle /:id/export endpoint
    if (pathname.endsWith('/export')) {
      if (method === 'GET') {
        const { format = 'json' } = searchParams;
        const conversation = await FirestoreService.getConversation(userId, conversationId);
        const messages = await FirestoreService.getMessages(userId, conversationId);
        
        if (format === 'txt') {
          const textContent = messages.map(msg => 
            `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`
          ).join('\n\n');
          
          res.setHeader('Content-Type', 'text/plain');
          res.setHeader('Content-Disposition', `attachment; filename=conversation-${conversationId}.txt`);
          return res.send(textContent);
        }
        
        // Default to JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=conversation-${conversationId}.json`);
        return sendJsonResponse(res, 200, {
          ...conversation,
          messages
        });
      }
      
      return sendErrorResponse(res, 405, 'Method not allowed');
    }
    
    // Handle /:id/stream endpoint
    if (pathname.endsWith('/stream')) {
      if (method === 'GET') {
        const unsubscribe = FirestoreService.subscribeToConversation(
          userId,
          conversationId,
          (error, conversation) => {
            if (error) {
              console.error('Error in conversation stream:', error);
              res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
              return;
            }
            
            res.write(`data: ${JSON.stringify(conversation)}\n\n`);
          }
        );
        
        // Clean up on client disconnect
        req.on('close', () => {
          unsubscribe();
          res.end();
        });
      } else {
        return sendErrorResponse(res, 405, 'Method not allowed');
      }
    }
    
    return sendErrorResponse(res, 404, 'Endpoint not found');
    
  } catch (error) {
    console.error('Conversation handler error:', error);
    const status = error.message.includes('not found') ? 404 : 500;
    return sendErrorResponse(res, status, error.message);
  }
}

export default conversationHandler;
