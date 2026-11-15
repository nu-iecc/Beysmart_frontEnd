import { API_ENDPOINTS } from '@/constants/api';
import { SUCCESS_MESSAGES } from '@/constants/errors';
import apiClient from './api';

// Types for authentication
export interface LoginRequest {
  email: string;
  password: string;
}

export interface PhoneLoginRequest {
  phone_number: string;
}

export interface VerifyOtpRequest {
  phone_number: string;
  otp: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email?: string;
    phone_number?: string;
    is_verified: boolean;
    first_name?: string;
    last_name?: string;
    profile_picture?: string | null;
    user_type?: string;
    is_approved?: boolean;
    email_verified?: boolean;
  };
  error?: string;
  email_verification_required?: boolean;
  csrf_token?: string;
}

// Helper function to store user data (optional for caching)
const storeUserData = async (user: any) => {
  // Optional: Store user data locally for caching
  // This is not required for Django sessions but can be useful
  try {
    // You can use AsyncStorage here if you want to cache user data
    // For now, we'll just keep it simple
  } catch (error) {
    // Handle error silently
  }
};

// Authentication API functions
export const authAPI = {
  // Email login
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, credentials);
      const authResponse = response.data;
      
      // Django session is automatically created and managed
      // Optional: Store user data for caching
      if (authResponse.success && authResponse.user) {
        await storeUserData(authResponse.user);
      }
      
      return authResponse;
    } catch (error: any) {
      // Handle axios error and return consistent format
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  // Phone login (send OTP)
  phoneLogin: async (phoneData: PhoneLoginRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.PHONE_LOGIN, phoneData);
      
      // Handle different response formats from Django
      const data = response.data;
      
      // If Django returns a simple success response without 'success' field
      if (response.status === 200 && !data.hasOwnProperty('success')) {
        return {
          success: true,
          message: data.message || SUCCESS_MESSAGES.OTP_SENT,
          user: data.user || undefined
        };
      }
      
      return data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  // Verify OTP
  verifyOtp: async (otpData: VerifyOtpRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.VERIFY_OTP, otpData);
      
      // Handle different response formats from Django
      const data = response.data;
      
      // If Django returns a simple success response without 'success' field
      if (response.status === 200 && !data.hasOwnProperty('success')) {
        const authResponse: AuthResponse = {
          success: true,
          message: data.message || SUCCESS_MESSAGES.OTP_VERIFIED,
          user: data.user || undefined,
          csrf_token: data.csrf_token || undefined,
        };
        
        // Django session is automatically created and managed
        // Optional: Store user data for caching
        if (authResponse.user) {
          await storeUserData(authResponse.user);
        }
        
        return authResponse;
      }
      
      // Django session is automatically created and managed
      // Optional: Store user data for caching
      if (data.success && data.user) {
        await storeUserData(data.user);
      }
      
      return data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      // Call Django logout endpoint to clear session
      await apiClient.post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, the session will expire
    }
  },

  // Check if user is authenticated by making a request to a protected endpoint
  isAuthenticated: async (): Promise<boolean> => {
    try {
      // Make a request to a protected endpoint to check session
      const response = await apiClient.get(API_ENDPOINTS.USER_PROFILE);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },

  // Get current user data
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER_PROFILE);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default authAPI;