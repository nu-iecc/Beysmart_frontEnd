import axios from "axios";
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { BASE_URL } from '../../constants/api';
import apiClient, { apiErrorMessage } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_COPY, AUTH_COUNTRIES, AUTH_TEXT, AUTH_THEME, AUTH_VISUALS, type AuthScreenCopy } from '../../design-system/auth/constants';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { colors } from '../../design-system/colors';
import { TextField } from '../../design-system/inputs';
import { Margin } from '../../design-system/Layout/margins';
import { Padding } from '../../design-system/Layout/padding';
import { Spacing } from '../../design-system/Layout/spacing';
import { Typography } from '../../design-system/typography/typography';


const CompleteRegisteration = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { email, phone_number, first_name, last_name, flow } = useLocalSearchParams();
  const isGuest = flow === 'guest-invite';
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState(AUTH_COUNTRIES[0]);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [registrationError, setRegistrationError] = useState('');

  const handleCompleteRegisteration = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setRegistrationError('');
    try {
      const requestData = {
        first_name: isGuest ? guestFirstName.trim() : first_name,
        last_name: isGuest ? guestLastName.trim() : last_name,
        email: email || guestEmail.trim().toLowerCase(),
        phone_number: phone_number || `${phoneCountry.dial}${phoneCountry.code === 'IT' ? guestPhone.replace(/\D/g, '') : guestPhone.replace(/\D/g, '').replace(/^0+/, '')}`,
        password,
        confirm_password: confirmPassword,
       
        user_type: 'CUSTOMER', // Default to customer
      };
      
      if (isGuest) {
        const { data } = await apiClient.post('auth/guest-invite/complete/', requestData);
        if (!data.user) throw new Error('Account creation did not return a user. Please try logging in.');
        await AsyncStorage.multiSet([['userData', JSON.stringify(data.user)], ['isAuthenticated', 'true']]);
        if (data.csrf_token) await AsyncStorage.setItem('csrftoken', data.csrf_token);
        router.replace('/(app)/home');
        return;
      }
      const response = await axios.post(`${BASE_URL}auth/complete-registration/`, requestData);
      router.push({
        pathname: '/(auth)/ProfilePhoto' as never,
        params: { email: email, phone_number: phone_number }
      });
     
      
    } catch (error: any) {
      console.error('Registration completion failed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = apiErrorMessage(error, 'Registration completion failed. Please try again.');
      setRegistrationError(errorMessage);
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = !password || !confirmPassword || password !== confirmPassword || isLoading ||
    (isGuest && (!guestFirstName.trim() || !guestLastName.trim() || !(email || guestEmail.trim()) || !(phone_number || guestPhone.trim())));

  const copy = AUTH_COPY.completeRegistration as AuthScreenCopy;
  const visuals = AUTH_VISUALS.completeRegistration;

  return (
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
            {isGuest ? 'Set your password' : copy.title}
          </Typography>
          
          <Typography variant="body" color={AUTH_THEME.secondaryText} style={{ textAlign: 'center' }}>
            {isGuest ? 'Your code is verified. Complete your details to access your shared locks.' : copy.subtitle}
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
        {isGuest && <View style={{ gap: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><TextField label="First name" value={guestFirstName} onChangeText={setGuestFirstName} /></View>
            <View style={{ flex: 1 }}><TextField label="Last name" value={guestLastName} onChangeText={setGuestLastName} /></View>
          </View>
          {!email && <TextField label="Email" value={guestEmail} onChangeText={setGuestEmail} />}
          {!phone_number && <>
            <TextField label="Phone number" value={guestPhone} onChangeText={setGuestPhone} placeholder="Enter your phone number"
              leftIcon={<TouchableOpacity accessibilityRole="button" accessibilityLabel="Choose country code" onPress={() => setCountryPickerVisible(value => !value)} style={{ paddingRight: 10, marginRight: 8, borderRightWidth: 1, borderRightColor: AUTH_THEME.border }}>
                <Typography variant="body">{phoneCountry.dial} ▾</Typography>
              </TouchableOpacity>} />
            {countryPickerVisible && <View style={{ backgroundColor: AUTH_THEME.surface, padding: 12, borderRadius: 12 }}>
              {AUTH_COUNTRIES.map(country => <TouchableOpacity key={country.code} accessibilityRole="button" style={{ paddingVertical: 10 }} onPress={() => { setPhoneCountry(country); setCountryPickerVisible(false); }}>
                <Typography variant="body">{country.name} ({country.dial})</Typography>
              </TouchableOpacity>)}
            </View>}
          </>}
        </View>}
        <View style={{ ...Margin.betweenComponents }}>
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a strong password"
            secureTextEntry={true}
            showEyeIcon
          />
        </View>

        <View style={{ ...Margin.betweenComponents }}>
          <TextField
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            secureTextEntry={true}
            showEyeIcon
          />
        </View>

        {!!registrationError && <Typography variant="body" color={colors.error} accessibilityRole="alert">{registrationError}</Typography>}
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
          title={isLoading ? 'Creating Account...' : isGuest ? 'Save password and continue' : copy.buttons.primaryTitle}
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
  );
};

export default CompleteRegisteration;
