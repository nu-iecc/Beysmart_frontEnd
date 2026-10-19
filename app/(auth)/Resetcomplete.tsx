import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { AUTH_COPY, AUTH_THEME, AUTH_VISUALS, type AuthScreenCopy } from '../../design-system/auth/constants';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { Spacing } from '../../design-system/Layout/spacing';
import { Typography } from '../../design-system/typography/typography';

const ResetComplete = () => {
  const handleGoToLogin = () => {
    router.replace('/(app)/home' as never);
  };

  const copy = AUTH_COPY.resetComplete as AuthScreenCopy;
  const visuals = AUTH_VISUALS.resetComplete;

  return (
    <View style={{
      flex: 1,
      backgroundColor: AUTH_THEME.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.lg,
    }}>
      {/* Success Icon */}
      <View style={{
        marginBottom: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <visuals.headerIcon width={80} height={80} color={AUTH_THEME.primary} />
      </View>

      {/* Title */}
      <Typography 
        variant="h1" 
        color={AUTH_THEME.text}
        style={{
          textAlign: 'center',
          marginBottom: Spacing.md,
        }}
      >
        {copy.title}
      </Typography>

      {/* Description */}
      <Typography 
        variant="body" 
        color={AUTH_THEME.secondaryText}
        style={{
          textAlign: 'center',
          marginBottom: Spacing.xxl,
          paddingHorizontal: Spacing.lg,
        }}
      >
        {copy.subtitle}
      </Typography>

      {/* Button */}
      <View style={{
        width: '100%',
        maxWidth: 300,
      }}>
        <AppButton
          variant="primaryLarge"
          title={copy.buttons.primaryTitle}
          onPress={handleGoToLogin}
        />
      </View>
    </View>
  );
};



export default ResetComplete;
