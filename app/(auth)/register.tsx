import axios from "axios";
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { BASE_URL } from '../../constants/api';
import { apiErrorMessage } from '@/utils/api';

// Design System imports
import { AUTH_COPY, AUTH_COUNTRIES, AUTH_TEXT, AUTH_THEME, AUTH_VISUALS, type AuthScreenCopy } from '../../design-system/auth/constants';
import { AppButton } from '../../design-system/Buttons/Buttons';
// Icons will be sourced from AUTH_VISUALS
import TextField from '../../design-system/inputs/TextField';
import { Margin } from '../../design-system/Layout/margins';
import { Padding } from '../../design-system/Layout/padding';
import { Spacing } from '../../design-system/Layout/spacing';
import { Typography } from '../../design-system/typography/typography';

 export default function Register()  {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const countries = AUTH_COUNTRIES;
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [registrationError, setRegistrationError] = useState('');

  // Email validation function - requires .com domain
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.com$/;
    return emailRegex.test(email);
  };

  // Handle email input change with validation
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (text.length > 0 && !validateEmail(text)) {
      setEmailError('Please enter a valid email address(e.g., user@example.com)');
    } else {
      setEmailError('');
    }
  };

  const handleRegister = async () => {
    setRegistrationError('');
    try {
      const requestData = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phoneNumber,
        country: selectedCountry.name,
      };
      
      const response = await axios.post(`${BASE_URL}auth/register/`, requestData, {
        timeout: 15000, // 15 seconds timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      router.push({
        pathname: '/(auth)/verify-otp', 
        params: {
          email: email, 
          phone_number: phoneNumber, 
          first_name: firstName,
          last_name: lastName,
          flow: 'register'
        }
      });
      
    }  catch (error: any) {
      const errorMessage = apiErrorMessage(error, 'Registration failed. Please check your connection and try again.');
      setRegistrationError(errorMessage);
      Alert.alert('Registration Failed', errorMessage);
    }
  }
  const isDisabled = !firstName || !lastName || !email || !phoneNumber || emailError !== '';

  const copy = AUTH_COPY.register as AuthScreenCopy;

  const visuals = AUTH_VISUALS.register;

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

        {/* User Icon */}
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

      {/* Form (scrollable) */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          ...Padding.screenHorizontal,
          paddingBottom: Spacing.xl,
        }}
      >
        {/* Form Fields */}
        {/* First Name and Last Name - Side by Side */}
        <View style={{ ...Margin.betweenComponents }}>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <View style={{ flex: 1 }}>
              <TextField
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Your first name"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Your last name"
              />
            </View>
          </View>
        </View>

        <View style={{ ...Margin.betweenComponents }}>
          <TextField
            label={copy.fields?.emailLabel || 'Email Address'}
            value={email}
            onChangeText={handleEmailChange}
            placeholder={copy.fields?.emailPlaceholder || 'Your email address'}
            error={emailError}
            keyboardType="email-address"
          />
        </View>

        <View style={{ ...Margin.betweenComponents }}>
          <View style={{ marginBottom: Spacing.xs }}>
            <Typography variant="body" style={{ marginBottom: Spacing.xs }}>
              {copy.fields?.countryRegionLabel || 'Country/Region'}
            </Typography>
          </View>
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: AUTH_THEME.border,
              borderRadius: 8,
              paddingHorizontal: Spacing.sm, // 16px input horizontal padding
              paddingVertical: 12, // matches TextField content height guidance
              backgroundColor: AUTH_THEME.surface,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            onPress={() => setCountryPickerVisible(true)}
          >
            <Typography variant="body" style={{ fontWeight: 'bold' }}>
              {selectedCountry.name}
            </Typography>
            {visuals.dropdownIcon ? (
              <visuals.dropdownIcon width={16} height={16} color={AUTH_THEME.secondaryText} />
            ) : null}
          </TouchableOpacity>
        </View>

        <View style={{ ...Margin.betweenComponents }}>
          <TextField
            label={copy.fields?.phoneLabel || 'Phone number'}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder={copy.fields?.phonePlaceholder || '(123) 456-7890'}
            leftIcon={
              <View style={{ 
                paddingRight: 8, 
                borderRightWidth: 1, 
                borderRightColor: AUTH_THEME.border,
                marginRight: 8
              }}>
                <Typography variant="body" style={{ fontWeight: 'bold' }}>
                  {selectedCountry.dial}
                </Typography>
              </View>
            }
          />
          
          {/* WhatsApp Info */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginTop: Spacing.xs 
          }}>
            <visuals.headerIcon width={16} height={16} color={AUTH_THEME.secondaryText} />
            <Typography 
              variant="caption" 
              color={AUTH_THEME.secondaryText}
              style={{ marginLeft: 4 }}
            >
              {AUTH_TEXT.whatsappHint}
            </Typography>
          </View>
        </View>
        {!!registrationError && <Typography variant="body" color="#B42318" accessibilityRole="alert">{registrationError}</Typography>}
      </ScrollView>

      {/* Country Picker Modal */}
      <Modal
        visible={countryPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCountryPickerVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: AUTH_THEME.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.md }}>
            <View style={{ alignItems: 'flex-end', marginBottom: Spacing.xs }}>
              <TouchableOpacity onPress={() => setCountryPickerVisible(false)}>
                <Typography variant="accent" color={AUTH_THEME.secondaryText}>Close</Typography>
              </TouchableOpacity>
            </View>
            <Typography variant="h3" style={{ marginBottom: Spacing.sm }}>Select Country/Region</Typography>
            <ScrollView>
              {countries.map((c) => (
                <TouchableOpacity
                  key={c.name}
                  onPress={() => { setSelectedCountry(c); setCountryPickerVisible(false); }}
                  style={{ paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: AUTH_THEME.border }}
                >
                  <Typography variant="body">{c.name}</Typography>
                  <Typography variant="body" color={AUTH_THEME.secondaryText}>{c.dial}</Typography>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Footer (fixed) */}
      <View style={{ ...Padding.screenHorizontal, paddingBottom: Spacing.lg }}>
        <AppButton
          variant={isDisabled ? 'primaryDisabled' : 'primaryLarge'}
          title={copy.buttons.primaryTitle}
          onPress={handleRegister}
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





