import React, { useState } from 'react';
import { View } from 'react-native';
import { colors } from '../colors/colors';
import { Typography } from '../typography/typography';
import { DeviceListItem } from './DeviceListItem';

interface Device {
  id: string;
  title: string;
  type: string;
  iconName: string;
  iconBackgroundColor?: string;
  iconColor?: string;
  initialState?: boolean;
}

interface DeviceListProps {
  title?: string;
  devices?: Device[];
}

export const DeviceList: React.FC<DeviceListProps> = ({
  title,
  devices = [],
}) => {
  const [deviceStates, setDeviceStates] = useState<Record<string, boolean>>(
    devices.reduce((acc, device) => ({
      ...acc,
      [device.id]: device.initialState ?? false,
    }), {})
  );

  const handleToggle = (deviceId: string, value: boolean) => {
    setDeviceStates(prev => ({
      ...prev,
      [deviceId]: value,
    }));
  };

  return (
    <View style={{ width: '100%' }}>
      {title && (
        <Typography 
          variant="h2" 
          color={colors.text} 
          style={{ marginBottom: 20, marginLeft: 4 }}
        >
          {title}
        </Typography>
      )}
      
      <View>
        {devices.map((device) => (
          <DeviceListItem
            key={device.id}
            title={device.title}
            type={device.type}
            iconName={device.iconName}
            iconBackgroundColor={device.iconBackgroundColor}
            iconColor={device.iconColor}
            isOn={deviceStates[device.id]}
            onToggle={(value) => handleToggle(device.id, value)}
          />
        ))}
      </View>
    </View>
  );
}; 