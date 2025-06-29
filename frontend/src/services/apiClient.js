import { getAuth } from 'firebase/auth';
import { isProduction, getSecurityHeaders } from '../utils/envUtils';

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.auth = getAuth();
    this.interceptors = {
      request: [],
      response: [],
    };
  }

  // Add request interceptor
  addRequestInterceptor(onFulfilled, onRejected) {
    this.interceptors.request.push({ onFulfilled, onRejected });
    return () => {
      this.interceptors.request = this.interceptors.request.filter(
        (i) => i.onFulfilled !== onFulfilled
      );
    };
  }

  // Add response interceptor
  addResponseInterceptor(onFulfilled, onRejected) {
    this.interceptors.response.push({ onFulfilled, onRejected });
    return () => {
      this.interceptors.response = this.interceptors.response.filter(
        (i) => i.onFulfilled !== onFulfilled
      );
    };
  }

  async getAuthToken() {
    const user = this.auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }

  async executeRequest(endpoint, options = {}) {
    const token = await this.getAuthToken();
    const securityHeaders = getSecurityHeaders();

    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...securityHeaders,
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    // Merge headers
    const headers = {
      ...defaultHeaders,
      ...options.headers,
    };

    // Prepare request config
    const config = {
      ...options,
      headers,
      credentials: isProduction ? 'same-origin' : 'include',
    };

    // Execute request interceptors
    const request = { url: `${this.baseURL}${endpoint}`, ...config };
    const interceptedRequest = await this.executeRequestInterceptors(request);

    // Make the request
    const response = await fetch(interceptedRequest.url, interceptedRequest);
    
    // Handle auth errors
    if (response.status === 401 || response.status === 403) {
      // You might want to trigger a token refresh or logout here
      console.error('Authentication error:', response.status);
      throw new Error('Authentication required');
    }

    // Execute response interceptors
    return this.executeResponseInterceptors(response);
  }

  async executeRequestInterceptors(config) {
    let currentConfig = { ...config };
    for (const interceptor of this.interceptors.request) {
      try {
        currentConfig = await interceptor.onFulfilled(currentConfig) || currentConfig;
      } catch (error) {
        interceptor.onRejected?.(error);
        throw error;
      }
    }
    return currentConfig;
  }

  async executeResponseInterceptors(response) {
    let currentResponse = response;
    for (const interceptor of this.interceptors.response) {
      try {
        currentResponse = await interceptor.onFulfilled(currentResponse) || currentResponse;
      } catch (error) {
        interceptor.onRejected?.(error);
        throw error;
      }
    }
    return currentResponse;
  }

  // HTTP Methods
  async get(endpoint, options = {}) {
    return this.executeRequest(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.executeRequest(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.executeRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    return this.executeRequest(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create a singleton instance
export const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000');

export default apiClient;
