import AuthScreen from '@/components/AuthScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import apiClient from '@/utils/api';

export default function EmailLoginScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const mounted = useRef(false);
  const focusVersion = useRef(0);
  const biometricFocusVersion = useRef(0);
  const busyRef = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => navigation.addListener?.('beforeRemove', event => {
    if (busyRef.current) event.preventDefault();
  }), [navigation]);

  const isCurrent = (version: number) =>
    mounted.current && navigation.isFocused() && focusVersion.current === version;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [useInvitationCode, setUseInvitationCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(false);

  useFocusEffect(useCallback(() => {
    if (focusVersion.current !== biometricFocusVersion.current) {
      setShowBiometricModal(false);
      setPendingNavigation(false);
    }
    return () => { focusVersion.current += 1; };
  }, []));

  const canContinue = !!email.trim() && (useInvitationCode ? /^\d{4}$/.test(invitationCode.trim()) : !!password.trim());

  const handleLogin = async () => {
    if (!canContinue || busyRef.current) return;

    const version = focusVersion.current;
    busyRef.current = true;
    setIsLoading(true);
    setError('');

    try {
      if (useInvitationCode) {
        const identifier = email.trim().toLowerCase();
        const { data, status } = await apiClient.post('auth/verify-otp/', {
          email: identifier,
          otp: invitationCode.trim(),
        }, {
          validateStatus: status => (status >= 200 && status < 300) || status === 401 || status === 403,
        });
        if (!isCurrent(version)) return;
        if (status === 401 || status === 403 || data?.success === false) {
          setError('Invitation verification failed. Please check your email and code and try again.');
          return;
        }
        if (data?.next !== 'create_password') {
          setError('This code cannot be used to create an invited account. Please check your invitation.');
          return;
        }
        if (data.csrf_token) await AsyncStorage.setItem('csrftoken', data.csrf_token);
        if (!isCurrent(version)) return;
        setInvitationCode('');
        busyRef.current = false;
        router.replace({ pathname: '/(auth)/Complete-Registeration', params: { email: identifier, flow: 'guest-invite' } });
        return;
      }

      const loginData: LoginRequest = {
        email: email.trim(),
        password: password,
      };

      const response = await authAPI.login(loginData);
      if (!isCurrent(version)) return;

      // An explicit failure overrides legacy success messages or user objects.
      const isLoginSuccessful = response.success !== false && Boolean(
        response.success || response.message === 'Login successful' || (response.user && !response.error)
      );

      if (isLoginSuccessful && response.user) {
        // Store the identity before marking the session authenticated.
        const userData = {
          ...response.user,
          email: response.user.email || email.trim(),
        };
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        await AsyncStorage.setItem('loginMethod', 'email');
        if (response.csrf_token) await AsyncStorage.setItem('csrftoken', response.csrf_token);
        await AsyncStorage.setItem('isAuthenticated', 'true');

        try {
          await biometricsService.resetBiometricAttempts();
          const isFirstLogin = await biometricsService.isFirstLogin();
          const canSetupBiometrics = await biometricsService.canSetupBiometrics();

          if (!isCurrent(version)) return;
          if (isFirstLogin && canSetupBiometrics) {
            biometricFocusVersion.current = version;
            setPendingNavigation(true);
            setShowBiometricModal(true);
            return;
          }
        } catch {
          // Biometric setup is optional once the session has been stored.
        }
        if (!isCurrent(version)) return;
        busyRef.current = false;
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
      if (!isCurrent(version)) return;
      if (useInvitationCode && err.response) {
        setError('Invitation verification failed. Please check your email and code and try again.');
      } else if (err.response?.status === 401) {
        setError(ERROR_MESSAGES.INVALID_CREDENTIALS);
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        setError(ERROR_MESSAGES.NETWORK_ERROR);
      } else {
        setError(ERROR_MESSAGES.UNEXPECTED_ERROR);
      }
    } finally {
      busyRef.current = false;
      if (mounted.current) setIsLoading(false);
    }
  };

  // Biometric setup handlers
  const handleBiometricEnable = () => {
    const version = biometricFocusVersion.current;
    if (!isCurrent(version)) return;
    setShowBiometricModal(false);
    Alert.alert(
      'Biometrics Enabled',
      'You can now use biometric authentication to login.',
      [{ text: 'OK', onPress: () => { if (isCurrent(version)) router.replace('/(app)/home'); } }]
    );
  };

  const handleBiometricSkip = () => {
    if (!isCurrent(biometricFocusVersion.current)) return;
    setShowBiometricModal(false);
    router.replace('/(app)/home');
  };

  const handleBiometricClose = () => {
    if (!isCurrent(biometricFocusVersion.current)) return;
    setShowBiometricModal(false);
    if (pendingNavigation) {
      router.replace('/(app)/home');
    }
  };

  return ((
    <AuthScreen><View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <AppButton
          variant="iconOnlyMedium"
          icon={<FilledBackIcon />}
          disabled={isLoading}
          onPress={() => { if (!busyRef.current) router.back(); }}
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
          {useInvitationCode ? 'Accept an invitation' : LOGIN_STRINGS.emailLogin.title}
        </Typography>
        <Typography variant="body" color={colors.secondaryText} style={styles.subtitle}>
          {useInvitationCode ? 'Enter the email and code from your invitation.' : LOGIN_STRINGS.emailLogin.subtitle}
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
          keyboardType="email-address"
        />
      </View>

      {/* Password and invitation codes are separate login options. */}
      <View style={Margin.betweenSections}>
        <Typography variant="body" style={{ marginBottom: Spacing.xs }}>
          {useInvitationCode ? 'Invitation code' : LOGIN_STRINGS.emailLogin.fields.passwordLabel}
        </Typography>
        {useInvitationCode ? <TextField
          key="invitation"
          value={invitationCode}
          onChangeText={setInvitationCode}
          placeholder="4-digit invitation code"
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
        /> : <TextField
          key="password"
          value={password}
          onChangeText={setPassword}
          placeholder={LOGIN_STRINGS.emailLogin.fields.passwordPlaceholder}
          secureTextEntry
          showEyeIcon
        />}
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
          title={isLoading ? (useInvitationCode ? 'Verifying...' : 'Logging in...') : (useInvitationCode ? 'Verify invitation' : LOGIN_STRINGS.emailLogin.actions.login)}
          onPress={handleLogin}
          disabled={!canContinue || isLoading}
        />
      </View>

      <TouchableOpacity accessibilityRole="button" disabled={isLoading} onPress={() => {
        setUseInvitationCode(!useInvitationCode);
        setInvitationCode('');
        setError('');
      }}>
        <View style={styles.forgotPassword}>
          <Typography variant="caption" color={colors.secondaryText}>
            {useInvitationCode ? 'Log in with a password instead' : 'Have an invitation code?'}
          </Typography>
        </View>
      </TouchableOpacity>

      {!useInvitationCode && <TouchableOpacity onPress={() => router.push('./resetpassword')}>
        <View style={styles.forgotPassword}>
          <Typography variant="caption" color={colors.secondaryText}>
            {LOGIN_STRINGS.emailLogin.actions.forgotPassword}
          </Typography>
        </View>
      </TouchableOpacity>}
    </View><BiometricSetupModal
        visible={showBiometricModal}
        onClose={handleBiometricClose}
        onEnable={handleBiometricEnable}
        onSkip={handleBiometricSkip}
        phoneNumber={email}
      /></AuthScreen>
  ));
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: Grid.gutterWidth,
    ...Padding.screenHorizontal,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  heroIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
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
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
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

