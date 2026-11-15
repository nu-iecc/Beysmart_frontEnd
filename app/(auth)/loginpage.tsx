import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { LOGIN_STRINGS } from '@/constants/Login';
import { AppButton, colors, Spacing, Typography } from '@/design-system';
import { FingerprintIcon } from '@/design-system/icons/filled';
import FilledBackIcon from '@/design-system/icons/filled/BackIcon';
import MailIcon from '@/design-system/icons/outlined/MailIcon';
import Phone from '@/design-system/icons/outlined/Phone';
import { biometricsService, BiometricUser, MAX_BIOMETRIC_ATTEMPTS } from '@/services';
import { scale, scaleFont } from '@/utils/responsive';

export default function LoginMethodScreen() {
  const router = useRouter();

  const [biometricUsers, setBiometricUsers] = useState<BiometricUser[]>([]);
  const [biometricTypeName, setBiometricTypeName] = useState('Biometrics');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const showBiometricOption = biometricUsers.length > 0;

  // Load biometric users
  const loadBiometricUsers = async () => {
    console.log('🔐 Loading biometric users...');
    const users = await biometricsService.getBiometricUsers();
    console.log('🔐 Found users:', users);

    setBiometricUsers(users);

    if (users.length > 0) {
      const typeName = await biometricsService.getBiometricTypeName();
      setBiometricTypeName(typeName);
    }
  };

  useEffect(() => {
    loadBiometricUsers();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBiometricUsers();
    }, [])
  );

  // Handle biometric login WITH USER ID
  const handleBiometricLogin = useCallback(
    async (userId: string | number) => {
      setIsAuthenticating(true);

      try {
        const result = await biometricsService.performBiometricLogin(
          `Authenticate with ${biometricTypeName} to login`,
          userId
        );

        if (result.success) {
          await AsyncStorage.setItem('isAuthenticated', 'true');
          await AsyncStorage.setItem('loginMethod', 'biometric');

          if (result.user) {
            await AsyncStorage.setItem('userData', JSON.stringify(result.user));
          }
          if (result.csrfToken) {
            await AsyncStorage.setItem('csrftoken', result.csrfToken);
          }

          router.replace('/(app)/home');
        } else if (result.shouldFallbackToOTP) {
          Alert.alert(
            'Biometric Disabled',
            'Too many failed attempts. Please login with phone or email.'
          );
        } else if (result.tokenInvalid) {
          await loadBiometricUsers(); // refresh list (user removed)
          Alert.alert(
            'Session Expired',
            'Please login again using OTP to re-enable biometrics.'
          );
        } else if (result.error === 'cancelled') {
          return;
        } else {
          const attemptsRemaining =
            result.attemptsRemaining ?? (MAX_BIOMETRIC_ATTEMPTS - 1);

          Alert.alert(
            'Authentication Failed',
            `${result.error || 'Try again'}\n\nAttempts left: ${attemptsRemaining}`,
            [
              {
                text: 'Try Again',
                onPress: () => handleBiometricLogin(userId),
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Something went wrong');
      } finally {
        setIsAuthenticating(false);
      }
    },
    [biometricTypeName]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppButton
          variant="iconOnlyMedium"
          icon={<FilledBackIcon />}
          onPress={() => router.back()}
        />
      </View>

      <View style={styles.content}>
        <Typography variant="h1" color={colors.text} style={styles.title}>
          {LOGIN_STRINGS.methodSelect.title}
        </Typography>

        <Typography variant="body" color={colors.secondaryText} style={styles.subtitle}>
          {LOGIN_STRINGS.methodSelect.subtitle}
        </Typography>

        <View style={styles.actions}>
          {/* BIOMETRIC SECTION */}
          {showBiometricOption && (
            <>
              {/* ONE USER */}
              {biometricUsers.length === 1 && (
                <AppButton
                  variant="primaryLarge"
                  title={`Login with ${biometricTypeName}`}
                  icon={<FingerprintIcon width={20} height={20} color={colors.text} />}
                  onPress={() => handleBiometricLogin(biometricUsers[0].userId)}
                  disabled={isAuthenticating}
                />
              )}

              {/* MULTIPLE USERS */}
              {biometricUsers.length > 1 && (
                <>
                  <Typography
                    variant="caption"
                    color={colors.secondaryText}
                    style={{ textAlign: 'center', marginBottom: 10 }}
                  >
                    Choose account
                  </Typography>

                  {biometricUsers.map((user) => (
                    <View key={user.userId} style={{ marginBottom: 10 }}>
                      <AppButton
                        variant="primaryLarge"
                        title={`Login as ${user.phone}`}
                        icon={<FingerprintIcon width={20} height={20} color={colors.text} />}
                        onPress={() => handleBiometricLogin(user.userId)}
                        disabled={isAuthenticating}
                      />
                    </View>
                  ))}
                </>
              )}

              <View style={{ height: Spacing.md }} />

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Typography variant="caption" color={colors.secondaryText}>
                  or use another method
                </Typography>
                <View style={styles.dividerLine} />
              </View>

              <View style={{ height: Spacing.md }} />
            </>
          )}

          {/* EMAIL */}
          <AppButton
            variant={showBiometricOption ? 'secondaryLarge' : 'primaryLarge'}
            title={LOGIN_STRINGS.methodSelect.actions.loginWithEmail}
            icon={<MailIcon />}
            onPress={() => router.push('./emaillogin')}
          />

          <View style={{ height: Spacing.md }} />

          {/* PHONE */}
          <AppButton
            variant={showBiometricOption ? 'secondaryLarge' : 'primaryLarge'}
            title={LOGIN_STRINGS.methodSelect.actions.loginWithPhone}
            icon={<Phone />}
            onPress={() => router.push('./phonelogin')}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Typography variant="caption" color={colors.secondaryText}>
          {LOGIN_STRINGS.methodSelect.accessibility.securityNote}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: scale(Spacing.lg),
  },
  header: {
    marginTop: scale(Spacing.xl),
    marginBottom: scale(Spacing.lg),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: scale(Spacing.sm),
    fontSize: scaleFont(32),
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: scale(Spacing.xl),
    fontSize: scaleFont(16),
  },
  actions: {
    width: '100%',
    maxWidth: scale(300),
  },
  footer: {
    alignItems: 'center',
    marginBottom: scale(Spacing.lg),
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
});