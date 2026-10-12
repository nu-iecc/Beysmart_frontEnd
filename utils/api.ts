import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import { BASE_URL } from '../constants/api';

// Create axios instance with default config

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true, // Important for session cookies
});

// Function to get CSRF token from backend
const getCSRFToken = async () => {
  try {
    const response = await axios.get(`${BASE_URL}auth/csrf-token/`, {
      withCredentials: true,
    });
    return response.data.csrfToken;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    return null;
  }
};

// Request interceptor to add CSRF token and auth headers
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get CSRF token from AsyncStorage or fetch new one
      let csrfToken = await AsyncStorage.getItem('csrftoken');
      
      if (!csrfToken) {
        csrfToken = await getCSRFToken();
        if (csrfToken) {
          await AsyncStorage.setItem('csrftoken', csrfToken);
        }
      }

      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }

      // Add content type for POST/PUT requests (but not for FormData)
      if (config.method === 'post' || config.method === 'put') {
        // Don't set Content-Type for FormData - let the browser set it with boundary
        if (!(config.data instanceof FormData)) {
          config.headers['Content-Type'] = 'application/json';
        }
      }

      // Add referer header for CSRF protection
      if (Platform.OS !== 'web') config.headers['Referer'] = BASE_URL;
    } catch (error) {
      console.error('Error setting up request headers:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle CSRF token updates
apiClient.interceptors.response.use(
  (response) => {
    // Extract and store CSRF token from response headers
    const csrfToken = response.headers['x-csrftoken'] || response.headers['X-CSRFToken'];
    if (csrfToken) {
      AsyncStorage.setItem('csrftoken', csrfToken);
    }

    return response;
  },
  async (error) => {
    // If 403 error, try to refresh CSRF token and retry
    if (error.response?.status === 403 && error.config && !error.config._retry) {
      error.config._retry = true;
      
      try {
        // Get fresh CSRF token
        const newCsrfToken = await getCSRFToken();
        if (newCsrfToken) {
          await AsyncStorage.setItem('csrftoken', newCsrfToken);
          error.config.headers['X-CSRFToken'] = newCsrfToken;
          
          // Retry the request
          return apiClient.request(error.config);
        }
      } catch (retryError) {
        console.error('Error retrying request with new CSRF token:', retryError);
      }
    }
    
    return Promise.reject(error);
  }
);

export function apiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } } | null)?.response?.data;
  if (data && typeof data === 'object') {
    const fields = data as Record<string, unknown>;
    for (const key of ['error', 'detail', 'message']) {
      if (typeof fields[key] === 'string') return fields[key];
    }
    const messages = Object.entries(data).flatMap(([field, value]) => {
      const details = Array.isArray(value) ? value.filter(item => typeof item === 'string') : typeof value === 'string' ? [value] : [];
      return details.map(detail => `${field.replace(/_/g, ' ')}: ${detail}`);
    });
    if (messages.length) return messages.join('\n');
  }
  return fallback;
}

export default apiClient;
