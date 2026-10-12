import { Padding } from '@/design-system/Layout/padding';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { BASE_URL } from '../../constants/api';
import { AUTH_COPY, AUTH_TEXT, AUTH_THEME, AUTH_VISUALS } from '../../design-system/auth/constants';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { OTPInputField } from '../../design-system/inputs';
import { Spacing } from '../../design-system/Layout/spacing';
import { AccountSettingsConstants as ACC } from '../../design-system/Profile actions/Constants';
import { Typography } from '../../design-system/typography/typography';
import apiClient, { apiErrorMessage } from '../../utils/api';

const VerifyOTPScreen = () => {
  const { email, phone_number, first_name, last_name, flow, fromAccountSettings } = useLocalSearchParams();
  
  // Use delete account constants if flow is delete-account, otherwise use default verify OTP constants
  const copy = flow === 'delete-account' 
    ? {
        title: ACC.DELETE_ACCOUNT.VERIFY_TITLE,
        subtitleEmail: ACC.DELETE_ACCOUNT.VERIFY_SUBTITLE_EMAIL,
        subtitlePhone: ACC.DELETE_ACCOUNT.VERIFY_SUBTITLE_PHONE,
        resendPrefix: 'Resend code in',
        continueTitle: ACC.DELETE_ACCOUNT.VERIFY_BUTTON_TITLE,
      }
    : AUTH_COPY.verifyOtp as any;
  
  const visuals = AUTH_VISUALS.verifyOtp;
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpError, setOtpError] = useState('');
  
  const handleVerifyOTP = async () => {
    if (isSubmitting || otp.some(digit => !digit)) return;
    setIsSubmitting(true);
    setOtpError('');
    try {
      // Handle delete account flow separately (requires authentication)
      if(flow === 'delete-account'){
        // Handle delete account flow - call authenticated verify-otp API
        try {
          // Ensure CSRF is hydrated for session-protected flow
          try { await apiClient.get('auth/csrf-token/'); } catch {}
          
          // Call the authenticated verify OTP API for delete account
          const otpRequestData = {
            otp: otp.join(''),
            email: email || undefined,
            phone_number: phone_number || undefined,
          };
          
          await apiClient.post('auth/verify-otp-auth/', otpRequestData);
          
          // Clear all user data from AsyncStorage
          await AsyncStorage.multiRemove([
            'isAuthenticated',
            'userData', 
            'loginMethod',
            'csrftoken',
            'twoFactorEnabled'
          ]);
          
          // Show success message
          Alert.alert(
            'Account Deletion Requested', 
            'Your account deletion has been requested. Your account will be soft deleted for 60 days and then permanently deleted. You have been logged out.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Navigate to welcome page and reset navigation stack
                  router.replace('/');
                }
              }
            ]
          );
        } catch (deleteError: any) {
          console.error('Account deletion request failed:', deleteError);
          const errorMessage = deleteError.response?.data?.message || deleteError.message || 'Account deletion request failed. Please try again.';
          Alert.alert('Deletion Request Failed', errorMessage);
        }
      }
      else {
        // Handle all other flows (register, reset-password, login) - no authentication required
        const requestData = {
          otp: otp.join(''),
          email: email || undefined,
          phone_number: phone_number || undefined,
        };

        const response = fromAccountSettings === 'true'
          ? await apiClient.post('auth/verify-otp/', requestData)
          : await axios.post(`${BASE_URL}auth/verify-otp/`, requestData);
          
        if(flow === 'register' || response.data.next === 'create_password'){
          router.push({
            pathname: '/(auth)/Complete-Registeration',
            params: { 
              email: email, 
              phone_number: phone_number,
              first_name: first_name,
              last_name: last_name,
              flow: response.data.next === 'create_password' ? 'guest-invite' : 'register',
            }
          });
        }
        else if(flow === 'reset-password'){
          router.push({
            pathname: '/(auth)/newpassword',
            params: { email: email, phone_number: phone_number, fromAccountSettings: fromAccountSettings === 'true' ? 'true' : 'false' }
          });
        }
        else if(flow === 'login'){
          // The user is already logged in by your verify_otp_view backend
          // Just store the user data and navigate to home
          if(response.data.user) {
            // Store user data in AsyncStorage
            await AsyncStorage.setItem('isAuthenticated', 'true');
            await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
            await AsyncStorage.setItem('loginMethod', 'phone');
            
            // Store CSRF token if provided
            if(response.data.csrf_token) {
              await AsyncStorage.setItem('csrftoken', response.data.csrf_token);
            }
          }
          
          // Navigate to home/main app screen
          router.replace('/(app)/home'); // or whatever your main screen route is
        }
        
        // Show success message for non-delete flows
        Alert.alert('Success', response.data.message);
      }
      
  
    } catch (error: any) {
      console.error('OTP verification failed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = apiErrorMessage(error, 'OTP verification failed. Please try again.');
      setOtpError(errorMessage);
      Alert.alert('OTP Verification Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleResendCode = async () => {
    if (!canResend || isSubmitting) return;
    setIsSubmitting(true);
    setOtpError('');
    try {
      if (flow === 'register') {
        await axios.post(`${BASE_URL}auth/register/`, { email, phone_number, first_name, last_name });
      } else if (flow === 'login') {
        await axios.post(`${BASE_URL}auth/phone-login/`, { phone_number });
      } else {
        setOtpError('Go back to the previous screen to request a new code.');
        return;
      }
      setOtp(['', '', '', '']);
      setTimer(59);
      setCanResend(false);
      Alert.alert('Code Resent', 'A new verification code has been requested. Use the latest code you receive.');
    } catch (error) {
      setOtpError(apiErrorMessage(error, 'Unable to resend the code. Please try again.'));
    } finally { setIsSubmitting(false); }
  };



  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <View style={{ flex: 1, backgroundColor: AUTH_THEME.background }}>
    {/* Header (fixed) */}
    <View style={{ paddingTop: Spacing.xxl, ...Padding.screenHorizontal }}>
      {/* Back Button */}
      <TouchableOpacity
        style={{
          width: 48, // icon container 48px (6x base unit)
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
      </View>

      {/* Main Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          alignItems: 'center',
          paddingHorizontal: Spacing.md,
          paddingTop: Spacing.xl,
          paddingBottom: Spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon Circle */}
        <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
          <View
            style={{
              width: 96, // 12x base unit
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
          </View>
          

        {/* Title */}
        <Typography variant="h3" style={{
          textAlign: 'center',
          marginBottom: Spacing.sm,
          color: AUTH_THEME.text,
        }}>
          {flow === 'register' ? 'Verify Your Account' : copy.title}
        </Typography>

        {/* Subtitle */}
        <Typography variant="body" style={{
          textAlign: 'center',
          marginBottom: Spacing.xl,
          color: AUTH_THEME.secondaryText,
          paddingHorizontal: Spacing.md,
        }}>
          {flow === 'register' ? 'Enter the latest code sent to your email or WhatsApp. The code expires after 5 minutes.' : phone_number ? (copy.subtitlePhone || '') : (copy.subtitleEmail || '')}
        </Typography>

        {/* OTP Input Fields */}
        <View style={{
          width: '100%',
          marginBottom: Spacing.lg,
          paddingHorizontal: Spacing.md,
        }}>
          <OTPInputField
            length={4}
            value={otp}
            onChange={setOtp}
            autoFocus={true}
            onComplete={(value: string) => {
              // OTP is complete, you can handle this here
            }}
          />
        </View>

        {/* Resend Timer */}
        <TouchableOpacity 
          style={{
            marginBottom: Spacing.lg,
          }} 
          onPress={handleResendCode}
          disabled={!canResend || isSubmitting}
        >
          <Typography variant="body" style={{
            color: AUTH_THEME.secondaryText,
          }}>
            {canResend ? 'Resend code' : copy.resendPrefix}{' '}
            <Typography variant="body" style={{
              fontWeight: '700',
              color: AUTH_THEME.text,
            }}>
              {canResend ? '' : `${timer}s`}
            </Typography>
          </Typography>
        </TouchableOpacity>

        {/* Continue Button */}
        {!!otpError && <Typography variant="body" color="#B42318" accessibilityRole="alert" style={{ marginBottom: 16, textAlign: 'center' }}>{otpError}</Typography>}
        <AppButton
          variant="primaryLarge"
          title={isSubmitting ? 'Please wait...' : copy.continueTitle}
          icon={visuals.actionIcon ? <visuals.actionIcon width={15} height={15} color={AUTH_THEME.text} /> : undefined}
          onPress={handleVerifyOTP}
          disabled={!isOtpComplete || isSubmitting}
        />

        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginTop: Spacing.xl 
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
      </ScrollView>
    </View>
  );
};

export default VerifyOTPScreen;
