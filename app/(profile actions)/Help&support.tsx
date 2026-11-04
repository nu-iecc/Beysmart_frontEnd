interface Item { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void; danger?: boolean }
import { subpageStyles } from '@/components/LockSubpage';
function Section({ title, items }: { title: string; items: Item[] }) {
  return <>
    <Typography variant="caption" color={colors.disabled} style={styles.sectionLabel}>{title.toUpperCase()}</Typography>
    <View style={[subpageStyles.card, styles.list]}>
      {items.map((item, index) => <TouchableOpacity key={item.title} style={[styles.row, index > 0 && styles.divider]} onPress={item.onPress} activeOpacity={0.7} accessibilityRole="button">
        <View style={[styles.icon, item.danger && styles.iconDanger]}>
          <Ionicons name={item.icon} size={18} color={item.danger ? colors.error : colors.text} />
        </View>
        <View style={styles.flex}>
          <Typography variant="body" style={styles.bold}>{item.title}</Typography>
          <Typography variant="caption" color={colors.secondaryText}>{item.subtitle}</Typography>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9AA4B2" />
      </TouchableOpacity>)}
    </View>
  </>;
}
import LockSubpage from '@/components/LockSubpage';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import { SUPPORT_BODY } from '../../design-system/home/Constants';
import { SUPPORT_EMAIL } from '../../design-system/home/Constants';
import { SUPPORT_SUBJECT } from '../../design-system/home/Constants';
import PageHeader from '@/components/PageHeader';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Clipboard, Linking, ScrollView, TouchableOpacity, View } from 'react-native';
import { getMediaUrl } from '../../constants/api';
import { colors } from '../../design-system/colors/colors';
import { BackArrow } from '../../design-system/icons';
import { CardIcon, ExclamationIcon, PhoneIcon, Robot, SearchIcon, SparkleIcon, UsersIcon } from '../../design-system/icons/filled';
import { EmailIcon, Lock, arrow as RefreshIcon, screwdriver as ScrewdriverIcon } from '../../design-system/icons/outlined';
import { TextField } from '../../design-system/inputs';
import { Spacing } from '../../design-system/Layout/spacing';
import { BottomNavigation } from '../../design-system/Navigation';
import type { BottomNavigationItem, User as DSUser } from '../../design-system/Navigation/Types';
import { HelpSupportConstants as HSC } from '../../design-system/Profile actions/Constants';
import { Typography } from '../../design-system/typography/typography';

