const FirestoreService = require('../services/firestoreService');
const { verifyToken } = require('../middleware/auth');
const { parseRequestBody, sendJsonResponse, sendErrorResponse } = require('../utils/helpers');

/**
 * Handle conversation-related requests
 */
async function conversationHandler(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  const searchParams = new URLSearchParams(parsedUrl.search);

  try {
    // POST / - Create a new conversation
    if ((pathname === '/' || pathname === '') && method === 'POST') {
      const userId = req.user?.uid;
      if (!userId) {
        return sendErrorResponse(res, 401, 'Unauthorized');
      }

      const body = await parseRequestBody(req);
      const { title = 'New Conversation', model = 'default', tags = [] } = body;
  try {
    const userId = req.user.uid;
    const { title = 'New Conversation', model = 'default', tags = [] } = req.body;
    
    const conversation = await FirestoreService.createConversation(userId, {
      title,
      model,
      tags,
      messages: []
    });
    
    res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create conversation',
      message: error.message 
    });
  }
}

// Get all conversations for the user
    // GET / - Get all conversations for the user
    if ((pathname === '/' || pathname === '') && method === 'GET') {
      const userId = req.user?.uid;
      if (!userId) {
        return sendErrorResponse(res, 401, 'Unauthorized');
      }
  try {
    const userId = req.user.uid;
    const { limit = 50, offset = 0 } = req.query;
    
    const conversations = await FirestoreService.listConversations(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch conversations',
      message: error.message 
    });
  }
}

// Get a single conversation with messages
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    
    const conversation = await FirestoreService.getConversation(userId, id);
    const messages = await FirestoreService.getMessages(userId, id);
    
    res.json({
      success: true,
      data: {
        ...conversation,
        messages
      }
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ 
      success: false, 
      error: 'Failed to fetch conversation',
      message: error.message 
    });
  }
});

// Update a conversation
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    const updates = req.body;
    
    // Only allow certain fields to be updated
    const allowedUpdates = ['title', 'model', 'tags', 'isArchived'];
    const isValidUpdate = Object.keys(updates).every(update => 
      allowedUpdates.includes(update)
    );
    
    if (!isValidUpdate) {
      return res.status(400).json({
        success: false,
        error: 'Invalid updates!',
        allowedUpdates
      });
    }
    
    const updated = await FirestoreService.updateConversation(userId, id, updates);
    
    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ 
      success: false, 
      error: 'Failed to update conversation',
      message: error.message 
    });
  }
});

// Delete a conversation
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    
    await FirestoreService.deleteConversation(userId, id);
    
    res.json({
      success: true,
      data: { id }
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ 
      success: false, 
      error: 'Failed to delete conversation',
      message: error.message 
    });
  }
});

// Add a message to a conversation
router.post('/:id/messages', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id: conversationId } = req.params;
    const { role, content, model } = req.body;
    
    if (!role || !content) {
      return res.status(400).json({
        success: false,
        error: 'Role and content are required'
      });
    }
    
    const message = await FirestoreService.addMessage(userId, conversationId, {
      role,
      content,
      model: model || 'default',
      timestamp: new Date().toISOString()
    });
    
    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error adding message:', error);
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ 
      success: false, 
      error: 'Failed to add message',
      message: error.message 
    });
  }
});

// Get messages from a conversation
router.get('/:id/messages', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id: conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const messages = await FirestoreService.getMessages(userId, conversationId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ 
      success: false, 
      error: 'Failed to fetch messages',
      message: error.message 
    });
  }
});

// WebSocket/SSE endpoint for real-time updates
router.get('/:id/stream', verifyToken, (req, res) => {
  try {
    const userId = req.user.uid;
    const { id: conversationId } = req.params;
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    // Subscribe to conversation updates
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
  } catch (error) {
    console.error('Error setting up conversation stream:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to set up conversation stream',
        message: error.message 
      });
    }
  }
});

    // If no route matches
    return sendErrorResponse(res, 404, 'Conversation endpoint not found');
  } catch (error) {
    console.error('Conversation handler error:', error);
    return sendErrorResponse(res, 500, 'Internal server error');
  }
}

module.exports = conversationHandler;
