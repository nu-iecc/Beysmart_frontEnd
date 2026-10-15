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
import { Spacing } from '@/design-system/Layout/spacing'
import { BottomNavigation, TopNavigation } from '@/design-system/Navigation'
import type { BottomNavigationItem, Home as DSHome, User as DSUser } from '@/design-system/Navigation/Types'
import { Typography } from '@/design-system/typography/typography'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Linking, RefreshControl, TouchableOpacity, View } from 'react-native'
import ProfileSection from '@/components/ProfileSection'
import { BASE_URL } from '../../constants/api'
import apiClient from '../../utils/api'
import AccessibleLocks from '@/components/AccessibleLocks'
import ComingSoon from '@/components/ComingSoon'
import { useToast } from '@/components/Toast'

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
  const toast = useToast()
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
      onAddMember={() => toast('info', 'Adding home members is coming soon.')}
      onNotificationPress={() => toast('info', 'Notifications are coming soon.')}
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
  const [refreshKey, setRefreshKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    setRefreshKey(value => value + 1)
  }, [])
  const handleRefreshed = useCallback(() => setRefreshing(false), [])
  const contentOpacity = useRef(new Animated.Value(1)).current
  useEffect(() => {
    contentOpacity.setValue(0)
    const transition = Animated.timing(contentOpacity, { toValue: 1, duration: 180, useNativeDriver: true })
    transition.start()
    return () => transition.stop()
  }, [activeTab, contentOpacity])

  useEffect(() => {
    const tab = params.tab
    if (typeof tab === 'string' && ['home', 'devices', 'energy', 'profile'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [params.tab])

  // Function to update setup steps based on current home's state
  const updateStepsForCurrentHome = useCallback((homeId: number | undefined, rooms: any[]) => {
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

    // Step 3: Connect your device - only available if room exists
    // This step will be unlocked automatically by the step logic

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
          profile_picture: userData.profile_picture ? `${BASE_URL.replace('/api/', '')}${userData.profile_picture}` : undefined
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
            profile_picture: data.profile_picture ? `${BASE_URL.replace('/api/', '')}${data.profile_picture}` : undefined
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
    const loadRooms = async () => {
      if (!activeHomeId) {
        setRooms([])
        setIsLoadingRooms(false)
        updateStepsForCurrentHome(undefined, [])
        return
      }

      try {
        setIsLoadingRooms(true)
        
        // Load all rooms and filter by home ID
        const response = await apiClient.get('home/rooms/')
        
        // Filter rooms by the active home ID
        const filteredRooms = response.data.filter((room: any) => {
          return room.home === activeHomeId || room.home === String(activeHomeId) || String(room.home) === String(activeHomeId)
        })
        
        setRooms(filteredRooms)
        
        // Update setup steps based on current home's state
        updateStepsForCurrentHome(activeHomeId, filteredRooms)
        
      } catch (error: any) {
        console.error('Error loading rooms:', error);
        setRooms([])
        updateStepsForCurrentHome(activeHomeId, [])
      } finally {
        setIsLoadingRooms(false)
      }
    }

    loadRooms()
  }, [activeHomeId, updateStepsForCurrentHome])

  // Handle step completion from navigation params
  useEffect(() => {
    if (params.completedStep) {
      const stepId = params.completedStep as string
      setSteps(prevSteps => completeSetupStep(prevSteps, stepId))
    }
    
    // Handle add_room completion
    if (params.add_room === 'true') {
      // Reload rooms and update steps for current home
      const reloadRooms = async () => {
        if (activeHomeId) {
          try {
            const response = await apiClient.get('home/rooms/')
            const filteredRooms = response.data.filter((room: any) => 
              room.home === activeHomeId || room.home === String(activeHomeId) || String(room.home) === String(activeHomeId)
            )
            setRooms(filteredRooms)
            updateStepsForCurrentHome(activeHomeId, filteredRooms)
          } catch (error) {
            console.error('Error reloading rooms:', error)
          }
        }
      }
      reloadRooms()
    }
  }, [params.completedStep, params.add_room, activeHomeId, updateStepsForCurrentHome])
  const bottomNavItems: BottomNavigationItem[] = [
    { key: 'home', label: 'Home', icon: null },
    { key: 'devices', label: 'Devices', icon: null },
    { key: 'energy', label: 'Energy', icon: null },
    { key: 'profile', label: 'Profile', icon: null },
  ]

  const onAction = useCallback((step: SetupStep) => {
    const canProceed = step.isActive && !step.isCompleted && !step.isLocked
    if (!canProceed) return

    // Handle navigation for specific steps
    if (step.key === 'add_home') {
      router.push('/(home)/AddHome')
      return
    }

    if (step.key === 'add_room') {
      router.push({
        pathname: '/(room)/AddRoom',
        params: { homeId: activeHomeId?.toString() }
      })
      return
    }

    if (step.key === 'connect_device') {
      router.push('/(devices)/AddDevice2')
      return
    }

    // For other steps, complete them normally
    const updated = completeSetupStep(steps, step.id)
    setSteps(updated)
  }, [steps])

  const handleTabPress = useCallback((key: string) => setActiveTab(key), [])

  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F3F5F8', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="body">Loading...</Typography>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F5F8' }}>
      <Header
        user={user || { first_name: undefined, profile_picture: undefined }}
        homes={homes}
        activeHomeId={activeHomeId}
        onHomeSelect={setActiveHomeId}
      />
      <Animated.ScrollView style={{ opacity: contentOpacity }}
        refreshControl={activeTab === 'energy' || activeTab === 'profile' ? undefined : <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.lg,
          paddingBottom: Spacing.md,
        }}
      >
        {(activeTab === 'home' || activeTab === 'devices') && <AccessibleLocks refreshKey={refreshKey} onRefreshed={handleRefreshed} emptyContent={activeTab === 'home' ? steps.map((step, index) => (
          <StepRow
            key={step.id}
            step={step}
            onAction={onAction}
            showLine={index < steps.length - 1}
          />
        )) : undefined} />}
        {activeTab === 'energy' && <ComingSoon title="Energy" icon="flash-outline" />}
        {activeTab === 'profile' && <ProfileSection name={user?.first_name} email={userEmail} profilePicture={user?.profile_picture} homesCount={homes.length} />}

        <View style={{ alignItems: 'center', marginTop: 'auto', paddingTop: Spacing.xl }}>
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
      </Animated.ScrollView>
      <BottomNavigation
        items={bottomNavItems}
        activeKey={activeTab}
        profile_picture={user?.profile_picture}
        onTabPress={handleTabPress}
      />
      
    </View>
  )
}

export default HomeScreen

