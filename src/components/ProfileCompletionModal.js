import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const ProfileCompletionModal = ({ visible, onClose, onEditProfile }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header with gradient */}
          <LinearGradient
            colors={[colors.primary, '#2D5A47']}
            style={styles.headerGradient}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="person-circle-outline" size={60} color={colors.surface} />
            </View>
          </LinearGradient>

          {/* Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.message}>
              Welcome! Let's set up your profile to help you find the perfect property.
            </Text>

            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                </View>
                <Text style={styles.benefitText}>Better recommendations</Text>
              </View>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                </View>
                <Text style={styles.benefitText}>Connect with hosts easily</Text>
              </View>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                </View>
                <Text style={styles.benefitText}>Faster booking process</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={onEditProfile}>
              <Text style={styles.primaryButtonText}>Complete Profile</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.surface} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  headerGradient: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  benefitsContainer: {
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
    marginRight: 8,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default ProfileCompletionModal;
