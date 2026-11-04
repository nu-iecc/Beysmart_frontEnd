import PageHeader from '@/components/PageHeader';
import ProfileSection from '@/components/ProfileSection';
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
 <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
  <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'flex-end' }} onPress={onClose}>
   <Animated.View {...panResponder.panHandlers} style={{ width: 316, height: '100%', backgroundColor: '#F3F5F8', transform: [{ translateX }], borderTopLeftRadius: 24, borderBottomLeftRadius: 24, overflow: 'hidden' }}>
    <PageHeader title="Profile" onBack={onClose} />
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
     <ProfileSection name={name} email={email} profilePicture={profilePicture} homesCount={homesCount}
       onAddDevice={handleAddDevice} onMyHomes={handleMyHomes} onInviteFamily={handleInviteFamily}
       onAccountSettings={handleAccountSettings} onHelpSupport={handleHelpSupport} />
    </ScrollView>
   </Animated.View>
  </Pressable>
 </Modal>
);
}

