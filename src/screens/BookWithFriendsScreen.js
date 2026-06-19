import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import ContactsService from '../services/ContactsService';

const BookWithFriendsScreen = ({ route, navigation }) => {
  const { property, withFriends, friends } = route.params || {};
  const [selectedFriends, setSelectedFriends] = useState(friends || []);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const registeredContacts = await ContactsService.getRegisteredContacts();
      setContacts(registeredContacts);
      setPermissionDenied(false);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setPermissionDenied(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    try {
      const granted = await ContactsService.requestContactsPermission();
      if (granted) {
        await loadContacts();
      } else {
        Alert.alert('Permission Denied', 'Contacts permission is required to find friends on Estatery.');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const handleInviteContact = async (contact) => {
    try {
      const success = await ContactsService.sendSMSInvite(
        contact.phone,
        'Your Friend',
        property?.name || 'a property'
      );
      if (success) {
        Alert.alert('Invite Sent', `Invitation sent to ${contact.name}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send invite. SMS may not be available.');
    }
  };

  const toggleFriend = (friendId) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleConfirm = () => {
    navigation.navigate('Booking', { 
      property, 
      withFriends: true,
      friends: selectedFriends 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book with Friends</Text>
        <View style={{ width: 42 }} />
      </View>

      {/* Property Summary */}
      {property && (
        <View style={styles.propertyCard}>
          <Image source={{ uri: property.image }} style={styles.propertyImage} />
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyName}>{property.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.propertyLocation}>{property.location}</Text>
            </View>
            <Text style={styles.propertyPrice}>${property.price.toLocaleString()}/mo</Text>
          </View>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <View style={styles.instructionsHeader}>
          <Ionicons name="people" size={24} color={colors.primary} />
          <Text style={styles.instructionsTitle}>Invite Friends</Text>
        </View>
        <Text style={styles.instructionsText}>
          Select friends you'd like to invite to share this property with. They'll be notified once you complete the booking.
        </Text>
      </View>

      {/* Friends List */}
      <View style={styles.friendsSection}>
        <Text style={styles.sectionTitle}>Your Contacts</Text>
        
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading contacts...</Text>
          </View>
        ) : permissionDenied ? (
          <View style={styles.centerContainer}>
            <Ionicons name="contacts-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.permissionTitle}>Contacts Access Required</Text>
            <Text style={styles.permissionText}>
              We need access to your contacts to find friends who are already on Estatery.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={handleRequestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : contacts.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Contacts Found</Text>
            <Text style={styles.emptyText}>
              Add contacts to your device to find friends on Estatery.
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {contacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={[
                  styles.friendItem,
                  selectedFriends.includes(contact.id) && styles.friendItemSelected,
                ]}
                onPress={() => contact.isRegistered && toggleFriend(contact.id)}
                activeOpacity={0.7}
                disabled={!contact.isRegistered}
              >
                <Image 
                  source={{ 
                    uri: contact.avatar || 'https://via.placeholder.com/52' 
                  }} 
                  style={styles.friendAvatar} 
                />
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{contact.name}</Text>
                  <View style={styles.friendStatusRow}>
                    {contact.isRegistered ? (
                      <View style={styles.registeredBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
                        <Text style={styles.registeredText}>On Estatery</Text>
                      </View>
                    ) : (
                      <Text style={styles.inviteText}>Not on Estatery</Text>
                    )}
                  </View>
                </View>
                {contact.isRegistered ? (
                  <View style={[
                    styles.friendCheckbox,
                    selectedFriends.includes(contact.id) && styles.friendCheckboxChecked,
                  ]}>
                    {selectedFriends.includes(contact.id) && (
                      <Ionicons name="checkmark" size={18} color={colors.surface} />
                    )}
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.inviteButton}
                    onPress={() => handleInviteContact(contact)}
                  >
                    <Ionicons name="mail-outline" size={18} color={colors.primary} />
                    <Text style={styles.inviteButtonText}>Invite</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedCount}>
            {selectedFriends.length} friend{selectedFriends.length !== 1 ? 's' : ''} selected
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            selectedFriends.length === 0 && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={selectedFriends.length === 0}
          activeOpacity={0.9}
        >
          <Text style={styles.confirmButtonText}>
            {selectedFriends.length > 0 ? 'Continue to Booking' : 'Select Friends'}
          </Text>
          {selectedFriends.length > 0 && (
            <Ionicons name="arrow-forward" size={18} color={colors.surface} />
          )}
        </TouchableOpacity>
      </View>
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
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  propertyCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  propertyImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  propertyInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  propertyLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  propertyPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 6,
  },
  instructionsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  friendsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  friendItemSelected: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  friendAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  friendStatus: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  friendStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  registeredText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  inviteText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  inviteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
  },
  permissionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  friendCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendCheckboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.border,
  },
  confirmButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
});

export default BookWithFriendsScreen;
