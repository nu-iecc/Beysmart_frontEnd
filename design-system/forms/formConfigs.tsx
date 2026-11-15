import { FormConfig } from './DynamicForm';
import { colors } from '../colors/colors';
import { 
  UserIcon, 
  CalendarIcon, 
  LightIcon, 
  SaveIcon,
  AlertIcon,
  HeartIcon,
  StarIcon,
  TimeIcon
} from '../icons';

// Common field configurations that can be reused
export const commonFields = {
  fullName: {
    id: "fullName",
    type: "text" as const,
    label: "Full Name",
    placeholder: "Enter your full name",
    required: true,
    validation: {
      minLength: 2,
      maxLength: 50,
    },
    leftIcon: <UserIcon width={20} height={20} color={colors.secondaryText} />,
  },
  
  email: {
    id: "email",
    type: "email" as const,
    label: "Email Address",
    placeholder: "Enter your email",
    required: true,
    validation: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    helperText: "We'll never share your email with anyone else",
  },
  
  password: {
    id: "password",
    type: "password" as const,
    label: "Password",
    placeholder: "Create a strong password",
    required: true,
    validation: {
      minLength: 8,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    },
    helperText: "Must contain at least 8 characters, one uppercase, one lowercase, and one number",
  },
  
  confirmPassword: {
    id: "confirmPassword",
    type: "password" as const,
    label: "Confirm Password",
    placeholder: "Confirm your password",
    required: true,
    validation: {
      custom: (value: string, allValues?: Record<string, string>) => {
        if (value !== allValues?.password) {
          return "Passwords must match";
        }
        return undefined;
      },
    },
  },
  
  deviceName: {
    id: "deviceName",
    type: "text" as const,
    label: "Device Name",
    placeholder: "e.g., Living Room Light",
    required: true,
    validation: {
      minLength: 3,
      maxLength: 30,
    },
    leftIcon: <LightIcon width={20} height={20} color={colors.secondaryText} />,
  },
  
  installationDate: {
    id: "installationDate",
    type: "date" as const,
    label: "Installation Date",
    placeholder: "Select installation date",
    required: true,
  },
  
  budget: {
    id: "budget",
    type: "text" as const,
    label: "Monthly Budget ($)",
    placeholder: "Enter your monthly budget",
    required: false,
    validation: {
      pattern: /^\d+(\.\d{1,2})?$/,
    },
    helperText: "Optional: Set a monthly budget",
    leftIcon: <SaveIcon width={20} height={20} color={colors.secondaryText} />,
  },
};

// Common dropdown options
export const dropdownOptions = {
  deviceTypes: [
    { label: "Smart Light Bulb", value: "light" },
    { label: "Smart Thermostat", value: "thermostat" },
    { label: "Smart Lock", value: "lock" },
    { label: "Smart Camera", value: "camera" },
    { label: "Smart Speaker", value: "speaker" },
  ],
  
  rooms: [
    { label: "Living Room", value: "living" },
    { label: "Bedroom", value: "bedroom" },
    { label: "Kitchen", value: "kitchen" },
    { label: "Bathroom", value: "bathroom" },
    { label: "Office", value: "office" },
  ],
  
  energyGoals: [
    { label: "Very Low (Under 500 kWh)", value: "very_low" },
    { label: "Low (500-800 kWh)", value: "low" },
    { label: "Medium (800-1200 kWh)", value: "medium" },
    { label: "High (1200+ kWh)", value: "high" },
  ],
  
  notificationFrequencies: [
    { label: "Real-time alerts", value: "realtime" },
    { label: "Daily summary", value: "daily" },
    { label: "Weekly report", value: "weekly" },
    { label: "Monthly report", value: "monthly" },
    { label: "No notifications", value: "none" },
  ],
  
  priorityLevels: [
    { label: "Low Priority", value: "low" },
    { label: "Medium Priority", value: "medium" },
    { label: "High Priority", value: "high" },
    { label: "Critical", value: "critical" },
  ],
  
  maintenanceTypes: [
    { label: "Regular Cleaning", value: "cleaning" },
    { label: "Filter Replacement", value: "filter" },
    { label: "Software Update", value: "software" },
    { label: "Hardware Check", value: "hardware" },
    { label: "Calibration", value: "calibration" },
  ],
};

