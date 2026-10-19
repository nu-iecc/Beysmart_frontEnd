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

  return (
    <View style={styles.container}>
      {/* Back Button */}
      {showBackButton && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <BackArrow />
        </TouchableOpacity>
      )}

      {/* Step Indicator */}
      <View style={styles.stepIndicatorContainer}>
        <Typography variant="body" color={LOCK_CALIBRATION_STEPS.COLORS.STEP_INDICATOR_TEXT} style={styles.stepIndicator}>
          {LOCK_CALIBRATION_STEPS.NAVIGATION.STEP_INDICATOR(currentStep, totalSteps)}
        </Typography>
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <ScaleIcon 
            width={LOCK_CALIBRATION_STEPS.DIMENSIONS.ICON_SIZE}
            height={LOCK_CALIBRATION_STEPS.DIMENSIONS.ICON_SIZE}
            color={colors.text}
          />
        </View>

        {/* Title */}
        <Typography variant="h2" color={LOCK_CALIBRATION_STEPS.COLORS.TITLE_TEXT} style={styles.title}>
          {title}
        </Typography>

        {/* Video Animation */}
        <View style={styles.gifContainer}>
          <VideoView
            player={player}
            style={styles.gif}
            contentFit="contain"
            nativeControls={false}
          />
        </View>

        {/* Description */}
        <Typography variant="body" color={LOCK_CALIBRATION_STEPS.COLORS.DESCRIPTION_TEXT} style={styles.description}>
          {description}
        </Typography>

        {/* Next Button */}
        <View style={styles.buttonContainer}>
          <AppButton
            variant={LOCK_CALIBRATION_STEPS.ACTION.VARIANT}
            title={LOCK_CALIBRATION_STEPS.NAVIGATION.BUTTON_TEXT}
            onPress={onNext}
            accessibilityLabel={LOCK_CALIBRATION_STEPS.ACTION.NEXT_BUTTON}
            accessibilityHint={LOCK_CALIBRATION_STEPS.ACTION.NEXT_BUTTON}
          />
        </View>
      </View>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: LOCK_CALIBRATION_STEPS.COLORS.BACKGROUND,
  },
  backButton: {
    position: 'absolute' as const,
    top: Spacing.xxl + 10,
    left: Spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: Spacing.sm,
    zIndex: 10,
  },
  stepIndicatorContainer: {
    position: 'absolute' as const,
    top: Spacing.xxl + 20,
    right: Spacing.md,
    zIndex: 10,
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + 50,
  },
  iconContainer: {
    width: LOCK_CALIBRATION_STEPS.DIMENSIONS.ICON_SIZE + Spacing.lg,
    height: LOCK_CALIBRATION_STEPS.DIMENSIONS.ICON_SIZE + Spacing.lg,
    borderRadius: (LOCK_CALIBRATION_STEPS.DIMENSIONS.ICON_SIZE + Spacing.lg) / 2,
    backgroundColor: LOCK_CALIBRATION_STEPS.COLORS.ICON_BACKGROUND,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    marginBottom: Spacing.xs-70,
  },
  gifContainer: {
    width: LOCK_CALIBRATION_STEPS.DIMENSIONS.GIF_WIDTH,
    height: LOCK_CALIBRATION_STEPS.DIMENSIONS.GIF_HEIGHT,
    marginBottom: Spacing.xs-70,
  },
  gif: {
    width: '100%' as any,
    height: '100%' as any,
  },
  description: {
    fontSize: 14,
    fontWeight: '400' as const,
    textAlign: 'left' as const,
    lineHeight: 20,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  buttonContainer: {
    width: '100%' as any,
    alignItems: 'center' as const,
    marginTop: -Spacing.sm,
  },
};

export default CalibrationStepScreen;
