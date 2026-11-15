import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert } from 'react-native';
import { LOCK_CALIBRATION_STEPS } from '../../design-system/home/Constants';
import { smartLockService } from '../../src/ble';
import CalibrationStepScreen from './CalibrationStepScreen';

const AddDevice13 = () => {
  const params = useLocalSearchParams();
  const currentStep = 4;
  const totalSteps = LOCK_CALIBRATION_STEPS.STEPS.length;
  const stepData = LOCK_CALIBRATION_STEPS.STEPS[currentStep - 1];

  const handleNext = async () => {
    // Step 4: Turn to just locked (JLP position = 4)
    try {
      console.log('📝 Calibrating JLP (Jammed Locked) position...');
      await smartLockService.calibrateLockPosition(4); // JLP = 4
      
      // Skip door sensor calibration (steps 5 & 6), go directly to waiting screen
      // Navigate to AddDevice15 which will wait for calibration result
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
      console.error('❌ Failed to calibrate JLP:', error);
      Alert.alert('Error', 'Failed to calibrate jammed locked position. Please try again.');
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

export default AddDevice13;
