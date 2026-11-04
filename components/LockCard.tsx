import { Typography } from '@/design-system';
import { colors } from '@/design-system/colors/colors';
import Beylock from '@/design-system/icons/filled/Beylock';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface LockCardProps {
  name: string;
  location: string;
  role?: 'owner' | 'guest';
  connectionLabel?: string;
  stateLabel?: string;
  onPress: () => void;
}

/** A lock in the user's list, with an Owner or Guest badge when the role is known. */
export default function LockCard({ name, location, role, connectionLabel = 'Not connected', stateLabel, onPress }: LockCardProps) {
  return <TouchableOpacity style={styles.lockCard} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={`${name}, ${connectionLabel}`} onPress={onPress}>
    <View style={styles.cardTop}>
      <View style={styles.icon}><Beylock width={22} height={38} color={colors.surface} /></View>
      {!!role && <View style={[styles.roleBadge, role === 'guest' && styles.roleBadgeGuest]}>
        <Typography variant="caption" color={colors.text} style={styles.roleLabel}>{role === 'owner' ? 'Owner' : 'Guest'}</Typography>
      </View>}
    </View>
    <View style={styles.cardBottom}>
      <View style={styles.lockInfo}>
        <Typography variant="h2" color={colors.surface} numberOfLines={1}>{name}</Typography>
        <View style={styles.metaRow}>
          <Typography variant="caption" color="#C7D0DD">{location}</Typography>
          <View style={styles.statusDot} />
          <Typography variant="caption" color="#C7D0DD">{connectionLabel}</Typography>
        </View>
        {!!stateLabel && <Typography variant="caption" color="#C7D0DD">{stateLabel}</Typography>}
      </View>
      <View style={styles.open}><Ionicons name="arrow-forward" size={20} color={colors.text} /></View>
    </View>
  </TouchableOpacity>;
}

export function AddLockCard({ onPress }: { onPress: () => void }) {
  return <TouchableOpacity style={styles.addLock} accessibilityRole="button" activeOpacity={0.7} onPress={onPress}>
    <View style={styles.addIcon}><Ionicons name="add" size={24} color={colors.text} /></View>
    <Typography variant="body" style={styles.addLabel}>Add another lock</Typography>
    <Ionicons name="chevron-forward" size={18} color="#9AA4B2" />
  </TouchableOpacity>;
}

export const lockRole = (device: { role?: string; access_role?: string; is_owner?: boolean }): 'owner' | 'guest' | undefined => {
  const role = device.role || device.access_role;
  return role === 'owner' || role === 'guest' ? role : device.is_owner === true ? 'owner' : undefined;
};

const styles = StyleSheet.create({
  lockCard: { padding: 18, gap: 22, borderRadius: 24, backgroundColor: colors.navBarBackground },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  icon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: colors.primary.base },
  roleBadgeGuest: { backgroundColor: colors.tertiary.lightest },
  roleLabel: { fontWeight: '600' },
  cardBottom: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  lockInfo: { flex: 1, gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  statusDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#A2AAB5' },
  open: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.base },
  addLock: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D5DBE3', backgroundColor: colors.surface },
  addIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.lightest },
  addLabel: { flex: 1, fontWeight: '600' },
});
