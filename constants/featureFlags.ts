/**
 * Feature Flags for Development/Testing
 * 
 * ⚠️ IMPORTANT: Set all flags to false before building for production!
 */

export const FEATURE_FLAGS = {
  /**
   * Disable BLE for testing in Expo Go
   * 
   * Set to TRUE when:
   * - Testing OTP functionality in Expo Go on iPhone
   * - Testing features that don't require BLE
   * 
   * Set to FALSE when:
   * - Building for EAS (production/development)
   * - Testing BLE functionality
   * - Ready to commit/push code
   */
  DISABLE_BLE_FOR_TESTING: true, // ← Change to true for Expo Go testing
} as const;

