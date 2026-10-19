import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, View } from 'react-native';

import { LOGIN_STRINGS } from '../../constants/Login';
import { AppButton, colors, Spacing, Typography } from '../../design-system';
import apiClient from '../../utils/api';

export default function WelcomeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await AsyncStorage.getItem('isAuthenticated');
        
        if (isAuthenticated === 'true') {
          console.log('🔐 Auth index: Found authentication flag, validating session...');
          
          try {
            // Validate the session is still valid
            const response = await apiClient.get('user/profile/');
            
            if (response.status === 200) {
              console.log('✅ Auth index: Session is valid, navigating to home');
              // Session is valid, go to home
              router.replace('/(app)/home');
              return;
            }
          } catch (error: any) {
            // Session is invalid or expired
            console.log('❌ Auth index: Session validation failed:', error.response?.status);
            console.log('🔒 Clearing authentication data');
            
            // Clear all auth-related data
            await AsyncStorage.multiRemove([
              'userData',
              'csrftoken',
              'isAuthenticated',
              'loginMethod',
            ]);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Show loading indicator while checking auth
  if (isLoading) {
    return (
      <ImageBackground
        source={require('../../assets/images/Vector.png')}
        resizeMode="cover"
        style={styles.background}
      >
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary.base} />
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/Vector.png')}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.content}>
        <View style={styles.brandBlock}>
          <Typography variant="h1" color={colors.primary.base} style={styles.brandTitle}>
            {LOGIN_STRINGS.welcome.brandTitle}
          </Typography>
          <Typography variant="body" color={colors.surface} style={{ opacity: 0.9 }}>
            {LOGIN_STRINGS.welcome.tagline}
          </Typography>
        </View>

        <View style={styles.actions}>
          <AppButton
            variant="primaryLarge"
            title={LOGIN_STRINGS.welcome.actions.login}
            onPress={() => router.push('./loginpage')}
          />
          <View style={{ height: Spacing.sm }} />
          <AppButton
            variant="secondaryLarge"
            title={LOGIN_STRINGS.welcome.actions.createAccount}
            onPress={() => router.push('./register')}
          />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#374151',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  brandBlock: {
    marginTop: Spacing.xl,
  },
  brandTitle: {
    fontFamily: 'Qebram',
  },
  actions: {
    marginBottom: Spacing.xl,
  },
});

