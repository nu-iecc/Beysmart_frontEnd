import React, { useState } from 'react';
import { View } from 'react-native';
import { colors } from '../colors/colors';
import { BottomNavigation } from './BottomNavigation';
import { TopNavigation } from './TopNavigation';
import { Home, User } from './Types';

// Example usage of TopNavigation component
export const NavigationExample: React.FC = () => {
  const [activeHomeId, setActiveHomeId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>('home');

  // Sample data - this would come from your backend
  const sampleUser: User = {
    first_name: 'Alexander', // This will come from your backend API
    profile_picture: undefined, // or URL from backend
  };

  // Example of different user scenarios:
  // const userWithNoFirstName: User = { first_name: undefined, profileImage: undefined }; // Shows "Welcome"
  // const userWithFirstName: User = { first_name: 'John', profileImage: undefined }; // Shows "Welcome, John"

  const sampleHomes: Home[] = [
    { id: 1, name: 'Main Home' },
    { id: 2, name: 'Vacation Home' },
    { id: 3, name: "Parents' Home" },
  ];

  const bottomNavItems = [
    { key: 'home', label: 'Home', icon: null },
    { key: 'devices', label: 'Devices', icon: null },
    { key: 'energy', label: 'Energy', icon: null },
    { key: 'profile', label: 'Profile', icon: null },
  ];

  const handleHomeSelect = (homeId: number) => {
    setActiveHomeId(homeId);
    console.log('Selected home:', homeId);
  };

  const handleAddHome = () => {
    console.log('Add home pressed');
    // Navigate to add home screen or open modal
  };

  const handleAddMember = () => {
    console.log('Add member pressed');
    // Navigate to add member screen or open modal
  };

  const handleNotificationPress = () => {
    console.log('Notification pressed');
    // Navigate to notifications screen or open modal
  };

  const handleTabPress = (key: string) => {
    setActiveTab(key);
    console.log('Tab pressed:', key);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopNavigation
        user={sampleUser}
        homes={sampleHomes}
        activeHomeId={activeHomeId}
        onHomeSelect={handleHomeSelect}
        onAddHome={handleAddHome}
        onAddMember={handleAddMember}
        onNotificationPress={handleNotificationPress}
      />
      
      {/* Content area - you can add your main content here */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ padding: 20, backgroundColor: colors.surface, borderRadius: 12 }}>
          <View style={{ 
            width: 200, 
            height: 100, 
            backgroundColor: colors.primary.lightest, 
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <View style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 24, 
              backgroundColor: colors.primary.base,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <View style={{ 
                width: 24, 
                height: 24, 
                backgroundColor: colors.surface,
                borderRadius: 12
              }} />
            </View>
          </View>
        </View>
      </View>

      <BottomNavigation
        items={bottomNavItems}
        activeKey={activeTab}
        profile_picture={sampleUser.profile_picture}
        onTabPress={handleTabPress}
      />
    </View>
  );
};
