import React from 'react';
import { colors as DSColors } from '../colors/colors';
import { BackArrow, checkemail as Checkemail, DropdownIcon, ImageIcon, LockIcon, Phone, screwdriver as Screwdriver, UserIcon } from '../icons';
import Arrow from '../icons/outlined/arrow';
import Correct from '../icons/outlined/correct';
import Message from '../icons/outlined/message';

export type AuthScreenKey =
  | 'register'
  | 'resetByEmail'
  | 'resetByPhone'
  | 'verifyOtp'
  | 'resetPassword'
  | 'newPassword'
  | 'resetComplete'
  | 'completeRegistration'
  | 'profilePhoto';

type ButtonConfig = {
  primaryTitle: string;
  primaryVariant?: 'primaryLarge' | 'primaryDisabled' | 'secondary' | string;
};

type FieldLabelConfig = {
  emailLabel: string;
  emailPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  countryRegionLabel: string;
};

type VerifyCopyConfig = {
  title: string;
  subtitleEmail?: string;
  subtitlePhone?: string;
  resendPrefix: string;
  continueTitle: string;
};

export type AuthScreenCopy = {
  title: string;
  subtitle?: string;
  fields?: Partial<FieldLabelConfig>;
  buttons: ButtonConfig;
};

export const AUTH_COPY: Record<AuthScreenKey, AuthScreenCopy | VerifyCopyConfig> = {
  register: {
    title: 'Welcome To Beysmart',
    subtitle: 'Create Your Account',
    fields: {
      emailLabel: 'Email Address',
      emailPlaceholder: 'Your email address',
      phoneLabel: 'Phone number',
      phonePlaceholder: '(123) 456-7890',
      countryRegionLabel: 'Country/Region',
    },
    buttons: {
      primaryTitle: 'Next',
      primaryVariant: 'primaryLarge',
    },
  },
  resetByEmail: {
    title: 'Enter your email',
    subtitle: "We'll send you a verification code (please make sure your email is verified to receive the code)",
    fields: {
      emailLabel: 'Email Address',
      emailPlaceholder: 'Your email address',
    },
    buttons: {
      primaryTitle: 'Send code',
      primaryVariant: 'primaryLarge',
    },
  },
  resetByPhone: {
    title: 'Enter your phone',
    subtitle: "We'll send you a verification code",
    fields: {
      phoneLabel: 'Phone number',
      phonePlaceholder: '(123) 456-7890',
      countryRegionLabel: 'Country/Region',
    },
    buttons: {
      primaryTitle: 'Send code',
      primaryVariant: 'primaryLarge',
    },
  },
  verifyOtp: {
    title: 'Verify Your Phone Number',
    subtitleEmail: "We've sent a code to your email",
    subtitlePhone: "We've sent a code on WhatsApp to Your Phone Number",
    resendPrefix: 'Resend code in',
    continueTitle: 'Continue',
  },
  resetPassword: {
    title: 'Reset Password',
    subtitle: 'Where should we send your code?',
    buttons: { primaryTitle: 'Continue', primaryVariant: 'primaryLarge' },
  },
  newPassword: {
    title: 'Reset Password',
    subtitle: 'Enter your new password',
    fields: {
      emailLabel: 'New Password',
      emailPlaceholder: 'Create a strong password',
    },
    buttons: { primaryTitle: 'Save Password', primaryVariant: 'primaryLarge' },
  },
  resetComplete: {
    title: 'Password Reset Complete',
    subtitle: 'Your password has been successfully updated',
    buttons: { primaryTitle: 'Go to Login', primaryVariant: 'primaryLarge' },
  },
  completeRegistration: {
    title: 'Create Password',
    subtitle: 'Choose a strong password for your account',
    fields: {
      emailLabel: 'Password',
      emailPlaceholder: 'Create a strong password',
    },
    buttons: { primaryTitle: 'Complete Registration', primaryVariant: 'primaryLarge' },
  },
  profilePhoto: {
    title: 'Profile Photo',
    subtitle: 'Your photo ensures a more secure and tailored experience for you and your household.',
    buttons: { primaryTitle: 'Next', primaryVariant: 'primaryLarge' },
  },
};


export const AUTH_FLAGS = {
  // If any screens need to toggle features, keep flags here
  showSecurityFooter: true,
};

