import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../colors/colors';
import { Spacing } from '../Layout/spacing';
import { Typography } from '../typography/typography';

interface TextFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  success?: string;
  helperText?: string;
  showEyeIcon?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad';
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  success,
  helperText,
  showEyeIcon = false,
  leftIcon,
  rightIcon,
  disabled = false,
  keyboardType = 'default',
  accessibilityLabel,
  accessibilityHint,
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const toggleSecureEntry = () => setIsSecure((prev) => !prev);

  // Determine border and text color based on state
  let borderColor = colors.border;
  let messageColor = colors.secondaryText;
  if (disabled) {
    borderColor = colors.background;
  } else if (error) {
    borderColor = colors.error;
    messageColor = colors.error;
  } else if (success) {
    borderColor = colors.success;
    messageColor = colors.success;
  }

  return (
    <View style={{ marginBottom: Spacing.sm }}>
      {label && (
        <Typography variant="body" style={{ marginBottom: Spacing.xs }}>
          {label}
        </Typography>
      )}
      <View
        style={{
          borderWidth: 1,
          borderColor,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: Spacing.sm,
          backgroundColor: disabled ? colors.background : colors.surface,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {leftIcon && (
          <View style={{ marginRight: 8 }}>{leftIcon}</View>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.disabled}
          secureTextEntry={isSecure}
          editable={!disabled}
          keyboardType={keyboardType}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          style={{
            flex: 1,
            paddingVertical: 12,
            color: disabled ? colors.disabled : colors.text,
          }}
        />
        {rightIcon && (
          <View style={{ marginLeft: 8 }}>{rightIcon}</View>
        )}
        {showEyeIcon && !disabled && (
          <TouchableOpacity onPress={toggleSecureEntry}>
            <Ionicons
              name={isSecure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.secondaryText}
            />
          </TouchableOpacity>
        )}
      </View>
      {(error || success || helperText) && (
        <Typography
          variant="caption"
          color={messageColor}
          style={{ marginTop: Spacing.xs }}
        >
          {error || success || helperText}
        </Typography>
      )}
    </View>
  );
};

export default TextField;
