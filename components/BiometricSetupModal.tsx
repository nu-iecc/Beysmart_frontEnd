import { AppButton } from '@/design-system/Buttons/Buttons';
import { colors } from '@/design-system/colors/colors';
import FingerprintIcon from '@/design-system/icons/filled/FingerprintIcon';
import ShieldIcon from '@/design-system/icons/filled/Shield';
import { Spacing } from '@/design-system/Layout/spacing';
import { Typography } from '@/design-system/typography/typography';
import { biometricsService } from '@/services';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { scale, verticalScale } from '../utils/responsive';

interface BiometricSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onEnable: () => void;
  onSkip: () => void;
  phoneNumber: string;
}

const BiometricSetupModal: React.FC<BiometricSetupModalProps> = ({
  visible,
  onClose,
  onEnable,
  onSkip,
  phoneNumber,
}) => {
  const [biometricType, setBiometricType] = useState<string>('Biometrics');
  const [isEnabling, setIsEnabling] = useState(false);

  useEffect(() => {
    const fetchBiometricType = async () => {
      const typeName = await biometricsService.getBiometricTypeName();
      setBiometricType(typeName);
    };
    fetchBiometricType();
  }, []);

  // Dismiss keyboard when modal becomes visible
  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
    }
  }, [visible]);

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      // First authenticate to confirm user identity
      const authResult = await biometricsService.authenticate(
        `Authenticate to enable ${biometricType} login`
      );

      if (authResult.success) {
        // Call backend to generate biometric token and save settings
        const enableResult = await biometricsService.enableBiometrics(phoneNumber);
        
        if (enableResult.success) {
          await biometricsService.markFirstLoginCompleted();
          onEnable();
        } else {
          Alert.alert('Error', enableResult.error || 'Failed to enable biometric login. Please try again.');
        }
      } else if (!authResult.cancelled) {
        // Authentication failed but wasn't cancelled
        Alert.alert('Authentication Failed', authResult.error || 'Please try again.');
      }
    } catch (error) {
      console.error('Error enabling biometrics:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsEnabling(false);
    }
  };

  const handleSkip = async () => {
    await biometricsService.markFirstLoginCompleted();
    onSkip();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Typography variant="body" color={colors.secondaryText}>
              ×
            </Typography>
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <FingerprintIcon 
                width={40} 
                height={40} 
                color={colors.text}
              />
            </View>
          </View>

          {/* Title */}
          <Typography variant="h2" color={colors.text} style={styles.title}>
            Enable Biometric Login?
          </Typography>

          {/* Description */}
          <Typography
            variant="body"
            color={colors.secondaryText}
            style={styles.description}
          >
            Use {biometricType} for faster and more secure login. You can always
            change this later in your account settings.
          </Typography>

          {/* Security note */}
          <View style={styles.securityNote}>
            <ShieldIcon width={16} height={16} color={colors.success} />
            <Typography
              variant="caption"
              color={colors.secondaryText}
              style={styles.securityText}
            >
              Your biometric data stays on your device and is never stored on our
              servers.
            </Typography>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <AppButton
              variant="primaryLarge"
              title={isEnabling ? 'Setting up...' : 'Enable Biometrics'}
              onPress={handleEnable}
              disabled={isEnabling}
            />
            <View style={{ height: verticalScale(Spacing.sm) }} />
            <AppButton
              variant="secondaryLarge"
              title="Maybe Later"
              onPress={handleSkip}
              disabled={isEnabling}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(Spacing.lg),
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: scale(20),
    padding: scale(Spacing.xl),
    width: '100%',
    maxWidth: scale(340),
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: scale(Spacing.md),
    right: scale(Spacing.md),
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginTop: scale(Spacing.md),
    marginBottom: scale(Spacing.lg),
  },
  iconCircle: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: colors.primary.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: scale(Spacing.sm),
  },
  description: {
    textAlign: 'center',
    marginBottom: scale(Spacing.lg),
    lineHeight: scale(22),
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: scale(12),
    padding: scale(Spacing.md),
    marginBottom: scale(Spacing.lg),
  },
  securityText: {
    flex: 1,
    marginLeft: scale(Spacing.sm),
    lineHeight: scale(18),
  },
  buttonContainer: {
    width: '100%',
  },
});

export default BiometricSetupModal;

