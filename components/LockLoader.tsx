import { Typography } from '@/design-system';
import { colors } from '@/design-system/colors/colors';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';

type Tone = 'light' | 'dark' | 'lime';

interface LockLoaderProps {
  /** Width of the smart lock in px; it is about twice as tall. */
  size?: number;
  /** Background the loader sits on, so the lock stays visible. */
  tone?: Tone;
  label?: string;
  style?: ViewStyle;
}

const TONES: Record<Tone, { panel: string; edge: string; label: string }> = {
  light: { panel: colors.navBarBackground, edge: 'transparent', label: colors.secondaryText },
  dark: { panel: '#1F2937', edge: 'rgba(255,255,255,0.16)', label: '#CBD5E1' },
  lime: { panel: colors.text, edge: 'transparent', label: colors.text },
};

const GREEN = colors.primary.base;
const DOTS = Array.from({ length: 9 }, (_, i) => i);

/** A Beylock smart lock unlocking on a loop: keypad lights up, the strip fills green, the thumb-turn rotates open. */
export default function LockLoader({ size = 44, tone = 'light', label, style }: LockLoaderProps) {
  const scan = useRef(new Animated.Value(0)).current;
  const open = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const to = (value: Animated.Value, toValue: number, duration: number, easing = Easing.inOut(Easing.cubic)) =>
      Animated.timing(value, { toValue, duration, easing, useNativeDriver: false });

    const loop = Animated.loop(Animated.sequence([
      Animated.delay(200),
      to(scan, 1, 900, Easing.linear),
      Animated.parallel([
        to(open, 1, 380, Easing.out(Easing.back(1.6))),
        Animated.sequence([to(glow, 1, 650, Easing.out(Easing.quad)), to(glow, 0, 0)]),
      ]),
      Animated.delay(500),
      Animated.parallel([to(open, 0, 320), to(scan, 0, 320)]),
    ]));
    loop.start();
    return () => loop.stop();
  }, [scan, open, glow]);

  const palette = TONES[tone];
  const panelH = size * 2;
  const reader = size * 0.72;
  const readerTop = size * 0.14;
  const dot = size * 0.09;

  return <View style={[styles.wrap, style]} accessibilityRole="progressbar" accessibilityLabel={label || 'Loading'}>
    <View style={[styles.panel, {
      width: size, height: panelH, backgroundColor: palette.panel, borderColor: palette.edge,
      borderTopLeftRadius: size / 2, borderTopRightRadius: size / 2, borderBottomLeftRadius: size * 0.2, borderBottomRightRadius: size * 0.2,
    }]}>
      {/* Reader with the thumb-turn */}
      <View style={{ marginTop: readerTop, width: reader, height: reader, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View pointerEvents="none" style={[styles.fill, {
          borderRadius: reader, borderWidth: 2, borderColor: GREEN,
          opacity: glow.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.8, 0] }),
          transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }],
        }]} />
        <Animated.View style={[styles.fill, {
          borderRadius: reader, borderWidth: size * 0.05,
          borderColor: scan.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.18)', GREEN] }),
          backgroundColor: open.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.08)', GREEN] }),
        }]} />
        <Animated.View style={{
          width: size * 0.14, height: reader * 0.62, borderRadius: size,
          backgroundColor: open.interpolate({ inputRange: [0, 1], outputRange: ['#E5E7EB', colors.navBarBackground] }),
          transform: [{ rotate: open.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) }],
        }} />
      </View>

      {/* Keypad that lights up as the code is entered */}
      <View style={{ width: dot * 3 + size * 0.1 * 2, flexDirection: 'row', flexWrap: 'wrap', gap: size * 0.1, marginTop: size * 0.2 }}>
        {DOTS.map(i => <Animated.View key={i} style={{
          width: dot, height: dot, borderRadius: dot,
          backgroundColor: scan.interpolate({ inputRange: [0, (i + 0.5) / 9, (i + 1) / 9, 1], outputRange: ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.22)', GREEN, GREEN] }),
        }} />)}
      </View>

      {/* Status strip that fills green */}
      <View style={[styles.strip, { width: size * 0.5, height: size * 0.07, borderRadius: size, bottom: size * 0.16 }]}>
        <Animated.View style={{
          height: '100%', borderRadius: size, backgroundColor: GREEN,
          width: scan.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }} />
      </View>
    </View>
    {!!label && <Typography variant="caption" color={palette.label} style={styles.label}>{label}</Typography>}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  panel: { alignItems: 'center', borderWidth: 1 },
  fill: { ...StyleSheet.absoluteFillObject },
  strip: { position: 'absolute', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.18)' },
  label: { marginTop: 12 },
});
