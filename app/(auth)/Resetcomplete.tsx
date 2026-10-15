import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
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
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.iconBadge}>
          <visuals.headerIcon width={38} height={38} color={AUTH_THEME.text} />
        </View>

        {visuals.securityIcon && <View style={styles.successMark}>
          <visuals.securityIcon width={17} height={17} color="#FFFFFF" />
        </View>}

        <Typography variant="caption" color="#547B25" style={styles.eyebrow}>
          PASSWORD UPDATED
        </Typography>

        <Typography variant="h1" color={AUTH_THEME.text} style={styles.title}>
          {copy.title}
        </Typography>

        <Typography variant="body" color={AUTH_THEME.secondaryText} style={styles.description}>
          {copy.subtitle}
        </Typography>

        <View style={styles.button}>
          <AppButton
            variant="primaryLarge"
            title={copy.buttons.primaryTitle}
            onPress={handleGoToLogin}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    backgroundColor: AUTH_THEME.background,
  },
  card: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E7EAF0',
    backgroundColor: AUTH_THEME.surface,
  },
  iconBadge: {
    width: 76,
    height: 76,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_THEME.primary,
    marginBottom: Spacing.md,
  },
  successMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    marginLeft: 58,
    borderWidth: 2,
    borderColor: AUTH_THEME.surface,
    backgroundColor: '#3A9B65',
  },
  eyebrow: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  button: {
    width: '100%',
  },
});

export default ResetComplete;
