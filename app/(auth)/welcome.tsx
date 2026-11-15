import { useRouter } from 'expo-router';
import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

import { LOGIN_STRINGS } from '@/constants/Login';
import { AppButton, colors, Spacing, Typography } from '@/design-system';
import { scale, scaleFont } from '@/utils/responsive';

export default function WelcomeScreen() {
  const router = useRouter();

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
            onPress={() => { router.push('./loginpage') }}
          />
          <View style={{ height: Spacing.sm }} />
          <AppButton
            variant="secondaryLarge"
            title={LOGIN_STRINGS.welcome.actions.createAccount}
            onPress={() => { router.push('./register') }}
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
    padding: scale(Spacing.lg),
  },
  brandBlock: {
    marginTop: scale(Spacing.xl),
  },
  brandTitle: {
    fontFamily: 'Qebram',
    fontSize: scaleFont(40), // Responsive font size for brand title
  },
  actions: {
    marginBottom: scale(Spacing.xl),
  },
});

