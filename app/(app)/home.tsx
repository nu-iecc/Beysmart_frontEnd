import { AppButton } from '@/design-system/Buttons/Buttons'
import { colors } from '@/design-system/colors/colors'
import { HOME_SETUP, SUPPORT_BODY, SUPPORT_EMAIL, SUPPORT_SUBJECT } from '@/design-system/home/Constants'
import { SetupStep, completeSetupStep, resetSetupSteps } from '@/design-system/home/HomeSetupUtils'
import {
    CorrectIcon,
    Door,
    HomeIcon,
    LightIcon,
    LockIcon,
    Robot
} from '@/design-system/icons'
import { Beylock, PlusIcon } from '@/design-system/icons/filled'
import { BottomNavigation, TopNavigation } from '@/design-system/Navigation'
import type { BottomNavigationItem, Home as DSHome, User as DSUser } from '@/design-system/Navigation/Types'
import { Typography } from '@/design-system/typography/typography'
import { scale } from '@/utils/responsive'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Linking, ScrollView, TouchableOpacity, View } from 'react-native'
import ProfilePage from '../(profile actions)/Profile'
import { getMediaUrl } from '../../constants/api'
import apiClient from '../../utils/api'

const StepIcon: React.FC<{ step: SetupStep }> = ({ step }) => {
    const size = HOME_SETUP.DIMENSIONS.STEP_ICON.SIZE
    const borderRadius = HOME_SETUP.DIMENSIONS.STEP_ICON.BORDER_RADIUS
  
    const backgroundColor = step.isCompleted
      ? colors.completedstep
      : step.isActive
      ? colors.activestep
      : colors.inactivestep
  
    const IconComponent = useMemo(() => {
      
      const iconColor = step.isCompleted 
        ? colors.surface          
        : step.isActive 
        ? colors.surface           
        : colors.notactiveicon           
      
      switch (step.iconKey) {
        case 'home':
          return <HomeIcon width={22} height={22} color={iconColor} />
        case 'room':
          return <Door width={22} height={22} color={iconColor} />
        case 'lightbulb':
          return <LightIcon width={22} height={22} color={iconColor} />
        case 'robot':
          return <Robot width={22} height={22} color={iconColor} />
        default:
          return <HomeIcon width={22} height={22} color={iconColor} />
      }
    }, [step.iconKey, step.isCompleted, step.isActive]) // Added missing dependencies
  
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius,
          backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: step.isActive ? 0.15 : 0,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: step.isActive ? 2 : 0,
        }}
      >
        {IconComponent}
      </View>
    )
  }
const StatusPill: React.FC<{ step: SetupStep }> = ({ step }) => {
  if (step.isCompleted) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#2E7DFF',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          alignSelf: 'flex-start',
        }}
      >
        <CorrectIcon width={14} height={14} />
        <Typography variant="caption" color={'#FFFFFF'} style={{ marginLeft: 6 }}>
          Completed
        </Typography>
      </View>
    )
  }

  if (step.isLocked) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#EFF1F4',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          alignSelf: 'flex-start',
        }}
      >
        <LockIcon width={14} height={14} />
        <Typography variant="caption" color={'#6B7280'} style={{ marginLeft: 6 }}>
          Locked
        </Typography>
      </View>
    )
  }

  return null
}

const StepRow: React.FC<{
  step: SetupStep
  onAction: (step: SetupStep) => void
  showLine: boolean
}> = ({ step, onAction, showLine }) => {
  return (
    <View style={{ flexDirection: 'row', marginBottom: HOME_SETUP.SPACING.BETWEEN_STEPS }}>
      <View style={{ alignItems: 'center', width: HOME_SETUP.DIMENSIONS.STEP_ICON.SIZE }}>
        <StepIcon step={step} />
        {showLine && (
          <View
            style={{
              width: HOME_SETUP.DIMENSIONS.TIMELINE_LINE.WIDTH,
              flex: 1,
              backgroundColor: '#D8DCE2',
              marginTop: HOME_SETUP.SPACING.STEP_ICON_MARGIN,
            }}
          />
        )}
      </View>

      <View style={{ flex: 1, marginLeft: HOME_SETUP.SPACING.STEP_ICON_MARGIN }}>
        <Typography variant="h3" style={{ fontSize: 18, lineHeight: 22 }}>
          {step.title}
        </Typography>
        <Typography variant="body" color={'#6B7280'} style={{ marginTop: 6, fontSize: 13, lineHeight: 18 }}>
          {step.description}
        </Typography>

        <View style={{ height: 10 }} />

        {step.isActive && !step.isCompleted ? (
          <AppButton
            variant="primarySmall"
            title={step.actionText}
            onPress={() => onAction(step)}
          />
        ) : (
          <StatusPill step={step} />
        )}
      </View>
    </View>
  )
}

