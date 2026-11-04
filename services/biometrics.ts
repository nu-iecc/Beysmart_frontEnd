import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as LocalAuthentication from 'expo-local-authentication';
import { BASE_URL } from '../constants/api';
import apiClient from '../utils/api';

// Storage keys for biometric settings
const BIOMETRICS_ENABLED_KEY = 'biometricsEnabled';
const FIRST_LOGIN_COMPLETED_KEY = 'firstLoginCompleted';
const USER_PHONE_KEY = 'biometricUserPhone';
const BIOMETRIC_TOKEN_KEY = 'biometricToken'; // Secure token for biometric login
const BIOMETRIC_ATTEMPTS_KEY = 'biometricAttempts'; // Track failed biometric attempts
const BIOMETRIC_USERS_KEY = 'biometric_users'; // List of users with saved biometrics

// Maximum number of biometric attempts before falling back to OTP
export const MAX_BIOMETRIC_ATTEMPTS = 3;

/**
 * PHASE 1: Create user-scoped key helper
 * Appends userId to base key to make biometric data user-specific instead of device-specific
 */
const getKey = (base: string, userId: string | number): string => `${base}_${userId}`;

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  cancelled?: boolean;
}

export interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

export interface BiometricLoginResult {
  success: boolean;
  error?: string;
  user?: any;
  csrfToken?: string;
  tokenInvalid?: boolean;
  attemptsRemaining?: number;
  shouldFallbackToOTP?: boolean;
}

export interface BiometricUser {
  userId: string | number;
  phone: string;
}

/**
 * Biometric Authentication Service
 * Handles all biometric authentication operations and preferences
 */
