import React, { useEffect, useRef } from 'react';
import { TextInput, View } from 'react-native';
import { colors } from '../colors/colors';
import { Spacing } from '../Layout/spacing';
import { Typography } from '../typography/typography';

interface OTPInputFieldProps {
  length: number;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  error?: boolean;
  success?: boolean;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
}

const OTPInputField: React.FC<OTPInputFieldProps> = ({
  length = 4,
  value,
  onChange,
  disabled = false,
  error = false,
  success = false,
  autoFocus = false,
  onComplete,
}) => {
  const inputRefs = useRef<any[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      // Focus the first input
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (text: string, index: number) => {
    if (disabled) return;

    // Allow empty string for deletion
    if (text === '') {
      const newValue = [...value];
      newValue[index] = '';
      onChange(newValue);
      return;
    }

    // Only allow single digits
    const digit = text.slice(-1).replace(/[^0-9]/g, '');
    
    if (digit) {
      const newValue = [...value];
      newValue[index] = digit;
      onChange(newValue);

      // Auto-focus next input
      if (index < length - 1 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }

      // Check if OTP is complete
      if (newValue.every(val => val !== '') && onComplete) {
        onComplete(newValue.join(''));
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && value[index] === '' && index > 0) {
      // Move focus to previous input when backspace is pressed on empty field
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const getBorderColor = () => {
    if (disabled) return colors.background;
    if (error) return colors.error;
    if (success) return colors.success;
    return colors.border;
  };

  return (
    <View style={{
      alignItems: 'center',
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
      }}>
                 {Array.from({ length }, (_, index) => (
           <View
             key={index}
             style={{
               width: 60,
               height: 60,
               borderWidth: 1,
               borderRadius: 12,
               borderColor: getBorderColor(),
               backgroundColor: disabled ? colors.background : colors.surface,
               opacity: disabled ? 0.6 : 1,
               alignItems: 'center',
               justifyContent: 'center',
             }}
           >
                         <TextInput
              ref={(ref) => { if (ref) inputRefs.current[index] = ref; }}
              value={value[index] || ''}
              onChangeText={(text: string) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              maxLength={1}
              keyboardType="numeric"
              style={{
                width: '100%',
                height: '100%',
                textAlign: 'center',
                fontSize: 24,
                fontWeight: '700',
                color: colors.text,
                borderWidth: 0,
                backgroundColor: 'transparent',
              }}
            />
           </View>
         ))}
      </View>
      
      {/* Helper text for states */}
      {error && (
        <Typography variant="caption" color={colors.error} style={{
          marginTop: Spacing.sm,
          textAlign: 'center',
        }}>
          Please enter the complete verification code
        </Typography>
      )}
      
      {success && (
        <Typography variant="caption" color={colors.success} style={{
          marginTop: Spacing.sm,
          textAlign: 'center',
        }}>
          Code verified successfully
        </Typography>
      )}
    </View>
  );
};

export default OTPInputField;
