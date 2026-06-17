import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const TAB_ROUTES = {
  home: 'Home',
  location: 'MapScreen',
  saved: 'Saved',
  messages: 'ChatList',
  profile: 'Profile',
};

const BottomNavBar = ({ activeTab, onTabPress, navigation }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { id: 'location', label: 'Explore', icon: 'location-outline', activeIcon: 'location' },
    { id: 'saved', label: 'Saved', icon: 'heart-outline', activeIcon: 'heart' },
    { id: 'messages', label: 'Messages', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
    { id: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
  ];

  const handlePress = (tab) => {
    if (onTabPress) {
      onTabPress(tab.id);
    } else if (navigation && tab.id !== activeTab) {
      navigation.navigate(TAB_ROUTES[tab.id]);
    }
  };

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
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={22}
                  color={isActive ? colors.surface : colors.textSecondary}
                />
              </View>
              <Text style={[styles.label, isActive && styles.activeLabel]}>{tab.label}</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
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
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
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
});

export default BottomNavBar;