export const biometricsService = {
  /**
   * Check if the device has biometric hardware
   */
  hasHardware: async (): Promise<boolean> => {
    try {
      return await LocalAuthentication.hasHardwareAsync();
    } catch (error) {
      console.error('Error checking biometric hardware:', error);
      return false;
    }
  },

  /**
   * Check if the user has enrolled biometrics on their device
   */
  isEnrolled: async (): Promise<boolean> => {
    try {
      return await LocalAuthentication.isEnrolledAsync();
    } catch (error) {
      console.error('Error checking biometric enrollment:', error);
      return false;
    }
  },

  /**
   * Get supported authentication types (fingerprint, biometric, etc.)
   */
  getSupportedTypes: async (): Promise<LocalAuthentication.AuthenticationType[]> => {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error('Error getting supported auth types:', error);
      return [];
    }
  },

  /**
   * Get full biometric capabilities of the device
   */
  getCapabilities: async (): Promise<BiometricCapabilities> => {
    const [hasHardware, isEnrolled, supportedTypes] = await Promise.all([
      biometricsService.hasHardware(),
      biometricsService.isEnrolled(),
      biometricsService.getSupportedTypes(),
    ]);

    return { hasHardware, isEnrolled, supportedTypes };
  },

  /**
   * Perform biometric authentication (device-level only)
   */
  authenticate: async (
    promptMessage: string = 'Authenticate to continue'
  ): Promise<BiometricAuthResult> => {
    try {
      const hasHardware = await biometricsService.hasHardware();
      if (!hasHardware) {
        return { 
          success: false, 
          error: 'Biometric authentication is not available on this device' 
        };
      }

      const isEnrolled = await biometricsService.isEnrolled();
      if (!isEnrolled) {
        return { 
          success: false, 
          error: 'No biometric credentials are enrolled on this device' 
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: '',
        cancelLabel: 'Cancel',
        disableDeviceFallback: true,
      });

      if (result.success) {
        return { success: true };
      }

      if (result.error === 'user_cancel') {
        return { success: false, cancelled: true };
      }

      return { 
        success: false, 
        error: result.error || 'Authentication failed' 
      };
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      return { 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      };
    }
  },

  /**
   * Check if biometrics are enabled for app login
   * PHASE 6: Now checks user-specific biometrics
   */
  isBiometricsEnabled: async (userId?: string | number): Promise<boolean> => {
    try {
      let enabledKey: string;
      let tokenKey: string;

      if (userId) {
        enabledKey = getKey(BIOMETRICS_ENABLED_KEY, userId);
        tokenKey = getKey(BIOMETRIC_TOKEN_KEY, userId);
      } else {
        const userKey = await biometricsService._getCurrentUserKey();
        if (!userKey) {
          return false;
        }
        enabledKey = getKey(BIOMETRICS_ENABLED_KEY, userKey);
        tokenKey = getKey(BIOMETRIC_TOKEN_KEY, userKey);
      }

      const enabled = await AsyncStorage.getItem(enabledKey);
      const token = await AsyncStorage.getItem(tokenKey);
      return enabled === 'true' && !!token;
    } catch (error) {
      console.error('Error checking biometrics enabled status:', error);
      return false;
    }
  },

  /**
   * Enable biometrics for app login - calls backend to generate token
   * Should be called when user is authenticated (after OTP login)
   * PHASE 2-4: Now stores biometrics per user, not per device
   */
  enableBiometrics: async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.post('auth/biometric/enable/', {});
      console.log('Enable biometrics response:', response.data);

      const token = response.data.biometric_token;
      if (response.data.success && typeof token === 'string' && token.length > 10) {
        const userKey = await biometricsService._getCurrentUserKey();
        if (!userKey) {
          return { success: false, error: 'User not authenticated' };
        }

        const userData = await AsyncStorage.getItem('userData');
        if (!userData) {
          return { success: false, error: 'User data not found' };
        }
        const user = JSON.parse(userData);

        await AsyncStorage.setItem(getKey(BIOMETRICS_ENABLED_KEY, userKey), 'true');
        await AsyncStorage.setItem(getKey(BIOMETRIC_TOKEN_KEY, userKey), token);
        await AsyncStorage.setItem(getKey(USER_PHONE_KEY, userKey), phoneNumber);

        const users = JSON.parse(await AsyncStorage.getItem(BIOMETRIC_USERS_KEY) || '[]') as BiometricUser[];
        const normalizedUserId = String(user.id);
        
        if (!users.find((u) => String(u.userId) === normalizedUserId)) {
          users.push({
            userId: normalizedUserId,
            phone: phoneNumber,
          });
          await AsyncStorage.setItem(BIOMETRIC_USERS_KEY, JSON.stringify(users));
          console.log('Added user to biometric users list:', normalizedUserId);
        }

        return { success: true };
      }

      return { success: false, error: response.data.error || 'Failed to enable biometric login' };
    } catch (error: any) {
      console.error('Error enabling biometrics:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to enable biometric login',
      };
    }
  },

  /**
   * Disable biometrics for app login - calls backend to clear token
   * Updated to use user-scoped keys and removes user from biometric users list
   */
  disableBiometrics: async (userId?: string | number): Promise<boolean> => {
    try {
      try {
        await apiClient.post('auth/biometric/disable/', {});
      } catch (e) {
        console.log('Backend disable failed, clearing local data anyway');
      }

      let userToDisable: string | number | null | undefined = userId;
      if (!userToDisable) {
        userToDisable = await biometricsService._getCurrentUserKey();
        if (!userToDisable) {
          return false;
        }
      }

      await biometricsService.removeBiometricUser(userToDisable);
      
      return true;
    } catch (error) {
      console.error('Error disabling biometrics:', error);
      return false;
    }
  },

  /**
   * Get the stored biometric token
   * PHASE 5: Now reads user-specific token
   */
  getBiometricToken: async (userId?: string | number): Promise<string | null> => {
    try {
      let key: string;
      
      if (userId) {
        key = getKey(BIOMETRIC_TOKEN_KEY, userId);
      } else {
        const userKey = await biometricsService._getCurrentUserKey();
        if (!userKey) {
          return null;
        }
        key = getKey(BIOMETRIC_TOKEN_KEY, userKey);
      }

      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting biometric token:', error);
      return null;
    }
  },

  /**
   * Get the phone number associated with biometric login
   * Updated to use user-scoped keys
   */
  getBiometricUserPhone: async (userId?: string | number): Promise<string | null> => {
    try {
      let key: string;
      if (userId) {
        key = getKey(USER_PHONE_KEY, userId);
      } else {
        const userKey = await biometricsService._getCurrentUserKey();
        if (!userKey) {
          return null;
        }
        key = getKey(USER_PHONE_KEY, userKey);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting biometric user phone:', error);
      return null;
    }
  },

  /**
   * Login using the stored biometric token - creates a new session
   * PHASE 6 & 12: Updated to support per-user biometric tokens
   * Can now accept userId to login as a specific user from the biometric users list
   * 
   * ⚠️ SECURITY: Only send token to backend, not user_id
   * Token alone identifies the user. Backend gets user from token verification.
   */
  loginWithBiometricToken: async (userId?: string | number): Promise<BiometricLoginResult> => {
    try {
      let token: string | null;

      if (userId) {
        token = await biometricsService.getBiometricToken(userId);
      } else {
        token = await biometricsService.getBiometricToken();
      }

      if (!token) {
        return {
          success: false,
          error: 'No biometric token found. Please login with OTP first.',
          tokenInvalid: true,
        };
      }

      const response = await axios.post(
        `${BASE_URL}auth/biometric/login/`,
        { biometric_token: token },
        { withCredentials: true }
      );

      if (response.data.success) {
        return {
          success: true,
          user: response.data.user,
          csrfToken: response.data.csrf_token,
        };
      }

      return {
        success: false,
        error: response.data.error || 'Biometric login failed',
      };
    } catch (error: any) {
      console.error('Biometric token login error:', error);

      if (error.response?.status === 401 || error.response?.data?.token_invalid) {
        if (userId) {
          await biometricsService.removeBiometricUser(userId);
          console.log('Removed user from biometric list due to invalid token:', userId);
        } else {
          const userKey = await biometricsService._getCurrentUserKey();
          if (userKey) {
            await biometricsService.removeBiometricUser(userKey);
            console.log('Removed user from biometric list due to invalid token:', userKey);
          }
        }

        return {
          success: false,
          error: 'Biometric login expired. Please login with OTP to re-enable.',
          tokenInvalid: true,
        };
      }

      return {
        success: false,
        error: error.response?.data?.error || 'Biometric login failed',
      };
    }
  },

  /**
   * PHASE 8: Get list of users that have biometric data saved on device
   */
  getBiometricUsers: async (): Promise<BiometricUser[]> => {
    try {
      const users = await AsyncStorage.getItem(BIOMETRIC_USERS_KEY);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error getting biometric users:', error);
      return [];
    }
  },

  /**
   * Remove a user from the biometric users list and clear their biometric data
   */
  removeBiometricUser: async (userId: string | number): Promise<boolean> => {
    try {
      const users = await AsyncStorage.getItem(BIOMETRIC_USERS_KEY);
      if (!users) {
        return true;
      }

      let usersList = JSON.parse(users) as BiometricUser[];
      const normalizedUserId = String(userId);

      usersList = usersList.filter((u) => String(u.userId) !== normalizedUserId);

      await AsyncStorage.setItem(BIOMETRIC_USERS_KEY, JSON.stringify(usersList));

      await AsyncStorage.removeItem(getKey(BIOMETRICS_ENABLED_KEY, userId));
      await AsyncStorage.removeItem(getKey(BIOMETRIC_TOKEN_KEY, userId));
      await AsyncStorage.removeItem(getKey(USER_PHONE_KEY, userId));

      console.log('Removed user from biometric users list:', normalizedUserId);
      return true;
    } catch (error) {
      console.error('Error removing biometric user:', error);
      return false;
    }
  },

  /**
   * Get the current user identifier for user-specific storage keys
   */
  _getCurrentUserKey: async (): Promise<string | null> => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.id) {
          return String(user.id);
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting current user key:', error);
      return null;
    }
  },

  /**
   * Check if this is the user's first login
   */
  isFirstLogin: async (): Promise<boolean> => {
    try {
      const userKey = await biometricsService._getCurrentUserKey();
      if (!userKey) {
        return true;
      }
      const key = `${FIRST_LOGIN_COMPLETED_KEY}_${userKey}`;
      const completed = await AsyncStorage.getItem(key);
      return completed !== 'true';
    } catch (error) {
      console.error('Error checking first login status:', error);
      return true;
    }
  },

  /**
   * Mark the first login as completed for the current user
   */
  markFirstLoginCompleted: async (): Promise<void> => {
    try {
      const userKey = await biometricsService._getCurrentUserKey();
      if (!userKey) {
        console.warn('Cannot mark first login completed: no user key');
        return;
      }
      const key = `${FIRST_LOGIN_COMPLETED_KEY}_${userKey}`;
      await AsyncStorage.setItem(key, 'true');
    } catch (error) {
      console.error('Error marking first login completed:', error);
    }
  },

  /**
   * Get the current number of failed biometric attempts for a user
   */
  getBiometricAttempts: async (userId?: string | number): Promise<number> => {
    try {
      let key: string;
      if (userId) {
        key = getKey(BIOMETRIC_ATTEMPTS_KEY, userId);
      } else {
        const userKey = await biometricsService._getCurrentUserKey();
        if (!userKey) {
          return 0;
        }
        key = getKey(BIOMETRIC_ATTEMPTS_KEY, userKey);
      }
      const attempts = await AsyncStorage.getItem(key);
      return attempts ? parseInt(attempts, 10) : 0;
    } catch (error) {
      console.error('Error getting biometric attempts:', error);
      return 0;
    }
  },

  /**
   * Increment the failed biometric attempts counter for a user
   */
  incrementBiometricAttempts: async (userId?: string | number): Promise<number> => {
    try {
      let key: string;
      if (userId) {
        key = getKey(BIOMETRIC_ATTEMPTS_KEY, userId);
      } else {
        const userKey = await biometricsService._getCurrentUserKey();
        if (!userKey) {
          throw new Error('Cannot increment attempts: no user key');
        }
        key = getKey(BIOMETRIC_ATTEMPTS_KEY, userKey);
      }
      const currentAttempts = await biometricsService.getBiometricAttempts(userId);
      const newAttempts = currentAttempts + 1;
      await AsyncStorage.setItem(key, newAttempts.toString());
      return newAttempts;
    } catch (error) {
      console.error('Error incrementing biometric attempts:', error);
      return MAX_BIOMETRIC_ATTEMPTS;
    }
  },

  /**
   * Reset the biometric attempts counter for a user
   */
  resetBiometricAttempts: async (userId?: string | number): Promise<void> => {
    try {
      let key: string;
      if (userId) {
        key = getKey(BIOMETRIC_ATTEMPTS_KEY, userId);
      } else {
        const userKey = await biometricsService._getCurrentUserKey();
        if (!userKey) {
          console.warn('Cannot reset attempts: no user key');
          return;
        }
        key = getKey(BIOMETRIC_ATTEMPTS_KEY, userKey);
      }
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error resetting biometric attempts:', error);
    }
  },

  /**
   * Check if biometric attempts have been exhausted for a user
   */
  hasExhaustedBiometricAttempts: async (userId?: string | number): Promise<boolean> => {
    const attempts = await biometricsService.getBiometricAttempts(userId);
    return attempts >= MAX_BIOMETRIC_ATTEMPTS;
  },

  /**
   * Check if biometric login should be shown
   * ⚠️ DEPRECATED: Use getBiometricUsers() for multi-user selection UI
   */
  shouldShowBiometricLogin: async (): Promise<boolean> => {
    try {
      console.warn('shouldShowBiometricLogin is deprecated. Use getBiometricUsers() instead');
      
      const userKey = await biometricsService._getCurrentUserKey();
      if (!userKey) {
        console.log('Biometric login hidden: no user key');
        return false;
      }
      
      const [hasHardware, isEnrolled, isEnabled, attemptsExhausted, token, enabledKey] = await Promise.all([
        biometricsService.hasHardware(),
        biometricsService.isEnrolled(),
        biometricsService.isBiometricsEnabled(),
        biometricsService.hasExhaustedBiometricAttempts(),
        AsyncStorage.getItem(getKey(BIOMETRIC_TOKEN_KEY, userKey)),
        AsyncStorage.getItem(getKey(BIOMETRICS_ENABLED_KEY, userKey)),
      ]);

      console.log('Biometric login check:', {
        hasHardware,
        isEnrolled,
        isEnabled,
        attemptsExhausted,
        hasToken: !!token,
        result: hasHardware && isEnrolled && isEnabled && !attemptsExhausted,
      });

      if (attemptsExhausted) {
        console.log('Biometric login hidden: attempts exhausted');
        return false;
      }

      if (!hasHardware) {
        console.log('Biometric login hidden: no hardware');
        return false;
      }

      if (!isEnrolled) {
        console.log('Biometric login hidden: not enrolled');
        return false;
      }

      if (!isEnabled) {
        console.log('Biometric login hidden: not enabled');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking biometric login availability:', error);
      return false;
    }
  },

  /**
   * Check if device can support biometrics
   */
  canSetupBiometrics: async (): Promise<boolean> => {
    try {
      const [hasHardware, isEnrolled] = await Promise.all([
        biometricsService.hasHardware(),
        biometricsService.isEnrolled(),
      ]);
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking biometric setup capability:', error);
      return false;
    }
  },

  /**
   * Get a friendly name for the biometric type available
   */
  getBiometricTypeName: async (): Promise<string> => {
    try {
      const types = await biometricsService.getSupportedTypes();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Biometric';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Biometric';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'Iris';
      }
      return 'Biometrics';
    } catch (error) {
      return 'Biometrics';
    }
  },

  /**
   * Clear biometric data on logout
   */
  clearBiometricSettingsOnLogout: async (): Promise<void> => {
    try {
      console.log('Logout: Preserving biometric tokens and first login flags for all users');
    } catch (error) {
      console.error('Error in logout cleanup:', error);
    }
  },

  /**
   * Full device biometric reset
   */
  clearAllBiometricData: async (): Promise<void> => {
    try {
      const users = await biometricsService.getBiometricUsers();
      
      for (const user of users) {
        await AsyncStorage.removeItem(getKey(BIOMETRICS_ENABLED_KEY, user.userId));
        await AsyncStorage.removeItem(getKey(BIOMETRIC_TOKEN_KEY, user.userId));
        await AsyncStorage.removeItem(getKey(USER_PHONE_KEY, user.userId));
      }
      
      await AsyncStorage.removeItem(BIOMETRIC_USERS_KEY);
      console.log('Cleared ALL biometric data from device');
    } catch (error) {
      console.error('Error clearing all biometric data:', error);
    }
  },

  /**
   * @deprecated Use clearBiometricSettingsOnLogout() or clearAllBiometricData()
   */
  clearBiometricSettings: async (): Promise<void> => {
    console.warn('clearBiometricSettings is deprecated');
    try {
      const userKey = await biometricsService._getCurrentUserKey();
      if (!userKey) {
        console.warn('Cannot clear biometric settings: no user key');
        return;
      }
      const key = `${FIRST_LOGIN_COMPLETED_KEY}_${userKey}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing biometric settings:', error);
    }
  },

  /**
   * Full biometric login flow with device auth and backend session creation
   */
  performBiometricLogin: async (
    promptMessage: string = 'Authenticate to login',
    userId?: string | number,
  ): Promise<BiometricLoginResult> => {
    try {
      const attemptsExhausted = await biometricsService.hasExhaustedBiometricAttempts(userId);
      if (attemptsExhausted) {
        return {
          success: false,
          error: 'Maximum biometric attempts reached. Please login with OTP.',
          shouldFallbackToOTP: true,
          attemptsRemaining: 0,
        };
      }

      const biometricResult = await biometricsService.authenticate(promptMessage);

      if (!biometricResult.success) {
        if (biometricResult.cancelled) {
          return { success: false, error: 'cancelled' };
        }

        const newAttemptCount = await biometricsService.incrementBiometricAttempts(userId);
        const attemptsRemaining = Math.max(0, MAX_BIOMETRIC_ATTEMPTS - newAttemptCount);
        return {
          success: false,
          error: biometricResult.error || 'Biometric authentication failed',
          attemptsRemaining,
          shouldFallbackToOTP: attemptsRemaining === 0,
        };
      }

      const loginResult = await biometricsService.loginWithBiometricToken(userId);

      if (loginResult.success) {
        await biometricsService.resetBiometricAttempts(userId);
      } else if (!loginResult.tokenInvalid) {
        const newAttemptCount = await biometricsService.incrementBiometricAttempts(userId);
        const attemptsRemaining = Math.max(0, MAX_BIOMETRIC_ATTEMPTS - newAttemptCount);
        loginResult.attemptsRemaining = attemptsRemaining;
        loginResult.shouldFallbackToOTP = attemptsRemaining === 0;
      }

      return loginResult;
    } catch (error: any) {
      console.error('Biometric login flow error:', error);

      const newAttemptCount = await biometricsService.incrementBiometricAttempts(userId);
      const attemptsRemaining = Math.max(0, MAX_BIOMETRIC_ATTEMPTS - newAttemptCount);

      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
        attemptsRemaining,
        shouldFallbackToOTP: attemptsRemaining === 0,
      };
    }
  },
};

export default biometricsService;
