import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { AUTH_COPY, AUTH_THEME, AUTH_VISUALS, type AuthScreenCopy } from '../../design-system/auth/constants';
import { BackArrow, EmailIcon, WhatsappIcon } from '../../design-system/icons';
import { Padding } from '../../design-system/Layout/padding';
import { Spacing } from '../../design-system/Layout/spacing';
import { Typography } from '../../design-system/typography/typography';

const ResetPassword = () => {
  const { fromAccountSettings } = useLocalSearchParams();

  const handleEmailReset = () => {
    // Will redirect to resetbyemail screen (to be created later)
    router.push({
      pathname: '/(auth)/resetbyemail',
      params: { fromAccountSettings: fromAccountSettings === 'true' ? 'true' : 'false' }
    } as never);
  };

  const handlePhoneReset = () => {
    // Will redirect to resetbyphone screen (to be created later)
    router.push({
      pathname: '/(auth)/resetbyphone',
      params: { fromAccountSettings: fromAccountSettings === 'true' ? 'true' : 'false' }
    } as never);
  };

  const handleBack = () => {
    router.back();
  };

  const copy = AUTH_COPY.resetPassword as AuthScreenCopy;
  const visuals = AUTH_VISUALS.resetPassword;

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

        {/* Screwdriver Icon */}
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

      {/* Content */}
      <View style={{ flex: 1, ...Padding.screenHorizontal }}>
        {/* Email Option */}
        <TouchableOpacity
          style={{
            backgroundColor: AUTH_THEME.surface,
            borderRadius: 12,
            padding: Spacing.md,
            marginBottom: Spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          onPress={handleEmailReset}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 48,
                height: 48,
                backgroundColor: AUTH_THEME.background,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: Spacing.md,
              }}
            >
              <EmailIcon width={24} height={24} color={AUTH_THEME.text} />
            </View>
            <Typography variant="body">Email</Typography>
          </View>
          <View
            style={{
              width: 24,
              height: 24,
              backgroundColor: AUTH_THEME.background,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BackArrow 
              width={16} 
              height={16} 
              color={AUTH_THEME.text} 
              style={{ transform: [{ rotate: '180deg' }] }}
            />
          </View>
        </TouchableOpacity>

        {/* WhatsApp Option */}
        <TouchableOpacity
          style={{
            backgroundColor: AUTH_THEME.surface,
            borderRadius: 12,
            padding: Spacing.md,
            marginBottom: Spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          onPress={handlePhoneReset}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 48,
                height: 48,
                backgroundColor: AUTH_THEME.background,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: Spacing.md,
              }}
            >
              <WhatsappIcon width={24} height={24} color={AUTH_THEME.text} />
            </View>
            <Typography variant="body">WhatsApp</Typography>
          </View>
          <View
            style={{
              width: 24,
              height: 24,
              backgroundColor: AUTH_THEME.background,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BackArrow 
              width={16} 
              height={16} 
              color={AUTH_THEME.text} 
              style={{ transform: [{ rotate: '180deg' }] }}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={{ 
        ...Padding.screenHorizontal, 
        paddingBottom: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {visuals.securityIcon ? (
          <visuals.securityIcon width={16} height={16} color={AUTH_THEME.secondaryText} />
        ) : null}
        <Typography 
          variant="caption" 
          color={AUTH_THEME.secondaryText}
          style={{ marginLeft: 4 }}
        >
          Your data is securely encrypted
        </Typography>
      </View>
    </View>
  );
};

export default ResetPassword;
