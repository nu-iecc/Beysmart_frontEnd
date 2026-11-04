import SetupScreen from '@/components/SetupScreen';
import { setupStyles } from '@/components/SetupScreen';
import { Beylock } from '@/design-system/icons/filled';
import { FixingIcon } from '@/design-system/icons/filled';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { colors } from '@/design-system/colors/colors';
import { BEY_LOCK_MODEL } from '@/design-system/home/Constants';
import { BackArrow } from '@/design-system/icons';
import { Lock } from '@/design-system/icons/outlined';
import { Spacing } from '@/design-system/Layout/spacing';
import { BottomNavigation } from '@/design-system/Navigation/BottomNavigation';
import { Typography } from '@/design-system/typography/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import ProfilePage from '../(profile actions)/Profile';
import { getMediaUrl } from '../../constants/api';

const AddDevice3: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUser({
            first_name: userData.first_name || undefined,
            profile_picture: getMediaUrl(userData.profile_picture)
          });
          setUserEmail(userData.email || '');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    // Navigate to next step or device setup
    console.log('Selected model:', modelId);
    router.push('/(devices)/AddDevice4');
  };

  const handleInstallationGuide = () => {
    // Navigate to installation guide
    console.log('Open installation guide');
  };

  return (
    <SetupScreen step={2} title="Which Bey-Lock?" subtitle="You'll find the model on the back of the lock.">
      {BEY_LOCK_MODEL.MODELS.map((model) => (
        <TouchableOpacity
          key={model.id}
          style={setupStyles.row}
          activeOpacity={0.75}
          onPress={() => handleModelSelect(model.id)}
          accessibilityRole="button"
          accessibilityLabel={`Select ${model.name}`}
        >
          <View style={[setupStyles.iconTile, styles.lockTile]}>
            <Beylock width={24} height={24} color={colors.completedstep} />
          </View>
          <View style={styles.copy}>
            <Typography variant="h3" color={colors.text}>{model.name}</Typography>
            <Typography variant="caption" color={colors.disabled}>{model.model}</Typography>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.disabled} />
        </TouchableOpacity>
      ))}

      <View style={[setupStyles.card, styles.guide]}>
        <View style={styles.guideHeader}>
          <View style={[setupStyles.iconTile, styles.guideTile]}>
            <FixingIcon width={20} height={20} color={colors.navBarBackground} />
          </View>
          <View style={styles.copy}>
            <Typography variant="h3" color={colors.text}>{BEY_LOCK_MODEL.SECTIONS.INSTALLATION_GUIDE}</Typography>
            <Typography variant="caption" color={colors.disabled}>{BEY_LOCK_MODEL.INSTALLATION.ESTIMATED_TIME}</Typography>
          </View>
        </View>
        <Typography variant="caption" color={colors.secondaryText}>{BEY_LOCK_MODEL.INSTALLATION.DESCRIPTION}</Typography>
        <TouchableOpacity style={styles.guideButton} activeOpacity={0.75} onPress={handleInstallationGuide} accessibilityRole="button">
          <Typography variant="caption" color={colors.text} style={styles.guideButtonText}>{BEY_LOCK_MODEL.INSTALLATION.BUTTON_TEXT}</Typography>
          <Ionicons name="arrow-forward" size={16} color={colors.text} />
        </TouchableOpacity>
      </View>
    </SetupScreen>
  );
};

const styles = StyleSheet.create({
container: {
    flex: 1,
    backgroundColor: BEY_LOCK_MODEL.COLORS.HEADER_BACKGROUND,
  },
header: {
    backgroundColor: BEY_LOCK_MODEL.COLORS.HEADER_BACKGROUND,
    height: BEY_LOCK_MODEL.DIMENSIONS.HEADER_HEIGHT + 60,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl,
  },
headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
backButton: {
    padding: Spacing.xs,
  },
headerTitle: {
    textAlign: 'left' as const,
    marginLeft: Spacing.xs,
    marginRight: Spacing.md,
    fontSize: 18,
    fontWeight: '600' as const,
  },
stepIndicator: {
    fontSize: 11,
    textAlign: 'right' as const,
  },
content: {
    flex: 1,
    backgroundColor: colors.background,
  },
formContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
sectionTitle: {
    marginTop: Spacing.xs - 20,
    marginBottom: BEY_LOCK_MODEL.DIMENSIONS.SECTION_SPACING,
    fontSize: 18,
    fontWeight: '600' as const,
  },
modelCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: BEY_LOCK_MODEL.COLORS.CARD_BACKGROUND,
    borderRadius: 12,
    marginBottom: BEY_LOCK_MODEL.DIMENSIONS.CARD_SPACING,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
selectedModelCard: {
    borderWidth: 2,
    borderColor: colors.primary.base,
  },
modelIconContainer: {
    width: BEY_LOCK_MODEL.DIMENSIONS.ICON_SIZE,
    height: BEY_LOCK_MODEL.DIMENSIONS.ICON_SIZE,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 16,
  },
chevronContainer: {
    padding: 4,
  },
installationSection: {
    marginTop: Spacing.xl,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
installationHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
wrenchIconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
installationButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: BEY_LOCK_MODEL.COLORS.INSTALLATION_BUTTON,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
copy: { flex: 1, gap: 2 },
lockTile: { backgroundColor: '#DCEBFF' },
guide: { marginTop: 12 },
guideHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
guideTile: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.primary.base },
guideButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 14, backgroundColor: colors.iconBackground,
  },
guideButtonText: { fontFamily: 'InterMedium' }
});

export default AddDevice3;
