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
import { BASE_URL } from '../../constants/api';
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

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUser({
            first_name: userData.first_name || undefined,
            profile_picture: userData.profile_picture ? `${BASE_URL.replace('/api/', '')}${userData.profile_picture}` : undefined
          });
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} accessibilityLabel="Go back" accessibilityHint="Return to previous screen">
            <BackArrow width={24} height={24} color={colors.surface} />
          </TouchableOpacity>
          <Typography variant="h3" color={colors.surface} style={styles.headerTitle}>
            {ADD_DEVICE.NAVIGATION.TITLE}
          </Typography>
        </View>
        <Typography variant="caption" color={colors.surface} style={styles.stepIndicator}>
          {ADD_DEVICE.NAVIGATION.STEP_INDICATOR}
        </Typography>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Typography variant="h2" color={ADD_DEVICE.COLORS.SECTION_TITLE} style={styles.sectionTitle}>
            {ADD_DEVICE.SECTIONS.AVAILABLE_DEVICES}
          </Typography>

          {AVAILABLE_DEVICES.map((d) => (
            <View key={d.id} style={styles.deviceCard}>
              <View style={[styles.deviceIconContainer, { backgroundColor: d.iconBackgroundColor }]}>
                {/* dynamic filled icon */}
                {/* We use the filled icons index export names */}
                {(require('@/design-system/icons/filled') as any)[d.iconName] &&
                  React.createElement((require('@/design-system/icons/filled') as any)[d.iconName], {
                    width: 24,
                    height: 24,
                    color: d.iconColor,
                  })}
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="h3" color={colors.text} style={{ marginBottom: 2, fontSize: 16 }}>
                  {d.title}
                </Typography>
                <Typography variant="caption" color={colors.secondaryText}>
                  {d.subtitle}
                </Typography>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  // Store device type for use in AddDevice8
                  try {
                    await AsyncStorage.setItem('selectedDeviceType', d.id);
                    console.log('Stored device type:', d.id);
                  } catch (error) {
                    console.error('Error storing device type:', error);
                  }
                  
                  if (d.id === 'beylock') {
                    router.push('/(devices)/AddDevice3');
                  } else {
                    handleFieldChange('deviceType', d.id);
                  }
                }}
                accessibilityLabel={`Add ${d.title}`}
              >
                <View style={styles.plusButton}>
                  {/* Plus icon from filled icons */}
                  {React.createElement((require('@/design-system/icons/filled') as any).PlusIcon, {
                    width: 18,
                    height: 18,
                    color: colors.completedstep,
                  })}
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNavigation
        items={[
          { key: 'home', label: 'Home', icon: null },
          { key: 'devices', label: 'Devices', icon: null },
          { key: 'energy', label: 'Energy', icon: null },
          { key: 'profile', label: 'Profile', icon: null },
        ]}
        activeKey="devices"
        profile_picture={user?.profile_picture}
        onTabPress={(key) => {
          if (key === 'home') {
            router.push('/(app)/home');
          } else if (key === 'devices') {
            // stay
          } else if (key === 'energy') {
            router.push('/(app)/home');
          } else if (key === 'profile') {
            router.push({ pathname: '/(app)/home', params: { tab: 'profile' } });
          }
        }}
      />

    </View>
  );
};

const styles = {
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
    fontSize: 12,
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
};

export default AddDevice2;


