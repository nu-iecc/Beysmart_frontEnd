import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { AUTH_TEXT, AUTH_THEME, AUTH_VISUALS, type AuthScreenCopy } from '../../design-system/auth/constants';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { TextField } from '../../design-system/inputs';
import { Margin } from '../../design-system/Layout/margins';
import { Padding } from '../../design-system/Layout/padding';
import { Spacing } from '../../design-system/Layout/spacing';
import { AccountSettingsConstants as ACC } from '../../design-system/Profile actions/Constants';
import { Typography } from '../../design-system/typography/typography';
import apiClient from '../../utils/api';


const EnterPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  // Fetch user data for delete account flow
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await apiClient.get('auth/profile/');
        const userData = response.data;
        setUserEmail(userData.email || '');
        setUserPhone(userData.phone_number || '');
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    fetchUserData();
  }, []);

  const handleEnterPassword = async () => {
    try {
      // Ensure CSRF is hydrated for session-protected flow
      try { await apiClient.get('auth/csrf-token/'); } catch {}
      
      // Handle delete account flow - call API to generate OTP
      const requestData = {
        password,
        confirm_password: confirmPassword,
      };
      
      const response = await apiClient.post('auth/request-account-deletion/', requestData);
      
      // Navigate to verify OTP screen for delete account flow
      router.push({
        pathname: '/(auth)/verify-otp' as never,
        params: { 
          email: userEmail, 
          phone_number: userPhone, 
          flow: 'delete-account'
        }
      });
    } catch (error: any) {
      console.error('Password submission failed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || error.message || 'Password submission failed. Please try again.';
      Alert.alert('Submission Failed', errorMessage);
    }
  };

  const isDisabled = !password || !confirmPassword || password !== confirmPassword;

  // Use delete account constants
  const copy = {
    title: ACC.DELETE_ACCOUNT.TITLE,
    subtitle: ACC.DELETE_ACCOUNT.SUBTITLE,
    fields: {
      emailLabel: ACC.DELETE_ACCOUNT.PASSWORD_LABEL,
      emailPlaceholder: ACC.DELETE_ACCOUNT.PASSWORD_PLACEHOLDER,
    },
    buttons: {
      primaryTitle: ACC.DELETE_ACCOUNT.BUTTON_TITLE,
    }
  } as AuthScreenCopy;
  
  const visuals = AUTH_VISUALS.completeRegistration;

  return (
    <View style={{ flex: 1, backgroundColor: AUTH_THEME.background }}>
      {/* Header (fixed) */}
      <View style={{ paddingTop: Spacing.xxl, ...Padding.screenHorizontal }}>
        {/* Back Button */}
        <TouchableOpacity
          style={{
            width: 48,
            height: 48,
            backgroundColor: AUTH_THEME.surface,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: Spacing.lg,
          }}
          onPress={() => router.back()}
        >
          <visuals.backIcon width={24} height={24} color={AUTH_THEME.text} />
        </TouchableOpacity>

        {/* User Icon */}
        <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
          <View
            style={{
              width: 96,
              height: 96,
              backgroundColor: visuals.headerCircleBg || AUTH_THEME.primary,
              borderRadius: 48,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: Spacing.md,
            }}
          >
            <visuals.headerIcon width={32} height={32} color={AUTH_THEME.text} />
          </View>
          
          <Typography variant="h1" style={{ marginBottom: Spacing.xs }}>
            {copy.title}
          </Typography>
          
          <Typography variant="body" color={AUTH_THEME.secondaryText}>
            {copy.subtitle}
          </Typography>
        </View>
      </View>

      {/* Form (scrollable) */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          ...Padding.screenHorizontal,
          paddingBottom: Spacing.xl,
        }}
      >
        {/* Form Fields */}
        <View style={{ ...Margin.betweenComponents }}>
          <TextField
            label={ACC.DELETE_ACCOUNT.PASSWORD_LABEL}
            value={password}
            onChangeText={setPassword}
            placeholder={ACC.DELETE_ACCOUNT.PASSWORD_PLACEHOLDER}
            secureTextEntry={true}
          />
        </View>

        <View style={{ ...Margin.betweenComponents }}>
          <TextField
            label={ACC.DELETE_ACCOUNT.CONFIRM_PASSWORD_LABEL}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={ACC.DELETE_ACCOUNT.CONFIRM_PASSWORD_PLACEHOLDER}
            secureTextEntry={true}
          />
        </View>

        {/* Password Requirements */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          marginTop: Spacing.xs 
        }}>
          {visuals.securityIcon && (
            <visuals.securityIcon width={16} height={16} color={AUTH_THEME.secondaryText} />
          )}
          <Typography 
            variant="caption" 
            color={AUTH_THEME.secondaryText}
            style={{ marginLeft: 4 }}
          >
            {AUTH_TEXT.passwordRequirement}
          </Typography>
        </View>
      </ScrollView>

      {/* Footer (fixed) */}
      <View style={{ ...Padding.screenHorizontal, paddingBottom: Spacing.lg }}>
        <AppButton
          variant={isDisabled ? 'primaryDisabled' : 'primaryLarge'}
          title={copy.buttons.primaryTitle}
          onPress={handleEnterPassword}
          disabled={isDisabled}
        />

        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginTop: Spacing.lg 
        }}>
          {visuals.securityIcon && (
            <visuals.securityIcon width={16} height={16} color={AUTH_THEME.secondaryText} />
          )}
          <Typography 
            variant="caption" 
            color={AUTH_THEME.secondaryText}
            style={{ marginLeft: 4 }}
          >
            {AUTH_TEXT.securityFooter}
          </Typography>
        </View>
      </View>
    </View>
  );
};

export default EnterPassword;

