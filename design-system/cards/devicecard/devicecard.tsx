import React from 'react';
import { Switch, View } from 'react-native';
import { colors } from '../../colors/colors';
import * as Icons from '../../icons';
import { Typography } from '../../typography/typography';

interface DeviceCardProps {
  title: string;
  status: string;
  statusColor?: string;
  power: string;
  iconName: string;
  iconColor?: string;
  switchValue: boolean;
  onSwitchChange: (value: boolean) => void;
  backgroundColor?: string;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  title,
  status,
  statusColor = colors.primary.base,
  power,
  iconName,
  iconColor = colors.primary.base,
  switchValue,
  onSwitchChange,
  backgroundColor = '#353C4A',
}) => {
  const IconComponent = (Icons as any)[iconName];

  return (
    <View
      style={{
        backgroundColor,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'column',
        minWidth: 260,
        minHeight: 120,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h3" color={colors.surface}>
          {title}
        </Typography>
        {IconComponent && (
          <IconComponent width={24} height={24} color={iconColor} />
        )}
      </View>
      <Typography variant="body" color={statusColor} style={{ marginTop: 4, marginBottom: 8 }}>
        {status}
      </Typography>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body" color={colors.surface}>
          Power: {power}
        </Typography>
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#6E6E6E', true: colors.primary.base }}
          thumbColor={switchValue ? colors.primary.base : '#D1D1D1'}
        />
      </View>
    </View>
  );
}; 