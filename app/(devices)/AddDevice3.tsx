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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} accessibilityLabel="Go back" accessibilityHint="Return to previous screen">
            <BackArrow width={24} height={24} color={colors.surface} />
          </TouchableOpacity>
          <Typography variant="h3" color={colors.surface} style={styles.headerTitle}>
            {BEY_LOCK_MODEL.NAVIGATION.TITLE}
          </Typography>
        </View>
        <Typography variant="caption" color={colors.surface} style={styles.stepIndicator}>
          {BEY_LOCK_MODEL.NAVIGATION.STEP_INDICATOR}
        </Typography>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Typography variant="h2" color={BEY_LOCK_MODEL.COLORS.SECTION_TITLE} style={styles.sectionTitle}>
            {BEY_LOCK_MODEL.SECTIONS.SELECT_MODEL}
          </Typography>

          {BEY_LOCK_MODEL.MODELS.map((model) => (
            <TouchableOpacity
              key={model.id}
              style={[
                styles.modelCard,
                selectedModel === model.id && styles.selectedModelCard
              ]}
              onPress={() => handleModelSelect(model.id)}
              accessibilityLabel={`Select ${model.name}`}
            >
              <View style={[styles.modelIconContainer, { backgroundColor: BEY_LOCK_MODEL.COLORS.CARD_ICON_BACKGROUND }]}>
                <Lock width={24} height={24} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="h3" color={colors.text} style={{ marginBottom: 2, fontSize: 16 }}>
                  {model.name}
                </Typography>
                <Typography variant="caption" color={colors.secondaryText}>
                  {model.model}
                </Typography>
              </View>
              <View style={styles.chevronContainer}>
                <BackArrow width={16} height={16} color={colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.installationSection}>
            <View style={styles.installationHeader}>
              <View style={styles.wrenchIconContainer}>
                {React.createElement((require('@/design-system/icons/filled') as any).FixingIcon, {
                  width: 20,
                  height: 20,
                  color: colors.completedstep,
                })}
              </View>
              <Typography variant="h3" color={colors.text} style={{ fontSize: 16, marginLeft: 8 }}>
                {BEY_LOCK_MODEL.SECTIONS.INSTALLATION_GUIDE}
              </Typography>
            </View>
            <Typography variant="caption" color={colors.secondaryText} style={{ marginTop: 4, marginLeft: 28 }}>
              {BEY_LOCK_MODEL.INSTALLATION.ESTIMATED_TIME}
            </Typography>
            <Typography variant="body" color={colors.secondaryText} style={{ marginTop: 8, marginLeft: 28, lineHeight: 20 }}>
              {BEY_LOCK_MODEL.INSTALLATION.DESCRIPTION}
            </Typography>
            <TouchableOpacity style={styles.installationButton} onPress={handleInstallationGuide}>
              <Typography variant="body" color={colors.text} style={{ fontWeight: '600' }}>
                {BEY_LOCK_MODEL.INSTALLATION.BUTTON_TEXT}
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <BottomNavigation
        items={[
          { key: 'home', label: 'Home', icon: null },
          { key: 'devices', label: 'Devices', icon: null },
          { key: 'energy', label: 'Energy', icon: null },
          { key: 'profile', label: 'Profile', icon: null },
        ]}
        activeKey="devices"
        profile_picture={user?.profile_picture}
        onTabPress={(key) => {
          if (key === 'home') {
            router.push('/(app)/home');
          } else if (key === 'devices') {
            router.push('/(HomePage_actions)/MyDevices' as any);
          } else if (key === 'energy') {
            router.push('/(app)/home');
          } else if (key === 'profile') {
            setShowProfile(true);
          }
        }}
      />

      {/* Profile Modal */}
      <ProfilePage
        visible={showProfile}
        userData={user ? {
          name: user.first_name || null,
          email: userEmail,
          profilePicture: user.profile_picture || null,
          homesCount: 0 // We don't have homes data in this context
        } : undefined}
        onClose={() => setShowProfile(false)}
        onAddDevice={() => {
          setShowProfile(false);
          router.push('/(devices)/AddDevice2');
        }}
        onMyHomes={() => {
          setShowProfile(false);
          router.push('/(profile actions)/myHomes');
        }}
        onInviteFamily={() => {
          setShowProfile(false);
          // Handle invite family
        }}
        onAccountSettings={() => {
          setShowProfile(false);
          router.push('/(profile actions)/AccountSettings');
        }}
        onHelpSupport={() => {
          setShowProfile(false);
          router.push('/(profile actions)/Help&support');
        }}
      />
    </View>
  );
};

const styles = {
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
};

export default AddDevice3;
