import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, TouchableOpacity, View } from 'react-native';
import ProfilePage from '../(profile actions)/Profile';

// Design System Imports
import { AppButton } from '@/design-system/Buttons/Buttons';
import { colors } from '@/design-system/colors/colors';
import { ADD_ROOM, ROOM_ACCESSIBILITY } from '@/design-system/home/Constants';
import {
  BackArrow,
  ImageIcon,
  PlusIcon
} from '@/design-system/icons';
import {
  Bag,
  BathIcon,
  BedroomIcon,
  Car,
  Gym,
  Hallway,
  KitchenIcon,
  LivingIcon,
  pots,
  Screen,
  Shirt,
} from '@/design-system/icons/filled';
import DropdownIcon from '@/design-system/icons/outlined/Dropdown';
import { Dropdown, TextField } from '@/design-system/inputs';
import { Spacing } from '@/design-system/Layout/spacing';
import { BottomNavigation } from '@/design-system/Navigation/BottomNavigation';
import { Typography } from '@/design-system/typography/typography';
import { getMediaUrl } from '../../constants/api';
import apiClient from '../../utils/api';

// Types
interface FormData {
  roomName: string;
  addedTo: string;
  roomType: string;
  roomPhoto: string | null;
  floor: string;
  roomDimensions: string;
}

interface FormErrors {
  roomName?: string;
  addedTo?: string;
  roomType?: string;
  roomPhoto?: string;
  floor?: string;
  roomDimensions?: string;
}

interface Home {
  id: string;
  name: string;
  type: string;
  location: string;
}

// Icon mapping for room types
const ROOM_ICON_MAP = {
  'BedroomIcon': BedroomIcon,
  'LivingIcon': LivingIcon,
  'KitchenIcon': KitchenIcon,
  'BathIcon': BathIcon,
  'Gym': Gym,
  'Car': Car,
  'Bag': Bag,
  'Screen': Screen,
  'pots': pots,
  'Shirt': Shirt,
  'Hallway': Hallway,
  'PlusIcon': PlusIcon,
};

