import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { CALIBRATION_SUCCESS } from '../../design-system/home/Constants';
import Celebration from '../../design-system/Illustration/celebration';
import { Spacing } from '../../design-system/Layout/spacing';
import { Typography } from '../../design-system/typography/typography';

const AddDevice16 = () => {
  const params = useLocalSearchParams();
  const [bleDeviceId, setBleDeviceId] = useState<string | null>(null);
  
  // Load BLE device ID from AsyncStorage when component mounts
  useEffect(() => {
    const loadBleDeviceId = async () => {
      try {
        const storedBleId = await AsyncStorage.getItem('bleDeviceId');
        if (storedBleId) {
          console.log('📡 Loaded BLE Device ID for lock screen:', storedBleId);
          setBleDeviceId(storedBleId);
        }
      } catch (error) {
        console.error('Failed to load BLE device ID:', error);
      }
    };
    loadBleDeviceId();
  }, []);
  
  const handleGoToDevice = () => {
    // Navigate to lock control screen with device details including BLE device ID
    // Use replace() to remove calibration success screen from stack
    console.log('Go to device details');
    const navParams: any = {
      deviceName: params.deviceName as string,
      homeName: params.homeName as string || params.deviceLocation as string,
      deviceId: params.deviceId as string,
    };
    
    // Add BLE device ID if available
    if (bleDeviceId) {
      navParams.bleDeviceId = bleDeviceId;
      console.log('📡 Passing BLE Device ID to lock screen:', bleDeviceId);
    }
    
    router.replace({
      pathname: '/(Lock/Unlock)/LockControlScreen' as any,
      params: navParams
    });
  };

  const handleGoToHomepage = () => {
    // Navigate to homepage
    router.push('/(app)/home');
  };

  return (
    <View style={styles.container}>
      {/* Celebration Illustration */}
      <View style={styles.illustrationContainer}>
        <Celebration 
          width={CALIBRATION_SUCCESS.DIMENSIONS.ILLUSTRATION_SIZE} 
          height={CALIBRATION_SUCCESS.DIMENSIONS.ILLUSTRATION_SIZE} 
        />
      </View>

      {/* Success Message */}
      <View style={styles.messageContainer}>
        <Typography variant="h1" color={CALIBRATION_SUCCESS.COLORS.TITLE_TEXT} style={styles.title}>
          {CALIBRATION_SUCCESS.CONTENT.TITLE}
        </Typography>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <AppButton
          variant={CALIBRATION_SUCCESS.ACTIONS.GO_TO_DEVICE.VARIANT}
          title={CALIBRATION_SUCCESS.ACTIONS.GO_TO_DEVICE.TEXT}
          onPress={handleGoToDevice}
          accessibilityLabel={CALIBRATION_SUCCESS.ACTIONS.GO_TO_DEVICE.TEXT}
          accessibilityHint={CALIBRATION_SUCCESS.ACTIONS.GO_TO_DEVICE.HINT}
        />
        
        <View style={styles.buttonSpacer} />
        
        <AppButton
          variant={CALIBRATION_SUCCESS.ACTIONS.GO_TO_HOMEPAGE.VARIANT}
          title={CALIBRATION_SUCCESS.ACTIONS.GO_TO_HOMEPAGE.TEXT}
          onPress={handleGoToHomepage}
          accessibilityLabel={CALIBRATION_SUCCESS.ACTIONS.GO_TO_HOMEPAGE.TEXT}
          accessibilityHint={CALIBRATION_SUCCESS.ACTIONS.GO_TO_HOMEPAGE.HINT}
        />
      </View>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: CALIBRATION_SUCCESS.COLORS.BACKGROUND,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.lg,
  },
  illustrationContainer: {
    marginBottom: CALIBRATION_SUCCESS.DIMENSIONS.TITLE_SPACING,
  },
  messageContainer: {
    alignItems: 'center' as const,
    marginBottom: CALIBRATION_SUCCESS.DIMENSIONS.BUTTON_SPACING + 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  buttonContainer: {
    width: '100%' as any,
    alignItems: 'center' as const,
  },
  buttonSpacer: {
    height: CALIBRATION_SUCCESS.DIMENSIONS.BUTTON_SPACING,
  },
};

export default AddDevice16;
