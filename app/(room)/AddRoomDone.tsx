import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { AppButton } from '../../design-system/Buttons/Buttons';
import { colors } from '../../design-system/colors/colors';
import { BackArrow } from '../../design-system/icons';
import { BathIcon, BedroomIcon, Car, Gym, Hallway, KitchenIcon, LivingIcon, PlusIcon, Screen, Shirt } from '../../design-system/icons/filled';
import Celebration from '../../design-system/Illustration/celebration';
import { Spacing } from '../../design-system/Layout/spacing';
import { Typography } from '../../design-system/typography/typography';

interface RoomData {
  roomName?: string;
  homeName?: string;
  roomType?: string;
  roomPhoto?: string;
}

const AddRoomDone = () => {
  const params = useLocalSearchParams();
  
  // Get actual data from params
  const roomData: RoomData = {
    roomName: params.roomName as string,
    homeName: params.homeName as string,
    roomType: params.roomType as string,
    roomPhoto: params.roomPhoto as string,
  };

  // Get room type icon
  const getRoomTypeIcon = (roomType: string) => {
    switch (roomType.toLowerCase()) {
      case 'bedroom':
        return <BedroomIcon width={24} height={24} color={colors.surface} />;
      case 'living':
      case 'living room':
        return <LivingIcon width={24} height={24} color={colors.surface} />;
      case 'kitchen':
        return <KitchenIcon width={24} height={24} color={colors.surface} />;
      case 'bathroom':
      case 'bath':
        return <BathIcon width={24} height={24} color={colors.surface} />;
      case 'dining':
      case 'dining room':
        return <KitchenIcon width={24} height={24} color={colors.surface} />;
      case 'gym':
        return <Gym width={24} height={24} color={colors.surface} />;
      case 'garage':
        return <Car width={24} height={24} color={colors.surface} />;
      case 'closet':
        return <Shirt width={24} height={24} color={colors.surface} />;
      case 'office':
        return <Screen width={24} height={24} color={colors.surface} />;
      case 'hallway':
        return <Hallway width={24} height={24} color={colors.surface} />;
      default:
        return <PlusIcon width={24} height={24} color={colors.surface} />;
    }
  };

  const handleAddDevices = () => {
    // Navigate to add device screen which we will create later
  };

  const handleGoToHomepage = () => {
    // Navigate to main home screen with completion flag
    router.push({
      pathname: '/(app)/home' as never,
      params: {
        completedStep: 'add_home',
        add_room: 'true'
      }
    } as never);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(room)/AddRoom' as never);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityLabel="Go back"
          accessibilityHint="Return to previous screen"
        >
          <BackArrow width={24} height={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
         {/* Celebration Illustration */}
         <View style={styles.celebrationContainer}>
           <Celebration 
             width={80} 
             height={80} 
           />
         </View>

         {/* Title */}
         <View style={styles.titleContainer}>
           <Typography variant="h1" color={colors.surface} style={styles.title}>
             Your Room Is Ready
           </Typography>
         </View>

         {/* Room Card */}
         <View style={styles.roomCard}>
           <View style={styles.roomImageContainer}>
             {roomData.roomPhoto ? (
               <Image
                 source={{ uri: roomData.roomPhoto }}
                 style={styles.roomImage}
                 accessibilityLabel="Room photo"
               />
             ) : (
               <View style={styles.roomIconContainer}>
                 {getRoomTypeIcon(roomData.roomType || '')}
               </View>
             )}
           </View>
           
           <View style={styles.roomDetails}>
             <Typography variant="h2" color={colors.surface} style={styles.roomName}>
               {roomData.roomName}
             </Typography>
             <Typography variant="body" color={colors.surface} style={styles.homeName}>
               {roomData.homeName}
             </Typography>
           </View>
         </View>

         {/* Action Buttons */}
         <View style={styles.actionsContainer}>
           <AppButton
             variant="primaryLarge"
             title="Add Devices"
             onPress={handleAddDevices}
             accessibilityLabel="Add devices to room"
             accessibilityHint="Add smart devices to your new room"
           />
           
           <View style={styles.buttonSpacing} />
           
           <AppButton
             variant="secondaryLarge"
             title="Go To Homepage"
             onPress={handleGoToHomepage}
             accessibilityLabel="Go to homepage"
             accessibilityHint="Return to the main home screen"
           />
         </View>
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.navBarBackground,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  backButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  content: {
    flex: 1,
    backgroundColor: colors.navBarBackground,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxl,
  },
  celebrationContainer: {
    alignItems: 'center' as const,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  titleContainer: {
    alignItems: 'center' as const,
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: 'center' as const,
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
   roomCard: {
     backgroundColor: colors.disabled,
     borderRadius: 16,
     padding: Spacing.xl,
     marginBottom: Spacing.xl,
     alignItems: 'center' as const,
     borderWidth: 1,
     borderColor: colors.inactivestep,
   },
   roomImageContainer: {
     marginBottom: Spacing.md,
   },
   roomImage: {
     width: 80,
     height: 80,
     borderRadius: 40,
   },
   roomIconContainer: {
     width: 80,
     height: 80,
     backgroundColor: colors.success,
     borderRadius: 40,
     alignItems: 'center' as const,
     justifyContent: 'center' as const,
   },
   roomDetails: {
     alignItems: 'center' as const,
   },
   roomName: {
     fontSize: 24,
     fontWeight: '600' as const,
     marginBottom: Spacing.sm,
     textAlign: 'center' as const,
     color: colors.surface,
   },
   homeName: {
     fontSize: 20,
     textAlign: 'center' as const,
     color: colors.surface,
   },
  actionsContainer: {
    marginTop: 'auto' as const,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
   buttonSpacing: {
     height: Spacing.md,
   },
};

export default AddRoomDone;
