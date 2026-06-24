import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useAppData } from '../context/AppDataContext';
import { deleteProperty, getUserProperties } from '../services/supabaseApi';
import PropertyCard from '../components/PropertyCard';
import { useAuth } from '../context/AuthContext';

const MyPropertyListingsScreen = ({ navigation }) => {
  const { refreshProperties } = useAppData();
  const { user } = useAuth();
  const [userProperties, setUserProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  useEffect(() => {
    loadUserProperties();
  }, [user]);

  const loadUserProperties = async () => {
    if (!user) {
      setUserProperties([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getUserProperties(user.id);
      setUserProperties(data);
    } catch (error) {
      console.error('Error loading user properties:', error);
      Alert.alert('Error', 'Failed to load your properties');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (propertyId, propertyName) => {
    setPropertyToDelete({ id: propertyId, name: propertyName });
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;
    setDeletingId(propertyToDelete.id);
    setDeleteModalVisible(false);
    try {
      await deleteProperty(propertyToDelete.id);
      await loadUserProperties();
      Alert.alert('Success', 'Property deleted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete property');
    } finally {
      setDeletingId(null);
      setPropertyToDelete(null);
    }
  };

  const handleEdit = (property) => {
    navigation.navigate('AddProperty', { property, isEditing: true });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Property Listings</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddProperty')}
        >
          <Ionicons name="add" size={24} color={colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Listings */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your properties...</Text>
          </View>
        ) : userProperties.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="home-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Properties Yet</Text>
            <Text style={styles.emptyMessage}>
              You haven't added any property listings yet.
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('AddProperty')}
            >
              <Text style={styles.createButtonText}>Add Your First Property</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {userProperties.length} {userProperties.length === 1 ? 'property' : 'properties'}
            </Text>
            {userProperties.map((property) => (
              <View key={property.id} style={styles.propertyCardWrapper}>
                <PropertyCard
                  property={property}
                  onPress={() => navigation.navigate('PropertyDetails', { property })}
                />
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEdit(property)}
                  >
                    <Ionicons name="create-outline" size={18} color={colors.primary} />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      deletingId === property.id && styles.deleteButtonDisabled,
                    ]}
                    onPress={() => handleDelete(property.id, property.name || property.title)}
                    disabled={deletingId === property.id}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={deletingId === property.id ? colors.textSecondary : colors.accent}
                    />
                    <Text
                      style={[
                        styles.deleteButtonText,
                        deletingId === property.id && styles.deleteButtonTextDisabled,
                      ]}
                    >
                      {deletingId === property.id ? 'Deleting...' : 'Delete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

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
            <Text style={styles.modalTitle}>Delete Property</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete "{propertyToDelete?.name || 'this property'}"? This action cannot be undone.
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
              >
                <Text style={styles.modalDeleteText}>Delete</Text>
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
  propertyCardWrapper: {
    marginBottom: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
    borderColor: colors.border,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  deleteButtonTextDisabled: {
    color: colors.textSecondary,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 16,
  },
});

export default MyPropertyListingsScreen;
