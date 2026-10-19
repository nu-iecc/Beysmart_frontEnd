import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import ProfilePage from '../(profile actions)/Profile';
import { getMediaUrl } from '../../constants/api';
import { colors } from '../../design-system/colors/colors';
import { BackArrow, Lock } from '../../design-system/icons';
import { Beylock, PlusIcon } from '../../design-system/icons/filled';
import { Spacing } from '../../design-system/Layout/spacing';
import { BottomNavigation } from '../../design-system/Navigation/BottomNavigation';
import { MyDevicesConstants } from '../../design-system/Profile actions/Constants';
import { Typography } from '../../design-system/typography/typography';
import apiClient from '../../utils/api';
import { scale, scaleFont } from '../../utils/responsive';

// Types
interface Device {
  id: number;
  name: string;
  device_type: string;
  room?: number;
  room_name?: string;
  home?: number;
  home_name?: string;
  tb_device_id?: string;
  status?: string;
  is_online?: boolean;
  battery_level?: number;
  created_at: string;
  updated_at: string;
}

interface UserData {
  first_name?: string;
  profile_picture?: string;
}

type FilterType = 'all' | 'online' | 'offline';

const MyDevices: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [homes, setHomes] = useState<{[key: number]: string}>({});
  const [rooms, setRooms] = useState<{[key: number]: string}>({});
  const [showProfile, setShowProfile] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Load user data
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

  // Load devices, homes, and rooms from API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch devices, homes, and rooms in parallel
        const [devicesRes, homesRes, roomsRes] = await Promise.all([
          apiClient.get('home/devices/'),
          apiClient.get('home/homes/'),
          apiClient.get('home/rooms/')
        ]);

        setDevices(devicesRes.data);

        // Create lookup maps for homes and rooms
        const homesMap: {[key: number]: string} = {};
        homesRes.data.forEach((home: any) => {
          homesMap[home.id] = home.name;
        });
        setHomes(homesMap);

        const roomsMap: {[key: number]: string} = {};
        roomsRes.data.forEach((room: any) => {
          roomsMap[room.id] = room.name;
        });
        setRooms(roomsMap);
      } catch (error: any) {
        console.error('Error loading data:', error);
        Alert.alert('Error', MyDevicesConstants.errorLoadingDevices);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter and search logic (consistent order: search first, then filter)
  const getFilteredDevices = () => {
    let filtered = [...devices];

    // Step 1: Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(device => {
        const homeName = device.home ? homes[device.home] : '';
        const roomName = device.room ? rooms[device.room] : '';
        return (
          device.name.toLowerCase().includes(query) ||
          homeName.toLowerCase().includes(query) ||
          roomName.toLowerCase().includes(query)
        );
      });
    }

    // Step 2: Apply status filter
    if (activeFilter === 'online') {
      filtered = filtered.filter(device => device.is_online === true);
    } else if (activeFilter === 'offline') {
      filtered = filtered.filter(device => device.is_online !== true);
    }

    return filtered;
  };

  const filteredDevices = getFilteredDevices();

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Handle control button press for smart locks
  const handleControl = (device: Device) => {
    const homeName = device.home ? homes[device.home] : 'Home';
    router.push({
      pathname: '/(Lock/Unlock)/LockControlScreen',
      params: {
        deviceId: device.id.toString(),
        deviceName: device.name,
        homeName: homeName,
      },
    } as never);
  };

  // Handle add new device
  const handleAddNewDevice = () => {
    router.push('/(devices)/AddDevice2' as never);
  };

  // Get device icon based on type
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'beylock':
      case 'smart_lock':
      case 'lock':
        return <Beylock width={28} height={28} color={colors.primary.darker} />;
      default:
        return <Beylock width={28} height={28} color={colors.primary.darker} />;
    }
  };

  // Get status badge for device
  const getStatusBadge = (device: Device) => {
    const isOnline = device.is_online === true;
    
    return {
      text: isOnline ? MyDevicesConstants.online : MyDevicesConstants.offline,
      color: isOnline ? colors.success : colors.error,
      backgroundColor: isOnline ? colors.successLight : colors.lightPink
    };
  };

  // Render device card - IMPROVED LAYOUT with text ellipsis
  const renderDeviceCard = (device: Device) => {
    const statusBadge = getStatusBadge(device);

    return (
      <TouchableOpacity
        key={device.id}
        style={styles.deviceCard}
        onPress={() => handleControl(device)}
        activeOpacity={0.7}
        accessibilityLabel={`${device.name} device`}
        accessibilityHint="Tap to control this device"
      >
        <View style={styles.deviceRow}>
          {/* Device Icon */}
          <View style={styles.deviceIconWrapper}>
            {getDeviceIcon(device.device_type)}
          </View>

          {/* Device Info */}
          <View style={styles.deviceInfo}>
            <Typography 
              variant="h3" 
              color={colors.text} 
              style={styles.deviceName}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {device.name}
            </Typography>
            <View style={styles.deviceMeta}>
              <Typography 
                variant="caption" 
                color={colors.secondaryText} 
                style={styles.locationText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {device.home ? homes[device.home] || 'Unknown Home' : 'Unknown Home'}
              </Typography>
              {device.room && rooms[device.room] && (
                <>
                  <View style={styles.metaDot} />
                  <Typography 
                    variant="caption" 
                    color={colors.secondaryText} 
                    style={styles.locationText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {rooms[device.room]}
                  </Typography>
                </>
              )}
            </View>
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.backgroundColor }]}>
              <View style={[styles.statusDot, { backgroundColor: statusBadge.color }]} />
              <Typography variant="caption" color={statusBadge.color} style={styles.statusText}>
                {statusBadge.text}
              </Typography>
            </View>
          </View>

          {/* Chevron Icon */}
          <View style={styles.chevronContainer}>
            <Typography variant="h1" color={colors.secondaryText} style={styles.chevronIcon}>
              ›
            </Typography>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render filter button
  const renderFilterButton = (filter: FilterType, label: string) => {
    const isActive = activeFilter === filter;
    return (
      <TouchableOpacity
        key={filter}
        style={[
          styles.filterButton,
          isActive && styles.filterButtonActive
        ]}
        onPress={() => setActiveFilter(filter)}
        accessibilityLabel={`Filter by ${label}`}
        accessibilityState={{ selected: isActive }}
      >
        <Typography 
          variant="body" 
          color={isActive ? colors.text : colors.secondaryText}
          style={styles.filterButtonText}
        >
          {label}
        </Typography>
      </TouchableOpacity>
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
            accessibilityLabel={MyDevicesConstants.backButtonAccessibilityLabel}
            accessibilityHint={MyDevicesConstants.backButtonAccessibilityHint}
          >
            <BackArrow width={24} height={24} color={colors.surface} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Typography variant="h2" color={colors.surface} style={styles.headerTitle}>
              {MyDevicesConstants.title}
            </Typography>
            <Typography variant="caption" color={colors.surface} style={styles.headerSubtitle}>
              {MyDevicesConstants.subtitle}
            </Typography>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.contentContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary.base} />
              <Typography variant="body" color={colors.secondaryText} style={styles.loadingText}>
                {MyDevicesConstants.loadingMessage}
              </Typography>
            </View>
          ) : devices.length === 0 ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
              <View style={styles.emptyContainer}>
                <Typography variant="h3" color={colors.text} style={styles.emptyTitle}>
                  No devices yet
                </Typography>
                <Typography variant="body" color={colors.secondaryText} style={styles.emptyText}>
                  {MyDevicesConstants.noDevicesMessage}
                </Typography>
                {/* Add New Device Card for empty state */}
                <TouchableOpacity
                  style={styles.addNewDeviceCard}
                  onPress={handleAddNewDevice}
                  accessibilityLabel={MyDevicesConstants.addNewDeviceAccessibilityLabel}
                  accessibilityHint={MyDevicesConstants.addNewDeviceAccessibilityHint}
                >
                  <View style={styles.addNewDeviceIcon}>
                    <PlusIcon width={32} height={32} color={colors.primary.base} />
                  </View>
                  <Typography variant="body" color={colors.text} style={styles.addNewDeviceText}>
                    {MyDevicesConstants.addNewDevice}
                  </Typography>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <View style={styles.searchIconContainer}>
                  <Lock width={20} height={20} color={colors.secondaryText} />
                </View>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search devices..."
                  placeholderTextColor={colors.secondaryText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  accessibilityLabel="Search devices"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setSearchQuery('')}
                    accessibilityLabel="Clear search"
                  >
                    <Typography variant="body" color={colors.secondaryText}>
                      ✕
                    </Typography>
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter Tabs */}
              <View style={styles.filterContainer}>
                {renderFilterButton('all', 'All')}
                {renderFilterButton('online', 'Online')}
                {renderFilterButton('offline', 'Offline')}
              </View>

              {/* Device List */}
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* Section Title with count */}
                <View style={styles.sectionHeader}>
                  <Typography variant="h3" color={colors.text} style={styles.sectionTitle}>
                    My Devices
                  </Typography>
                  <View style={styles.countBadge}>
                    <Typography variant="caption" color={colors.secondaryText} style={styles.countText}>
                      {filteredDevices.length}
                    </Typography>
                  </View>
                </View>

                {filteredDevices.length === 0 ? (
                  <View style={styles.noResultsContainer}>
                    <Typography variant="body" color={colors.secondaryText} style={styles.noResultsText}>
                      No devices found
                    </Typography>
                    <Typography variant="caption" color={colors.secondaryText} style={styles.noResultsSubtext}>
                      Try adjusting your search or filter
                    </Typography>
                  </View>
                ) : (
                  <>
                    {/* Device Cards */}
                    {filteredDevices.map(renderDeviceCard)}
                  </>
                )}

                {/* Add New Device Card */}
                <TouchableOpacity
                  style={styles.addNewDeviceCard}
                  onPress={handleAddNewDevice}
                  accessibilityLabel={MyDevicesConstants.addNewDeviceAccessibilityLabel}
                  accessibilityHint={MyDevicesConstants.addNewDeviceAccessibilityHint}
                >
                  <View style={styles.addNewDeviceIcon}>
                    <PlusIcon width={32} height={32} color={colors.primary.base} />
                  </View>
                  <Typography variant="body" color={colors.text} style={styles.addNewDeviceText}>
                    {MyDevicesConstants.addNewDevice}
                  </Typography>
                </TouchableOpacity>
              </ScrollView>
            </>
          )}
        </View>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation 
        items={[
          { key: 'home', label: 'Home', icon: null },
          { key: 'devices', label: 'Devices', icon: null },
          { key: 'energy', label: 'Energy', icon: null },
          { key: 'profile', label: 'Profile', icon: null },
        ]}
        activeKey="devices"
        profile_picture={user?.profile_picture}
        onTabPress={(key: string) => {
          if (key === 'home') {
            router.push('/(app)/home');
          } else if (key === 'devices') {
            // Already on devices screen
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
        onClose={() => setShowProfile(false)}
        userData={user ? {
          name: user.first_name || null,
          email: userEmail,
          profilePicture: user.profile_picture || null,
          homesCount: Object.keys(homes).length
        } : undefined}
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
    backgroundColor: colors.navBarBackground,
  },
  header: {
    backgroundColor: colors.navBarBackground,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + 10,
    paddingBottom: Spacing.md,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: scaleFont(20),
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: scaleFont(14),
    opacity: 0.8,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  contentContainer: {
    flex: 1,
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600' as const,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    textAlign: 'center' as const,
    marginBottom: Spacing.xl,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIconContainer: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFont(15),
    color: colors.text,
    padding: 0,
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  filterContainer: {
    flexDirection: 'row' as const,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary.base,
    borderColor: colors.primary.base,
  },
  filterButtonText: {
    fontSize: scaleFont(14),
    fontWeight: '600' as const,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600' as const,
  },
  countBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: Spacing.sm,
  },
  countText: {
    fontSize: scaleFont(12),
    fontWeight: '600' as const,
  },
  noResultsContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.xxl * 2,
  },
  noResultsText: {
    fontSize: scaleFont(16),
    fontWeight: '600' as const,
    marginBottom: Spacing.xs,
  },
  noResultsSubtext: {
    fontSize: scaleFont(14),
  },
  deviceCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  deviceRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  deviceIconWrapper: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(16),
    backgroundColor: colors.primary.base + '20',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: scale(Spacing.md),
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: scaleFont(16),
    fontWeight: '600' as const,
    marginBottom: scale(6),
    lineHeight: scaleFont(20),
  },
  deviceMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: scale(6),
  },
  locationText: {
    fontSize: scaleFont(13),
    flexShrink: 1,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.secondaryText,
    opacity: 0.5,
    marginHorizontal: Spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start' as const,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: scaleFont(12),
    fontWeight: '600' as const,
  },
  chevronContainer: {
    marginLeft: Spacing.sm,
    justifyContent: 'center' as const,
  },
  chevronIcon: {
    fontSize: scaleFont(32),
    lineHeight: scaleFont(32),
    opacity: 0.3,
  },
  addNewDeviceCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed' as const,
    borderRadius: scale(16),
    paddingVertical: scale(Spacing.xl),
    paddingHorizontal: scale(Spacing.lg),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: scale(Spacing.sm),
  },
  addNewDeviceIcon: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: colors.primary.base + '20',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: scale(Spacing.sm),
  },
  addNewDeviceText: {
    fontSize: scaleFont(15),
    fontWeight: '600' as const,
  },
};

export default MyDevices;
