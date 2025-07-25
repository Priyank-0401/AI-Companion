import axios from 'axios';
import { auth } from '../config/firebase';

// Create axios instance with base URL
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}`, // Removed /api/v1 to allow flexible endpoint access
  timeout: 10000, // 10 second timeout
});

// Function to get the current user's ID token
const getAuthToken = async () => {
  console.log('[Auth] Getting auth token...');
  try {
    await auth.authStateReady();
    console.log('[Auth] Auth state is ready.');
    const user = auth.currentUser;

    if (!user) {
      console.warn('[Auth] No authenticated user found in auth.currentUser.');
      return null;
    }

    console.log(`[Auth] User found: ${user.uid}. Requesting token...`);
    const token = await user.getIdToken(true); // Force refresh
    console.log(`[Auth] Token received: ${token ? token.substring(0, 30) + '...' : 'null'}`);
    return token;

  } catch (error) {
    console.error('[Auth] Critical error in getAuthToken:', error);
    return null;
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  console.log(`[API Interceptor] Intercepting request to: ${config.url}`);
  const token = await getAuthToken();

  if (token) {
    console.log('[API Interceptor] Token found. Attaching Authorization header.');
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('[API Interceptor] No token found. Request will be sent without Authorization.');
  }

  console.log('[API Interceptor] Final headers:', config.headers);
  return config;
}, (error) => {
  console.error('[API Interceptor] Request error:', error);
  return Promise.reject(error);
});

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't already tried to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await getAuthToken();
        if (newToken) {
          // Update the Authorization header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          // Retry the original request with the new token
          return api(originalRequest);
        } else {
          // If we can't get a new token, redirect to login
          window.location.href = '/login';
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Dashboard API
/**
 * Get dashboard data
 * @param {Object} [params] - Query parameters
 * @param {number} [params.timeRange=7] - The time range in days for the data
 * @returns {Promise<Object>} Dashboard data
 */
export const getDashboardData = async (params) => {
  try {
    const response = await api.get('/api/v1/dashboard', { params });
    // The backend wraps the actual payload in a 'data' property
    return response.data.data;
  } catch (error) {
    console.error('API Error getting dashboard data:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch dashboard data');
  }
};

// Mood API
export const addMoodEntry = async (moodData) => {
  try {
    const response = await api.post('/api/v1/mood', moodData);
    return response.data;
  } catch (error) {
    console.error('API Error adding mood entry:', error.response?.data || error.message);
    throw error.response?.data || { message: 'An unknown error occurred while saving your mood.' };
  }
};

// Constants
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
export const DEFAULT_MODEL = 'llama3-8b-8192';
export const DEFAULT_STYLE = 'empathetic';
export const DEFAULT_MAX_TOKENS = 8192;

// Available models and their configurations
const MODEL_CONFIGS = {
  'llama3-8b-8192': { maxTokens: 8192 },
  'llama3-70b-8192': { maxTokens: 8192 },
  'mixtral-8x7b-32768': { maxTokens: 32768 },
  'gemini-1.5-pro': { maxTokens: 1048576 },
  'gpt-3.5-turbo': { maxTokens: 16385 },
  'gpt-4-turbo': { maxTokens: 128000 },
  'claude-3-opus': { maxTokens: 200000 },
  'claude-3-sonnet': { maxTokens: 200000 },
  'mistral-7b-instruct': { maxTokens: 32768 },
  'mixtral-8x22b-instruct': { maxTokens: 65536 },
  'llama-2-7b-chat': { maxTokens: 4096 },
  'llama-2-70b-chat': { maxTokens: 4096 },
  'code-llama-34b-instruct': { maxTokens: 16384 },
  'code-llama-70b-instruct': { maxTokens: 16384 },
  'llama-3-70b-instruct': { maxTokens: 8192 },
  'llama-3-8b-instruct': { maxTokens: 8192 }
};

// Available styles for chat responses
const STYLES = [
  'empathetic',
  'professional',
  'concise',
  'elaborate',
  'humorous',
  'serious'
];

// Get model configuration
export const getModelConfig = (modelId) => {
  return MODEL_CONFIGS[modelId] || { maxTokens: DEFAULT_MAX_TOKENS };
};

// Validate if a style is supported
export const isValidStyle = (style) => {
  return STYLES.includes(style);
};

// Default timeout for API requests (5 minutes)
const DEFAULT_TIMEOUT = 5 * 60 * 1000;

// Timeout for conversations endpoint (longer timeout)
const CONVERSATIONS_TIMEOUT = 2 * 60 * 1000; // 2 minutes

/**
 * Helper function to construct API URLs consistently
 * @param {string} path - The API endpoint path
 * @returns {string} The full URL
 */
function getApiUrl(path) {
  // Remove any trailing slashes from base URL and leading/trailing slashes from path
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  
  // If the path already includes the base URL, return it as is
  if (cleanPath.startsWith(cleanBase)) {
    return cleanPath;
  }
  
  // If the path already includes the API version, don't add it again
  if (cleanPath.startsWith('api/v1/')) {
    return `${cleanBase}/${cleanPath}`;
  }
  
  // Default case: add the path to the base URL
  return `${cleanBase}/${cleanPath}`;
}

/**
 * Parse error response from the API
 * @param {Response} response - The fetch Response object
 * @returns {Promise<Object>} Parsed error data
 */
async function parseErrorResponse(response) {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return { message: await response.text() };
  } catch (e) {
    return { 
      message: response.statusText || 'Unknown error occurred',
      status: response.status 
    };
  }
}

/**
 * Log API request details in development mode
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 */
function logRequest(method, url, options) {
  if (import.meta.env.DEV) {
    const logData = {
      method,
      url,
      headers: { ...options.headers, Authorization: '[REDACTED]' },
    };
    
    if (options.body) {
      try {
        logData.body = JSON.parse(options.body);
      } catch (e) {
        logData.body = options.body;
      }
    }
    
    console.debug('API Request:', logData);
  }
}

/**
 * Base API class for making HTTP requests
 */
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
    this.pendingRequests = new Map();
    this.timeout = DEFAULT_TIMEOUT;
  }

  /**
   * Get authentication headers
   * @private
   */
  /**
   * Get authentication headers with a fresh token
   * @private
   * @returns {Promise<Headers>} Headers with authentication token
   */
  async _getAuthHeaders() {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Request-ID': `frontend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    try {
      // Wait for auth state to be ready with a timeout
      await Promise.race([
        auth.authStateReady(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth state ready timeout')), 5000)
        )
      ]);
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('No authenticated user found');
        // Instead of returning empty headers, redirect to login
        window.location.href = '/login';
        throw new Error('Authentication required');
      }

      // Get a fresh token with a timeout
      const token = await Promise.race([
        currentUser.getIdToken(true),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Token refresh timeout')), 5000)
        )
      ]);
      
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      } else {
        console.error('Failed to get authentication token');
        window.location.href = '/login';
        throw new Error('Failed to get authentication token');
      }
    } catch (error) {
      console.error('Error in _getAuthHeaders:', error);
      // Only redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw error; // Re-throw to be caught by the request method
    }

    return headers;
  }

  /**
   * Parse the response from the API
   * @private
   * @param {Response} response - The fetch Response object
   * @returns {Promise<Object>} The parsed response data
   */
  async _parseResponse(response) {
    const contentType = response.headers.get('content-type');
    
    // Handle empty responses
    if (response.status === 204 || response.status === 205) {
      return {};
    }
    
    // Parse JSON response
    if (contentType && contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (error) {
        console.error('Error parsing JSON response:', error);
        throw new Error('Invalid JSON response from server');
      }
    }
    
    // Handle text/plain responses
    if (contentType && contentType.includes('text/plain')) {
      const text = await response.text();
      return { message: text };
    }
    
    // For any other content type, return as text
    const text = await response.text();
    return { data: text };
  }

  /**
   * Make an HTTP request
   * @param {string} endpoint - The API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} The response data
   */
  /**
   * Make an authenticated HTTP request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @param {number} retryCount - Current retry count
   * @returns {Promise<Object>} Response data
   */
  async request(endpoint, options = {}, retryCount = 0) {
    const MAX_RETRIES = 1; // Only retry once to prevent loops
    const controller = new AbortController();
    let timeoutId;
    
    // Get timeout from options or use default
    const timeout = options.timeout || this.timeout;

    // Helper function to create error objects
    const createError = (message, status, details = {}) => ({
      success: false,
      error: message,
      status,
      ...details
    });
    // Set up timeout only if not already aborted
    if (!controller.signal.aborted) {
      timeoutId = setTimeout(() => {
        if (!controller.signal.aborted) {
          console.warn(`Request to ${endpoint} timed out after ${timeout}ms`);
          controller.abort();
        }
      }, timeout);
    }

    try {
      // Construct the full URL
      const baseUrl = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
      const url = endpoint.startsWith('http') 
        ? endpoint 
        : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

      // Get fresh auth headers
      const authHeaders = await this._getAuthHeaders();
      
      // Create a new options object with the base options
      const requestOptions = { ...options };
      
      // Set up headers
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...Object.fromEntries((await this._getAuthHeaders()).entries())
      });
      
      // Add any custom headers from options
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            headers.set(key, String(value));
          }
        });
      }
      
      // Set the headers in the request options
      requestOptions.headers = headers;
      
      // Handle request body if present
      if (options.body) {
        // Store the original body for potential retries
        if (!options._processedBody) {
          requestOptions._processedBody = options.body;
        }
        
        try {
          // Skip processing for FormData, Blob, ArrayBuffer, etc.
          if (typeof options.body === 'object' && 
              !(options.body instanceof FormData) &&
              !(options.body instanceof URLSearchParams) &&
              !ArrayBuffer.isView(options.body) &&
              !(options.body instanceof Blob)) {
            // Only stringify if it's a plain object and not a special type
            requestOptions.body = JSON.stringify(options.body);
          } else {
            // For other types, use as is
            requestOptions.body = options.body;
          }
        } catch (error) {
          console.error('Error processing request body:', error);
          requestOptions.body = JSON.stringify({}); // Fallback to empty object
        }
      }

      // Log request in development
      logRequest(options.method || 'GET', url, requestOptions);

      let response;
      try {
        // Make the HTTP request
        response = await fetch(url, requestOptions);
        
        // Clear the timeout since we got a response
        if (timeoutId) clearTimeout(timeoutId);

        // Handle 401 Unauthorized - attempt token refresh once
        if (response.status === 401) {
          // If we've already retried, don't try again
          if (retryCount >= MAX_RETRIES) {
            console.warn('Max retries reached, redirecting to login');
            window.location.href = '/login';
            throw createError('Authentication required', 401);
          }
          
          console.log('Authentication required, attempting token refresh...');
          const currentUser = auth.currentUser;
          
          if (currentUser) {
            try {
              // Force refresh the token with a timeout
              const tokenRefreshPromise = currentUser.getIdToken(true);
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Token refresh timeout')), 10000)
              );
              
              const newToken = await Promise.race([tokenRefreshPromise, timeoutPromise]);
              
              if (newToken) {
                console.log('Token refreshed, retrying request...');
                
                // Create a new options object for the retry
                const retryOptions = { ...options };
                
                // Ensure headers exist and is a Headers object
                if (!retryOptions.headers) {
                  retryOptions.headers = new Headers();
                } else if (!(retryOptions.headers instanceof Headers)) {
                  // Convert plain object headers to Headers object
                  const headers = new Headers();
                  Object.entries(retryOptions.headers).forEach(([key, value]) => {
                    if (Array.isArray(value)) {
                      value.forEach(v => headers.append(key, v));
                    } else if (value !== undefined && value !== null) {
                      headers.set(key, String(value));
                    }
                  });
                  retryOptions.headers = headers;
                }
                
                // Update the Authorization header with new token
                retryOptions.headers.set('Authorization', `Bearer ${newToken}`);
                
                // For non-GET/HEAD requests, ensure we have the original body
                if (!['GET', 'HEAD'].includes(options.method?.toUpperCase()) && options.body) {
                  // If we've already processed the body, use it as is
                  if (options._processedBody) {
                    retryOptions.body = options._processedBody;
                  }
                } else {
                  // For GET/HEAD requests, remove the body
                  delete retryOptions.body;
                }
                
                // Add a small delay to ensure the token is properly set
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Retry with new token and incremented retry count
                return this.request(endpoint, retryOptions, retryCount + 1);
              }
            } catch (tokenError) {
              console.error('Error refreshing token:', tokenError);
              // If token refresh fails, redirect to login
              window.location.href = '/login';
              throw createError('Authentication failed', 401);
            }
          } else {
            // No current user, redirect to login
            window.location.href = '/login';
            throw createError('Not authenticated', 401);
          }
        }

        // Parse the response
        let data;
        try {
          // Check for HTTP errors
          if (!response.ok) {
            // For other errors, parse the error response
            const errorData = await this._parseResponse(response);
            const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
            error.status = response.status;
            error.details = errorData.error || errorData;
            error.response = errorData;
            throw error;
          }
          
          // If we get here, the response is OK (2xx)
          data = await this._parseResponse(response);
          
          // Handle empty responses (e.g., 204 No Content)
          if (response.status === 204) {
            return { success: true };
          }
          
          // Ensure consistent response structure
          if (typeof data === 'string') {
            data = { data };
          } else if (data === undefined || data === null) {
            data = { success: true };
          }
          
          return data;
        } catch (error) {
          console.error('Error parsing response:', error);
          throw error;
        }

      } catch (error) {
        // Clear timeout in case of error
        if (timeoutId) clearTimeout(timeoutId);
        
        // Handle network errors
        if (error.name === 'AbortError') {
          throw createError('Request timed out', 408);
        }
        
        // Handle token refresh errors
        if (error.message === 'Token refresh timeout') {
          throw createError('Token refresh timed out', 408);
        }
        
        // Re-throw other errors
        throw error;
      }
    } catch (error) {
      console.error('Request failed:', error);
      
      // Handle specific error cases
      if (error.name === 'AbortError') {
        error.message = 'Request timed out';
        error.status = 408;
      } else if (!error.status) {
        error.status = 500;
      }
      
      // Return a structured error response
      throw createError(
        error.message || 'Request failed',
        error.status,
        {
          details: error.details || error.message,
          ...(error.response || {})
        }
      );
    }
  }

  /**
   * Send a GET request
   * @param {string} endpoint - The API endpoint
   * @param {Object} [params] - Query parameters
   * @param {Object} [options] - Additional fetch options
   * @returns {Promise<Object>} The response data
   */
  get = async (endpoint, params = {}, options = {}) => {
    try {
      const query = new URLSearchParams();
      
      // Add query parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });
      
      const queryString = query.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      
      return await this.request(url, {
        ...options,
        method: 'GET'
      });
    } catch (error) {
      console.error('Error in GET request:', error);
      throw error;
    }
  }

  /**
   * Send a POST request
   * @param {string} endpoint - The API endpoint (without leading slash)
   * @param {Object} [data] - The request body
   * @param {Object} [options] - Additional fetch options
   * @returns {Promise<Object>} The response data
   */
  post = async (endpoint, data, options = {}) => {
    // Ensure endpoint is a string
    const cleanEndpoint = String(endpoint || '').trim();
    if (!cleanEndpoint) {
      throw new Error('Endpoint cannot be empty');
    }

    try {
      // Prepare request options
      const requestOptions = {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      };

      // Add body if data is provided
      if (data !== undefined) {
        requestOptions.body = typeof data === 'string' ? data : JSON.stringify(data);
      }
      
      // Make the request
      const response = await this.request(cleanEndpoint, requestOptions);
      
      console.debug('POST Response:', { 
        endpoint: cleanEndpoint, 
        response: response?.data || response 
      });
      
      return response;
    } catch (error) {
      console.error('POST Request Failed:', {
        endpoint: cleanEndpoint,
        error: error.message,
        stack: error.stack,
        response: error.response?.data || 'No response data'
      });
      
      // Re-throw the error to be handled by the caller
      throw error;
    }
  }

  /**
   * Send a PUT request
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - The request body
   * @param {Object} [options] - Additional fetch options
   * @returns {Promise<Object>} The response data
   */
  put = async (endpoint, data, options = {}) => {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Send a DELETE request
   * @param {string} endpoint - The API endpoint
   * @param {Object} [options] - Additional fetch options
   * @returns {Promise<Object>} The response data
   */
  delete = async (endpoint, options = {}) => {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE'
    });
  }
}

