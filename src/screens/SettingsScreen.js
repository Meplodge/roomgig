import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  getDeviceId,
  getDeviceBinding,
  removeDeviceBinding,
} from '../utils/deviceUtils';
import * as Device from 'expo-device';

const SettingsScreen = ({ navigation }) => {
  const { logout, user } = useAuth();
  const { scheme, toggleDarkMode } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [locationEnabled, setLocationEnabled] = React.useState(true);
  const [deviceInfo, setDeviceInfo] = React.useState(null);
  const [deviceBinding, setDeviceBinding] = React.useState(null);

  React.useEffect(() => {
    loadSettings();
    loadDeviceInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const notifications = await AsyncStorage.getItem('notificationsEnabled');
      const location = await AsyncStorage.getItem('locationEnabled');
      
      if (notifications !== null) setNotificationsEnabled(notifications === 'true');
      if (location !== null) setLocationEnabled(location === 'true');
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const toggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    try {
      await AsyncStorage.setItem('notificationsEnabled', value.toString());
    } catch (error) {
      console.log('Error saving notifications setting:', error);
    }
  };

  const toggleLocation = async (value) => {
    setLocationEnabled(value);
    try {
      await AsyncStorage.setItem('locationEnabled', value.toString());
    } catch (error) {
      console.log('Error saving location setting:', error);
    }
  };

  const loadDeviceInfo = async () => {
    try {
      const deviceId = await getDeviceId();
      const binding = await getDeviceBinding();
      
      setDeviceInfo({
        deviceId: deviceId,
        deviceName: Device.deviceName || 'Unknown Device',
        manufacturer: Device.manufacturer || 'Unknown',
        model: Device.model || 'Unknown',
        osVersion: Device.osVersion || 'Unknown',
        platform: Device.platformName || 'Unknown',
      });
      
      setDeviceBinding(binding);
    } catch (error) {
      console.log('Error loading device info:', error);
    }
  };

  const handleUnbindDevice = async () => {
    try {
      await removeDeviceBinding();
      setDeviceBinding(null);
      loadDeviceInfo();
    } catch (error) {
      console.log('Error unbinding device:', error);
    }
  };

  const settingsSections = React.useMemo(() => [
    {
      title: 'Preferences',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Push Notifications',
          type: 'switch',
          value: notificationsEnabled,
          onValueChange: toggleNotifications,
        },
        {
          icon: 'moon-outline',
          label: 'Dark Mode',
          type: 'switch',
          value: scheme === 'dark',
          onValueChange: toggleDarkMode,
        },
        {
          icon: 'location-outline',
          label: 'Location Services',
          type: 'switch',
          value: locationEnabled,
          onValueChange: toggleLocation,
        },
      ],
    },
    {
      title: 'Device Information',
      items: [
        {
          icon: 'phone-portrait-outline',
          label: 'Device Name',
          type: 'info',
          value: deviceInfo?.deviceName || 'Loading...',
        },
        {
          icon: 'build-outline',
          label: 'Manufacturer',
          type: 'info',
          value: deviceInfo?.manufacturer || 'Loading...',
        },
        {
          icon: 'hardware-chip-outline',
          label: 'Model',
          type: 'info',
          value: deviceInfo?.model || 'Loading...',
        },
        {
          icon: 'code-working-outline',
          label: 'OS Version',
          type: 'info',
          value: deviceInfo?.osVersion || 'Loading...',
        },
        {
          icon: 'fingerprint-outline',
          label: 'Device ID',
          type: 'info',
          value: deviceInfo?.deviceId ? deviceInfo.deviceId.substring(0, 20) + '...' : 'Loading...',
        },
        {
          icon: 'link-outline',
          label: 'Device Status',
          type: 'info',
          value: deviceBinding ? 'Bound to account' : 'Not bound',
          valueColor: deviceBinding ? colors.success : colors.textSecondary,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: 'lock-closed-outline',
          label: 'Change Password',
          type: 'navigation',
          route: 'ChangePassword',
        },
        {
          icon: 'shield-outline',
          label: 'Privacy Settings',
          type: 'navigation',
          route: 'PrivacySecurity',
        },
        {
          icon: 'document-text-outline',
          label: 'Terms of Service',
          type: 'navigation',
          route: 'TermsOfService',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          label: 'Help Center',
          type: 'navigation',
          route: 'HelpSupport',
        },
        {
          icon: 'chatbubble-outline',
          label: 'Contact Support',
          type: 'navigation',
          route: 'HelpSupport',
        },
        {
          icon: 'information-circle-outline',
          label: 'About',
          type: 'navigation',
          onPress: () => {},
        },
      ],
    },
  ], [notificationsEnabled, scheme, locationEnabled, deviceInfo, deviceBinding]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.settingsCard}>
              {section.items.map((item, itemIndex) => (
                <View
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex !== section.items.length - 1 && styles.settingItemBorder,
                  ]}
                >
                  <View style={styles.settingLeft}>
                    <View style={styles.settingIconWrapper}>
                      <Ionicons name={item.icon} size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                  </View>
                  {item.type === 'switch' ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onValueChange}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={item.value ? colors.primary : colors.surface}
                    />
                  ) : item.type === 'info' ? (
                    <Text style={[styles.settingValue, item.valueColor && { color: item.valueColor }]}>
                      {item.value}
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={() => item.route ? navigation.navigate(item.route) : item.onPress && item.onPress()}>
                      <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingLabel: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  versionText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default SettingsScreen;
