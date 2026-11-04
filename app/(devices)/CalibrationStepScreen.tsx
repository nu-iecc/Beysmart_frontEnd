const STEP_HEADLINES = [
  'Turn fully to unlock',
  'Turn fully to lock',
  'Find the unlock point',
  'Find the lock point',
  'Leave the door ajar',
  'Close the door',
];
import SetupScreen from '@/components/SetupScreen';
import { setupStyles } from '@/components/SetupScreen';
import { StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { colors } from '../../design-system/colors/colors';
import { LOCK_CALIBRATION_STEPS } from '../../design-system/home/Constants';
import { BackArrow } from '../../design-system/icons';
import { ScaleIcon } from '../../design-system/icons/filled';
import { Spacing } from '../../design-system/Layout/spacing';
import { Typography } from '../../design-system/typography/typography';

// Load the calibration video
const calibrationVideo = require('../../assets/animation/callibration.mp4');

interface CalibrationStepScreenProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  description: string;
  onNext: () => void;
  showBackButton?: boolean;
}

const CalibrationStepScreen: React.FC<CalibrationStepScreenProps> = ({
  currentStep,
  totalSteps,
  title,
  description,
  onNext,
  showBackButton = true,
}) => {
  // Create video player with loop enabled
  const player = useVideoPlayer(calibrationVideo, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Restart video when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Play video when screen is focused
      if (player) {
        player.currentTime = 0;
        player.play();
      }

      return () => {
        // Pause video when screen loses focus
        if (player) {
          player.pause();
        }
      };
    }, [player])
  );

  const handleBack = () => {
    router.back();
  };

  return ((
    <SetupScreen
      step={6} showBack={showBackButton}
      stepDetail={`${currentStep} of ${totalSteps}`}
      title={STEP_HEADLINES[currentStep - 1] ?? title}
      footer={
        <AppButton
          variant={LOCK_CALIBRATION_STEPS.ACTION.VARIANT}
          title={currentStep === totalSteps ? 'Finish' : LOCK_CALIBRATION_STEPS.NAVIGATION.BUTTON_TEXT}
          onPress={onNext}
          accessibilityLabel={LOCK_CALIBRATION_STEPS.ACTION.NEXT_BUTTON}
          accessibilityHint={LOCK_CALIBRATION_STEPS.ACTION.NEXT_BUTTON}
        />
      }
    >
      <View style={styles.videoCard}>
        <VideoView player={player} style={styles.video} contentFit="contain" nativeControls={false} />
      </View>

      <View style={setupStyles.card}>
        <View style={styles.dots}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <View key={i} style={[styles.dot, i < currentStep && styles.dotDone, i === currentStep - 1 && styles.dotCurrent]} />
          ))}
        </View>
        <Typography variant="body" color={colors.secondaryText}>{description.trim()}</Typography>
      </View>
    </SetupScreen>
  ));
};

const styles = StyleSheet.create({
  videoCard: { borderRadius: 24, overflow: 'hidden', backgroundColor: colors.surface, height: 280 },
  video: { width: '100%', height: '100%' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.inactivestep },
  dotDone: { backgroundColor: colors.navBarBackground },
  dotCurrent: { width: 24, backgroundColor: colors.primary.darker },
});

export default CalibrationStepScreen;
