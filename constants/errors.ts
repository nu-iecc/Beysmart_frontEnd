export const ERROR_MESSAGES = {
    // Authentication errors
    LOGIN_FAILED: 'Login failed. Please try again.',
    INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
    EMAIL_NOT_VERIFIED: 'Email not verified. Please verify your email first, or use phone + OTP login.',
    ACCOUNT_DEACTIVATED: 'Account is deactivated.',
    ACCOUNT_PENDING_APPROVAL: 'Account pending approval.',
    NO_ACCOUNT_FOUND: 'No account found with this phone number.',
    
    // OTP errors
    OTP_SEND_FAILED: 'Failed to send verification code. Please try again.',
    INVALID_OTP: 'Invalid OTP code. Please try again.',
    OTP_EXPIRED: 'OTP code has expired. Please request a new one.',
    INVALID_PHONE_FORMAT: 'Invalid phone number format. Please check and try again.',
    
    // Network errors
    NETWORK_ERROR: 'Network error. Please check your connection.',
    UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    
    // Session errors
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
  } as const;
  
  // Success messages
  export const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'Login successful',
    OTP_SENT: 'OTP sent successfully',
    OTP_VERIFIED: 'OTP verified successfully',
    LOGOUT_SUCCESS: 'Logged out successfully',
  } as const;