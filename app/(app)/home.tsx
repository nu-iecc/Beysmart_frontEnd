import ComingSoon from '@/components/ComingSoon';
import HomeDropdown from '@/components/HomeDropdown';
import LockCard, { AddLockCard } from '@/components/LockCard';
import LockLoader from '@/components/LockLoader';
import ProfileSection from '@/components/ProfileSection';
import { AppButton } from '@/design-system/Buttons/Buttons';
import { colors } from '@/design-system/colors/colors';
import { HOME_SETUP, SUPPORT_BODY, SUPPORT_EMAIL, SUPPORT_SUBJECT } from '@/design-system/home/Constants';
import { SetupStep, completeSetupStep, resetSetupSteps } from '@/design-system/home/HomeSetupUtils';
import {
    CorrectIcon,
    Door,
    HomeIcon,
    LightIcon,
    LockIcon,
    Robot
} from '@/design-system/icons';
import { Spacing } from '@/design-system/Layout/spacing';
import { BottomNavigation, TopNavigation } from '@/design-system/Navigation';
import type { BottomNavigationItem, Home as DSHome, User as DSUser } from '@/design-system/Navigation/Types';
import { Typography } from '@/design-system/typography/typography';
import { deviceRole, getAccessibleDevices, getAllPages } from '@/services/locks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Linking, RefreshControl, TouchableOpacity, View } from 'react-native';
import { toast } from 'sonner-native';
import { getMediaUrl } from '../../constants/api';
import apiClient from '../../utils/api';

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

Header.displayName = 'HomeHeader'

