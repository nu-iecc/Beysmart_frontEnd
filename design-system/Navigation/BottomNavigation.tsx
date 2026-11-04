import React, { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../colors/colors';
import { IconKey, renderIcon } from '../icons';
import { Typography } from '../typography/typography';
import { ACCESSIBILITY, BOTTOM_NAVIGATION } from './Constants';
import { BottomNavigationProps } from './Types';

const { DIMENSIONS, SPACING, STYLING } = BOTTOM_NAVIGATION;

// Helper function to validate icon keys
const isValidIconKey = (key: string): key is IconKey => ['home', 'devices', 'energy', 'profile'].includes(key);

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  activeKey,
  profile_picture,
  onTabPress,
}) => {
  const [imageError, setImageError] = useState(false);
  const insets = useSafeAreaInsets();
  const hasPicture = !!profile_picture && !imageError;

  const getIcon = (key: string, isActive: boolean) => {
    // Profile picture replaces the profile icon, ringed in lime when active
    if (key === 'profile' && hasPicture) {
      return <Image
        source={{ uri: profile_picture }}
        style={[styles.avatar, isActive && styles.avatarActive]}
        onError={() => setImageError(true)}
      />;
    }
    return renderIcon({
      key: isValidIconKey(key) ? key : 'user',
      size: 'large',
      color: isActive ? colors.primary.base : colors.notactiveicon,
      isActive,
    });
  };

  return (
    <View style={[styles.container, { height: DIMENSIONS.CONTAINER_HEIGHT + insets.bottom, paddingBottom: SPACING.CONTAINER.BOTTOM + insets.bottom }]}>
      {items.map((item) => {
        const isActive = item.key === activeKey;

        return (
          <TouchableOpacity
            key={item.key}
            style={styles.tab}
            onPress={() => onTabPress(item.key)}
            activeOpacity={STYLING.ACTIVE_OPACITY}
            accessibilityLabel={`${ACCESSIBILITY.LABELS.TAB_ITEM} ${item.label}`}
            accessibilityHint={ACCESSIBILITY.HINTS.TAB_ITEM}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <View style={[styles.indicator, isActive && styles.indicatorActive]} />
            <View style={styles.iconWrap}>
              {getIcon(item.key, isActive)}
            </View>
            <Typography
              variant="caption"
              numberOfLines={1}
              color={isActive ? colors.surface : colors.notactiveicon}
              style={[styles.label, { fontWeight: isActive ? STYLING.TEXT.ACTIVE_FONT_WEIGHT : STYLING.TEXT.INACTIVE_FONT_WEIGHT }]}
            >
              {item.label}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.navBarBackground,
    flexDirection: 'row',
    width: '100%',
    paddingTop: SPACING.CONTAINER.TOP,
    paddingHorizontal: SPACING.CONTAINER.HORIZONTAL,
    borderTopLeftRadius: DIMENSIONS.TOP_RADIUS,
    borderTopRightRadius: DIMENSIONS.TOP_RADIUS,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  indicator: {
    width: DIMENSIONS.INDICATOR.WIDTH,
    height: DIMENSIONS.INDICATOR.HEIGHT,
    borderBottomLeftRadius: DIMENSIONS.INDICATOR.HEIGHT,
    borderBottomRightRadius: DIMENSIONS.INDICATOR.HEIGHT,
    marginBottom: SPACING.ICON_TOP,
  },
  indicatorActive: { backgroundColor: colors.primary.base },
  iconWrap: { height: DIMENSIONS.ICON_BOX, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: DIMENSIONS.AVATAR.SIZE,
    height: DIMENSIONS.AVATAR.SIZE,
    borderRadius: DIMENSIONS.AVATAR.SIZE / 2,
    resizeMode: 'cover',
  },
  avatarActive: {
    width: DIMENSIONS.AVATAR.SIZE + DIMENSIONS.AVATAR.RING * 2,
    height: DIMENSIONS.AVATAR.SIZE + DIMENSIONS.AVATAR.RING * 2,
    borderRadius: (DIMENSIONS.AVATAR.SIZE + DIMENSIONS.AVATAR.RING * 2) / 2,
    borderWidth: DIMENSIONS.AVATAR.RING,
    borderColor: colors.primary.base,
  },
  label: { marginTop: SPACING.LABEL_TOP },
});
