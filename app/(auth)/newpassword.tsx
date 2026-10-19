import axios from "axios";
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


const newpassword = () => {
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

  const copy = AUTH_COPY.newPassword as AuthScreenCopy;
  const visuals = AUTH_VISUALS.newPassword;

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
            label="New Password"
            value={new_password}
            onChangeText={setNewPassword}
            placeholder="Create a strong password"
            secureTextEntry={true}
          />
        </View>

        <View style={{ ...Margin.betweenComponents }}>
          <TextField
            label="Confirm Password"
            value={confirm_password}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            secureTextEntry={true}
          />
        </View>

        {/* Password Requirements */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          marginTop: Spacing.xs 
        }}>
          {visuals.securityIcon ? (
            <visuals.securityIcon width={16} height={16} color={AUTH_THEME.secondaryText} />
          ) : null}
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
          onPress={handleResetPassword}
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

export default newpassword;

