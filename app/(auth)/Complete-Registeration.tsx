import AuthScreen from '@/components/AuthScreen';
import { AUTH_COUNTRIES } from '../../design-system/auth/constants';
import axios from "axios";
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { BASE_URL } from '../../constants/api';
import { AUTH_COPY, AUTH_TEXT, AUTH_THEME, AUTH_VISUALS, type AuthScreenCopy } from '../../design-system/auth/constants';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { colors } from '../../design-system/colors';
import { TextField } from '../../design-system/inputs';
import { Margin } from '../../design-system/Layout/margins';
import { Padding } from '../../design-system/Layout/padding';
import { Spacing } from '../../design-system/Layout/spacing';
import { Typography } from '../../design-system/typography/typography';
import { validatePasswordMatch, validatePasswordStrength } from '../../utils/passwordValidation';


const CompleteRegisteration = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { email, phone_number, first_name, last_name } = useLocalSearchParams();

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (text) {
      const validation = validatePasswordStrength(text);
      setPasswordError(validation.isValid ? '' : validation.message);
    } else {
      setPasswordError('');
    }
    // Auto-validate confirm password if it exists
    if (confirmPassword) {
      const matchValidation = validatePasswordMatch(text, confirmPassword);
      setConfirmPasswordError(matchValidation.isMatch ? '' : matchValidation.message);
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (text) {
      const matchValidation = validatePasswordMatch(password, text);
      setConfirmPasswordError(matchValidation.isMatch ? '' : matchValidation.message);
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleCompleteRegisteration = async () => {
    setIsLoading(true);
    try {
      const requestData = {
        first_name: first_name,
        last_name: last_name,
        email: email, // This should come from previous screen
        phone_number: phone_number, // This should come from previous screen
        password,
        confirm_password: confirmPassword,

        user_type: 'CUSTOMER', // Default to customer
      };

      const response = await axios.post(`${BASE_URL}auth/complete-registration/`, requestData);
      router.push({
        pathname: '/(auth)/ProfilePhoto' as never,
        params: { email: email, phone_number: phone_number }
      });


    } catch (error: any) {
      console.error('Registration completion failed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || error.message || 'Registration completion failed. Please try again.';
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = !password || !confirmPassword || passwordError !== '' || confirmPasswordError !== '' || isLoading;

  const copy = AUTH_COPY.completeRegistration as AuthScreenCopy;
  const visuals = AUTH_VISUALS.completeRegistration;

  return (((
    <View style={{ flex: 1, backgroundColor: AUTH_THEME.background, width: '100%', maxWidth: 480, alignSelf: 'center' }}>
      {/* Header (fixed) */}
      <View style={{ paddingTop: Spacing.lg, ...Padding.screenHorizontal }}>
        {/* Back Button */}
        <TouchableOpacity
          style={{
            width: 44,
            height: 44,
            backgroundColor: AUTH_THEME.surface,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: Spacing.lg,
          }}
          onPress={() => router.back()}
        >
          <visuals.backIcon width={24} height={24} color={AUTH_THEME.text} />
        </TouchableOpacity>

        {/* User Icon */}
        <View style={{ alignItems: 'center', marginBottom: Spacing.xl, paddingHorizontal: Spacing.sm }}>
          <View
            style={{
              width: 72,
              height: 72,
              backgroundColor: visuals.headerCircleBg || AUTH_THEME.primary,
              borderRadius: 36,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: Spacing.md,
            }}
          >
            <visuals.headerIcon width={32} height={32} color={AUTH_THEME.text} />
          </View>

          <Typography variant="h1" style={{ marginBottom: Spacing.xs, textAlign: 'center' }}>
            {copy.title}
          </Typography>

          <Typography variant="body" color={AUTH_THEME.secondaryText} style={{ textAlign: 'center' }}>
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
            label="Password"
            value={password}
            onChangeText={handlePasswordChange}
error={passwordError}
            placeholder="Create a strong password"
            secureTextEntry={true}
            showEyeIcon
          />
        </View>

        <View style={{ ...Margin.betweenComponents }}>
          <TextField
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
error={confirmPasswordError}
            placeholder="Confirm your password"
            secureTextEntry={true}
            showEyeIcon
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
          title={isLoading ? 'Creating Account...' : copy.buttons.primaryTitle}
          icon={isLoading ? (
            <ActivityIndicator
              size="small"
              color={AUTH_THEME.text}
              style={{ marginRight: Spacing.xs }}
            />
          ) : undefined}
          onPress={handleCompleteRegisteration}
          disabled={isDisabled}
        />

        {/* Loading Message */}
        {isLoading && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: Spacing.md
          }}>
            <ActivityIndicator
              size="small"
              color={colors.primary.darker}
              style={{ marginRight: Spacing.xs }}
            />
            <Typography
              variant="caption"
              color={colors.primary.darker}
            >
              Creating your account...
            </Typography>
          </View>
        )}

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
  )));
};

export default CompleteRegisteration;

