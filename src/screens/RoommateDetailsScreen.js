import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';

const { width: windowWidth } = Dimensions.get('window');

const RoommateDetailsScreen = ({ route, navigation }) => {
  const { listing } = route.params || {};
  const [selectedTab, setSelectedTab] = useState('About');
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollRef = useRef(null);

  const tabs = ['About', 'Personal Info', 'Lifestyle', 'Amenities'];

  const handleContact = () => {
    setMessageModalVisible(true);
  };

  const confirmMessage = () => {
    setMessageModalVisible(false);
    navigation.navigate('Chat', { userId: listing.postedBy.id });
  };

  const handleBook = () => {
    setRequestModalVisible(true);
  };

  const confirmRequest = () => {
    setRequestModalVisible(false);
    Alert.alert('Success', 'Your request has been sent successfully!');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
              setCurrentImageIndex(index);
            }}
            style={styles.imageScroll}
          >
            {listing.images && listing.images.length > 0 ? (
              listing.images.map((img, index) => (
                <Image key={index} source={{ uri: img }} style={styles.mainImage} />
              ))
            ) : (
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600' }} 
                style={styles.mainImage} 
              />
            )}
          </ScrollView>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.imageGradient}
          />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <View style={styles.backButtonInner}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.favoriteButton}>
            <View style={styles.favoriteButtonInner}>
              <Ionicons name="heart-outline" size={22} color={colors.text} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <View style={styles.shareButtonInner}>
              <Ionicons name="share-outline" size={22} color={colors.text} />
            </View>
          </TouchableOpacity>
          {/* Image Dots */}
          {listing.images && listing.images.length > 1 && (
            <View style={styles.imageDots}>
              {listing.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.imageDot,
                    index === currentImageIndex && styles.imageDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{listing.type}</Text>
            </View>
            <Text style={styles.price}>${listing.price}/mo</Text>
          </View>

          <Text style={styles.title}>{listing.title}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color={colors.primary} />
            <Text style={styles.location}>{listing.location}</Text>
          </View>

          <View style={styles.availabilityRow}>
            <Ionicons name="calendar" size={18} color={colors.primary} />
            <Text style={styles.availability}>{listing.available}</Text>
          </View>

          {/* Posted By */}
          <View style={styles.postedByCard}>
            <Image 
              source={{ 
                uri: listing.postedBy.avatar || listing.images?.[0] || 'https://randomuser.me/api/portraits/lego/1.jpg' 
              }} 
              style={styles.posterAvatar} 
            />
            <View style={styles.posterInfo}>
              <Text style={styles.posterName}>{listing.postedBy.name}</Text>
              <Text style={styles.posterDetails}>{listing.postedBy.age} years old • {listing.postedBy.occupation}</Text>
            </View>
            <TouchableOpacity 
              style={styles.viewProfileButton}
              onPress={() => navigation.navigate('UserProfile', { user: listing.postedBy })}
            >
              <Text style={styles.viewProfileText}>View Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, selectedTab === tab && styles.tabActive]}
                onPress={() => setSelectedTab(tab)}
              >
                <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {selectedTab === 'About' && (
              <View>
                <Text style={styles.sectionTitle}>About This Space</Text>
                <Text style={styles.description}>
                  Looking for a roommate to share this {listing.type.toLowerCase()}. The space is well-maintained and located in a great neighborhood. Perfect for someone who values cleanliness and respect for shared spaces.
                </Text>
              </View>
            )}

            {selectedTab === 'Personal Info' && (
              <View>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                
                <View style={styles.infoRow}>
                  <Ionicons name="moon-outline" size={20} color={colors.primary} />
                  <Text style={styles.infoLabel}>Sleep Schedule:</Text>
                  <Text style={styles.infoValue}>{listing.sleepSchedule || 'Flexible'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
                  <Text style={styles.infoLabel}>Work Schedule:</Text>
                  <Text style={styles.infoValue}>{listing.workSchedule || 'Office'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
                  <Text style={styles.infoLabel}>Dietary Preference:</Text>
                  <Text style={styles.infoValue}>{listing.dietaryPreference || 'Omnivore'}</Text>
                </View>
                
                {listing.languages && (
                  <View style={styles.infoRow}>
                    <Ionicons name="language-outline" size={20} color={colors.primary} />
                    <Text style={styles.infoLabel}>Languages:</Text>
                    <Text style={styles.infoValue}>{listing.languages}</Text>
                  </View>
                )}
                
                <View style={styles.infoRow}>
                  <Ionicons name="people-outline" size={20} color={colors.primary} />
                  <Text style={styles.infoLabel}>Social Style:</Text>
                  <Text style={styles.infoValue}>{listing.socialStyle || 'Ambivert'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
                  <Text style={styles.infoLabel}>Cleanliness Level:</Text>
                  <Text style={styles.infoValue}>{listing.cleanlinessLevel || 'Moderate'}</Text>
                </View>
              </View>
            )}

            {selectedTab === 'Lifestyle' && (
              <View>
                <Text style={styles.sectionTitle}>Lifestyle Preferences</Text>
                
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={20} color={colors.primary} />
                  <Text style={styles.infoLabel}>Guest Policy:</Text>
                  <Text style={styles.infoValue}>{listing.guestPolicy || 'Occasional'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="volume-high-outline" size={20} color={colors.primary} />
                  <Text style={styles.infoLabel}>Noise Tolerance:</Text>
                  <Text style={styles.infoValue}>{listing.noiseTolerance || 'Moderate'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="leaf-outline" size={20} color={colors.primary} />
                  <Text style={styles.infoLabel}>Cooking Habits:</Text>
                  <Text style={styles.infoValue}>{listing.cookingHabits || 'Sometimes'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="wine-outline" size={20} color={colors.primary} />
                  <Text style={styles.infoLabel}>Alcohol Consumption:</Text>
                  <Text style={styles.infoValue}>{listing.alcoholConsumption || 'Social'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="laptop-outline" size={20} color={colors.primary} />
                  <Text style={styles.infoLabel}>Work Environment:</Text>
                  <Text style={styles.infoValue}>{listing.workEnvironment || 'Moderate Noise'}</Text>
                </View>
                
                {listing.dietaryAllergies && (
                  <View style={styles.infoRow}>
                    <Ionicons name="alert-circle-outline" size={20} color={colors.primary} />
                    <Text style={styles.infoLabel}>Dietary Allergies:</Text>
                    <Text style={styles.infoValue}>{listing.dietaryAllergies}</Text>
                  </View>
                )}
              </View>
            )}

            {selectedTab === 'Amenities' && (
              <View>
                <Text style={styles.sectionTitle}>Available Amenities</Text>
                <View style={styles.amenitiesGrid}>
                  {listing.amenities.map((amenity, index) => (
                    <View key={index} style={styles.amenityItem}>
                      <View style={styles.amenityIcon}>
                        <Ionicons name="checkmark" size={18} color={colors.surface} />
                      </View>
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                </View>
                
                {/* Property Photos */}
                {listing.images && listing.images.length > 0 && (
                  <View style={styles.propertyPhotosSection}>
                    <Text style={styles.sectionTitle}>Property Photos</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                      {listing.images.map((img, index) => (
                        <Image key={index} source={{ uri: img }} style={styles.propertyPhoto} />
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
          <Text style={styles.contactButtonText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookButton} onPress={handleBook}>
          <Text style={styles.bookButtonText}>Send Request</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Request Confirmation Modal */}
      <Modal
        visible={requestModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRequestModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="mail-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Send Request</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to send a roommate request to {listing.postedBy.name}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setRequestModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmRequest}
              >
                <Text style={styles.modalConfirmText}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Message Confirmation Modal */}
      <Modal
        visible={messageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMessageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="chatbubble-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Send Message</Text>
            <Text style={styles.modalMessage}>
              Start a conversation with {listing.postedBy.name}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setMessageModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmMessage}
              >
                <Text style={styles.modalConfirmText}>Message</Text>
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
  scroll: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  imageScroll: {
    width: windowWidth,
    height: '100%',
  },
  mainImage: {
    width: windowWidth,
    height: '100%',
    backgroundColor: colors.border,
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 20,
  },
  backButtonInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 80,
  },
  favoriteButtonInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: 16,
    right: 20,
  },
  shareButtonInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageDots: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    gap: 8,
  },
  imageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  imageDotActive: {
    backgroundColor: colors.surface,
    width: 20,
  },
  content: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    lineHeight: 32,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 15,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  availability: {
    fontSize: 15,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  postedByCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  posterAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  posterInfo: {
    flex: 1,
  },
  posterName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  posterDetails: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  viewProfileButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
  },
  viewProfileText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabContent: {
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  preferenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  amenityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amenityText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  propertyPhotosSection: {
    marginTop: 24,
  },
  photosScroll: {
    marginTop: 12,
  },
  propertyPhoto: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginRight: 12,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  bookButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
  },
  bookButtonText: {
    fontSize: 15,
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
    backgroundColor: colors.primarySoft,
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
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface,
  },
});

export default RoommateDetailsScreen;
