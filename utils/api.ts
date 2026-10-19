import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import { BASE_URL } from '../constants/api';
import { biometricsService } from '../services/biometrics';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // Default 10 seconds for regular requests
  withCredentials: true, // Important for session cookies
  headers: {
    'Accept': 'application/json',
  },
});

// Flag to prevent multiple redirects
let isRedirecting = false;

// Function to handle session expiry and redirect to login
const handleSessionExpired = async () => {
  // Prevent multiple simultaneous redirects
  if (isRedirecting) return;
  isRedirecting = true;

  console.log('🔒 Session expired, clearing data and redirecting to login...');

  try {
    // Clear all auth-related data from AsyncStorage
    await AsyncStorage.multiRemove([
      'userData',
      'csrftoken',
      'isAuthenticated',
      'loginMethod',
    ]);
    
    // Reset biometric attempts so user can try biometrics again after re-login
    await biometricsService.resetBiometricAttempts();

    // Use setTimeout to ensure we're in the right context for navigation
    // This is needed because axios interceptors run outside React's context
    setTimeout(() => {
      try {
        console.log('🔒 Attempting redirect to welcome screen...');
        // Navigate to the auth welcome screen explicitly
        router.replace('/(auth)/welcome');
      } catch (navError) {
        console.error('Navigation error, trying alternative:', navError);
        // Fallback: try different routes
        try {
          router.replace('/');
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
    }, 100);
  } catch (error) {
    console.error('Error during logout redirect:', error);
  } finally {
    // Reset flag after a delay to allow for new login attempts
    setTimeout(() => {
      isRedirecting = false;
    }, 2000);
  }
};

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
      // Increase timeout for file uploads (photo uploads)
      if (config.data instanceof FormData || config.url?.includes('upload_photo')) {
        config.timeout = 30000; // 30 seconds for file uploads
        console.log('📦 File upload detected, timeout increased to 30s');
      }

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

      // Handle FormData uploads specially for React Native
      if (config.data instanceof FormData) {
        console.log('📋 FormData detected, setting multipart/form-data explicitly');
        // For React Native, explicitly set multipart/form-data
        // Don't include boundary - let the native layer add it
        config.headers['Content-Type'] = 'multipart/form-data';
        // Disable axios default transform to prevent data mutation
        config.transformRequest = [(data) => data];
        console.log('✅ Set Content-Type to multipart/form-data and disabled transform');
      } else if (config.method === 'post' || config.method === 'put' || config.method === 'patch') {
        // For regular JSON requests
        config.headers['Content-Type'] = 'application/json';
      }

      // Add referer header for CSRF protection
      config.headers['Referer'] = BASE_URL;
      
      // Log final headers for debugging
      if (config.data instanceof FormData) {
        console.log('📋 Final headers before request:', JSON.stringify(config.headers, null, 2));
        console.log('📋 Request URL:', (config.baseURL || '') + config.url);
      }
    } catch (error) {
      console.error('Error setting up request headers:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle CSRF token updates and auth errors
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
    const status = error.response?.status;
    const errorMessage = error.response?.data?.detail || '';

    // Handle 401 Unauthorized - session expired
    if (status === 401) {
      console.log('🔒 Got 401 - session expired');
      await handleSessionExpired();
      return Promise.reject(error);
    }

    // Handle 403 Forbidden
    if (status === 403) {
      console.log('🔒 Got 403 - checking if auth issue. Message:', errorMessage);
      
      // First attempt: try to refresh CSRF token and retry
      if (error.config && !error.config._retry) {
        error.config._retry = true;
        
        try {
          const newCsrfToken = await getCSRFToken();
          if (newCsrfToken) {
            await AsyncStorage.setItem('csrftoken', newCsrfToken);
            error.config.headers['X-CSRFToken'] = newCsrfToken;
            
            // Retry the request - if this fails, it will come back here with _retry = true
            return apiClient.request(error.config);
          }
        } catch (retryError) {
          console.error('Error retrying request with new CSRF token:', retryError);
        }
      }

      // If we get here, either:
      // 1. This is a retried request that still failed (CSRF wasn't the issue)
      // 2. CSRF refresh itself failed
      // In both cases, treat as session expiry
      console.log('🔒 403 after CSRF retry - treating as session expired');
      await handleSessionExpired();
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
