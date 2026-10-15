import LockSubpage, { subpageStyles } from '@/components/LockSubpage';
import { useToast } from '@/components/Toast';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Clipboard, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { colors } from '../../design-system/colors/colors';
import { SUPPORT_BODY, SUPPORT_EMAIL, SUPPORT_SUBJECT } from '../../design-system/home/Constants';
import { HelpSupportConstants as HSC } from '../../design-system/Profile actions/Constants';
import { Typography } from '../../design-system/typography/typography';

interface Item { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void; danger?: boolean }

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

const HelpSupport = () => {
  const toast = useToast();
  const comingSoon = (feature: string) => () => toast('info', `${feature} is coming soon.`);

  const makeCall = () => {
    const phoneNumber = HSC.EMERGENCY.PHONE_NUMBER;
    Linking.openURL(`tel:${phoneNumber}`).catch(() => Alert.alert('Call Support', `Please call us at: ${phoneNumber}`, [
      { text: 'Copy Number', onPress: () => { Clipboard.setString(phoneNumber); toast('success', 'Phone number copied.'); } },
      { text: 'OK' },
    ]));
  };

  const emailSupport = (priority: 'Normal' | 'Critical') => () => {
    const subject = `${SUPPORT_SUBJECT} (${priority})`;
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(SUPPORT_BODY)}`)
      .catch(() => toast('error', `Unable to open your email app. Write to us at ${SUPPORT_EMAIL}.`));
  };

  const { LOCK_TROUBLESHOOTING, SCENE_AUTOMATION, BILLING } = HSC.QUICK_SOLUTIONS;
  const { SCHEDULE_CALL, COMMUNITY_FORUM } = HSC.CONTACT_SUPPORT;

  return <LockSubpage title={HSC.TITLE} lockName={HSC.SUBTITLE}>
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
  </LockSubpage>;
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
