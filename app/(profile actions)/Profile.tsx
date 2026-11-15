import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, PanResponder, Pressable, ScrollView, TouchableOpacity, View } from 'react-native';
import { getMediaUrl } from '../../constants/api';
import { colors } from '../../design-system/colors/colors';
import {
  HelpSupport,
  HomeIcon,
  Invite,
  PlusIcon,
  SettingsIcon
} from '../../design-system/icons/filled';
import { Spacing } from '../../design-system/Layout/spacing';
import { ProfileConstants } from '../../design-system/Profile actions/Constants';
import { Typography } from '../../design-system/typography/typography';
import apiClient from '../../utils/api';

interface UserData {
  name?: string | null;
  email: string;
  profilePicture?: string | null;
  homesCount: number;
}

interface ProfilePageProps {
  userData?: UserData;
  visible?: boolean;
  onClose?: () => void;
  onAddDevice?: () => void;
  onMyHomes?: () => void;
  onInviteFamily?: () => void;
  onAccountSettings?: () => void;
  onHelpSupport?: () => void;
}

export default function ProfilePage({
  userData,
  visible = true,
  onClose,
  onAddDevice,
  onMyHomes,
  onInviteFamily,
  onAccountSettings,
  onHelpSupport,
}: ProfilePageProps) {
  // State for loaded user data (when used as a route)
  const [loadedUserData, setLoadedUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(!userData);

  // Load user data when component is used as a route (no userData prop provided)
  useEffect(() => {
    if (!userData) {
      const loadData = async () => {
        try {
          setIsLoading(true);
          
          // Load user data from AsyncStorage
          const userDataString = await AsyncStorage.getItem('userData');
          let userEmail = '';
          let firstName = '';
          let profilePic = '';
          
          if (userDataString) {
            const storedUser = JSON.parse(userDataString);
            userEmail = storedUser.email || '';
            firstName = storedUser.first_name || '';
            profilePic = storedUser.profile_picture || '';
          }

          // Load homes count
          const homesRes = await apiClient.get('home/homes/');
          const homesCount = homesRes.data?.length || 0;

          setLoadedUserData({
            name: firstName || null,
            email: userEmail,
            profilePicture: profilePic ? getMediaUrl(profilePic) : null,
            homesCount: homesCount,
          });
        } catch (error) {
          console.error('Error loading profile data:', error);
          // Set minimal data on error
          setLoadedUserData({
            name: null,
            email: 'Error loading data',
            profilePicture: null,
            homesCount: 0,
          });
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    }
  }, [userData]);

  // Use provided userData or loaded data
  const activeUserData = userData || loadedUserData;

  // Default values when no data is available
  const defaultUserData = {
    name: null,
    email: isLoading ? 'Loading...' : 'No data',
    profilePicture: null,
    homesCount: 0,
  };

  const { name, email, profilePicture, homesCount } = activeUserData || defaultUserData;

  // Swipe to dismiss animation
  const translateX = useRef(new Animated.Value(0)).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes (right direction)
        return gestureState.dx > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow swiping to the right (positive dx)
        if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If swiped more than 100px to the right, close the drawer
        if (gestureState.dx > 100 || gestureState.vx > 0.5) {
          Animated.timing(translateX, {
            toValue: 350,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateX.setValue(0);
            onClose?.();
          });
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Reset position when modal opens
  React.useEffect(() => {
    if (visible) {
      translateX.setValue(0);
    }
  }, [visible]);

  // Dynamic user display logic
  const displayName = name || email;
  const displayEmail = name ? email : null;
  const isNameBold = !!name;

  const handleAddDevice = () => {
    onAddDevice?.();
  };

  const isNavigating = useRef(false);

  const handleNavigationWithModalClose = (path: string) => {
    if (isNavigating.current) return;
    
    isNavigating.current = true;
    onClose?.(); // Close modal
    
    setTimeout(() => {
      router.push(path as any);
    }, 100); // Wait for modal animation
    
    setTimeout(() => {
      isNavigating.current = false;
    }, 600);
  };

  const handleMyHomes = () => {
    handleNavigationWithModalClose('/(profile actions)/myHomes');
  };

  const handleInviteFamily = () => {
    onInviteFamily?.();
  };

  const handleAccountSettings = () => {
    handleNavigationWithModalClose('/(profile actions)/AccountSettings');
  };

  const handleHelpSupport = () => {
    handleNavigationWithModalClose('/(profile actions)/Help&support');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <Pressable 
        style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          justifyContent: 'flex-end',
          alignItems: 'flex-end'
        }}
        onPress={onClose}
      >
        <Animated.View 
          {...panResponder.panHandlers}
          style={{ 
            width: 316,
            height: '100%',
            backgroundColor: colors.surface,
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: -2, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
            transform: [{ translateX }],
          }}
        >
          <ScrollView 
            style={{ flex: 1 }} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View style={{ 
              flex: 1, 
              paddingHorizontal: Spacing.lg, 
              paddingTop: Spacing.xxl + Spacing.lg,
              paddingBottom: Spacing.xxl 
            }}>
              {/* User Profile Header */}
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                marginBottom: Spacing.lg 
              }}>
                <View style={{ marginRight: Spacing.sm }}>
                  {profilePicture ? (
                    <Image 
                      source={{ uri: profilePicture }} 
                      style={{ 
                        width: 50, 
                        height: 50, 
                        borderRadius: 25 
                      }} 
                    />
                  ) : (
                    <View style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: colors.primary.base,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Typography variant="h3" color={colors.surface}>
                        {displayName.charAt(0).toUpperCase()}
                      </Typography>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Typography 
                    variant={isNameBold ? "body" : "accent"} 
                    color={colors.text}
                    style={{ marginBottom: Spacing.xs }}
                  >
                    {displayName}
                  </Typography>
                  {displayEmail && (
                    <Typography 
                      variant="caption" 
                      color={colors.secondaryText}
                      style={{ fontSize: 12 }}
                    >
                      {displayEmail}
                    </Typography>
                  )}
                </View>
              </View>

            {/* Add New Device Button */}
            <View style={{ marginBottom: Spacing.lg }}>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary.base,
                  borderRadius: 12,
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: Spacing.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={handleAddDevice}
                accessibilityLabel={ProfileConstants.addDeviceAccessibilityLabel}
                accessibilityHint={ProfileConstants.addDeviceAccessibilityHint}
              >
                <PlusIcon width={16} height={16} color={colors.text} />
                <Typography
                  variant="accent"
                  color={colors.text}
                  style={{ 
                    fontWeight: 'bold',
                    marginLeft: Spacing.xs
                  }}
                >
                  {ProfileConstants.addNewDevice}
                </Typography>
              </TouchableOpacity>
            </View>

            {/* Navigation Menu Items */}
            <View style={{ marginBottom: Spacing.md }}>
              {/* My Homes */}
              <TouchableOpacity 
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: Spacing.xs,
                  borderRadius: 6,
                }}
                onPress={handleMyHomes}
                accessibilityLabel={ProfileConstants.myHomesAccessibilityLabel}
                accessibilityHint={ProfileConstants.myHomesAccessibilityHint}
              >
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  flex: 1 
                }}>
                  <View style={{
                    marginRight: Spacing.sm,
                    width: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <HomeIcon width={20} height={20} color={colors.text} />
                  </View>
                  <Typography variant="caption" color={colors.text} style={{ flex: 1 }}>
                    {ProfileConstants.myHomes}
                  </Typography>
                </View>
                <View style={{ marginLeft: Spacing.xs }}>
                  <View style={{
                    backgroundColor: colors.primary.base,
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: Spacing.xs,
                  }}>
                    <Typography variant="caption" color={colors.text} style={{ fontWeight: 'bold', fontSize: 12 }}>
                      {homesCount}
                    </Typography>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Invite Family & Friends */}
              <TouchableOpacity 
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: Spacing.xs,
                  borderRadius: 6,
                }}
                onPress={handleInviteFamily}
                accessibilityLabel={ProfileConstants.inviteAccessibilityLabel}
                accessibilityHint={ProfileConstants.inviteAccessibilityHint}
              >
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  flex: 1 
                }}>
                  <View style={{
                    marginRight: Spacing.sm,
                    width: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Invite width={20} height={20} color={colors.text} />
                  </View>
                  <Typography variant="caption" color={colors.text} style={{ flex: 1 }}>
                    {ProfileConstants.inviteFamilyFriends}
                  </Typography>
                </View>
              </TouchableOpacity>
            </View>

            {/* Settings Section */}
            <View>
              <View style={{
                height: 1,
                backgroundColor: colors.border,
                marginVertical: Spacing.sm,
              }} />
              
              {/* Account Settings */}
              <TouchableOpacity 
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: Spacing.xs,
                  borderRadius: 6,
                }}
                onPress={handleAccountSettings}
                accessibilityLabel={ProfileConstants.accountSettingsAccessibilityLabel}
                accessibilityHint={ProfileConstants.accountSettingsAccessibilityHint}
              >
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  flex: 1 
                }}>
                  <View style={{
                    marginRight: Spacing.sm,
                    width: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <SettingsIcon width={20} height={20} color={colors.text} />
                  </View>
                  <Typography variant="caption" color={colors.text} style={{ flex: 1 }}>
                    {ProfileConstants.accountSettings}
                  </Typography>
                </View>
              </TouchableOpacity>

              {/* Help & Support */}
              <TouchableOpacity 
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: Spacing.xs,
                  borderRadius: 6,
                }}
                onPress={handleHelpSupport}
                accessibilityLabel={ProfileConstants.helpSupportAccessibilityLabel}
                accessibilityHint={ProfileConstants.helpSupportAccessibilityHint}
              >
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  flex: 1 
                }}>
                  <View style={{
                    marginRight: Spacing.sm,
                    width: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <HelpSupport width={20} height={20} color={colors.text} />
                  </View>
                  <Typography variant="caption" color={colors.text} style={{ flex: 1 }}>
                    {ProfileConstants.helpSupport}
                  </Typography>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

