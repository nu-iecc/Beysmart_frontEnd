import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { AppButton } from '../Buttons/Buttons';
import { colors } from '../colors/colors';
import { CalendarIcon } from '../icons';
import TextField from '../inputs/TextField';
import { Spacing } from '../Layout/spacing';
import { Typography } from '../typography/typography';

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'password' | 'search' | 'date' | 'dropdown';
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    custom?: (value: string, allValues?: Record<string, string>) => string | undefined; 
  };
  helperText?: string;
  leftIcon?: React.ReactNode;
  disabled?: boolean;
  // For dropdown fields
  options?: Array<{ label: string; value: string }>;
}

export interface FormConfig {
  title?: string;
  fields: FormField[];
  submitButtonText?: string;
  onSubmit: (values: Record<string, string>) => void;
  onCancel?: () => void;
}

interface DynamicFormProps {
  config: FormConfig;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ config }) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdowns, setShowDropdowns] = useState<Record<string, boolean>>({});
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [datePickerDate, setDatePickerDate] = useState(new Date());

  const validateField = (field: FormField, value: string): string | undefined => {
    // Required validation
    if (field.required && !value.trim()) {
      return `${field.label} is required`;
    }

    // Skip other validations if empty and not required
    if (!value.trim()) {
      return undefined;
    }

    // Length validation
    if (field.validation?.minLength && value.length < field.validation.minLength) {
      return `${field.label} must be at least ${field.validation.minLength} characters`;
    }

    if (field.validation?.maxLength && value.length > field.validation.maxLength) {
      return `${field.label} must be no more than ${field.validation.maxLength} characters`;
    }

    // Pattern validation
    if (field.validation?.pattern && !field.validation.pattern.test(value)) {
      return `${field.label} format is invalid`;
    }

    // Date validation
    if (field.type === 'date') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return `${field.label} must be a valid date`;
      }
      const today = new Date();
      if (date > today) {
        return `${field.label} cannot be in the future`;
      }
    }

    // Custom validation
    if (field.validation?.custom) {
      return field.validation.custom(value, values);
    }

    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    config.fields.forEach((field) => {
      const error = validateField(field, values[field.id] || '');
      if (error) {
        newErrors[field.id] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
    
    // Mark field as touched immediately for dynamic validation
    if (!touched[fieldId]) {
      setTouched(prev => ({ ...prev, [fieldId]: true }));
    }
    
    // Validate immediately for dynamic feedback
    const field = config.fields.find(f => f.id === fieldId);
    if (field) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [fieldId]: error || '' }));
    }
  };

  const handleDatePress = (fieldId: string) => {
    if (Platform.OS === 'android') {
      // For Android, we'll use a simple approach with current date
      // In a real app, you'd use DateTimePickerAndroid
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      handleFieldChange(fieldId, formattedDate);
    } else {
      // For iOS, show the date picker modal
      setShowDatePicker(fieldId);
      setDatePickerDate(new Date());
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(null);
    } else {
      if (selectedDate) {
        setDatePickerDate(selectedDate);
      }
    }
  };

  const handleDateConfirm = () => {
    if (showDatePicker) {
      const formattedDate = datePickerDate.toISOString().split('T')[0];
      handleFieldChange(showDatePicker, formattedDate);
      setShowDatePicker(null);
    }
  };

  const handleDateCancel = () => {
    setShowDatePicker(null);
  };

  const handleDropdownToggle = (fieldId: string) => {
    setShowDropdowns(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const handleDropdownSelect = (fieldId: string, value: string, label: string) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
    setShowDropdowns(prev => ({ ...prev, [fieldId]: false }));
    
    // Mark as touched and validate
    if (!touched[fieldId]) {
      setTouched(prev => ({ ...prev, [fieldId]: true }));
    }
    
    // Clear error when user selects an option
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    config.fields.forEach(field => {
      allTouched[field.id] = true;
    });
    setTouched(allTouched);

    if (validateForm()) {
      try {
        await config.onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
    
    setIsSubmitting(false);
  };

  const getFieldType = (field: FormField) => {
    switch (field.type) {
      case 'email':
        return 'email';
      case 'password':
        return 'password';
      case 'search':
        return 'search';
      default:
        return 'text';
    }
  };

  const isFieldValid = (fieldId: string): boolean => {
    const field = config.fields.find(f => f.id === fieldId);
    if (!field) return true;
    
    const value = values[fieldId] || '';
    const error = validateField(field, value);
    return !error && value.length > 0;
  };

  const renderField = (field: FormField) => {
    if (field.type === 'dropdown') {
      const selectedOption = field.options?.find(opt => opt.value === values[field.id]);
      
      return (
        <View key={field.id} style={{ marginBottom: Spacing.md }}>
          {field.label && (
            <Typography variant="body" style={{ marginBottom: Spacing.xs }}>
              {field.label}
            </Typography>
          )}
          <TouchableOpacity
            onPress={() => handleDropdownToggle(field.id)}
            style={{
              borderWidth: 1,
              borderColor: touched[field.id] && errors[field.id] ? colors.error : 
                           touched[field.id] && isFieldValid(field.id) ? colors.success : colors.border,
              borderRadius: 8,
              paddingHorizontal: Spacing.sm,
              paddingVertical: 12,
              backgroundColor: field.disabled ? colors.background : colors.surface,
              opacity: field.disabled ? 0.6 : 1,
            }}
          >
            <Typography variant="body" color={selectedOption ? colors.text : colors.disabled}>
              {selectedOption ? selectedOption.label : field.placeholder || 'Select an option'}
            </Typography>
          </TouchableOpacity>
          
          {showDropdowns[field.id] && field.options && (
            <View style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              backgroundColor: colors.surface,
              marginTop: 4,
              maxHeight: 200,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 5,
            }}>
              <ScrollView 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 200 }}
              >
                {field.options.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => handleDropdownSelect(field.id, option.value, option.label)}
                    style={{
                      paddingHorizontal: Spacing.sm,
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      backgroundColor: colors.surface,
                    }}
                  >
                    <Typography variant="body">{option.label}</Typography>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {(touched[field.id] && errors[field.id]) && (
            <Typography
              variant="caption"
              color={colors.error}
              style={{ marginTop: Spacing.xs }}
            >
              {errors[field.id]}
            </Typography>
          )}
          
          {touched[field.id] && isFieldValid(field.id) && (
            <Typography
              variant="caption"
              color={colors.success}
              style={{ marginTop: Spacing.xs }}
            >
              Looks good!
            </Typography>
          )}
        </View>
      );
    }

    if (field.type === 'date') {
      return (
        <View key={field.id} style={{ marginBottom: Spacing.md }}>
          {field.label && (
            <Typography variant="body" style={{ marginBottom: Spacing.xs }}>
              {field.label}
            </Typography>
          )}
          <TouchableOpacity
            onPress={() => handleDatePress(field.id)}
            style={{
              borderWidth: 1,
              borderColor: touched[field.id] && errors[field.id] ? colors.error : 
                           touched[field.id] && isFieldValid(field.id) ? colors.success : colors.border,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: Spacing.sm,
              paddingVertical: 12,
              backgroundColor: field.disabled ? colors.background : colors.surface,
              opacity: field.disabled ? 0.6 : 1,
            }}
          >
            <Typography 
              variant="body" 
              color={values[field.id] ? colors.text : colors.disabled}
              style={{ flex: 1 }}
            >
              {values[field.id] || field.placeholder || 'Select date'}
            </Typography>
            <CalendarIcon width={20} height={20} color={colors.secondaryText} />
          </TouchableOpacity>
          
          {(touched[field.id] && errors[field.id]) && (
            <Typography
              variant="caption"
              color={colors.error}
              style={{ marginTop: Spacing.xs }}
            >
              {errors[field.id]}
            </Typography>
          )}
          
          {touched[field.id] && isFieldValid(field.id) && (
            <Typography
              variant="caption"
              color={colors.success}
              style={{ marginTop: Spacing.xs }}
            >
              Looks good!
            </Typography>
          )}
        </View>
      );
    }

    return (
      <TextField
        key={field.id}
        label={field.label}
        value={values[field.id] || ''}
        onChangeText={(value) => handleFieldChange(field.id, value)}
        placeholder={field.placeholder}
        secureTextEntry={field.type === 'password'}
        showEyeIcon={field.type === 'password'}
        leftIcon={field.leftIcon}
        disabled={field.disabled}
        helperText={field.helperText}
        error={touched[field.id] ? errors[field.id] : undefined}
        success={touched[field.id] && isFieldValid(field.id) ? 'Looks good!' : undefined}
      />
    );
  };

  return (
    <View style={{
      padding: Spacing.lg,
      backgroundColor: colors.surface,
    }}>
      {config.title && (
        <Typography variant="h2" style={{
          marginBottom: Spacing.lg,
          textAlign: 'center',
        }}>
          {config.title}
        </Typography>
      )}
      
      {config.fields.map(renderField)}

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: Spacing.md,
        marginTop: Spacing.lg,
      }}>
        {config.onCancel && (
          <AppButton
            variant="secondaryMedium"
            title="Cancel"
            onPress={config.onCancel}
            disabled={isSubmitting}
          />
        )}
        <AppButton
          variant="primaryMedium"
          title={config.submitButtonText || 'Submit'}
          onPress={handleSubmit}
          disabled={isSubmitting}
        />
      </View>

      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
        >
          <View style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}>
            <View style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: Spacing.lg,
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: Spacing.md,
              }}>
                <TouchableOpacity onPress={handleDateCancel}>
                  <Typography variant="body" color={colors.secondaryText}>
                    Cancel
                  </Typography>
                </TouchableOpacity>
                <Typography variant="h3">Select Date</Typography>
                <TouchableOpacity onPress={handleDateConfirm}>
                  <Typography variant="body" color={colors.primary.base}>
                    Done
                  </Typography>
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={datePickerDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android Date Picker */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={datePickerDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
};

export default DynamicForm; 