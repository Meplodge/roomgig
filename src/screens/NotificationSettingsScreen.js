import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { requestNotificationPermissions, isNotificationsAvailable } from '../services/notificationService';

const NOTIFICATION_SETTINGS_KEY = '@roomgig_notification_settings';

const defaultSettings = {
  pushEnabled: true,
  messages: true,
  bookings: true,
  payments: true,
  newListings: true,
  priceDrops: true,
  reviews: true,
  promotions: true,
  systemUpdates: true,
  sound: true,
  vibration: true,
};

const NotificationSettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    loadSettings();
    checkPermissions();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (saved) {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.log('Error loading notification settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.log('Error saving notification settings:', error);
    }
  };

  const checkPermissions = async () => {
    const granted = await requestNotificationPermissions();
    setPermissionGranted(granted);
  };

  const toggleSetting = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const toggleMasterSwitch = async () => {
    if (!settings.pushEnabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive push notifications.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    
    const newSettings = { ...settings, pushEnabled: !settings.pushEnabled };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const SettingItem = ({ icon, title, description, value, onToggle, disabled }) => (
    <View style={[styles.settingItem, disabled && styles.settingItemDisabled]}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={22} color={disabled ? colors.textSecondary : colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, disabled && styles.settingTitleDisabled]}>{title}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primarySoft }}
        thumbColor={value ? colors.primary : colors.textSecondary}
        disabled={disabled}
      />
    </View>
  );

  const notificationTypes = [
    {
      key: 'messages',
      icon: 'chatbubble',
      title: 'Messages',
      description: 'New messages from landlords and tenants',
    },
    {
      key: 'bookings',
      icon: 'calendar',
      title: 'Bookings',
      description: 'Booking confirmations and updates',
    },
    {
      key: 'payments',
      icon: 'card',
      title: 'Payments',
      description: 'Payment reminders and confirmations',
    },
    {
      key: 'newListings',
      icon: 'home',
      title: 'New Listings',
      description: 'Properties matching your saved searches',
    },
    {
      key: 'priceDrops',
      icon: 'pricetag',
      title: 'Price Drops',
      description: 'Price changes on saved properties',
    },
    {
      key: 'reviews',
      icon: 'star',
      title: 'Reviews',
      description: 'New reviews on your properties',
    },
    {
      key: 'promotions',
      icon: 'gift',
      title: 'Promotions',
      description: 'Special offers and discounts',
    },
    {
      key: 'systemUpdates',
      icon: 'information-circle',
      title: 'System Updates',
      description: 'App updates and important announcements',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notification Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {!isNotificationsAvailable() && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={20} color="#FF9800" />
            <Text style={styles.warningText}>
              Push notifications are only available in development or production builds.
            </Text>
          </View>
        )}

        <View style={styles.masterSection}>
          <View style={styles.masterContent}>
            <View style={styles.masterIcon}>
              <Ionicons name="notifications" size={28} color={colors.surface} />
            </View>
            <View style={styles.masterText}>
              <Text style={styles.masterTitle}>Push Notifications</Text>
              <Text style={styles.masterDescription}>
                {settings.pushEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>
          <Switch
            value={settings.pushEnabled}
            onValueChange={toggleMasterSwitch}
            trackColor={{ false: colors.border, true: colors.primarySoft }}
            thumbColor={settings.pushEnabled ? colors.primary : colors.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          <View style={styles.sectionContent}>
            {notificationTypes.map((item) => (
              <SettingItem
                key={item.key}
                icon={item.icon}
                title={item.title}
                description={item.description}
                value={settings[item.key]}
                onToggle={() => toggleSetting(item.key)}
                disabled={!settings.pushEnabled}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Style</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="volume-high"
              title="Sound"
              description="Play sound for notifications"
              value={settings.sound}
              onToggle={() => toggleSetting('sound')}
              disabled={!settings.pushEnabled}
            />
            <SettingItem
              icon="phone-portrait"
              title="Vibration"
              description="Vibrate for notifications"
              value={settings.vibration}
              onToggle={() => toggleSetting('vibration')}
              disabled={!settings.pushEnabled}
            />
          </View>
        </View>

        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            You can also manage notification permissions in your device settings.
          </Text>
        </View>
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
  placeholder: {
    width: 44,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
  },
  masterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
  },
  masterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  masterIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  masterText: {
    flex: 1,
  },
  masterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.surface,
  },
  masterDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  settingTitleDisabled: {
    color: colors.textSecondary,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default NotificationSettingsScreen;
