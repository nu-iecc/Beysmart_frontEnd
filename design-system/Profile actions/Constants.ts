export const ProfileConstants = {


   ourPhoneNumber: "+20 1120151001",
  // Button and action labels
  addNewDevice: 'Add New Device',
  myHomes: 'My Homes',
  inviteFamilyFriends: 'Invite Family & Friends',
  accountSettings: 'Account Settings',
  helpSupport: 'Help & Support',
  
  // Accessibility labels
  addDeviceAccessibilityLabel: 'Add new device to your smart home',
  addDeviceAccessibilityHint: 'Tap to add a new smart device to your home',
  myHomesAccessibilityLabel: 'View my homes',
  myHomesAccessibilityHint: 'Tap to view and manage your homes',
  inviteAccessibilityLabel: 'Invite family and friends',
  inviteAccessibilityHint: 'Tap to invite family and friends to your smart home',
  accountSettingsAccessibilityLabel: 'Account settings',
  accountSettingsAccessibilityHint: 'Tap to access your account settings',
  helpSupportAccessibilityLabel: 'Help and support',
  helpSupportAccessibilityHint: 'Tap to get help and support',
  
  // Console log messages
  addDevicePressed: 'Add New Device pressed',
  myHomesPressed: 'My Homes pressed',
  inviteFamilyPressed: 'Invite Family & Friends pressed',
  accountSettingsPressed: 'Account Settings pressed',
  helpSupportPressed: 'Help & Support pressed',
};

export const MyHomesConstants = {
  // Page content
  title: 'My Homes',
  subtitle: 'Manage your properties',
  addNewHome: 'Add New Home',
  
  // Home card content
  controlButton: 'Control',
  devicesLabel: 'devices',
  guestsLabel: 'guests',
  noGuests: 'No guests',
  
  // Status badges
  allSecure: 'All secure',
  devicesOffline: 'devices offline',
  frontDoorUnlocked: 'Front door unlocked',
  
  // Accessibility labels
  backButtonAccessibilityLabel: 'Go back',
  backButtonAccessibilityHint: 'Return to previous screen',
  homeCardAccessibilityLabel: 'Home card',
  homeCardAccessibilityHint: 'Tap to view home details',
  controlButtonAccessibilityLabel: 'Control home',
  controlButtonAccessibilityHint: 'Tap to control this home',
  guestsButtonAccessibilityLabel: 'Manage guests',
  guestsButtonAccessibilityHint: 'Tap to manage guests for this home',
  settingsButtonAccessibilityLabel: 'Home settings',
  settingsButtonAccessibilityHint: 'Tap to access home settings',
  addNewHomeAccessibilityLabel: 'Add new home',
  addNewHomeAccessibilityHint: 'Tap to add a new home',
  
  // Error messages
  errorLoadingHomes: 'Failed to load homes. Please try again.',
  noHomesMessage: 'No homes found. Add your first home to get started.',
};

