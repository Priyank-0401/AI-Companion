// API Base URL from environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Import auth functions
import { getAuthToken } from '../auth/services/authService';

/**
 * Helper function to construct API URLs consistently
 * @param {string} path - The API endpoint path
 * @returns {string} The full URL
 */
export function getApiUrl(path) {
  // Remove any trailing slashes from base URL and leading/trailing slashes from path
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  
  // Always add /api/ unless it's already in the base URL
  if (!cleanBase.includes('/api')) {
    return `${cleanBase}/api/${cleanPath}`;
  }
  return `${cleanBase}/${cleanPath}`;
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
    const timeoutId = setTimeout(() => controller.abort(new Error('Request timeout')), 15000); // 15 second timeout
    
    try {
      // Always get a fresh token from Firebase
      let token;
      try {
        token = await getAuthToken();
        console.log('Using token for request to', endpoint);
      } catch (error) {
        console.error('Failed to get auth token:', error);
        throw new Error('Authentication required');
      }

      // Ensure headers exist
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };

      // Make the fetch request
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
        credentials: 'include' // Important for cookies if using them
      });

      clearTimeout(timeoutId); // Clear the timeout

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || 'API request failed');
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      return response;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      // Don't throw here, let the request proceed without token
      // The server will return 401 if auth is required
    }
    
    const headers = new Headers(options.headers || {});
    
    // Set default headers if not already set
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    // Include authorization header if token exists
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    // Log the request for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('API Request:', {
        url,
        method: options.method || 'GET',
        headers: Object.fromEntries(headers.entries())
      });
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Important for sending/receiving cookies
        signal: controller.signal
      });
      
      console.log('Received response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }
      
      // Clear the timeout since the request completed successfully
      try {
        return await response.json();
      } catch (error) {
        // If response is not JSON, return as text
        return response.text();
      }
    } catch (error) {
      // Clear the timeout in case of error
      clearTimeout(timeoutId);
      console.error(`API request failed: ${error}`);
      throw error;
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
      const response = await apiClient.post('chat/messages', {
        message,
        model,
        style,
        conversationId
      });
      return response.data;
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
      const response = await apiClient.get('chat/models');
      return response.data || [];
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
      const response = await apiClient.get('conversations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data || [];
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
      const response = await apiClient.get(`conversations/${conversationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data || null;
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
      await apiClient.delete(`conversations/${conversationId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting conversation ${conversationId}:`, error);
      return false;
    }
  },

  /**
   * Save or update a conversation
   * @param {Object} conversation - The conversation object to save
   * @returns {Promise<Object>} The saved conversation
   */
  async saveConversation(conversation) {
    const isNew = !conversation.id;
    const url = isNew 
      ? 'conversations'
      : `conversations/${conversation.id}`;
      
    try {
      const response = await apiClient.request(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversation),
      });
      return response.data || null;
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
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
