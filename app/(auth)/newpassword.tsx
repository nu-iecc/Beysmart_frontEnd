import axios from "axios";
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BASE_URL } from '../../constants/api';
import { AUTH_COPY, AUTH_TEXT, AUTH_THEME, AUTH_VISUALS, type AuthScreenCopy } from '../../design-system/auth/constants';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { TextField } from '../../design-system/inputs';
import { Spacing } from '../../design-system/Layout/spacing';
import { Typography } from '../../design-system/typography/typography';
import apiClient from '../../utils/api';


const NewPassword = () => {
  const [new_password, setNewPassword] = useState('');
  const [confirm_password, setConfirmPassword] = useState('');
  const { email, phone_number, fromAccountSettings } = useLocalSearchParams();
  

  const handleResetPassword = async () => {
    try {
      const requestData = {
        email: email || undefined, // This should come from previous screen
        phone_number: phone_number || undefined, // This should come from previous screen
        new_password,
        confirm_password,
       
        user_type: 'CUSTOMER', // Default to customer
      };
      
      if (fromAccountSettings === 'true') {
        // Ensure CSRF is hydrated for session-protected flow
        try { await apiClient.get('auth/csrf-token/'); } catch {}
        await apiClient.post('auth/reset-password/', requestData);
      } else {
        await axios.post(`${BASE_URL}auth/reset-password/`, requestData);
      }
      router.push({
        pathname: '/(auth)/Resetcomplete' as never,
        params: {  email: email || undefined, phone_number: phone_number || undefined}
      });
     
      
    } catch (error: any) {
      console.error('Password Update failed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || error.message || 'Password Update failed. Please try again.';
      Alert.alert('Password Update Failed', errorMessage);
    }
  };

  const isDisabled = !new_password || !confirm_password || new_password !== confirm_password;
  const showMismatch = confirm_password.length > 0 && new_password !== confirm_password;

  const copy = AUTH_COPY.newPassword as AuthScreenCopy;
  const visuals = AUTH_VISUALS.newPassword;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
        >
          <visuals.backIcon width={22} height={22} color={AUTH_THEME.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: visuals.headerCircleBg || AUTH_THEME.primary }]}>
          {visuals.securityIcon && <visuals.securityIcon width={32} height={32} color={AUTH_THEME.text} />}
        </View>
        <Typography variant="h1" style={styles.title}>
          {copy.title}
        </Typography>
        <Typography variant="body" color={AUTH_THEME.secondaryText} style={styles.subtitle}>
          {copy.subtitle}
        </Typography>
      </View>

      <View style={styles.form}>
        <TextField
          label="New Password"
          value={new_password}
          onChangeText={setNewPassword}
          placeholder="Create a strong password"
          secureTextEntry
          showEyeIcon
        />
        <TextField
          label="Confirm Password"
          value={confirm_password}
          onChangeText={setConfirmPassword}
          placeholder="Confirm your password"
          secureTextEntry
          showEyeIcon
          error={showMismatch ? 'Passwords do not match yet.' : undefined}
        />

        <View style={styles.requirement}>
          <View style={styles.requirementIcon}>
            {visuals.securityIcon && <visuals.securityIcon width={16} height={16} color={AUTH_THEME.secondaryText} />}
          </View>
          <Typography variant="caption" color={AUTH_THEME.secondaryText} style={styles.requirementText}>
            {AUTH_TEXT.passwordRequirement}
          </Typography>
        </View>
      </View>

      <View style={styles.footer}>
        <AppButton
          variant={isDisabled ? 'primaryDisabled' : 'primaryLarge'}
          title={copy.buttons.primaryTitle}
          onPress={handleResetPassword}
          disabled={isDisabled}
        />

        <View style={styles.securityFooter}>
          {visuals.securityIcon && <visuals.securityIcon width={15} height={15} color={AUTH_THEME.secondaryText} />}
          <Typography variant="caption" color={AUTH_THEME.secondaryText} style={styles.securityText}>
            {AUTH_TEXT.securityFooter}
          </Typography>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: AUTH_THEME.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_THEME.surface,
  },
  hero: {
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 300,
  },
  form: {
    gap: Spacing.sm,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    backgroundColor: '#EEF1F4',
    marginTop: Spacing.xs,
  },
  requirementIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  requirementText: {
    flex: 1,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: Spacing.xl,
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  securityText: {
    textAlign: 'center',
  },
});

export default NewPassword;
