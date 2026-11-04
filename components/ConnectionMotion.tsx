import { colors } from '@/design-system/colors/colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';

/** Radio waves while a connection is pending; unmounting stops the animation. */
export default function ConnectionMotion() {
  const progress = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReduceMotion(value);
    }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { mounted = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    progress.setValue(0);
    if (reduceMotion) return;
    const animation = Animated.loop(Animated.timing(progress, {
      toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true,
    }));
    animation.start();
    return () => animation.stop();
  }, [progress, reduceMotion]);

  return <View style={styles.icon} pointerEvents="none" accessibilityRole="progressbar" accessibilityLabel="Connecting to lock over Bluetooth">
    {!reduceMotion && [0, 1, 2].map(index => {
      const wave = Animated.modulo(Animated.add(progress, index / 3), 1);
      return <Animated.View key={index} style={[styles.wave, {
        opacity: wave.interpolate({ inputRange: [0, 0.12, 0.65, 1], outputRange: [0, 0.6, 0.22, 0] }),
        transform: [{ scale: wave.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.5] }) }],
      }]} />;
    })}
    <Animated.View style={{ transform: [{ scale: reduceMotion ? 1 : progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.93, 1] }) }] }}>
      <Ionicons name="bluetooth" size={52} color={colors.surface} />
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  icon: { width: 64, height: 72, alignItems: 'center', justifyContent: 'center' },
  wave: { position: 'absolute', width: 128, height: 128, left: -32, top: -28, borderRadius: 64, borderWidth: 2, borderColor: colors.primary.base },
});
