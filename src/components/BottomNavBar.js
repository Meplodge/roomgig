import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Keyboard, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const TAB_ROUTES = {
  home: 'Home',
  location: 'MapScreen',
  roommate: 'RoommateFinder',
  messages: 'ChatList',
  profile: 'Profile',
};

const BottomNavBar = ({ activeTab, onTabPress, navigation }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { id: 'location', label: 'Explore', icon: 'location-outline', activeIcon: 'location' },
    { id: 'roommate', label: 'Roommate', icon: 'people-outline', activeIcon: 'people' },
    { id: 'messages', label: 'Messages', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
    { id: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
  ];

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handlePress = (tab) => {
    if (onTabPress) {
      onTabPress(tab.id);
    } else if (navigation && tab.id !== activeTab) {
      navigation.navigate(TAB_ROUTES[tab.id]);
    }
  };

  if (keyboardVisible) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => handlePress(tab)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={22}
                  color={isActive ? colors.surface : colors.textSecondary}
                />
              </View>
              <Text style={[styles.label, isActive && styles.activeLabel]}>{tab.label}</Text>
              {tab.id === 'messages' && (
                <View style={styles.notificationBadge} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 32,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconWrapper: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  label: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 11,
    marginTop: 0.3,
  },
  activeLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default BottomNavBar;
