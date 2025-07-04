// Models
export { default as Conversation } from './models/conversation.model.js';
export { default as Message } from './models/message.model.js';

// Services
export { default as FirestoreService } from './services/firestore.service.js';
export { default as OllamaService } from './services/ollama.service.js';

// Controllers
export { default as ChatController } from './controllers/chat.controller.js';

// Routes
import chatRoutes from './routes/chat.routes.js';
export { chatRoutes };

export default {
  // Models
  Conversation,
  Message,
  
  // Services
  FirestoreService,
  OllamaService,
  
  // Controllers
  ChatController,
  
  // Routes
  chatRoutes,
};
