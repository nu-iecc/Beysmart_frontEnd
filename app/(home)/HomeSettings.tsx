import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, TouchableOpacity, View } from 'react-native';
// Design System Imports
import { AppButton } from '@/design-system/Buttons/Buttons';
import { colors } from '@/design-system/colors/colors';
import { BackArrow } from '@/design-system/icons';
import { Dropdown, TextField } from '@/design-system/inputs';
import { Spacing } from '@/design-system/Layout/spacing';
import { Typography } from '@/design-system/typography/typography';
import apiClient from '../../utils/api';
import { scaleFont } from '../../utils/responsive';

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

const HomeSettings: React.FC = () => {
  const params = useLocalSearchParams();
  const homeId = params.homeId as string;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    homeName: '',
    homeType: '',
    homeLocation: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load home data
  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const response = await apiClient.get(`home/homes/${homeId}/`);
        const home = response.data;
        
        setFormData({
          homeName: home.name || '',
          homeType: home.home_type || '',
          homeLocation: home.location || '',
        });
      } catch (error) {
        console.error('Error loading home data:', error);
        Alert.alert('Error', 'Failed to load home details');
      } finally {
        setIsLoading(false);
      }
    };

    if (homeId) {
      loadHomeData();
    }
  }, [homeId]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Home name validation
    if (!formData.homeName.trim()) {
      newErrors.homeName = 'Home name is required';
    } else if (formData.homeName.trim().length < 2) {
      newErrors.homeName = 'Home name must be at least 2 characters';
    }

    // Home type validation
    if (!formData.homeType) {
      newErrors.homeType = 'Home type is required';
    }

    // Home location validation
    if (!formData.homeLocation.trim()) {
      newErrors.homeLocation = 'Location is required';
    } else if (formData.homeLocation.trim().length < 2) {
      newErrors.homeLocation = 'Location must be at least 2 characters';
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

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.patch(`home/homes/${homeId}/`, {
        name: formData.homeName.trim(),
        home_type: formData.homeType,
        location: formData.homeLocation.trim(),
      });

      Alert.alert(
        'Success',
        'Home details updated successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error updating home:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to update home. Please try again.';
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = () => {
    Alert.alert(
      'Delete Home',
      'Are you sure you want to delete this home? This action cannot be undone and will remove all associated devices and data.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await apiClient.delete(`home/homes/${homeId}/`);
              
              Alert.alert(
                'Success',
                'Home deleted successfully',
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/(profile actions)/myHomes' as never)
                  }
                ]
              );
            } catch (error: any) {
              console.error('Error deleting home:', error);
              
              const errorMessage = error.response?.data?.error || 
                                  error.response?.data?.detail || 
                                  error.message || 
                                  'Failed to delete home. Please try again.';
              
              Alert.alert('Error', errorMessage);
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  const homeTypeOptions = [
    { label: 'House', value: 'house' },
    { label: 'Apartment', value: 'apartment' },
    { label: 'Villa', value: 'villa' },
    { label: 'Office', value: 'office' },
    { label: 'Other', value: 'other' },
  ];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              accessibilityLabel="Go back"
            >
              <BackArrow width={24} height={24} color={colors.surface} />
            </TouchableOpacity>
            <Typography variant="h3" color={colors.surface} style={styles.headerTitle}>
              Home Settings
            </Typography>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.base} />
          <Typography variant="body" color={colors.secondaryText} style={styles.loadingText}>
            Loading home details...
          </Typography>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityLabel="Go back"
            accessibilityHint="Return to my homes"
          >
            <BackArrow width={24} height={24} color={colors.surface} />
          </TouchableOpacity>
          <Typography variant="h3" color={colors.surface} style={styles.headerTitle}>
            Home Settings
          </Typography>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Section Title */}
          <Typography variant="h2" color={colors.text} style={styles.sectionTitle}>
            Edit Home Details
          </Typography>

          {/* Form Fields */}
          <View style={styles.formFields}>
            {/* Home Name */}
            <TextField
              label="Home Name"
              value={formData.homeName}
              onChangeText={(value) => handleFieldChange('homeName', value)}
              placeholder="Enter home name"
              error={errors.homeName}
              accessibilityLabel="Home name input"
              accessibilityHint="Enter the name for your home"
            />

            {/* Home Type */}
            <Dropdown
              label="Home Type"
              value={formData.homeType}
              onValueChange={(value) => handleFieldChange('homeType', value)}
              options={homeTypeOptions}
              placeholder="Select home type"
              error={errors.homeType}
              accessibilityLabel="Home type dropdown"
              accessibilityHint="Select the type of your home"
            />

            {/* Home Location */}
            <TextField
              label="Location"
              value={formData.homeLocation}
              onChangeText={(value) => handleFieldChange('homeLocation', value)}
              placeholder="Enter location"
              error={errors.homeLocation}
              accessibilityLabel="Location input"
              accessibilityHint="Enter the location of your home"
            />
          </View>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <AppButton
              variant="primaryLarge"
              title={isSaving ? 'Saving...' : 'Save Changes'}
              onPress={handleSave}
              disabled={isSaving || isDeleting}
              accessibilityLabel="Save changes"
              accessibilityHint="Save the updated home details"
            />
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerZone}>
            <Typography variant="h3" color={colors.error} style={styles.dangerTitle}>
              Danger Zone
            </Typography>
            <Typography variant="caption" color={colors.secondaryText} style={styles.dangerDescription}>
              Once you delete a home, there is no going back. Please be certain.
            </Typography>
            <AppButton
              variant="secondaryLarge"
              title={isDeleting ? 'Deleting...' : 'Delete Home'}
              onPress={handleDelete}
              disabled={isSaving || isDeleting}
              accessibilityLabel="Delete home"
              accessibilityHint="Permanently delete this home and all associated data"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.navBarBackground,
  },
  header: {
    backgroundColor: colors.navBarBackground,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + 10,
    paddingBottom: Spacing.md,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  formContainer: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: scaleFont(20),
    fontWeight: '700' as const,
    marginBottom: Spacing.lg,
  },
  formFields: {
    gap: Spacing.md,
  },
  buttonContainer: {
    marginTop: Spacing.xl,
  },
  dangerZone: {
    marginTop: Spacing.xxl * 2,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dangerTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600' as const,
    marginBottom: Spacing.xs,
  },
  dangerDescription: {
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  deleteButton: {
    borderColor: colors.error,
  },
};

export default HomeSettings;
