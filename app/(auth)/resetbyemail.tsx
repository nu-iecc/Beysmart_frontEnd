import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { BASE_URL } from '../../constants/api';
import { AUTH_COPY, AUTH_TEXT, AUTH_THEME, AUTH_VISUALS, type AuthScreenCopy } from '../../design-system/auth/constants';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { TextField } from '../../design-system/inputs';
import { Margin } from '../../design-system/Layout/margins';
import { Padding } from '../../design-system/Layout/padding';
import { Spacing } from '../../design-system/Layout/spacing';
import { Typography } from '../../design-system/typography/typography';
import apiClient from '../../utils/api';

const ResetByEmail = () => {
  const [email, setEmail] = useState('');
  const { fromAccountSettings } = useLocalSearchParams();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const requestData = { email };
      if (fromAccountSettings === 'true') {
        await apiClient.post('auth/request-reset-password/', requestData);
      } else {
        await axios.post(`${BASE_URL}auth/request-reset-password/`, requestData);
      }
      // Navigate to OTP verification screen with user data
      router.push({
        pathname: '/(auth)/verify-otp', 
        params: { email: email, flow: 'reset-password', fromAccountSettings: fromAccountSettings === 'true' ? 'true' : 'false' }
      });
      // For now, just show success
      Alert.alert('Success', 'Verification code sent to your email');
    } catch (error: any) {
      console.error('Failed to send reset code:', error);
      setError(error.response?.data?.message || 'Failed to send code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = !email.trim() || isLoading;

  const copy = AUTH_COPY.resetByEmail as AuthScreenCopy;
  const visuals = AUTH_VISUALS.resetByEmail;
  return (
    <View style={{ flex: 1, backgroundColor: AUTH_THEME.background }}>
      {/* Header */}
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
          onPress={handleBack}
        >
          <visuals.backIcon width={24} height={24} color={AUTH_THEME.text} />
        </TouchableOpacity>

        {/* Email Icon */}
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
          
          {!!copy.subtitle && (
            <Typography variant="body" color={AUTH_THEME.secondaryText}>
              {copy.subtitle}
            </Typography>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          ...Padding.screenHorizontal,
          paddingBottom: Spacing.xl,
        }}
      >
        {/* Email Input Field */}
        <View style={{ ...Margin.betweenComponents }}>
          <Typography variant="body" color={AUTH_THEME.text} style={{ marginBottom: Spacing.xs }}>
            {copy.fields?.emailLabel || 'Email Address'}
          </Typography>
          <TextField
            value={email}
            onChangeText={setEmail}
            placeholder={copy.fields?.emailPlaceholder || 'Your email address'}
          />
          {error ? (
            <Typography variant="caption" color={AUTH_THEME.error} style={{ marginTop: Spacing.xs }}>
              {error}
            </Typography>
          ) : null}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={{ ...Padding.screenHorizontal, paddingBottom: Spacing.lg }}>
        <AppButton
          variant={isDisabled ? 'primaryDisabled' : 'primaryLarge'}
          title={copy.buttons.primaryTitle}
          onPress={handleSendCode}
          disabled={isDisabled}
        />

        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginTop: Spacing.lg 
        }}>
          {visuals.securityIcon ? (
            <visuals.securityIcon width={16} height={16} color={AUTH_THEME.secondaryText} />
          ) : null}
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

export default ResetByEmail;