const Header: React.FC<{
  user: DSUser
  homes: DSHome[]
  activeHomeId?: number
  onHomeSelect: (id: number) => void
}> = React.memo(({ user, homes, activeHomeId, onHomeSelect }) => {
  const handleAddHome = useCallback(() => {
    router.push('/(home)/AddHome')
  }, [])

  return (
    <TopNavigation
      user={user}
      homes={homes}
      activeHomeId={activeHomeId}
      onHomeSelect={onHomeSelect}
      onAddHome={handleAddHome}
      onAddMember={() => {}}
      onNotificationPress={() => {}}
    />
  )
})

const HomeScreen: React.FC = () => {
  const params = useLocalSearchParams()
  const [steps, setSteps] = useState<SetupStep[]>(() => resetSetupSteps())
  const [activeHomeId, setActiveHomeId] = useState<number | undefined>(undefined)
  const [activeTab, setActiveTab] = useState<string>('home')
  const [user, setUser] = useState<DSUser | null>(null)
  const [userEmail, setUserEmail] = useState<string>('user@example.com')
  const [isLoading, setIsLoading] = useState(true)
  const [homes, setHomes] = useState<DSHome[]>([])
  const [isLoadingHomes, setIsLoadingHomes] = useState(true)
  const [rooms, setRooms] = useState<any[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [devices, setDevices] = useState<any[]>([])
  const [showProfile, setShowProfile] = useState(false)

  // Combined loading state - wait for all critical data
  const isLoadingData = isLoading || isLoadingHomes || isLoadingRooms

  // Compute active home from homes array
  const activeHome = useMemo(() => {
    return homes.find(home => home.id === activeHomeId)
  }, [homes, activeHomeId])

  // Check if setup is complete (first 3 steps completed)
  const isSetupComplete = useMemo(() => {
    return steps.slice(0, 3).every(step => step.isCompleted)
  }, [steps])

  // Function to update setup steps based on current home's state
  const updateStepsForCurrentHome = useCallback((homeId: number | undefined, rooms: any[], devicesList: any[] = []) => {
    // Reset all steps first
    let newSteps = resetSetupSteps()
    
    if (!homeId) {
      // No home selected - all steps locked except add_home
      setSteps(newSteps)
      return
    }

    // Step 1: Add your home - always completed if we have homes
    if (homes.length > 0) {
      newSteps = completeSetupStep(newSteps, 'add_home')
    }

    // Step 2: Add your first room - completed if current home has rooms
    if (rooms.length > 0) {
      newSteps = completeSetupStep(newSteps, 'add_room')
    }

    // Step 3: Connect your device - completed if current home has devices
    if (devicesList.length > 0) {
      newSteps = completeSetupStep(newSteps, 'connect_device')
    }

    setSteps(newSteps)
  }, [homes])

  // Load user data from AsyncStorage
  const loadUserData = useCallback(async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData')
      let needsProfileFetch = true

      if (userDataString) {
        const userData = JSON.parse(userDataString)
        setUser({
          first_name: userData.first_name || undefined,
          profile_picture: getMediaUrl(userData.profile_picture)
        })
        if (userData.email) {
          setUserEmail(userData.email)
        }
        // If we already have a first_name cached, skip fetching
        if (userData.first_name && String(userData.first_name).trim().length > 0) {
          needsProfileFetch = false
        }
      }

      // Fallback: fetch fresh profile to get first_name if missing
      if (needsProfileFetch) {
        try {
          const res = await apiClient.get('auth/profile/')
          const data = res.data
          setUser({
            first_name: data.first_name || undefined,
            profile_picture: getMediaUrl(data.profile_picture)
          })
          if (data.email) {
            setUserEmail(data.email)
          }
          // Update cached userData with latest profile
          const existingStr = await AsyncStorage.getItem('userData')
          const existing = existingStr ? JSON.parse(existingStr) : {}
          const merged = {
            ...existing,
            first_name: data.first_name ?? existing.first_name,
            last_name: data.last_name ?? existing.last_name,
            profile_picture: data.profile_picture ?? existing.profile_picture,
            email: data.email ?? existing.email,
          }
          await AsyncStorage.setItem('userData', JSON.stringify(merged))
        } catch (e) {
          // Silent fail; header will just show default Welcome
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  // Refresh user data when screen comes into focus (e.g., returning from AccountSettings)
  useFocusEffect(
    useCallback(() => {
      // Only reload if user data is not already loaded
      if (!user) {
        loadUserData()
      }
    }, [loadUserData, user])
  )

  // Load homes from API
  useEffect(() => {
    const loadHomes = async () => {
      try {
        const response = await apiClient.get('home/homes/')
        const homesData = response.data.map((home: any) => ({
          id: home.id,
          name: home.name
        }))
        setHomes(homesData)
        
        // Set first home as active if available
        if (homesData.length > 0) {
          setActiveHomeId(homesData[0].id)
          // Mark the "Add your home" step as completed since user has homes
          setSteps(prevSteps => completeSetupStep(prevSteps, 'add_home'))
        }
      } catch (error: any) {
        console.error('Error loading homes:', error);
        // Keep empty array if API fails
        setHomes([])
      } finally {
        setIsLoadingHomes(false)
      }
    }

    loadHomes()
  }, [])

  // Load rooms from API based on active home
  useEffect(() => {
    const loadRoomsAndDevices = async () => {
      if (!activeHomeId) {
        setRooms([])
        setDevices([])
        setIsLoadingRooms(false)
        updateStepsForCurrentHome(undefined, [], [])
        return
      }

      try {
        setIsLoadingRooms(true)
        
        // Load all rooms and filter by home ID
        const roomsResponse = await apiClient.get('home/rooms/')
        const filteredRooms = roomsResponse.data.filter((room: any) => {
          return room.home === activeHomeId || room.home === String(activeHomeId) || String(room.home) === String(activeHomeId)
        })
        setRooms(filteredRooms)
        
        // Load all devices and filter by home ID
        const devicesResponse = await apiClient.get('home/devices/')
        const filteredDevices = devicesResponse.data.filter((device: any) => {
          return device.home === activeHomeId || device.home === String(activeHomeId) || String(device.home) === String(activeHomeId)
        })
        setDevices(filteredDevices)
        
        // Update setup steps based on current home's state
        updateStepsForCurrentHome(activeHomeId, filteredRooms, filteredDevices)
        
      } catch (error: any) {
        console.error('Error loading rooms/devices:', error);
        setRooms([])
        setDevices([])
        updateStepsForCurrentHome(activeHomeId, [], [])
      } finally {
        setIsLoadingRooms(false)
      }
    }

    loadRoomsAndDevices()
  }, [activeHomeId, updateStepsForCurrentHome])

  // Handle step completion from navigation params
  useEffect(() => {
    if (params.completedStep) {
      const stepId = params.completedStep as string
      setSteps(prevSteps => completeSetupStep(prevSteps, stepId))
    }
    
    // Handle add_room or add_device completion
    if (params.add_room === 'true' || params.add_device === 'true') {
      // Reload rooms and devices, then update steps for current home
      const reloadData = async () => {
        if (activeHomeId) {
          try {
            // Reload rooms
            const roomsResponse = await apiClient.get('home/rooms/')
            const filteredRooms = roomsResponse.data.filter((room: any) => 
              room.home === activeHomeId || room.home === String(activeHomeId) || String(room.home) === String(activeHomeId)
            )
            setRooms(filteredRooms)

            // Reload devices
            const devicesResponse = await apiClient.get('home/devices/')
            const filteredDevices = devicesResponse.data.filter((device: any) => 
              device.home === activeHomeId || device.home === String(activeHomeId) || String(device.home) === String(activeHomeId)
            )
            setDevices(filteredDevices)

            // Update steps with both rooms and devices
            updateStepsForCurrentHome(activeHomeId, filteredRooms, filteredDevices)
          } catch (error) {
            console.error('Error reloading data:', error)
          }
        }
      }
      reloadData()
    }
  }, [params.completedStep, params.add_room, params.add_device, activeHomeId, updateStepsForCurrentHome])
  const bottomNavItems: BottomNavigationItem[] = [
    { key: 'home', label: 'Home', icon: null },
    { key: 'devices', label: 'Devices', icon: null },
    { key: 'energy', label: 'Energy', icon: null },
    { key: 'profile', label: 'Profile', icon: null },
  ]

  const onAction = useCallback((step: SetupStep) => {
    console.log('🔧 onAction called for step:', step.key, {
      isActive: step.isActive,
      isCompleted: step.isCompleted,
      isLocked: step.isLocked
    })
    
    const canProceed = step.isActive && !step.isCompleted && !step.isLocked
    if (!canProceed) {
      console.log('❌ Cannot proceed with step:', step.key)
      return
    }

    // Handle navigation for specific steps
    if (step.key === 'add_home') {
      console.log('🏠 Navigating to AddHome')
      router.push('/(home)/AddHome')
      return
    }

    if (step.key === 'add_room') {
      console.log('🚪 Navigating to AddRoom')
      router.push({
        pathname: '/(room)/AddRoom',
        params: { homeId: activeHomeId?.toString() }
      })
      return
    }

    if (step.key === 'connect_device') {
      console.log('🔌 Navigating to AddDevice2')
      router.push('/(devices)/AddDevice2')
      return
    }

    if (step.key === 'start_using') {
      // Navigate to lock control screen to start using the device
      // If devices are available, use the first one's info, otherwise use defaults
      if (devices.length > 0) {
        const firstDevice = devices[0]
        router.push({
          pathname: '/(Lock/Unlock)/LockControlScreen',
          params: {
            deviceId: firstDevice.id?.toString() || '',
            deviceName: firstDevice.name || 'Smart Lock',
            homeName: firstDevice.home_name || firstDevice.room_name || activeHome?.name || 'Home',
          },
        } as never)
      } else {
        router.push('/(Lock/Unlock)/LockControlScreen' as never)
      }
      return
    }

    // For other steps, complete them normally
    const updated = completeSetupStep(steps, step.id)
    setSteps(updated)
  }, [steps, activeHomeId, devices, activeHome])

  const handleTabPress = useCallback((key: string) => {
    setActiveTab(key)
    if (key === 'profile') {
      setShowProfile(true)
    } else if (key === 'devices') {
      router.push('/(HomePage_actions)/MyDevices' as any)
    }
    // Add other tab navigation handlers as needed
  }, [])

  // Handle lock card press
  const handleLockPress = useCallback((device: any) => {
    router.push({
      pathname: '/(Lock/Unlock)/LockControlScreen',
      params: {
        deviceId: device.id.toString(),
        deviceName: device.name,
        homeName: device.home_name || device.room_name || activeHome?.name || 'Home',
      },
    } as never)
  }, [activeHome])

  // Get room name from room ID
  const getRoomName = useCallback((device: any) => {
    if (device.room_name) return device.room_name
    if (device.room && rooms.length > 0) {
      const room = rooms.find(r => r.id === device.room || String(r.id) === String(device.room))
      if (room) return room.name
    }
    return device.home_name || 'No location'
  }, [rooms])

  // Get device icon
  const getDeviceIcon = useCallback((deviceType: string) => {
    return <Beylock width={32} height={32} color={colors.primary.darker} />
  }, [])

  // Get status badge
  const getStatusBadge = useCallback((device: any) => {
    // Only show online if explicitly true, otherwise show offline
    const isOnline = device.is_online === true
    return {
      text: isOnline ? 'Connected' : 'Not Connected',
      color: isOnline ? colors.success : colors.secondaryText,
      backgroundColor: isOnline ? colors.successLight : '#F3F4F6'
    }
  }, [])

  // Render lock card
  const renderLockCard = useCallback((device: any) => {
    const statusBadge = getStatusBadge(device)

    return (
      <TouchableOpacity
        key={device.id}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          marginBottom: 10,
          padding: 14,
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
        onPress={() => handleLockPress(device)}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Device Icon */}
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#DCEBFF',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            {getDeviceIcon(device.device_type)}
          </View>

          {/* Device Info */}
          <View style={{ flex: 1, marginRight: 8 }}>
            <Typography variant="h3" color={colors.text} style={{ fontSize: 16, marginBottom: 4 }}>
              {device.name}
            </Typography>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Typography variant="caption" color={colors.secondaryText}>
                {getRoomName(device)}
              </Typography>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                  backgroundColor: statusBadge.backgroundColor,
                }}
              >
                <Typography variant="caption" color={statusBadge.color} style={{ fontSize: 10 }}>
                  {statusBadge.text}
                </Typography>
              </View>
            </View>
          </View>

          {/* Chevron */}
          <Typography variant="body" color={colors.secondaryText} style={{ fontSize: 20 }}>
            ›
          </Typography>
        </View>
      </TouchableOpacity>
    )
  }, [getDeviceIcon, getStatusBadge, handleLockPress, getRoomName])

  // Show loading state while fetching all critical data
  if (isLoadingData) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h3" color={colors.text} style={{ marginBottom: 8 }}>Loading...</Typography>
        <Typography variant="caption" color={colors.secondaryText}>Setting up your smart home</Typography>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Header
        user={user || { first_name: undefined, profile_picture: undefined }}
        homes={homes}
        activeHomeId={activeHomeId}
        onHomeSelect={setActiveHomeId}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: '4%',
          paddingTop: 16,
          paddingBottom: 100,
        }}
      >
        {isSetupComplete && devices.length > 0 ? (
          // Show locks after setup is complete
          <>
            <View style={{ marginBottom: 12 }}>
              <Typography variant="h2" color={colors.text} style={{ fontSize: 20, marginBottom: 12 }}>
                Your Locks
              </Typography>
            </View>

            {devices.map(device => renderLockCard(device))}

            {/* Add Another Lock Button */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.background,
                borderRadius: scale(12),
                padding: scale(14),
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: scale(6),
                borderWidth: 1,
                borderColor: colors.border,
                borderStyle: 'dashed',
              }}
              onPress={() => router.push('/(devices)/AddDevice2')}
              activeOpacity={0.7}
            >
              <PlusIcon width={scale(20)} height={scale(20)} color={colors.primary.base} />
              <Typography variant="body" color={colors.primary.base} style={{ marginLeft: scale(8), fontWeight: '600' }}>
                Add Another Lock
              </Typography>
            </TouchableOpacity>
          </>
        ) : (
          // Show setup steps when not complete
          <>
            {steps.map((step, index) => (
              <StepRow
                key={step.id}
                step={step}
                onAction={onAction}
                showLine={index < steps.length - 1}
              />
            ))}
          </>
        )}

        <View style={{ alignItems: 'center', marginTop: 24 }}>
  <View style={{ flexDirection: "row" }}>
    <Typography variant="caption" color={'#6B7280'}>
      Need help?
    </Typography>
    <TouchableOpacity
      onPress={() => {
        const email = SUPPORT_EMAIL
        const subject = SUPPORT_SUBJECT
        const body = SUPPORT_BODY
        const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        Linking.openURL(url).catch(err =>
          console.error("Error opening email app", err)
        )
      }}
    >
      <Typography variant="caption" color={'#2E7DFF'} style={{ marginLeft: 4 }}>
        Contact Support
      </Typography>
    </TouchableOpacity>
  </View>
</View>
      </ScrollView>
      <BottomNavigation
        items={bottomNavItems}
        activeKey={activeTab}
        profile_picture={user?.profile_picture}
        onTabPress={handleTabPress}
      />
      
      {/* Profile Modal */}
      <ProfilePage
        visible={showProfile}
        onClose={() => setShowProfile(false)}
        userData={user ? {
          name: user.first_name || null,
          email: userEmail, // Real user email from stored data
          profilePicture: user.profile_picture || null,
          homesCount: homes.length
        } : undefined}
        onAddDevice={() => {
          setShowProfile(false);
          router.push('/(devices)/AddDevice2');
        }}
        onMyHomes={() => {
          setShowProfile(false);
          router.push('/(profile actions)/myHomes');
        }}
        onInviteFamily={() => {
          setShowProfile(false);
          // Handle invite family
        }}
        onAccountSettings={() => {
          setShowProfile(false);
          router.push('/(profile actions)/AccountSettings');
        }}
        onHelpSupport={() => {
          setShowProfile(false);
          router.push('/(profile actions)/Help&support');
        }}
      />
    </View>
  )
}

export default HomeScreen

