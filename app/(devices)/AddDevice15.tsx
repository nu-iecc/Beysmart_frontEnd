import { SetupMoment } from '@/components/SetupScreen';
import LockLoader from '@/components/LockLoader';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { colors } from '../../design-system/colors/colors';
import { Spacing } from '../../design-system/Layout/spacing';
import { Typography } from '../../design-system/typography/typography';
import { CalibrationProcessState, smartLockService } from '../../src/ble';

const AddDevice15 = () => {
  const params = useLocalSearchParams();

  const [isWaiting, setIsWaiting] = useState(true);
  const [calibrationResult, setCalibrationResult] = useState<CalibrationProcessState | null>(null);

  // Wait for calibration result when component mounts
  // Door sensor calibration is skipped - only lock mechanism calibrated
  useEffect(() => {
    const waitForResult = async () => {
      try {
        console.log('📖 Step 3: Reading calibration state before waiting...');
        console.log('ℹ️ Door sensor calibration skipped');

        // Read from 0xDD04 first to kick off the calibration process
        const initialResult = await smartLockService.readCalibrationState();
        console.log('📊 Initial calibration state:', initialResult);

        // Now subscribe and wait for the final result
        console.log('⏳ Subscribing and waiting for lock calibration to complete...');
        const result = await smartLockService.waitForCalibrationResult(60000);

        console.log('📊 Final calibration result:', result);
        setCalibrationResult(result);
        setIsWaiting(false);

        if (result === CalibrationProcessState.SUCCESS) {
          // Don't clear calibration subscriptions - they're harmless and clearing them
          // causes native crashes when the subscription tries to be cancelled later.
          // The 0xDD04 characteristic won't send notifications after calibration anyway.

          // Success! Navigate to success screen after a brief delay
          setTimeout(() => {
            router.push({
              pathname: '/(devices)/AddDevice16' as any,
              params: {
                deviceName: params.deviceName,
                deviceLocation: params.deviceLocation,
                deviceType: params.deviceType,
                deviceId: params.deviceId,
                homeName: params.deviceLocation, // Use deviceLocation as homeName
              }
            });
          }, 1000);
        }
      } catch (error) {
        console.error('❌ Calibration timeout or error:', error);
        setIsWaiting(false);
        setCalibrationResult(CalibrationProcessState.FAILED);
      }
    };

    waitForResult();

    // Cleanup: Don't call any BLE cleanup methods as they can crash
    // The BLE manager will handle subscription cleanup automatically
    return () => {
      console.log('🔕 AddDevice15 unmounting (not calling BLE cleanup to avoid crash)');
    };
  }, []);

  const getFailureMessage = (result: CalibrationProcessState): string => {
    switch (result) {
      case CalibrationProcessState.FAILED_ENCODER:
        return 'Calibration failed due to encoder error. The lock mechanism could not be detected properly.';
      case CalibrationProcessState.FAILED_DOOR_SENSOR:
        return 'Calibration failed due to door sensor error.';
      case CalibrationProcessState.FAILED_TRAIL:
        return 'Calibration failed due to trail error. Please ensure the lock can move freely.';
      case CalibrationProcessState.FAILED_MEMORY:
        return 'Calibration failed due to memory error. Device storage issue detected.';
      default:
        return 'Calibration failed. Please try again.';
    }
  };

  const handleRetry = () => {
    // Go back to start of calibration (AddDevice10)
    router.replace({
      pathname: '/(devices)/AddDevice10' as any,
      params: {
        deviceName: params.deviceName,
        deviceLocation: params.deviceLocation,
        deviceType: params.deviceType,
        deviceId: params.deviceId,
      }
    });
  };

  const handleCancel = () => {
    // Go back to home
    router.push('/(app)/home');
  };

  // Waiting state
  if (isWaiting) {
    return (<SetupMoment title="Finishing calibration" subtitle="Keep your lock nearby while it completes calibration." busy showBack={false} art={<LockLoader size={64} tone="lime" />} actions={<View />} />);
  }

  // Failure state
  if (calibrationResult !== CalibrationProcessState.SUCCESS) {
    return (<SetupMoment title="Calibration failed" subtitle={getFailureMessage(calibrationResult!)} art={<Ionicons name="alert-circle-outline" size={80} color={colors.primary.base} />} actions={<><AppButton variant="primaryLarge" title="Retry calibration" onPress={handleRetry} /><AppButton variant="secondaryLarge" title="Cancel" onPress={handleCancel} /></>} />);
  }

  // Success state (briefly shown before navigation)
  return (<SetupMoment title="Calibration complete" subtitle="Your lock is ready." art={<Ionicons name="checkmark-circle" size={80} color={colors.primary.base} />} actions={<View />} showBack={false} />);
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.lg,
  },
  waitingTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center' as const,
  },
  waitingMessage: {
    textAlign: 'center' as const,
    paddingHorizontal: Spacing.md,
  },
  errorIcon: {
    marginBottom: Spacing.lg,
  },
  errorIconText: {
    fontSize: 64,
  },
  errorTitle: {
    marginBottom: Spacing.md,
    textAlign: 'center' as const,
  },
  errorMessage: {
    textAlign: 'center' as const,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  successTitle: {
    textAlign: 'center' as const,
  },
  buttonContainer: {
    width: '100%' as any,
  },
};

export default AddDevice15;
