// API Base URL from environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

import { auth } from '../config/firebase';

/**
 * Helper function to construct API URLs consistently
 * @param {string} path - The API endpoint path
 * @returns {string} The full URL
 */
export function getApiUrl(path) {
  // Remove any trailing slashes from base URL and leading/trailing slashes from path
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  
  // Check if this is a chat endpoint (already starts with chat/)
  const isChatEndpoint = cleanPath.startsWith('chat/');
  
  let finalUrl;
  
  if (isChatEndpoint) {
    // For chat endpoints, use /api/ as the base since the path already includes 'chat/'
    finalUrl = `${cleanBase}/api/${cleanPath}`;
  } else {
    finalUrl = `${cleanBase}/api/${cleanPath}`;
  }
  
  console.log('Constructed API URL:', {
    originalPath: path,
    cleanBase,
    cleanPath,
    isChatEndpoint,
    finalUrl
  });
  
  return finalUrl;
}

/**
 * Base API class for making HTTP requests
 */
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Make a request to the API
   * @param {string} endpoint - The API endpoint (without base URL)
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} The fetch response
   */
  async request(endpoint, options = {}) {
    // Extract query params and body from options
    const { params, body: requestBody, ...fetchOptions } = options;
    
    // Build URL with query parameters
    let url = getApiUrl(endpoint);
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
    
    const controller = new AbortController();
    
    // Set a longer timeout for chat endpoints (5 minutes to match server)
    const isChatEndpoint = endpoint.includes('chat/');
    const timeoutDuration = isChatEndpoint ? 300000 : 120000; // 5 minutes for chat (matching server), 2 minutes for others
    const timeoutId = setTimeout(() => {
      controller.abort(new Error(`Request timed out after ${timeoutDuration/1000} seconds`));
      console.warn(`[API] Request timed out: ${endpoint}`, { timeout: `${timeoutDuration/1000}s` });
    }, timeoutDuration);
    
    // console.log(`[API] ${fetchOptions.method || 'GET'} ${url}`, { 
    //   ...fetchOptions,
    //   timeout: `${timeoutDuration/1000}s`,
    //   params,
    //   body: requestBody
    // });
    
    try {
      // Get auth token from Firebase Auth
      let token = null;
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        try {
          // Force token refresh to ensure it's valid
          token = await currentUser.getIdToken(true);
          // console.log('Auth token retrieved successfully');
        } catch (tokenError) {
          console.error('Error getting auth token:', tokenError);
          // Clear any stale auth data
          if (typeof window !== 'undefined') {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
          }
          throw new Error('Authentication required. Please sign in again.');
        }
      } else {
        console.warn('No authenticated user found for API request');
        throw new Error('Authentication required. Please sign in.');
      }
      
      // Set up headers
      const headers = new Headers(fetchOptions.headers || {});
      
      // Set default headers if not already set
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      
      if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
      }
      
      // Add auth token if available
      if (token) {
        // console.log('Adding Authorization header with token');
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      // Log the final headers for debugging
      // console.log('Request headers:', Object.fromEntries(headers.entries()));
      
      // Prepare the request options
      const requestOptions = {
        method: (fetchOptions.method || 'GET').toUpperCase(),
        headers,
        signal: controller.signal,
      };
      
      // Add body if present (for POST, PUT, PATCH)
      const isBodyAllowed = ['POST', 'PUT', 'PATCH'].includes(requestOptions.method);
      if (isBodyAllowed && requestBody) {
        requestOptions.body = JSON.stringify(requestBody);
        // console.log('Request body:', requestOptions.body);
      }
      
      // Log the request details for debugging
      // console.group(`[API] ${requestOptions.method} ${url}`);
      // console.log('Headers:', Object.fromEntries(requestOptions.headers.entries()));
      // if (fetchOptions.body) {
      //   console.log('Body:', fetchOptions.body);
      // }
      // console.groupEnd();
      
      // Make the fetch request with the updated options
      let response;
      try {
        console.log('Sending request to:', url, requestOptions);
        
        // Ensure we have a valid URL
        if (!url) {
          throw new Error('Invalid URL: URL is empty');
        }
        
        // Make the request with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout for chat endpoints
        
        // Add signal to request options
        requestOptions.signal = controller.signal;
        
        try {
          response = await fetch(url, requestOptions);
          clearTimeout(timeoutId);
        } catch (error) {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            throw new Error('Request timed out after 3 minutes');
          }
          throw error;
        }
        console.log('Received response:', response.status, response.statusText);
        
        // Log response headers for debugging
        // console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
        
      } catch (networkError) {
        console.error('Network error details:', {
          error: networkError,
          message: networkError.message,
          name: networkError.name,
          stack: networkError.stack,
          url: url,
          method: requestOptions.method,
          timestamp: new Date().toISOString()
        });
        
        let errorMessage = 'Network error. Please check your connection and try again.';
        if (networkError.message === 'Failed to fetch') {
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
        } else if (networkError.message === 'Request timed out') {
          errorMessage = 'The request took too long. Please try again.';
        }
        
        const error = new Error(errorMessage);
        error.name = 'NetworkError';
        error.originalError = networkError;
        throw error;
      }
      
      // Clone the response for potential multiple reads
      const responseClone = response.clone();
      
      let responseData;
      const contentType = response.headers.get('content-type') || '';
      
      try {
        // Read the response body only once
        const responseText = await responseClone.text();
        
        // Try to parse as JSON if content type suggests it or if it looks like JSON
        const isLikelyJson = contentType.includes('application/json') || 
                            (responseText.trim().startsWith('{') || responseText.trim().startsWith('['));
        
        if (isLikelyJson && responseText) {
          try {
            responseData = JSON.parse(responseText);
          } catch (jsonError) {
            console.warn('Failed to parse JSON response, falling back to text');
            responseData = responseText;
          }
        } else {
          responseData = responseText;
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        // If we get here, we've already tried to read the response
        // Just return a generic error to avoid trying to read the body again
        responseData = { 
          error: 'Failed to parse server response',
          details: parseError.message,
          status: response.status,
          statusText: response.statusText
        };
        
        // Log additional debug info
        console.error('Response parsing failed with status:', response.status, response.statusText);
        console.error('Response headers:', Object.fromEntries([...response.headers.entries()]));
      }
      
      // Log the response for debugging
      console.group(`[API] Response from ${requestOptions.method} ${url}`);
      // console.log('Status:', response.status, response.statusText);
      // console.log('Headers:', Object.fromEntries([...response.headers.entries()]));
      // console.log('Response data:', responseData);
      console.groupEnd();
      
      // Handle non-2xx responses
      if (!response.ok) {
        // Extract error message from response
        let errorMessage = `Request failed with status ${response.status}: ${response.statusText}`;
        let errorDetails = [];
        
        if (responseData) {
          if (typeof responseData === 'string') {
            errorMessage = responseData;
          } else if (responseData.message) {
            errorMessage = responseData.message;
          } else if (responseData.errors && Array.isArray(responseData.errors)) {
            errorDetails = responseData.errors.map(e => 
              `${e.msg || e.message || JSON.stringify(e)} (${e.path || 'unknown'})`
            );
            errorMessage = errorDetails.join('; ');
          } else if (typeof responseData === 'object') {
            errorMessage = Object.entries(responseData)
              .map(([key, value]) => `${key}: ${value}`)
              .join('; ');
          }
        }
        
        console.error(`[API] Request failed: ${errorMessage}`, {
          endpoint: url,
          method: requestOptions.method,
          status: response.status,
          statusText: response.statusText,
          response: responseData,
          errorDetails
        });
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.response = responseData;
        error.details = errorDetails;
        throw error;
      }
      
      clearTimeout(timeoutId);
      
      // Parse and return the response
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`[API] ${fetchOptions.method || 'GET'} ${endpoint} response:`, data);
          return data;
        }
        
        // Handle non-JSON responses
        const text = await response.text();
        console.log(`[API] ${fetchOptions.method || 'GET'} ${endpoint} response (text):`, text);
        return text;
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Failed to parse server response');
      }
    } catch (error) {
      // Clear the timeout in case of error
      clearTimeout(timeoutId);
      console.error(`[API] Request failed: ${error.message}`, { 
        endpoint, 
        method: options.method || 'GET',
        error: error.response || error.message 
      });
      
      // Add more context to the error
      const apiError = new Error(error.message || 'API request failed');
      apiError.endpoint = endpoint;
      apiError.method = options.method || 'GET';
      apiError.originalError = error;
      
      throw apiError;
    }
  }

  /**
   * Make a GET request
   */
  async get(endpoint, options = {}) {
    try {
      const response = await this.request(endpoint, {
        method: 'GET',
        ...options,
      });
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw error;
    }
  }

  /**
   * Make a POST request
   */
  async post(endpoint, data = {}, options = {}) {
    try {
      // Ensure data is a plain object
      const requestData = { ...data };
      
      // Log the request for debugging
      console.log('POST request to', endpoint, 'with data:', requestData);
      
      // Set default headers if not provided
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };
      
      // Make the request with the data as the body
      // The request method will handle the JSON stringification
      const response = await this.request(endpoint, {
        method: 'POST',
        headers,
        body: requestData, // Don't stringify here, it's done in the request method
        ...options
      });
      
      return response;
    } catch (error) {
      console.error('POST request failed:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Make a PUT request
   */
  async put(endpoint, data = {}, options = {}) {  
    try {
      const response = await this.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options,
      });
      return response;
    } catch (error) {
      console.error('PUT request failed:', error);
      throw error;
    }
  }

  /**
   * Make a DELETE request
   */
  async delete(endpoint, options = {}) {
    try {
      const response = await this.request(endpoint, {
        method: 'DELETE',
        ...options,
      });
      return response;
    } catch (error) {
      console.error('DELETE request failed:', error);
      throw error;
    }
  }
}

