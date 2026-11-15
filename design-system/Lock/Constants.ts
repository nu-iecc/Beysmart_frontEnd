// Lock Control Screen Constants
import { colors } from '../colors/colors';

export const LockControlConstants = {
  // Page content
  title: 'Front Door',
  subtitle: 'Main Home',
  
  // Lock states
  locked: 'Locked',
  unlocked: 'Unlocked',
  disconnected: 'Disconnected',
  doorClosed: 'Closed',
  doorOpen: 'Open',
  
  // Instructions
  holdToUnlock: 'Tap and hold for 2 seconds to unlock',
  holdToLock: 'Tap and hold for 2 seconds to lock',
  connectToUse: 'Please connect to wifi or bluetooth to use lock.',
  
  // Menu items
  activityLog: 'Activity Log',
  inviteFamilyFriends: 'Invite Family and Friends',
  settings: 'Settings',
  
  // Battery status
  batteryLabel: 'Battery',
  
  // Connection status
  bluetoothConnected: 'Bluetooth connected',
  wifiConnected: 'WiFi connected',
  
  // Accessibility labels
  backButtonAccessibilityLabel: 'Go back',
  backButtonAccessibilityHint: 'Return to previous screen',
  lockButtonAccessibilityLabel: 'Lock control button',
  lockButtonAccessibilityHint: 'Press and hold to toggle lock state',
  activityLogAccessibilityLabel: 'View activity log',
  activityLogAccessibilityHint: 'Tap to view device activity history',
  inviteFamilyAccessibilityLabel: 'Invite family and friends',
  inviteFamilyAccessibilityHint: 'Tap to share device access with others',
  settingsAccessibilityLabel: 'Device settings',
  settingsAccessibilityHint: 'Tap to access device settings',
  
  // Loading states
  locking: 'Locking...',
  unlocking: 'Unlocking...',
  
  // Success messages
  lockSuccess: 'Door locked successfully',
  unlockSuccess: 'Door unlocked successfully',
  
  // Error messages
  lockError: 'Failed to lock door. Please try again.',
  unlockError: 'Failed to unlock door. Please try again.',
  connectionError: 'Connection error. Please check your connection.',
};

// Animation and timing constants
export const LockAnimationConstants = {
  // Hold duration in milliseconds
  HOLD_DURATION: 2000,
  
  // Animation timing
  PULSE_DURATION: 1000,
  PROGRESS_ANIMATION_DURATION: 2000,
  STATE_CHANGE_DURATION: 300,
  
  // Circle dimensions
  OUTER_CIRCLE_SIZE: 180,
  INNER_CIRCLE_SIZE: 160,
  STROKE_WIDTH: 4,
  
  // Progress ring
  PROGRESS_STROKE_WIDTH: 6,
};

// Lock screen colors
export const LockColors = {
  // Locked state
  locked: {
    primary: colors.error, // Red
    background: colors.error,
    text: colors.surface,
    progressRing: colors.surface,
  },
  
  // Unlocked state
  unlocked: {
    primary: colors.success, // Green
    background: colors.success,
    text: colors.surface,
    progressRing: colors.surface,
  },
  
  // Neutral/transitioning state
  transitioning: {
    primary: colors.warning,
    background: colors.warning,
    text: colors.surface,
    progressRing: colors.surface,
  },
  
  // Disconnected state
  disconnected: {
    primary: colors.disconnectedPrimary,
    background: colors.disconnectedBackground,
    text: colors.disconnectedText,
    progressRing: colors.disconnectedPrimary,
  },
  
  // Header
  header: {
    background: colors.navBarBackground,
    text: colors.surface,
    icon: colors.surface,
  },
  
  // Menu items
  menu: {
    background: colors.surface,
    text: colors.text,
    icon: colors.secondaryText,
    border: colors.border,
    chevron: colors.secondaryText,
  },
  
  // Status indicators
  status: {
    battery: colors.success,
    bluetooth: '#3B82F6', // Blue
    wifi: colors.success,
  },
};

// Dimensions
export const LockDimensions = {
  // Header
  header: {
    height: 60,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  
  // Lock button container
  lockContainer: {
    paddingVertical: 40,
  },
  
  // Menu items
  menuItem: {
    height: 56,
    paddingHorizontal: 20,
    iconSize: 24,
    chevronSize: 20,
    borderBottomWidth: 1,
  },
  
  // Status icons in header
  statusIcon: {
    size: 20,
    spacing: 12,
  },
};
