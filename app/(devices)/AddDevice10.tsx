import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { colors } from '../../design-system/colors/colors';
import { LOCK_CALIBRATION_STEPS } from '../../design-system/home/Constants';
import { Typography } from '../../design-system/typography/typography';
import { smartLockService } from '../../src/ble';
import CalibrationStepScreen from './CalibrationStepScreen';

const AddDevice10 = () => {
  const params = useLocalSearchParams();
  const currentStep = 1;
  const totalSteps = LOCK_CALIBRATION_STEPS.STEPS.length;
  const stepData = LOCK_CALIBRATION_STEPS.STEPS[currentStep - 1];
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [calibrationStarted, setCalibrationStarted] = useState(false);

  // Step 1: Enter calibration mode when component mounts
  useEffect(() => {
    const initializeCalibration = async () => {
      try {
        console.log('🔧 Initializing calibration mode...');
        
        // Check if device is connected
        if (!smartLockService.isConnected()) {
          Alert.alert(
            'Not Connected',
            'Device is not connected. Please go back and reconnect.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
          return;
        }

        // Enter calibration mode (write 1 to 0xDD01, subscribe to 0xDD04)
        const success = await smartLockService.enterCalibrationMode();
        
        if (success) {
          console.log('✅ Calibration mode entered successfully');
          setCalibrationStarted(true);
        } else {
          throw new Error('Failed to enter calibration mode');
        }
      } catch (error) {
        console.error('❌ Calibration initialization error:', error);
        Alert.alert(
          'Calibration Error',
          'Failed to start calibration. Please try again.',
          [
            { text: 'Retry', onPress: initializeCalibration },
            { text: 'Cancel', onPress: () => router.back() }
          ]
        );
      } finally {
        setIsInitializing(false);
      }
    };

    initializeCalibration();
  }, []);

  const handleNext = async () => {
    // Step 1: User rotates lock to UNLOCK (CULP position = 3)
    // Send calibration command for CULP
    try {
      console.log('📝 Calibrating CULP (Unlocked) position...');
      await smartLockService.calibrateLockPosition(3); // CULP = 3
      
      // Navigate to next step
      router.push({
        pathname: '/(devices)/AddDevice11' as any,
        params: {
          deviceName: params.deviceName,
          deviceLocation: params.deviceLocation,
          deviceType: params.deviceType,
          deviceId: params.deviceId,
        }
      });
    } catch (error) {
      console.error('❌ Failed to calibrate CULP:', error);
      Alert.alert('Error', 'Failed to calibrate unlock position. Please try again.');
    }
  };

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary.base} />
        <Typography variant="body" style={{ marginTop: 16 }}>
          Initializing calibration...
        </Typography>
      </View>
    );
  }

  return (
    <CalibrationStepScreen
      currentStep={currentStep}
      totalSteps={totalSteps}
      title={stepData.title}
      description={stepData.description}
      onNext={handleNext}
      showBackButton={true}
    />
  );
};

export default AddDevice10;
