import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { colors } from '../../colors/colors';
import { Spacing } from '../../Layout/spacing';
import { Typography } from '../../typography/typography';

interface SceneCardProps {
  title: string;
  icons: React.ReactNode[];
  onPressButton: () => void;
  buttonText?: string;
  gradientColors?: string[];
  backgroundColor?: string;
  titleColor?: string;
  buttonTextColor?: string;
  iconColor?: string;
  cardStyle?: object;
}

const SceneCard: React.FC<SceneCardProps> = ({
  title,
  icons,
  onPressButton,
  buttonText = 'Activate',
  gradientColors,
  backgroundColor = colors.text,
  titleColor = colors.surface,
  buttonTextColor = colors.secondary.base,
  iconColor = colors.primary.base,
  cardStyle = {},
}) => {
  return (
    <>
      {gradientColors ? (
        <LinearGradient 
          colors={gradientColors as [string, string, ...string[]]} 
          style={[{
            backgroundColor: colors.text,
            borderRadius: 16,
            padding: Spacing.sm,
            flexDirection: 'column',
            minWidth: 280,
            minHeight: 100,
            justifyContent: 'space-between',
            shadowColor: colors.text,
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
          }, cardStyle]}
        >
          <Typography 
            variant="accent" 
            color={titleColor}
            style={{ marginBottom: Spacing.xs }}
          >
            {title}
          </Typography>

          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: Spacing.sm,
          }}>
            <View style={{
              flexDirection: 'row',
              gap: Spacing.xs,
            }}>
              {icons.map((icon, idx) => {
                const finalIconColor = (icon as any).props?.color || iconColor;
                return (
                  <View key={idx} style={{
                    backgroundColor: colors.text,
                    borderRadius: 100,
                    width: 32,
                    height: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {React.cloneElement(icon as React.ReactElement<any>, { 
                      color: finalIconColor,
                      key: `icon-${idx}`
                    })}
                  </View>
                );
              })}
            </View>

            <TouchableOpacity 
              onPress={onPressButton} 
              style={{
                backgroundColor: colors.surface,
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: 16,
                alignSelf: 'flex-start',
              }}
            >
              <Typography 
                variant="caption" 
                color={buttonTextColor}
                style={{ fontWeight: '600' }}
              >
                {buttonText}
              </Typography>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      ) : (
        <View style={[{
          backgroundColor: backgroundColor,
          borderRadius: 16,
          padding: Spacing.sm,
          flexDirection: 'column',
          minWidth: 280,
          minHeight: 100,
          justifyContent: 'space-between',
          shadowColor: colors.text,
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
        }, cardStyle]}>
          <Typography 
            variant="accent" 
            color={titleColor}
            style={{ marginBottom: Spacing.xs }}
          >
            {title}
          </Typography>

          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: Spacing.sm,
          }}>
            <View style={{
              flexDirection: 'row',
              gap: Spacing.xs,
            }}>
              {icons.map((icon, idx) => {
                const finalIconColor = (icon as any).props?.color || iconColor;
                return (
                  <View key={idx} style={{
                    backgroundColor: colors.text,
                    borderRadius: 100,
                    width: 32,
                    height: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {React.cloneElement(icon as React.ReactElement<any>, { 
                      color: finalIconColor,
                      key: `icon-${idx}`
                    })}
                  </View>
                );
              })}
            </View>

            <TouchableOpacity 
              onPress={onPressButton} 
              style={{
                backgroundColor: colors.surface,
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: 16,
                alignSelf: 'flex-start',
              }}
            >
              <Typography 
                variant="caption" 
                color={buttonTextColor}
                style={{ fontWeight: '600' }}
              >
                {buttonText}
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
};

export default SceneCard;
