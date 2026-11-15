import React from "react";
import { Pressable, Switch, View } from "react-native";
import { colors } from "../colors/colors";
import { Spacing } from "../Layout/spacing";
import { Typography } from "../typography/typography";

type ToggleSize = 'small' | 'medium' | 'large';
type ToggleVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface ToggleBaseProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  size?: ToggleSize;
  variant?: ToggleVariant;
  disabled?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  thumbColor?: string;
}

export const Toggle = ({
  value,
  onValueChange,
  size = 'medium',
  variant = 'default',
  disabled = false,
  activeColor,
  inactiveColor,
  thumbColor,
}: ToggleBaseProps) => {
  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return { active: colors.success, inactive: colors.disabled };
      case 'warning':
        return { active: colors.warning, inactive: colors.disabled };
      case 'error':
        return { active: colors.error, inactive: colors.disabled };
      case 'info':
        return { active: colors.info, inactive: colors.disabled };
      default:
        return { active: colors.primary.base, inactive: colors.disabled };
    }
  };

  const variantColors = getVariantColors();
  const finalActiveColor = activeColor || variantColors.active;
  const finalInactiveColor = inactiveColor || variantColors.inactive;
  const finalThumbColor = thumbColor || colors.surface;

  // Size affects only outer spacing when composed; Switch itself doesn't support size
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: finalInactiveColor, true: finalActiveColor }}
      thumbColor={finalThumbColor}
      ios_backgroundColor={finalInactiveColor}
    />
  );
};

interface LabeledToggleProps extends ToggleBaseProps {
  label: string;
  description?: string;
  labelColor?: string;
  descriptionColor?: string;
  containerStyle?: any;
}

export const LabeledToggle = ({ 
  label, 
  description, 
  value, 
  onValueChange,
  size = 'medium',
  variant = 'default',
  disabled = false,
  activeColor,
  inactiveColor,
  thumbColor,
  labelColor,
  descriptionColor,
  containerStyle
}: LabeledToggleProps) => {
  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return { active: colors.success, inactive: colors.disabled };
      case 'warning':
        return { active: colors.warning, inactive: colors.disabled };
      case 'error':
        return { active: colors.error, inactive: colors.disabled };
      case 'info':
        return { active: colors.info, inactive: colors.disabled };
      default:
        return { active: colors.primary.base, inactive: colors.disabled };
    }
  };

  const variantColors = getVariantColors();
  const finalActiveColor = activeColor || variantColors.active;
  const finalInactiveColor = inactiveColor || variantColors.inactive;
  const finalThumbColor = thumbColor || colors.surface;
  const finalLabelColor = labelColor || colors.text;
  const finalDescriptionColor = descriptionColor || colors.secondaryText;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { marginVertical: 4, fontSize: 14 };
      case 'large':
        return { marginVertical: 12, fontSize: 18 };
      default:
        return { marginVertical: 8, fontSize: 16 };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[
      { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginVertical: size === 'small' ? Spacing.xs / 2 : size === 'large' ? Spacing.sm : Spacing.xs,
      },
      containerStyle
    ]}>
      <View style={{ flex: 1, marginRight: Spacing.sm }}>
        <Typography 
          variant="body" 
          color={finalLabelColor}
          style={{ fontSize: sizeStyles.fontSize, fontWeight: '600' }}
        >
          {label}
        </Typography>
        {description && (
          <Typography 
            variant="caption" 
            color={finalDescriptionColor}
            style={{ marginTop: Spacing.xs / 2 }}
          >
            {description}
          </Typography>
        )}
      </View>
      <Toggle
        value={value}
        onValueChange={onValueChange}
        size={size}
        variant={variant}
        disabled={disabled}
        activeColor={finalActiveColor}
        inactiveColor={finalInactiveColor}
        thumbColor={finalThumbColor}
      />
    </View>
  );
};
interface PillToggleProps {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
  size?: ToggleSize;
  variant?: ToggleVariant;
  disabled?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  backgroundColor?: string;
  containerStyle?: any;
  optionStyle?: any;
}

export const PillToggle = ({ 
  options, 
  selected, 
  onSelect,
  size = 'medium',
  variant = 'default',
  disabled = false,
  activeColor,
  inactiveColor,
  activeTextColor,
  inactiveTextColor,
  backgroundColor,
  containerStyle,
  optionStyle
}: PillToggleProps) => {
  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return { active: colors.success, inactive: colors.disabled };
      case 'warning':
        return { active: colors.warning, inactive: colors.disabled };
      case 'error':
        return { active: colors.error, inactive: colors.disabled };
      case 'info':
        return { active: colors.info, inactive: colors.disabled };
      default:
        return { active: colors.primary.base, inactive: colors.disabled };
    }
  };

  const variantColors = getVariantColors();
  const finalActiveColor = activeColor || variantColors.active;
  const finalInactiveColor = inactiveColor || variantColors.inactive;
  const finalActiveTextColor = activeTextColor || colors.text;
  const finalInactiveTextColor = inactiveTextColor || colors.secondaryText;
  const finalBackgroundColor = backgroundColor || colors.background;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { 
          containerPadding: 2, 
          borderRadius: 12, 
          optionPadding: { vertical: 4, horizontal: 8 },
          fontSize: 12
        };
      case 'large':
        return { 
          containerPadding: 6, 
          borderRadius: 24, 
          optionPadding: { vertical: 8, horizontal: 16 },
          fontSize: 16
        };
      default:
        return { 
          containerPadding: 4, 
          borderRadius: 20, 
          optionPadding: { vertical: 6, horizontal: 12 },
          fontSize: 14
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[
      {
        flexDirection: 'row',
        backgroundColor: finalBackgroundColor,
        borderRadius: sizeStyles.borderRadius, // consider moving to radii tokens
        padding: size === 'small' ? Spacing.xs / 4 : size === 'large' ? Spacing.xs * 0.75 : Spacing.xs / 2,
      },
      containerStyle
    ]}>
      {options.map((option) => {
        const isActive = option === selected;
        return (
          <Pressable
            key={option}
            onPress={() => !disabled && onSelect(option)}
            disabled={disabled}
            style={[
              {
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: size === 'small' ? Spacing.xs / 2 : size === 'large' ? Spacing.sm / 2 : Spacing.xs * 0.75,
                paddingHorizontal: size === 'small' ? Spacing.xs : size === 'large' ? Spacing.sm : Spacing.sm - Spacing.xs / 2,
                borderRadius: sizeStyles.borderRadius - 2, // consider radii tokens
                backgroundColor: isActive ? finalActiveColor : 'transparent',
                opacity: disabled ? 0.5 : 1,
              },
              optionStyle
            ]}
          >
            <Typography 
              variant="body"
              color={isActive ? finalActiveTextColor : finalInactiveTextColor}
              style={{ 
                fontWeight: '600', 
                fontSize: sizeStyles.fontSize,
                textAlign: 'center'
              }}
            >
              {option}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
};

// Backward compatibility alias
export const ToggleSwitch = LabeledToggle;
