import { Typography } from '@/design-system';
import { colors } from '@/design-system/colors/colors';
import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info';

const ICONS = {
  success: { name: 'checkmark-circle', color: colors.primary.base },
  error: { name: 'alert-circle', color: colors.error },
  info: { name: 'time', color: colors.secondary.lightest },
} as const;
interface ToastState { id: number; type: ToastType; text: string }

const ToastContext = createContext<(type: ToastType, text: string) => void>(() => {});

export const useToast = () => useContext(ToastContext);

const DURATION = 3500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const show = useCallback((type: ToastType, text: string) => setToast({ id: Date.now(), type, text }), []);

  const hide = useCallback(() => {
    Animated.timing(progress, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => { if (finished) setToast(null); });
  }, [progress]);

  useEffect(() => {
    if (!toast) return;
    progress.stopAnimation();
    progress.setValue(0);
    Animated.spring(progress, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
    const timer = setTimeout(hide, DURATION);
    return () => clearTimeout(timer);
  }, [toast, progress, hide]);

  const icon = ICONS[toast?.type ?? 'success'];

  return <ToastContext.Provider value={show}>
    {children}
    {toast && <Animated.View pointerEvents="box-none" style={[styles.container, { top: insets.top + 12 }, {
      opacity: progress,
      transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
    }]}>
      <TouchableOpacity style={styles.toast} activeOpacity={0.9} onPress={hide} accessibilityRole="alert">
        <Ionicons name={icon.name} size={22} color={icon.color} />
        <Typography variant="caption" color={colors.surface} style={styles.text}>{toast.text}</Typography>
      </TouchableOpacity>
    </Animated.View>}
  </ToastContext.Provider>;
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', maxWidth: 480, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, backgroundColor: colors.navBarBackground, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  text: { flex: 1 },
});