const HelpSupport = () => {
const comingSoon = (feature: string) => () => toast.info(`${feature} is coming soon.`);
const emailSupport = (priority: 'Normal' | 'Critical') => () => {
    const subject = `${SUPPORT_SUBJECT} (${priority})`;
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(SUPPORT_BODY)}`)
      .catch(() => toast.error(`Unable to open your email app. Write to us at ${SUPPORT_EMAIL}.`));
  };
const { LOCK_TROUBLESHOOTING, SCENE_AUTOMATION, BILLING } = HSC.QUICK_SOLUTIONS;
const { SCHEDULE_CALL, COMMUNITY_FORUM } = HSC.CONTACT_SUPPORT;
  const [user, setUser] = useState<DSUser | null>(null);
  const [activeTab, setActiveTab] = useState<string>('profile');

  const handleBack = () => {
    router.back();
  };

  const makeCall = async () => {
    const phoneNumber = HSC.EMERGENCY.PHONE_NUMBER;
    const url = `tel:${phoneNumber}`;

    try {
      // First try to check if the URL can be opened
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // If canOpenURL fails, try opening directly anyway
        // This handles cases where canOpenURL returns false but the URL still works
        try {
          await Linking.openURL(url);
        } catch (directOpenError) {
          console.error("Direct open failed:", directOpenError);

          // Show a more helpful error message with the phone number
          Alert.alert(
            "Cannot Make Call",
            `This device cannot make phone calls directly. Please call us at: ${phoneNumber}`,
            [
              {
                text: "Copy Number",
                onPress: () => {
                  Clipboard.setString(phoneNumber);
                  Alert.alert("Copied", "Phone number copied to clipboard");
                }
              },
              { text: "OK" }
            ]
          );
        }
      }
    } catch (err) {
      console.error("Error opening dialer:", err);

      // Fallback: Show the phone number to the user
      Alert.alert(
        "Call Support",
        `Please call us at: ${phoneNumber}`,
        [
          {
            text: "Copy Number",
            onPress: () => {
              Clipboard.setString(phoneNumber);
              Alert.alert("Copied", "Phone number copied to clipboard");
            }
          },
          { text: "OK" }
        ]
      );
    }
  };

  const loadUserData = useCallback(async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');

      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setUser({
          first_name: userData.first_name || undefined,
          profile_picture: getMediaUrl(userData.profile_picture)
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const bottomNavItems: BottomNavigationItem[] = [
    { key: 'home', label: 'Home', icon: null },
    { key: 'devices', label: 'Devices', icon: null },
    { key: 'energy', label: 'Energy', icon: null },
    { key: 'profile', label: 'Profile', icon: null },
  ];

  const handleTabPress = (key: string) => {
    setActiveTab(key);
    if (key === 'home') {
      router.push('/(app)/home');
    } else if (key === 'devices') {
      router.push('/(HomePage_actions)/MyDevices' as any);
    } else if (key === 'energy') {
      // Navigate to energy page when implemented
      console.log('Navigate to energy');
    } else if (key === 'profile') {
      router.push('/(profile actions)/Profile');
    }
  };

  return (<LockSubpage title={HSC.TITLE} lockName={HSC.SUBTITLE}>
    <TouchableOpacity style={styles.emergency} onPress={makeCall} activeOpacity={0.8}
      accessibilityRole="button" accessibilityLabel={HSC.ACCESSIBILITY.EMERGENCY} accessibilityHint={HSC.ACCESSIBILITY.EMERGENCY_HINT}>
      <View style={styles.flex}>
        <Typography variant="body" color={colors.error} style={styles.bold}>{HSC.EMERGENCY.TITLE}</Typography>
        <Typography variant="caption" color={colors.secondaryText}>{HSC.EMERGENCY.SUBTITLE} · {HSC.EMERGENCY.PHONE_NUMBER}</Typography>
      </View>
      <View style={styles.callButton}><Ionicons name="call" size={18} color={colors.surface} /></View>
    </TouchableOpacity>

    <Section title="Get help" items={[
      { icon: 'lock-closed-outline', title: LOCK_TROUBLESHOOTING.TITLE, subtitle: LOCK_TROUBLESHOOTING.SUBTITLE, onPress: comingSoon('Lock troubleshooting') },
      { icon: 'sparkles-outline', title: SCENE_AUTOMATION.TITLE, subtitle: SCENE_AUTOMATION.SUBTITLE, onPress: comingSoon('Scene automation help') },
      { icon: 'card-outline', title: BILLING.TITLE, subtitle: BILLING.SUBTITLE, onPress: comingSoon('Billing & subscriptions') },
      { icon: 'key-outline', title: HSC.VIRTUAL_ASSISTANT.QUERIES.RESET_PASSWORD, subtitle: 'Get a code to set a new password',
        onPress: () => router.push({ pathname: '/(auth)/resetpassword', params: { fromAccountSettings: 'true' } } as never) },
    ]} />

    <Section title="Contact us" items={[
      { icon: 'mail-outline', title: 'Email support', subtitle: `Reply within 24 hours · ${SUPPORT_EMAIL}`, onPress: emailSupport('Normal') },
      { icon: 'alert-circle-outline', title: 'Critical issue', subtitle: 'Reply within 2 hours', onPress: emailSupport('Critical'), danger: true },
      { icon: 'call-outline', title: SCHEDULE_CALL.BUTTON, subtitle: SCHEDULE_CALL.SUBTITLE, onPress: comingSoon('Callback requests') },
      { icon: 'people-outline', title: COMMUNITY_FORUM.TITLE, subtitle: COMMUNITY_FORUM.SUBTITLE, onPress: comingSoon('The community forum') },
    ]} />
  </LockSubpage>);
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '600' },
  sectionLabel: { fontSize: 11, letterSpacing: 1.2, fontWeight: '600', marginLeft: 4, marginBottom: -6 },
  emergency: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  callButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.error },
  list: { paddingVertical: 2, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: '#EEF0F3' },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.iconBackground },
  iconDanger: { backgroundColor: '#FEF2F2' },
});

export default HelpSupport;