const HomeScreen: React.FC = () => {
  const params = useLocalSearchParams()
  useEffect(() => {
    if (typeof params.tab === 'string' && ['home','devices','energy','profile'].includes(params.tab)) setActiveTab(params.tab)
  }, [params.tab])
  const [steps, setSteps] = useState<SetupStep[]>(() => resetSetupSteps())
  const [activeHomeId, setActiveHomeId] = useState<number | undefined>(undefined)
  const [activeTab, setActiveTab] = useState<string>('home')
  const [user, setUser] = useState<DSUser | null>(null)
  const [userEmail, setUserEmail] = useState<string>('user@example.com')
  const [isLoading, setIsLoading] = useState(true)
  const [homes, setHomes] = useState<DSHome[]>([])
  const [isLoadingHomes, setIsLoadingHomes] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [deviceError, setDeviceError] = useState(false)
  const [homesError, setHomesError] = useState(false)
  const [roomsError, setRoomsError] = useState(false)
  const [isLoadingDevices, setIsLoadingDevices] = useState(true)
  const contentOpacity = React.useRef(new Animated.Value(1)).current
  const appliedHomeParam = React.useRef<string | undefined>(undefined)
  const handleRefresh = useCallback(() => { setRefreshing(true); setRefreshKey(value => value + 1) }, [])
  const handleHomeSelect = useCallback((id: number) => {
    if (typeof params.selectedHomeId === 'string') appliedHomeParam.current = params.selectedHomeId
    setActiveHomeId(id)
  }, [params.selectedHomeId])
  useEffect(() => {
    appliedHomeParam.current = undefined
  }, [params.selectedHomeId])
  useEffect(() => {
    const selected = params.selectedHomeId
    if (typeof selected !== 'string' || !selected) return
    if (appliedHomeParam.current === selected) return
    const home = homes.find(item => String(item.id) === selected)
    if (home) {
      appliedHomeParam.current = selected
      setActiveHomeId(home.id)
    }
  }, [params.selectedHomeId, homes])
  const [rooms, setRooms] = useState<any[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [allDevices, setAllDevices] = useState<any[]>([])
  const [showProfile, setShowProfile] = useState(false)

  // Shared devices are independent of the selected home. If no home is
  // available, keep all accessible devices visible rather than hiding owners.
  const devices = useMemo(() => allDevices.filter(device =>
    activeHomeId == null || deviceRole(device) === 'guest' ||
    String(device.home) === String(activeHomeId)
  ), [allDevices, activeHomeId])
  const homeDevices = useMemo(() => allDevices.filter(device =>
    activeHomeId != null && String(device.home) === String(activeHomeId) && deviceRole(device) !== 'guest'
  ), [allDevices, activeHomeId])
  const homeRooms = useMemo(() => rooms.filter(room =>
    activeHomeId != null && String(room.home) === String(activeHomeId)
  ), [rooms, activeHomeId])
  const isLoadingData = isLoading || (isLoadingDevices && allDevices.length === 0 && !refreshing)

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

  useFocusEffect(useCallback(() => {
    setRefreshKey(value => value + 1)
  }, []))

  // Each request settles independently: missing guest-home metadata cannot hide locks.
  useEffect(() => {
    let active = true
    setIsLoadingDevices(true)
    setIsLoadingHomes(true)
    setIsLoadingRooms(true)
    const devicesRequest = getAccessibleDevices<any>().then(data => {
      if (active) { setAllDevices(data); setDeviceError(false) }
    }).catch(error => {
      console.error('Error loading devices:', error)
      if (active) setDeviceError(true)
    }).finally(() => {
      if (active) setIsLoadingDevices(false)
    })
    const homesRequest = getAllPages<any>('home/homes/', true).then(data => {
      if (!active) return
      const homesData = data.map(home => ({ id: home.id, name: home.name }))
      setHomes(homesData)
      setHomesError(false)
      setActiveHomeId(current => homesData.some(home => String(home.id) === String(current)) ? current : homesData[0]?.id)
    }).catch(error => {
      console.error('Error loading homes:', error)
      if (active) setHomesError(true)
    }).finally(() => { if (active) setIsLoadingHomes(false) })
    const roomsRequest = getAllPages<any>('home/rooms/', true).then(data => {
      if (active) { setRooms(data); setRoomsError(false) }
    }).catch(error => {
      console.error('Error loading rooms:', error)
      if (active) setRoomsError(true)
    }).finally(() => { if (active) setIsLoadingRooms(false) })
    void Promise.allSettled([devicesRequest, homesRequest, roomsRequest]).then(() => {
      if (active) setRefreshing(false)
    })
    return () => { active = false }
  }, [refreshKey])

  useEffect(() => {
    if (!isLoadingHomes && !isLoadingRooms && !isLoadingDevices && !homesError && !roomsError && !deviceError) {
      updateStepsForCurrentHome(activeHomeId, homeRooms, homeDevices)
    }
  }, [activeHomeId, homeRooms, homeDevices, isLoadingHomes, isLoadingRooms, isLoadingDevices, homesError, roomsError, deviceError, updateStepsForCurrentHome])

  // Handle step completion from navigation params
  useEffect(() => {
    if (params.completedStep) {
      const stepId = params.completedStep as string
      setSteps(prevSteps => completeSetupStep(prevSteps, stepId))
    }

  }, [params.completedStep])
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
      if (homeDevices.length > 0) {
        const firstDevice = homeDevices[0]
        router.push({
          pathname: '/(Lock/Unlock)/LockControlScreen',
          params: {
            deviceId: firstDevice.id?.toString() || '',
            role: deviceRole(firstDevice),
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
  }, [steps, activeHomeId, homeDevices, activeHome])

  const handleTabPress = useCallback((key: string) => {
    Animated.timing(contentOpacity, { toValue: 0, duration: 90, useNativeDriver: true }).start(() => {
      setActiveTab(key)
      Animated.timing(contentOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start()
    })
  }, [contentOpacity])

  // Handle lock card press
  const handleLockPress = useCallback((device: any) => {
    router.push({
      pathname: '/(Lock/Unlock)/LockControlScreen',
      params: {
        deviceId: device.id.toString(),
        role: deviceRole(device),
        deviceName: device.name,
        homeName: device.home_name || device.room_name || (String(device.home) === String(activeHomeId) ? activeHome?.name : undefined) || 'Home',
      },
    } as never)
  }, [activeHome, activeHomeId])

  // Get room name from room ID
  const getRoomName = useCallback((device: any) => {
    if (device.room_name) return device.room_name
    if (device.room && rooms.length > 0) {
      const room = rooms.find(r => r.id === device.room || String(r.id) === String(device.room))
      if (room) return room.name
    }
    return device.home_name || 'No location'
  }, [rooms])

  // Render lock card
  const renderLockCard = useCallback((device: any) => (
    <LockCard key={device.id} name={device.name} location={getRoomName(device)} role={deviceRole(device)} connectionLabel={device.is_online === true ? 'Connected' : 'Not connected'} stateLabel={typeof device.is_locked === 'boolean' ? device.is_locked ? 'Locked' : 'Unlocked' : undefined} onPress={() => handleLockPress(device)} />
  ), [handleLockPress, getRoomName])

  // Show loading state while fetching all critical data
  if (isLoadingData) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F3F5F8', justifyContent: 'center', alignItems: 'center' }}>
        <LockLoader label="Loading your locks…" />
      </View>
    )
  }

  return (<View style={{ flex: 1, backgroundColor: '#F3F5F8' }}>
 <Header user={user || { first_name: undefined, profile_picture: undefined }} homes={homes} activeHomeId={activeHomeId} onHomeSelect={handleHomeSelect} />
 <Animated.ScrollView style={{ opacity: contentOpacity }} refreshControl={activeTab === 'profile' || activeTab === 'energy' ? undefined : <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md }} showsVerticalScrollIndicator={false}>
  {(activeTab === 'home' || activeTab === 'devices') && <View style={{ gap: 12 }}>
  {homes.length > 1 && <View style={{ alignSelf: 'flex-start', marginBottom: 4 }}><HomeDropdown items={homes} activeId={activeHomeId} onSelect={handleHomeSelect} onAddHome={() => router.push('/(home)/AddHome')} /></View>}
  {(deviceError || homesError || roomsError) && <View style={{ gap: 6 }}>
   <Typography variant="body" color={colors.error}>{deviceError ? 'Unable to load devices. Please try again.' : 'Some home or room information could not be loaded.'}</Typography>
   <TouchableOpacity accessibilityRole="button" onPress={handleRefresh}><Typography variant="body" color={colors.secondaryText}>Try again</Typography></TouchableOpacity>
  </View>}
   {devices.length ? <>
    <Typography variant="h2" style={{ marginBottom: 8 }}>Your Locks</Typography>
    {devices.map(renderLockCard)}
    <AddLockCard onPress={() => router.push('/(devices)/AddDevice2')} />
  </> : (deviceError || homesError || roomsError || isLoadingHomes || isLoadingRooms || isLoadingDevices) ? null : activeTab === 'home' ? steps.map((step, index) => <StepRow key={step.id} step={step} onAction={onAction} showLine={index < steps.length - 1} />) : <>
    <Typography variant="h2">Your Locks</Typography><Typography variant="body" style={{ marginVertical: 16 }}>No locks yet. Added locks will appear here.</Typography><AddLockCard onPress={() => router.push('/(devices)/AddDevice2')} />
   </>}
   {activeTab === 'devices' && <TouchableOpacity onPress={() => router.push('/(HomePage_actions)/MyDevices')} style={{ paddingVertical: 12, alignItems: 'center' }}><Typography variant="caption" color={colors.secondaryText}>Search and filter devices</Typography></TouchableOpacity>}
  </View>}
  {activeTab === 'energy' && <ComingSoon title="Energy" icon="flash-outline" />}
  {activeTab === 'profile' && <ProfileSection name={user?.first_name} email={userEmail} profilePicture={user?.profile_picture} homesCount={homes.length}
   onAddDevice={() => router.push('/(devices)/AddDevice2')} onMyHomes={() => router.push('/(profile actions)/myHomes')}
   onInviteFamily={() => toast.info('Inviting family is coming soon.')} onAccountSettings={() => router.push('/(profile actions)/AccountSettings')} onHelpSupport={() => router.push('/(profile actions)/Help&support')} />}
  <View style={{ alignItems: 'center', marginTop: 'auto', paddingTop: Spacing.xl }}><View style={{ flexDirection: 'row' }}>
   <Typography variant="caption" color="#6B7280">Need help?</Typography>
   <TouchableOpacity onPress={() => { const url = 'mailto:' + SUPPORT_EMAIL + '?subject=' + encodeURIComponent(SUPPORT_SUBJECT) + '&body=' + encodeURIComponent(SUPPORT_BODY); Linking.openURL(url).catch(error => console.error('Error opening email app', error)); }}><Typography variant="caption" color="#2E7DFF" style={{ marginLeft: 4 }}>Contact Support</Typography></TouchableOpacity>
  </View></View>
 </Animated.ScrollView>
 <BottomNavigation items={bottomNavItems} activeKey={activeTab} profile_picture={user?.profile_picture} onTabPress={handleTabPress} />
</View>);
}

export default HomeScreen

