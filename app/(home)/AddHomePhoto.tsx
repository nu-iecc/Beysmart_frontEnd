import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from "react";
import { Alert, Image, TouchableOpacity, View } from 'react-native';
import { BASE_URL } from '../../constants/api';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { colors } from '../../design-system/colors/colors';
import { ADD_HOME } from '../../design-system/home/Constants';
import { BackArrow, ImageIcon, LockIcon, UserIcon } from '../../design-system/icons';
import { Padding } from '../../design-system/Layout/padding';
import { Spacing } from '../../design-system/Layout/spacing';
import { Typography } from '../../design-system/typography/typography';
import apiClient from '../../utils/api';

interface HomeData {
  homeName?: string;
  homeType?: string;
  homeLocation?: string;
}

const AddHomePhoto = () => {
  const params = useLocalSearchParams();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Get home data from previous screen
  const homeId = params.homeId as string;
  const homeData: HomeData = {
    homeName: (params.homeName as string) || 'Main Home',
    homeType: (params.homeType as string) || 'Apartment',
    homeLocation: (params.homeLocation as string) || 'Maadi',
  };


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

  const handleHomePhoto = async () => {
    if (!selectedImage) {
      Alert.alert('No Photo Selected', 'Please select a photo first.');
      return;
    }

    if (!homeId) {
      Alert.alert('Error', 'Home ID not found. Please try creating the home again.');
      console.error('Home ID is missing:', homeId);
      return;
    }

    console.log('🏠 Starting home photo upload...');
    console.log('Home ID:', homeId);
    console.log('Home Name:', homeData.homeName);
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
        name: `home_photo.${fileExtension}`,
      } as any);

      console.log('📤 Uploading to endpoint:', `home/homes/${homeId}/upload_photo/`);
      console.log('Full URL will be:', `${BASE_URL}home/homes/${homeId}/upload_photo/`);
      console.log('FormData prepared with photo');
   
      const response = await apiClient.patch(`home/homes/${homeId}/upload_photo/`, formData, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log('✅ Upload successful:', response.data);
      
      // Navigate to the next screen (you can adjust this based on your flow)
      Alert.alert('Success', 'Home photo uploaded successfully!', [
        {
          text: 'Continue',
          onPress: () => {
            // Navigate to AddHomeDone with home data
            router.push({
              pathname: '/(home)/AddHomeDone' as never,
              params: {
                homeName: homeData.homeName,
                homeType: homeData.homeType,
                homeLocation: homeData.homeLocation,
                homePhoto: selectedImage,
              }
            } as never);
          }
        }
      ]);
      
    } catch (error: any) {
      console.error('❌ Home photo upload failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config?.url,
        headers: error.config?.headers
      });
      
      let errorMessage = 'Failed to upload home photo. Please try again.';
      
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
      'Skip Home Photo',
      'Are you sure you want to skip adding a home photo? You can add one later.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip',
          onPress: () => {
            // Navigate to AddHomeDone with home data
            router.push({
              pathname: '/(home)/AddHomeDone' as never,
              params: {
                homeName: homeData.homeName,
                homeType: homeData.homeType,
                homeLocation: homeData.homeLocation,
                homePhoto: undefined,
              }
            } as never);
          },
        },
      ]
    );
  };

  const isDisabled = !selectedImage || isUploading;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header (match AddHome) */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push('/(home)/AddHome' as never);
              }
            }}
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

      {/* Intro content */}
      <View style={{ ...Padding.screenHorizontal, marginTop: Spacing.lg }}>
        <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
          <View
            style={{
              width: 96,
              height: 96,
              backgroundColor: colors.primary.base,
              borderRadius: 48,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: Spacing.md,
            }}
          >
            <UserIcon width={32} height={32} color={colors.text} />
          </View>
          
          <Typography variant="h1" style={{ marginBottom: Spacing.xs }}>
            Personalize Your Home
          </Typography>
          
          <Typography variant="body" color={colors.secondaryText} style={{ textAlign: 'center' }}>
            Add a photo to quickly identify this home in your list.
          </Typography>
        </View>
      </View>

      {/* Photo Upload Area */}
      <View style={{ ...Padding.screenHorizontal, marginBottom: Spacing.xl }}>
        <TouchableOpacity
          style={{
            borderWidth: 2,
            borderColor: colors.border,
            borderStyle: 'dashed',
            borderRadius: 12,
            padding: Spacing.xl,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.surface,
            minHeight: 120,
          }}
          onPress={pickImage}
        >
          {selectedImage ? (
            <View style={{ alignItems: 'center' }}>
              <Image
                source={{ uri: selectedImage }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  marginBottom: Spacing.sm,
                }}
              />
              <Typography variant="body" color={colors.secondaryText}>
                Tap to change photo
              </Typography>
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <ImageIcon width={48} height={48} color={colors.secondaryText} />
              <Typography variant="body" color={colors.secondaryText} style={{ marginTop: Spacing.sm }}>
                Add Photo
              </Typography>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={{ ...Padding.screenHorizontal, marginTop: 'auto', paddingBottom: Spacing.lg }}>
        <AppButton
          variant={isDisabled ? 'primaryDisabled' : 'primaryLarge'}
          title={isUploading ? 'Uploading...' : 'Next'}
          onPress={handleHomePhoto}
          disabled={isDisabled}
        />

        <TouchableOpacity
          style={{
            alignItems: 'center',
            marginTop: Spacing.lg,
            paddingVertical: Spacing.sm,
          }}
          onPress={handleSkip}
        >
          <Typography variant="body" color={colors.secondary.base}>
            Skip This Step
          </Typography>
        </TouchableOpacity>

        {/* Security Indicator */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginTop: Spacing.xl 
        }}>
          <LockIcon width={16} height={16} color={colors.secondaryText} />
          <Typography 
            variant="caption" 
            color={colors.secondaryText}
            style={{ marginLeft: 4 }}
          >
            Your data is securely encrypted
          </Typography>
        </View>
      </View>
    </View>
  );
};

export default AddHomePhoto;

// Styles to match AddHome header
const styles = {
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
    fontSize: 11,
    textAlign: 'right' as const,
  },
};
