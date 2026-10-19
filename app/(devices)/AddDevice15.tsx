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
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary.base} />
        <Typography variant="h2" style={styles.waitingTitle}>
          Calibrating Your Lock
        </Typography>
        <Typography variant="body" color={colors.secondaryText} style={styles.waitingMessage}>
          Please wait while the device completes the calibration process...
        </Typography>
      </View>
    );
  }

  // Failure state
  if (calibrationResult !== CalibrationProcessState.SUCCESS) {
    return (
      <View style={styles.container}>
        <View style={styles.errorIcon}>
          <Typography variant="h1" style={styles.errorIconText}>⚠️</Typography>
        </View>
        
        <Typography variant="h1" style={styles.errorTitle}>
          Calibration Failed
        </Typography>
        
        <Typography variant="body" color={colors.secondaryText} style={styles.errorMessage}>
          {getFailureMessage(calibrationResult!)}
        </Typography>

        <View style={styles.buttonContainer}>
          <AppButton
            variant="primaryLarge"
            title="Retry Calibration"
            onPress={handleRetry}
            accessibilityLabel="Retry calibration"
            accessibilityHint="Tap to restart the calibration process"
          />
          
          <View style={{ height: Spacing.md }} />
          
          <AppButton
            variant="secondaryLarge"
            title="Cancel"
            onPress={handleCancel}
            accessibilityLabel="Cancel calibration"
            accessibilityHint="Tap to cancel and return to home"
          />
        </View>
      </View>
    );
  }

  // Success state (briefly shown before navigation)
  return (
    <View style={styles.container}>
      <Typography variant="h1" style={styles.successTitle}>
        ✅ Calibration Complete!
      </Typography>
    </View>
  );
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
