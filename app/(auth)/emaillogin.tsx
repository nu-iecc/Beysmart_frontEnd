import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import BiometricSetupModal from '@/components/BiometricSetupModal';
import { LOGIN_STRINGS } from '@/constants/Login';
import { ERROR_MESSAGES } from '@/constants/errors';
import { AppButton, colors, Spacing, Typography } from '@/design-system';
import { Grid, Margin, Padding } from '@/design-system/Layout';
import FilledBackIcon from '@/design-system/icons/filled/BackIcon';
import FilledHomeIcon from '@/design-system/icons/filled/HomeIcon';
import TextField from '@/design-system/inputs/TextField';
import { authAPI, biometricsService, LoginRequest } from '@/services';

export default function EmailLoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(false);

  const canContinue = email.trim() && password.trim();

  const handleLogin = async () => {
    if (!canContinue) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const loginData: LoginRequest = {
        email: email.trim(),
        password: password,
      };

      const response = await authAPI.login(loginData);

      // Check if login was successful (check both success flag and message)
      const isLoginSuccessful = response.success || response.message === 'Login successful' || (response.user && !response.error);

      if (isLoginSuccessful) {
        // Store user data in AsyncStorage
        await AsyncStorage.setItem('isAuthenticated', 'true');
        await AsyncStorage.setItem('loginMethod', 'email');
        if (response.user) {
          // Ensure email is included in user data
          const userData = {
            ...response.user,
            email: response.user.email || email.trim(),
          };
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
        } else {
          // Fallback: store minimal user data with email
          await AsyncStorage.setItem('userData', JSON.stringify({ email: email.trim() }));
        }
        
        // Reset biometric attempts counter on successful login
        await biometricsService.resetBiometricAttempts();
        
        // Check if this is the first login and if device supports biometrics
        const isFirstLogin = await biometricsService.isFirstLogin();
        const canSetupBiometrics = await biometricsService.canSetupBiometrics();
        
        if (isFirstLogin && canSetupBiometrics) {
          // Show biometric setup modal instead of navigating immediately
          setPendingNavigation(true);
          setShowBiometricModal(true);
        } else {
          // Navigate to home/main app screen
          router.replace('/(app)/home');
        }
      } else {
        // Login failed - handle specific error cases
        console.log('Login failed:', response);
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
        setError(ERROR_MESSAGES.UNEXPECTED_ERROR);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Biometric setup handlers
  const handleBiometricEnable = () => {
    setShowBiometricModal(false);
    Alert.alert(
      'Biometrics Enabled',
      'You can now use biometric authentication to login.',
      [{ text: 'OK', onPress: () => router.replace('/(app)/home') }]
    );
  };

  const handleBiometricSkip = () => {
    setShowBiometricModal(false);
    router.replace('/(app)/home');
  };

  const handleBiometricClose = () => {
    setShowBiometricModal(false);
    if (pendingNavigation) {
      router.replace('/(app)/home');
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
        router.push('./resetpassword');
      }}>
        <View style={styles.forgotPassword}>
          <Typography variant="caption" color={colors.secondaryText}>
            {LOGIN_STRINGS.emailLogin.actions.forgotPassword}
          </Typography>
        </View>
      </TouchableOpacity>

      {/* Biometric Setup Modal */}
      <BiometricSetupModal
        visible={showBiometricModal}
        onClose={handleBiometricClose}
        onEnable={handleBiometricEnable}
        onSkip={handleBiometricSkip}
        phoneNumber={email}
      />
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

