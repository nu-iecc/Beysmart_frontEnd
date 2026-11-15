import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { colors } from '../../design-system/colors/colors';
import { ADD_HOME_DONE, HOME_ACCESSIBILITY } from '../../design-system/home/Constants';
import { BackArrow } from '../../design-system/icons';
import Celebration from '../../design-system/Illustration/celebration';
import { Spacing } from '../../design-system/Layout/spacing';
import { Typography } from '../../design-system/typography/typography';

interface HomeData {
  homeName?: string;
  homeType?: string;
  homeLocation?: string;
  homePhoto?: string;
}

const AddHomeDone = () => {
  const params = useLocalSearchParams();
  
  // Default values if no data is passed
  const homeData: HomeData = {
    homeName: (params.homeName as string) || ADD_HOME_DONE.HOME_CARD.TITLE,
    homeType: (params.homeType as string) || ADD_HOME_DONE.HOME_CARD.TYPE,
    homeLocation: (params.homeLocation as string) || ADD_HOME_DONE.HOME_CARD.LOCATION,
    homePhoto: params.homePhoto as string,
  };

  const handleEditHome = () => {
    // Navigate back to edit home details
    router.push('/(home)/AddHome' as never);
  };

  const handleFinishSetup = () => {
    // Navigate to main home screen with completion flag
    router.push({
      pathname: '/(app)/home' as never,
      params: {
        completedStep: 'add_home'
      }
    } as never);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(app)/home' as never);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityLabel="Go back"
          accessibilityHint="Return to previous screen"
        >
          <BackArrow width={24} height={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Illustration */}
        <View style={styles.celebrationContainer}>
          <Celebration 
            width={ADD_HOME_DONE.DIMENSIONS.CELEBRATION_SIZE} 
            height={ADD_HOME_DONE.DIMENSIONS.CELEBRATION_SIZE} 
          />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Typography variant="h1" color={colors.surface} style={styles.title}>
            {ADD_HOME_DONE.CONTENT.TITLE}
          </Typography>
        </View>

        {/* Home Card */}
        <View style={styles.homeCard}>
          <View style={styles.homeImageContainer}>
            {homeData.homePhoto ? (
              <Image
                source={{ uri: homeData.homePhoto }}
                style={styles.homeImage}
                accessibilityLabel="Home photo"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Typography variant="h2" color={colors.secondaryText}>
                  🏠
                </Typography>
              </View>
            )}
          </View>
          
          <View style={styles.homeDetails}>
            <Typography variant="h2" color={colors.surface} style={styles.homeName}>
              {homeData.homeName}
            </Typography>
            <Typography variant="body" color={colors.surface} style={styles.homeType}>
              {homeData.homeType}
            </Typography>
            <Typography variant="caption" color={colors.surface} style={styles.homeLocation}>
              {homeData.homeLocation}
            </Typography>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <AppButton
            variant={ADD_HOME_DONE.ACTIONS.EDIT_HOME.VARIANT}
            title={ADD_HOME_DONE.ACTIONS.EDIT_HOME.TEXT}
            onPress={handleEditHome}
            accessibilityLabel={HOME_ACCESSIBILITY.LABELS.EDIT_BUTTON}
            accessibilityHint={HOME_ACCESSIBILITY.HINTS.EDIT_BUTTON}
          />
          
          <View style={styles.buttonSpacing} />
          
          <AppButton
            variant={ADD_HOME_DONE.ACTIONS.FINISH_SETUP.VARIANT}
            title={ADD_HOME_DONE.ACTIONS.FINISH_SETUP.TEXT}
            onPress={handleFinishSetup}
            accessibilityLabel={HOME_ACCESSIBILITY.LABELS.FINISH_BUTTON}
            accessibilityHint={HOME_ACCESSIBILITY.HINTS.FINISH_BUTTON}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.navBarBackground,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  backButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  content: {
    flex: 1,
    backgroundColor: colors.navBarBackground,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxl,
  },
  celebrationContainer: {
    alignItems: 'center' as const,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  titleContainer: {
    alignItems: 'center' as const,
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: 'center' as const,
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  homeCard: {
    backgroundColor: ADD_HOME_DONE.COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    padding: ADD_HOME_DONE.DIMENSIONS.CARD_PADDING,
    marginBottom: Spacing.sm,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: ADD_HOME_DONE.COLORS.CARD_BORDER,
  },
  homeImageContainer: {
    marginBottom: Spacing.lg,
  },
  homeImage: {
    width: ADD_HOME_DONE.DIMENSIONS.HOME_IMAGE_SIZE,
    height: ADD_HOME_DONE.DIMENSIONS.HOME_IMAGE_SIZE,
    borderRadius: ADD_HOME_DONE.HOME_CARD.BORDER_RADIUS,
  },
  placeholderImage: {
    width: ADD_HOME_DONE.DIMENSIONS.HOME_IMAGE_SIZE,
    height: ADD_HOME_DONE.DIMENSIONS.HOME_IMAGE_SIZE,
    borderRadius: ADD_HOME_DONE.HOME_CARD.BORDER_RADIUS,
    backgroundColor: colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  homeDetails: {
    alignItems: 'center' as const,
  },
  homeName: {
    fontSize: 24,
    fontWeight: '600' as const,
    marginBottom: Spacing.xs,
  },
  homeType: {
    fontSize: 18,
    marginBottom: 4,
  },
  homeLocation: {
    fontSize: 16,
  },
  actionsContainer: {
    marginTop: 'auto' as const,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  buttonSpacing: {
    height: ADD_HOME_DONE.DIMENSIONS.BUTTON_SPACING,
  },
};

export default AddHomeDone;
