import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { LOGIN_STRINGS } from '@/constants/Login';
import { ERROR_MESSAGES } from '@/constants/errors';
import { AppButton, colors, Spacing, Typography } from '@/design-system';
import { Grid, Margin, Padding } from '@/design-system/Layout';
import FilledBackIcon from '@/design-system/icons/filled/BackIcon';
import FilledHomeIcon from '@/design-system/icons/filled/HomeIcon';
import TextField from '@/design-system/inputs/TextField';
import { authAPI, LoginRequest } from '@/services';
import apiClient, { apiErrorMessage } from '@/utils/api';

export default function EmailLoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const canContinue = email.trim() && password.trim();

  const handleLogin = async () => {
    if (!canContinue || isLoading) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      if (/^\d{4}$/.test(password)) {
        const identifier = email.trim().toLowerCase();
        const { data } = await apiClient.post('auth/verify-otp/', { email: identifier, otp: password });
        if (data.next !== 'create_password') {
          setError('Use your invitation code to create an account, or your password to log in.');
          return;
        }
        router.replace({ pathname: '/(auth)/Complete-Registeration', params: { email: identifier, flow: 'guest-invite' } });
        return;
      }
      const loginData: LoginRequest = {
        email: email.trim(),
        password: password,
      };

      const response = await authAPI.login(loginData);

      if (response.success) {
        // Login successful
        router.replace('/(app)/home');
      } else {
        // Login failed - handle specific error cases
        if (response.email_verification_required) {
          setError(ERROR_MESSAGES.EMAIL_NOT_VERIFIED);
        } else {
          setError(response.error || ERROR_MESSAGES.LOGIN_FAILED);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError(ERROR_MESSAGES.INVALID_CREDENTIALS);
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        setError(ERROR_MESSAGES.NETWORK_ERROR);
      } else {
        setError(apiErrorMessage(err, ERROR_MESSAGES.UNEXPECTED_ERROR));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <AppButton
          variant="iconOnlyMedium"
          icon={<FilledBackIcon />}
          onPress={() => router.back()}
        />
      </View>

      {/* Hero */}
      <View style={styles.heroIcon}>
        <View style={styles.heroDot}>
          <FilledHomeIcon color={colors.text} />
        </View>
      </View>

      {/* Title & subtitle */}
      <View style={styles.centerContent}>
        <Typography variant="h1" color={colors.text} style={styles.title}>
          {LOGIN_STRINGS.emailLogin.title}
        </Typography>
        <Typography variant="body" color={colors.secondaryText} style={styles.subtitle}>
          {LOGIN_STRINGS.emailLogin.subtitle}
        </Typography>
      </View>

      {/* Email field */}
      <View style={Margin.betweenSections}>
        <Typography variant="body" style={{ marginBottom: Spacing.xs }}>
          {LOGIN_STRINGS.emailLogin.fields.emailLabel}
        </Typography>
        <TextField
          value={email}
          onChangeText={setEmail}
          placeholder={LOGIN_STRINGS.emailLogin.fields.emailPlaceholder}
        />
      </View>

      {/* Password field */}
      <View style={Margin.betweenSections}>
        <Typography variant="body" style={{ marginBottom: Spacing.xs }}>
          {LOGIN_STRINGS.emailLogin.fields.passwordLabel}
        </Typography>
        <TextField
          value={password}
          onChangeText={setPassword}
          placeholder={LOGIN_STRINGS.emailLogin.fields.passwordPlaceholder}
          secureTextEntry
          showEyeIcon
        />
      </View>

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Typography variant="caption" color={colors.error}>
            {error}
          </Typography>
        </View>
      )}

      {/* Login button */}
      <View style={{ marginTop: Grid.rowGap }}>
        <AppButton
          variant="primaryLarge"
          title={isLoading ? "Logging in..." : LOGIN_STRINGS.emailLogin.actions.login}
          onPress={handleLogin}
          disabled={!canContinue || isLoading}
        />
      </View>

      {/* Forgot password */}
      <TouchableOpacity onPress={() => {
        // TODO: navigate to forgot password screen
        console.log('Forgot password pressed');
      }}>
        <View style={styles.forgotPassword}>
          <Typography variant="caption" color={colors.secondaryText}>
            {LOGIN_STRINGS.emailLogin.actions.forgotPassword}
          </Typography>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: Grid.gutterWidth,
    ...Padding.screenHorizontal,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.sm,
  },
  heroIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Grid.rowGap,
    width: '100%',
  },
  heroDot: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    marginTop: Grid.rowGap,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: Grid.rowGap,
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
});