export const AccountSettingsConstants = {
  TITLE: 'My Account',
  SUBTITLE: 'Manage your account settings',

  SECTIONS: {
    PROFILE_INFO: 'Profile Info',
    ACCOUNT_SECURITY: 'Account Security',
  },

  FIELDS: {
    FIRST_NAME: { LABEL: 'First name', PLACEHOLDER: 'Your first name' },
    LAST_NAME: { LABEL: 'Last name', PLACEHOLDER: 'Your last name' },
    EMAIL: { LABEL: 'Email', PLACEHOLDER: 'your@email.com' },
    PHONE: { LABEL: 'Phone', PLACEHOLDER: '+20 000 000 0000' },
  },

  TWO_FA: {
    LABEL: 'Two-Factor\nAuthentication',
    ENABLED_DESC: 'Enabled',
    DISABLED_DESC: 'Disabled',
  },

  SECURITY: {
    TITLE: 'Account Security',
    TWO_FA: {
      LABEL: 'Two-Factor\nAuthentication',
      ENABLED_DESC: 'Enabled',
      DISABLED_DESC: 'Disabled',
    },
    PASSWORD: {
      LABEL: 'Password',
      LAST_CHANGED_PREFIX: 'Last changed',
    },
    LINKED_DEVICES: {
      LABEL: 'Linked Devices',
      ACTIVE_SESSIONS_SUFFIX: 'active sessions',
    },
  },

  MEMBERSHIPS: {
    TITLE: 'Home Memberships',
    ROLE_ADMIN: 'Admin',
    ROLE_GUEST: 'Guest',
  },

  PREFERENCES: {
    TITLE: 'Preferences',
    THEME: {
      LABEL: 'Theme',
      SUBTITLE: 'Light Mode',
    },
    NOTIFICATIONS: {
      LABEL: 'Notifications',
      SUBTITLE: 'All homes enabled',
    },
    UNITS_LANGUAGE: {
      LABEL: 'Units & Language',
      SUBTITLE: '°F, English',
    },
  },

  EMERGENCY: {
    TITLE: 'Emergency Contacts',
    ADD_BUTTON: 'Add Trusted Person',
    CONTACT_ROLE: 'Trusted contact',
  },

  ACTIONS: {
    EXPORT_DATA: 'Export My Data',
    LOGOUT: 'Logout',
    SIGN_OUT_ALL: 'Sign Out All Devices',
    DELETE_ACCOUNT: 'Delete Account',
  },

  DELETE_ACCOUNT: {
    TITLE: 'Enter Password',
    SUBTITLE: 'Enter your password to delete your account',
    PASSWORD_LABEL: 'Password',
    PASSWORD_PLACEHOLDER: 'Enter your current password',
    CONFIRM_PASSWORD_LABEL: 'Confirm Password',
    CONFIRM_PASSWORD_PLACEHOLDER: 'Confirm your password',
    BUTTON_TITLE: 'Continue',
    VERIFY_TITLE: 'Verify Account Deletion',
    VERIFY_SUBTITLE_EMAIL: "We've sent a verification code to your email to confirm account deletion. Your account will be soft deleted for 60 days.",
    VERIFY_SUBTITLE_PHONE: "We've sent a verification code to your phone to confirm account deletion. Your account will be soft deleted for 60 days.",
    VERIFY_BUTTON_TITLE: 'Delete Account',
  },

  CTA: {
    SAVE_CHANGES: 'Save Changes',
    SAVE: 'Save',
    CANCEL: 'Cancel',
  },

  EMPTY_STATES: {
    EMERGENCY_CONTACTS: {
      TITLE: 'No emergency contacts added yet',
      SUBTITLE: 'Add trusted contacts for emergency access',
    },
  },

  ACCESSIBILITY: {
    BACK: 'Go back',
    BACK_HINT: 'Return to previous screen',
    SAVE: 'Save profile changes',
  },
};

export const MyDevicesConstants = {
  // Page content
  title: 'My Devices',
  subtitle: 'Manage your smart home',
  addNewDevice: 'Add New Device',
  
  // Device card content
  controlButton: 'Control',
  devicesLabel: 'devices',
  
  // Status badges
  online: 'Online',
  offline: 'Offline',
  locked: 'Locked',
  unlocked: 'Unlocked',
  
  // Accessibility labels
  backButtonAccessibilityLabel: 'Go back',
  backButtonAccessibilityHint: 'Return to previous screen',
  deviceCardAccessibilityLabel: 'Device card',
  deviceCardAccessibilityHint: 'Tap to view device details',
  controlButtonAccessibilityLabel: 'Control device',
  controlButtonAccessibilityHint: 'Tap to control this device',
  addNewDeviceAccessibilityLabel: 'Add new device',
  addNewDeviceAccessibilityHint: 'Tap to add a new device',
  
  // Error messages
  errorLoadingDevices: 'Failed to load devices. Please try again.',
  noDevicesMessage: 'No devices found. Add your first device to get started.',
  
  // Loading message
  loadingMessage: 'Loading devices...',
};

