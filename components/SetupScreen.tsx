import { Typography } from '@/design-system';
import { colors } from '@/design-system/colors/colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, RefreshControlProps, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** The stages of adding a device, shown as the progress bar in the header. */
export const SETUP_STEPS = ['Device', 'Model', 'Pair', 'Details', 'Photo', 'Calibrate'] as const;

interface SetupScreenProps {
  title: string;
  subtitle?: string;
  /** 1-based index into SETUP_STEPS. */
  step: number;
  /** Extra line shown next to the step label, e.g. "3 of 6" for calibration. */
  stepDetail?: string;
  busy?: boolean;
  showBack?: boolean;
  /** Pinned to the bottom of the screen, above the home indicator. */
  footer?: React.ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  children: React.ReactNode;
}

/** Shell for the add-device flow, matching the lock subpages' header. */
export default function SetupScreen({ title, subtitle, step, stepDetail, busy, showBack = true, footer, refreshControl, children }: SetupScreenProps) {
  const label = SETUP_STEPS[step - 1];
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <SafeAreaView edges={['top']} style={styles.header}>
      <View style={styles.topRow}>
        {showBack ? <TouchableOpacity style={[styles.back, busy && styles.backDisabled]} accessibilityRole="button" accessibilityLabel="Back" activeOpacity={0.7} disabled={busy} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={colors.navBarBackground} />
        </TouchableOpacity> : <View style={styles.back} />}
        <Typography variant="caption" color="#CBD5E1">Step {step} of {SETUP_STEPS.length}</Typography>
      </View>
      <View style={styles.copy}>
        <Typography variant="caption" color={colors.primary.base} style={styles.eyebrow}>
          {label}{stepDetail ? ` · ${stepDetail}` : ''}
        </Typography>
        <Typography variant="h1" color={colors.surface}>{title}</Typography>
        {!!subtitle && <Typography variant="caption" color="#CBD5E1">{subtitle}</Typography>}
      </View>
      <View style={styles.progress} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: SETUP_STEPS.length, now: step }}>
        {SETUP_STEPS.map((s, i) => <View key={s} style={[styles.segment, i < step && styles.segmentDone]} />)}
      </View>
    </SafeAreaView>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
      {children}
    </ScrollView>
    {!!footer && <SafeAreaView edges={['bottom']} style={styles.footer}>{footer}</SafeAreaView>}
  </KeyboardAvoidingView>;
}

interface SetupMomentProps {
  title: string;
  subtitle?: string;
  /** Shown above the title; defaults to nothing. */
  art?: React.ReactNode;
  showBack?: boolean;
  busy?: boolean;
  children?: React.ReactNode;
  actions: React.ReactNode;
}

/** Full-screen milestone in the flow (paired, ready to calibrate, done). */
export function SetupMoment({ title, subtitle, art, showBack, busy, children, actions }: SetupMomentProps) {
  return <View style={styles.moment}>
    <SafeAreaView edges={['top']} style={styles.momentTop}>
      {showBack && <TouchableOpacity style={[styles.back, busy && styles.backDisabled]} accessibilityRole="button" accessibilityLabel="Back" activeOpacity={0.7} disabled={busy} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color={colors.navBarBackground} />
      </TouchableOpacity>}
    </SafeAreaView>
    <ScrollView contentContainerStyle={styles.momentBody} showsVerticalScrollIndicator={false}>
      {art}
      <View style={styles.momentCopy}>
        <Typography variant="h1" color={colors.surface} style={styles.center}>{title}</Typography>
        {!!subtitle && <Typography variant="body" color="#CBD5E1" style={styles.center}>{subtitle}</Typography>}
      </View>
      {children}
    </ScrollView>
    <SafeAreaView edges={['bottom']} style={styles.momentActions}>{actions}</SafeAreaView>
  </View>;
}

export const setupStyles = StyleSheet.create({
  card: {
    padding: 20, gap: 12, borderRadius: 24, backgroundColor: colors.surface,
    shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, backgroundColor: colors.surface,
    shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1,
  },
  iconTile: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.iconBackground },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 1.1, fontSize: 12, marginTop: 4 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F5F8' },
  header: { backgroundColor: colors.navBarBackground, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 3, borderBottomColor: colors.primary.base },
  topRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.base },
  backDisabled: { opacity: 0.4 },
  copy: { marginTop: 20, gap: 6 },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 12 },
  progress: { flexDirection: 'row', gap: 6, marginTop: 18 },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)' },
  segmentDone: { backgroundColor: colors.primary.base },
  scroll: { flex: 1 },
  body: { flexGrow: 1, padding: 16, paddingTop: 20, gap: 12 },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  moment: { flex: 1, backgroundColor: colors.navBarBackground },
  momentTop: { paddingHorizontal: 20, paddingTop: 12, minHeight: 52 },
  momentBody: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24, gap: 24 },
  momentCopy: { gap: 8, alignItems: 'center' },
  center: { textAlign: 'center' },
  momentActions: { paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
});
