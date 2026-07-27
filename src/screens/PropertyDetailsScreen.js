import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
  Share,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import ImageCarousel from '../components/ImageCarousel';
import { getPropertyReviews, createReview, trackPropertyView, getProfileById } from '../services/supabaseApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PropertyDetailsScreen = ({ route, navigation }) => {
  const { property } = route.params;
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('Overview');
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageViewerRef = useRef(null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [currentRating, setCurrentRating] = useState(property?.rating || property?.rating_avg || 0);
  const [currentReviewCount, setCurrentReviewCount] = useState(property?.reviews || property?.review_count || 0);
  const [host, setHost] = useState(null);

  // Fetch reviews from database and track property view
  useEffect(() => {
    fetchReviews();
    // Track property view when user opens details
    if (property?.id) {
      trackPropertyView(property.id, user?.id || null);
    }
  }, [property?.id, user?.id]);

  // Load the host's profile so we can show their real avatar and enable contact.
  useEffect(() => {
    let active = true;
    const loadHost = async () => {
      if (!property?.host_id) return;
      const data = await getProfileById(property.host_id);
      if (active) setHost(data);
    };
    loadHost();
    return () => {
      active = false;
    };
  }, [property?.host_id]);

  const hostName = host?.full_name || property.host_name || property.host || 'Host';
  const hostAvatar = host?.avatar_url || null;
  const hostPhone = host?.phone || property.host_phone || null;

  const handleContactHost = () => {
    if (property?.host_id && property.host_id === user?.id) {
      Alert.alert('This is your listing', 'You cannot contact yourself about your own property.');
      return;
    }
    navigation.navigate('Chat', {
      chat: {
        id: property.host_id || property.id,
        name: hostName,
        avatar: hostAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(hostName),
        property: property.name || property.title || 'Property Inquiry',
        phone: hostPhone,
      },
    });
  };

  const fetchReviews = async () => {
    if (!property?.id) return;
    try {
      setLoadingReviews(true);
      const data = await getPropertyReviews(property.id);
      const formattedReviews = data.map(review => ({
        id: review.id,
        name: review.profiles?.full_name || 'Anonymous',
        avatar: review.profiles?.avatar_url,
        rating: review.rating,
        text: review.content || review.title || '',
        createdAt: review.created_at,
        userId: review.user_id,
      }));
      setReviews(formattedReviews);

      // Calculate rating and count from actual reviews
      if (data.length > 0) {
        const sum = data.reduce((acc, r) => acc + r.rating, 0);
        const average = Math.round((sum / data.length) * 10) / 10;
        setCurrentRating(average);
        setCurrentReviewCount(data.length);
      } else {
        setCurrentRating(0);
        setCurrentReviewCount(0);
      }

      // Check if current user has already reviewed
      const userReview = data.find(review => review.user_id === user?.id);
      setHasReviewed(!!userReview);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Add 1 mock review as fallback
      setReviews([
        { id: 'mock-1', name: 'John Doe', avatar: null, rating: 5.0, text: 'Amazing property! The host was very responsive and the place was exactly as described.', createdAt: new Date().toISOString() },
      ]);
      setCurrentRating(5.0);
      setCurrentReviewCount(1);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareMessage = `Check out this amazing property: ${property.name || property.title}\n\n📍 ${property.location || property.city}\n💰 $${property.price ? property.price.toLocaleString() : '0'}/month\n\n${property.description || ''}\n\nView on Estatery!`;

      await Share.share({
        message: shareMessage,
        url: property.image,
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to share property');
    }
  };

  const handleImagePress = (index) => {
    setCurrentImageIndex(index);
    setShowImageViewer(true);
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    if (!reviewText.trim()) {
      Alert.alert('Error', 'Please write a review');
      return;
    }

    try {
      await createReview({
        userId: user?.id,
        propertyId: property?.id,
        rating: reviewRating,
        title: 'Review',
        content: reviewText,
      });

      // Refresh reviews after submission
      await fetchReviews();

      setReviewModalVisible(false);
      setReviewRating(0);
      setReviewText('');
      Alert.alert('Success', 'Your review has been submitted!');
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    }
  };

  const renderStars = (rating, interactive = false, onPress) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity
        key={star}
        disabled={!interactive}
        onPress={() => onPress && onPress(star)}
      >
        <Ionicons
          name={star <= rating ? 'star' : 'star-outline'}
          size={interactive ? 32 : 13}
          color={colors.star}
        />
      </TouchableOpacity>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageCarousel}>
          <ImageCarousel
            images={property.images}
            height={340}
          />
          {/* Overlaid Header */}
          <View style={styles.overlayHeader}>
            <TouchableOpacity style={styles.circleButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.circleButton} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={22} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.circleButton}>
                <Ionicons name="camera-outline" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.imageIndicators}>
            <View style={styles.indicator}>
              <Ionicons name="water-outline" size={14} color={colors.text} />
              <Text style={styles.indicatorText}>{property.baths || property.bathrooms || 0} Baths</Text>
            </View>
            <View style={styles.indicator}>
              <Ionicons name="cube-outline" size={14} color={colors.text} />
              <Text style={styles.indicatorText}>2 Tables</Text>
            </View>
            <View style={styles.indicator}>
              <Ionicons name="bed-outline" size={14} color={colors.text} />
              <Text style={styles.indicatorText}>3 Sofas</Text>
            </View>
          </View>
        </View>

        {/* Property Info */}
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyType}>Luxury Residence</Text>
          <Text style={styles.propertyName}>{property.name || property.title}</Text>
          <Text style={styles.propertyLocation}>{property.location || property.city}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={colors.star} />
            <Text style={styles.rating}>{currentRating}</Text>
            <Text style={styles.reviews}>({currentReviewCount} Reviews)</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {['Overview', 'Gallery', 'Review'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {selectedTab === 'Overview' && (
          <View style={styles.tabContent}>
            {/* Property Specs */}
            <View style={styles.specsContainer}>
              <View style={styles.specItem}>
                <Ionicons name="bed-outline" size={22} color={colors.primary} />
                <Text style={styles.specValue}>{property.beds || property.bedrooms || 0} Beds</Text>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="water-outline" size={22} color={colors.primary} />
                <Text style={styles.specValue}>{property.baths || property.bathrooms || 0} Baths</Text>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="expand-outline" size={22} color={colors.primary} />
                <Text style={styles.specValue}>{(property.sqft || property.square_feet || 0).toLocaleString()} Sqft</Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{property.description}</Text>
            </View>

            {/* Facilities */}
            <View style={styles.facilitiesSection}>
              <Text style={styles.sectionTitle}>Facilities</Text>
              <View style={styles.facilitiesGrid}>
                {(property.facilities || []).map((facility, index) => (
                  <View key={index} style={styles.facilityItem}>
                    <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
                    <Text style={styles.facilityText}>{facility}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Host */}
            <View style={styles.hostSection}>
              <Text style={styles.sectionTitle}>Host</Text>
              <View style={styles.hostInfo}>
                {hostAvatar ? (
                  <Image
                    source={{ uri: hostAvatar }}
                    style={styles.hostAvatar}
                    resizeMethod="resize"
                  />
                ) : (
                  <View style={[styles.hostAvatar, styles.hostAvatarPlaceholder]}>
                    <Ionicons name="person" size={24} color={colors.textSecondary} />
                  </View>
                )}
                <View style={styles.hostDetails}>
                  <Text style={styles.hostName}>{hostName}</Text>
                  <View style={styles.hostRatingRow}>
                    <Ionicons name="star" size={13} color={colors.star} />
                    <Text style={styles.hostRating}>
                      {currentRating > 0 ? `${currentRating} (${currentReviewCount} reviews)` : 'No reviews yet'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.contactButton} onPress={handleContactHost}>
                  <Text style={styles.contactButtonText}>Contact</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {selectedTab === 'Gallery' && (
          <View style={styles.tabContent}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(property.images || [property.image]).map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleImagePress(index)}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: image }} style={styles.galleryImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {selectedTab === 'Review' && (
          <View style={styles.tabContent}>
            <View style={styles.reviewHeaderSection}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              {!hasReviewed && (
                <TouchableOpacity
                  style={styles.addReviewButton}
                  onPress={() => setReviewModalVisible(true)}
                >
                  <Ionicons name="add" size={18} color={colors.surface} />
                  <Text style={styles.addReviewButtonText}>Add Review</Text>
                </TouchableOpacity>
              )}
            </View>
            {loadingReviews ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading reviews...</Text>
              </View>
            ) : reviews.length === 0 ? (
              <View style={styles.emptyReviewsContainer}>
                <Ionicons name="chatbubble-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyReviewsText}>No reviews yet</Text>
                <Text style={styles.emptyReviewsSubtext}>Be the first to review this property!</Text>
              </View>
            ) : (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerInfo}>
                      {review.avatar ? (
                        <Image source={{ uri: review.avatar }} style={styles.reviewerAvatar} />
                      ) : (
                        <View style={styles.reviewerAvatarPlaceholder}>
                          <Ionicons name="person" size={20} color={colors.textSecondary} />
                        </View>
                      )}
                      <Text style={styles.reviewerName}>{review.name}</Text>
                    </View>
                    <View style={styles.reviewRatingRow}>
                      {renderStars(review.rating)}
                      <Text style={styles.reviewRating}>{review.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewText}>{review.text}</Text>
                  {review.createdAt && (
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Booking Bar */}
      <View style={styles.bookingBar}>
        <View>
          <Text style={styles.priceLabel}>Price per month</Text>
          <Text style={styles.price}>${property.price ? property.price.toLocaleString() : '0'}</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.directionsButton}
            onPress={() => navigation.navigate('MapScreen', { property })}
          >
            <Ionicons name="navigate" size={18} color={colors.text} />
            <Text style={styles.directionsButtonText}>Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => navigation.navigate('Booking', { property })}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.surface} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Review Modal */}
      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Rating</Text>
              <View style={styles.starRatingContainer}>
                {renderStars(reviewRating, true, setReviewRating)}
              </View>

              <Text style={styles.modalLabel}>Your Review</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Share your experience..."
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <TouchableOpacity style={styles.submitReviewButton} onPress={handleSubmitReview}>
                <Text style={styles.submitReviewButtonText}>Submit Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Screen Image Viewer Modal */}
      <Modal
        visible={showImageViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageViewer(false)}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerClose}
            onPress={() => setShowImageViewer(false)}
          >
            <Ionicons name="close" size={28} color={colors.surface} />
          </TouchableOpacity>
          <ScrollView
            ref={imageViewerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const contentOffset = event.nativeEvent.contentOffset;
              const index = Math.round(contentOffset.x / SCREEN_WIDTH);
              setCurrentImageIndex(index);
            }}
            scrollEventThrottle={16}
            style={styles.imageViewerScrollView}
            contentOffset={{ x: currentImageIndex * SCREEN_WIDTH, y: 0 }}
          >
            {(property.images || [property.image]).map((image, index) => (
              <View key={index} style={[styles.imageViewerImageWrapper, { width: SCREEN_WIDTH }]}>
                <Image
                  source={{ uri: image }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
          <View style={styles.imageViewerPagination}>
            <Text style={styles.imageViewerPaginationText}>
              {currentImageIndex + 1} / {(property.images || [property.image]).length}
            </Text>
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
  overlayHeader: {
    position: 'absolute',
    top: 16,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  circleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCarousel: {
    position: 'relative',
  },
  mainImage: {
    width: 400,
    height: 340,
    resizeMode: 'cover',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 4,
  },
  propertyInfo: {
    padding: 20,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
  },
  propertyType: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  propertyName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 4,
    marginRight: 8,
  },
  reviews: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingVertical: 16,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    padding: 20,
  },
  specsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  specItem: {
    alignItems: 'center',
  },
  specIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  facilitiesSection: {
    marginBottom: 20,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  facilityText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    marginLeft: 5,
  },
  hostSection: {
    marginBottom: 20,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  hostAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.border,
    marginRight: 12,
  },
  hostAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostDetails: {
    flex: 1,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  hostRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostRating: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  contactButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  contactButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  galleryImage: {
    width: 300,
    height: 200,
    borderRadius: 12,
    marginRight: 12,
  },
  reviewItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  reviewRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRating: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 4,
  },
  reviewText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  bookingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 6,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  directionsButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bookButtonText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  reviewHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addReviewButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalBody: {
    gap: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  starRatingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  reviewInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
  },
  submitReviewButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitReviewButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyReviewsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyReviewsText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyReviewsSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  imageViewerScrollView: {
    flex: 1,
  },
  imageViewerImageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  imageViewerPagination: {
    position: 'absolute',
    bottom: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageViewerPaginationText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PropertyDetailsScreen;
