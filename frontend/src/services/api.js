// API Base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Base API class for making HTTP requests
 */
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Make a request to the API
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const searchParams = new URLSearchParams(params);
    const queryString = searchParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create a shared API client instance
const apiClient = new ApiClient();

/**
 * Chat API service
 */
export const chatApi = {
  sendMessage: (message, conversationId, style = 'supportive') =>
    apiClient.post('/chat/send', { message, conversationId, style }),
  
  getConversations: () =>
    apiClient.get('/chat/conversations'),
  
  getConversation: (id) =>
    apiClient.get(`/chat/conversation/${id}`),
  
  deleteConversation: (id) =>
    apiClient.delete(`/chat/conversation/${id}`),
  
  exportConversation: (conversationId, format = 'json') =>
    apiClient.post('/chat/export', { conversationId, format }),
  
  getModels: () =>
    apiClient.get('/chat/models'),
};

/**
 * Wellness API service
 */
export const wellnessApi = {
  getStats: () =>
    apiClient.get('/wellness/stats'),
  
  logMood: (mood, energy, notes) =>
    apiClient.post('/wellness/mood', { mood, energy, notes }),
  
  getMoods: () =>
    apiClient.get('/wellness/moods'),
  
  completeBreathingSession: (duration = 5) =>
    apiClient.post('/wellness/breathing/complete', { duration }),
  
  updateWeeklyGoal: (weeklyGoal) =>
    apiClient.put('/wellness/goal', { weeklyGoal }),
  
  getInsights: () =>
    apiClient.get('/wellness/insights'),
};

/**
 * Journal API service
 */
export const journalApi = {
  getEntries: (params = {}) =>
    apiClient.get('/journal/entries', params),
  
  createEntry: (title, content, mood, tags) =>
    apiClient.post('/journal/entries', { title, content, mood, tags }),
  
  getEntry: (id) =>
    apiClient.get(`/journal/entries/${id}`),
  
  updateEntry: (id, data) =>
    apiClient.put(`/journal/entries/${id}`, data),
  
  deleteEntry: (id) =>
    apiClient.delete(`/journal/entries/${id}`),
  
  getStats: () =>
    apiClient.get('/journal/stats'),
  
  getTags: () =>
    apiClient.get('/journal/tags'),
  
  exportEntries: (format = 'json', startDate, endDate) =>
    apiClient.post('/journal/export', { format, startDate, endDate }),
};

/**
 * Settings API service
 */
export const settingsApi = {
  getSettings: () =>
    apiClient.get('/settings'),
  
  getSection: (section) =>
    apiClient.get(`/settings/${section}`),
  
  updateSection: (section, data) =>
    apiClient.put(`/settings/${section}`, data),
  
  resetSettings: (section = null) =>
    apiClient.post('/settings/reset', { section }),
  
  exportSettings: () =>
    apiClient.post('/settings/export'),
  
  importSettings: (settings) =>
    apiClient.post('/settings/import', { settings }),
  
  getBackup: () =>
    apiClient.get('/settings/backup'),
};

/**
 * Health API service
 */
export const healthApi = {
  checkHealth: () =>
    apiClient.get('/health'),
};

// Export the API client for direct use if needed
export default apiClient;
