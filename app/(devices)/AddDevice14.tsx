import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert } from 'react-native';
import { LOCK_CALIBRATION_STEPS } from '../../design-system/home/Constants';
import { smartLockService } from '../../src/ble';
import CalibrationStepScreen from './CalibrationStepScreen';

const AddDevice14 = () => {
  const params = useLocalSearchParams();
  const currentStep = 5;
  const totalSteps = LOCK_CALIBRATION_STEPS.STEPS.length;
  const stepData = LOCK_CALIBRATION_STEPS.STEPS[currentStep - 1];

  const handleNext = async () => {
    // Step 5: Keep door ajar (door position = 3)
    try {
      console.log('📝 Calibrating door AJAR position...');
      await smartLockService.calibrateDoorPosition(3); // Ajar = 3
      
      // Navigate to next step
      router.push({
        pathname: '/(devices)/AddDevice15' as any,
        params: {
          deviceName: params.deviceName,
          deviceLocation: params.deviceLocation,
          deviceType: params.deviceType,
          deviceId: params.deviceId,
        }
      });
    } catch (error) {
      console.error('❌ Failed to calibrate door ajar:', error);
      Alert.alert('Error', 'Failed to calibrate door ajar position. Please try again.');
    }
  };

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

export default AddDevice14;
