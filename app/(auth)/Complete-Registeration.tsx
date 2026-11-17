import { AUTH_COUNTRIES } from '../../design-system/auth/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from "axios";
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import BiometricSetupModal from '../../components/BiometricSetupModal';
import { biometricsService } from '../../services';
import apiClient from '../../utils/api';
import { validatePasswordMatch, validatePasswordStrength } from '../../utils/passwordValidation';


const CompleteRegisteration = () => {
  const navigation = useNavigation();
  const mounted = useRef(false);
  const focusVersion = useRef(0);
  const biometricFocusVersion = useRef(0);
  const busyRef = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => navigation.addListener?.('beforeRemove', event => {
    if (busyRef.current) event.preventDefault();
  }), [navigation]);

  const isCurrent = (version: number) =>
    mounted.current && navigation.isFocused() && focusVersion.current === version;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { email, phone_number, first_name, last_name, flow } = useLocalSearchParams<{
    email?: string; phone_number?: string; first_name?: string; last_name?: string; flow?: string;
  }>();
  const isGuest = flow === 'guest-invite';
  const [guestEmail, setGuestEmail] = useState(email || '');
  const [guestFirstName, setGuestFirstName] = useState(first_name || '');
  const [guestLastName, setGuestLastName] = useState(last_name || '');
  const [guestPhone, setGuestPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState(AUTH_COUNTRIES[0]);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricPhone, setBiometricPhone] = useState('');

  useFocusEffect(useCallback(() => {
    if (focusVersion.current !== biometricFocusVersion.current) {
      setShowBiometricModal(false);
    }
    return () => { focusVersion.current += 1; };
  }, []));

  const guestPhoneDigits = guestPhone.replace(/\D/g, '');
  const nationalPhoneDigits = phoneCountry.code === 'IT' ? guestPhoneDigits : guestPhoneDigits.replace(/^0+/, '');
  const fullGuestPhone = phone_number || `${phoneCountry.dial}${nationalPhoneDigits}`;

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
    if (busyRef.current || isDisabled) return;
    const version = focusVersion.current;
    busyRef.current = true;
    setIsLoading(true);
    try {
      const requestData = {
        first_name: isGuest ? guestFirstName.trim() : first_name,
        last_name: isGuest ? guestLastName.trim() : last_name,
        email: isGuest ? guestEmail.trim().toLowerCase() : email,
        phone_number: isGuest ? fullGuestPhone : phone_number,
        password,
        confirm_password: confirmPassword,

        user_type: 'CUSTOMER', // Default to customer
      };

      if (isGuest) {
        const { data, status } = await apiClient.post('auth/guest-invite/complete/', requestData, {
          validateStatus: status => (status >= 200 && status < 300) || status === 401 || status === 403,
        });
        if (!isCurrent(version)) return;
        if (status === 401 || status === 403) {
          Alert.alert('Registration Failed', 'Unable to complete your invitation. Please check your details and try again. If your account was created, please log in.');
          return;
        }
        if (data?.success === false) {
          Alert.alert('Registration Failed', 'Unable to complete your invitation. If your account was created, please log in.');
          return;
        }
        const id = data?.user?.id;
        const hasValidId = (typeof id === 'string' && id.trim().length > 0) ||
          (typeof id === 'number' && Number.isSafeInteger(id));
        if (!data?.user || typeof data.user !== 'object' || Array.isArray(data.user) || !hasValidId) {
          Alert.alert('Unable to complete sign in', 'Your account may have been created, but the server did not return a valid user ID. Please log in to continue.');
          return;
        }
        const user = {
          ...data.user,
          email: data.user.email || requestData.email,
          phone_number: data.user.phone_number || fullGuestPhone,
        };
        await AsyncStorage.multiSet([
          ['userData', JSON.stringify(user)],
          ['loginMethod', 'email'],
          ...(data.csrf_token ? [['csrftoken', data.csrf_token] as [string, string]] : []),
        ]);
        await AsyncStorage.setItem('isAuthenticated', 'true');
        if (!isCurrent(version)) return;
        setBiometricPhone(user.phone_number);

        // Biometric checks are optional after account creation; a failure must not
        // turn a completed registration into a second submission.
        try {
          await biometricsService.resetBiometricAttempts();
          // The existing biometric service cannot resolve a numeric zero user ID.
          if (user.id !== 0 && await biometricsService.isFirstLogin() && await biometricsService.canSetupBiometrics()) {
            if (!isCurrent(version)) return;
            biometricFocusVersion.current = version;
            setShowBiometricModal(true);
            return;
          }
        } catch {
          // The authenticated user can set up biometrics later in settings.
        }
        if (!isCurrent(version)) return;
        busyRef.current = false;
        router.replace('/(app)/home');
        return;
      }

      await axios.post(`${BASE_URL}auth/complete-registration/`, requestData);
      if (!isCurrent(version)) return;
      busyRef.current = false;
      router.push({
        pathname: '/(auth)/ProfilePhoto' as never,
        params: { email: email, phone_number: phone_number }
      });


    } catch (error: any) {
      if (!isCurrent(version)) return;
      const errorMessage = isGuest
        ? 'Unable to complete your invitation. Please check your details and try again. If your account was created, please log in.'
        : error.response?.data?.message || error.message || 'Registration completion failed. Please try again.';
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      busyRef.current = false;
      if (mounted.current) setIsLoading(false);
    }
  };

  const isDisabled = !password || !confirmPassword || passwordError !== '' || confirmPasswordError !== '' || isLoading ||
    (isGuest && (!guestFirstName.trim() || !guestLastName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim()) ||
      (!phone_number && (nationalPhoneDigits.length < 6 || fullGuestPhone.replace(/\D/g, '').length > 15))));

  const copy = AUTH_COPY.completeRegistration as AuthScreenCopy;
  const visuals = AUTH_VISUALS.completeRegistration;

  return (((
    <View style={{ flex: 1, backgroundColor: AUTH_THEME.background, width: '100%', maxWidth: 480, alignSelf: 'center' }}>
      {/* Header (fixed) */}
      <View style={{ paddingTop: Spacing.lg, ...Padding.screenHorizontal }}>
        {/* Back Button */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back"
          accessibilityState={{ disabled: isLoading }}
          disabled={isLoading}
          style={{
            width: 44,
            height: 44,
            backgroundColor: AUTH_THEME.surface,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: Spacing.lg,
          }}
          onPress={() => { if (!busyRef.current) router.back(); }}
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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          ...Padding.screenHorizontal,
          paddingBottom: Spacing.xl,
        }}
      >
        {/* Form Fields */}
        {isGuest && <View style={{ ...Margin.betweenComponents }}>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <View style={{ flex: 1 }}><TextField label="First name" value={guestFirstName} onChangeText={setGuestFirstName} /></View>
            <View style={{ flex: 1 }}><TextField label="Last name" value={guestLastName} onChangeText={setGuestLastName} /></View>
          </View>
          {!email && <TextField label="Email" value={guestEmail} onChangeText={setGuestEmail} keyboardType="email-address" />}
          {!phone_number && <>
            <TextField
              label="Phone number"
              value={guestPhone}
              onChangeText={setGuestPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              leftIcon={<TouchableOpacity accessibilityRole="button" accessibilityLabel="Choose country code" onPress={() => setCountryPickerVisible(!countryPickerVisible)}>
                <Typography variant="body">{phoneCountry.dial} ▾</Typography>
              </TouchableOpacity>}
            />
            {countryPickerVisible && <View style={{ backgroundColor: AUTH_THEME.surface, padding: Spacing.sm, borderRadius: 12 }}>
              {AUTH_COUNTRIES.map(country => <TouchableOpacity key={country.code} accessibilityRole="button" style={{ paddingVertical: Spacing.xs }} onPress={() => {
                setPhoneCountry(country);
                setCountryPickerVisible(false);
              }}>
                <Typography variant="body">{country.name} ({country.dial})</Typography>
              </TouchableOpacity>)}
            </View>}
          </>}
        </View>}

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
      <BiometricSetupModal
        visible={showBiometricModal}
        phoneNumber={biometricPhone}
        onClose={() => { if (isCurrent(biometricFocusVersion.current)) { setShowBiometricModal(false); router.replace('/(app)/home'); } }}
        onSkip={() => { if (isCurrent(biometricFocusVersion.current)) { setShowBiometricModal(false); router.replace('/(app)/home'); } }}
        onEnable={() => {
          const version = biometricFocusVersion.current;
          if (!isCurrent(version)) return;
          setShowBiometricModal(false);
          Alert.alert('Biometrics Enabled', 'You can now use biometric authentication to login.', [
            { text: 'OK', onPress: () => { if (isCurrent(version)) router.replace('/(app)/home'); } },
          ]);
        }}
      />
    </View>
  )));
};

export default CompleteRegisteration;

