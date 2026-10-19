import axios from "axios";
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from "react";
import { Alert, Image, TouchableOpacity, View } from 'react-native';
import { BASE_URL } from '../../constants/api';
import { AUTH_COPY, AUTH_TEXT, AUTH_THEME, AUTH_VISUALS, type AuthScreenCopy } from '../../design-system/auth/constants';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { colors } from '../../design-system/colors/colors';
import { ImageIcon } from '../../design-system/icons';
import { Padding } from '../../design-system/Layout/padding';
import { Spacing } from '../../design-system/Layout/spacing';
import { Typography } from '../../design-system/typography/typography';
import apiClient from '../../utils/api';

const ProfilePhoto = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { email, phone_number, fromAccountSettings } = useLocalSearchParams();

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

  const handleProfilePhoto = async () => {
    if (!selectedImage) {
      Alert.alert('No Photo Selected', 'Please select a photo first.');
      return;
    }

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
      formData.append('profile_picture', {
        uri: selectedImage,
        type: mimeType,
        name: `profile_picture.${fileExtension}`,
      } as any);
      
      // Append other user data if available (for registration flow)
      if (email) formData.append('email', email as string);
      if (phone_number) formData.append('phone_number', phone_number as string);

      // Make the API call - use different approach based on flow
      let response;
      if (fromAccountSettings === 'true') {
        // From AccountSettings - use authenticated apiClient
        response = await apiClient.patch('auth/update-profile-picture/', formData);
      } else {
        // Registration flow - use axios with AllowAny permission
        response = await axios.patch(`${BASE_URL}auth/update-profile-picture/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          params:{
              email: email,
              phoneNumber: phone_number,
          }
        });
      }

      
      // Navigate based on the flow
      Alert.alert('Success', 'Profile photo uploaded successfully!', [
        {
          text: 'Continue',
          onPress: () => {
            if (fromAccountSettings === 'true') {
              // From AccountSettings - go back to AccountSettings
              router.back();
            } else {
              // Registration flow - go to login page
              router.push('/(auth)/loginpage' as never);
            }
          }
        }
      ]);
      
    } catch (error: any) {
      console.error('Profile photo upload failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload profile photo. Please try again.';
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Profile Photo',
      'Are you sure you want to skip adding a profile photo? You can add one later.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip',
          onPress: () => {
            // Navigate to login page
            router.push('/(auth)/loginpage' as never);
          },
        },
      ]
    );
  };

  const isDisabled = !selectedImage || isUploading;

  const copy = AUTH_COPY.profilePhoto as AuthScreenCopy;
  const visuals = AUTH_VISUALS.profilePhoto;

  return (
    <View style={{ flex: 1, backgroundColor: AUTH_THEME.background }}>
      {/* Header (fixed) */}
      <View style={{ paddingTop: Spacing.xxl, ...Padding.screenHorizontal }}>
        {/* Back Button */}
        <TouchableOpacity
          style={{
            width: 48,
            height: 48,
            backgroundColor: colors.surface,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: Spacing.lg,
          }}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/(auth)/Complete-Registeration' as never);
            }
          }}
        >
          <visuals.backIcon width={24} height={24} color={AUTH_THEME.text} />
        </TouchableOpacity>

        {/* User Icon */}
        <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
          <View
            style={{
              width: 96,
              height: 96,
              backgroundColor: visuals.headerCircleBg || AUTH_THEME.primary,
              borderRadius: 48,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: Spacing.md,
            }}
          >
            <visuals.headerIcon width={32} height={32} color={AUTH_THEME.text} />
          </View>
          
          <Typography variant="h1" style={{ marginBottom: Spacing.xs }}>
            {copy.title}
          </Typography>
          
          <Typography variant="body" color={AUTH_THEME.secondaryText} style={{ textAlign: 'center' }}>
            {copy.subtitle}
          </Typography>
        </View>
      </View>

      {/* Photo Upload Area */}
      <View style={{ ...Padding.screenHorizontal, marginBottom: Spacing.xl }}>
        <TouchableOpacity
          style={{
            borderWidth: 2,
            borderColor: AUTH_THEME.border,
            borderStyle: 'dashed',
            borderRadius: 12,
            padding: Spacing.xl,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: AUTH_THEME.surface,
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
              <Typography variant="body" color={AUTH_THEME.secondaryText}>
                Tap to change photo
              </Typography>
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <ImageIcon width={48} height={48} color={AUTH_THEME.secondaryText} />
              <Typography variant="body" color={AUTH_THEME.secondaryText} style={{ marginTop: Spacing.sm }}>
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
          title={isUploading ? 'Uploading...' : copy.buttons.primaryTitle}
          onPress={handleProfilePhoto}
          disabled={isDisabled}
        />

        <TouchableOpacity
          style={{
            alignItems: 'center',
            marginTop: Spacing.lg,
            paddingVertical: Spacing.sm,
          }}
          onPress={() => router.push('/(auth)/loginpage' as never)}
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
          {visuals.securityIcon ? (
            <visuals.securityIcon width={16} height={16} color={AUTH_THEME.secondaryText} />
          ) : null}
          <Typography 
            variant="caption" 
            color={AUTH_THEME.secondaryText}
            style={{ marginLeft: 4 }}
          >
            {AUTH_TEXT.securityFooter}
          </Typography>
        </View>
      </View>
    </View>
  );
};

export default ProfilePhoto;
