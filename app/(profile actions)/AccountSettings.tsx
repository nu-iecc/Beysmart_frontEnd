import LockSubpage, { subpageStyles } from '@/components/LockSubpage';
import { useToast } from '@/components/Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BASE_URL } from '../../constants/api';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { colors } from '../../design-system/colors/colors';
import { AlertIcon, ColorPaletteIcon, EditingIcon, GlobalIcon, HomeIcon, KeyIcon, QuestionIcon, ShieldIcon, TrustedPersonIcon } from '../../design-system/icons/filled/';
import { LabeledToggle, TextField } from '../../design-system/inputs';
import { AccountSettingsConstants as ACC } from '../../design-system/Profile actions/Constants';
import { Typography } from '../../design-system/typography/typography';
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

interface Membership { id: number; name: string; photo: string | null; role: 'ADMIN' | 'GUEST' }

type IconComponent = React.ComponentType<{ width?: number; height?: number; color?: string }>;

const STORED_KEYS = ['userData', 'csrftoken', 'twoFactorEnabled', 'pref_theme', 'pref_notifications_all_homes', 'pref_units', 'pref_language'];

const formatRelativeTime = (isoString?: string | null) => {
  if (!isoString) return 'Never changed';
  const updated = new Date(isoString).getTime();
  if (Number.isNaN(updated)) return 'Unknown';
  const minutes = Math.floor((Date.now() - updated) / 60000);
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

const absoluteUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const origin = BASE_URL.replace(/\/$/, '').replace(/\/api$/, '');
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
};

function SectionLabel({ children }: { children: string }) {
  return <Typography variant="caption" color={colors.disabled} style={styles.sectionLabel}>{children.toUpperCase()}</Typography>;
}

function Row({ Icon, iconBg = colors.navBarBackground, iconColor = colors.surface, image, label, subtitle, subtitleColor = colors.secondaryText, onPress, right, divider }: {
  Icon?: IconComponent; iconBg?: string; iconColor?: string; image?: string | null; label: string; subtitle?: string; subtitleColor?: string;
  onPress?: () => void; right?: React.ReactNode; divider?: boolean;
}) {
  return <TouchableOpacity style={[styles.row, divider && styles.divider]} onPress={onPress} disabled={!onPress} activeOpacity={0.7} accessibilityRole={onPress ? 'button' : undefined}>
    {image
      ? <Image source={{ uri: image }} style={styles.rowIcon} />
      : <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>{Icon && <Icon width={18} height={18} color={iconColor} />}</View>}
    <View style={styles.rowCopy}>
      <Typography variant="body" style={styles.bold}>{label}</Typography>
      {!!subtitle && <Typography variant="caption" color={subtitleColor}>{subtitle}</Typography>}
    </View>
    {right ?? (onPress && <Ionicons name="chevron-forward" size={18} color="#9AA4B2" />)}
  </TouchableOpacity>;
}

