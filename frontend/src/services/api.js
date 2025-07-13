// API Base URL from environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
import { auth } from '../config/firebase';

// Default model configurations
export const DEFAULT_MODEL = 'llama3-8b-8192';
export const DEFAULT_STYLE = 'empathetic';

// Available models and their configurations
const MODEL_CONFIGS = {
  'llama3-8b-8192': {
    name: 'Llama 3 8B',
    provider: 'groq',
    maxTokens: 8192,
    supportsStreaming: true
  },
  'llama3-70b-8192': {
    name: 'Llama 3 70B',
    provider: 'groq',
    maxTokens: 8192,
    supportsStreaming: true
  },
  'mixtral-8x7b-32768': {
    name: 'Mixtral 8x7B',
    provider: 'openrouter',
    maxTokens: 32768,
    supportsStreaming: true,
    deprecated: true
  }
};

// Available conversation styles
export const CONVERSATION_STYLES = [
  { id: 'empathetic', name: 'Empathetic', description: 'Supportive and understanding responses' },
  { id: 'coach', name: 'Coach', description: 'Motivational and goal-oriented responses' },
  { id: 'playful', name: 'Playful', description: 'Fun and lighthearted responses' },
  { id: 'mindful', name: 'Mindful', description: 'Thoughtful and reflective responses' }
];

// Default timeout for API requests (5 minutes)
const DEFAULT_TIMEOUT = 5 * 60 * 1000;

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
  }

  /**
   * Get authentication headers
   * @private
   */
  async _getAuthHeaders() {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Request-ID': `frontend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }

    return headers;
  }

  /**
   * Make an HTTP request
   * @param {string} endpoint - The API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} The response data
   */
  /**
   * Parse the response from the server
   * @private
   * @param {Response} response - The fetch Response object
   * @returns {Promise<Object|string>} The parsed response data
   */
  async _parseResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (error) {
        console.error('Error parsing JSON response:', error);
        return response.text();
      }
    }
    
    return response.text();
  }

  async request(endpoint, options = {}) {
    // Ensure options is an object
    if (typeof options !== 'object' || options === null) {
      console.warn('Invalid options provided to request:', options);
      options = {}; // Reset to empty object instead of throwing
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    try {
      // Ensure endpoint is a string
      const endpointStr = String(endpoint || '').trim();
      if (!endpointStr) {
        throw new Error('Endpoint cannot be empty');
      }
      
      // Construct URL
      const cleanEndpoint = endpointStr.startsWith('/') ? endpointStr.slice(1) : endpointStr;
      const base = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
      const url = `${base}/${cleanEndpoint}`;
      
      // Get auth headers
      const authHeaders = await this._getAuthHeaders();
      
      // Prepare request options with safe defaults
      const requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...(options.headers || {})
        },
        signal: controller.signal,
        ...options
      };

      // Handle request body
      if (requestOptions.body !== undefined && requestOptions.body !== null) {
        try {
          if (typeof requestOptions.body === 'object' && 
              !(requestOptions.body instanceof FormData) &&
              !(requestOptions.body instanceof URLSearchParams) &&
              !ArrayBuffer.isView(requestOptions.body) &&
              !(requestOptions.body instanceof Blob)) {
            // Only stringify if it's a plain object and not a special type
            requestOptions.body = JSON.stringify(requestOptions.body);
          }
          // For other types (FormData, Blob, etc.), let fetch handle it
        } catch (error) {
          console.error('Error processing request body:', error);
          requestOptions.body = JSON.stringify({}); // Fallback to empty object
        }
      }

      // Log request in development
      logRequest(requestOptions.method, url, requestOptions);

      const response = await fetch(url, requestOptions);
      
      // Clear the timeout as we got a response
      clearTimeout(timeoutId);
      
      // Parse response
      let data;
      try {
        data = await this._parseResponse(response);
        
        // If the response is a string, try to parse it as JSON
        if (typeof data === 'string') {
          try {
            // Only try to parse if it looks like JSON
            if (data.trim().startsWith('{') || data.trim().startsWith('[')) {
              data = JSON.parse(data);
            } else {
              data = { data };
            }
          } catch (e) {
            console.warn('Response was not valid JSON, using as raw text');
            data = { data };
          }
        }
      } catch (error) {
        console.error('Error parsing response:', error);
        // Return a structured error response
        return {
          success: false,
          error: {
            message: 'Failed to parse server response',
            details: error.message,
            status: response.status
          }
        };
      }

      // Handle error responses
      if (!response.ok) {
        const error = new Error(data?.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.details = data?.error || data;
        error.response = data; // Include full response data
        
        // Log the error for debugging
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          error: error.message,
          details: error.details
        });
        
        throw error;
      }

      // Handle empty responses (e.g., 204 No Content)
      if (response.status === 204) {
        return null;
      }

      // Parse JSON response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }

      // Return text response as fallback
      return response.text();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        error.message = 'Request timed out';
        error.status = 408;
      }
      
      console.error(`API Request failed: ${error.message}`, {
        endpoint,
        status: error.status,
        details: error.details || error
      });
      
      throw error;
    }
  }

  /**
   * Send a GET request
   * @param {string} endpoint - The API endpoint
   * @param {Object} [params] - Query parameters
   * @param {Object} [options] - Additional fetch options
   * @returns {Promise<Object>} The response data
   */
  async get(endpoint, params = {}, options = {}) {
    const query = new URLSearchParams();
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });
    
    const queryString = query.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, { ...options, method: 'GET' });
  }

  /**
   * Send a POST request
   * @param {string} endpoint - The API endpoint (without leading slash)
   * @param {Object} [data] - The request body
   * @param {Object} [options] - Additional fetch options
   * @returns {Promise<Object>} The response data
   */
  async post(endpoint, data, options = {}) {
    // Ensure endpoint is a string
    const cleanEndpoint = String(endpoint || '').trim();
    if (!cleanEndpoint) {
      throw new Error('Endpoint cannot be empty');
    }

    // Prepare request options
    const requestOptions = {
      method: 'POST',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    // Only add body if data is provided
    if (data !== undefined) {
      requestOptions.body = data;
    }
    
    console.debug('POST Request:', { 
      endpoint: cleanEndpoint, 
      data,
      options: requestOptions 
    });
    
    try {
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
      
      // Handle specific error cases
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(error.response.data?.message || 'Request failed with status ' + error.response.status);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response received from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error('Error setting up request: ' + error.message);
      }
    }
  }

  /**
   * Send a PUT request
   * @param {string} endpoint - The API endpoint
   * @param {Object} [data] - The request body
   * @param {Object} [options] - Additional fetch options
   * @returns {Promise<Object>} The response data
   */
  async put(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data
    });
  }

  /**
   * Send a DELETE request
   * @param {string} endpoint - The API endpoint
   * @param {Object} [options] - Additional fetch options
   * @returns {Promise<Object>} The response data
   */
  async delete(endpoint, options = {}) {
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
    const payload = { model, style };
    if (title) payload.title = title;
    
    return apiClient.post('chat/conversations', payload);
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
  },

  /**
   * Update conversation metadata
   * @param {string} conversationId - The ID of the conversation to update
   * @param {Object} updates - Updates to apply to the conversation
   * @returns {Promise<Object>} The updated conversation
   */
  async updateConversation(conversationId, updates) {
    if (!conversationId) {
      throw new Error('conversationId is required');
    }
    
    if (!updates || typeof updates !== 'object') {
      throw new Error('Updates must be an object');
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

// Export the chat API object
export default chatApi;

// Export the API client for direct use
export { apiClient };
