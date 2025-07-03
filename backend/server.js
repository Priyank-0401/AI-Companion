import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
// Firebase is initialized automatically when imported
import './config/firebase-admin.js';
import OllamaClient from './utils/ollamaClient.js';

// Load environment variables
dotenv.config();

// Configuration
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize Ollama client globally
global.ollamaClient = new OllamaClient();

// Create HTTP server
const server = http.createServer(app);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log('Firebase Admin initialized automatically on import');
});

export default server;