export const HelpSupportConstants = {
  TITLE: 'Help & Support',
  SUBTITLE: 'Troubleshoot your problems',
  
  SEARCH: {
    PLACEHOLDER: 'Describe your issue...',
  },
  
  EMERGENCY: {
    TITLE: 'Emergency Lockout?',
    SUBTITLE: '24/7 call support available',
    PHONE_NUMBER: '+20 1120151001',
  },
  
  OUTAGE: {
    NO_OUTAGES: 'No outages in your area',
  },
  
  QUICK_SOLUTIONS: {
    TITLE: 'Quick Solutions',
    LOCK_TROUBLESHOOTING: {
      TITLE: 'Lock Troubleshooting',
      SUBTITLE: 'Battery, Wi-Fi, connectivity',
    },
    SCENE_AUTOMATION: {
      TITLE: 'Scene Automation Fixes',
      SUBTITLE: 'Setup, scheduling, triggers',
    },
    BILLING: {
      TITLE: 'Billing & Subscriptions',
      SUBTITLE: 'Plans, payments, renewals',
    },
  },
  
  OFFLINE_LOCK: {
    TITLE: 'Your lock is offline',
    SUBTITLE: 'Try these steps to reconnect',
    STEPS: {
      CHECK_BATTERY: {
        TEXT: 'Check battery level',
        COMPLETED: true,
      },
      RESET_WIFI: {
        TEXT: 'Reset Wi-Fi connection',
        COMPLETED: false,
      },
      TEST_DEVICE: {
        TEXT: 'Test device response',
        COMPLETED: false,
      },
    },
  },
  
  VIRTUAL_ASSISTANT: {
    TITLE: 'Virtual Assistant',
    SUBTITLE: 'Get instant help',
    QUERIES: {
      DEVICE_CONNECT: 'My device won\'t connect',
      CHANGE_PLAN: 'Change my plan',
      RESET_PASSWORD: 'Reset my password',
    },
  },
  
  CONTACT_SUPPORT: {
    TITLE: 'Contact Support',
    SCHEDULE_CALL: {
      TITLE: 'Schedule a Call',
      SUBTITLE: 'We\'ll call you back',
      BUTTON: 'Request Callback',
    },
    EMAIL_SUPPORT: {
      TITLE: 'Email Support',
      SUBTITLE: 'Device logs auto-attached',
      NORMAL: 'Normal (24h)',
      CRITICAL: 'Critical (2h)',
    },
    COMMUNITY_FORUM: {
      TITLE: 'Community Forum',
      SUBTITLE: 'Ask other Beysmart users',
      TRENDING_TITLE: 'Trending Topics:',
      TOPICS: {
        BATTERY_TIPS: 'Battery life tips',
        SCENE_AUTOMATION: 'Scene automation',
        WIFI_SETUP: 'Wi-Fi setup',
      },
    },
  },
  
  RECENT_HELP: {
    TITLE: 'Recent Help',
    DEVICE_OFFLINE: {
      TITLE: 'Device Offline Issue',
      SUBTITLE: 'You resolved this last week. Need similar help?',
      BUTTON: 'View Solution',
    },
  },
  
  FEEDBACK: {
    TITLE: 'How was your experience?',
    HELPFUL: 'Helpful',
    NOT_HELPFUL: 'Not helpful',
  },
  
  ACCESSIBILITY: {
    BACK: 'Go back',
    BACK_HINT: 'Return to previous screen',
    SEARCH: 'Search for help',
    SEARCH_HINT: 'Describe your issue to find solutions',
    EMERGENCY: 'Emergency lockout support',
    EMERGENCY_HINT: 'Tap to call emergency support',
    QUICK_SOLUTION: 'Quick solution',
    QUICK_SOLUTION_HINT: 'Tap to get help with this topic',
  },
};