export const AUTH_THEME = {
  background: DSColors.background,
  surface: DSColors.surface,
  text: DSColors.text,
  secondaryText: DSColors.secondaryText,
  border: DSColors.border,
  error: DSColors.error,
  primary: DSColors.primary.base,
};

type IconComponent = React.ComponentType<{ width?: number; height?: number; color?: string }>;

type VisualsConfig = {
  backIcon: IconComponent;
  headerIcon: IconComponent;
  dropdownIcon?: IconComponent;
  securityIcon?: IconComponent;
  actionIcon?: IconComponent;
  headerCircleBg?: string;
};

export const AUTH_VISUALS: Record<AuthScreenKey, VisualsConfig> = {
  register: {
    backIcon: BackArrow,
    headerIcon: UserIcon,
    dropdownIcon: DropdownIcon,
    securityIcon: LockIcon,
    headerCircleBg: AUTH_THEME.primary,
  },
  resetByEmail: {
    backIcon: BackArrow,
    headerIcon: Checkemail,
    securityIcon: LockIcon,
    headerCircleBg: AUTH_THEME.primary,
  },
  resetByPhone: {
    backIcon: BackArrow,
    headerIcon: Phone,
    dropdownIcon: DropdownIcon,
    securityIcon: LockIcon,
    headerCircleBg: AUTH_THEME.primary,
  },
  verifyOtp: {
    backIcon: BackArrow,
    headerIcon: Message as unknown as IconComponent,
    securityIcon: LockIcon,
    actionIcon: Arrow as unknown as IconComponent,
    headerCircleBg: AUTH_THEME.primary,
  },
  resetPassword: {
    backIcon: BackArrow,
    headerIcon: Screwdriver as unknown as IconComponent,
    securityIcon: LockIcon,
    headerCircleBg: AUTH_THEME.primary,
  },
  newPassword: {
    backIcon: BackArrow,
    headerIcon: Screwdriver as unknown as IconComponent,
    securityIcon: LockIcon,
    headerCircleBg: AUTH_THEME.primary,
  },
  resetComplete: {
    backIcon: BackArrow,
    headerIcon: Correct as unknown as IconComponent,
    securityIcon: LockIcon,
    headerCircleBg: AUTH_THEME.primary,
  },
  completeRegistration: {
    backIcon: BackArrow,
    headerIcon: UserIcon,
    securityIcon: LockIcon,
    headerCircleBg: AUTH_THEME.primary,
  },
  profilePhoto: {
    backIcon: BackArrow,
    headerIcon: ImageIcon,
    securityIcon: LockIcon,
    headerCircleBg: AUTH_THEME.primary,
  },
};

export const AUTH_TEXT = {
  securityFooter: 'Your data is securely encrypted',
  passwordRequirement: 'Password must be at least 8 characters long',
  whatsappHint: 'Make sure the number you enter has active WhatsApp.',
};

export type AuthCountry = {
  name: string;
  dial: string; // E.g., '+20'
  code: string; // ISO-ish label, optionally reused
};

export const AUTH_COUNTRIES: AuthCountry[] = [
  { name: 'Egypt', dial: '+20', code: 'EG' },
  { name: 'United States', dial: '+1', code: 'US' },
  { name: 'United Kingdom', dial: '+44', code: 'GB' },
  { name: 'Saudi Arabia', dial: '+966', code: 'SA' },
  { name: 'United Arab Emirates', dial: '+971', code: 'AE' },
  { name: 'France', dial: '+33', code: 'FR' },
  { name: 'Germany', dial: '+49', code: 'DE' },
  { name: 'India', dial: '+91', code: 'IN' },
  { name: 'Canada', dial: '+1', code: 'CA' },
  { name: 'Brazil', dial: '+55', code: 'BR' },
  { name: 'Italy', dial: '+39', code: 'IT' },
  { name: 'Spain', dial: '+34', code: 'ES' },
  { name: 'Australia', dial: '+61', code: 'AU' },
  { name: 'China', dial: '+86', code: 'CN' },
  { name: 'Japan', dial: '+81', code: 'JP' },
  { name: 'Mexico', dial: '+52', code: 'MX' },
  { name: 'Turkey', dial: '+90', code: 'TR' },
  { name: 'South Africa', dial: '+27', code: 'ZA' },
  { name: 'Nigeria', dial: '+234', code: 'NG' },
  { name: 'Kenya', dial: '+254', code: 'KE' },
];


