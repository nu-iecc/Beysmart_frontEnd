import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Spacing } from '../Layout/spacing';
import { Typography } from '../typography/typography';
import { buttonStyles } from './buttonstyle';

type ButtonVariant = keyof typeof buttonStyles;

type ButtonStyle = {
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  fontSize: number;
  paddingVertical?: number;
  paddingHorizontal?: number;
  disabledBackgroundColor?: string;
  width?: number;
  height?: number;
  borderWidth?: number;
  borderColor?: string;
};

interface ButtonProps {
  variant: ButtonVariant;
  title?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

// Simple wrapper component that forces centering
const CenteredIcon: React.FC<{ children: React.ReactNode; size: number }> = ({ children, size }) => (
  <View style={{
    width: size,
    height: size,
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    {children}
  </View>
);

export const AppButton: React.FC<ButtonProps> = ({
  variant,
  title,
  icon,
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const variantStyle = buttonStyles[variant] as ButtonStyle;
  const isIconOnly = variant.startsWith('iconOnly');
  const isTextOnly = variant.startsWith('textOnly');

  const iconSizeMap: Record<string, number> = {
    iconOnlyLarge: 28,
    iconOnlyMedium: 22,
    iconOnlySmall: 16,
    iconOnlyPressed: 22,
    iconOnlyDisabled: 22,
  };
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      style={{
        backgroundColor: disabled
          ? variantStyle.disabledBackgroundColor ?? variantStyle.backgroundColor
          : variantStyle.backgroundColor,
        borderRadius: variantStyle.borderRadius,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',

        ...(isIconOnly
          ? {
              width: variantStyle.width,
              height: variantStyle.height,
              borderWidth: variantStyle.borderWidth ?? 0,
              borderColor: variantStyle.borderColor ?? 'transparent',
            }
          : {
              paddingVertical: variantStyle.paddingVertical ?? Spacing.sm,
              paddingHorizontal: variantStyle.paddingHorizontal ?? Spacing.sm,
              flexDirection: 'row',
            }),
      }}
    >
      {/* Title */}
      {!isIconOnly && title && (
        <Typography
          variant="accent"
          color={variantStyle.textColor}
          style={{ fontWeight: 'bold' }}
        >
          {title}
        </Typography>
      )}

      {/* Icon */}
      {icon && (
        <View
          style={{
            marginLeft: title && !isIconOnly ? Spacing.xs : 0,
          }}
        >
          {isIconOnly && React.isValidElement(icon) ? (
            <CenteredIcon size={iconSizeMap[variant] || 20}>
              {React.cloneElement(icon as React.ReactElement<any>, {
                width: iconSizeMap[variant] || 20,
                height: iconSizeMap[variant] || 20,
                color: (variantStyle as any).iconColor || variantStyle.textColor,
              })}
            </CenteredIcon>
          ) : (
            icon
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};
