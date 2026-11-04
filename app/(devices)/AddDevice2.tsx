import SetupScreen from '@/components/SetupScreen';
import { setupStyles } from '@/components/SetupScreen';
import * as FilledIcons from '@/design-system/icons/filled';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { colors } from '@/design-system/colors/colors';
import { ADD_DEVICE, AVAILABLE_DEVICES } from '@/design-system/home/Constants';
import { BackArrow } from '@/design-system/icons';
import { Spacing } from '@/design-system/Layout/spacing';
import { BottomNavigation } from '@/design-system/Navigation/BottomNavigation';
import { Typography } from '@/design-system/typography/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import ProfilePage from '../(profile actions)/Profile';
import { getMediaUrl } from '../../constants/api';
import apiClient from '../../utils/api';

interface FormData {
  deviceName: string;
  addedTo: string;
  deviceType: string;
}

interface FormErrors {
  deviceName?: string;
  addedTo?: string;
  deviceType?: string;
}

const AddDevice2: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    deviceName: '',
    addedTo: '',
    deviceType: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.deviceName.trim()) newErrors.deviceName = ADD_DEVICE.VALIDATION.DEVICE_NAME_REQUIRED;
    if (!formData.addedTo) newErrors.addedTo = ADD_DEVICE.VALIDATION.ADDED_TO_REQUIRED;
    if (!formData.deviceType) newErrors.deviceType = ADD_DEVICE.VALIDATION.DEVICE_TYPE_REQUIRED;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const response = await apiClient.post(ADD_DEVICE.API.CREATE_DEVICE, {
        name: formData.deviceName.trim(),
        room: formData.addedTo,
        type: formData.deviceType,
      });
      if (response.status >= 200 && response.status < 300) {
        router.push('/(room)/AddRoomDone' as any);
      }
    } catch (e) {
      console.error('Error creating device:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (device: (typeof AVAILABLE_DEVICES)[number]) => {
    try { await AsyncStorage.setItem('selectedDeviceType', device.id); }
    catch (error) { console.error('Error storing device type:', error); }
    if (device.id === 'beylock') router.push('/(devices)/AddDevice3');
    else handleFieldChange('deviceType', device.id);
  };
  return (
    <SetupScreen step={1} title="Add a device" subtitle="Choose what you're setting up.">
      {AVAILABLE_DEVICES.map((d) => {
        const Icon = (FilledIcons as any)[d.iconName];
        const available = d.id === 'beylock';
        return (
          <TouchableOpacity
            key={d.id}
            style={[setupStyles.row, !available && styles.unavailable]}
            activeOpacity={0.75}
            onPress={() => handleSelect(d)}
            accessibilityRole="button"
            accessibilityLabel={`Add ${d.title}`}
          >
            <View style={[setupStyles.iconTile, { backgroundColor: d.iconBackgroundColor }]}>
              {Icon && <Icon width={24} height={24} color={d.iconColor} />}
            </View>
            <View style={styles.copy}>
              <Typography variant="h3" color={colors.text}>{d.title}</Typography>
              <Typography variant="caption" color={colors.disabled}>{d.subtitle}</Typography>
            </View>
            {available
              ? <Ionicons name="chevron-forward" size={20} color={colors.disabled} />
              : <View style={styles.soon}><Typography variant="caption" color={colors.disabled} style={styles.soonText}>Soon</Typography></View>}
          </TouchableOpacity>
        );
      })}
    </SetupScreen>
  );
};

const styles = StyleSheet.create({
container: {
    flex: 1,
    backgroundColor: ADD_DEVICE.COLORS.HEADER_BACKGROUND,
  },
header: {
    backgroundColor: ADD_DEVICE.COLORS.HEADER_BACKGROUND,
    height: ADD_DEVICE.DIMENSIONS.HEADER_HEIGHT + 60,
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
  },
headerTitle: {
    textAlign: 'left' as const,
    marginLeft: Spacing.xs,
    marginRight: Spacing.md,
    fontSize: 18,
    fontWeight: '600' as const,
  },
stepIndicator: {
    fontSize: 11,
    textAlign: 'right' as const,
  },
content: {
    flex: 1,
    backgroundColor: colors.background,
  },
formContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
sectionTitle: {
    marginTop: Spacing.xs - 20,
    marginBottom: ADD_DEVICE.DIMENSIONS.SECTION_SPACING,
    fontSize: 18,
    fontWeight: '600' as const,
  },
formFields: {
    marginBottom: ADD_DEVICE.DIMENSIONS.SECTION_SPACING,
  },
buttonContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
deviceCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 16,
  },
plusButton: {
    padding: 6,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
copy: { flex: 1, gap: 2 },
unavailable: { opacity: 0.6 },
soon: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.iconBackground },
soonText: { fontSize: 12, lineHeight: 16 }
});

export default AddDevice2;


