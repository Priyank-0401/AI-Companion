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
  
  // Check if this is a chat endpoint
  const isChatEndpoint = cleanPath.startsWith('conversations') || 
                        cleanPath.startsWith('models') ||
                        cleanPath.startsWith('chat/');
  
  let finalUrl;
  
  // For development with default localhost URL
  if (cleanBase.endsWith('3001')) {
    if (isChatEndpoint) {
      finalUrl = `${cleanBase}/api/chat/${cleanPath}`;
    } else {
      finalUrl = `${cleanBase}/api/${cleanPath}`;
    }
  } else {
    // For production or custom base URLs
    if (isChatEndpoint) {
      finalUrl = `${cleanBase}/chat/${cleanPath}`;
    } else {
      finalUrl = `${cleanBase}/${cleanPath}`;
    }
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
    const url = getApiUrl(endpoint);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error('Request timeout')), 15000);
    
    console.log(`[API] ${options.method || 'GET'} ${endpoint}`, { options });
    
    try {
      // Get auth token from Firebase Auth
      let token = null;
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        try {
          // Force token refresh to ensure it's valid
          token = await currentUser.getIdToken(true);
          console.log('Auth token retrieved successfully');
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
      const headers = new Headers(options.headers || {});
      headers.set('Content-Type', 'application/json');
      
      if (token) {
        console.log('Adding Authorization header with token');
        headers.set('Authorization', `Bearer ${token}`);
      } else {
        console.warn('No auth token available for request');
      }

      // Log minimal request details in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] ${options.method || 'GET'} ${url}`);
      }

      // Make the fetch request
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
        credentials: 'include'
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            errorData
          });
        } catch (e) {
          errorData = { 
            status: response.status,
            message: response.statusText || 'An unknown error occurred',
            isAuthError: response.status === 401
          };
        }
        
        const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        error.isAuthError = response.status === 401 || errorData.isAuthError;
        
        // If this is an auth error, clear any stored auth data
        if (error.isAuthError && typeof window !== 'undefined') {
          console.log('Authentication error detected, clearing local storage');
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
        }
        
        throw error;
      }

      // Parse and return the response
      try {
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
          console.log(`[API] ${options.method || 'GET'} ${endpoint} response:`, data);
          return data;
        }
        
        data = await response.text();
        console.log(`[API] ${options.method || 'GET'} ${endpoint} response (text):`, data);
        return data;
      } catch (error) {
        console.error('[API] Error parsing response:', error);
        throw new Error(`Failed to parse response: ${error.message}`);
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
      const response = await this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      });
      return response;
    } catch (error) {
      console.error('POST request failed:', error);
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
   * @param {string} params.message - The message text
   * @param {string} [params.model='llama3'] - The model to use
   * @param {string} [params.style='supportive'] - The conversation style
   * @param {string} [params.conversationId] - Optional conversation ID for continuing
   * @returns {Promise<Object>} The AI response
   */
  async sendMessage({ message, model = 'llama3', style = 'supportive', conversationId }) {
    try {
      return await apiClient.post('chat/messages', {
        message,
        model,
        style,
        conversationId
      });
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
      const requestData = isNew 
        ? {
            title: conversation.title || 'New Chat',
            model: conversation.model || 'llama3:latest',
            style: conversation.style || 'supportive'
          }
        : conversation;
      
      console.log('Sending conversation data:', requestData);
      
      const response = await apiClient[isNew ? 'post' : 'put'](url, requestData);
      
      console.log('Save conversation response:', response);
      
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
