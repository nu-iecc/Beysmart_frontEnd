import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { useToast } from '../../components/Toast';
import { BASE_URL } from '../../constants/api';
import { colors } from '../../design-system/colors/colors';
import { BackArrow } from '../../design-system/icons';
import { HomeIcon, LightIcon, LocationIcon, PlusIcon, SettingsIcon, UsersIcon } from '../../design-system/icons/filled';
import { Spacing } from '../../design-system/Layout/spacing';
import { BottomNavigation } from '../../design-system/Navigation/BottomNavigation';
import { MyHomesConstants } from '../../design-system/Profile actions/Constants';
import { Typography } from '../../design-system/typography/typography';
import apiClient from '../../utils/api';

// Types
interface Home {
  id: number;
  name: string;
  home_type: string;
  location: string;
  photo?: string;
  created_at: string;
  updated_at: string;
}

interface UserData {
  first_name?: string;
  profile_picture?: string;
}

const MyHomes: React.FC = () => {
  const [homes, setHomes] = useState<Home[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUser({
            first_name: userData.first_name || undefined,
            profile_picture: userData.profile_picture ? `${BASE_URL.replace('/api/', '')}${userData.profile_picture}` : undefined
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  // Load homes from API
  useEffect(() => {
    const loadHomes = async () => {
      try {
        const response = await apiClient.get('home/homes/');
        setHomes(response.data);
      } catch (error: any) {
        console.error('Error loading homes:', error);
        Alert.alert('Error', MyHomesConstants.errorLoadingHomes);
      } finally {
        setIsLoading(false);
      }
    };

    loadHomes();
  }, []);

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Handle control button press
  const handleControl = (homeId: number) => {
    router.push({
      pathname: '/(app)/home' as never,
      params: { selectedHomeId: homeId.toString() }
    } as never);
  };

  // Handle add new home
  const handleAddNewHome = () => {
    router.push('/(home)/AddHome' as never);
  };

  // Handle guests button
  const handleGuests = (homeId: number) => {
    toast('info', 'Managing home guests is coming soon.');
  };

  // Handle settings button
  const handleSettings = (homeId: number) => {
    toast('info', 'Home settings are coming soon.');
  };

  // Get status badge for home
  const getStatusBadge = (home: Home) => {
    // For now, return a default status - this would be based on actual device status
    return {
      text: MyHomesConstants.allSecure,
      color: colors.success,
      backgroundColor: colors.successLight
    };
  };

  // Render home card
  const renderHomeCard = (home: Home) => {
    const statusBadge = getStatusBadge(home);
    // Use the photo URL directly if it exists
    const imageUri = home.photo || null;

    return (
      <View key={home.id} style={styles.homeCard}>
        {/* Home Image */}
        <View style={styles.homeImageContainer}>
          {imageUri ? (
            <Image 
              source={{ uri: imageUri }} 
              style={styles.homeImage}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <HomeIcon width={48} height={48} color={colors.surface} />
            </View>
          )}
          
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusBadge.backgroundColor }]}>
            <Typography variant="caption" color={statusBadge.color} style={styles.statusText}>
              {statusBadge.text}
            </Typography>
          </View>
        </View>

        {/* Home Details */}
        <View style={styles.homeDetails}>
          <View style={styles.homeHeader}>
            <View style={styles.homeInfo}>
              <Typography variant="h3" color={colors.text} style={styles.homeName}>
                {home.name}
              </Typography>
              <View style={styles.locationContainer}>
                <LocationIcon width={12} height={12} color={colors.secondaryText} />
                <Typography variant="caption" color={colors.secondaryText} style={styles.locationText}>
                  {home.location}
                </Typography>
              </View>
            </View>
            
            {/* Guest Count */}
            <View style={styles.guestCount}>
              <Typography variant="caption" color={colors.secondaryText}>
                {MyHomesConstants.noGuests}
              </Typography>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <LightIcon width={16} height={16} color={colors.secondaryText} />
              <Typography variant="caption" color={colors.secondaryText} style={styles.statText}>
                0 {MyHomesConstants.devicesLabel}
              </Typography>
            </View>
            <View style={styles.statItem}>
              <UsersIcon width={16} height={16} color={colors.secondaryText} />
              <Typography variant="caption" color={colors.secondaryText} style={styles.statText}>
                0 {MyHomesConstants.guestsLabel}
              </Typography>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => handleControl(home.id)}
              accessibilityLabel={MyHomesConstants.controlButtonAccessibilityLabel}
              accessibilityHint={MyHomesConstants.controlButtonAccessibilityHint}
            >
              <Typography variant="accent" color={colors.text} style={styles.controlButtonText}>
                {MyHomesConstants.controlButton}
              </Typography>
            </TouchableOpacity>
            
            <View style={styles.secondaryButtons}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleGuests(home.id)}
                accessibilityLabel={MyHomesConstants.guestsButtonAccessibilityLabel}
                accessibilityHint={MyHomesConstants.guestsButtonAccessibilityHint}
              >
                <UsersIcon width={18} height={18} color={colors.text} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleSettings(home.id)}
                accessibilityLabel={MyHomesConstants.settingsButtonAccessibilityLabel}
                accessibilityHint={MyHomesConstants.settingsButtonAccessibilityHint}
              >
                <SettingsIcon width={18} height={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityLabel={MyHomesConstants.backButtonAccessibilityLabel}
            accessibilityHint={MyHomesConstants.backButtonAccessibilityHint}
          >
            <BackArrow width={24} height={24} color={colors.surface} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Typography variant="h3" color={colors.surface} style={styles.headerTitle}>
              {MyHomesConstants.title}
            </Typography>
            <Typography variant="caption" color={colors.surface} style={styles.headerSubtitle}>
              {MyHomesConstants.subtitle}
            </Typography>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Typography variant="body" color={colors.secondaryText}>
                Loading homes...
              </Typography>
            </View>
          ) : homes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Typography variant="body" color={colors.secondaryText} style={styles.emptyText}>
                {MyHomesConstants.noHomesMessage}
              </Typography>
            </View>
          ) : (
            <>
              {/* Home Cards */}
              {homes.map(renderHomeCard)}
              
              {/* Add New Home Card */}
              <TouchableOpacity
                style={styles.addNewHomeCard}
                onPress={handleAddNewHome}
                accessibilityLabel={MyHomesConstants.addNewHomeAccessibilityLabel}
                accessibilityHint={MyHomesConstants.addNewHomeAccessibilityHint}
              >
                <View style={styles.addNewHomeIcon}>
                  <PlusIcon width={32} height={32} color={colors.secondaryText} />
                </View>
                <Typography variant="body" color={colors.text} style={styles.addNewHomeText}>
                  {MyHomesConstants.addNewHome}
                </Typography>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation 
        items={[
          { key: 'home', label: 'Home', icon: null },
          { key: 'devices', label: 'Devices', icon: null },
          { key: 'energy', label: 'Energy', icon: null },
          { key: 'profile', label: 'Profile', icon: null },
        ]}
        activeKey="profile"
        profile_picture={user?.profile_picture}
        onTabPress={(key) => {
          if (key === 'home') {
            router.push('/(app)/home');
          } else if (key === 'devices') {
            router.push('/(app)/home');
          } else if (key === 'energy') {
            router.push('/(app)/home');
          } else if (key === 'profile') {
            router.push({ pathname: '/(app)/home', params: { tab: 'profile' } });
          }
        }}
      />
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.navBarBackground,
  },
  header: {
    backgroundColor: colors.navBarBackground,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl + 10,
    paddingBottom: Spacing.sm,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.xxl,
  },
  emptyContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    textAlign: 'center' as const,
  },
  homeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    overflow: 'hidden' as const,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  homeImageContainer: {
    position: 'relative' as const,
    height: 160,
  },
  homeImage: {
    width: '100%' as any,
    height: '100%' as any,
    resizeMode: 'stretch' as const,
  },
  placeholderImage: {
    width: '100%' as any,
    height: '100%' as any,
    backgroundColor: colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  statusBadge: {
    position: 'absolute' as const,
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  homeDetails: {
    padding: Spacing.sm,
  },
  homeHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: Spacing.sm,
  },
  homeInfo: {
    flex: 1,
  },
  homeName: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  locationContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 2,
  },
  locationText: {
    marginLeft: 4,
  },
  guestCount: {
    alignItems: 'flex-end' as const,
  },
  statsContainer: {
    flexDirection: 'row' as const,
    marginBottom: Spacing.sm,
  },
  statItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginRight: Spacing.lg,
  },
  statText: {
    marginLeft: Spacing.xs,
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  controlButton: {
    flex: 1,
    backgroundColor: colors.primary.base,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: 6,
    alignItems: 'center' as const,
    marginRight: Spacing.sm,
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text,
  },
  secondaryButtons: {
    flexDirection: 'row' as const,
  },
  secondaryButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.surface,
    borderRadius: 6,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: Spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addNewHomeCard: {
    backgroundColor: colors.AddhomeCardBackground,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed' as const,
    borderRadius: 12,
    padding: Spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: Spacing.sm,
  },
  addNewHomeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: Spacing.sm,
  },
  addNewHomeText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
};

export default MyHomes;
