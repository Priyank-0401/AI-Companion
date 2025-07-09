import { Router } from 'express';
import { authenticate } from '../../../../middleware/auth.middleware.js';
import ChatController from '../controllers/chat.controller.js';
import {
  validateCreateConversation,
  validateGetConversations,
  validateConversationId,
  validateUpdateConversation,
  validateSendMessage,
  validateStreamMessage,
  validateGetMessages,
} from '../validators/chat.validators.js';

const router = Router();

// Public routes
router.get('/models', ChatController.listModels);

// Apply authentication middleware to protected routes
router.use(authenticate);

// Remove leading slashes from route paths to prevent double slashes

// Conversation routes
router.post('/conversations', validateCreateConversation, ChatController.createConversation);
router.get('/conversations', validateGetConversations, ChatController.getConversations);

// Single conversation routes
router.get('/conversations/:conversationId', validateConversationId, ChatController.getConversation);

// Debug logging for PUT/PATCH routes
router.put('/conversations/:conversationId', (req, res, next) => {
  console.log(`PUT /conversations/${req.params.conversationId} hit`);
  console.log('Request body:', req.body);
  console.log('Request params:', req.params);
  next();
}, validateUpdateConversation, ChatController.updateConversation);

router.patch('/conversations/:conversationId', (req, res, next) => {
  console.log(`PATCH /conversations/${req.params.conversationId} hit`);
  console.log('Request body:', req.body);
  console.log('Request params:', req.params);
  next();
}, validateUpdateConversation, ChatController.updateConversation);

router.delete('/conversations/:conversationId', validateConversationId, ChatController.deleteConversation);

// Message routes
router.post('/conversations/:conversationId/messages', validateSendMessage, ChatController.sendMessage);
router.post('/conversations/:conversationId/messages/stream', validateStreamMessage, ChatController.streamMessage);
router.get('/conversations/:conversationId/messages', validateGetMessages, ChatController.getMessages);

// Model management is now at the top as a public route

export { router as chatRoutes };
