import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ERROR_MESSAGES } from '@/constants/errors';
import { LOGIN_STRINGS } from '@/constants/Login';
import { AppButton, colors, Spacing, Typography } from '@/design-system';
import FilledBackIcon from '@/design-system/icons/filled/BackIcon';
import OtpIcon from '@/design-system/icons/outlined/OtpIcon';
import { Grid, Padding } from '@/design-system/Layout';
import { authAPI, VerifyOtpRequest } from '@/services';

const OTP_LENGTH = 4;
const COUNTDOWN_SECONDS = 60;

export default function VerifyCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; dialCode?: string }>();
  const phoneDisplay = params.phone ? `${params.dialCode || LOGIN_STRINGS.phoneLogin.defaults.dialCode} ${params.phone}` : LOGIN_STRINGS.phoneLogin.fields.phonePlaceholder;

  const [timer, setTimer] = useState(COUNTDOWN_SECONDS);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputsRef = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    setTimer(COUNTDOWN_SECONDS);
    const id = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const canResend = timer === 0;
  const code = useMemo(() => digits.join(''), [digits]);

  const handleChange = (index: number, value: string) => {
    const next = value.replace(/\D/g, '').slice(-1);
    const copy = [...digits];
    copy[index] = next;
    setDigits(copy);
    
    // Auto-continue when all 4 digits are filled
    if (copy.every(digit => digit !== '') && !isLoading) {
      handleVerifyOTP(copy.join(''));
    }
    
    if (next && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const otpData: VerifyOtpRequest = {
        phone_number: params.phone || '',
        otp: otpCode,
      };

      const response = await authAPI.verifyOtp(otpData);

      if (response.success) {
        // OTP verification successful
        router.push('/(app)/home');
      } else {
        // OTP verification failed
        setError(response.error || ERROR_MESSAGES.INVALID_OTP);
        // Clear the OTP input for retry
        setDigits(Array(OTP_LENGTH).fill(''));
        inputsRef.current[0]?.focus();
      }
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError(ERROR_MESSAGES.INVALID_OTP);
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        setError(ERROR_MESSAGES.NETWORK_ERROR);
      } else {
        setError(ERROR_MESSAGES.UNEXPECTED_ERROR);
      }
      // Clear the OTP input for retry
      setDigits(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  }

  const handleResend = () => {
    if (!canResend) return;
    setTimer(COUNTDOWN_SECONDS);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <AppButton
          variant="iconOnlyMedium"
          icon={<FilledBackIcon />}
          onPress={() => router.back()}
        />
      </View>

      <View style={styles.heroIcon}>
        <View style={styles.heroDot}>
          <OtpIcon size={32} color={colors.text} />
        </View>
      </View>

      <View style={styles.centerContent}>
        <Typography variant="h1" color={colors.text} style={styles.title}>
          {LOGIN_STRINGS.verifyCode.title}
        </Typography>
        <Typography variant="body" color={colors.secondaryText} style={styles.subtitle}>
          {LOGIN_STRINGS.verifyCode.subtitle.replace('{phone}', phoneDisplay)}
        </Typography>
      </View>

      <View style={styles.otpRow}>
        {digits.map((d, i) => (
          <TextInput
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            keyboardType="number-pad"
            value={d}
            onChangeText={(v) => handleChange(i, v)}
            maxLength={1}
            style={styles.otpBox}
          />
        ))}
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <Typography variant="caption" color={colors.error}>
            {error}
          </Typography>
        </View>
      )}

      {/* Resend area */}
      <View style={{ alignItems: 'center', marginTop: Grid.rowGap }}>
        {!canResend ? (
          <Typography variant="caption" color={colors.secondary.base}>
            {LOGIN_STRINGS.verifyCode.actions.resendCountdown.replace('{seconds}', timer.toString())}
          </Typography>
        ) : (
          <TouchableOpacity onPress={handleResend}>
            <Typography variant="caption" color={colors.primary.base}>
              {LOGIN_STRINGS.verifyCode.actions.resend}
            </Typography>
          </TouchableOpacity>
        )}
      </View>

      {/* Continue */}
      <View style={{ marginTop: Grid.rowGap }}>
        <AppButton
          variant="primaryLarge"
          title={isLoading ? "Verifying..." : LOGIN_STRINGS.verifyCode.actions.continue}
          onPress={() => {
            if (code.length === OTP_LENGTH && !isLoading) {
              handleVerifyOTP(code);
            }
          }}
          disabled={code.length < OTP_LENGTH || isLoading}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Typography variant="caption" color={colors.secondaryText}>
          🔒 {LOGIN_STRINGS.phoneLogin.accessibility.securityNote}
        </Typography>
      </View>
    </View>
  );
}

const BOX_SIZE = 56;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: Grid.gutterWidth,
    ...Padding.screenHorizontal,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
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
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  otpBox: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
});
