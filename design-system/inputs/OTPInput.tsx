import React, { useEffect, useRef } from 'react';
import { TextInput, View } from 'react-native';
import { colors } from '../colors/colors';
import { Spacing } from '../Layout/spacing';
import { Typography } from '../typography/typography';

interface OTPInputProps {
  length: number;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  error?: boolean;
  success?: boolean;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
}

const OTPInput: React.FC<OTPInputProps> = ({
  length = 4,
  value,
  onChange,
  disabled = false,
  error = false,
  success = false,
  autoFocus = false,
  onComplete,
}) => {
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (text: string, index: number) => {
    if (disabled) return;

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
    // Handle backspace to go to previous input
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleFocus = (index: number) => {
    // Select all text when focusing
    if (inputRefs.current[index]) {
      inputRefs.current[index].setNativeProps({
        selection: { start: 0, end: value[index].length }
      });
    }
  };

  const getBorderColor = () => {
    if (disabled) return colors.background;
    if (error) return colors.error;
    if (success) return colors.success;
    return colors.border;
  };

  const getBackgroundColor = () => {
    if (disabled) return colors.background;
    return colors.surface;
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
              alignItems: 'center',
              justifyContent: 'center',
              marginHorizontal: Spacing.xs,
              borderColor: getBorderColor(),
              backgroundColor: getBackgroundColor(),
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <TextInput
              ref={(ref) => {
                if (ref) inputRefs.current[index] = ref;
              }}
              style={{
                width: '100%',
                height: '100%',
                textAlign: 'center',
                fontSize: 24,
                fontWeight: '700',
                fontFamily: 'Inter',
                color: disabled ? colors.disabled : colors.text,
              }}
              value={value[index] || ''}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => handleFocus(index)}
              keyboardType="numeric"
              maxLength={1}
              editable={!disabled}
              selectTextOnFocus
              caretHidden={false}
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



export default OTPInput;
