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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <BackArrow width={24} height={24} color={colors.surface} />
          </TouchableOpacity>
          <View>
            <Typography variant="h3" color={colors.surface} style={styles.headerTitle}>
              {HSC.TITLE}
            </Typography>
            <Typography variant="caption" color={colors.surface}>
              {HSC.SUBTITLE}
            </Typography>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextField
              value=""
              onChangeText={() => {}}
              placeholder={HSC.SEARCH.PLACEHOLDER}
              rightIcon={
                <SearchIcon width={20} height={20} color={colors.disabled} />
              }
            />
          </View>

          {/* Emergency Lockout Alert */}
          <TouchableOpacity 
            style={styles.emergencyAlert} 
            onPress={makeCall}
            accessibilityLabel={HSC.ACCESSIBILITY.EMERGENCY}
            accessibilityHint={HSC.ACCESSIBILITY.EMERGENCY_HINT}
            activeOpacity={0.8}
          >
            <View style={styles.emergencyLeft}>
              <View style={styles.emergencyIcon}>
                <ExclamationIcon width={20} height={20} color={colors.surface} />
              </View>
              <View style={styles.emergencyText}>
                <Typography variant="body" color={colors.error} style={styles.emergencyTitle}>
                  {HSC.EMERGENCY.TITLE}
                </Typography>
                <Typography variant="caption" color={colors.error}>
                  {HSC.EMERGENCY.SUBTITLE}
                </Typography>
              </View>
            </View>
            <View style={styles.emergencyRight}>
              <PhoneIcon width={20} height={20} color={colors.error} />
            </View>
          </TouchableOpacity>

          {/* Outage Status */}
          <View style={styles.outageStatus}>
            <View style={styles.outageIcon}>
              <Typography variant="caption" color={colors.surface} style={styles.checkmark}>
                ✓
              </Typography>
            </View>
            <Typography variant="body" color={colors.success} style={styles.outageText}>
              {HSC.OUTAGE.NO_OUTAGES}
            </Typography>
          </View>

          {/* Quick Solutions Section */}
          <Typography variant="h2" color={colors.text} style={styles.sectionTitle}>
            {HSC.QUICK_SOLUTIONS.TITLE}
          </Typography>

          {/* Lock Troubleshooting Card */}
          <TouchableOpacity 
            style={styles.quickSolutionCard}
            onPress={() => console.log('Lock Troubleshooting pressed')}
            accessibilityLabel={HSC.ACCESSIBILITY.QUICK_SOLUTION}
            accessibilityHint={HSC.ACCESSIBILITY.QUICK_SOLUTION_HINT}
            activeOpacity={0.8}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.cardIcon, { backgroundColor: colors.secondary.base }]}>
                <Lock width={20} height={20} color={colors.surface} />
              </View>
              <View style={styles.cardText}>
                <Typography variant="body" color={colors.text} style={styles.cardTitle}>
                  {HSC.QUICK_SOLUTIONS.LOCK_TROUBLESHOOTING.TITLE}
                </Typography>
                <Typography variant="caption" color={colors.secondaryText}>
                  {HSC.QUICK_SOLUTIONS.LOCK_TROUBLESHOOTING.SUBTITLE}
                </Typography>
              </View>
            </View>
            <BackArrow width={18} height={18} color={colors.secondaryText} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          {/* Scene Automation Fixes Card */}
          <TouchableOpacity 
            style={styles.quickSolutionCard}
            onPress={() => console.log('Scene Automation Fixes pressed')}
            accessibilityLabel={HSC.ACCESSIBILITY.QUICK_SOLUTION}
            accessibilityHint={HSC.ACCESSIBILITY.QUICK_SOLUTION_HINT}
            activeOpacity={0.8}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.cardIcon, { backgroundColor: colors.tertiary.base }]}>
                <SparkleIcon width={20} height={20} color={colors.surface} />
              </View>
              <View style={styles.cardText}>
                <Typography variant="body" color={colors.text} style={styles.cardTitle}>
                  {HSC.QUICK_SOLUTIONS.SCENE_AUTOMATION.TITLE}
                </Typography>
                <Typography variant="caption" color={colors.secondaryText}>
                  {HSC.QUICK_SOLUTIONS.SCENE_AUTOMATION.SUBTITLE}
                </Typography>
              </View>
            </View>
            <BackArrow width={18} height={18} color={colors.secondaryText} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          {/* Billing & Subscriptions Card */}
          <TouchableOpacity 
            style={styles.quickSolutionCard}
            onPress={() => console.log('Billing & Subscriptions pressed')}
            accessibilityLabel={HSC.ACCESSIBILITY.QUICK_SOLUTION}
            accessibilityHint={HSC.ACCESSIBILITY.QUICK_SOLUTION_HINT}
            activeOpacity={0.8}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.cardIcon, { backgroundColor: colors.primary.base }]}>
                <CardIcon width={20} height={20} color={colors.text} />
              </View>
              <View style={styles.cardText}>
                <Typography variant="body" color={colors.text} style={styles.cardTitle}>
                  {HSC.QUICK_SOLUTIONS.BILLING.TITLE}
                </Typography>
                <Typography variant="caption" color={colors.secondaryText}>
                  {HSC.QUICK_SOLUTIONS.BILLING.SUBTITLE}
                </Typography>
              </View>
            </View>
            <BackArrow width={18} height={18} color={colors.secondaryText} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          {/* Offline Lock Section */}
          <View style={styles.offlineLockContainer}>
            <View style={styles.offlineLockHeader}>
              <View style={styles.offlineLockIcon}>
                <ScrewdriverIcon width={20} height={20} color={colors.surface} />
              </View>
              <View style={styles.offlineLockText}>
                <Typography variant="body" color={colors.text} style={styles.offlineLockTitle}>
                  {HSC.OFFLINE_LOCK.TITLE}
                </Typography>
                <Typography variant="caption" color={colors.orange}>
                  {HSC.OFFLINE_LOCK.SUBTITLE}
                </Typography>
              </View>
            </View>
            
            <View style={styles.troubleshootingSteps}>
              {/* Check Battery Level - Completed */}
              <View style={styles.stepItem}>
                <View style={[styles.stepIcon, { backgroundColor: colors.success }]}>
                  <Typography variant="caption" color={colors.surface} style={styles.checkmark}>
                    ✓
                  </Typography>
                </View>
                <Typography variant="body" color={colors.text} style={styles.stepText}>
                  {HSC.OFFLINE_LOCK.STEPS.CHECK_BATTERY.TEXT}
                </Typography>
              </View>

              {/* Reset Wi-Fi Connection - Pending */}
              <View style={styles.stepItem}>
                <View style={[styles.stepIcon, { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.border }]}>
                </View>
                <Typography variant="body" color={colors.orange} style={styles.stepText}>
                  {HSC.OFFLINE_LOCK.STEPS.RESET_WIFI.TEXT}
                </Typography>
              </View>

              {/* Test Device Response - Pending */}
              <View style={styles.stepItem}>
                <View style={[styles.stepIcon, { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.border }]}>
                </View>
                <Typography variant="body" color={colors.orange} style={styles.stepText}>
                  {HSC.OFFLINE_LOCK.STEPS.TEST_DEVICE.TEXT}
                </Typography>
              </View>
            </View>
          </View>

          {/* Virtual Assistant Section */}
          <View style={styles.virtualAssistantContainer}>
            <View style={styles.virtualAssistantHeader}>
              <View style={[styles.virtualAssistantIcon, { backgroundColor: colors.secondary.base }]}>
                <Robot width={20} height={20} color={colors.surface} />
              </View>
              <View style={styles.virtualAssistantText}>
                <Typography variant="body" color={colors.text} style={styles.virtualAssistantTitle}>
                  {HSC.VIRTUAL_ASSISTANT.TITLE}
                </Typography>
                <Typography variant="caption" color={colors.secondaryText}>
                  {HSC.VIRTUAL_ASSISTANT.SUBTITLE}
                </Typography>
              </View>
            </View>
            
            <View style={styles.queryButtons}>
              <TouchableOpacity style={styles.queryButton}>
                <Typography variant="body" color={colors.text} style={styles.queryButtonText}>
                  {HSC.VIRTUAL_ASSISTANT.QUERIES.DEVICE_CONNECT}
                </Typography>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.queryButton}>
                <Typography variant="body" color={colors.text} style={styles.queryButtonText}>
                  {HSC.VIRTUAL_ASSISTANT.QUERIES.CHANGE_PLAN}
                </Typography>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.queryButton}>
                <Typography variant="body" color={colors.text} style={styles.queryButtonText}>
                  {HSC.VIRTUAL_ASSISTANT.QUERIES.RESET_PASSWORD}
                </Typography>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contact Support Section */}
          <Typography variant="h2" color={colors.text} style={styles.sectionTitle}>
            {HSC.CONTACT_SUPPORT.TITLE}
          </Typography>

          {/* Schedule a Call Card */}
          <View style={styles.contactCard}>
            <View style={styles.contactCardHeader}>
              <View style={[styles.contactIcon, { backgroundColor: colors.info }]}>
                <PhoneIcon width={16} height={16} color={colors.surface} />
              </View>
              <View style={styles.contactText}>
                <Typography variant="body" color={colors.text} style={styles.contactTitle}>
                  {HSC.CONTACT_SUPPORT.SCHEDULE_CALL.TITLE}
                </Typography>
                <Typography variant="caption" color={colors.secondaryText}>
                  {HSC.CONTACT_SUPPORT.SCHEDULE_CALL.SUBTITLE}
                </Typography>
              </View>
            </View>
            <TouchableOpacity style={styles.callbackButton}>
              <Typography variant="body" color={colors.text} style={styles.callbackButtonText}>
                {HSC.CONTACT_SUPPORT.SCHEDULE_CALL.BUTTON}
              </Typography>
            </TouchableOpacity>
          </View>

          {/* Email Support Card */}
          <View style={styles.contactCard}>
            <View style={styles.contactCardHeader}>
              <View style={[styles.contactIcon, { backgroundColor: colors.success }]}>
                <EmailIcon width={16} height={16} color={colors.surface} />
              </View>
              <View style={styles.contactText}>
                <Typography variant="body" color={colors.text} style={styles.contactTitle}>
                  {HSC.CONTACT_SUPPORT.EMAIL_SUPPORT.TITLE}
                </Typography>
                <Typography variant="caption" color={colors.secondaryText}>
                  {HSC.CONTACT_SUPPORT.EMAIL_SUPPORT.SUBTITLE}
                </Typography>
              </View>
            </View>
            <View style={styles.responseTimeButtons}>
              <TouchableOpacity style={styles.normalButton}>
                <Typography variant="body" color={colors.text} style={styles.responseButtonText}>
                  {HSC.CONTACT_SUPPORT.EMAIL_SUPPORT.NORMAL}
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity style={styles.criticalButton}>
                <Typography variant="body" color={colors.error} style={styles.responseButtonText}>
                  ! {HSC.CONTACT_SUPPORT.EMAIL_SUPPORT.CRITICAL}
                </Typography>
              </TouchableOpacity>
            </View>
          </View>

          {/* Community Forum Card */}
          <View style={styles.contactCard}>
            <View style={styles.contactCardHeader}>
              <View style={[styles.contactIcon, { backgroundColor: colors.secondary.base }]}>
                <UsersIcon width={16} height={16} color={colors.surface} />
              </View>
              <View style={styles.contactText}>
                <Typography variant="body" color={colors.text} style={styles.contactTitle}>
                  {HSC.CONTACT_SUPPORT.COMMUNITY_FORUM.TITLE}
                </Typography>
                <Typography variant="caption" color={colors.secondaryText}>
                  {HSC.CONTACT_SUPPORT.COMMUNITY_FORUM.SUBTITLE}
                </Typography>
              </View>
            </View>
            <View style={styles.trendingSection}>
              <Typography variant="body" color={colors.text} style={styles.trendingTitle}>
                {HSC.CONTACT_SUPPORT.COMMUNITY_FORUM.TRENDING_TITLE}
              </Typography>
              <View style={styles.topicTags}>
                <View style={styles.topicTag}>
                  <Typography variant="body" color={colors.text} style={styles.topicTagText}>
                    {HSC.CONTACT_SUPPORT.COMMUNITY_FORUM.TOPICS.BATTERY_TIPS}
                  </Typography>
                </View>
                <View style={styles.topicTag}>
                  <Typography variant="body" color={colors.text} style={styles.topicTagText}>
                    {HSC.CONTACT_SUPPORT.COMMUNITY_FORUM.TOPICS.SCENE_AUTOMATION}
                  </Typography>
                </View>
                <View style={styles.topicTag}>
                  <Typography variant="body" color={colors.text} style={styles.topicTagText}>
                    {HSC.CONTACT_SUPPORT.COMMUNITY_FORUM.TOPICS.WIFI_SETUP}
                  </Typography>
                </View>
              </View>
            </View>
          </View>

          {/* Recent Help Section */}
          <Typography variant="h2" color={colors.text} style={styles.sectionTitle}>
            {HSC.RECENT_HELP.TITLE}
          </Typography>

          <View style={styles.recentHelpCard}>
            <View style={styles.recentHelpHeader}>
              <View style={[styles.recentHelpIcon, { backgroundColor: colors.info }]}>
                <RefreshIcon width={14} height={14} color={colors.surface} />
              </View>
              <View style={styles.recentHelpText}>
                <Typography variant="body" color={colors.text} style={styles.recentHelpTitle}>
                  {HSC.RECENT_HELP.DEVICE_OFFLINE.TITLE}
                </Typography>
                <Typography variant="caption" color={colors.info} style={styles.recentHelpSubtitle}>
                  {HSC.RECENT_HELP.DEVICE_OFFLINE.SUBTITLE}
                </Typography>
              </View>
            </View>
            <TouchableOpacity style={styles.viewSolutionButton}>
              <Typography variant="body" color={colors.surface} style={styles.viewSolutionButtonText}>
                {HSC.RECENT_HELP.DEVICE_OFFLINE.BUTTON}
              </Typography>
            </TouchableOpacity>
          </View>

          {/* Feedback Section */}
          <Typography variant="h2" color={colors.text} style={styles.sectionTitle}>
            {HSC.FEEDBACK.TITLE}
          </Typography>

          <View style={styles.feedbackCard}>
            <View style={styles.feedbackOptions}>
              <TouchableOpacity style={styles.feedbackOption}>
                <Typography variant="h3" style={styles.feedbackEmoji}>👍</Typography>
                <Typography variant="body" color={colors.text} style={styles.feedbackText}>
                  {HSC.FEEDBACK.HELPFUL}
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity style={styles.feedbackOption}>
                <Typography variant="h3" style={styles.feedbackEmoji}>👎</Typography>
                <Typography variant="body" color={colors.text} style={styles.feedbackText}>
                  {HSC.FEEDBACK.NOT_HELPFUL}
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom Navigation */}
      <BottomNavigation
        items={bottomNavItems}
        activeKey={activeTab}
        profile_picture={user?.profile_picture}
        onTabPress={handleTabPress}
      />
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.navBarBackground,
    height: 120,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl,
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  backButton: { 
    padding: Spacing.xs, 
    marginRight: Spacing.xs 
  },
  headerTitle: { 
    textAlign: 'left' as const, 
    fontSize: 18, 
    fontWeight: '600' as const 
  },
  content: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  body: { 
    padding: Spacing.lg, 
    paddingTop: Spacing.md, 
    paddingBottom: Spacing.xxl 
  },
  searchContainer: {
    marginBottom: Spacing.xs - 5,
  },
  searchIcon: {
    width: 20,
    height: 20,
    // Magnifying glass icon styling would go here
  },
  emergencyAlert: {
    backgroundColor: '#FEF2F2', // Light red background
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderWidth: 1,
    borderColor: '#FECACA', // Light red border
    minHeight: 60,
  },
  emergencyLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  emergencyIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: Spacing.sm,
  },
  emergencyText: {
    flex: 1,
  },
  emergencyTitle: {
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  emergencyRight: {
    marginLeft: Spacing.sm,
  },
  outageStatus: {
    backgroundColor: '#D1FAE5', // Light green background
    borderRadius: 8,
    padding: Spacing.sm,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#A7F3D0', // Light green border
  },
  outageIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: Spacing.sm,
  },
  checkmark: {
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  outageText: {
    fontWeight: '500' as const,
  },
  sectionTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  quickSolutionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 60,
  },
  cardLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: Spacing.sm,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  offlineLockContainer: {
    backgroundColor: '#FEF3C7', // Light orange background
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A', // Light orange border
    minHeight: 80,
  },
  offlineLockHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.sm,
  },
  offlineLockIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.orange,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: Spacing.sm,
  },
  offlineLockText: {
    flex: 1,
  },
  offlineLockTitle: {
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  troubleshootingSteps: {
    marginTop: Spacing.xs,
  },
  stepItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.xs,
  },
  stepIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: Spacing.sm,
  },
  stepText: {
    flex: 1,
  },
  virtualAssistantContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs - 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 80,
  },
  virtualAssistantHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.sm,
  },
  virtualAssistantIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: Spacing.sm,
  },
  virtualAssistantText: {
    flex: 1,
  },
  virtualAssistantTitle: {
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  queryButtons: {
    marginTop: Spacing.xs,
  },
  queryButton: {
    backgroundColor: '#F3F4F6', // Much lighter gray background
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  queryButtonText: {
    textAlign: 'center' as const,
    fontWeight: '500' as const,
  },
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.xs - 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.xs,
  },
  contactIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: Spacing.xs,
  },
  contactText: {
    flex: 1,
  },
  contactTitle: {
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  callbackButton: {
    backgroundColor: colors.primary.base,
    borderRadius: 6,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center' as const,
  },
  callbackButtonText: {
    fontWeight: '600' as const,
  },
  responseTimeButtons: {
    flexDirection: 'row' as const,
    gap: Spacing.xs,
  },
  normalButton: {
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: 6,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center' as const,
  },
  criticalButton: {
    flex: 1,
    backgroundColor: colors.lightPink,
    borderRadius: 6,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center' as const,
  },
  responseButtonText: {
    fontWeight: '500' as const,
  },
  trendingSection: {
    marginTop: Spacing.xs,
  },
  trendingTitle: {
    fontWeight: '600' as const,
    marginBottom: Spacing.xs,
  },
  topicTags: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.xs,
  },
  topicTag: {
    backgroundColor: colors.border,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: Spacing.xs,
  },
  topicTagText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  recentHelpCard: {
    backgroundColor: colors.info,
    borderRadius: 12,
    padding: Spacing.xs,
    marginBottom: Spacing.xs -10,
    borderWidth: 1,
    borderColor: colors.info,
  },
  recentHelpHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.xs,
  },
  recentHelpIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: Spacing.xs,
  },
  recentHelpText: {
    flex: 1,
  },
  recentHelpTitle: {
    fontWeight: '600' as const,
    marginBottom: 2,
    color: colors.surface,
  },
  recentHelpSubtitle: {
    color: colors.surface,
  },
  viewSolutionButton: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center' as const,
  },
  viewSolutionButtonText: {
    fontWeight: '600' as const,
    color: colors.info,
  },
  feedbackCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: Spacing.xs,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  feedbackOptions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
  },
  feedbackOption: {
    alignItems: 'center' as const,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  feedbackEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  feedbackText: {
    fontWeight: '500' as const,
  },
};

export default HelpSupport;
