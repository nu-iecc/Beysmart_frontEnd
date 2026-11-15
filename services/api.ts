import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { router } from 'expo-router';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for Django sessions - includes cookies
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

// Request interceptor for Django sessions
apiClient.interceptors.request.use(
  (config) => {
    // Django sessions are handled automatically via cookies
    // No need to manually add tokens
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    // Handle common error cases
    if (error.response) {
      // Server responded with error status
      const { status } = error.response;
      const errorMessage = error.response?.data?.detail || '';

      console.log(`🔒 API Error: ${status} - ${errorMessage}`);

      switch (status) {
        case 401:
          // Unauthorized - session expired or not logged in
          console.log('🔒 Got 401 - redirecting to login');
          await handleSessionExpired();
          break;
        case 403:
          // Forbidden - likely session expired or auth issue
          console.log('🔒 Got 403 - treating as session expired');
          await handleSessionExpired();
          break;
        case 404:
          // Not found - no special handling needed
          break;
        case 500:
          // Server error - no special handling needed
          break;
        default:
          break;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;