import { colors } from '@/design-system/colors/colors';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RADIUS = 86;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface LockMotionProps {
  locked: boolean | null;
  active: boolean;
  action: 'lock' | 'unlock' | null;
  holding: boolean;
  holdProgress: Animated.Value;
}

/** Motion follows the operation; only a confirmed position opens/closes the shackle. */
export default function LockMotion({ locked, active, action, holding, holdProgress }: LockMotionProps) {
  const [reduceMotion, setReduceMotion] = useState(true);
  const open = useRef(new Animated.Value(locked === false ? 1 : 0)).current;
  const turn = useRef(new Animated.Value(0)).current;
  const mechanism = useRef(new Animated.Value(0)).current;
  const settled = useRef(new Animated.Value(0)).current;
  const previousLocked = useRef(locked);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReduceMotion(value);
    }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { mounted = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    const previous = previousLocked.current;
    previousLocked.current = locked;
    open.stopAnimation();
    settled.stopAnimation();
    settled.setValue(0);
    if (locked === null || reduceMotion) {
      open.setValue(locked === false ? 1 : 0);
      return;
    }

    const animations: Animated.CompositeAnimation[] = [Animated.spring(open, {
      toValue: locked ? 0 : 1,
      speed: 16,
      bounciness: 5,
      useNativeDriver: true,
    })];
    if (previous !== null && previous !== locked) {
      animations.push(Animated.timing(settled, {
        toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }));
    }
    const animation = Animated.parallel(animations);
    animation.start();
    return () => animation.stop();
  }, [locked, reduceMotion, open, settled]);

  useEffect(() => {
    turn.setValue(0);
    mechanism.setValue(0);
    if (!active || reduceMotion) return;

    const animation = Animated.parallel([
      Animated.loop(Animated.timing(turn, {
        toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true,
      })),
      Animated.loop(Animated.sequence([
        Animated.timing(mechanism, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(mechanism, { toValue: 0, duration: 420, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])),
    ]);
    animation.start();
    return () => {
      animation.stop();
      turn.setValue(0);
      mechanism.setValue(0);
    };
  }, [active, action, reduceMotion, turn, mechanism]);

  const direction = action === 'lock' ? 1 : -1;
  return <View pointerEvents="none" style={styles.icon} accessibilityRole="image" accessibilityLabel={active ? action === 'lock' ? 'Locking' : 'Unlocking' : locked === null ? 'Reading lock state' : locked ? 'Locked' : 'Unlocked'}>
    {holding && <View style={styles.orbit}>
      <Svg width={184} height={184}>
        <AnimatedCircle cx={92} cy={92} r={RADIUS} fill="none" stroke={colors.primary.base} strokeWidth={4}
          strokeLinecap="round" strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={holdProgress.interpolate({ inputRange: [0, 1], outputRange: [CIRCUMFERENCE, 0] })}
          rotation={-90} origin="92, 92" />
      </Svg>
    </View>}
    {active && !reduceMotion && <Animated.View style={[styles.orbit, {
      transform: [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${direction * 360}deg`] }) }],
    }]}>
      <Svg width={184} height={184}>
        <Circle cx={92} cy={92} r={RADIUS} fill="none" stroke="rgba(207,255,94,0.18)" strokeWidth={3} />
        <Circle cx={92} cy={92} r={RADIUS} fill="none" stroke={colors.primary.base} strokeWidth={4}
          strokeLinecap="round" strokeDasharray="110 431" />
      </Svg>
    </Animated.View>}
    {!reduceMotion && <Animated.View style={[styles.confirmation, {
      opacity: settled.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.75, 0] }),
      transform: [{ scale: settled.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.35] }) }],
    }]} />}
    <Animated.View style={[styles.glyph, {
      opacity: locked === null ? 0.5 : 1,
      transform: [
        { rotate: mechanism.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', `${direction * 7}deg`, '0deg'] }) },
        { scale: mechanism.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95] }) },
      ],
    }]}>
      <Animated.View style={[styles.shackle, {
        transform: [
          { translateX: open.interpolate({ inputRange: [0, 1], outputRange: [0, 5] }) },
          { translateY: open.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) },
          { rotate: open.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-28deg'] }) },
        ],
      }]}>
        <Svg width={40} height={40} viewBox="0 0 40 40"><Path d="M7 35V19a13 13 0 0 1 26 0v16" stroke={colors.text} strokeWidth={6} strokeLinecap="round" fill="none" /></Svg>
      </Animated.View>
      <Svg width={64} height={72} viewBox="0 0 64 72">
        <Rect x={7} y={30} width={50} height={36} rx={8} fill={colors.text} />
        <Circle cx={32} cy={46} r={3.5} fill={colors.primary.base} />
        <Path d="M32 48v6" stroke={colors.primary.base} strokeWidth={3} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  icon: { width: 64, height: 72, alignItems: 'center', justifyContent: 'center' },
  glyph: { width: 64, height: 72 },
  shackle: { position: 'absolute', top: 0, left: 12 },
  orbit: { position: 'absolute', width: 184, height: 184, left: -60, top: -56 },
  confirmation: { position: 'absolute', width: 168, height: 168, left: -52, top: -48, borderRadius: 84, borderWidth: 2, borderColor: colors.primary.base },
});
