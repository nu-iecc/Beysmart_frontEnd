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
    <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: AUTH_THEME.background }}>
      {/* Header */}
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
          onPress={handleBack}
        >
          <visuals.backIcon width={24} height={24} color={AUTH_THEME.text} />
        </TouchableOpacity>

        {/* Screwdriver Icon */}
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
          
          <Typography variant="body" color={AUTH_THEME.secondaryText}>
            {copy.subtitle}
          </Typography>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, ...Padding.screenHorizontal, paddingTop: Spacing.xs }}>
        {/* Email Option */}
        <TouchableOpacity
          style={{
            backgroundColor: AUTH_THEME.surface,
            borderRadius: 16,
            padding: Spacing.md,
            marginBottom: Spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: '#E7EAF0',
          }}
          onPress={handleEmailReset}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 48,
                height: 48,
                backgroundColor: AUTH_THEME.background,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: Spacing.md,
              }}
            >
              <EmailIcon width={24} height={24} color={AUTH_THEME.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="body" style={{ fontWeight: '600' }}>Email</Typography>
              <Typography variant="caption" color={AUTH_THEME.secondaryText} style={{ marginTop: 3 }}>Get a secure code in your inbox</Typography>
            </View>
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
            borderRadius: 16,
            padding: Spacing.md,
            marginBottom: Spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: '#E7EAF0',
          }}
          onPress={handlePhoneReset}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 48,
                height: 48,
                backgroundColor: AUTH_THEME.background,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: Spacing.md,
              }}
            >
              <WhatsappIcon width={24} height={24} color={AUTH_THEME.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="body" style={{ fontWeight: '600' }}>WhatsApp</Typography>
              <Typography variant="caption" color={AUTH_THEME.secondaryText} style={{ marginTop: 3 }}>Receive a secure code by phone</Typography>
            </View>
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
        paddingTop: Spacing.sm,
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
