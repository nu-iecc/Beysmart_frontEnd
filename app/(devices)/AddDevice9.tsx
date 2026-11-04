import { SetupMoment } from '@/components/SetupScreen';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, TouchableOpacity, View } from 'react-native';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { colors } from '../../design-system/colors/colors';
import { DEVICE_CALIBRATION } from '../../design-system/home/Constants';
import { BackArrow } from '../../design-system/icons';
import Celebration from '../../design-system/Illustration/celebration';
import { Spacing } from '../../design-system/Layout/spacing';
import { Typography } from '../../design-system/typography/typography';
// Use the smart lock service for sending token
import { smartLockService, WifiConnectionState } from '../../src/ble';

// Device Icons
import { Beylock, Beyplug, Beysense, Beyswitch } from '../../design-system/icons/filled';

const AddDevice9 = () => {
  const params = useLocalSearchParams();

  // Get device details from previous screen
  const deviceName = params.deviceName as string || DEVICE_CALIBRATION.CONTENT.DEVICE_NAME;
  const deviceLocation = params.deviceLocation as string || DEVICE_CALIBRATION.CONTENT.DEVICE_LOCATION;
  const deviceType = params.deviceType as string || 'beylock';
  const deviceId = params.deviceId as string;
  const deviceToken = params.deviceToken as string;
  const devicePhoto = params.devicePhoto as string | undefined;

  const [isSendingToken, setIsSendingToken] = useState(false);

  // Log device token for Bluetooth transmission
  console.log('Device Token for Bluetooth transmission:', deviceToken);

  const handleBack = () => {
    router.back();
  };

  const sendTokenViaBluetoothAndProceed = async () => {
    setIsSendingToken(true);

    try {
      // Check if BLE is still connected
      if (!smartLockService.isConnected()) {
        console.log('⚠️ BLE not connected, skipping token transmission');
        Alert.alert(
          'Device Not Connected',
          'Bluetooth connection lost. Please reconnect to send the token.',
          [
            { text: 'Skip', onPress: proceedToCalibration },
            { text: 'Go Back', onPress: () => router.back() }
          ]
        );
        return;
      }

      if (!deviceToken) {
        console.log('⚠️ No token available, skipping token transmission');
        proceedToCalibration();
        return;
      }

      console.log('🔐 Step 2: Sending ThingsBoard token via Bluetooth...');

      // Send token and wait for platform connection notification
      const connectionState = await smartLockService.sendPlatformTokenAndWait(
        deviceToken,
        30000 // 30 second timeout
      );

      console.log('📡 Platform connection result:', connectionState);

      if (connectionState === WifiConnectionState.CONNECTED_TO_PLATFORM) {
        console.log('✅ Device connected to ThingsBoard platform!');
        Alert.alert(
          'Success!',
          'Device is now connected to the platform. Ready for calibration.',
          [{ text: 'Continue', onPress: proceedToCalibration }]
        );
      } else if (connectionState === WifiConnectionState.SUCCESS ||
                 connectionState === WifiConnectionState.IN_PROGRESS) {
        // Token sent but not yet connected to platform - proceed anyway
        console.log('✅ Token sent, connection in progress');
        Alert.alert(
          'Token Sent',
          'Token sent to device. Platform connection may still be in progress.',
          [{ text: 'Continue', onPress: proceedToCalibration }]
        );
      } else {
        throw new Error('Failed to connect to platform');
      }
    } catch (error: any) {
      console.error('❌ Error sending token:', error);
      Alert.alert(
        'Token Not Sent',
        `Could not send token to device: ${error.message || 'Unknown error'}\n\nWould you like to continue anyway?`,
        [
          { text: 'Try Again', onPress: sendTokenViaBluetoothAndProceed },
          { text: 'Continue Anyway', onPress: proceedToCalibration }
        ]
      );
    } finally {
      setIsSendingToken(false);
    }
  };

  const proceedToCalibration = () => {
    router.push({
      pathname: '/(devices)/AddDevice10' as any,
      params: {
        deviceName: deviceName,
        deviceLocation: deviceLocation,
        deviceType: deviceType,
        deviceId: deviceId,
        deviceToken: deviceToken,
      }
    });
  };

  const handleCalibrateDevice = () => {
    console.log('Starting device calibration for:', deviceName);
    console.log('Device ID:', deviceId);

    // Skip WiFi/token transmission, go directly to calibration
    // WiFi credentials screen is no longer needed
    proceedToCalibration();
  };

  // Get the appropriate device icon based on device type
  const getDeviceIcon = () => {
    const iconProps = {
      width: DEVICE_CALIBRATION.DIMENSIONS.DEVICE_ICON_SIZE,
      height: DEVICE_CALIBRATION.DIMENSIONS.DEVICE_ICON_SIZE,
      color: '#1A1A1A', // Black color for the icon
    };

    switch (deviceType.toLowerCase()) {
      case 'beylock':
        return <Beylock {...iconProps} />;
      case 'beyplug':
        return <Beyplug {...iconProps} />;
      case 'beysense':
        return <Beysense {...iconProps} />;
      case 'beyswitch':
        return <Beyswitch {...iconProps} />;
      default:
        return <Beylock {...iconProps} />;
    }
  };

  // Get device-specific calibration description
  const getCalibrationDescription = () => {
    return DEVICE_CALIBRATION.DEVICE_CONTENT.getCalibrationDescription(deviceType);
  };

  return (
    <SetupMoment
      showBack
      busy={isSendingToken}
      title="Almost ready"
      subtitle={getCalibrationDescription()}
      actions={
        <AppButton
          variant={DEVICE_CALIBRATION.ACTION.VARIANT}
          title={isSendingToken ? 'Linking your lock…' : 'Start calibration'}
          onPress={handleCalibrateDevice}
          disabled={isSendingToken}
          accessibilityLabel={DEVICE_CALIBRATION.ACTION.CALIBRATE_BUTTON}
          accessibilityHint="Tap to start device calibration"
        />
      }
    >
      <View style={styles.card}>
        <View style={styles.iconTile}>{getDeviceIcon()}</View>
        <View style={styles.copy}>
          <Typography variant="h3" color={colors.surface} numberOfLines={1}>{deviceName}</Typography>
          <View style={styles.location}>
            <Ionicons name="home-outline" size={14} color="#CBD5E1" />
            <Typography variant="caption" color="#CBD5E1" numberOfLines={1}>{deviceLocation}</Typography>
          </View>
        </View>
        <Ionicons name="checkmark-circle" size={24} color={colors.primary.base} />
      </View>

      <View style={styles.note}>
        <Typography variant="caption" color="#CBD5E1" style={styles.noteText}>
          Next, stand by the door: you’ll turn the lock by hand through 6 short steps.
        </Typography>
      </View>
    </SetupMoment>
  );
};

