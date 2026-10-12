import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/utils/api';

export interface LoginRequest { email: string; password: string }
export interface PhoneLoginRequest { phone_number: string }
export interface VerifyOtpRequest { phone_number: string; otp: string }

export interface AuthUser {
  id: string | number;
  email?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string | null;
  email_verified?: boolean;
  is_verified?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: AuthUser;
  error?: string;
  email_verification_required?: boolean;
}

type BackendAuthResponse = Omit<AuthResponse, 'success'> & {
  success?: boolean;
  csrf_token?: string;
};

async function cacheSession(data: BackendAuthResponse): Promise<void> {
  // Cookies authenticate requests; storage only caches profile and CSRF data.
  try {
    if (data.user) await AsyncStorage.setItem('userData', JSON.stringify(data.user));
    if (data.csrf_token) await AsyncStorage.setItem('csrftoken', data.csrf_token);
  } catch {
    console.warn('Unable to cache session data.');
  }
}

async function authenticateRequest(path: string, payload: object, requireUser: boolean): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<BackendAuthResponse>(path, payload);
    const data = response.data;
    const success = !data.error && (data.success === true ||
      (data.success === undefined && response.status === 200 && (!requireUser || !!data.user)));
    if (success && data.user) await cacheSession(data);
    return { ...data, success };
  } catch (error: unknown) {
    const data = (error as { response?: { data?: BackendAuthResponse } }).response?.data;
    if (data && typeof data === 'object') return { ...data, success: false };
    throw error;
  }
}

export const authAPI = {
  login: (credentials: LoginRequest): Promise<AuthResponse> =>
    authenticateRequest('auth/login/', credentials, true),
  phoneLogin: (data: PhoneLoginRequest): Promise<AuthResponse> =>
    authenticateRequest('auth/phone-login/', data, false),
  verifyOtp: (data: VerifyOtpRequest): Promise<AuthResponse> =>
    authenticateRequest('auth/verify-otp/', data, true),

  logout: async (): Promise<void> => {
    // Keep the local session if the server fails to log out.
    await apiClient.post('auth/logout/');
    await AsyncStorage.multiRemove(['userData', 'csrftoken', 'isAuthenticated', 'loginMethod']);
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      await apiClient.get('auth/profile/');
      return true;
    } catch {
      return false;
    }
  },

  getCurrentUser: async (): Promise<AuthUser> => {
    const { data } = await apiClient.get<AuthUser>('auth/profile/');
    return data;
  },
};

export default authAPI;
