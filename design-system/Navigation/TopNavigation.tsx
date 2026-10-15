import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../colors/colors';
import { Typography } from '../typography/typography';
import { TopNavigationProps } from './Types';

export const TopNavigation: React.FC<TopNavigationProps> = ({ user, onNotificationPress }) => {
  return <SafeAreaView edges={['top']} style={styles.header}>
    <View style={styles.row}>
      <View style={{ flex: 1, gap: 4 }}>
        <Typography variant="caption" color="#CBD5E1">Welcome back</Typography>
        <Typography variant="h2" color={colors.surface} numberOfLines={1}>{user.first_name || 'Welcome'}</Typography>
      </View>
      <TouchableOpacity style={styles.bell} accessibilityRole="button" accessibilityLabel="Notifications" activeOpacity={0.75} onPress={onNotificationPress}>
        <Ionicons name="notifications-outline" size={22} color={colors.navBarBackground} />
      </TouchableOpacity>
    </View>
  </SafeAreaView>;
};

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navBarBackground, borderBottomWidth: 3, borderBottomColor: colors.primary.base },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingVertical: 22 },
  bell: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.base },
});
