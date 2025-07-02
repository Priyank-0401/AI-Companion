import { auth } from '../config/firebase';
import { getAuthToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.example.com/api';

/**
 * Get all conversations for the current user
 * @param {Object} options - Options for the request
 * @param {number} options.limit - Maximum number of conversations to return
 * @returns {Promise<Array>} - Array of conversations
 */
export const getConversations = async ({ limit } = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      console.warn('No auth token available');
      return [];
    }

    const url = new URL(`${API_BASE_URL}/conversations`);
    if (limit) {
      url.searchParams.append('limit', limit);
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch conversations');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in getConversations:', error);
    throw error;
  }
};

/**
 * Get a single conversation by ID
 * @param {string} conversationId - ID of the conversation to fetch
 * @returns {Promise<Object>} - The conversation object with messages
 */
export const getConversation = async (conversationId) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      console.warn('No auth token available');
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch conversation');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in getConversation:', error);
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
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include',
    body: JSON.stringify(conversationData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create conversation');
  }
  
  return response.json();
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
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include',
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update conversation');
  }
  
  return response.json();
};

/**
 * Delete a conversation
 * @param {string} conversationId - ID of the conversation to delete
 * @returns {Promise<Object>} - Result of the operation
 */
export const deleteConversation = async (conversationId) => {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete conversation');
  }
  
  return response.json();
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
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include',
    body: JSON.stringify(messageData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add message');
  }
  
  return response.json();
};

/**
 * Get messages from a conversation
 * @param {string} conversationId - ID of the conversation
 * @param {Object} options - Options for the request
 * @param {number} options.limit - Maximum number of messages to return
 * @returns {Promise<Array>} - Array of messages
 */
export const getMessages = async (conversationId, { limit } = {}) => {
  const token = await getAuthToken();
  const url = new URL(`${API_BASE_URL}/conversations/${conversationId}/messages`);
  
  if (limit) {
    url.searchParams.append('limit', limit);
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch messages');
  }
  
  return response.json();
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
