import SetupScreen from '@/components/SetupScreen';
import { setupStyles } from '@/components/SetupScreen';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import ProfilePage from '../(profile actions)/Profile';
import { getMediaUrl } from '../../constants/api';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { colors } from '../../design-system/colors/colors';
import { WIFI_DETAILS } from '../../design-system/home/Constants';
import { BackArrow } from '../../design-system/icons';
import TextField from '../../design-system/inputs/TextField';
import { Spacing } from '../../design-system/Layout/spacing';
import { BottomNavigation } from '../../design-system/Navigation/BottomNavigation';
import { Typography } from '../../design-system/typography/typography';
// Use the smart lock service for WiFi configuration
import { smartLockService, WifiConnectionState } from '../../src/ble';

const AddDevice6 = () => {
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [wifiName, setWifiName] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [errors, setErrors] = useState<{ wifiName?: string; wifiPassword?: string }>({});
  const [isSendingWiFi, setIsSendingWiFi] = useState(false);

  // Load user data for profile
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUser({
            first_name: userData.first_name || undefined,
            profile_picture: getMediaUrl(userData.profile_picture)
          });
          setUserEmail(userData.email || '');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  const handleBack = () => router.back();

  const validateForm = () => {
    const newErrors: { wifiName?: string; wifiPassword?: string } = {};

    if (!wifiName.trim()) {
      newErrors.wifiName = WIFI_DETAILS.VALIDATION.WIFI_NAME_REQUIRED;
    } else if (wifiName.trim().length < 2) {
      newErrors.wifiName = WIFI_DETAILS.VALIDATION.WIFI_NAME_MIN_LENGTH;
    }

    if (!wifiPassword.trim()) {
      newErrors.wifiPassword = WIFI_DETAILS.VALIDATION.WIFI_PASSWORD_REQUIRED;
    } else if (wifiPassword.trim().length < 8) {
      newErrors.wifiPassword = WIFI_DETAILS.VALIDATION.WIFI_PASSWORD_MIN_LENGTH;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;

    setIsSendingWiFi(true);

    try {
      // Check if device is connected
      if (!smartLockService.isConnected()) {
        Alert.alert(
          'Not Connected',
          'No device is connected. Please go back and connect to your device first.',
          [{ text: 'OK' }]
        );
        setIsSendingWiFi(false);
        return;
      }

      console.log('📡 Sending WiFi credentials and waiting for connection result...');

      // Send WiFi credentials and wait for notification result
      // This subscribes to WIFI_CONNECTION_STATE (0xBB07) and waits for SUCCESS or FAILED
      const wifiState = await smartLockService.sendWifiCredentials(
        wifiName,
        wifiPassword,
        30000 // 30 second timeout
      );

      console.log('📡 WiFi connection result:', wifiState);

      // Handle the actual result from the device notification
      if (wifiState === WifiConnectionState.SUCCESS) {
        // WiFi connected successfully!
        await AsyncStorage.setItem('lastWifiSSID', wifiName);
        console.log('✅ Device confirmed WiFi connection!');

        Alert.alert(
          'WiFi Connected!',
          'Your device has successfully connected to the WiFi network. Proceeding to next step.',
          [{
            text: 'Continue',
            onPress: () => {
              setIsSendingWiFi(false);
              router.push('/(devices)/AddDevice7');
            }
          }]
        );
      } else if (wifiState === WifiConnectionState.FAILED) {
        // Device reported WiFi connection failed
        setIsSendingWiFi(false);
        Alert.alert(
          'WiFi Connection Failed',
          'The device could not connect to the WiFi network. Please check:\n\n• WiFi name (SSID) is correct\n• Password is correct\n• WiFi network is available and in range',
          [
            { text: 'Try Again', onPress: () => {} },
            { text: 'Skip for Now', onPress: () => router.push('/(devices)/AddDevice7') }
          ]
        );
      } else {
        // Timeout or unexpected state
        setIsSendingWiFi(false);
        Alert.alert(
          'Connection Timeout',
          'Did not receive a response from the device. The WiFi credentials may have been sent.\n\nWould you like to continue?',
          [
            { text: 'Try Again', onPress: () => handleContinue() },
            { text: 'Continue Anyway', onPress: () => router.push('/(devices)/AddDevice7') }
          ]
        );
      }

    } catch (error: any) {
      console.error('❌ Error sending WiFi credentials:', error);
      setIsSendingWiFi(false);

      Alert.alert(
        'Connection Error',
        `Failed to send WiFi credentials to the device.\n\nError: ${error.message || 'Unknown error'}`,
        [
          { text: 'Try Again', onPress: () => handleContinue() },
          { text: 'Skip for Now', onPress: () => router.push('/(devices)/AddDevice7') }
        ]
      );
    }
  };

  const handleTabPress = (key: string) => {
    switch (key) {
      case 'home':
        router.push('/(app)/home');
        break;
      case 'devices':
        router.push('/(HomePage_actions)/MyDevices' as any);
        break;
      case 'energy':
        router.push('/(app)/home');
        break;
      case 'profile':
        setShowProfile(true);
        break;
    }
  };

  const bottomNavItems = [
    { key: 'home', label: 'Home', icon: null },
    { key: 'devices', label: 'Devices', icon: null },
    { key: 'energy', label: 'Energy', icon: null },
    { key: 'profile', label: 'Profile', icon: null },
  ];

  return (
    <SetupScreen
      step={4}
      title="Connect to Wi-Fi"
      subtitle="Your lock uses Wi-Fi so you can open it from anywhere."
      busy={isSendingWiFi}
      footer={
        <AppButton
          variant="primaryLarge"
          title={isSendingWiFi ? 'Connecting the lock…' : WIFI_DETAILS.NAVIGATION.CONTINUE_BUTTON}
          onPress={handleContinue}
          disabled={isSendingWiFi}
          accessibilityLabel={WIFI_DETAILS.NAVIGATION.CONTINUE_BUTTON}
          accessibilityHint="Tap to continue with WiFi setup"
        />
      }
    >
      <View style={setupStyles.card}>
        <TextField
          label="Network name"
          value={wifiName}
          onChangeText={setWifiName}
          placeholder={WIFI_DETAILS.FIELDS.WIFI_NAME.PLACEHOLDER}
          error={errors.wifiName}
          leftIcon={<Ionicons name="wifi" size={18} color={colors.disabled} />}
          disabled={isSendingWiFi}
          accessibilityLabel="Wi-Fi network name"
          accessibilityHint="Enter your Wi-Fi network name"
        />
        <TextField
          label={WIFI_DETAILS.FIELDS.WIFI_PASSWORD.LABEL}
          value={wifiPassword}
          onChangeText={setWifiPassword}
          placeholder={WIFI_DETAILS.FIELDS.WIFI_PASSWORD.PLACEHOLDER}
          secureTextEntry
          showEyeIcon
          error={errors.wifiPassword}
          leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.disabled} />}
          disabled={isSendingWiFi}
          accessibilityLabel="Wi-Fi password"
          accessibilityHint="Enter your Wi-Fi password"
        />
      </View>

      <View style={styles.tip}>
        <Ionicons name="information-circle-outline" size={18} color={colors.disabled} />
        <Typography variant="caption" color={colors.disabled} style={styles.tipText}>
          Make sure the lock is in range of your router. It can take up to 30 seconds for the lock to confirm it’s connected.
        </Typography>
      </View>
    </SetupScreen>
  );
};

const styles = StyleSheet.create({
container: {
    flex: 1,
    backgroundColor: colors.navBarBackground,
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
    marginRight: Spacing.sm,
  },
headerTitle: {
    textAlign: 'left' as const,
    fontSize: 16,
    fontWeight: '600' as const,
  },
stepIndicator: {
    fontSize: 14,
  },
content: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: Spacing.sm - 2,
  },
buttonContainer: {
    marginTop: Spacing.xl,
    alignItems: 'center' as const,
  },
tip: { flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
tipText: { flex: 1 }
});

export default AddDevice6;
