import LockSubpage from '@/components/LockSubpage';
import { toast } from 'sonner-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { BASE_URL, getMediaUrl } from '../../constants/api';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { colors } from '../../design-system/colors/colors';
import { AlertIcon, ColorPaletteIcon, FingerprintIcon, GlobalIcon, HomeIcon, KeyIcon, QuestionIcon, ShieldIcon, TrustedPersonIcon } from '../../design-system/icons/filled/';
import { TextField } from '../../design-system/inputs';
import { AccountSettingsConstants as ACC } from '../../design-system/Profile actions/Constants';
import { Typography } from '../../design-system/typography/typography';
import { biometricsService } from '../../services';
import apiClient from '../../utils/api';

type IconComponent = React.ComponentType<{ width?: number; height?: number; color?: string }>;

function SectionLabel({ children }: { children: string }) {
  return <Typography variant="caption" color={colors.disabled} style={styles.sectionLabel}>{children.toUpperCase()}</Typography>;
}

function Row({ Icon, iconBg = colors.navBarBackground, iconColor = colors.surface, image, label, subtitle, subtitleColor = colors.secondaryText, onPress, right, divider }: {
  Icon?: IconComponent; iconBg?: string; iconColor?: string; image?: string | null; label: string; subtitle?: string; subtitleColor?: string;
  onPress?: () => void; right?: React.ReactNode; divider?: boolean;
}) {
  const content = <>
    {image ? <Image source={{ uri: image }} style={styles.rowIcon} /> : <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>{Icon && <Icon width={19} height={19} color={iconColor} />}</View>}
    <View style={styles.rowCopy}>
      <Typography variant="body" style={styles.rowLabel}>{label}</Typography>
      {!!subtitle && <Typography variant="caption" color={subtitleColor} style={styles.rowSubtitle}>{subtitle}</Typography>}
    </View>
    {(right || onPress) && <View style={styles.rowAccessory}>{right ?? <Ionicons name="chevron-forward" size={18} color={colors.notactiveicon} />}</View>}
  </>;
  const rowStyle = [styles.row, divider && styles.divider];
  return onPress
    ? <TouchableOpacity style={rowStyle} onPress={onPress} activeOpacity={0.7} accessibilityRole="button">{content}</TouchableOpacity>
    : <View style={rowStyle}>{content}</View>;
}

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
 const comingSoon = (label: string) => () => toast.info(label + ' is coming soon.');
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
    <LockSubpage title="Account settings" lockName="Your profile and preferences" busy={isSaving}>
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.profile}>
            <TouchableOpacity style={styles.avatarButton} onPress={handlePictureEdit} accessibilityRole="button" accessibilityLabel="Change profile photo">
              {profileImage
                ? <Image source={{ uri: profileImage }} style={styles.avatar} />
                : <View style={[styles.avatar, styles.avatarFallback]}><Typography variant="h2">{displayName.charAt(0).toUpperCase()}</Typography></View>}
              <View style={styles.avatarEdit}><Ionicons name="pencil" size={12} color={colors.text} /></View>
            </TouchableOpacity>
            <View style={styles.profileCopy}>
              <Typography variant="h3" numberOfLines={2} style={styles.profileName}>{displayName}</Typography>
              {!!user?.email && <View style={styles.contact}>
                <Ionicons name="mail-outline" size={14} color={colors.disabled} />
                <Typography variant="caption" color={colors.secondaryText} numberOfLines={1} style={styles.contactText}>{user.email}</Typography>
                {user.email_verified && <Ionicons name="checkmark-circle" size={15} color={colors.success} accessibilityLabel="Verified email" />}
              </View>}
              {!!user?.phone_number && <View style={styles.contact}>
                <Ionicons name="call-outline" size={14} color={colors.disabled} />
                <Typography variant="caption" color={colors.secondaryText} numberOfLines={1} style={styles.contactText}>{user.phone_number}</Typography>
              </View>}
            </View>
          </View>
          <View style={styles.dividerLine} />
          {isEditingName ? <>
            <TextField label={ACC.FIELDS.FIRST_NAME.LABEL} value={firstName} onChangeText={setFirstName} placeholder={ACC.FIELDS.FIRST_NAME.PLACEHOLDER} disabled={isSaving} />
            <TextField label={ACC.FIELDS.LAST_NAME.LABEL} value={lastName} onChangeText={setLastName} placeholder={ACC.FIELDS.LAST_NAME.PLACEHOLDER} disabled={isSaving} />
            <View style={styles.buttons}>
              <View style={styles.buttonCell}><AppButton variant="secondarySmall" title={ACC.CTA.CANCEL} onPress={handleNameCancel} disabled={isSaving} /></View>
              <View style={styles.buttonCell}><AppButton variant="primarySmall" title={isSaving ? 'Saving...' : ACC.CTA.SAVE} onPress={handleNameSave} disabled={isSaving} /></View>
            </View>
          </> : <TouchableOpacity style={styles.editName} onPress={handleNameEdit} accessibilityRole="button">
            <Ionicons name="pencil-outline" size={16} color={colors.text} />
            <Typography variant="caption" style={styles.bold}>Edit name</Typography>
          </TouchableOpacity>}
        </View>

        <View style={styles.section}>
          <SectionLabel>{ACC.SECURITY.TITLE}</SectionLabel>
          <View style={styles.listCard}>
            <Row Icon={ShieldIcon} iconBg={colors.primary.lightest} iconColor={colors.text} label="Two-factor authentication"
              subtitle={twoFAEnabled ? ACC.SECURITY.TWO_FA.ENABLED_DESC : ACC.SECURITY.TWO_FA.DISABLED_DESC}
              right={<Switch value={twoFAEnabled} onValueChange={handleTwoFAToggle} accessibilityLabel="Two-factor authentication" trackColor={{ false: colors.border, true: colors.primary.base }} thumbColor={colors.surface} ios_backgroundColor={colors.border} />} />
            {(isLoadingBiometrics || biometricsAvailable) && <Row Icon={FingerprintIcon} divider label={biometricTypeName + ' login'}
              subtitle={isLoadingBiometrics ? 'Checking availability...' : biometricsEnabled ? 'Enabled' : 'Disabled'}
              right={isLoadingBiometrics ? <ActivityIndicator size="small" color={colors.navBarBackground} />
                : <Switch value={biometricsEnabled} onValueChange={handleBiometricToggle} accessibilityLabel={biometricTypeName + ' login'} trackColor={{ false: colors.border, true: colors.primary.base }} thumbColor={colors.surface} ios_backgroundColor={colors.border} />} />}
            <Row Icon={KeyIcon} divider label={ACC.SECURITY.PASSWORD.LABEL}
              subtitle={ACC.SECURITY.PASSWORD.LAST_CHANGED_PREFIX + ' ' + formatRelativeTime(user?.password_changed_at || user?.date_joined)} onPress={handlePasswordPress} />
            <Row Icon={QuestionIcon} divider label={ACC.SECURITY.LINKED_DEVICES.LABEL}
              subtitle={'0 ' + ACC.SECURITY.LINKED_DEVICES.ACTIVE_SESSIONS_SUFFIX} onPress={comingSoon('Linked devices')} />
          </View>
        </View>

        {memberships.length > 0 && <View style={styles.section}>
          <SectionLabel>{ACC.MEMBERSHIPS.TITLE}</SectionLabel>
          <View style={styles.listCard}>
            {memberships.map((home, index) => <Row key={home.id} Icon={HomeIcon} iconBg={colors.primary.lightest} iconColor={colors.text} image={home.photo} divider={index > 0}
              label={home.name} onPress={() => navigateToHome(home.id)}
              right={<View style={styles.membershipRight}><View style={styles.roleBadge}><Typography variant="caption" style={styles.roleLabel}>{home.role === 'ADMIN' ? ACC.MEMBERSHIPS.ROLE_ADMIN : ACC.MEMBERSHIPS.ROLE_GUEST}</Typography></View><Ionicons name="chevron-forward" size={18} color={colors.notactiveicon} /></View>} />)}
          </View>
        </View>}

        <View style={styles.section}>
          <SectionLabel>{ACC.PREFERENCES.TITLE}</SectionLabel>
          <View style={styles.listCard}>
            <Row Icon={ColorPaletteIcon} label={ACC.PREFERENCES.THEME.LABEL} subtitle={themeSubtitle} onPress={comingSoon('Theme settings')} />
            <Row Icon={AlertIcon} divider label={ACC.PREFERENCES.NOTIFICATIONS.LABEL} subtitle={notificationsSubtitle} onPress={comingSoon('Notification settings')} />
            <Row Icon={GlobalIcon} divider label={ACC.PREFERENCES.UNITS_LANGUAGE.LABEL} subtitle={unitsLanguageSubtitle} onPress={comingSoon('Units & language settings')} />
          </View>
        </View>

        <View style={styles.section}>
          <SectionLabel>{ACC.EMERGENCY.TITLE}</SectionLabel>
          <View style={styles.card}>
            <Row Icon={TrustedPersonIcon} iconBg={colors.secondaryText} label={ACC.EMPTY_STATES.EMERGENCY_CONTACTS.TITLE} subtitle={ACC.EMPTY_STATES.EMERGENCY_CONTACTS.SUBTITLE} />
            <TouchableOpacity style={styles.addTrusted} onPress={comingSoon('Emergency contacts')} accessibilityRole="button">
              <Ionicons name="add" size={18} color={colors.text} />
              <Typography variant="caption" style={styles.centerLabel}>{ACC.EMERGENCY.ADD_BUTTON}</Typography>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <SectionLabel>Account actions</SectionLabel>
          <View style={styles.listCard}>
            <Row label={ACC.ACTIONS.EXPORT_DATA} onPress={comingSoon('Data export')} right={<Ionicons name="download-outline" size={20} color={colors.secondaryText} />} />
            <Row divider label="Log out" onPress={handleLogout} right={<Ionicons name="log-out-outline" size={20} color={colors.secondaryText} />} />
            <Row divider label={ACC.ACTIONS.SIGN_OUT_ALL} onPress={handleSignOutAllDevices} right={<Ionicons name="phone-portrait-outline" size={20} color={colors.secondaryText} />} />
          </View>
          <TouchableOpacity style={styles.danger} onPress={() => router.push('/(profile actions)/enterpassword' as any)} accessibilityRole="button">
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Typography variant="body" color={colors.error} style={styles.centerLabel}>{ACC.ACTIONS.DELETE_ACCOUNT}</Typography>
          </TouchableOpacity>
        </View>
      </View>
    </LockSubpage>
  );
};

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 24, paddingBottom: 20 },
  section: { gap: 10 },
  sectionLabel: { fontSize: 11, lineHeight: 16, letterSpacing: 1.1, fontWeight: '600', marginLeft: 4 },
  card: { padding: 18, gap: 16, borderRadius: 22, borderWidth: 1, borderColor: '#E8ECF1', backgroundColor: colors.surface },
  listCard: { paddingHorizontal: 16, borderRadius: 22, borderWidth: 1, borderColor: '#E8ECF1', backgroundColor: colors.surface },
  bold: { fontWeight: '600' },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarButton: { flexShrink: 0 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.base },
  avatarEdit: { position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.base, borderWidth: 2, borderColor: colors.surface },
  profileCopy: { flex: 1, minWidth: 0, gap: 5 },
  profileName: { fontSize: 20, lineHeight: 26 },
  contact: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  contactText: { flex: 1, minWidth: 0, fontSize: 12, lineHeight: 18 },
  editName: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 11, borderRadius: 12, backgroundColor: colors.iconBackground },
  dividerLine: { height: 1, backgroundColor: '#EEF0F3' },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  buttonCell: { flex: 1, minWidth: 112 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 74, paddingVertical: 16 },
  divider: { borderTopWidth: 1, borderTopColor: '#EEF0F3' },
  rowIcon: { width: 38, height: 38, borderRadius: 13, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0, gap: 4 },
  rowLabel: { fontSize: 15, lineHeight: 21, fontWeight: '600' },
  rowSubtitle: { fontSize: 12, lineHeight: 18 },
  rowAccessory: { flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  membershipRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.primary.lightest },
  roleLabel: { fontSize: 11, lineHeight: 16, fontWeight: '600' },
  addTrusted: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D5DBE3' },
  centerLabel: { flexShrink: 1, fontWeight: '600', textAlign: 'center' },
  danger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FECACA', backgroundColor: colors.lightPink },
});

export default AccountSettings;
