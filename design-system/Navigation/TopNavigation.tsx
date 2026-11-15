import React, { useState } from 'react';
import { Image, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeDropdown from '../../components/HomeDropdown';
import { colors } from '../colors/colors';
import { AlertIcon, PlusIcon, UserIcon } from '../icons/filled';
import { Spacing } from '../Layout/spacing';
import { Typography } from '../typography/typography';
import { ACCESSIBILITY, TOP_NAVIGATION } from './Constants';
import { TopNavigationProps } from './Types';

export const TopNavigation: React.FC<TopNavigationProps> = ({
  user,
  homes,
  activeHomeId,
  onHomeSelect,
  onAddHome,
  onAddMember,
  onNotificationPress,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasNotification, setHasNotification] = useState(true);
  const [selectedLabelOverride, setSelectedLabelOverride] = useState<string | null>(null);
  
  const { width } = useWindowDimensions();

  const activeHome = homes.find(home => home.id === activeHomeId);
  const hasHomes = homes.length > 0;

  const toggleDropdown = () => {
    if (hasHomes) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const handleHomeSelect = (homeId: number) => {
    onHomeSelect(homeId);
    setIsDropdownOpen(false);
    setSelectedLabelOverride(null);
  };

  const getWelcomeMessage = () => {
    if (user.first_name) {
      return TOP_NAVIGATION.WELCOME_MESSAGE.WITH_NAME.replace('{firstName}', user.first_name);
    }
    return TOP_NAVIGATION.WELCOME_MESSAGE.DEFAULT;
  };

  // Calculate responsive dropdown width
  const getDropdownWidth = () => {
    if (width > 768) {
      // Tablet/large screen
      return { minWidth: 200, maxWidth: 300 };
    } else if (width > 414) {
      // Large phone
      return { minWidth: 160, maxWidth: 220 };
    } else {
      // Small phone
      return { minWidth: 120, maxWidth: 180 };
    }
  };

  const dropdownWidth = getDropdownWidth();

  return (
    <SafeAreaView style={{ backgroundColor: colors.navBarBackground, zIndex: 1000, elevation: 6 }} edges={['top']}>
      <View style={styles.container}>
          {/* Welcome Message */}
          <View style={styles.leftSection}>
            <Typography variant="h2" color={colors.surface} style={styles.welcomeText}>
              {getWelcomeMessage()}
            </Typography>
            
            {/* Home Selector or Add Home Button */}
            <View style={styles.homeSelectorContainer}>
              <HomeDropdown
                items={homes}
                activeId={activeHomeId}
                onSelect={onHomeSelect}
                onAddHome={onAddHome}
                style={dropdownWidth}
              />
            </View>
          </View>

          {/* Right Section - Notification and User Avatars */}
          <View style={styles.rightSection}>
            {/* Notification Bell */}
            <TouchableOpacity 
              style={styles.notificationButton} 
              onPress={() => {
                onNotificationPress?.();
              }}
              activeOpacity={TOP_NAVIGATION.ANIMATION.ACTIVE_OPACITY}
              accessibilityLabel={ACCESSIBILITY.LABELS.NOTIFICATION}
              accessibilityHint={ACCESSIBILITY.HINTS.NOTIFICATION}
            >
              <View style={styles.notificationIconContainer}>
                <AlertIcon 
                  width={TOP_NAVIGATION.ICON_SIZES.ALERT.width} 
                  height={TOP_NAVIGATION.ICON_SIZES.ALERT.height} 
                  color={colors.secondaryText} 
                />
              </View>
            </TouchableOpacity>

            {/* User Avatars - Positioned below notification */}
            <View style={styles.userAvatarsContainer}>
              {hasHomes ? (
                // Show actual user avatars when homes exist
                <>
                  <View style={styles.userAvatar}>
                    {user.profile_picture ? (
                      <Image source={{ uri: user.profile_picture }} style={styles.avatarImage} />
                    ) : (
                      <UserIcon 
                        width={TOP_NAVIGATION.ICON_SIZES.USER.width} 
                        height={TOP_NAVIGATION.ICON_SIZES.USER.height} 
                        color={colors.secondaryText} 
                      />
                    )}
                  </View>
                  <View style={[styles.userAvatar, styles.secondAvatar]}>
                    <UserIcon 
                      width={TOP_NAVIGATION.ICON_SIZES.USER.width} 
                      height={TOP_NAVIGATION.ICON_SIZES.USER.height} 
                      color={colors.secondaryText} 
                    />
                  </View>
                  <View style={[styles.userAvatar, styles.thirdAvatar]}>
                    <UserIcon 
                      width={TOP_NAVIGATION.ICON_SIZES.USER.width} 
                      height={TOP_NAVIGATION.ICON_SIZES.USER.height} 
                      color={colors.secondaryText} 
                    />
                  </View>
                </>
              ) : (
                // Show generic user icons when no homes
                <>
                  <View style={styles.genericUserIcon}>
                    <UserIcon 
                      width={TOP_NAVIGATION.ICON_SIZES.USER.width} 
                      height={TOP_NAVIGATION.ICON_SIZES.USER.height} 
                      color={colors.secondaryText} 
                    />
                  </View>
                  <View style={[styles.genericUserIcon, styles.secondAvatar]}>
                    <UserIcon 
                      width={TOP_NAVIGATION.ICON_SIZES.USER.width} 
                      height={TOP_NAVIGATION.ICON_SIZES.USER.height} 
                      color={colors.secondaryText} 
                    />
                  </View>
                  <View style={[styles.genericUserIcon, styles.thirdAvatar]}>
                    <UserIcon 
                      width={TOP_NAVIGATION.ICON_SIZES.USER.width} 
                      height={TOP_NAVIGATION.ICON_SIZES.USER.height} 
                      color={colors.secondaryText} 
                    />
                  </View>
                </>
              )}
              
              {/* Add Member Button */}
              <TouchableOpacity 
                style={styles.addMemberButton} 
                onPress={() => {
                  onAddMember?.();
                }}
                accessibilityLabel={ACCESSIBILITY.LABELS.ADD_MEMBER}
                accessibilityHint={ACCESSIBILITY.HINTS.ADD_MEMBER}
              >
                <PlusIcon 
                  width={TOP_NAVIGATION.ICON_SIZES.PLUS.width} 
                  height={TOP_NAVIGATION.ICON_SIZES.PLUS.height} 
                  color={colors.navBarBackground} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
  );
};

const styles = {
  container: {
    backgroundColor: colors.navBarBackground,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    minHeight: TOP_NAVIGATION.DIMENSIONS.MIN_HEIGHT,
    zIndex: 1000,
    elevation: 6,
  },
  leftSection: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  welcomeText: {
    marginBottom: 4,
    fontSize: 20,
    lineHeight: 24,
  },
  homeSelectorContainer: {
    position: 'relative' as const,
    zIndex: 1001,
    marginTop: 8,
  },
  homeSelector: {
    backgroundColor: colors.primary.base,
    borderWidth: TOP_NAVIGATION.STYLING.BORDER_WIDTH,
    borderColor: colors.primary.darkest,
    borderRadius: TOP_NAVIGATION.DIMENSIONS.HOME_SELECTOR.BORDER_RADIUS,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    width: TOP_NAVIGATION.DIMENSIONS.HOME_SELECTOR.MIN_WIDTH,
    height: TOP_NAVIGATION.DIMENSIONS.HOME_SELECTOR.HEIGHT,
  },
  homeTextSmall: {
    marginRight: 4,
    fontSize: 12,
    lineHeight: 16,
  },
  dropdownMenu: {
    position: 'absolute' as const,
    top: TOP_NAVIGATION.DIMENSIONS.DROPDOWN.TOP_OFFSET,
    left: 0,
    width: TOP_NAVIGATION.DIMENSIONS.HOME_SELECTOR.MIN_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: TOP_NAVIGATION.DIMENSIONS.DROPDOWN.BORDER_RADIUS,
    paddingVertical: Spacing.xs,
    shadowColor: colors.text,
    shadowOffset: TOP_NAVIGATION.STYLING.SHADOW.OFFSET,
    shadowOpacity: TOP_NAVIGATION.STYLING.SHADOW.OPACITY,
    shadowRadius: TOP_NAVIGATION.STYLING.SHADOW.RADIUS,
    elevation: 20,
    zIndex: 5000,
    maxHeight: TOP_NAVIGATION.DIMENSIONS.DROPDOWN.MAX_HEIGHT,
  },
  dropdownItem: {
    height: TOP_NAVIGATION.DIMENSIONS.DROPDOWN.ITEM_HEIGHT,
    paddingHorizontal: Spacing.sm,
    justifyContent: 'center' as const,
  },
  activeDropdownItem: {
    backgroundColor: colors.navBarBackground,
    color: colors.surface,
  },
  dropdownItemText: {
    fontWeight: '500' as const,
  },
  addNewHomeItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: Spacing.xs,
    backgroundColor: colors.navBarBackground,
  },
  addNewHomeText: {
    marginLeft: Spacing.xs,
    fontWeight: '500' as const,
    color: colors.primary.base,
  },
  addHomeButton: {
    backgroundColor: colors.primary.base,
    borderWidth: TOP_NAVIGATION.STYLING.BORDER_WIDTH,
    borderColor: colors.primary.darkest,
    borderRadius: TOP_NAVIGATION.DIMENSIONS.HOME_SELECTOR.BORDER_RADIUS,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    minWidth: 80,
    height: 24,
  },
  addHomeText: {
    marginRight: Spacing.xs,
  },
  rightSection: {
    flexDirection: 'column' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'center' as const,
  },
  userAvatarsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: Spacing.xs,
    marginRight: Spacing.xs,
  },
  userAvatar: {
    width: TOP_NAVIGATION.DIMENSIONS.USER_AVATAR.SIZE,
    height: TOP_NAVIGATION.DIMENSIONS.USER_AVATAR.SIZE,
    borderRadius: TOP_NAVIGATION.DIMENSIONS.USER_AVATAR.BORDER_RADIUS,
    backgroundColor: colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: TOP_NAVIGATION.DIMENSIONS.USER_AVATAR.OVERLAP_OFFSET,
  },
  genericUserIcon: {
    width: TOP_NAVIGATION.DIMENSIONS.USER_AVATAR.SIZE,
    height: TOP_NAVIGATION.DIMENSIONS.USER_AVATAR.SIZE,
    borderRadius: TOP_NAVIGATION.DIMENSIONS.USER_AVATAR.BORDER_RADIUS,
    backgroundColor: colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: TOP_NAVIGATION.DIMENSIONS.USER_AVATAR.OVERLAP_OFFSET,
  },
  secondAvatar: {
    zIndex: TOP_NAVIGATION.STYLING.Z_INDEX.SECOND_AVATAR,
  },
  thirdAvatar: {
    zIndex: TOP_NAVIGATION.STYLING.Z_INDEX.THIRD_AVATAR,
  },
  avatarImage: {
    width: TOP_NAVIGATION.DIMENSIONS.USER_AVATAR.SIZE,
    height: TOP_NAVIGATION.DIMENSIONS.USER_AVATAR.SIZE,
    borderRadius: TOP_NAVIGATION.DIMENSIONS.USER_AVATAR.BORDER_RADIUS,
    resizeMode: 'cover' as const,
  },
  addMemberButton: {
    width: TOP_NAVIGATION.DIMENSIONS.ADD_MEMBER.SIZE,
    height: TOP_NAVIGATION.DIMENSIONS.ADD_MEMBER.SIZE,
    borderRadius: TOP_NAVIGATION.DIMENSIONS.ADD_MEMBER.BORDER_RADIUS,
    backgroundColor: colors.primary.base,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: Spacing.xs,
  },
  notificationButton: {
    position: 'relative' as const,
    padding: Spacing.xs,
  },
  notificationIconContainer: {
    width: TOP_NAVIGATION.DIMENSIONS.NOTIFICATION.SIZE,
    height: TOP_NAVIGATION.DIMENSIONS.NOTIFICATION.SIZE,
    borderRadius: TOP_NAVIGATION.DIMENSIONS.NOTIFICATION.BORDER_RADIUS,
    backgroundColor: colors.primary.base,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  notificationDot: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: TOP_NAVIGATION.DIMENSIONS.NOTIFICATION.DOT_SIZE,
    height: TOP_NAVIGATION.DIMENSIONS.NOTIFICATION.DOT_SIZE,
    borderRadius: TOP_NAVIGATION.DIMENSIONS.NOTIFICATION.DOT_BORDER_RADIUS,
    backgroundColor: colors.info,
  },
};