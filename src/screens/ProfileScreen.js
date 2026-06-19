import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import BottomNavBar from '../components/BottomNavBar';
import { useAuth } from '../context/AuthContext';

const menuSections = [
  {
    title: 'Account',
    items: [
      { icon: 'person-outline', label: 'Edit Profile', route: 'EditProfile' },
      { icon: 'card-outline', label: 'Payment Methods', route: 'PaymentMethods' },
      { icon: 'home-outline', label: 'My Listings', route: 'MyRoommateListings' },
      { icon: 'time-outline', label: 'Booking History', route: 'BookingHistory' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: 'notifications-outline', label: 'Notifications' },
      { icon: 'lock-closed-outline', label: 'Privacy & Security', route: 'PrivacySecurity' },
      { icon: 'help-circle-outline', label: 'Help & Support', route: 'HelpSupport' },
      { icon: 'settings-outline', label: 'Settings', route: 'Settings' },
    ],
  },
];

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const formatName = (name) =>
    (name || 'User').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: user?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{formatName(user?.name)}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={16} color={colors.surface} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>48</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    index !== section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => item.route && navigation.navigate(item.route)}
                >
                  <View style={styles.menuIconWrapper}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNavBar activeTab="profile" navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 14,
    backgroundColor: colors.border,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  editButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
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
});

export default ProfileScreen;
