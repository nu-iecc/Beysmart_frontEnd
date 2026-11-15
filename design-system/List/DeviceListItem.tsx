import React from 'react';
import { Switch, View } from 'react-native';
import { colors } from '../colors/colors';
import * as Icons from '../icons';
import { Typography } from '../typography/typography';

interface DeviceListItemProps {
  title: string;
  type: string;
  iconName: string;
  iconBackgroundColor?: string;
  iconColor?: string;
  isOn: boolean;
  onToggle: (value: boolean) => void;
}

export const DeviceListItem: React.FC<DeviceListItemProps> = ({
  title,
  type,
  iconName,
  iconBackgroundColor = colors.primary.base,
  iconColor = colors.surface,
  isOn,
  onToggle,
}) => {
  const IconComponent = (Icons as any)[iconName];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      {/* Icon Container */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: iconBackgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        }}
      >
        {IconComponent && (
          <IconComponent width={24} height={24} color={iconColor} />
        )}
      </View>

      {/* Device Info */}
      <View style={{ flex: 1 }}>
        <Typography variant="h3" color={colors.text} style={{ marginBottom: 2 }}>
          {title}
        </Typography>
        <Typography variant="caption" color={colors.secondaryText}>
          {type}
        </Typography>
      </View>

      {/* Toggle Switch */}
      <Switch
        value={isOn}
        onValueChange={onToggle}
        trackColor={{ 
          false: colors.disabled, 
          true: colors.primary.base 
        }}
        thumbColor={isOn ? colors.surface : colors.surface}
        style={{
          transform: [{ scale: 1.1 }],
        }}
      />
    </View>
  );
}; 