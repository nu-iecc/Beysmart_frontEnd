import React, { useState } from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { colors } from '../colors/colors';
import { IconKey, renderIcon } from '../icons';
import { Spacing } from '../Layout/spacing';
import { Typography } from '../typography/typography';
import { ACCESSIBILITY, BOTTOM_NAVIGATION } from './Constants';
import { BottomNavigationProps } from './Types';

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  activeKey,
  profile_picture,
  onTabPress,
}) => {
  const [imageError, setImageError] = useState(false);

  const getIcon = (key: string, isActive: boolean) => {
    const iconColor = colors.navBarBackground;
    
    // Handle profile icon specially for profile pictures
    if (key === 'profile' && profile_picture && !imageError) {
      return (
        <Image 
          source={{ uri: profile_picture }} 
          style={{ 
            width: BOTTOM_NAVIGATION.DIMENSIONS.ICON_CONTAINER.SIZE, 
            height: BOTTOM_NAVIGATION.DIMENSIONS.ICON_CONTAINER.SIZE, 
            borderRadius: BOTTOM_NAVIGATION.DIMENSIONS.ICON_CONTAINER.BORDER_RADIUS,
            resizeMode: 'cover' as const
          }}
          onError={() => {
            setImageError(true)
          }}
        />
      );
    }
    
    // Use dynamic icon rendering for all icons (including profile when no picture)
    if (isValidIconKey(key)) {
      return renderIcon({ 
        key, 
        size: 'large', 
        color: iconColor, 
        isActive 
      });
    }
    
    // Fallback to user icon
    return renderIcon({ 
      key: 'user', 
      size: 'large', 
      color: iconColor, 
      isActive 
    });
  };

  const getTabStyle = (key: string, isActive: boolean) => ({
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.xs,
    paddingTop: BOTTOM_NAVIGATION.SPACING.ICON_CONTAINER.TOP,
  });

  const getIconContainerStyle = (isActive: boolean, isProfile: boolean = false, hasProfilePicture: boolean = false) => ({
    width: BOTTOM_NAVIGATION.DIMENSIONS.ICON_CONTAINER.SIZE,
    height: BOTTOM_NAVIGATION.DIMENSIONS.ICON_CONTAINER.SIZE,
    borderRadius: BOTTOM_NAVIGATION.DIMENSIONS.ICON_CONTAINER.BORDER_RADIUS,
    backgroundColor: (isProfile && hasProfilePicture) ? 'transparent' : (isActive ? colors.primary.base : colors.surface),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: BOTTOM_NAVIGATION.SPACING.ICON_CONTAINER.BOTTOM,
    marginTop: BOTTOM_NAVIGATION.SPACING.ICON_CONTAINER.TOP,
  });

  const getTextStyle = (isActive: boolean) => ({
    color: colors.surface,
    fontWeight: isActive ? BOTTOM_NAVIGATION.STYLING.TEXT.ACTIVE_FONT_WEIGHT : BOTTOM_NAVIGATION.STYLING.TEXT.INACTIVE_FONT_WEIGHT,
    opacity: isActive ? BOTTOM_NAVIGATION.STYLING.TEXT.ACTIVE_OPACITY : BOTTOM_NAVIGATION.STYLING.TEXT.INACTIVE_OPACITY,
  });

  // Helper function to validate icon keys
  const isValidIconKey = (key: string): key is IconKey => {
    return ['home', 'devices', 'energy', 'profile'].includes(key);
  };

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const isActive = item.key === activeKey;
        
        return (
          <TouchableOpacity
            key={item.key}
            style={getTabStyle(item.key, isActive)}
            onPress={() => onTabPress(item.key)}
            activeOpacity={BOTTOM_NAVIGATION.STYLING.ACTIVE_OPACITY}
            accessibilityLabel={`${ACCESSIBILITY.LABELS.TAB_ITEM} ${item.label}`}
            accessibilityHint={ACCESSIBILITY.HINTS.TAB_ITEM}
          >
            <View style={getIconContainerStyle(isActive, item.key === 'profile', !!(profile_picture && !imageError))}>
              {getIcon(item.key, isActive)}
            </View>
            <Typography 
              variant="caption" 
              style={getTextStyle(isActive)}
            >
              {item.label}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = {
  container: {
    backgroundColor: colors.navBarBackground,
    flexDirection: 'row' as const,
    width: '100%' as const,
    height: BOTTOM_NAVIGATION.DIMENSIONS.CONTAINER_HEIGHT,
    paddingTop: BOTTOM_NAVIGATION.SPACING.CONTAINER.TOP,
    paddingRight: BOTTOM_NAVIGATION.SPACING.CONTAINER.RIGHT,
    paddingBottom: BOTTOM_NAVIGATION.SPACING.CONTAINER.BOTTOM,
    paddingLeft: BOTTOM_NAVIGATION.SPACING.CONTAINER.LEFT,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
};

