import { useToast } from '@/components/Toast';
import { Typography } from '@/design-system';
import { colors } from '@/design-system/colors/colors';
import { HelpSupport, HomeIcon, Invite, PlusIcon, SettingsIcon } from '@/design-system/icons/filled';
import { ProfileConstants as PC } from '@/design-system/Profile actions/Constants';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ProfileSectionProps {
  name?: string | null;
  email: string;
  profilePicture?: string | null;
  homesCount: number;
}

type IconComponent = React.ComponentType<{ width?: number; height?: number; color?: string }>;

function MenuRow({ Icon, label, hint, badge, onPress, divider }: {
  Icon: IconComponent; label: string; hint: string; badge?: number; onPress: () => void; divider?: boolean;
}) {
  return <TouchableOpacity style={[styles.row, divider && styles.divider]} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint}>
    <Icon width={20} height={20} color={colors.text} />
    <Typography variant="body" style={styles.rowLabel}>{label}</Typography>
    {badge !== undefined && <View style={styles.badge}>
      <Typography variant="caption" color={colors.text} style={styles.bold}>{badge}</Typography>
    </View>}
    <Ionicons name="chevron-forward" size={18} color="#9AA4B2" />
  </TouchableOpacity>;
}

/** Profile tab content shown on the home screen. */
export default function ProfileSection({ name, email, profilePicture, homesCount }: ProfileSectionProps) {
  const toast = useToast();
  const displayName = name || email;

  return <View style={styles.section}>
    <View style={[styles.card, styles.user]}>
      {profilePicture
        ? <Image source={{ uri: profilePicture }} style={styles.avatar} />
        : <View style={[styles.avatar, styles.avatarFallback]}>
          <Typography variant="h3" color={colors.text}>{displayName.charAt(0).toUpperCase()}</Typography>
        </View>}
      <View style={styles.userCopy}>
        <Typography variant="h3" numberOfLines={1}>{displayName}</Typography>
        {!!name && <Typography variant="caption" color={colors.secondaryText} numberOfLines={1}>{email}</Typography>}
      </View>
    </View>

    <TouchableOpacity style={styles.addDevice} onPress={() => router.push('/(devices)/AddDevice2')}
      accessibilityRole="button" accessibilityLabel={PC.addDeviceAccessibilityLabel} accessibilityHint={PC.addDeviceAccessibilityHint}>
      <PlusIcon width={16} height={16} color={colors.text} />
      <Typography variant="accent" color={colors.text} style={styles.bold}>{PC.addNewDevice}</Typography>
    </TouchableOpacity>

    <View style={styles.card}>
      <MenuRow Icon={HomeIcon} label={PC.myHomes} hint={PC.myHomesAccessibilityHint} badge={homesCount} onPress={() => router.push('/(profile actions)/myHomes')} />
      <MenuRow Icon={Invite} label={PC.inviteFamilyFriends} hint={PC.inviteAccessibilityHint} divider onPress={() => toast('info', 'Inviting family is coming soon.')} />
    </View>

    <View style={styles.card}>
      <MenuRow Icon={SettingsIcon} label={PC.accountSettings} hint={PC.accountSettingsAccessibilityHint} onPress={() => router.push('/(profile actions)/AccountSettings')} />
      <MenuRow Icon={HelpSupport} label={PC.helpSupport} hint={PC.helpSupportAccessibilityHint} divider onPress={() => router.push('/(profile actions)/Help&support')} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: 16 },
  card: { paddingHorizontal: 18, borderRadius: 20, borderWidth: 1, borderColor: '#E8ECF1', backgroundColor: colors.surface },
  user: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 18 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.base },
  userCopy: { flex: 1, gap: 3 },
  addDevice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, backgroundColor: colors.primary.base },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  divider: { borderTopWidth: 1, borderTopColor: '#E8ECF1' },
  rowLabel: { flex: 1 },
  badge: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.base },
  bold: { fontWeight: '700' },
});
