import { getMediaUrl } from '@/constants/api';
import { colors } from '@/design-system/colors/colors';
import { BackArrow } from '@/design-system/icons';
import {
  Locked,
  Unlocked,
  UsersIcon,
} from '@/design-system/icons/filled';
import ExportIcon from '@/design-system/icons/filled/export';
import Failed from '@/design-system/icons/filled/failed';
import Filter from '@/design-system/icons/filled/filter';
import ShareIcon from '@/design-system/icons/filled/share';
import Statistics from '@/design-system/icons/filled/statistics';
import { Spacing } from '@/design-system/Layout/spacing';
import { BottomNavigation } from '@/design-system/Navigation/BottomNavigation';
import { Typography } from '@/design-system/typography/typography';
import apiClient from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Types
interface ActivityLogItem {
  id: string;
  device: string;
  device_name: string;
  performed_by: string | null;
  performed_by_name: string;
  performed_by_photo: string | null;
  performed_by_role: string | null;
  performed_by_role_display: string | null;
  activity_type: string;
  activity_type_display: string;
  timestamp: string;
  description: string | null;
}

interface UserData {
  first_name?: string;
  profile_picture?: string;
}

// Period filter options
const PERIOD_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: '7_days', label: '7 Days' },
  { key: '30_days', label: '30 Days' },
  { key: 'all', label: 'All Day' },
];

// Event filter options
const EVENT_OPTIONS = [
  { key: 'all', label: 'All Events' },
  { key: 'locking', label: 'Locking only' },
  { key: 'unlocking', label: 'Unlocking Only' },
];

// User filter options
const USER_OPTIONS = [
  { key: 'all', label: 'All Users' },
  { key: 'super_admin', label: 'Super Admins' },
  { key: 'owner', label: 'Owners' },
  { key: 'guest', label: 'Guests' },
];

const ActivityLogScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const deviceId = params.deviceId as string;
  const deviceName = (params.deviceName as string) || 'Lock';
  const isConnected = params.isConnected === 'true';

  // State
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('devices');
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter states
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [selectedEventFilter, setSelectedEventFilter] = useState('all');
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  
  // Modal states
  const [showPeriodFilterModal, setShowPeriodFilterModal] = useState(false);
  const [showEventFilterModal, setShowEventFilterModal] = useState(false);
  const [showUserFilterModal, setShowUserFilterModal] = useState(false);
  
  // Stats
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [failedAttemptsTime, setFailedAttemptsTime] = useState<string | null>(null);
  const [unlockCount, setUnlockCount] = useState(0);
  const [lockCount, setLockCount] = useState(0);
  const [lastActivityTime, setLastActivityTime] = useState<string | null>(null);

  // Load user data for bottom navigation
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUser({
            first_name: userData.first_name || undefined,
            profile_picture: getMediaUrl(userData.profile_picture),
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  // Fetch activity logs
  const fetchActivityLogs = useCallback(async () => {
    if (!deviceId) return;
    
    try {
      const queryParams = new URLSearchParams({
        device_id: deviceId,
        event_filter: selectedEventFilter,
        user_filter: selectedUserFilter,
      });
      
      const response = await apiClient.get(`home/activity-logs/?${queryParams}`);
      const data = response.data.results || response.data;
      setLogs(Array.isArray(data) ? data : []);
      
      // Calculate stats from the data
      const failedLogs = data.filter((log: ActivityLogItem) => 
        log.activity_type === 'failed_attempt'
      );
      setFailedAttempts(failedLogs.length);
      if (failedLogs.length > 0) {
        const latestFailed = failedLogs[0];
        const time = new Date(latestFailed.timestamp);
        setFailedAttemptsTime(time.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }));
      } else {
        setFailedAttemptsTime(null);
      }
      
      // Count unlocks for today's stats
      const unlockLogs = data.filter((log: ActivityLogItem) => 
        log.activity_type === 'unlock' || log.activity_type.startsWith('unlock_')
      );
      setUnlockCount(unlockLogs.length);
      
      // Count locks
      const lockLogs = data.filter((log: ActivityLogItem) => 
        log.activity_type === 'lock' || log.activity_type === 'auto_lock'
      );
      setLockCount(lockLogs.length);
      
      // Get time of last activity (most recent log)
      if (data.length > 0) {
        const latestLog = data[0];
        const time = new Date(latestLog.timestamp);
        setLastActivityTime(time.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }));
      } else {
        setLastActivityTime(null);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [deviceId, selectedEventFilter, selectedUserFilter]);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchActivityLogs();
  };

  const handleBack = () => {
    router.back();
  };

  // Generate HTML for PDF
  const generatePDFHTML = () => {
    const formatDate = (timestamp: string) => {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };

    const logsHTML = logs.map(log => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${formatDate(log.timestamp)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${log.activity_type_display}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${log.performed_by_name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${log.performed_by_role_display || 'N/A'}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Activity Log - ${deviceName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #1a1a2e; margin-bottom: 5px; }
            .subtitle { color: #666; margin-bottom: 20px; }
            .stats { display: flex; gap: 20px; margin-bottom: 20px; }
            .stat-card { background: #f3f4f6; padding: 15px; border-radius: 8px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #1a1a2e; }
            .stat-label { color: #666; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #1a1a2e; color: white; padding: 12px; text-align: left; }
            tr:nth-child(even) { background: #f9fafb; }
            .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Activity Log</h1>
          <p class="subtitle">${deviceName} • Generated on ${new Date().toLocaleDateString()}</p>
          
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value">${lockCount}</div>
              <div class="stat-label">Total Locks</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${unlockCount}</div>
              <div class="stat-label">Total Unlocks</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${failedAttempts}</div>
              <div class="stat-label">Failed Attempts</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${logs.length}</div>
              <div class="stat-label">Total Events</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Event</th>
                <th>User</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              ${logsHTML}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Generated by Beysmart App</p>
          </div>
        </body>
      </html>
    `;
  };

  const handleExportPDF = async () => {
    if (logs.length === 0) {
      Alert.alert('No Data', 'There are no activity logs to export.');
      return;
    }

    try {
      const html = generatePDFHTML();
      const { uri } = await Print.printToFileAsync({ html });
      
      // Create file in document directory with proper name
      const fileName = `ActivityLog_${deviceName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      const sourceFile = new File(uri);
      const destFile = new File(Paths.document, fileName);
      
      // Delete existing file if it exists to avoid FileAlreadyExistsException
      try {
        await destFile.delete();
      } catch {
        // File doesn't exist, ignore error
      }
      
      // Move the file to document directory
      await sourceFile.move(destFile);

      // Show success message with options to open or share
      Alert.alert(
        'PDF Exported Successfully',
        `File saved as: ${fileName}`,
        [
          {
            text: 'Later',
            style: 'cancel',
          },
          {
            text: 'Open',
            onPress: async () => {
              try {
                // Use print to preview/open the PDF
                await Print.printAsync({
                  uri: destFile.uri,
                });
              } catch (error) {
                console.error('Error opening PDF:', error);
                Alert.alert('Error', 'Cannot open PDF on this device.');
              }
            },
          },
          {
            text: 'Share',
            onPress: async () => {
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(destFile.uri, {
                  mimeType: 'application/pdf',
                  dialogTitle: 'Share Activity Log PDF',
                });
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export PDF. Please try again.');
    }
  };

  const handleShareLog = async () => {
    if (logs.length === 0) {
      Alert.alert('No Data', 'There are no activity logs to share.');
      return;
    }

    try {
      // Create a text summary of the logs
      const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      };

      let shareText = `📋 Activity Log - ${deviceName}\n`;
      shareText += `Generated: ${new Date().toLocaleDateString()}\n\n`;
      shareText += `📊 Summary:\n`;
      shareText += `• Total Events: ${logs.length}\n`;
      shareText += `• Locks: ${lockCount}\n`;
      shareText += `• Unlocks: ${unlockCount}\n`;
      shareText += `• Failed Attempts: ${failedAttempts}\n\n`;
      shareText += `📝 Recent Activity:\n`;
      shareText += `${'─'.repeat(30)}\n`;
      
      // Include up to 20 recent logs
      const recentLogs = logs.slice(0, 20);
      recentLogs.forEach(log => {
        const icon = log.activity_type === 'lock' ? '🔒' : 
                     log.activity_type === 'unlock' ? '🔓' : 
                     log.activity_type === 'failed_attempt' ? '❌' : '📌';
        shareText += `${icon} ${formatDate(log.timestamp)}\n`;
        shareText += `   ${log.activity_type_display} by ${log.performed_by_name}\n\n`;
      });

      if (logs.length > 20) {
        shareText += `... and ${logs.length - 20} more events\n`;
      }

      shareText += `\n🏠 Powered by Beysmart`;

      // Create a temporary text file in cache directory
      const fileName = `ActivityLog_${deviceName.replace(/\s+/g, '_')}.txt`;
      const file = new File(Paths.cache, fileName);
      
      await file.write(shareText);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/plain',
          dialogTitle: 'Share Activity Log',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Error sharing log:', error);
      Alert.alert('Error', 'Failed to share log. Please try again.');
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Bottom navigation
  const bottomNavItems = [
    { key: 'home', label: 'Home', icon: null },
    { key: 'devices', label: 'Devices', icon: null },
    { key: 'energy', label: 'Energy', icon: null },
    { key: 'profile', label: 'Profile', icon: null },
  ];

  const handleTabPress = (key: string) => {
    setActiveTab(key);
    if (key === 'home') {
      router.push('/(app)/home');
    } else if (key === 'devices') {
      router.push('/(HomePage_actions)/MyDevices' as any);
    } else if (key === 'energy') {
      console.log('Navigate to energy');
    } else if (key === 'profile') {
      router.push('/(profile actions)/Profile');
    }
  };

  // Render activity log item
  const renderLogItem = ({ item }: { item: ActivityLogItem }) => {
    const isLock = item.activity_type === 'lock' || item.activity_type === 'auto_lock';
    const isUnlock = item.activity_type === 'unlock' || item.activity_type.startsWith('unlock_');
    const isFailed = item.activity_type === 'failed_attempt';
    
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: Spacing.sm,
          marginBottom: Spacing.xs,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: Spacing.sm,
            flexShrink: 0,
          }}
        >
          {isLock && <Locked width={20} height={20} color={colors.text} />}
          {isUnlock && <Unlocked width={20} height={20} color={colors.text} />}
          {isFailed && <Failed width={20} height={20} color={colors.error} />}
          {!isLock && !isUnlock && !isFailed && (
            <Unlocked width={20} height={20} color={colors.text} />
          )}
        </View>
        
        <View style={{ flex: 1, marginRight: Spacing.sm, minWidth: 0 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 4,
            }}
          >
            <Typography 
              variant="body" 
              color={colors.text} 
              style={{ 
                fontWeight: '500',
                flex: 1,
                marginRight: Spacing.xs,
                flexWrap: 'wrap',
              }}
              numberOfLines={2}
            >
              {deviceName} {item.activity_type_display}
            </Typography>
            <Typography 
              variant="caption" 
              color={colors.secondaryText}
              style={{ flexShrink: 0 }}
            >
              {formatTime(item.timestamp)}
            </Typography>
          </View>
          <Typography 
            variant="caption" 
            color={colors.secondaryText}
            numberOfLines={1}
          >
            By {item.performed_by_name} via Bluetooth
          </Typography>
        </View>
        
        {item.performed_by_photo ? (
          <Image 
            source={{ uri: item.performed_by_photo }} 
            style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 20,
              flexShrink: 0,
            }}
          />
        ) : (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.secondary.base,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Typography variant="caption" color={colors.surface}>
              {item.performed_by_name.charAt(0).toUpperCase()}
            </Typography>
          </View>
        )}
      </View>
    );
  };

  // Filter Modal Component
  const FilterModal = ({
    visible,
    onClose,
    title,
    options,
    selectedValue,
    onSelect,
  }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    options: { key: string; label: string }[];
    selectedValue: string;
    onSelect: (value: string) => void;
  }) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: Spacing.lg,
            width: '80%',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.navBarBackground,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: Spacing.md,
            }}
          >
            <Filter width={20} height={20} color={colors.primary.base} />
          </View>
          <Typography variant="h3" color={colors.text} style={{ marginBottom: Spacing.md }}>
            {title}
          </Typography>
          
          {options.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                paddingVertical: Spacing.sm,
              }}
              onPress={() => onSelect(option.key)}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: selectedValue === option.key ? colors.primary.base : colors.border,
                  backgroundColor: selectedValue === option.key ? colors.primary.base : 'transparent',
                  marginRight: Spacing.sm,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedValue === option.key && (
                  <Typography variant="caption" color={colors.surface}>✓</Typography>
                )}
              </View>
              <Typography variant="body" color={colors.text}>
                {option.label}
              </Typography>
            </TouchableOpacity>
          ))}
          
          <View
            style={{
              flexDirection: 'row',
              marginTop: Spacing.md,
              width: '100%',
            }}
          >
            <TouchableOpacity 
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: Spacing.sm,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                marginRight: Spacing.sm,
              }} 
              onPress={onClose}
            >
              <Typography variant="body" color={colors.secondaryText}>
                Cancel
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: Spacing.sm,
                borderRadius: 8,
                backgroundColor: colors.primary.base,
              }} 
              onPress={onClose}
            >
              <Typography variant="body" color={colors.text}>
                Apply
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.navBarBackground }}>
        <View
          style={{
            backgroundColor: colors.navBarBackground,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={handleBack} 
              style={{ padding: Spacing.xs, marginRight: Spacing.sm }}
              accessibilityLabel="Go back"
            >
              <BackArrow width={24} height={24} color={colors.surface} />
            </TouchableOpacity>
            <View>
              <Typography variant="body" color={colors.surface} style={{ fontWeight: '600' }}>
                Activity Log
              </Typography>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Typography variant="caption" color={colors.surface}>
                  {deviceName}
                </Typography>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10,
                    marginLeft: 8,
                    backgroundColor: isConnected ? colors.primary.base : colors.disconnectedPrimary,
                  }}
                >
                  <Typography 
                    variant="caption" 
                    color={isConnected ? colors.text : colors.surface}
                    style={{ fontSize: 10 }}
                  >
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Typography>
                </View>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: Spacing.sm }}>
        {/* Today's Activity Section */}
        <View style={{ marginTop: Spacing.sm }}>
          <Typography variant="body" color={colors.secondaryText} style={{ marginBottom: Spacing.xs }}>
            Today's Activity
          </Typography>
          
          {/* Failed Attempts Card */}
          {failedAttempts > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: Spacing.sm,
                marginBottom: Spacing.xs,
                borderLeftWidth: 4,
                borderLeftColor: colors.error,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#FEE2E2',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: Spacing.sm,
                  }}
                >
                  <Failed width={16} height={16} color={colors.error} />
                </View>
                <View>
                  <Typography variant="body" color={colors.text}>
                    {failedAttempts} Failed Attempts
                  </Typography>
                  {failedAttemptsTime && (
                    <Typography variant="caption" color={colors.secondaryText}>
                      {failedAttemptsTime}
                    </Typography>
                  )}
                </View>
              </View>
            </View>
          )}
          
          {/* Statistics Card */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: Spacing.sm,
              marginBottom: Spacing.sm,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#DBEAFE',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: Spacing.sm,
              }}
            >
              <Statistics width={16} height={16} color={colors.info} />
            </View>
            <View style={{ flex: 1, flexDirection: 'column' }}>
              <Typography variant="body" color={colors.text}>
                {lockCount} Locks • {unlockCount} Unlocks
              </Typography>
              {lastActivityTime && (
                <Typography variant="caption" color={colors.secondaryText}>
                  Last activity at {lastActivityTime}
                </Typography>
              )}
            </View>
          </View>
        </View>

        {/* Filter Buttons - Days, Events, Users */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.sm }}>
          {/* Period Filter Button */}
          <TouchableOpacity 
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: colors.surface,
              marginRight: Spacing.xs,
              marginBottom: Spacing.xs,
              borderWidth: 1,
              borderColor: colors.border,
              flex: 1,
              minWidth: '30%',
            }}
            onPress={() => setShowPeriodFilterModal(true)}
          >
            <Filter width={14} height={14} color={colors.secondaryText} />
            <Typography 
              variant="caption" 
              color={colors.secondaryText} 
              style={{ marginLeft: 6, fontSize: 12 }}
              numberOfLines={1}
            >
              {PERIOD_OPTIONS.find(p => p.key === selectedPeriod)?.label || 'Today'}
            </Typography>
          </TouchableOpacity>
          
          {/* Event Filter Button */}
          <TouchableOpacity 
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: colors.surface,
              marginRight: Spacing.xs,
              marginBottom: Spacing.xs,
              borderWidth: 1,
              borderColor: colors.border,
              flex: 1,
              minWidth: '30%',
            }}
            onPress={() => setShowEventFilterModal(true)}
          >
            <Filter width={14} height={14} color={colors.secondaryText} />
            <Typography 
              variant="caption" 
              color={colors.secondaryText} 
              style={{ marginLeft: 6, fontSize: 12 }}
              numberOfLines={1}
            >
              {EVENT_OPTIONS.find(e => e.key === selectedEventFilter)?.label || 'All Events'}
            </Typography>
          </TouchableOpacity>
          
          {/* User Filter Button */}
          <TouchableOpacity 
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: colors.surface,
              marginBottom: Spacing.xs,
              borderWidth: 1,
              borderColor: colors.border,
              flex: 1,
              minWidth: '30%',
            }}
            onPress={() => setShowUserFilterModal(true)}
          >
            <UsersIcon width={14} height={14} color={colors.secondaryText} />
            <Typography 
              variant="caption" 
              color={colors.secondaryText} 
              style={{ marginLeft: 6, fontSize: 12 }}
              numberOfLines={1}
            >
              {USER_OPTIONS.find(u => u.key === selectedUserFilter)?.label || 'All Users'}
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Activity Log List */}
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary.base} />
          </View>
        ) : (
          <FlatList
            data={logs}
            renderItem={renderLogItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: Spacing.lg }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary.base]}
              />
            }
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl }}>
                <Typography variant="body" color={colors.secondaryText}>
                  No activity logs found
                </Typography>
              </View>
            }
          />
        )}

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', marginBottom: Spacing.md }}>
          <TouchableOpacity 
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary.base,
              borderRadius: 12,
              paddingVertical: Spacing.md,
              marginRight: Spacing.sm,
            }} 
            onPress={handleExportPDF}
          >
            <ExportIcon width={20} height={20} color={colors.text} />
            <Typography variant="body" color={colors.text} style={{ marginLeft: Spacing.sm, fontWeight: '600' }}>
              Export as PDF
            </Typography>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
              borderRadius: 12,
              paddingVertical: Spacing.md,
              borderWidth: 1,
              borderColor: colors.border,
            }} 
            onPress={handleShareLog}
          >
            <ShareIcon width={20} height={20} color={colors.text} />
            <Typography variant="body" color={colors.text} style={{ marginLeft: Spacing.sm, fontWeight: '600' }}>
              Share Log
            </Typography>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation
        items={bottomNavItems}
        activeKey={activeTab}
        onTabPress={handleTabPress}
        profile_picture={user?.profile_picture}
      />

      {/* Filter Modals */}
      <FilterModal
        visible={showPeriodFilterModal}
        onClose={() => setShowPeriodFilterModal(false)}
        title="Filter by Period"
        options={PERIOD_OPTIONS}
        selectedValue={selectedPeriod}
        onSelect={setSelectedPeriod}
      />
      
      <FilterModal
        visible={showEventFilterModal}
        onClose={() => setShowEventFilterModal(false)}
        title="Filter Events"
        options={EVENT_OPTIONS}
        selectedValue={selectedEventFilter}
        onSelect={setSelectedEventFilter}
      />
      
      <FilterModal
        visible={showUserFilterModal}
        onClose={() => setShowUserFilterModal(false)}
        title="Filter by users"
        options={USER_OPTIONS}
        selectedValue={selectedUserFilter}
        onSelect={setSelectedUserFilter}
      />
    </View>
  );
};

export default ActivityLogScreen;
