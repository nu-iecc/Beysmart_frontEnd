import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert } from 'react-native';
import { LOCK_CALIBRATION_STEPS } from '../../design-system/home/Constants';
import { smartLockService } from '../../src/ble';
import CalibrationStepScreen from './CalibrationStepScreen';

const AddDevice11 = () => {
  const params = useLocalSearchParams();
  const currentStep = 2;
  const totalSteps = LOCK_CALIBRATION_STEPS.STEPS.length;
  const stepData = LOCK_CALIBRATION_STEPS.STEPS[currentStep - 1];

  const handleNext = async () => {
    // Step 2: User rotates lock to LOCK (CLP position = 2)
    // Send calibration command for CLP
    try {
      console.log('📝 Calibrating CLP (Locked) position...');
      await smartLockService.calibrateLockPosition(2); // CLP = 2
      
      // Navigate to next step
      router.push({
        pathname: '/(devices)/AddDevice12' as any,
        params: {
          deviceName: params.deviceName,
          deviceLocation: params.deviceLocation,
          deviceType: params.deviceType,
          deviceId: params.deviceId,
        }
      });
    } catch (error) {
      console.error('❌ Failed to calibrate CLP:', error);
      Alert.alert('Error', 'Failed to calibrate lock position. Please try again.');
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

export default AddDevice11;