// Form configuration factory functions
export const createFormConfig = {
  // User registration form
  userRegistration: (onSubmit: (values: Record<string, string>) => void, onCancel?: () => void): FormConfig => ({
    title: "Create Account",
    fields: [
      commonFields.fullName,
      commonFields.email,
      commonFields.password,
      commonFields.confirmPassword,
    ],
    submitButtonText: "Create Account",
    onSubmit,
    onCancel,
  }),
  
  // Smart device setup form
  smartDevice: (onSubmit: (values: Record<string, string>) => void, onCancel?: () => void): FormConfig => ({
    title: "Smart Device Setup",
    fields: [
      commonFields.deviceName,
      {
        id: "deviceType",
        type: "dropdown" as const,
        label: "Device Type",
        placeholder: "Select device type",
        required: true,
        options: dropdownOptions.deviceTypes,
      },
      {
        id: "room",
        type: "dropdown" as const,
        label: "Room Location",
        placeholder: "Select room",
        required: true,
        options: dropdownOptions.rooms,
      },
      commonFields.installationDate,
      {
        id: "warrantyExpiry",
        type: "date" as const,
        label: "Warranty Expiry",
        placeholder: "Select warranty expiry date",
        required: false,
      },
    ],
    submitButtonText: "Save Device",
    onSubmit,
    onCancel,
  }),
  
  // Energy preferences form
  energyPreferences: (onSubmit: (values: Record<string, string>) => void, onCancel?: () => void): FormConfig => ({
    title: "Energy Preferences",
    fields: [
      {
        id: "energyGoal",
        type: "dropdown" as const,
        label: "Monthly Energy Goal",
        placeholder: "Select your energy goal",
        required: true,
        options: dropdownOptions.energyGoals,
      },
      {
        id: "peakHours",
        type: "dropdown" as const,
        label: "Peak Usage Hours",
        placeholder: "Select peak hours",
        required: true,
        options: [
          { label: "6 AM - 10 AM", value: "morning" },
          { label: "10 AM - 2 PM", value: "midday" },
          { label: "2 PM - 6 PM", value: "afternoon" },
          { label: "6 PM - 10 PM", value: "evening" },
          { label: "10 PM - 6 AM", value: "night" },
        ],
      },
      {
        id: "notifications",
        type: "dropdown" as const,
        label: "Notification Preferences",
        placeholder: "Select notification frequency",
        required: true,
        options: dropdownOptions.notificationFrequencies,
      },
      commonFields.budget,
    ],
    submitButtonText: "Save Preferences",
    onSubmit,
    onCancel,
  }),
  
  // Maintenance schedule form
  maintenanceSchedule: (onSubmit: (values: Record<string, string>) => void, onCancel?: () => void): FormConfig => ({
    title: "Maintenance Schedule",
    fields: [
      {
        id: "deviceId",
        type: "text" as const,
        label: "Device ID",
        placeholder: "Enter device ID or name",
        required: true,
        validation: {
          minLength: 3,
        },
        leftIcon: <AlertIcon width={20} height={20} color={colors.secondaryText} />,
      },
      {
        id: "maintenanceType",
        type: "dropdown" as const,
        label: "Maintenance Type",
        placeholder: "Select maintenance type",
        required: true,
        options: dropdownOptions.maintenanceTypes,
      },
      {
        id: "scheduledDate",
        type: "date" as const,
        label: "Scheduled Date",
        placeholder: "Select maintenance date",
        required: true,
      },
      {
        id: "priority",
        type: "dropdown" as const,
        label: "Priority Level",
        placeholder: "Select priority",
        required: true,
        options: dropdownOptions.priorityLevels,
      },
      {
        id: "notes",
        type: "text" as const,
        label: "Additional Notes",
        placeholder: "Any special instructions or notes",
        required: false,
        validation: {
          maxLength: 200,
        },
        helperText: "Optional: Add any special instructions for maintenance",
      },
    ],
    submitButtonText: "Schedule Maintenance",
    onSubmit,
    onCancel,
  }),
  
  // Profile update form
  profileUpdate: (onSubmit: (values: Record<string, string>) => void, onCancel?: () => void): FormConfig => ({
    title: "Update Profile",
    fields: [
      commonFields.fullName,
      commonFields.email,
      {
        id: "phone",
        type: "text" as const,
        label: "Phone Number",
        placeholder: "Enter your phone number",
        required: false,
        validation: {
          pattern: /^[\+]?[1-9][\d]{0,15}$/,
        },
        helperText: "Optional: For emergency notifications",
      },
      {
        id: "timezone",
        type: "dropdown" as const,
        label: "Timezone",
        placeholder: "Select your timezone",
        required: true,
        options: [
          { label: "Eastern Time (ET)", value: "ET" },
          { label: "Central Time (CT)", value: "CT" },
          { label: "Mountain Time (MT)", value: "MT" },
          { label: "Pacific Time (PT)", value: "PT" },
          { label: "Alaska Time (AKT)", value: "AKT" },
          { label: "Hawaii Time (HST)", value: "HST" },
        ],
      },
    ],
    submitButtonText: "Update Profile",
    onSubmit,
    onCancel,
  }),
  
  // Contact form
  contactForm: (onSubmit: (values: Record<string, string>) => void, onCancel?: () => void): FormConfig => ({
    title: "Contact Us",
    fields: [
      commonFields.fullName,
      commonFields.email,
      {
        id: "subject",
        type: "text" as const,
        label: "Subject",
        placeholder: "What is this about?",
        required: true,
        validation: {
          minLength: 5,
          maxLength: 100,
        },
      },
      {
        id: "message",
        type: "text" as const,
        label: "Message",
        placeholder: "Tell us more about your inquiry...",
        required: true,
        validation: {
          minLength: 10,
          maxLength: 1000,
        },
        helperText: "Please provide as much detail as possible",
      },
    ],
    submitButtonText: "Send Message",
    onSubmit,
    onCancel,
  }),
};

// Utility function to create custom form configurations
export const createCustomForm = (
  title: string,
  fields: any[],
  submitButtonText: string,
  onSubmit: (values: Record<string, string>) => void,
  onCancel?: () => void
): FormConfig => ({
  title,
  fields,
  submitButtonText,
  onSubmit,
  onCancel,
});

// Utility function to merge form configurations
export const mergeFormConfigs = (...configs: FormConfig[]): FormConfig => {
  const mergedConfig: FormConfig = {
    title: configs[0]?.title || "Form",
    fields: [],
    submitButtonText: configs[0]?.submitButtonText || "Submit",
    onSubmit: configs[0]?.onSubmit || (() => {}),
    onCancel: configs[0]?.onCancel,
  };
  
  configs.forEach(config => {
    mergedConfig.fields.push(...config.fields);
  });
  
  return mergedConfig;
}; 