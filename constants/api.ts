
// Central API base. Set EXPO_PUBLIC_API_URL to something like: http://192.168.1.50:8000
const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '');

// Production Railway URL (hardcoded to avoid env issues)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://beysmartbackend-production-f1a9.up.railway.app';
//export const API_BASE_URL = 'http://127.0.0.1:8000/';
export const BASE_URL = `${stripTrailingSlash(API_BASE_URL)}/api/`;

// Debug log to verify URL
console.log('🌐 API_BASE_URL:', API_BASE_URL);

/**
 * Build a full URL for media files (profile pictures, home photos, etc.)
 * Handles both S3 URLs (already absolute) and legacy local paths (relative).
 */
export const getMediaUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  // If it's already a full URL (S3), return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Legacy: relative path from local storage — prepend backend URL
  return `${stripTrailingSlash(API_BASE_URL)}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login/',
  PHONE_LOGIN: '/api/auth/phone-login/',
  VERIFY_OTP: '/api/auth/verify-otp/',
  REGISTER: '/api/auth/register/',
  REFRESH_TOKEN: '/api/auth/refresh/',
  LOGOUT: '/api/auth/logout/',
  
  // Biometric authentication
  BIOMETRIC_ENABLE: '/api/auth/biometric/enable/',
  BIOMETRIC_LOGIN: '/api/auth/biometric/login/',
  BIOMETRIC_DISABLE: '/api/auth/biometric/disable/',
  
  // User management
  USER_PROFILE: '/api/user/profile/',
  UPDATE_PROFILE: '/api/user/update/',
  
  // Device management
  DEVICES: '/api/home/devices/',
  DEVICE_DETAIL: '/api/home/devices/:id/',
  DEVICE_LOCK: '/api/home/devices/:id/lock/',
  DEVICE_UNLOCK: '/api/home/devices/:id/unlock/',
  
  // Device users (access management)
  DEVICE_USERS: '/api/home/device-users/',
  DEVICE_USERS_BY_DEVICE: '/api/home/device-users/device/:deviceId/',
  
  // Scenes (if applicable)
  SCENES: '/api/scenes/',
  SCENE_DETAIL: '/api/scenes/:id/',
  
  // Activity Logs
  ACTIVITY_LOGS: '/api/home/activity-logs/',
} as const;

// Device User Roles
export const DEVICE_USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
  GUEST: 'guest',
} as const;

// Activity Log Filter Options
export const EVENT_FILTERS = {
  ALL: 'all',
  UNLOCKING: 'unlocking',
  LOCKING: 'locking',
} as const;

export const USER_FILTERS = {
  ALL: 'all',
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
  GUEST: 'guest',
} as const;

// Activity Types for frontend use
export const ACTIVITY_TYPES = {
  // Lock operations
  LOCK: 'lock',
  UNLOCK: 'unlock',
  AUTO_LOCK: 'auto_lock',
  
  // Access methods
  UNLOCK_PIN: 'unlock_pin',
  UNLOCK_FINGERPRINT: 'unlock_fingerprint',
  UNLOCK_BLUETOOTH: 'unlock_bluetooth',
  UNLOCK_APP: 'unlock_app',
  UNLOCK_NFC: 'unlock_nfc',
  UNLOCK_KEY: 'unlock_key',
  
  // User management
  USER_ADDED: 'user_added',
  USER_REMOVED: 'user_removed',
  USER_PERMISSION_CHANGED: 'user_permission_changed',
  
  // PIN management
  PIN_ADDED: 'pin_added',
  PIN_REMOVED: 'pin_removed',
  PIN_CHANGED: 'pin_changed',
  
  // Fingerprint management
  FINGERPRINT_ADDED: 'fingerprint_added',
  FINGERPRINT_REMOVED: 'fingerprint_removed',
  
  // Device settings
  SETTINGS_CHANGED: 'settings_changed',
  DEVICE_RENAMED: 'device_renamed',
  
  // Security events
  FAILED_ATTEMPT: 'failed_attempt',
  TAMPER_ALERT: 'tamper_alert',
  LOW_BATTERY: 'low_battery',
  BATTERY_REPLACED: 'battery_replaced',
  
  // Device status
  DEVICE_ONLINE: 'device_online',
  DEVICE_OFFLINE: 'device_offline',
  FIRMWARE_UPDATED: 'firmware_updated',
  
  // Other
  OTHER: 'other',
} as const;

// Access Methods
export const ACCESS_METHODS = {
  APP: 'app',
  BLUETOOTH: 'bluetooth',
  PIN: 'pin',
  FINGERPRINT: 'fingerprint',
  NFC: 'nfc',
  KEY: 'key',
} as const;

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;





