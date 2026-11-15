import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface NotificationBoxProps {
  type: 'success' | 'information' | 'error';
  title: string;
  description: string;
  onClose?: () => void;
  visible?: boolean;
  // Color customization
  backgroundColor?: string;
  iconColor?: string;
  iconBackgroundColor?: string;
  textColor?: string;
  // Icon customization
  iconSymbol?: string;
  // Style customization
  containerStyle?: object;
  iconContainerStyle?: object;
  titleStyle?: object;
  descriptionStyle?: object;
  // Size customization
  padding?: number;
  borderRadius?: number;
  minHeight?: number;
  iconSize?: number;
  titleFontSize?: number;
  descriptionFontSize?: number;
}

const NotificationBox: React.FC<NotificationBoxProps> = ({
  type,
  title,
  description,
  onClose,
  visible = true,
  // Color props
  backgroundColor: customBackgroundColor,
  iconColor: customIconColor,
  iconBackgroundColor: customIconBackgroundColor,
  textColor: customTextColor,
  // Icon props
  iconSymbol: customIconSymbol,
  // Style props
  containerStyle,
  iconContainerStyle,
  titleStyle,
  descriptionStyle,
  // Size props
  padding = 16,
  borderRadius = 12,
  minHeight = 72,
  iconSize = 16,
  titleFontSize = 16,
  descriptionFontSize = 14,
}) => {
  if (!visible) return null;

  const getNotificationConfig = () => {
    const defaultConfigs = {
      success: {
        backgroundColor: '#CFFF5E',
        iconColor: '#FFFFFF',
        iconBackgroundColor: '#4ADE80',
        textColor: '#1A1A1A',
        iconSymbol: '✓',
      },
      information: {
        backgroundColor: '#C7BFFF',
        iconColor: '#FFFFFF',
        iconBackgroundColor: '#8B5CF6',
        textColor: '#1A1A1A',
        iconSymbol: 'i',
      },
      error: {
        backgroundColor: '#FFB3B3',
        iconColor: '#FFFFFF',
        iconBackgroundColor: '#EF4444',
        textColor: '#1A1A1A',
        iconSymbol: '!',
      },
    };

    const defaultConfig = defaultConfigs[type] || defaultConfigs.information;

    return {
      backgroundColor: customBackgroundColor || defaultConfig.backgroundColor,
      iconColor: customIconColor || defaultConfig.iconColor,
      iconBackgroundColor: customIconBackgroundColor || defaultConfig.iconBackgroundColor,
      textColor: customTextColor || defaultConfig.textColor,
      iconSymbol: customIconSymbol || defaultConfig.iconSymbol,
    };
  };

  const config = getNotificationConfig();
  const { backgroundColor, iconColor, iconBackgroundColor, textColor, iconSymbol } = config;

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor,
        padding,
        borderRadius,
        minHeight
      },
      containerStyle
    ]}>
      <View style={[
        styles.iconContainer, 
        { backgroundColor: iconBackgroundColor },
        iconContainerStyle
      ]}>
        <Text style={[
          styles.iconText, 
          { 
            color: iconColor,
            fontSize: iconSize,
            lineHeight: iconSize
          }
        ]}>
          {iconSymbol}
        </Text>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={[
          styles.title, 
          { 
            color: textColor,
            fontSize: titleFontSize
          },
          titleStyle
        ]}>
          {title}
        </Text>
        <Text style={[
          styles.description, 
          { 
            color: textColor,
            fontSize: descriptionFontSize
          },
          descriptionStyle
        ]}>
          {description}
        </Text>
      </View>
      
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={[styles.closeIcon, { color: textColor }]}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    // padding, borderRadius, minHeight are now dynamic
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor is now dynamic
  },
  iconText: {
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    // fontSize, lineHeight, color are now dynamic
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    marginBottom: 2,
    // fontSize, color are now dynamic
  },
  description: {
    fontWeight: '400',
    opacity: 0.8,
    // fontSize, color are now dynamic
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  closeIcon: {
    fontSize: 24,
    fontWeight: '300',
    // color is dynamic via inline style
  },
});

export default NotificationBox; 