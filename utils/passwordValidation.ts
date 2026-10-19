/**
 * Password validation utilities
 */

export interface PasswordValidation {
  isValid: boolean;
  score: 'weak' | 'medium' | 'strong';
  message: string;
  errors: string[];
}

const MIN_PASSWORD_LENGTH = 8;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_NUMBER = /[0-9]/;
const HAS_SPECIAL_CHAR = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

/**
 * Validates password strength
 */
export const validatePasswordStrength = (password: string): PasswordValidation => {
  const errors: string[] = [];

  if (!password) {
    return {
      isValid: false,
      score: 'weak',
      message: 'Password is required',
      errors: ['Password is required'],
    };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  if (!HAS_UPPERCASE.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!HAS_LOWERCASE.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!HAS_NUMBER.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!HAS_SPECIAL_CHAR.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  let score: 'weak' | 'medium' | 'strong' = 'weak';
  if (errors.length === 0) {
    score = 'strong';
  } else if (errors.length <= 2) {
    score = 'medium';
  }

  const message = errors.length > 0
    ? errors[0] // Show first error as main message
    : 'Password is strong';

  return {
    isValid: errors.length === 0,
    score,
    message,
    errors,
  };
};

/**
 * Checks if two passwords match
 */
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): { isMatch: boolean; message: string } => {
  if (!confirmPassword) {
    return {
      isMatch: false,
      message: 'Please confirm your password',
    };
  }

  if (password !== confirmPassword) {
    return {
      isMatch: false,
      message: 'Passwords do not match',
    };
  }

  return {
    isMatch: true,
    message: 'Passwords match',
  };
};

/**
 * Combines both validations for registration form
 */
export const validateRegistrationPasswords = (
  password: string,
  confirmPassword: string
): {
  passwordValidation: PasswordValidation;
  matchValidation: { isMatch: boolean; message: string };
  isFormValid: boolean;
} => {
  const passwordValidation = validatePasswordStrength(password);
  const matchValidation = validatePasswordMatch(password, confirmPassword);

  return {
    passwordValidation,
    matchValidation,
    isFormValid: passwordValidation.isValid && matchValidation.isMatch,
  };
};