const AccountSettings = () => {
  const toast = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [prefTheme, setPrefTheme] = useState<'light' | 'dark'>();
  const [prefNotificationsAllHomes, setPrefNotificationsAllHomes] = useState<boolean>();
  const [prefUnits, setPrefUnits] = useState<'C' | 'F'>();
  const [prefLanguage, setPrefLanguage] = useState<string>();

  const applyProfile = (data: UserProfile) => {
    setUser(data);
    setFirstName(data.first_name || '');
    setLastName(data.last_name || '');
  };

  useEffect(() => {
    const load = async () => {
      try {
        const authCheck = await apiClient.get('auth/check-auth/');
        if (!authCheck.data.authenticated) return router.push('/(auth)/loginpage');
        applyProfile((await apiClient.get('auth/profile/')).data);
      } catch (e) {
        console.error('Failed to load profile', e);
        router.push('/(auth)/loginpage');
      }
      try {
        const stored2FA = await AsyncStorage.getItem('twoFactorEnabled');
        if (stored2FA !== null) setTwoFAEnabled(stored2FA === 'true');
      } catch {}
    };
    load();

    apiClient.get('home/homes/').then(({ data }) => {
      // This endpoint returns only homes owned by the current user
      setMemberships((data || []).map((h: any) => ({ id: h.id, name: h.name, photo: absoluteUrl(h.photo), role: 'ADMIN' })));
    }).catch(e => console.error('Failed to load homes', e));
  }, []);

  // Refresh profile and preferences when returning (e.g. from ProfilePhoto)
  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const data: UserProfile = (await apiClient.get('auth/profile/')).data;
        applyProfile(data);
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          Object.assign(userData, { profile_picture: data.profile_picture, first_name: data.first_name, last_name: data.last_name });
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
        }
      } catch (e) {
        console.error('Failed to refresh profile data', e);
      }
      try {
        const [theme, noti, units, lang] = await Promise.all(['pref_theme', 'pref_notifications_all_homes', 'pref_units', 'pref_language'].map(key => AsyncStorage.getItem(key)));
        if (theme === 'light' || theme === 'dark') setPrefTheme(theme);
        if (noti === 'true' || noti === 'false') setPrefNotificationsAllHomes(noti === 'true');
        if (units === 'C' || units === 'F') setPrefUnits(units);
        if (lang) setPrefLanguage(lang);
      } catch (e) {
        console.error('Failed to load preferences', e);
      }
    })();
  }, []));

  const handleNameSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.put('auth/profile/', { first_name: firstName.trim(), last_name: lastName.trim() });
      setUser(prev => ({ ...(prev || {}), first_name: firstName.trim(), last_name: lastName.trim() }));
      setIsEditingName(false);
      toast('success', 'Name updated.');
    } catch (e) {
      console.error('Failed to save profile', e);
      toast('error', 'Unable to save your name. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNameCancel = () => {
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name || '');
    setIsEditingName(false);
  };

  const handleTwoFAToggle = async (val: boolean) => {
    setTwoFAEnabled(val);
    // Persist locally for now; backend endpoint to be added later
    try { await AsyncStorage.setItem('twoFactorEnabled', val ? 'true' : 'false'); } catch {}
  };

  const handleSignOutAllDevices = async () => {
    try {
      await apiClient.post('auth/logout/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    // Clear local data even if the backend logout fails
    try { await AsyncStorage.multiRemove(STORED_KEYS); } catch (e) { console.error('Failed to clear local data:', e); }
    router.replace('/');
  };

  const comingSoon = (feature: string) => () => toast('info', `${feature} is coming soon.`);

  const profileImage = user?.profile_picture ? `${BASE_URL.replace('/api/', '')}${user.profile_picture}` : undefined;
  const displayName = user?.first_name || user?.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Customer';
  const themeSubtitle = prefTheme === 'dark' ? 'Dark Mode' : prefTheme === 'light' ? 'Light Mode' : ACC.PREFERENCES.THEME.SUBTITLE;
  const notificationsSubtitle = prefNotificationsAllHomes === undefined ? ACC.PREFERENCES.NOTIFICATIONS.SUBTITLE : (prefNotificationsAllHomes ? 'All homes enabled' : 'Disabled');
  const unitsLanguageSubtitle = `${prefUnits === 'C' ? '°C' : '°F'}, ${prefLanguage || 'English'}`;

  return <LockSubpage title={ACC.TITLE} lockName={ACC.SUBTITLE} busy={isSaving}>
    {/* Profile */}
    <View style={subpageStyles.card}>
      <View style={styles.profile}>
        <TouchableOpacity onPress={() => router.push({ pathname: '/(auth)/ProfilePhoto', params: { fromAccountSettings: 'true' } })} accessibilityRole="button" accessibilityLabel="Change profile photo">
          {profileImage
            ? <Image source={{ uri: profileImage }} style={styles.avatar} />
            : <View style={[styles.avatar, styles.avatarFallback]}>
              <Typography variant="h2" color={colors.text}>{displayName.charAt(0).toUpperCase()}</Typography>
            </View>}
          <View style={styles.avatarEdit}><EditingIcon width={12} height={12} color={colors.text} /></View>
        </TouchableOpacity>
        <View style={styles.profileCopy}>
          <Typography variant="h2" numberOfLines={1}>{displayName}</Typography>
          {!!user?.email && <View style={styles.contact}>
            <Ionicons name="mail-outline" size={14} color={colors.disabled} />
            <Typography variant="caption" color={colors.secondaryText} numberOfLines={1} style={styles.flex}>{user.email}</Typography>
            {user.email_verified && <Ionicons name="checkmark-circle" size={16} color={colors.success} accessibilityLabel="Verified" />}
          </View>}
          {!!user?.phone_number && <View style={styles.contact}>
            <Ionicons name="call-outline" size={14} color={colors.disabled} />
            <Typography variant="caption" color={colors.secondaryText} numberOfLines={1} style={styles.flex}>{user.phone_number}</Typography>
          </View>}
        </View>
      </View>
      {isEditingName ? <>
        <View style={styles.dividerLine} />
        <TextField label={ACC.FIELDS.FIRST_NAME.LABEL} value={firstName} onChangeText={setFirstName} placeholder={ACC.FIELDS.FIRST_NAME.PLACEHOLDER} />
        <TextField label={ACC.FIELDS.LAST_NAME.LABEL} value={lastName} onChangeText={setLastName} placeholder={ACC.FIELDS.LAST_NAME.PLACEHOLDER} />
        <View style={styles.buttons}>
          <View style={styles.flex}><AppButton variant="secondarySmall" title={ACC.CTA.CANCEL} onPress={handleNameCancel} disabled={isSaving} /></View>
          <View style={styles.flex}><AppButton variant="primarySmall" title={isSaving ? 'Saving…' : ACC.CTA.SAVE} onPress={handleNameSave} disabled={isSaving} /></View>
        </View>
      </> : <TouchableOpacity style={styles.editName} onPress={() => setIsEditingName(true)} accessibilityRole="button">
        <EditingIcon width={14} height={14} color={colors.text} />
        <Typography variant="caption" style={styles.bold}>Edit name</Typography>
      </TouchableOpacity>}
    </View>

    {/* Security */}
    <SectionLabel>{ACC.SECURITY.TITLE}</SectionLabel>
    <View style={[subpageStyles.card, styles.list]}>
      <Row Icon={ShieldIcon} iconBg={colors.primary.base} iconColor={colors.text} label={ACC.SECURITY.TWO_FA.LABEL.replace('\n', ' ')}
        subtitle={twoFAEnabled ? ACC.SECURITY.TWO_FA.ENABLED_DESC : ACC.SECURITY.TWO_FA.DISABLED_DESC} subtitleColor={twoFAEnabled ? colors.success : colors.secondaryText}
        right={<LabeledToggle label="" value={twoFAEnabled} onValueChange={handleTwoFAToggle} variant="success" />} />
      <Row Icon={KeyIcon} divider label={ACC.SECURITY.PASSWORD.LABEL}
        subtitle={`${ACC.SECURITY.PASSWORD.LAST_CHANGED_PREFIX} ${formatRelativeTime(user?.password_changed_at || user?.date_joined)}`}
        onPress={() => router.push({ pathname: '/(auth)/resetpassword', params: { fromAccountSettings: 'true' } } as never)} />
      <Row Icon={QuestionIcon} divider label={ACC.SECURITY.LINKED_DEVICES.LABEL} subtitle={`0 ${ACC.SECURITY.LINKED_DEVICES.ACTIVE_SESSIONS_SUFFIX}`} onPress={comingSoon('Linked devices')} />
    </View>

    {/* Home memberships */}
    {memberships.length > 0 && <>
      <SectionLabel>{ACC.MEMBERSHIPS.TITLE}</SectionLabel>
      <View style={[subpageStyles.card, styles.list]}>
        {memberships.map((home, index) => <Row key={home.id} Icon={HomeIcon} iconBg={colors.primary.base} iconColor={colors.text} image={home.photo} divider={index > 0}
          label={home.name} subtitle={home.role === 'ADMIN' ? ACC.MEMBERSHIPS.ROLE_ADMIN : ACC.MEMBERSHIPS.ROLE_GUEST}
          onPress={() => router.push({ pathname: '/(app)/home', params: { selectedHomeId: String(home.id) } } as any)} />)}
      </View>
    </>}

    {/* Preferences */}
    <SectionLabel>{ACC.PREFERENCES.TITLE}</SectionLabel>
    <View style={[subpageStyles.card, styles.list]}>
      <Row Icon={ColorPaletteIcon} label={ACC.PREFERENCES.THEME.LABEL} subtitle={themeSubtitle} onPress={comingSoon('Theme settings')} />
      <Row Icon={AlertIcon} divider label={ACC.PREFERENCES.NOTIFICATIONS.LABEL} subtitle={notificationsSubtitle} onPress={comingSoon('Notification settings')} />
      <Row Icon={GlobalIcon} divider label={ACC.PREFERENCES.UNITS_LANGUAGE.LABEL} subtitle={unitsLanguageSubtitle} onPress={comingSoon('Units & language settings')} />
    </View>

    {/* Emergency contacts */}
    <SectionLabel>{ACC.EMERGENCY.TITLE}</SectionLabel>
    <View style={subpageStyles.card}>
      <Row Icon={TrustedPersonIcon} iconBg={colors.secondaryText} label={ACC.EMPTY_STATES.EMERGENCY_CONTACTS.TITLE} subtitle={ACC.EMPTY_STATES.EMERGENCY_CONTACTS.SUBTITLE} />
      <TouchableOpacity style={styles.addTrusted} onPress={comingSoon('Emergency contacts')} accessibilityRole="button">
        <Ionicons name="add" size={18} color={colors.text} />
        <Typography variant="body" style={styles.bold}>{ACC.EMERGENCY.ADD_BUTTON}</Typography>
      </TouchableOpacity>
    </View>

    {/* Account actions */}
    <View style={styles.actions}>
      <AppButton variant="primarySmall" title={ACC.ACTIONS.EXPORT_DATA} onPress={comingSoon('Data export')} />
      <TouchableOpacity style={styles.action} onPress={handleSignOutAllDevices} accessibilityRole="button">
        <Ionicons name="log-out-outline" size={18} color={colors.text} />
        <Typography variant="body" style={styles.bold}>{ACC.ACTIONS.SIGN_OUT_ALL}</Typography>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.action, styles.danger]} onPress={() => router.push('/(profile actions)/enterpassword' as any)} accessibilityRole="button">
        <Ionicons name="trash-outline" size={18} color={colors.error} />
        <Typography variant="body" color={colors.error} style={styles.bold}>{ACC.ACTIONS.DELETE_ACCOUNT}</Typography>
      </TouchableOpacity>
    </View>
  </LockSubpage>;
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '600' },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 68, height: 68, borderRadius: 34 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.base },
  avatarEdit: { position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.base, borderWidth: 2, borderColor: colors.surface },
  profileCopy: { flex: 1, gap: 6 },
  contact: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editName: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 14, backgroundColor: colors.iconBackground },
  dividerLine: { height: 1, backgroundColor: '#EEF0F3' },
  buttons: { flexDirection: 'row', gap: 12 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.2, fontWeight: '600', marginLeft: 4, marginBottom: -6 },
  list: { paddingVertical: 2, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  divider: { borderTopWidth: 1, borderTopColor: '#EEF0F3' },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, gap: 2 },
  addTrusted: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D5DBE3' },
  actions: { gap: 10, marginTop: 4, marginBottom: 16 },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E8ECF1', backgroundColor: colors.surface },
  danger: { borderColor: '#FECACA', backgroundColor: colors.lightPink },
});

export default AccountSettings;