const styles = StyleSheet.create({
container: {
    flex: 1,
    backgroundColor: colors.navBarBackground,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.lg,
  },
backButton: {
    position: 'absolute' as const,
    top: Spacing.xxl + 15,
    left: Spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: Spacing.sm,
    zIndex: 10,
  },
illustrationContainer: {
    marginBottom: DEVICE_CALIBRATION.DIMENSIONS.TITLE_SPACING,
  },
messageContainer: {
    alignItems: 'center' as const,
    marginBottom: DEVICE_CALIBRATION.DIMENSIONS.BUTTON_SPACING,
  },
title: {
    fontSize: 24,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
deviceCard: {
    backgroundColor: colors.lockbackground,
    borderRadius: 16,
    padding: DEVICE_CALIBRATION.DIMENSIONS.DEVICE_CARD_PADDING,
    alignItems: 'center' as const,
    marginBottom: DEVICE_CALIBRATION.DIMENSIONS.BUTTON_SPACING,
    width: '100%' as any,
    maxWidth: 300,
  },
deviceIconContainer: {
    width: DEVICE_CALIBRATION.DIMENSIONS.DEVICE_ICON_SIZE + Spacing.lg,
    height: DEVICE_CALIBRATION.DIMENSIONS.DEVICE_ICON_SIZE + Spacing.lg,
    borderRadius: (DEVICE_CALIBRATION.DIMENSIONS.DEVICE_ICON_SIZE + Spacing.lg) / 2,
    backgroundColor: colors.primary.base,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.md,
  },
devicePhotoContainer: {
    marginBottom: Spacing.md,
  },
devicePhoto: {
    width: DEVICE_CALIBRATION.DIMENSIONS.DEVICE_ICON_SIZE + Spacing.lg,
    height: DEVICE_CALIBRATION.DIMENSIONS.DEVICE_ICON_SIZE + Spacing.lg,
    borderRadius: (DEVICE_CALIBRATION.DIMENSIONS.DEVICE_ICON_SIZE + Spacing.lg) / 2,
  },
deviceName: {
    fontSize: 20,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    marginBottom: Spacing.sm,
  },
deviceLocation: {
    fontSize: 16,
    fontWeight: '400' as const,
    textAlign: 'center' as const,
  },
buttonContainer: {
    width: '100%' as any,
    alignItems: 'center' as const,
  },
calibrationDescription: {
    fontSize: 14,
    fontWeight: '400' as const,
    textAlign: 'left' as const,
    paddingHorizontal: Spacing.md,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
card: {
    alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
iconTile: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.base },
copy: { flex: 1, gap: 4 },
location: { flexDirection: 'row', alignItems: 'center', gap: 6 },
note: { alignSelf: 'stretch', paddingHorizontal: 4 },
noteText: { textAlign: 'center' }
});

export default AddDevice9;