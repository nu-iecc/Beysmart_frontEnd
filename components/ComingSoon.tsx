import { Typography } from '@/design-system';
import { colors } from '@/design-system/colors/colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ComingSoonProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

/** Placeholder for sections that are not available yet. */
export default function ComingSoon({ title, icon = 'time-outline' }: ComingSoonProps) {
  return <View style={styles.card}>
    <View style={styles.icon}>
      <Ionicons name={icon} size={28} color={colors.secondary.base} />
    </View>
    <Typography variant="h2" style={styles.center}>{title}</Typography>
    <Typography variant="body" color={colors.secondaryText} style={styles.center}>Coming soon. We're working on it and it will be here shortly.</Typography>
  </View>;
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: 10, padding: 28, borderRadius: 20, borderWidth: 1, borderColor: '#E8ECF1', backgroundColor: colors.surface },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.secondary.base}1A`, marginBottom: 4 },
  center: { textAlign: 'center' },
});
