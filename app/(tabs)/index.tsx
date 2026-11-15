import { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { DeviceCard } from '../../design-system/cards/devicecard/devicecard'
import * as Icons from '../../design-system/icons'
import { DeviceList } from '../../design-system/List'
import { NotificationBox } from '../../design-system/notification box'

// Configuration objects
const COLORS = {
  primary: '#CFFF5E',
  secondary: '#B87EED',
  neutral: '#E5E5E5',
  text: {
    primary: '#1A1A1A',
    secondary: '#6E6E6E',
    light: '#333',
  },
  background: '#FFFFFF',
}

const NOTIFICATIONS_CONFIG = [
  {
    type: 'success' as const,
    title: 'Success',
    description: 'Device successfully added',
  },
  {
    type: 'information' as const,
    title: 'Information',
    description: 'Firmware update available',
  },
  {
    type: 'error' as const,
    title: 'Error',
    description: 'Connection failed',
  },
]

const DEVICE_CARD_CONFIG = {
  title: 'Living Room Lights',
  onStatus: 'Currently on',
  offStatus: 'Currently off',
  onPower: '18W',
  offPower: '0W',
  iconName: 'LightIcon',
}

const SECTION_TITLES = {
  notifications: 'Toast Notifications',
  deviceList: 'Device List Items',
}


const IconGalleryScreen = () => {
  const [isOn, setIsOn] = useState(true);

  const myDevices = [
    {
      id: '1',
      title: 'Living Room Light',
      type: 'BEY-SWITCH',
      iconName: 'FilledLightIcon',
      iconBackgroundColor: COLORS.primary,
      iconColor: COLORS.text.primary,
      initialState: true,
    },
    {
      id: '2',
      title: 'Smart TV ',
      type: 'BEY-PLUG',
      iconName: 'FilledHomeIcon',
      iconBackgroundColor: COLORS.neutral,
      iconColor: COLORS.text.secondary,
      initialState: false,
    },
    {
      id: '3',
      title: 'Front Door',
      type: 'BEY-LOCK',
      iconName: 'FilledSettingsIcon',
      iconBackgroundColor: COLORS.secondary,
      iconColor: COLORS.background,
      initialState: true,
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Toast Notifications */}
      <View style={{ width: '100%', marginBottom: 32 }}>
        <Text style={styles.sectionTitle}>{SECTION_TITLES.notifications}</Text>
        {NOTIFICATIONS_CONFIG.map((notification, index) => (
          <NotificationBox
            key={index}
            type={notification.type}
            title={notification.title}
            description={notification.description}
            onClose={() => console.log(`${notification.title} notification closed`)}
          />
        ))}
      </View>

      {/* Device List Testing */}
      <View style={{ width: '100%', marginBottom: 32 }}>
        <DeviceList title={SECTION_TITLES.deviceList} devices={myDevices} />
      </View>

      {/* Original Device Card */}
      <View style={{ width: '100%', marginBottom: 32 }}>
        <DeviceCard
          title={DEVICE_CARD_CONFIG.title}
          status={isOn ? DEVICE_CARD_CONFIG.onStatus : DEVICE_CARD_CONFIG.offStatus}
          statusColor={isOn ? COLORS.primary : COLORS.text.secondary}
          power={isOn ? DEVICE_CARD_CONFIG.onPower : DEVICE_CARD_CONFIG.offPower}
          iconName={DEVICE_CARD_CONFIG.iconName}
          iconColor={COLORS.primary}
          switchValue={isOn}
          onSwitchChange={setIsOn}
        />
      </View>

      {/* Icon Gallery */}
      <View style={styles.iconGallery}>
        {Object.entries(Icons)
          .filter(([name, IconComponent]) => 
            typeof IconComponent === 'function' && 
            name !== 'getIconSize' && 
            name !== 'renderIcon' && 
            name !== 'createTabItems' && 
            name !== 'isValidIconKey' && 
            name !== 'getIconKeysByType' &&
            !name.startsWith('FilledIcons') &&
            !name.startsWith('OutlinedIcons') &&
            // Only include actual icon components
            (name.includes('Icon') || name === 'BackArrow' || name === 'Dropdown' || name === 'Lock' || name === 'CorrectIcon' || name === 'Phone' || name === 'screwdriver' || name === 'checkemail' || name === 'EmailIcon' || name === 'ImageIcon' || name === 'Whatsapp')
          )
          .map(([name, IconComponent]) => {
            const Icon = IconComponent as React.ComponentType<{ width: number; height: number }>;
            return (
              <View key={name} style={styles.iconBox}>
                <Icon width={24} height={24} />
                <Text style={styles.label}>{name}</Text>
              </View>
            );
          })}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexDirection: 'column',
  },
  iconGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-start'
  },
  iconBox: {
    width: 72,
    alignItems: 'center',
    marginBottom: 24
  },
  label: {
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.text.light
  }
})

export default IconGalleryScreen
