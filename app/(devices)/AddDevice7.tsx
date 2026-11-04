import { SetupMoment } from '@/components/SetupScreen';
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { DEVICE_PAIRING_SUCCESS } from '../../design-system/home/Constants';
import Celebration from '../../design-system/Illustration/celebration';
import { Spacing } from '../../design-system/Layout/spacing';
import { Typography } from '../../design-system/typography/typography';

const AddDevice7 = () => {
  const handleSetupDeviceDetails = () => {
    // Navigate to device details setup screen
    router.push('/(devices)/Adddevice8');
  };

  return (
    <SetupMoment
      art={<Celebration width={DEVICE_PAIRING_SUCCESS.DIMENSIONS.ILLUSTRATION_SIZE} height={DEVICE_PAIRING_SUCCESS.DIMENSIONS.ILLUSTRATION_SIZE} />}
      title="Lock paired"
      subtitle="Your lock is paired over Bluetooth. Next, give it a name."
      actions={
        <AppButton
          variant={DEVICE_PAIRING_SUCCESS.ACTION.VARIANT}
          title="Continue"
          onPress={handleSetupDeviceDetails}
          accessibilityLabel={DEVICE_PAIRING_SUCCESS.ACTION.TEXT}
          accessibilityHint="Tap to setup device details"
        />
      }
    />
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: DEVICE_PAIRING_SUCCESS.COLORS.BACKGROUND,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.lg,
  },
  illustrationContainer: {
    marginBottom: DEVICE_PAIRING_SUCCESS.DIMENSIONS.TITLE_SPACING,
  },
  messageContainer: {
    alignItems: 'center' as const,
    marginBottom: DEVICE_PAIRING_SUCCESS.DIMENSIONS.BUTTON_SPACING,
  },
  title: {
    fontSize: 24,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  buttonContainer: {
    width: '100%' as any,
    alignItems: 'center' as const,
  },
};

export default AddDevice7;