const AddRoom: React.FC = () => {
  const params = useLocalSearchParams()
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    roomName: '',
    addedTo: params.homeId ? String(params.homeId) : '',
    roomType: '',
    roomPhoto: null,
    floor: '1',
    roomDimensions: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [homes, setHomes] = useState<Home[]>([]);
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const FRONTEND_ONLY = false; // Enable backend API calls

  // Load homes on component mount
  useEffect(() => {
    loadHomes();
  }, []);

  // Load user data for profile picture
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

  const loadHomes = async () => {
    try {
      if (FRONTEND_ONLY) {
        // Mock data for frontend development
        setHomes([
          { id: '1', name: 'Main Home', type: 'Apartment', location: 'Maadi' },
          { id: '2', name: 'Summer House', type: 'House', location: 'North Coast' },
        ]);
        return;
      }

      const response = await apiClient.get('home/homes/');
      setHomes(response.data);
    } catch (error) {
      console.error('Error loading homes:', error);
      // Fallback to mock data
      setHomes([
        { id: '1', name: 'Main Home', type: 'Apartment', location: 'Maadi' },
      ]);
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Room name validation
    if (!formData.roomName.trim()) {
      newErrors.roomName = ADD_ROOM.VALIDATION.ROOM_NAME_REQUIRED;
    } else if (formData.roomName.trim().length < 2) {
      newErrors.roomName = ADD_ROOM.VALIDATION.ROOM_NAME_MIN_LENGTH;
    }

    // Added to validation
    if (!formData.addedTo) {
      newErrors.addedTo = ADD_ROOM.VALIDATION.ADDED_TO_REQUIRED;
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

  // Handle room type selection
  const handleRoomTypeSelect = (roomType: string) => {
    setFormData(prev => ({ 
      ...prev, 
      roomType: prev.roomType === roomType ? '' : roomType 
    }));
  };

  // Handle room dimensions selection
  const handleDimensionsSelect = (dimensions: string) => {
    setFormData(prev => ({ 
      ...prev, 
      roomDimensions: prev.roomDimensions === dimensions ? '' : dimensions 
    }));
  };

  // Handle photo selection
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to select a photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedAsset = result.assets[0];
        
        if (selectedAsset.fileSize && selectedAsset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select an image smaller than 5MB.');
          return;
        }
        
        setFormData(prev => ({ ...prev, roomPhoto: selectedAsset.uri }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      if (FRONTEND_ONLY) {
        // Navigate to next screen for frontend testing
        router.push({
          pathname: '/(room)/AddRoomDone' as never,
          params: {
            roomName: formData.roomName.trim(),
            addedTo: formData.addedTo,
            roomType: formData.roomType,
            floor: formData.floor,
            roomDimensions: formData.roomDimensions,
            roomPhoto: formData.roomPhoto,
          }
        } as never);
        return;
      }

      const response = await apiClient.post('home/rooms/', {
        name: formData.roomName.trim(),
        home: formData.addedTo, // Changed from home_id to home to match backend serializer
        room_type: formData.roomType,
        floor: parseInt(formData.floor), // Convert to integer
        dimension_m2: formData.roomDimensions, // Changed from 'dimensions' to 'dimension_m2'
        photo: formData.roomPhoto,
      });

      if (response.status >= 200 && response.status < 300) {
        // Find the selected home to get its name
        const selectedHome = homes.find(home => home.id === formData.addedTo);
        const homeName = selectedHome?.name || 'Unknown Home';
        
        router.push({
          pathname: '/(room)/AddRoomDone' as never,
          params: {
            roomName: formData.roomName,
            homeName: homeName,
            roomType: formData.roomType,
            roomPhoto: formData.roomPhoto,
          }
        } as never);
        return;
      }
    } catch (error) {
      console.error('Error creating room:', error);
      Alert.alert(
        'Error',
        'Failed to create room. Please try again.',
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

  // Get home options for dropdown
  const homeOptions = homes.map(home => ({
    label: home.name,
    value: home.id,
  }));

  // Render room type button
  const renderRoomTypeButton = (option: any) => {
    const IconComponent = ROOM_ICON_MAP[option.icon as keyof typeof ROOM_ICON_MAP];
    const isSelected = formData.roomType === option.value;

    return (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.roomTypeButton,
          {
            borderColor: isSelected ? ADD_ROOM.COLORS.ROOM_TYPE_SELECTED : ADD_ROOM.COLORS.ROOM_TYPE_UNSELECTED,
            backgroundColor: isSelected ? `${ADD_ROOM.COLORS.ROOM_TYPE_SELECTED}20` : colors.surface,
          }
        ]}
        onPress={() => handleRoomTypeSelect(option.value)}
        accessibilityLabel={`${ROOM_ACCESSIBILITY.LABELS.ROOM_TYPE_BUTTON} ${option.label}`}
        accessibilityHint={ROOM_ACCESSIBILITY.HINTS.ROOM_TYPE_BUTTON}
        accessibilityRole="button"
      >
        <IconComponent 
          width={24} 
          height={24} 
          color={colors.text} 
        />
        <Typography 
          variant="caption" 
          color={colors.text}
          style={styles.roomTypeText}
        >
          {option.label}
        </Typography>
      </TouchableOpacity>
    );
  };

  // Render dimensions option
  const renderDimensionsOption = (option: any) => {
    const isSelected = formData.roomDimensions === option.value;

    return (
      <TouchableOpacity
        key={option.value}
        style={styles.dimensionItem}
        onPress={() => handleDimensionsSelect(option.value)}
        accessibilityLabel={`${ROOM_ACCESSIBILITY.LABELS.DIMENSIONS_OPTIONS} ${option.label}`}
        accessibilityHint={ROOM_ACCESSIBILITY.HINTS.DIMENSIONS_OPTIONS}
        accessibilityRole="button"
      >
        <View style={styles.checkboxContainer}>
          <View style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected,
          ]}>
            {isSelected && (
              <Typography variant="body" style={styles.checkmark}>✓</Typography>
            )}
          </View>
        </View>
        <Typography 
          variant="body" 
          color={colors.text}
          style={styles.dimensionsText}
        >
          {option.label}
        </Typography>
      </TouchableOpacity>
    );
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
            {ADD_ROOM.NAVIGATION.TITLE}
          </Typography>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Form Fields */}
          <View style={styles.formFields}>
            {/* Room Name */}
            <TextField
              label={ADD_ROOM.FIELDS.ROOM_NAME.LABEL}
              value={formData.roomName}
              onChangeText={(value) => handleFieldChange('roomName', value)}
              placeholder={ADD_ROOM.FIELDS.ROOM_NAME.PLACEHOLDER}
              error={errors.roomName}
              accessibilityLabel={ROOM_ACCESSIBILITY.LABELS.ROOM_NAME_INPUT}
              accessibilityHint={ROOM_ACCESSIBILITY.HINTS.ROOM_NAME_INPUT}
            />

            {/* Added To */}
            <Dropdown
              label={ADD_ROOM.FIELDS.ADDED_TO.LABEL}
              value={formData.addedTo}
              onValueChange={(value) => handleFieldChange('addedTo', value)}
              options={homeOptions}
              placeholder={ADD_ROOM.FIELDS.ADDED_TO.PLACEHOLDER}
              error={errors.addedTo}
              accessibilityLabel={ROOM_ACCESSIBILITY.LABELS.ADDED_TO_DROPDOWN}
              accessibilityHint={ROOM_ACCESSIBILITY.HINTS.ADDED_TO_DROPDOWN}
            />

            {/* Room Type */}
            <View style={styles.roomTypeSection}>
              <Typography variant="body" style={styles.roomTypeLabel}>
                {ADD_ROOM.FIELDS.ROOM_TYPE.LABEL}
              </Typography>
              <View style={styles.roomTypeGrid}>
                {ADD_ROOM.FIELDS.ROOM_TYPE.OPTIONS.map(renderRoomTypeButton)}
              </View>
            </View>

            {/* Room Photo */}
            <View style={styles.photoSection}>
              <Typography variant="body" style={styles.photoLabel}>
                {ADD_ROOM.FIELDS.ROOM_PHOTO.LABEL}
              </Typography>
              <TouchableOpacity
                style={styles.photoUpload}
                onPress={pickImage}
                accessibilityLabel={ROOM_ACCESSIBILITY.LABELS.ROOM_PHOTO_UPLOAD}
                accessibilityHint={ROOM_ACCESSIBILITY.HINTS.ROOM_PHOTO_UPLOAD}
                accessibilityRole="button"
              >
                {formData.roomPhoto ? (
                  <View style={styles.photoPreview}>
                    <Image
                      source={{ uri: formData.roomPhoto }}
                      style={styles.photoImage}
                    />
                    <Typography variant="body" color={colors.secondaryText} style={styles.photoChangeText}>
                      Tap to change photo
                    </Typography>
                  </View>
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <ImageIcon width={48} height={48} color={colors.secondaryText} />
                    <Typography variant="body" color={colors.secondaryText} style={styles.photoAddText}>
                      Add Photo
                    </Typography>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Advanced Options */}
          <View style={styles.advancedSection}>
            <TouchableOpacity
              style={styles.advancedHeader}
              onPress={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
              accessibilityLabel="Advanced options"
              accessibilityHint="Tap to expand or collapse advanced options"
              accessibilityRole="button"
            >
              <Typography variant="body" color={ADD_ROOM.COLORS.SECTION_TITLE} style={styles.advancedTitle}>
                {ADD_ROOM.SECTIONS.ADVANCED_OPTIONS}
              </Typography>
              <DropdownIcon 
                width={20} 
                height={20} 
                color={colors.text}
                style={{
                  transform: [{ rotate: isAdvancedExpanded ? '180deg' : '0deg' }]
                }}
              />
            </TouchableOpacity>

            {isAdvancedExpanded && (
              <View style={styles.advancedContent}>
                {/* Floor Selection */}
                <View style={styles.floorSection}>
                  <Typography variant="body" style={styles.floorLabel}>
                    {ADD_ROOM.FIELDS.FLOOR.LABEL}
                  </Typography>
                  <View style={styles.floorDropdown}>
                    <Dropdown
                      value={formData.floor}
                      onValueChange={(value) => handleFieldChange('floor', value)}
                      options={ADD_ROOM.FIELDS.FLOOR.OPTIONS}
                      placeholder={ADD_ROOM.FIELDS.FLOOR.PLACEHOLDER}
                      accessibilityLabel={ROOM_ACCESSIBILITY.LABELS.FLOOR_DROPDOWN}
                      accessibilityHint={ROOM_ACCESSIBILITY.HINTS.FLOOR_DROPDOWN}
                    />
                  </View>
                </View>

                {/* Room Dimensions */}
                <View style={styles.dimensionsSection}>
                  <Typography variant="body" style={styles.dimensionsLabel}>
                    {ADD_ROOM.FIELDS.ROOM_DIMENSIONS.LABEL}
                  </Typography>
                  <Typography variant="caption" color={colors.secondaryText} style={styles.dimensionsSubtitle}>
                    {ADD_ROOM.FIELDS.ROOM_DIMENSIONS.SUBTITLE}
                  </Typography>
                  <View style={styles.dimensionsOptions}>
                    {ADD_ROOM.FIELDS.ROOM_DIMENSIONS.OPTIONS.map(renderDimensionsOption)}
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Create Button */}
          <View style={styles.buttonContainer}>
            <AppButton
              variant="primaryLarge"
              title={isLoading ? 'Creating Room...' : ADD_ROOM.NAVIGATION.CREATE_BUTTON}
              icon={isLoading ? (
                <ActivityIndicator 
                  size="small" 
                  color={colors.primary.lighter} 
                  style={{ marginRight: Spacing.xs }}
                />
              ) : undefined}
              onPress={handleSubmit}
              disabled={isLoading}
              accessibilityLabel={ROOM_ACCESSIBILITY.LABELS.CREATE_BUTTON}
              accessibilityHint={ROOM_ACCESSIBILITY.HINTS.CREATE_BUTTON}
            />

            {/* Loading Message */}
            {isLoading && (
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginTop: Spacing.md 
              }}>
                <ActivityIndicator 
                  size="small" 
                  color={colors.primary.darker} 
                  style={{ marginRight: Spacing.xs }}
                />
                <Typography 
                  variant="caption" 
                  color={colors.primary.darker}
                >
                  Setting up your room and connecting to ThingsBoard...
                </Typography>
              </View>
            )}
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
          if (key === 'home') {
            router.push('/(app)/home');
          } else if (key === 'devices') {
            router.push('/(HomePage_actions)/MyDevices' as any);
          } else if (key === 'energy') {
            router.push('/(app)/home');
          } else if (key === 'profile') {
            setShowProfile(true);
          }
        }}
      />

      {/* Profile Modal */}
      <ProfilePage
        visible={showProfile}
        userData={user ? {
          name: user.first_name || null,
          email: userEmail,
          profilePicture: user.profile_picture || null,
          homesCount: homes.length
        } : undefined}
        onClose={() => setShowProfile(false)}
        onAddDevice={() => {
          setShowProfile(false);
          router.push('/(devices)/AddDevice2');
        }}
        onMyHomes={() => {
          setShowProfile(false);
          router.push('/(profile actions)/myHomes');
        }}
        onInviteFamily={() => {
          setShowProfile(false);
          // Handle invite family
        }}
        onAccountSettings={() => {
          setShowProfile(false);
          router.push('/(profile actions)/AccountSettings');
        }}
        onHelpSupport={() => {
          setShowProfile(false);
          router.push('/(profile actions)/Help&support');
        }}
      />
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: ADD_ROOM.COLORS.HEADER_BACKGROUND,
  },
  header: {
    backgroundColor: ADD_ROOM.COLORS.HEADER_BACKGROUND,
    height: ADD_ROOM.DIMENSIONS.HEADER_HEIGHT + 60,
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
    marginTop: Spacing.md,
    marginBottom: ADD_ROOM.DIMENSIONS.SECTION_SPACING,
    fontSize: 24,
    fontWeight: '600' as const,
  },
  formFields: {
    marginBottom: ADD_ROOM.DIMENSIONS.SECTION_SPACING,
  },
  roomTypeSection: {
    marginBottom: Spacing.xs,
  },
  roomTypeLabel: {
    marginBottom: Spacing.sm,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  roomTypeGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
  roomTypeButton: {
    width: ADD_ROOM.DIMENSIONS.ROOM_TYPE_BUTTON_SIZE,
    height: 70,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: Spacing.sm,
  },
  roomTypeText: {
    marginTop: Spacing.xs,
    fontSize: 12,
    textAlign: 'center' as const,
  },
  photoSection: {
    marginBottom: Spacing.xs,
  },
  photoLabel: {
    marginBottom: Spacing.sm,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  photoUpload: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed' as const,
    borderRadius: 12,
    height: ADD_ROOM.DIMENSIONS.PHOTO_UPLOAD_HEIGHT,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.surface,
  },
  photoPreview: {
    alignItems: 'center' as const,
  },
  photoImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: Spacing.xs,
  },
  photoChangeText: {
    fontSize: 14,
  },
  photoPlaceholder: {
    alignItems: 'center' as const,
  },
  photoAddText: {
    marginTop: Spacing.sm,
    fontSize: 16,
  },
  advancedSection: {
    marginBottom: Spacing.md,
  },
  advancedHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: Spacing.xs,
  },
  advancedTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  advancedContent: {
    paddingTop: Spacing.xs,
  },
  floorSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: Spacing.md,
  },
  floorLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    flex: 1,
  },
  floorDropdown: {
    width: 70,
    marginLeft: Spacing.md,
  },
  dimensionsSection: {
    marginTop: Spacing.xs,
  },
  dimensionsLabel: {
    marginBottom: Spacing.xs,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  dimensionsSubtitle: {
    marginBottom: Spacing.sm,
    fontSize: 14,
  },
  dimensionsOptions: {
    flexDirection: 'column' as const,
  },
  dimensionItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 4,
  },
  checkboxContainer: {
    marginRight: Spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  checkboxSelected: {
    backgroundColor: colors.roomtypeSelected,
    borderColor: colors.roomtypeSelected,
  },
  checkmark: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  dimensionsText: {
    fontSize: 16,
    fontWeight: '500' as const,
    flex: 1,
  },
  buttonContainer: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
};

export default AddRoom;
