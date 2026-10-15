import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
// Design System Imports
import { AppButton } from '@/design-system/Buttons/Buttons';
import { colors } from '@/design-system/colors/colors';
import { ADD_HOME, HOME_ACCESSIBILITY } from '@/design-system/home/Constants';
import { BackArrow } from '@/design-system/icons';
import { Dropdown, TextField } from '@/design-system/inputs';
import { Spacing } from '@/design-system/Layout/spacing';
import { BottomNavigation } from '@/design-system/Navigation/BottomNavigation';
import { Typography } from '@/design-system/typography/typography';
import { BASE_URL } from '../../constants/api';
import apiClient from '../../utils/api';

// Types
interface FormData {
  homeName: string;
  homeType: string;
  homeLocation: string;
}

interface FormErrors {
  homeName?: string;
  homeType?: string;
  homeLocation?: string;
}

const AddHome: React.FC = () => {
  // Form state
  const [formData, setFormData] = useState<FormData>({
    homeName: '',
    homeType: '',
    homeLocation: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const FRONTEND_ONLY = false; // Enable backend API calls

  // Load user data for profile picture
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

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Home name validation
    if (!formData.homeName.trim()) {
      newErrors.homeName = ADD_HOME.VALIDATION.HOME_NAME_REQUIRED;
    } else if (formData.homeName.trim().length < 2) {
      newErrors.homeName = ADD_HOME.VALIDATION.HOME_NAME_MIN_LENGTH;
    }

    // Home type validation
    if (!formData.homeType) {
      newErrors.homeType = ADD_HOME.VALIDATION.HOME_TYPE_REQUIRED;
    }

    // Home location validation
    if (!formData.homeLocation.trim()) {
      newErrors.homeLocation = ADD_HOME.VALIDATION.HOME_LOCATION_REQUIRED;
    } else if (formData.homeLocation.trim().length < 2) {
      newErrors.homeLocation = ADD_HOME.VALIDATION.HOME_LOCATION_MIN_LENGTH;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form field changes
  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Temporary: bypass backend to validate navigation flow
      if (FRONTEND_ONLY) {
        router.push({
          pathname: '/(home)/AddHomePhoto' as never,
          params: {
            homeName: formData.homeName.trim(),
            homeType: formData.homeType,
            homeLocation: formData.homeLocation.trim(),
          }
        } as never);
        return;
      }

      const response = await apiClient.post('home/homes/', {
        name: formData.homeName.trim(),
        home_type: formData.homeType,
        location: formData.homeLocation.trim(),
      });

      // Navigate to next step on any successful 2xx response
      if (response.status >= 200 && response.status < 300) {
        router.push({
          pathname: '/(home)/AddHomePhoto' as never,
          params: {
            homeId: response.data.id.toString(),
            homeName: formData.homeName.trim(),
            homeType: formData.homeType,
            homeLocation: formData.homeLocation.trim(),
          }
        } as never);
        return;
      }
    } catch (error: any) {
      console.error('Error creating home:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to create home. Please try again.';
      
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityLabel="Go back"
            accessibilityHint="Return to previous screen"
          >
            <BackArrow width={24} height={24} color={colors.surface} />
          </TouchableOpacity>
          <Typography variant="h3" color={colors.surface} style={styles.headerTitle}>
            {ADD_HOME.NAVIGATION.TITLE}
          </Typography>
        </View>
        <Typography variant="caption" color={colors.surface} style={styles.stepIndicator}>
          {ADD_HOME.NAVIGATION.STEP_INDICATOR}
        </Typography>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Section Title */}
          <Typography variant="h2" color={ADD_HOME.COLORS.SECTION_TITLE} style={styles.sectionTitle}>
            {ADD_HOME.SECTIONS.HOME_DETAILS}
          </Typography>

          {/* Form Fields */}
          <View style={styles.formFields}>
            {/* Home Name */}
            <TextField
              label={ADD_HOME.FIELDS.HOME_NAME.LABEL}
              value={formData.homeName}
              onChangeText={(value) => handleFieldChange('homeName', value)}
              placeholder={ADD_HOME.FIELDS.HOME_NAME.PLACEHOLDER}
              error={errors.homeName}
              accessibilityLabel={HOME_ACCESSIBILITY.LABELS.HOME_NAME_INPUT}
              accessibilityHint={HOME_ACCESSIBILITY.HINTS.HOME_NAME_INPUT}
            />

            {/* Home Type */}
            <Dropdown
              label={ADD_HOME.FIELDS.HOME_TYPE.LABEL}
              value={formData.homeType}
              onValueChange={(value) => handleFieldChange('homeType', value)}
              options={ADD_HOME.FIELDS.HOME_TYPE.OPTIONS}
              placeholder={ADD_HOME.FIELDS.HOME_TYPE.PLACEHOLDER}
              error={errors.homeType}
              accessibilityLabel={HOME_ACCESSIBILITY.LABELS.HOME_TYPE_DROPDOWN}
              accessibilityHint={HOME_ACCESSIBILITY.HINTS.HOME_TYPE_DROPDOWN}
            />

            {/* Home Location */}
            <TextField
              label={ADD_HOME.FIELDS.HOME_LOCATION.LABEL}
              value={formData.homeLocation}
              onChangeText={(value) => handleFieldChange('homeLocation', value)}
              placeholder={ADD_HOME.FIELDS.HOME_LOCATION.PLACEHOLDER}
              error={errors.homeLocation}
              accessibilityLabel={HOME_ACCESSIBILITY.LABELS.HOME_LOCATION_INPUT}
              accessibilityHint={HOME_ACCESSIBILITY.HINTS.HOME_LOCATION_INPUT}
            />
          </View>

          {/* Next Button */}
          <View style={styles.buttonContainer}>
            <AppButton
              variant="primaryLarge"
              title={ADD_HOME.NAVIGATION.NEXT_BUTTON}
              onPress={handleSubmit}
              disabled={isLoading}
              accessibilityLabel={HOME_ACCESSIBILITY.LABELS.NEXT_BUTTON}
              accessibilityHint={HOME_ACCESSIBILITY.HINTS.NEXT_BUTTON}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation 
        items={[
          { key: 'home', label: 'Home', icon: null },
          { key: 'devices', label: 'Devices', icon: null },
          { key: 'energy', label: 'Energy', icon: null },
          { key: 'profile', label: 'Profile', icon: null },
        ]}
        activeKey="home"
        profile_picture={user?.profile_picture}
        onTabPress={(key) => {
          // Handle navigation based on key
          if (key === 'home') {
            router.push('/(app)/home');
          } else if (key === 'devices') {
            router.push('/(app)/home');
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
    backgroundColor: ADD_HOME.COLORS.HEADER_BACKGROUND,
  },
  header: {
    backgroundColor: ADD_HOME.COLORS.HEADER_BACKGROUND,
    height: ADD_HOME.DIMENSIONS.HEADER_HEIGHT + 60,
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
    marginBottom: ADD_HOME.DIMENSIONS.SECTION_SPACING,
    fontSize: 24,
    fontWeight: '600' as const,
  },
  formFields: {
    marginBottom: ADD_HOME.DIMENSIONS.SECTION_SPACING,
  },
  buttonContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
};

export default AddHome;

