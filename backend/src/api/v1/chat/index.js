// Models
import Conversation from './models/conversation.model.js';
import Message from './models/message.model.js';

// Services
import FirestoreService from './services/firestore.service.js';
import LLMService from './services/LLMService.js';

// Controllers
import ChatController from './controllers/chat.controller.js';
import LLMController from './controllers/llm.controller.js';

// Routes
import { chatRoutes } from './routes/chat.routes.js';
import llmRoutes from './routes/llm.routes.js';

// Re-export models
export { Conversation, Message };

// Export services
export { FirestoreService, LLMService };

// Export controllers
export { ChatController, LLMController };

// Export routes
export { chatRoutes, llmRoutes };

export default {
  // Models
  Conversation,
  Message,
  
  // Services
  FirestoreService,
  LLMService,
  
  // Controllers
  ChatController,
  LLMController,
  
  // Routes
  chatRoutes,
  llmRoutes,
};
