import { colors, Typography } from '@/design-system';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, onBack = () => router.back(), action }: PageHeaderProps) {
  return <SafeAreaView edges={['top']} style={styles.header}>
    <View style={styles.topRow}>
      <TouchableOpacity onPress={onBack} style={styles.back} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color={colors.navBarBackground} />
      </TouchableOpacity>
      {action}
    </View>
    <View style={styles.copy}>
      {!!subtitle && <Typography variant="caption" color={colors.primary.base} numberOfLines={1} style={styles.eyebrow}>{subtitle}</Typography>}
      <Typography variant="h1" color={colors.surface}>{title}</Typography>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navBarBackground, paddingHorizontal: 20, paddingBottom: 24, borderBottomWidth: 3, borderBottomColor: colors.primary.base },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  back: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.primary.base, alignItems: 'center', justifyContent: 'center' },
  copy: { marginTop: 22, gap: 6 },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 12 },
});
