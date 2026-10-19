import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, View } from 'react-native';

import { LOGIN_STRINGS } from '@/constants/Login';
import { AppButton, colors, Spacing, Typography } from '@/design-system';
import apiClient from '@/utils/api';

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user was previously authenticated
        const isAuthenticated = await AsyncStorage.getItem('isAuthenticated');
        
        if (isAuthenticated === 'true') {
          console.log('🔐 Found authentication flag, validating session with backend...');
          
          try {
            // Validate the session is still valid by making an authenticated request
            const response = await apiClient.get('user/profile/');
            
            if (response.status === 200) {
              console.log('✅ Session is valid, navigating to home');
              // Session is valid, go to home
              router.replace('/(app)/home');
              return;
            }
          } catch (error: any) {
            // Session is invalid or expired
            console.log('❌ Session validation failed:', error.response?.status);
            console.log('🔒 Clearing authentication data and showing login');
            
            // Clear all auth-related data
            await AsyncStorage.multiRemove([
              'userData',
              'csrftoken',
              'isAuthenticated',
              'loginMethod',
            ]);
          }
        } else {
          console.log('ℹ️ No authentication flag found, showing welcome screen');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Show loading indicator while checking auth
  if (isLoading) {
    return (
      <ImageBackground
        source={require('../assets/images/Vector.png')}
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
      source={require('../assets/images/Vector.png')}
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
            onPress={() => router.push('/(auth)/loginpage')}
          />
          <View style={{ height: Spacing.sm }} />
          <AppButton
            variant="secondaryLarge"
            title={LOGIN_STRINGS.welcome.actions.createAccount}
            onPress={() => { 
              console.log('Create Account button pressed');
              router.push('/(auth)/register');
            }}
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
