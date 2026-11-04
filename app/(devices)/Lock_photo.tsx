import SetupScreen from '@/components/SetupScreen';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from "react";
import { Alert, Image, TouchableOpacity, View } from 'react-native';
import { BASE_URL } from '../../constants/api';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { colors } from '../../design-system/colors/colors';
import { DEVICE_DETAILS_SETUP } from '../../design-system/home/Constants';
import { BackArrow, ImageIcon, LockIcon } from '../../design-system/icons';
import { Beylock } from '../../design-system/icons/filled';
import { Padding } from '../../design-system/Layout/padding';
import { Spacing } from '../../design-system/Layout/spacing';
import { Typography } from '../../design-system/typography/typography';
import apiClient from '../../utils/api';

const Lock_photo = () => {
  const params = useLocalSearchParams();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Get device data from previous screen
  const deviceId = params.deviceId as string;
  const deviceName = params.deviceName as string;
  const deviceLocation = params.deviceLocation as string;
  const deviceType = params.deviceType as string;
  const deviceToken = params.deviceToken as string;

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to select a photo.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedAsset = result.assets[0];

        // Validate file size (max 5MB)
        if (selectedAsset.fileSize && selectedAsset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select an image smaller than 5MB.');
          return;
        }

        setSelectedImage(selectedAsset.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleLockPhoto = async () => {
    if (!selectedImage) {
      Alert.alert('No Photo Selected', 'Please select a photo first.');
      return;
    }

    if (!deviceId) {
      Alert.alert('Error', 'Device ID not found. Please try creating the device again.');
      console.error('Device ID is missing:', deviceId);
      return;
    }

    console.log('📸 Starting device photo upload...');
    console.log('Device ID:', deviceId);
    console.log('Device Name:', deviceName);
    console.log('Image URI:', selectedImage);

    setIsUploading(true);
    try {
      // Create FormData for the image upload
      const formData = new FormData();

      // Get the file extension and determine MIME type
      const uriParts = selectedImage.split('.');
      const fileExtension = uriParts[uriParts.length - 1].toLowerCase();

      // Map common extensions to MIME types
      const mimeTypeMap: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
      };

      const mimeType = mimeTypeMap[fileExtension] || 'image/jpeg';

      // Append the image file
      formData.append('photo', {
        uri: selectedImage,
        type: mimeType,
        name: `lock_photo.${fileExtension}`,
      } as any);

      console.log('📤 Uploading to endpoint:', `home/devices/${deviceId}/upload-photo/`);
      console.log('Full URL will be:', `${BASE_URL}home/devices/${deviceId}/upload-photo/`);
      console.log('FormData prepared with photo');

      const response = await apiClient.patch(`home/devices/${deviceId}/upload-photo/`, formData, {
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('✅ Upload successful:', response.data);

      // Navigate to the next screen (AddDevice9)
      Alert.alert('Success', 'Device photo uploaded successfully!', [
        {
          text: 'Continue',
          onPress: () => {
            router.push({
              pathname: '/(devices)/AddDevice9' as never,
              params: {
                deviceName: deviceName,
                deviceLocation: deviceLocation,
                deviceType: deviceType,
                deviceId: deviceId,
                deviceToken: deviceToken,
                devicePhoto: selectedImage,
              }
            } as never);
          }
        }
      ]);

    } catch (error: any) {
      console.error('❌ Device photo upload failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config?.url
      });

      let errorMessage = 'Failed to upload device photo. Please try again.';

      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.photo) {
          errorMessage = Array.isArray(errorData.photo) ? errorData.photo[0] : errorData.photo;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Device Photo',
      'Are you sure you want to skip adding a device photo? You can add one later.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip',
          onPress: () => {
            // Navigate to AddDevice9 without photo
            router.push({
              pathname: '/(devices)/AddDevice9' as never,
              params: {
                deviceName: deviceName,
                deviceLocation: deviceLocation,
                deviceType: deviceType,
                deviceId: deviceId,
                deviceToken: deviceToken,
                devicePhoto: undefined,
              }
            } as never);
          },
        },
      ]
    );
  };

  const isDisabled = !selectedImage || isUploading;

  return (<SetupScreen step={5} title="Add a lock photo" subtitle="A photo makes your lock easy to recognise." busy={isUploading}
    footer={<View style={{ gap: 12 }}>
      <AppButton variant="primaryLarge" title={isUploading ? 'Uploading…' : 'Save photo'} onPress={handleLockPhoto} disabled={isDisabled} />
      <AppButton variant="secondaryMedium" title="Skip for now" onPress={handleSkip} disabled={isUploading} />
    </View>}>
    <TouchableOpacity onPress={pickImage} disabled={isUploading} accessibilityRole="button" accessibilityLabel="Choose lock photo"
      style={{ borderRadius: 24, minHeight: 280, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 16 }}>
      {selectedImage ? <Image source={{ uri: selectedImage }} style={{ width: '100%', height: 240, borderRadius: 20 }} resizeMode="cover" /> : <ImageIcon width={64} height={64} color={colors.disabled} />}
      <Typography variant="h3">{selectedImage ? 'Change photo' : 'Choose a photo'}</Typography>
      <Typography variant="caption" color={colors.disabled}>{deviceName}</Typography>
    </TouchableOpacity>
  </SetupScreen>);
};

export default Lock_photo;

// Styles to match Device screens
const styles = {
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
  },
  headerTitle: {
    textAlign: 'left' as const,
    marginLeft: Spacing.xs,
    marginRight: Spacing.md,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  stepIndicator: {
    fontSize: 14,
    textAlign: 'right' as const,
  },
};
