import LockLoader from '@/components/LockLoader';
import LockSubpage, { subpageStyles } from '@/components/LockSubpage';
import { useToast } from '@/components/Toast';
import { Typography } from '@/design-system';
import { colors } from '@/design-system/colors/colors';
import apiClient from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

interface Activity { id: string; activity_type?: string; activity_type_display?: string; description: string; timestamp: string }

function activityIcon(type = ''): { name: keyof typeof Ionicons.glyphMap; color: string } {
  if (type === 'guest_invite_revoked' || type === 'user_removed') return { name: 'close', color: colors.error };
  if (type === 'guest_invite_accepted' || type === 'user_added') return { name: 'checkmark', color: colors.success };
  if (type === 'guest_invited') return { name: 'mail', color: colors.info };
  if (type === 'guest_invite_expired') return { name: 'hourglass', color: colors.warning };
  if (type.startsWith('unlock')) return { name: 'lock-open', color: colors.secondary.base };
  if (type.endsWith('lock')) return { name: 'lock-closed', color: colors.navBarBackground };
  return { name: 'time', color: colors.notactiveicon };
}

function dayLabel(date: Date) {
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function groupByDay(activities: Activity[]) {
  const groups: { label: string; items: Activity[] }[] = [];
  for (const activity of activities) {
    const label = dayLabel(new Date(activity.timestamp));
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(activity);
    else groups.push({ label, items: [activity] });
  }
  return groups;
}

export default function LockActivityScreen() {
  const { id, lockName } = useLocalSearchParams<{ id: string; lockName?: string }>();
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const toast = useToast();

  useEffect(() => {
    let active = true;
    apiClient.get('home/activity-logs/', { params: { device_id: id } }).then(({ data }) => {
      if (active) setActivities(Array.isArray(data) ? data : data.results || []);
    }).catch((err: any) => {
      if (!active) return;
      setActivities([]);
      toast('error', err.response?.status === 403 ? 'Activity logs are restricted by the server for this lock.' : 'Unable to load activity logs.');
    });
    return () => { active = false; };
  }, [id, toast]);

  return <LockSubpage title="Activity Log" lockName={lockName}>
    {!activities ? <LockLoader style={{ marginTop: 24 }} label="Loading activity…" /> : activities.length === 0
      ? <View style={[subpageStyles.card, styles.empty]}>
        <Ionicons name="time-outline" size={28} color={colors.notactiveicon} />
        <Typography variant="body" color={colors.secondaryText}>No activity yet.</Typography>
      </View>
      : groupByDay(activities).map(group => <View key={group.label} style={styles.group}>
        <Typography variant="caption" color={colors.disabled} style={styles.sectionLabel}>{group.label.toUpperCase()}</Typography>
        <View style={[subpageStyles.card, styles.list]}>
          {group.items.map((activity, index) => {
            const icon = activityIcon(activity.activity_type);
            return <View key={activity.id} style={[styles.row, index > 0 && styles.divider]}>
              <View style={[styles.icon, { backgroundColor: `${icon.color}1A` }]}>
                <Ionicons name={icon.name} size={16} color={icon.color} />
              </View>
              <View style={styles.copy}>
                <View style={styles.titleRow}>
                  <Typography variant="body" style={styles.title} numberOfLines={1}>{activity.activity_type_display || 'Activity'}</Typography>
                  <Typography variant="caption" color={colors.notactiveicon}>
                    {new Date(activity.timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </Typography>
                </View>
                <Typography variant="caption" color={colors.secondaryText}>{activity.description}</Typography>
              </View>
            </View>;
          })}
        </View>
      </View>)}
  </LockSubpage>;
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  group: { gap: 10 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.2, fontWeight: '600', marginLeft: 4 },
  list: { paddingVertical: 2, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: '#EEF0F3' },
  icon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontWeight: '600' },
});
