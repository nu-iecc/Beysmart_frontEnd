import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { BASE_URL } from '../../constants/api';
import { AUTH_COPY, AUTH_COUNTRIES, AUTH_TEXT, AUTH_THEME, AUTH_VISUALS, type AuthScreenCopy } from '../../design-system/auth/constants';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { colors } from '../../design-system/colors/colors';
import { TextField } from '../../design-system/inputs';
import { Margin } from '../../design-system/Layout/margins';
import { Padding } from '../../design-system/Layout/padding';
import { Spacing } from '../../design-system/Layout/spacing';
import { Typography } from '../../design-system/typography/typography';
import apiClient from '../../utils/api';

// Country data from design system constants
const countries = AUTH_COUNTRIES.map(c => ({ name: c.name, code: c.dial }));

export default function ResetByPhone() {
  const copy = AUTH_COPY.resetByPhone as AuthScreenCopy;
  const { fromAccountSettings } = useLocalSearchParams();
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Default to Egypt
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const visuals = AUTH_VISUALS.resetByPhone;

  const handleBack = () => {
    router.back();
  };

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Combine country code with phone number
      const fullPhoneNumber = `${selectedCountry.code}${phoneNumber.replace(/\D/g, '')}`;
      
      const requestData = {
        phone_number: fullPhoneNumber,
      };
      
      if (fromAccountSettings === 'true') {
        await apiClient.post('auth/request-reset-password/', requestData);
      } else {
        await axios.post(`${BASE_URL}auth/request-reset-password/`, requestData);
      }
      // Navigate to OTP verification screen with user data
      router.push({
        pathname: '/(auth)/verify-otp', 
        params: { phone_number: fullPhoneNumber, country: selectedCountry.name, flow: 'reset-password', fromAccountSettings: fromAccountSettings === 'true' ? 'true' : 'false' }
      });
      
    } catch (error: any) {
      console.error('Failed to send reset code:', error);
      setError(error.response?.data?.error || 'Failed to send code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectCountry = (country: any) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
  };

  const isDisabled = !phoneNumber.trim() || isLoading;

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

        {/* Phone Icon */}
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
        {/* Country/Region Dropdown */}
        <View style={{ ...Margin.betweenComponents }}>
          <Typography variant="body" color={AUTH_THEME.text} style={{ marginBottom: Spacing.xs }}>
            {copy.fields?.countryRegionLabel || 'Country/Region'}
          </Typography>
          <TouchableOpacity
            style={{
              backgroundColor: AUTH_THEME.surface,
              borderRadius: 12,
              padding: Spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: AUTH_THEME.border,
            }}
            onPress={() => setShowCountryPicker(true)}
          >
            <Typography variant="body" color={colors.text}>
              {selectedCountry.name}
            </Typography>
            {visuals.dropdownIcon ? (
              <visuals.dropdownIcon width={20} height={20} color={AUTH_THEME.secondaryText} />
            ) : null}
          </TouchableOpacity>
        </View>

        {/* Phone Number Input */}
        <View style={{ ...Margin.betweenComponents }}>
          <Typography variant="body" color={AUTH_THEME.text} style={{ marginBottom: Spacing.xs }}>
            {copy.fields?.phoneLabel || 'Phone number'}
          </Typography>
          <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
            {/* Country Code */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: AUTH_THEME.border,
                minWidth: 80,
                paddingHorizontal: Spacing.sm,
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body" color={AUTH_THEME.text}>
                {selectedCountry.code}
              </Typography>
            </View>
            
            {/* Phone Number Field */}
            <View style={{ flex: 1 }}>
              <TextField
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder={copy.fields?.phonePlaceholder || '(123) 456-7890'}
                keyboardType="phone-pad"
              />
            </View>
          </View>
          
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

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end'
        }}>
          <View style={{ 
            backgroundColor: AUTH_THEME.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: Spacing.lg,
            maxHeight: '70%'
          }}>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: Spacing.lg
            }}>
              <Typography variant="h2">Select Country</Typography>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Typography variant="body" color={AUTH_THEME.primary}>Cancel</Typography>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={countries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    padding: Spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: AUTH_THEME.border,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onPress={() => selectCountry(item)}
                >
                  <Typography variant="body">{item.name}</Typography>
                  <Typography variant="body" color={AUTH_THEME.secondaryText}>{item.code}</Typography>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};



