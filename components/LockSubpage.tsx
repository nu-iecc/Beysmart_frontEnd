import { Typography } from '@/design-system';
import { colors } from '@/design-system/colors/colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LockSubpageProps {
  title: string;
  lockName?: string;
  busy?: boolean;
  children: React.ReactNode;
}

/** Shell for the pages opened from a lock, matching the app's top navigation. */
export default function LockSubpage({ title, lockName, busy, children }: LockSubpageProps) {
  return <View style={styles.screen}>
    <SafeAreaView edges={['top']} style={styles.header}>
      <TouchableOpacity style={[styles.back, busy && styles.backDisabled]} accessibilityRole="button" accessibilityLabel="Back" activeOpacity={0.7} disabled={busy} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color={colors.navBarBackground} />
      </TouchableOpacity>
      <View style={styles.copy}>
        {!!lockName && <Typography variant="caption" color={colors.primary.base} numberOfLines={1} style={styles.eyebrow}>{lockName}</Typography>}
        <Typography variant="h1" color={colors.surface} numberOfLines={1}>{title}</Typography>
      </View>
    </SafeAreaView>
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">{children}</ScrollView>
  </View>;
}

export const subpageStyles = StyleSheet.create({
  card: {
    padding: 20, gap: 12, borderRadius: 24, backgroundColor: colors.surface,
    shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F5F8' },
  header: { backgroundColor: colors.navBarBackground, paddingHorizontal: 20, paddingBottom: 24, borderBottomWidth: 3, borderBottomColor: colors.primary.base },
  back: {
    marginTop: 12, width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary.base,
  },
  backDisabled: { opacity: 0.4 },
  copy: { marginTop: 22, gap: 6 },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 12 },
  body: { flexGrow: 1, padding: 16, paddingTop: 20, gap: 16 },
});
