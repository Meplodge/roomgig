import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { getUserRoommateListings, deleteRoommateListing } from '../services/supabaseApi';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600';

const MyRoommateListingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);

  const fetchListings = useCallback(async () => {
    if (!user?.id) {
      setListings([]);
      setLoading(false);
      return;
    }
    try {
      const data = await getUserRoommateListings(user.id);
      setListings(data);
    } catch (error) {
      console.error('Error fetching my roommate listings:', error);
      Alert.alert('Error', 'Failed to load your listings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchListings();
    }, [fetchListings])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const handleEdit = (listing) => {
    navigation.navigate('PostRoommateListing', { listing, isEdit: true });
  };

  const handleDelete = (listingId) => {
    setListingToDelete(listingId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await deleteRoommateListing(listingToDelete);
      setListings(listings.filter(l => l.id !== listingToDelete));
      setDeleteModalVisible(false);
      setListingToDelete(null);
      Alert.alert('Success', 'Listing deleted successfully');
    } catch (error) {
      console.error('Error deleting listing:', error);
      Alert.alert('Error', 'Failed to delete listing. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const renderListing = (listing) => (
    <View key={listing.id} style={styles.listingCard}>
      <Image source={{ uri: listing.images?.[0] || PLACEHOLDER_IMAGE }} style={styles.listingImage} />
      <View style={styles.listingContent}>
        <View style={styles.listingHeader}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{listing.type}</Text>
          </View>
          <Text style={styles.price}>${listing.price}/mo</Text>
        </View>
        <Text style={styles.listingTitle} numberOfLines={2}>{listing.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.location}>{listing.location}</Text>
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
          <Text style={styles.statusText}>{listing.available}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEdit(listing)}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(listing.id)}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Roommate Listings</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('PostRoommateListing')}
        >
          <Ionicons name="add" size={24} color={colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Listings */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        {listings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="home-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Listings Yet</Text>
            <Text style={styles.emptyMessage}>
              You haven't posted any roommate listings yet.
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('PostRoommateListing')}
            >
              <Text style={styles.createButtonText}>Create Your First Listing</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {listings.length} {listings.length === 1 ? 'listing' : 'listings'}
            </Text>
            {listings.map(renderListing)}
          </>
        )}
      </ScrollView>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="trash-outline" size={48} color={colors.error} />
            </View>
            <Text style={styles.modalTitle}>Delete Listing</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this listing? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={styles.modalDeleteText}>Delete</Text>
                )}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  listingCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  listingImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.border,
  },
  listingContent: {
    padding: 20,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
    lineHeight: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderRadius: 16,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  modalDeleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface,
  },
});

export default MyRoommateListingsScreen;
