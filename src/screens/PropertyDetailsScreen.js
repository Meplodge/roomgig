import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import ImageCarousel from '../components/ImageCarousel';

const PropertyDetailsScreen = ({ route, navigation }) => {
  const { property } = route.params;
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('Overview');
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviews, setReviews] = useState([
    { id: '1', name: 'John Doe', rating: 5.0, text: 'Amazing property! The host was very responsive and the place was exactly as described.' },
    { id: '2', name: 'Jane Smith', rating: 4.5, text: 'Great location and beautiful views. Would definitely recommend!' },
  ]);

  const handleSubmitReview = () => {
    if (reviewRating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    if (!reviewText.trim()) {
      Alert.alert('Error', 'Please write a review');
      return;
    }

    const newReview = {
      id: Date.now().toString(),
      name: user?.name || 'Anonymous',
      rating: reviewRating,
      text: reviewText,
    };

    setReviews([newReview, ...reviews]);
    setReviewModalVisible(false);
    setReviewRating(0);
    setReviewText('');
    Alert.alert('Success', 'Your review has been submitted!');
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
            <TouchableOpacity style={styles.circleButton}>
              <Ionicons name="camera-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.imageIndicators}>
            <View style={styles.indicator}>
              <Ionicons name="water-outline" size={14} color={colors.text} />
              <Text style={styles.indicatorText}>{property.baths} Baths</Text>
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
          <Text style={styles.propertyName}>{property.name}</Text>
          <Text style={styles.propertyLocation}>{property.location}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={colors.star} />
            <Text style={styles.rating}>{property.rating}</Text>
            <Text style={styles.reviews}>({property.reviews} Reviews)</Text>
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
                <Text style={styles.specValue}>{property.beds} Beds</Text>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="water-outline" size={22} color={colors.primary} />
                <Text style={styles.specValue}>{property.baths} Baths</Text>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="expand-outline" size={22} color={colors.primary} />
                <Text style={styles.specValue}>{property.sqft.toLocaleString()} Sqft</Text>
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
                {property.facilities.map((facility, index) => (
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
                <Image
                  source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
                  style={styles.hostAvatar}
                />
                <View style={styles.hostDetails}>
                  <Text style={styles.hostName}>{property.host}</Text>
                  <View style={styles.hostRatingRow}>
                    <Ionicons name="star" size={13} color={colors.star} />
                    <Text style={styles.hostRating}>4.8 (120 reviews)</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.contactButton}>
                  <Text style={styles.contactButtonText}>Contact</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {selectedTab === 'Gallery' && (
          <View style={styles.tabContent}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {property.images.map((image, index) => (
                <Image key={index} source={{ uri: image }} style={styles.galleryImage} />
              ))}
            </ScrollView>
          </View>
        )}

        {selectedTab === 'Review' && (
          <View style={styles.tabContent}>
            <View style={styles.reviewHeaderSection}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <TouchableOpacity
                style={styles.addReviewButton}
                onPress={() => setReviewModalVisible(true)}
              >
                <Ionicons name="add" size={18} color={colors.surface} />
                <Text style={styles.addReviewButtonText}>Add Review</Text>
              </TouchableOpacity>
            </View>
            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.name}</Text>
                  <View style={styles.reviewRatingRow}>
                    {renderStars(review.rating)}
                    <Text style={styles.reviewRating}>{review.rating}</Text>
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Booking Bar */}
      <View style={styles.bookingBar}>
        <View>
          <Text style={styles.priceLabel}>Price per month</Text>
          <Text style={styles.price}>${property.price.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('Booking', { property })}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.surface} />
        </TouchableOpacity>
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
  circleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.92)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
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
});

export default PropertyDetailsScreen;
