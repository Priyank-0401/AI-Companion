import { getAuth } from 'firebase/auth';
import { getAppCheck } from 'firebase/app-check';
import { app } from '../config/firebase';

// Get WebSocket URL from environment variables or use default
const WS_URL = import.meta.env.VITE_WEBSOCKET_URL || 
  (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + 
  window.location.host + '/ws';

// Get App Check instance if available
let appCheck;
try {
  appCheck = getAppCheck(app);
} catch (error) {
  console.warn('App Check not initialized:', error.message);
}

class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.messageQueue = [];
    this.subscribers = new Map();
    this.isAuthenticated = false;
  }

  async connect() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return true;
    }

    try {
      // Get Firebase auth token for authentication
      const auth = getAuth();
      const [token, appCheckToken] = await Promise.all([
        auth.currentUser?.getIdToken(),
        appCheck?.getToken()
      ]);
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Create WebSocket URL with token as query parameter
      const url = new URL(WS_URL);
      url.searchParams.append('token', token);
      
      // Create WebSocket with optional protocols for App Check
      const protocols = [];
      if (appCheckToken?.token) {
        protocols.push(appCheckToken.token);
      }
      
      this.socket = protocols.length > 0 
        ? new WebSocket(url.toString(), protocols)
        : new WebSocket(url.toString());
      
      // Set binary type to arraybuffer for binary data support
      this.socket.binaryType = 'arraybuffer';
      
      // Set up event handlers with proper binding
      const boundHandlers = {
        open: this.handleOpen.bind(this),
        message: this.handleMessage.bind(this),
        close: this.handleClose.bind(this),
        error: this.handleError.bind(this)
      };
      
      this.socket.onopen = boundHandlers.open;
      this.socket.onmessage = boundHandlers.message;
      this.socket.onclose = boundHandlers.close;
      this.socket.onerror = boundHandlers.error;
      
      // Store bound handlers for cleanup
      this.boundHandlers = boundHandlers;
      
      return new Promise((resolve, reject) => {
        this.connectionResolve = resolve;
        this.connectionReject = reject;
        
        // Set a connection timeout (10 seconds)
        this.connectionTimeout = setTimeout(() => {
          if (this.socket?.readyState !== WebSocket.OPEN) {
            this.handleError(new Error('Connection timeout'));
            this.cleanup();
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect(error);
      throw error;
      return this.attemptReconnect();
    }
  }

  handleOpen() {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    this.isAuthenticated = true;
    
    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // Process any queued messages
    this.processMessageQueue();
    
    // Notify subscribers of connection
    this.notifySubscribers({ 
      type: 'connection', 
      status: 'connected',
      timestamp: new Date().toISOString()
    });
    
    // Resolve the connection promise
    if (this.connectionResolve) {
      this.connectionResolve(true);
      this.connectionResolve = null;
      this.connectionReject = null;
    }
    
    // Start heartbeat to keep connection alive
    this.startHeartbeat();
  }

  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      
      // Handle authentication responses
      if (message.type === 'auth') {
        if (message.status === 'authenticated') {
          this.isAuthenticated = true;
        } else {
          console.error('Authentication failed:', message.error);
          this.isAuthenticated = false;
          this.disconnect();
        }
        return;
      }
      
      // Notify subscribers
      if (this.subscribers.has(message.type)) {
        const callbacks = this.subscribers.get(message.type);
        callbacks.forEach(callback => callback(message.data));
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }

  handleClose(event) {
    console.log('WebSocket disconnected:', event.code, event.reason);
    this.isAuthenticated = false;
    
    if (event.code !== 1000) { // 1000 = normal closure
      this.attemptReconnect();
    }
    
    if (this.connectionReject) {
      this.connectionReject(new Error('WebSocket connection closed'));
    }
  }

  handleError(error) {
    console.error('WebSocket error:', error);
  }

  async sendMessage(type, data) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.isAuthenticated) {
      // Queue the message if not connected
      this.messageQueue.push({ type, data });
      
      // Try to reconnect if not already attempting
      if (!this.reconnectAttempts) {
        await this.connect();
      }
      return false;
    }
    
    try {
      const message = JSON.stringify({ type, data });
      this.socket.send(message);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  subscribe(type, callback) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type).add(callback);
    
    // Return unsubscribe function
    return () => {
      if (this.subscribers.has(type)) {
        const callbacks = this.subscribers.get(type);
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(type);
        }
      }
    };
  }

  async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      if (this.connectionReject) {
        this.connectionReject(new Error('Max reconnection attempts reached'));
      }
      return false;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return this.connect();
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0 && this.socket?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      this.sendMessage(message.type, message.data);
    }
  }

  disconnect(code = 1000, reason = 'Normal closure') {
    if (this.socket) {
      // Stop heartbeat
      this.stopHeartbeat();
      
      // Clear any pending reconnection attempts
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      // Close the WebSocket
      try {
        this.socket.close(code, reason);
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      
      this.cleanup();
    }
  }
  
  cleanup() {
    // Remove all event listeners
    if (this.socket && this.boundHandlers) {
      this.socket.removeEventListener('open', this.boundHandlers.open);
      this.socket.removeEventListener('message', this.boundHandlers.message);
      this.socket.removeEventListener('close', this.boundHandlers.close);
      this.socket.removeEventListener('error', this.boundHandlers.error);
      this.boundHandlers = null;
    }
    
    this.socket = null;
    this.isAuthenticated = false;
    
    // Notify subscribers of disconnection
    this.notifySubscribers({ 
      type: 'connection', 
      status: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
  
  // Heartbeat to keep connection alive
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Send ping every 25 seconds (server will close if no message in 30s)
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        try {
          this.send({ type: 'ping' });
        } catch (error) {
          console.warn('Heartbeat ping failed:', error);
        }
      }
    }, 25000);
  }
  
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  notifySubscribers(message) {
    if (this.subscribers.has(message.type)) {
      const callbacks = this.subscribers.get(message.type);
      callbacks.forEach(callback => callback(message));
    }
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();

export default webSocketService;
