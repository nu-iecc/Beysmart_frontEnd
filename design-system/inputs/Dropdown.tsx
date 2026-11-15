import React, { useState } from 'react';
import { FlatList, Modal, TouchableOpacity, View } from 'react-native';
import { colors } from '../colors/colors';
import DropdownIcon from '../icons/outlined/Dropdown';
import { Spacing } from '../Layout/spacing';
import { Typography } from '../typography/typography';

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly DropdownOption[];
  placeholder?: string;
  error?: string;
  success?: string;
  helperText?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  error,
  success,
  helperText,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.value === value);

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

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
  };

  const renderOption = ({ item }: { item: DropdownOption }) => (
    <TouchableOpacity
      style={{
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
      onPress={() => handleSelect(item.value)}
      activeOpacity={0.7}
    >
      <Typography
        variant="body"
        color={item.value === value ? colors.primary.base : colors.text}
        style={{
          fontWeight: item.value === value ? '600' : '400',
        }}
      >
        {item.label}
      </Typography>
    </TouchableOpacity>
  );

  return (
    <View style={{ marginBottom: Spacing.sm }}>
      {label && (
        <Typography variant="body" style={{ marginBottom: Spacing.xs }}>
          {label}
        </Typography>
      )}
      
      <TouchableOpacity
        style={{
          borderWidth: 1,
          borderColor,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: Spacing.sm,
          paddingVertical: 12,
          backgroundColor: disabled ? colors.background : colors.surface,
          opacity: disabled ? 0.6 : 1,
        }}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
      >
        <Typography
          variant="body"
          color={selectedOption ? colors.text : colors.disabled}
          style={{ flex: 1 }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Typography>
        
        <DropdownIcon
          width={20}
          height={20}
          color={colors.secondaryText}
        />
      </TouchableOpacity>

      {(error || success || helperText) && (
        <Typography
          variant="caption"
          color={messageColor}
          style={{ marginTop: Spacing.xs }}
        >
          {error || success || helperText}
        </Typography>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              marginHorizontal: Spacing.lg,
              maxHeight: 300,
              minWidth: 200,
              shadowColor: colors.text,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default Dropdown;
