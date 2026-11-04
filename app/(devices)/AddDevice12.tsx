import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert } from 'react-native';
import { LOCK_CALIBRATION_STEPS } from '../../design-system/home/Constants';
import { smartLockService } from '../../src/ble';
import CalibrationStepScreen from './CalibrationStepScreen';

const AddDevice12 = () => {
  const params = useLocalSearchParams();
  const currentStep = 3;
  const totalSteps = LOCK_CALIBRATION_STEPS.STEPS.length;
  const stepData = LOCK_CALIBRATION_STEPS.STEPS[currentStep - 1];

  const handleNext = async () => {
    // Step 3: Slowly turn to just unlocked (JULP position = 5)
    try {
      console.log('📝 Calibrating JULP (Jammed Unlocked) position...');
      await smartLockService.calibrateLockPosition(5); // JULP = 5
      
      // Navigate to next step
      router.push({
        pathname: '/(devices)/AddDevice13' as any,
        params: {
          deviceName: params.deviceName,
          deviceLocation: params.deviceLocation,
          deviceType: params.deviceType,
          deviceId: params.deviceId,
        }
      });
    } catch (error) {
      console.error('❌ Failed to calibrate JULP:', error);
      Alert.alert('Error', 'Failed to calibrate jammed unlocked position. Please try again.');
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

export default AddDevice12;
