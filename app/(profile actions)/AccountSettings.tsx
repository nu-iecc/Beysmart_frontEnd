import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { BASE_URL, getMediaUrl } from '../../constants/api';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { colors } from '../../design-system/colors/colors';
import { BackArrow } from '../../design-system/icons';
import { AlertIcon, ColorPaletteIcon, EditingIcon, FingerprintIcon, GlobalIcon, HomeIcon, KeyIcon, QuestionIcon, ShieldIcon, TrustedPersonIcon } from '../../design-system/icons/filled/';
import { LabeledToggle, TextField } from '../../design-system/inputs';
import { Spacing } from '../../design-system/Layout/spacing';
import { AccountSettingsConstants as ACC } from '../../design-system/Profile actions/Constants';
import { Typography } from '../../design-system/typography/typography';
import { biometricsService } from '../../services';
import apiClient from '../../utils/api';

interface UserProfile {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  profile_picture?: string | null;
  email_verified?: boolean;
  password_changed_at?: string | null;
  date_joined?: string | null;
}

const AccountSettings = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  // Biometrics
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricTypeName, setBiometricTypeName] = useState('Biometrics');
  const [isLoadingBiometrics, setIsLoadingBiometrics] = useState(true);
  // Preferences
  const [prefTheme, setPrefTheme] = useState<'light' | 'dark' | undefined>(undefined);
  const [prefNotificationsAllHomes, setPrefNotificationsAllHomes] = useState<boolean | undefined>(undefined);
  const [prefUnits, setPrefUnits] = useState<'C' | 'F' | undefined>(undefined);
  const [prefLanguage, setPrefLanguage] = useState<string | undefined>(undefined);

  useEffect(() => {
    const load = async () => {
      try {
        // Check if user is authenticated first
        const authCheck = await apiClient.get('auth/check-auth/');
        if (authCheck.data.authenticated) {
          const res = await apiClient.get('auth/profile/');
          const data: UserProfile = res.data;
          setUser(data);
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
        } else {
          console.log('User not authenticated, redirecting to login');
          router.push('/(auth)/loginpage');
        }
      } catch (e) {
        console.error('Failed to load profile', e);
        // If authentication fails, redirect to login
        router.push('/(auth)/loginpage');
      }
      try {
        const stored2FA = await AsyncStorage.getItem('twoFactorEnabled');
        if (stored2FA !== null) setTwoFAEnabled(stored2FA === 'true');
      } catch {}
      
      // Load biometric settings
      try {
        setIsLoadingBiometrics(true);
        const hasHardware = await biometricsService.hasHardware();
        const isEnrolled = await biometricsService.isEnrolled();
        const canSetup = await biometricsService.canSetupBiometrics();
        
        console.log('🔐 Biometric check:', { hasHardware, isEnrolled, canSetup });
        
        setBiometricsAvailable(canSetup);
        
        if (canSetup) {
          const isEnabled = await biometricsService.isBiometricsEnabled();
          setBiometricsEnabled(isEnabled);
          
          const typeName = await biometricsService.getBiometricTypeName();
          setBiometricTypeName(typeName);
          console.log('🔐 Biometric type:', typeName, 'Enabled:', isEnabled);
        } else {
          console.log('🔐 Biometrics NOT available - hasHardware:', hasHardware, 'isEnrolled:', isEnrolled);
        }
      } catch (e) {
        console.error('Failed to load biometric settings', e);
      } finally {
        setIsLoadingBiometrics(false);
      }
    };
    load();
  }, []);

  const handleBack = () => router.back();

  const handleNameEdit = () => {
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.put('auth/profile/', {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      // Refresh local user state
      setUser((prev) => ({ ...(prev || {}), first_name: firstName.trim(), last_name: lastName.trim() }));
      setIsEditingName(false);
    } catch (e) {
      console.error('Failed to save profile', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNameCancel = () => {
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name || '');
    setIsEditingName(false);
  };

  const handlePictureEdit = () => {
    router.push({
      pathname: '/(auth)/ProfilePhoto',
      params: { fromAccountSettings: 'true' }
    });
  };

  // Refresh user data when returning from ProfilePhoto
  useFocusEffect(
    useCallback(() => {
      const refreshUserData = async () => {
        try {
          const res = await apiClient.get('auth/profile/');
          const data: UserProfile = res.data;
          setUser(data);
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          
          // Update AsyncStorage with fresh data
          const userDataString = await AsyncStorage.getItem('userData');
          if (userDataString) {
            const userData = JSON.parse(userDataString);
            userData.profile_picture = data.profile_picture;
            userData.first_name = data.first_name;
            userData.last_name = data.last_name;
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
          }
        } catch (e) {
          console.error('Failed to refresh profile data', e);
        }
      };
      refreshUserData();
    }, [])
  );

  const handleTwoFAToggle = async (val: boolean) => {
    setTwoFAEnabled(val);
    // Persist locally for now; backend endpoint to be added later
    try { await AsyncStorage.setItem('twoFactorEnabled', val ? 'true' : 'false'); } catch {}
  };

  const handleBiometricToggle = async (val: boolean) => {
    if (val) {
      // Enable biometrics - first authenticate to confirm
      const authResult = await biometricsService.authenticate(
        `Authenticate with ${biometricTypeName} to enable biometric login`
      );
      
      if (authResult.success) {
        // Get user phone from stored data
        const userData = await AsyncStorage.getItem('userData');
        const phoneNumber = userData ? JSON.parse(userData).phone_number : '';
        
        // Call backend to generate biometric token
        const enableResult = await biometricsService.enableBiometrics(phoneNumber);
        
        if (enableResult.success) {
          setBiometricsEnabled(true);
          Alert.alert('Success', `${biometricTypeName} login has been enabled.`);
        } else {
          Alert.alert('Error', enableResult.error || 'Failed to enable biometric login. Please try again.');
        }
      } else if (!authResult.cancelled) {
        Alert.alert('Authentication Failed', authResult.error || 'Please try again.');
      }
    } else {
      // Disable biometrics
      await biometricsService.disableBiometrics();
      setBiometricsEnabled(false);
      Alert.alert('Disabled', `${biometricTypeName} login has been disabled.`);
    }
  };

  const profileImage = getMediaUrl(user?.profile_picture);
  const displayName = user?.first_name || user?.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Customer';

  const formatRelativeTime = (isoString?: string | null) => {
    if (!isoString) return 'Never changed';
    const updated = new Date(isoString).getTime();
    if (Number.isNaN(updated)) return 'Unknown';
    const diffMs = Date.now() - updated;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return `${minutes || 1} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 8) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  };

  const handlePasswordPress = () => {
    router.push({
      pathname: '/(auth)/resetpassword',
      params: { fromAccountSettings: 'true' }
    } as never);
  };

  // Regular logout - preserves biometric settings
  const handleLogout = async () => {
    try {
      // Call the backend logout API
      await apiClient.post('auth/logout/');
      
      // Clear session data but preserve biometric settings
      await AsyncStorage.multiRemove([
        'userData',
        'csrftoken',
        'twoFactorEnabled',
        'pref_theme',
        'pref_notifications_all_homes',
        'pref_units',
        'pref_language',
        'isAuthenticated',
        'loginMethod'
      ]);
      
      // Navigate to welcome page (biometrics will still work)
      router.replace('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails on backend, clear local data and navigate
      try {
        await AsyncStorage.multiRemove([
          'userData',
          'csrftoken',
          'twoFactorEnabled',
          'pref_theme',
          'pref_notifications_all_homes',
          'pref_units',
          'pref_language',
          'isAuthenticated',
          'loginMethod'
        ]);
        router.replace('/');
      } catch (clearError) {
        console.error('Failed to clear local data:', clearError);
        router.replace('/');
      }
    }
  };

  // Sign out from all devices - clears biometric settings
  const handleSignOutAllDevices = async () => {
    try {
      // Call the backend logout API
      await apiClient.post('auth/logout/');
      
      // Clear all stored data from AsyncStorage
      await AsyncStorage.multiRemove([
        'userData',
        'csrftoken',
        'twoFactorEnabled',
        'pref_theme',
        'pref_notifications_all_homes',
        'pref_units',
        'pref_language',
        'isAuthenticated',
        'loginMethod'
      ]);
      
      // Clear biometric settings (including token)
      await biometricsService.clearBiometricSettings();
      
      // Navigate to welcome page
      router.replace('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails on backend, clear local data and navigate
      try {
        await AsyncStorage.multiRemove([
          'userData',
          'csrftoken',
          'twoFactorEnabled',
          'pref_theme',
          'pref_notifications_all_homes',
          'pref_units',
          'pref_language',
          'isAuthenticated',
          'loginMethod'
        ]);
        await biometricsService.clearBiometricSettings();
        router.replace('/');
      } catch (clearError) {
        console.error('Failed to clear local data:', clearError);
        // Still navigate even if clearing fails
        router.replace('/');
      }
    }
  };

  const [memberships, setMemberships] = useState<any[]>([]);
  useEffect(() => {
    const buildAbsoluteUrl = (path?: string | null) => {
      if (!path) return null;
      // If backend already returned absolute URL, use it
      if (path.startsWith('http://') || path.startsWith('https://')) return path;
      const origin = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
      // Remove trailing /api if present
      const base = origin.endsWith('/api') ? origin.slice(0, -4) : origin;
      return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
    };
    const loadMemberships = async () => {
      try {
        const res = await apiClient.get('home/homes/');
        const homes = res.data || [];
        setMemberships(homes.map((h: any) => ({
          id: h.id,
          name: h.name,
          photo: buildAbsoluteUrl(h.photo),
          // This endpoint returns only homes owned by the current user
          role: 'ADMIN',
        })));
      } catch (e) {
        console.error('Failed to load homes', e);
      }
    };
    loadMemberships();
  }, []);

  const navigateToHome = (homeId: string | number) => {
    router.push({ pathname: '/(app)/home', params: { selectedHomeId: String(homeId) } } as any);
  };

  // Load preferences from AsyncStorage (front-end source for now)
  useFocusEffect(
    useCallback(() => {
      const loadPrefs = async () => {
        try {
          const theme = await AsyncStorage.getItem('pref_theme'); // 'light' | 'dark'
          const noti = await AsyncStorage.getItem('pref_notifications_all_homes'); // 'true' | 'false'
          const units = await AsyncStorage.getItem('pref_units'); // 'C' | 'F'
          const lang = await AsyncStorage.getItem('pref_language'); // e.g., 'English'
          if (theme === 'light' || theme === 'dark') setPrefTheme(theme);
          if (noti === 'true' || noti === 'false') setPrefNotificationsAllHomes(noti === 'true');
          if (units === 'C' || units === 'F') setPrefUnits(units);
          if (lang) setPrefLanguage(lang);
        } catch (e) {
          console.error('Failed to load preferences', e);
        }
      };
      loadPrefs();
    }, [])
  );

  const themeSubtitle = prefTheme === 'dark' ? 'Dark Mode' : prefTheme === 'light' ? 'Light Mode' : ACC.PREFERENCES.THEME.SUBTITLE;
  const notificationsSubtitle = prefNotificationsAllHomes === undefined ? ACC.PREFERENCES.NOTIFICATIONS.SUBTITLE : (prefNotificationsAllHomes ? 'All homes enabled' : 'Disabled');
  const unitsLanguageSubtitle = `${prefUnits === 'F' ? '°F' : prefUnits === 'C' ? '°C' : '°F'}, ${prefLanguage || 'English'}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} accessibilityLabel={ACC.ACCESSIBILITY.BACK} accessibilityHint={ACC.ACCESSIBILITY.BACK_HINT}>
            <BackArrow width={24} height={24} color={colors.surface} />
          </TouchableOpacity>
          <View>
            <Typography variant="h3" color={colors.surface} style={styles.headerTitle}>{ACC.TITLE}</Typography>
            <Typography variant="caption" color={colors.surface}>{ACC.SUBTITLE}</Typography>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          {/* Profile Info */}
          <View style={styles.profileSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity style={styles.avatarWrapper} onPress={handlePictureEdit}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: colors.primary.base, alignItems: 'center', justifyContent: 'center' }]}>
                    <Typography variant="h3" color={colors.surface}>{displayName.charAt(0).toUpperCase()}</Typography>
                  </View>
                )}
                <View style={styles.avatarEdit}>
                  <EditingIcon width={16} height={16} color={colors.text} />
                </View>
              </TouchableOpacity>
              <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Typography variant="h2" color={colors.text} style={{ fontSize: 20, fontWeight: '700', flex: 1 }}>{displayName}</Typography>
                  <TouchableOpacity onPress={handleNameEdit} style={{ marginLeft: Spacing.xs }}>
                    <EditingIcon width={16} height={16} color={colors.secondaryText} />
                  </TouchableOpacity>
                </View>
                 <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs }}>
                   <Typography variant="caption" color={colors.secondaryText} style={{ flex: 1 }}>{user?.email || ''}</Typography>
                   {user?.email_verified && (
                     <View style={styles.verifiedIcon}>
                       <Typography variant="caption" color={colors.surface} style={{ fontSize: 10, fontWeight: 'bold' }}>✓</Typography>
                     </View>
                   )}
                 </View>
                 <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs }}>
                   <Typography variant="caption" color={colors.secondaryText} style={{ flex: 1 }}>{user?.phone_number || ''}</Typography>
                   <View style={styles.verifiedIcon}>
                     <Typography variant="caption" color={colors.surface} style={{ fontSize: 10, fontWeight: 'bold' }}>✓</Typography>
                   </View>
                 </View>
              </View>
            </View>

            {isEditingName && (
              <View style={{ marginTop: Spacing.md }}>
                <TextField 
                  label={ACC.FIELDS.FIRST_NAME.LABEL} 
                  value={firstName} 
                  onChangeText={setFirstName} 
                  placeholder={ACC.FIELDS.FIRST_NAME.PLACEHOLDER} 
                />
                <TextField 
                  label={ACC.FIELDS.LAST_NAME.LABEL} 
                  value={lastName} 
                  onChangeText={setLastName} 
                  placeholder={ACC.FIELDS.LAST_NAME.PLACEHOLDER} 
                />
                <View style={{ flexDirection: 'row', marginTop: Spacing.sm }}>
                  <View style={{ flex: 1, marginRight: Spacing.xs }}>
                    <AppButton 
                      variant="secondaryLarge" 
                      title={ACC.CTA.CANCEL} 
                      onPress={handleNameCancel} 
                      disabled={isSaving}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                    <AppButton 
                      variant="primaryLarge" 
                      title={ACC.CTA.SAVE} 
                      onPress={handleNameSave} 
                      disabled={isSaving}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Separator Line */}
          <View style={styles.separator} />

          {/* Account Security */}
          <Typography variant="h2" color={colors.text} style={styles.sectionHeader}>{ACC.SECURITY.TITLE}</Typography>

          {/* Two-Factor */}
          <View style={styles.rowCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: Spacing.sm }}>
              <View style={[styles.securityIcon, { backgroundColor: colors.primary.base }] }>
                <ShieldIcon width={20} height={20} color={colors.text} />
              </View>
              <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                <Typography variant="body" color={colors.text} style={{ fontWeight: '600' }}>{ACC.SECURITY.TWO_FA.LABEL}</Typography>
                <Typography variant="caption" color={colors.primary.darker}>{twoFAEnabled ? ACC.SECURITY.TWO_FA.ENABLED_DESC : ACC.SECURITY.TWO_FA.DISABLED_DESC}</Typography>
              </View>
            </View>
            <View style={{ flexShrink: 0 }}>
              <LabeledToggle label="" value={twoFAEnabled} onValueChange={handleTwoFAToggle} variant="success" />
            </View>
          </View>

          {/* Biometric Login - Show loading state or the actual card */}
          {isLoadingBiometrics ? (
            <View style={styles.rowCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: Spacing.sm }}>
                <View style={[styles.securityIcon, { backgroundColor: colors.border }]}>
                  <ActivityIndicator size="small" color={colors.secondaryText} />
                </View>
                <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                  <View style={{ height: 16, width: '60%', backgroundColor: colors.border, borderRadius: 4, marginBottom: 4 }} />
                  <View style={{ height: 12, width: '80%', backgroundColor: colors.border, borderRadius: 4 }} />
                </View>
              </View>
            </View>
          ) : biometricsAvailable ? (
            <View style={styles.rowCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: Spacing.sm }}>
                <View style={[styles.securityIcon, { backgroundColor: colors.secondary.base }] }>
                  <FingerprintIcon width={20} height={20} color={colors.surface} />
                </View>
                <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                  <Typography variant="body" color={colors.text} style={{ fontWeight: '600' }}>{biometricTypeName} Login</Typography>
                  <Typography variant="caption" color={biometricsEnabled ? colors.primary.darker : colors.secondaryText}>
                    {biometricsEnabled ? `${biometricTypeName} login is enabled` : `Use ${biometricTypeName} for quick login`}
                  </Typography>
                </View>
              </View>
              <View style={{ flexShrink: 0 }}>
                <LabeledToggle label="" value={biometricsEnabled} onValueChange={handleBiometricToggle} variant="success" />
              </View>
            </View>
          ) : null}

          {/* Password */}
          <TouchableOpacity style={styles.rowCard} onPress={handlePasswordPress} accessibilityRole="button">
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.securityIcon, { backgroundColor: colors.navBarBackground }] }>
                <KeyIcon width={20} height={20} color={colors.surface} />
              </View>
              <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                <Typography variant="body" color={colors.text} style={{ fontWeight: '600' }}>{ACC.SECURITY.PASSWORD.LABEL}</Typography>
                <Typography variant="caption" color={colors.secondaryText}>{ACC.SECURITY.PASSWORD.LAST_CHANGED_PREFIX} {formatRelativeTime(user?.password_changed_at || user?.date_joined)}</Typography>
              </View>
            </View>
            <BackArrow width={18} height={18} color={colors.secondaryText} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          {/* Linked Devices */}
          <TouchableOpacity style={styles.rowCard} disabled>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.securityIcon, { backgroundColor: colors.navBarBackground }] }>
                <QuestionIcon width={20} height={20} color={colors.surface} />
              </View>
              <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                <Typography variant="body" color={colors.text} style={{ fontWeight: '600' }}>{ACC.SECURITY.LINKED_DEVICES.LABEL}</Typography>
                <Typography variant="caption" color={colors.secondaryText}>{`0 ${ACC.SECURITY.LINKED_DEVICES.ACTIVE_SESSIONS_SUFFIX}`}</Typography>
              </View>
            </View>
            <BackArrow width={18} height={18} color={colors.secondaryText} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          {/* Home Memberships */}
          <Typography variant="h2" color={colors.text} style={styles.membershipsHeader}>{ACC.MEMBERSHIPS.TITLE}</Typography>
          {memberships.map((home) => (
            <TouchableOpacity key={home.id} style={styles.membershipCard} onPress={() => navigateToHome(home.id)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {home.photo ? (
                  <Image source={{ uri: home.photo }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                ) : (
                  <View style={[styles.securityIcon, { backgroundColor: colors.primary.base }] }>
                    <HomeIcon width={20} height={20} color={colors.text} />
                  </View>
                )}
                <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                  <Typography variant="body" color={colors.text} style={{ fontWeight: '600' }}>{home.name}</Typography>
                  <Typography variant="caption" color={colors.secondaryText}>{home.role === 'ADMIN' ? ACC.MEMBERSHIPS.ROLE_ADMIN : ACC.MEMBERSHIPS.ROLE_GUEST}</Typography>
                </View>
              </View>
              <BackArrow width={18} height={18} color={colors.secondaryText} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          ))}

          {/* Preferences */}
          <Typography variant="h2" color={colors.text} style={styles.preferencesHeader}>{ACC.PREFERENCES.TITLE}</Typography>

          <TouchableOpacity style={styles.preferenceCard} onPress={() => { /* navigate later */ }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.securityIcon, { backgroundColor: colors.navBarBackground }]}>
                <ColorPaletteIcon width={20} height={20} color={colors.surface} />
              </View>
              <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                <Typography variant="body" color={colors.text} style={{ fontWeight: '600' }}>{ACC.PREFERENCES.THEME.LABEL}</Typography>
                <Typography variant="caption" color={colors.secondaryText}>{themeSubtitle}</Typography>
              </View>
            </View>
            <BackArrow width={18} height={18} color={colors.secondaryText} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.preferenceCard} onPress={() => { /* navigate later */ }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.securityIcon, { backgroundColor: colors.navBarBackground }]}>
                <AlertIcon width={20} height={20} color={colors.surface} />
              </View>
              <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                <Typography variant="body" color={colors.text} style={{ fontWeight: '600' }}>{ACC.PREFERENCES.NOTIFICATIONS.LABEL}</Typography>
                <Typography variant="caption" color={colors.secondaryText}>{notificationsSubtitle}</Typography>
              </View>
            </View>
            <BackArrow width={18} height={18} color={colors.secondaryText} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.preferenceCard} onPress={() => { /* navigate later */ }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.securityIcon, { backgroundColor: colors.navBarBackground }]}>
                <GlobalIcon width={20} height={20} color={colors.surface} />
              </View>
              <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                <Typography variant="body" color={colors.text} style={{ fontWeight: '600' }}>{ACC.PREFERENCES.UNITS_LANGUAGE.LABEL}</Typography>
                <Typography variant="caption" color={colors.secondaryText}>{unitsLanguageSubtitle}</Typography>
              </View>
            </View>
            <BackArrow width={18} height={18} color={colors.secondaryText} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          {/* Emergency Contacts */}
          <Typography variant="h2" color={colors.text} style={styles.emergencyHeader}>{ACC.EMERGENCY.TITLE}</Typography>

          {/* Empty state - will be populated from backend later */}
          <View style={styles.emergencyCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.securityIcon, { backgroundColor: colors.secondaryText }]}> 
                <TrustedPersonIcon width={20} height={20} color={colors.surface} />
              </View>
              <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                <Typography variant="body" color={colors.secondaryText} style={{ fontStyle: 'italic' }}>
                  {ACC.EMPTY_STATES.EMERGENCY_CONTACTS.TITLE}
                </Typography>
                <Typography variant="caption" color={colors.secondaryText}>
                  {ACC.EMPTY_STATES.EMERGENCY_CONTACTS.SUBTITLE}
                </Typography>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.addTrustedButton} onPress={() => { /* navigate later */ }}>
            <Typography variant="body" color={colors.text}>+ {ACC.EMERGENCY.ADD_BUTTON}</Typography>
          </TouchableOpacity>

          {/* Actions */}
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary.base }]} onPress={() => { /* navigate later */ }}>
            <Typography variant="body" color={colors.text} style={{ fontWeight: '700', textAlign: 'center' }}>{ACC.ACTIONS.EXPORT_DATA}</Typography>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <Typography variant="body" color={colors.text} style={{ fontWeight: '600', textAlign: 'center' }}>{ACC.ACTIONS.LOGOUT}</Typography>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleSignOutAllDevices}>
            <Typography variant="body" color={colors.text} style={{ fontWeight: '600', textAlign: 'center' }}>{ACC.ACTIONS.SIGN_OUT_ALL}</Typography>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#EF4444' }]} onPress={() => router.push('/(profile actions)/enterpassword' as any)}>
            <Typography variant="body" color={colors.surface} style={{ fontWeight: '700', textAlign: 'center' }}>{ACC.ACTIONS.DELETE_ACCOUNT}</Typography>
          </TouchableOpacity>
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
    backgroundColor: colors.navBarBackground,
    height: 120,
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
  backButton: { padding: Spacing.xs, marginRight: Spacing.xs },
  headerTitle: { textAlign: 'left' as const, fontSize: 18, fontWeight: '600' as const },
  content: { flex: 1, backgroundColor: colors.background },
  body: { padding: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: Spacing.xxl },
  profileSection: {
    paddingVertical: Spacing.md,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: Spacing.sm,
  },
  verifiedIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: Spacing.xs,
  },
  avatarWrapper: { position: 'relative' as const },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarEdit: {
    position: 'absolute' as const,
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary.base,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  securityCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: Spacing.sm,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  securityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary.base}33`,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sectionHeader: {
    marginTop: Spacing.xs - 12,
    marginBottom: Spacing.xs,
    fontSize: 18,
  },
  membershipsHeader: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs - 5,
    fontSize: 18,
  },
  membershipCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: Spacing.sm,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  preferencesHeader: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs - 5,
    fontSize: 18,
  },
  preferenceCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: Spacing.sm,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  emergencyHeader: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs -5,
    fontSize: 18,
  },
  emergencyCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: Spacing.sm,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  addTrustedButton: {
    backgroundColor: colors.border,
    borderRadius: 20,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  actionButton: {
    backgroundColor: colors.border,
    borderRadius: 20,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: Spacing.sm,
  },
};

export default AccountSettings;