// Create a shared API client instance
const apiClient = new ApiClient();

/**
 * Chat API service for managing conversations and messages
 */
const chatApi = {
  /**
   * Get available models
   * @returns {Promise<Array>} List of available models with their details
   */
  async getModels() {
    const models = Object.entries(MODEL_CONFIGS).map(([id, config]) => ({
      id,
      ...config
    }));
    
    // Filter out deprecated models
    return models.filter(model => !model.deprecated);
  },

  /**
   * Get conversation styles
   * @returns {Array} List of available conversation styles
   */
  getConversationStyles() {
    return [...CONVERSATION_STYLES];
  },

  /**
   * Create a new conversation
   * @param {Object} params - Conversation parameters
   * @param {string} [params.title] - Optional title for the conversation
   * @param {string} [params.model] - Model to use for the conversation
   * @param {string} [params.style] - Conversation style
   * @returns {Promise<Object>} The created conversation
   */
  async createConversation({ title, model = DEFAULT_MODEL, style = DEFAULT_STYLE } = {}) {
    try {
      // Ensure we have a valid user session
      await auth.authStateReady();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.error('No authenticated user found when creating conversation');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      
      // Get a fresh token
      const token = await currentUser.getIdToken(true);
      if (!token) {
        console.error('Failed to get authentication token');
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
      
      const payload = { model, style };
      if (title) payload.title = title;
      
      // Make the request with explicit headers
      const response = await apiClient.post('chat/conversations', payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response;
    } catch (error) {
      console.error('Error in createConversation:', error);
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
      throw error;
    }
  },

  /**
   * Get all conversations for the current user
   * @param {Object} params - Query parameters
   * @param {number} [params.limit=20] - Number of conversations to return
   * @param {number} [params.offset=0] - Number of conversations to skip
   * @returns {Promise<Array>} List of conversations
   */
  async getConversations({ limit = 20, offset = 0 } = {}) {
    return apiClient.get('chat/conversations', { limit, offset });
  },

  /**
   * Get a specific conversation by ID
   * @param {string} conversationId - The ID of the conversation to retrieve
   * @returns {Promise<Object>} The conversation object with messages
   */
  async getConversation(conversationId) {
    if (!conversationId) {
      throw new Error('conversationId is required');
    }
    return apiClient.get(`chat/conversations/${conversationId}`);
  },

  /**
   * Send a message in a conversation
   * @param {Object} params - Message parameters
   * @param {string} params.conversationId - The ID of the conversation
   * @param {string} params.content - The message content
   * @param {string} [params.model] - Override the conversation model
   * @param {string} [params.style] - Override the conversation style
   * @param {boolean} [params.stream=false] - Whether to stream the response
   * @returns {Promise<Object>} The AI response
   */
  async sendMessage({ 
    conversationId, 
    content, 
    model, 
    style, 
    stream = false 
  }) {
    if (!conversationId) {
      throw new Error('conversationId is required');
    }
    
    const messageContent = String(content || '').trim();
    if (!messageContent) {
      throw new Error('Message content cannot be empty');
    }

    const payload = { 
      content: messageContent,
      stream 
    };
    
    // Only include model/style if provided
    if (model) payload.model = model;
    if (style) payload.style = style;

    if (stream) {
      // For streaming responses, we'll handle the raw response
      const requestId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return this._streamResponse(conversationId, payload, requestId);
    }
    
    // For non-streaming, use the standard API client
    return apiClient.post(
      `chat/conversations/${conversationId}/messages`,
      payload
    );
  },

  /**
   * Handle streaming response from the API
   * @private
   */
  async _streamResponse(conversationId, payload, requestId) {
    const url = getApiUrl(`chat/conversations/${conversationId}/messages`);
    const headers = await apiClient._getAuthHeaders();
    
    // Set up event source for streaming
    const eventSource = new EventSource(`${url}?stream=true`, {
      headers: Object.fromEntries(headers.entries())
    });

    // Create a promise that resolves when the stream is complete
    return new Promise((resolve, reject) => {
      let fullResponse = '';
      let error = null;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.event === 'error') {
            error = new Error(data.message || 'Error in stream');
            error.details = data.details;
            eventSource.close();
            return;
          }
          
          if (data.event === 'complete') {
            eventSource.close();
            resolve({
              content: fullResponse,
              conversationId,
              messageId: data.messageId,
              usage: data.usage,
              done: true
            });
            return;
          }
          
          // Accumulate the response content
          if (data.content) {
            fullResponse += data.content;
            
            // Emit the partial response
            if (typeof this.onStreamChunk === 'function') {
              this.onStreamChunk({
                content: data.content,
                fullContent: fullResponse,
                conversationId,
                messageId: data.messageId,
                done: false
              });
            }
          }
        } catch (e) {
          console.error('Error processing stream chunk:', e);
          error = e;
          eventSource.close();
        }
      };

      eventSource.onerror = (err) => {
        console.error('EventSource error:', err);
        eventSource.close();
        
        if (!error) {
          error = new Error('Error connecting to the server');
        }
        
        reject(error);
      };
      
      // Send the initial request
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...Object.fromEntries(headers.entries())
        },
        body: JSON.stringify(payload)
      }).catch(err => {
        console.error('Error starting stream:', err);
        eventSource.close();
        reject(err);
      });
    });
    
    return apiClient.put(`chat/conversations/${conversationId}`, updates);
  },

  /**
   * Update a conversation
   * @param {string} conversationId - The ID of the conversation to update
   * @param {Object} updates - The updates to apply to the conversation
   * @param {string} [updates.title] - New title for the conversation
   * @param {string} [updates.model] - New model for the conversation
   * @param {string} [updates.style] - New style for the conversation
   * @returns {Promise<Object>} The updated conversation
   */
  async updateConversation(conversationId, updates) {
    if (!conversationId) {
      throw new Error('conversationId is required');
    }
    
    if (!updates || typeof updates !== 'object') {
      throw new Error('updates object is required');
    }
    
    return apiClient.put(`chat/conversations/${conversationId}`, updates);
  },

  /**
   * Delete a conversation
   * @param {string} conversationId - The ID of the conversation to delete
   * @returns {Promise<boolean>} True if the conversation was deleted
   */
  async deleteConversation(conversationId) {
    if (!conversationId) {
      throw new Error('conversationId is required');
    }
    
    return apiClient.delete(`chat/conversations/${conversationId}`)
      .then(() => true);
  },

  /**
   * Get usage statistics
   * @param {Object} params - Query parameters
   * @param {string} [params.provider] - Filter by provider (e.g., 'groq', 'openrouter')
   * @param {string} [params.model] - Filter by model ID
   * @param {string} [params.startDate] - Start date (ISO format)
   * @param {string} [params.endDate] - End date (ISO format)
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsageStats({ provider, model, startDate, endDate } = {}) {
    const params = {};
    if (provider) params.provider = provider;
    if (model) params.model = model;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    return apiClient.get('chat/usage', params);
  },

  /**
   * Get service status
   * @returns {Promise<Object>} Service status information
   */
  async getServiceStatus() {
    return apiClient.get('chat/status');
  },
  
  /**
   * Callback for handling streaming chunks
   * @callback StreamChunkCallback
   * @param {Object} chunk - The chunk of data
   * @param {string} chunk.content - The content of the current chunk
   * @param {string} chunk.fullContent - The full content received so far
   * @param {string} chunk.conversationId - The conversation ID
   * @param {string} chunk.messageId - The message ID
   * @param {boolean} chunk.done - Whether the stream is complete
   */
  
  /**
   * Set a callback for handling streaming chunks
   * @param {StreamChunkCallback} callback - The callback function
   */
  onStreamChunk: null
};

// Export the chat API object and API client
export default chatApi;
export { apiClient, ApiClient, api };
