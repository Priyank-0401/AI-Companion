import { auth } from '../config/firebase';
import { getAuthToken } from './authService';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api`;

// Helper function to handle API requests
const fetchWithAuth = async (url, options = {}) => {
  try {
    console.log('Fetching auth token...');
    const token = await getAuthToken();
    
    if (!token) {
      console.error('No authentication token available');
      throw new Error('Authentication required. Please sign in again.');
    }

    console.log('Making authenticated request to:', url);
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = 'Request failed';
      let errorData = null;
      
      try {
        errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return response;
  } catch (error) {
    console.error('Error in fetchWithAuth:', {
      message: error.message,
      url,
      status: error.status,
      data: error.data
    });
    
    // If it's an auth error, redirect to login
    if (error.status === 401 || error.message.includes('No user is currently signed in')) {
      // Store the current URL to redirect back after login
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      // Redirect to login page
      window.location.href = '/login';
    }
    
    throw error;
  }
};

/**
 * Get all conversations for the current user
 * @param {Object} options - Options for the request
 * @param {number} options.limit - Maximum number of conversations to return
 * @returns {Promise<Array>} - Array of conversations
 */
export const getConversations = async ({ limit } = {}) => {
  try {
    const url = new URL(`${API_BASE_URL}/conversations`);
    if (limit) {
      url.searchParams.append('limit', limit);
    }
    
    const response = await fetchWithAuth(url.toString());
    return await response.json();
  } catch (error) {
    console.error('Error in getConversations:', error);
    if (error.status === 401) {
      // Handle unauthorized (e.g., redirect to login)
      window.location.href = '/login';
    }
    throw error;
  }
};

/**
 * Get a single conversation by ID
 * @param {string} conversationId - ID of the conversation to fetch
 * @returns {Promise<Object>} - The conversation object with messages
 */
export const getConversation = async (conversationId) => {
  if (!conversationId) {
    throw new Error('Conversation ID is required');
  }

  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/conversations/${conversationId}`);
    return await response.json();
  } catch (error) {
    console.error(`Error in getConversation (ID: ${conversationId}):`, error);
    if (error.status === 404) {
      throw new Error('Conversation not found');
    }
    throw error;
  }
};

/**
 * Create a new conversation
 * @param {Object} conversationData - Data for the new conversation
 * @param {string} conversationData.title - Title of the conversation
 * @param {string} [conversationData.model] - Model to use for the conversation
 * @param {Array<string>} [conversationData.tags] - Tags for the conversation
 * @returns {Promise<Object>} - The created conversation
 */
export const createConversation = async (conversationData) => {
  console.log('Sending conversation data to API:', conversationData);
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conversationData),
      credentials: 'include',
    });

    console.log('Received response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response from server:', errorData);
      const error = new Error(errorData.message || 'Failed to create conversation');
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    const data = await response.json();
    console.log('Successfully created conversation:', data);
    return data;
    
  } catch (error) {
    console.error('Error in createConversation API call:', {
      message: error.message,
      status: error.status,
      data: error.data,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Update a conversation
 * @param {string} conversationId - ID of the conversation to update
 * @param {Object} updates - Fields to update
 * @param {string} [updates.title] - New title for the conversation
 * @param {Array<string>} [updates.tags] - New tags for the conversation
 * @param {boolean} [updates.isArchived] - Whether the conversation is archived
 * @returns {Promise<Object>} - The updated conversation
 */
export const updateConversation = async (conversationId, updates) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    return await response.json();
  } catch (error) {
    console.error('Error in updateConversation:', error);
    throw error;
  }
};

/**
 * Delete a conversation
 * @param {string} conversationId - ID of the conversation to delete
 * @returns {Promise<Object>} - Result of the operation
 */
export const deleteConversation = async (conversationId) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/conversations/${conversationId}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error('Error in deleteConversation:', error);
    throw error;
  }
};

/**
 * Add a message to a conversation
 * @param {string} conversationId - ID of the conversation
 * @param {Object} messageData - The message data
 * @param {string} messageData.role - Role of the message sender ('user' or 'assistant')
 * @param {string} messageData.content - Content of the message
 * @param {string} [messageData.model] - Model used to generate the message
 * @returns {Promise<Object>} - The created message
 */
export const addMessage = async (conversationId, messageData) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error in addMessage:', error);
    throw error;
  }
};

/**
 * Get messages from a conversation
 * @param {string} conversationId - ID of the conversation
 * @param {Object} options - Options for the request
 * @param {number} options.limit - Maximum number of messages to return
 * @returns {Promise<Array>} - Array of messages
 */
export const getMessages = async (conversationId, { limit } = {}) => {
  try {
    const url = new URL(`${API_BASE_URL}/conversations/${conversationId}/messages`);
    if (limit) {
      url.searchParams.append('limit', limit);
    }
    
    const response = await fetchWithAuth(url.toString());
    return await response.json();
  } catch (error) {
    console.error('Error in getMessages:', error);
    throw error;
  }
};

/**
 * Subscribe to conversation updates
 * @param {string} conversationId - ID of the conversation to subscribe to
 * @param {Function} callback - Function to call when updates are received
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToConversation = (conversationId, callback) => {
  const token = auth.currentUser?.accessToken;
  if (!token) {
    throw new Error('User not authenticated');
  }
  
  const eventSource = new EventSource(
    `${API_BASE_URL}/conversations/${conversationId}/stream?token=${encodeURIComponent(token)}`,
    { withCredentials: true }
  );
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      callback(null, data);
    } catch (error) {
      console.error('Error parsing SSE data:', error);
      callback(error);
    }
  };
  
  eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    callback(error || new Error('Error in conversation stream'));
    eventSource.close();
  };
  
  // Return cleanup function
  return () => {
    eventSource.close();
  };
};
