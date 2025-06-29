require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const admin = require('firebase-admin');
const { getAppCheck } = require('firebase-admin/app-check');
const cors = require('cors');

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

// Initialize App Check
const appCheck = getAppCheck(firebaseApp);

// Middleware to verify App Check token
const verifyAppCheckToken = async (appCheckToken) => {
  if (!appCheckToken) {
    throw new Error('App Check token is missing');
  }

  try {
    const appCheckClaims = await appCheck.verifyToken(appCheckToken);
    
    // If verifyToken() succeeds, continue with the next middleware
    return appCheckClaims;
  } catch (error) {
    console.error('App Check verification failed:', error);
    throw new Error('Invalid App Check token');
  }
};

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

// Store connected clients
const clients = new Map();

// Handle WebSocket authentication and connection
server.on('upgrade', async (request, socket, head) => {
  try {
    // Extract tokens from query parameters or headers
    const token = request.url.split('token=')[1]?.split('&')[0] || 
                 request.headers['sec-websocket-protocol']?.split(', ')[1];
    const appCheckToken = request.headers['x-firebase-appcheck'];

    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // In production, verify both Firebase ID token and App Check token
    if (process.env.NODE_ENV === 'production' || process.env.ENFORCE_APP_CHECK === 'true') {
      try {
        await verifyAppCheckToken(appCheckToken);
      } catch (error) {
        console.error('App Check failed:', error.message);
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    wss.handleUpgrade(request, socket, head, (ws) => {
      // Store the WebSocket connection with user ID
      clients.set(userId, ws);
      
      ws.userId = userId;
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          console.log(`Received message from ${userId}:`, data);
          
          // Handle different message types
          switch (data.type) {
            case 'ping':
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
              break;
            case 'message':
              // Broadcast to all clients or specific ones based on your logic
              broadcastMessage(userId, data);
              break;
            // Add more message types as needed
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });

      ws.on('close', () => {
        clients.delete(userId);
        console.log(`Client ${userId} disconnected`);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection_established',
        userId,
        timestamp: Date.now()
      }));
    });
  } catch (error) {
    console.error('WebSocket upgrade error:', error);
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
  }
});

// Broadcast message to all connected clients
function broadcastMessage(senderId, message) {
  const fullMessage = {
    ...message,
    senderId,
    timestamp: Date.now()
  };

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(fullMessage));
    }
  });
}

// Send ping to all clients every 30 seconds to check connection
setInterval(() => {
  clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log(`Terminating inactive connection: ${ws.userId}`);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { server, wss };