// Create a shared API client instance
const apiClient = new ApiClient();

/**
 * Chat API service
 */
export const chatApi = {
  /**
   * Send a message to the chat API
   * @param {Object} params - Message parameters
   * @param {string} params.content - The message text
   * @param {string} [params.model='llama3'] - The model to use
   * @param {string} [params.style='empathetic'] - The conversation style (empathetic, coach, playful, or mindful)
   * @param {string} [params.conversationId] - Conversation ID (required)
   * @returns {Promise<Object>} The AI response
   */
  async sendMessage({ content, conversationId, model = 'llama3', style = 'empathetic', stream = false }) {
    const startTime = Date.now();
    const requestId = `msg_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Ensure content is a string
      const messageContent = String(content || '').trim();
      
      console.log(`[${requestId}] chatApi.sendMessage called`, { 
        conversationId,
        contentLength: messageContent.length,
        contentType: typeof messageContent,
        model,
        style,
        stream
      });
      
      if (!conversationId) {
        const error = new Error('No conversation ID provided');
        console.error(`[${requestId}] Validation error:`, error.message);
        throw error;
      }
      
      // Ensure content is not empty
      if (!messageContent) {
        const error = new Error('Message content cannot be empty');
        console.error(`[${requestId}] Validation error:`, error.message);
        throw error;
      }
      
      // Create payload with content and optional parameters
      const payload = {
        content: messageContent,  // Ensure this is a non-empty string
        model: model,
        style: style,
        stream: stream
      };
      
      console.log(`[${requestId}] Prepared message payload:`, {
        contentLength: trimmedContent.length,
        model,
        style,
        stream
      });
      
      const endpoint = `chat/conversations/${conversationId}/messages`;
      console.log(`[${requestId}] Sending POST request to:`, endpoint);
      
      const response = await apiClient.post(endpoint, payload);
      const duration = Date.now() - startTime;
      
      console.log(`[${requestId}] Message sent successfully in ${duration}ms`, {
        response: response ? 'Received response' : 'No response data',
        status: response?.status,
        conversationId
      });
      
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Get available Ollama models
   * @returns {Promise<Array>} List of available models
   */
  async getModels() {
    try {
      return await apiClient.get('chat/models') || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  },

  /**
   * Get all conversations for the current user
   * @returns {Promise<Array>} List of conversations
   */
  async getConversations() {
    try {
      return await apiClient.get('conversations') || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  },

  /**
   * Get a specific conversation by ID
   * @param {string} conversationId - The ID of the conversation to retrieve
   * @returns {Promise<Object>} The conversation object with messages
   */
  async getConversation(conversationId) {
    try {
      return await apiClient.get(`conversations/${conversationId}`) || null;
    } catch (error) {
      console.error(`Error fetching conversation ${conversationId}:`, error);
      return null;
    }
  },

  /**
   * Delete a conversation
   * @param {string} conversationId - The ID of the conversation to delete
   * @returns {Promise<boolean>} True if successful
   */
  async deleteConversation(conversationId) {
    try {
      console.log(`Attempting to delete conversation ${conversationId}`);
      const response = await apiClient.delete(`conversations/${conversationId}`);
      console.log(`Delete response for conversation ${conversationId}:`, response);
      return true;
    } catch (error) {
      console.error(`Error deleting conversation ${conversationId}:`, error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }
      throw error; // Re-throw to let the caller handle it
    }
  },

  /**
   * Save or update a conversation
   * @param {Object} conversation - The conversation object to save
   * @returns {Promise<Object>} The saved conversation with server response
   */
  async saveConversation(conversation) {
    const isNew = !conversation.id;
    const url = isNew ? 'conversations' : `conversations/${conversation.id}`;
    
    console.log(`Saving conversation (${isNew ? 'new' : 'update'}):`, conversation);
    
    try {
      // For new conversations, ensure we only send the fields the backend expects
      // Ensure model has the correct format (add :latest if needed for llama3)
      const sanitizeModel = (model) => {
        if (!model) return 'llama3:8B';
        if (model === 'llama3' || model.startsWith('llama3:')) {
          return 'llama3:8B';
        }
        return model;
      };

      const requestData = isNew 
        ? {
            title: conversation.title || 'New Chat',
            model: sanitizeModel(conversation.model),
            style: conversation.style || 'empathetic'
          }
        : {
            ...conversation,
            model: sanitizeModel(conversation.model)
          };
      
      // console.log('Sending conversation data:', requestData);
      
      const response = await apiClient[isNew ? 'post' : 'put'](url, requestData);
      
      // console.log('Save conversation response:', response);
      
      // Ensure we have a successful response
      if (!response) {
        throw new Error('No response received from server');
      }
      
      // If the response already has a success flag and data, return it as is
      if (response.success !== undefined && response.data) {
        return response;
      }
      
      // Otherwise, format the response to match our expected structure
      return {
        success: true,
        data: response,
        message: isNew ? 'Conversation created successfully' : 'Conversation updated successfully'
      };
    } catch (error) {
      console.error(`Error ${isNew ? 'creating' : 'updating'} conversation:`, error);
      
      // If this is a validation error, include the validation details
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors
          .map(err => `${err.param}: ${err.msg}`)
          .join('\n');
        throw new Error(`Validation error: ${validationErrors}`);
      }
      
      // For other errors, include the status code if available
      const statusMessage = error.response?.status 
        ? ` (Status: ${error.response.status})` 
        : '';
      
      throw new Error(`${error.message || 'Failed to save conversation'}${statusMessage}`);
    }
  },

  /**
   * Export a conversation
   * @param {string} conversationId - The ID of the conversation to export
   * @param {string} format - The export format (e.g., 'json', 'txt')
   * @returns {Promise<string|Blob>} The exported conversation data
   */
  async exportConversation(conversationId, format = 'json') {
    try {
      const response = await apiClient.get(
        `conversations/${conversationId}/export?format=${format}`,
        { responseType: format === 'json' ? 'json' : 'blob' }
      );
      return response.data;
    } catch (error) {
      console.error(`Error exporting conversation ${conversationId}:`, error);
      throw error;
    }
  }
};

/**
 * Wellness API service
 */
export const wellnessApi = {
  /**
   * Get wellness statistics
   * @returns {Promise<Object>} Wellness statistics
   */
  async getStats() {
    try {
      const response = await apiClient.get('wellness/stats');
      return response.data || {};
    } catch (error) {
      console.error('Error fetching wellness stats:', error);
      return {};
    }
  },
  
  /**
   * Log mood and energy level
   * @param {string} mood - Current mood
   * @param {number} energy - Energy level (1-10)
   * @param {string} notes - Additional notes
   * @returns {Promise<Object>} Saved mood entry
   */
  async logMood(mood, energy, notes) {
    try {
      const response = await apiClient.post('wellness/mood', {
        mood,
        energy: Number(energy),
        notes
      });
      return response.data || {};
    } catch (error) {
      console.error('Error logging mood:', error);
      throw error;
    }
  },
  
  /**
   * Get mood history
   * @returns {Promise<Array>} List of mood entries
   */
  async getMoods() {
    try {
      const response = await apiClient.get('wellness/mood');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching mood history:', error);
      return [];
    }
  },
  
  /**
   * Complete a breathing session
   * @param {number} duration - Session duration in minutes
   * @returns {Promise<Object>} Session details
   */
  async completeBreathingSession(duration = 5) {
    try {
      const response = await apiClient.post('wellness/breathing-sessions', {
        duration: Number(duration)
      });
      return response.data || { duration };
    } catch (error) {
      console.error('Error completing breathing session:', error);
      return { duration };
    }
  },
  
  /**
   * Update weekly wellness goal
   * @param {Object} weeklyGoal - Weekly goal details
   * @returns {Promise<Object>} Updated goal
   */
  async updateWeeklyGoal(weeklyGoal) {
    try {
      const response = await apiClient.put('wellness/goals/weekly', weeklyGoal);
      return response.data || { weeklyGoal };
    } catch (error) {
      console.error('Error updating weekly goal:', error);
      return { weeklyGoal };
    }
  },
  
  /**
   * Get wellness insights
   * @returns {Promise<Object>} Wellness insights
   */
  async getInsights() {
    try {
      const response = await apiClient.get('wellness/insights');
      return response.data || {};
    } catch (error) {
      console.error('Error fetching wellness insights:', error);
      return {};
    }
  }
};

/**
 * Journal API service
 */
export const journalApi = {
  /**
   * Get journal entries with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} List of journal entries
   */
  async getEntries(params = {}) {
    try {
      const response = await apiClient.get('journal/entries', { params });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      return [];
    }
  },
  
  /**
   * Create a new journal entry
   * @param {string} title - Entry title
   * @param {string} content - Entry content
   * @param {string} mood - Mood/emotion
   * @param {Array<string>} tags - List of tags
   * @returns {Promise<Object>} Created entry
   */
  async createEntry(title, content, mood, tags) {
    try {
      const response = await apiClient.post('journal/entries', {
        title,
        content,
        mood,
        tags: Array.isArray(tags) ? tags : [tags].filter(Boolean)
      });
      return response.data || null;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  },
  
  /**
   * Get a specific journal entry
   * @param {string} id - Entry ID
   * @returns {Promise<Object>} Journal entry
   */
  async getEntry(id) {
    try {
      const response = await apiClient.get(`journal/entries/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`Error fetching journal entry ${id}:`, error);
      return null;
    }
  },
  
  /**
   * Update a journal entry
   * @param {string} id - Entry ID
   * @param {Object} data - Updated entry data
   * @returns {Promise<Object>} Updated entry
   */
  async updateEntry(id, data) {
    try {
      const response = await apiClient.put(`journal/entries/${id}`, data);
      return response.data || null;
    } catch (error) {
      console.error(`Error updating journal entry ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a journal entry
   * @param {string} id - Entry ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteEntry(id) {
    try {
      await apiClient.delete(`journal/entries/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting journal entry ${id}:`, error);
      return false;
    }
  },
  
  /**
   * Get journal statistics
   * @returns {Promise<Object>} Journal statistics
   */
  async getStats() {
    try {
      const response = await apiClient.get('journal/stats');
      return response.data || {};
    } catch (error) {
      console.error('Error fetching journal stats:', error);
      return {};
    }
  },
  
  /**
   * Get all journal tags
   * @returns {Promise<Array>} List of tags
   */
  async getTags() {
    try {
      const response = await apiClient.get('journal/tags');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching journal tags:', error);
      return [];
    }
  },
  
  /**
   * Export journal entries
   * @param {string} format - Export format ('json' or 'txt')
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @returns {Promise<Blob|Object>} Exported data
   */
  async exportEntries(format = 'json', startDate, endDate) {
    try {
      const params = new URLSearchParams({ format });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await apiClient.get(`journal/export?${params.toString()}`, {
        responseType: format === 'json' ? 'json' : 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error exporting journal entries:', error);
      throw error;
    }
  }
};

/**
 * Settings API service
 */
export const settingsApi = {
  /**
   * Get all settings
   * @returns {Promise<Object>} Settings object
   */
  async getSettings() {
    try {
      const response = await apiClient.get('settings');
      return response.data || {};
    } catch (error) {
      console.error('Error fetching settings:', error);
      return {};
    }
  },
  
  /**
   * Get a specific settings section
   * @param {string} section - Section name
   * @returns {Promise<Object>} Section settings
   */
  async getSection(section) {
    try {
      const response = await apiClient.get(`settings/${section}`);
      return response.data || {};
    } catch (error) {
      console.error(`Error fetching settings section ${section}:`, error);
      return {};
    }
  },
  
  /**
   * Update a settings section
   * @param {string} section - Section name
   * @param {Object} data - Updated section data
   * @returns {Promise<Object>} Updated section
   */
  async updateSection(section, data) {
    try {
      const response = await apiClient.put(`settings/${section}`, data);
      return response.data || null;
    } catch (error) {
      console.error(`Error updating settings section ${section}:`, error);
      throw error;
    }
  },
  
  /**
   * Reset settings to default values
   * @param {string} [section] - Optional section to reset
   * @returns {Promise<boolean>} Success status
   */
  async resetSettings(section = null) {
    try {
      const endpoint = section ? `settings/${section}` : 'settings';
      await apiClient.delete(endpoint);
      return true;
    } catch (error) {
      console.error('Error resetting settings:', error);
      return false;
    }
  },
  
  /**
   * Export all settings
   * @returns {Promise<Object>} Exported settings
   */
  async exportSettings() {
    try {
      const response = await apiClient.get('settings/export');
      return response.data || {};
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw error;
    }
  },
  
  /**
   * Import settings
   * @param {Object} settings - Settings to import
   * @returns {Promise<Object>} Import result
   */
  async importSettings(settings) {
    try {
      const response = await apiClient.post('settings/import', { settings });
      return response.data || { success: true };
    } catch (error) {
      console.error('Error importing settings:', error);
      throw error;
    }
  },
  
  /**
   * Get settings backup
   * @returns {Promise<Object>} Backup data
   */
  async getBackup() {
    try {
      const response = await apiClient.get('settings/backup');
      return response.data || {};
    } catch (error) {
      console.error('Error fetching settings backup:', error);
      throw error;
    }
  },
};

/**
 * Health API service
 */
export const healthApi = {
  checkHealth: () => apiClient.get('health'),
};

// Export the API client for direct use if needed
export default apiClient;
