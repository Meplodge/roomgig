import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

const PrivacySecurityScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);
  const [profileVisible, setProfileVisible] = React.useState(true);
  const [locationSharing, setLocationSharing] = React.useState(true);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const twoFactor = await AsyncStorage.getItem('twoFactorEnabled');
      const profile = await AsyncStorage.getItem('profileVisible');
      const location = await AsyncStorage.getItem('locationSharing');
      
      if (twoFactor !== null) setTwoFactorEnabled(twoFactor === 'true');
      if (profile !== null) setProfileVisible(profile === 'true');
      if (location !== null) setLocationSharing(location === 'true');
    } catch (error) {
      console.log('Error loading privacy settings:', error);
    }
  };

  const toggleTwoFactor = async (value) => {
    setTwoFactorEnabled(value);
    try {
      await AsyncStorage.setItem('twoFactorEnabled', value.toString());
    } catch (error) {
      console.log('Error saving two-factor setting:', error);
    }
  };

  const toggleProfileVisibility = async (value) => {
    setProfileVisible(value);
    try {
      await AsyncStorage.setItem('profileVisible', value.toString());
    } catch (error) {
      console.log('Error saving profile visibility setting:', error);
    }
  };

  const toggleLocationSharing = async (value) => {
    setLocationSharing(value);
    try {
      await AsyncStorage.setItem('locationSharing', value.toString());
    } catch (error) {
      console.log('Error saving location sharing setting:', error);
    }
  };

  const handleBlockedUsers = () => {
    Alert.alert('Blocked Users', 'This feature is coming soon.');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleBiometricLogin = () => {
    Alert.alert('Biometric Login', 'This feature is coming soon.');
  };

  const handleDownloadData = () => {
    Alert.alert('Download My Data', 'This feature is coming soon.');
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = () => {
    setShowDeleteModal(false);
    Alert.alert('Account Deletion', 'This feature is coming soon.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy & Security</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconWrapper}>
                  <Ionicons name="eye-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.settingLabel}>Profile Visibility</Text>
              </View>
              <Switch
                value={profileVisible}
                onValueChange={toggleProfileVisibility}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
            <View style={[styles.settingItem, styles.settingItemBorder]}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconWrapper}>
                  <Ionicons name="location-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.settingLabel}>Location Sharing</Text>
              </View>
              <Switch
                value={locationSharing}
                onValueChange={toggleLocationSharing}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
            <TouchableOpacity style={styles.settingItem} onPress={handleBlockedUsers}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.settingLabel}>Blocked Users</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconWrapper}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
              </View>
              <Switch
                value={twoFactorEnabled}
                onValueChange={toggleTwoFactor}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
            <TouchableOpacity style={[styles.settingItem, styles.settingItemBorder]} onPress={handleChangePassword}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconWrapper}>
                  <Ionicons name="key-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.settingLabel}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={handleBiometricLogin}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconWrapper}>
                  <Ionicons name="finger-print-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.settingLabel}>Biometric Login</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingItem} onPress={handleDownloadData}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconWrapper}>
                  <Ionicons name="download-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.settingLabel}>Download My Data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingItem, styles.settingItemBorder]} onPress={handleDeleteAccount}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconWrapper}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </View>
                <Text style={[styles.settingLabel, styles.dangerText]}>Delete Account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrapper}>
              <Ionicons name="warning" size={48} color={colors.error} />
            </View>
            <Text style={styles.modalTitle}>Delete Account?</Text>
            <Text style={styles.modalMessage}>
              This action cannot be undone. All your data, including properties, bookings, and messages, will be permanently deleted.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={confirmDeleteAccount}
              >
                <Text style={styles.modalDeleteText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  dangerText: {
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  modalDeleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDeleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PrivacySecurityScreen;
