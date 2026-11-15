// Navigation Constants - All hardcoded values moved here for easy customization

// Top Navigation Constants
export const TOP_NAVIGATION = {
  // Text constants
  WELCOME_MESSAGE: {
    DEFAULT: 'Welcome',
    WITH_NAME: 'Welcome, {firstName}',
  },
  HOME_SELECTOR: {
    PLACEHOLDER: 'Select Home',
    ADD_NEW_HOME: 'Add New Home',
    ADD_HOME: 'Add Home',
  },
  
  // Dimensions and spacing
  DIMENSIONS: {
    MIN_HEIGHT: 88,
    HOME_SELECTOR: {
      MIN_WIDTH: 170,
      HEIGHT: 32,
      BORDER_RADIUS: 8,
    },
    DROPDOWN: {
      MAX_HEIGHT: 200,
      TOP_OFFSET: 40,
      ITEM_HEIGHT: 32,
      BORDER_RADIUS: 8,
    },
    USER_AVATAR: {
      SIZE: 32,
      BORDER_RADIUS: 16,
      OVERLAP_OFFSET: -8,
    },
    NOTIFICATION: {
      SIZE: 40,
      BORDER_RADIUS: 20,
      DOT_SIZE: 8,
      DOT_BORDER_RADIUS: 4,
    },
    ADD_MEMBER: {
      SIZE: 32,
      BORDER_RADIUS: 16,
    },
  },
  
  // Icon sizes
  ICON_SIZES: {
    DROPDOWN: { width: 12, height: 12 },
    PLUS: { width: 12, height: 12 },
    USER: { width: 18, height: 18 },
    ALERT: { width: 20, height: 20 },
  },
  
  // Styling
  STYLING: {
    BORDER_WIDTH: 1,
    SHADOW: {
      OFFSET: { width: 0, height: 4 },
      OPACITY: 0.1,
      RADIUS: 8,
      ELEVATION: 8,
    },
    Z_INDEX: {
      DROPDOWN: 1000,
      SECOND_AVATAR: 1,
      THIRD_AVATAR: 2,
    },
  },
  
  // Animation
  ANIMATION: {
    ACTIVE_OPACITY: 0.8,
  },
} as const;

// Bottom Navigation Constants
export const BOTTOM_NAVIGATION = {
  // Tab items configuration
  TABS: [
    {
      key: 'home',
      label: 'Home',
      iconKey: 'home',
    },
    {
      key: 'devices',
      label: 'Devices',
      iconKey: 'devices',
    },
    {
      key: 'energy',
      label: 'Energy',
      iconKey: 'energy',
    },
    {
      key: 'profile',
      label: 'Profile',
      iconKey: 'profile',
    },
  ],
  
  // Dimensions
  DIMENSIONS: {
    CONTAINER_HEIGHT: 95,
    ICON_CONTAINER: {
      SIZE: 48,
      BORDER_RADIUS: 24,
    },
    ICON_SIZE: 20,
  },
  
  // Styling
  STYLING: {
    ACTIVE_OPACITY: 0.8,
    TEXT: {
      ACTIVE_OPACITY: 1,
      INACTIVE_OPACITY: 0.4,
      ACTIVE_FONT_WEIGHT: '600',
      INACTIVE_FONT_WEIGHT: '400',
    },
  },
  
  // Padding and margins
  SPACING: {
    CONTAINER: {
      TOP: 10,
      RIGHT: 18,
      BOTTOM: 10,
      LEFT: 18,
    },
    ICON_CONTAINER: {
      TOP: 10,
      BOTTOM: 8,
    },
  },
} as const;

// Icon mapping for dynamic icon selection
export const ICON_MAPPING = {
  home: 'HomeIcon',
  devices: 'LightIcon',
  energy: 'EnergyIcon',
  profile: 'UserIcon',
  plus: 'PlusIcon',
  dropdown: 'Dropdown',
  alert: 'AlertIcon',
  user: 'UserIcon',
  check: 'CorrectIcon',
  lock: 'Lock',
} as const;

// Dynamic icon configuration
export const ICON_CONFIG = {
  // Icon sizes for different contexts
  SIZES: {
    SMALL: { width: 14, height: 14 },
    MEDIUM: { width: 18, height: 18 },
    LARGE: { width: 20, height: 20 },
    EXTRA_LARGE: { width: 24, height: 24 },
  },
  
  // Icon colors for different states
  COLORS: {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    SURFACE: 'surface',
    TEXT: 'text',
    NAVBAR: 'navBarBackground',
  },
  
  // Icon types for different navigation contexts
  TYPES: {
    NAVIGATION: ['home', 'devices', 'energy', 'profile'],
    ACTION: ['plus', 'minus', 'edit', 'delete', 'save'],
    STATUS: ['alert', 'check', 'warning', 'info'],
    USER: ['user', 'settings', 'logout', 'profile'],
  },
} as const;

// Animation constants
export const ANIMATION = {
  DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
  },
} as const;

// Accessibility constants
export const ACCESSIBILITY = {
  LABELS: {
    HOME_SELECTOR: 'Home selector dropdown',
    ADD_HOME: 'Add new home button',
    ADD_MEMBER: 'Add member button',
    NOTIFICATION: 'Notification button',
    USER_AVATAR: 'User avatar',
    TAB_ITEM: 'Tab item',
  },
  HINTS: {
    HOME_SELECTOR: 'Tap to select a different home',
    ADD_HOME: 'Tap to add a new home',
    ADD_MEMBER: 'Tap to add a new member',
    NOTIFICATION: 'Tap to view notifications',
    TAB_ITEM: 'Tap to navigate to this section',
  },
} as const;

// Theme-aware constants that can be customized based on app theme
export const THEME_CONSTANTS = {
  LIGHT: {
    SHADOW_OPACITY: 0.1,
    BORDER_OPACITY: 0.2,
  },
  DARK: {
    SHADOW_OPACITY: 0.3,
    BORDER_OPACITY: 0.4,
  },
} as const;

// Responsive breakpoints for different screen sizes
export const RESPONSIVE = {
  BREAKPOINTS: {
    SMALL: 320,
    MEDIUM: 768,
    LARGE: 1024,
    XLARGE: 1200,
  },
  SCALING: {
    SMALL_SCREEN: 0.8,
    MEDIUM_SCREEN: 1.0,
    LARGE_SCREEN: 1.2,
  },
} as const;
