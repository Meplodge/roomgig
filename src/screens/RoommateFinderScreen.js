import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../constants/colors';
import FilterButton from '../components/FilterButton';
import BottomNavBar from '../components/BottomNavBar';
import { getRoommateListings } from '../services/supabaseApi';

const { width } = Dimensions.get('window');

const roommateTypes = ['All', 'Apartment', 'House', 'Room'];

const RoommateFinderScreen = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [selectedGender, setSelectedGender] = useState('All');
  const [selectedSmoking, setSelectedSmoking] = useState('All');
  const [locationInput, setLocationInput] = useState('');
  const [geoLocationEnabled, setGeoLocationEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);

  const isRecentListing = (createdAt) => {
    if (!createdAt) return false;
    const listingDate = new Date(createdAt);
    const now = new Date();
    const daysDiff = (now - listingDate) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  };

  const calculateDistance = (userLoc, listing) => {
    if (!listing.location) return Infinity;
    // Simple distance calculation based on location string matching
    // In a real app, you would use actual coordinates and Haversine formula
    const locationMatch = listing.location.toLowerCase().includes(userLoc.city?.toLowerCase() || '');
    return locationMatch ? 0 : 1;
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        // Reverse geocode to get city name
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (reverseGeocode[0]) {
          setUserLocation(prev => ({ ...prev, city: reverseGeocode[0].city }));
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const toggleGeoLocation = async (value) => {
    setGeoLocationEnabled(value);
    if (value && !locationPermission) {
      await requestLocationPermission();
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchListings();
    }, [])
  );

  const fetchListings = async () => {
    try {
      setLoading(true);
      const data = await getRoommateListings();
      setListings(data);
    } catch (error) {
      console.error('Error fetching roommate listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesType = selectedType === 'All' || (listing.type && listing.type === selectedType);
    const matchesSearch = searchQuery === '' || 
      (listing.title && listing.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (listing.location && listing.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (listing.postedBy?.name && listing.postedBy.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMinBudget = !minBudget || (listing.budget_min && listing.budget_min >= parseInt(minBudget));
    const matchesMaxBudget = !maxBudget || (listing.budget_max && listing.budget_max <= parseInt(maxBudget));
    const matchesLocation = !locationInput || (listing.location && listing.location.toLowerCase().includes(locationInput.toLowerCase()));
    return matchesType && matchesSearch && matchesMinBudget && matchesMaxBudget && matchesLocation;
  }).sort((a, b) => {
    if (geoLocationEnabled && userLocation) {
      const distanceA = calculateDistance(userLocation, a);
      const distanceB = calculateDistance(userLocation, b);
      return distanceA - distanceB;
    }
    return 0;
  });

  const renderListing = (listing) => {
    const isNew = isRecentListing(listing.created_at);
    const primaryImage = listing.roommate_images?.find(img => img.is_primary)?.image_url ||
                       listing.roommate_images?.[0]?.image_url ||
                       listing.images?.[0] ||
                       'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600';

    return (
      <TouchableOpacity
        key={listing.id}
        style={styles.listingCard}
        onPress={() => navigation.navigate('RoommateDetails', { listing })}
        activeOpacity={0.8}
      >
        <View style={styles.listingImageContainer}>
          <Image
            source={{ uri: primaryImage }}
            style={styles.listingImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)']}
            style={styles.imageGradient}
          />
          {isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>${listing.budget_min || listing.price || 0}</Text>
          </View>
        </View>
        <View style={styles.listingContent}>
          <View style={styles.listingHeader}>
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(listing.type) }]}>
              <Text style={styles.typeText}>{listing.type || 'Room'}</Text>
            </View>
          </View>
          <Text style={styles.listingTitle} numberOfLines={1}>{listing.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.location} numberOfLines={1}>{listing.location}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Apartment': return colors.primaryLight;
      case 'House': return colors.accent;
      case 'Room': return colors.secondary;
      default: return colors.primarySoft;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>Find Your</Text>
            <Text style={styles.headerTitle}>Perfect Roommate</Text>
          </View>
          <TouchableOpacity
            style={styles.postButton}
            onPress={() => navigation.navigate('PostRoommateListing')}
          >
            <Ionicons name="add" size={20} color={colors.surface} />
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by location, preferences..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterIcon} onPress={() => setFilterModalVisible(true)}>
            <Ionicons name="options-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {roommateTypes.map((type) => (
              <FilterButton
                key={type}
                label={type}
                isSelected={selectedType === type}
                onPress={() => setSelectedType(type)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Listings */}
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={styles.listingsContainer}
          contentContainerStyle={styles.listingsContent}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading roommates...</Text>
            </View>
          ) : filteredListings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏠</Text>
              <Text style={styles.emptyTitle}>No roommates found</Text>
              <Text style={styles.emptyMessage}>
                {searchQuery || selectedType !== 'All'
                  ? 'Try adjusting your search or filters.'
                  : 'There are no roommate listings yet. Be the first to post one!'}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('PostRoommateListing')}
              >
                <Ionicons name="add" size={18} color={colors.surface} />
                <Text style={styles.emptyButtonText}>Post a Listing</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Featured Roommates */}
              <View style={styles.featuredSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Featured Roommates</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('ViewAllRoommates')}>
                    <Text style={styles.viewAll}>View All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}>
                  {listings.slice(0, 5).map((listing) => {
                    const primaryImage = listing.roommate_images?.find(img => img.is_primary)?.image_url ||
                                       listing.roommate_images?.[0]?.image_url ||
                                       listing.images?.[0] ||
                                       'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600';
                    return (
                      <TouchableOpacity
                        key={listing.id}
                        style={styles.featuredCard}
                        onPress={() => navigation.navigate('RoommateDetails', { listing })}
                        activeOpacity={0.8}
                      >
                        <View style={styles.featuredImageContainer}>
                          <Image
                            source={{ uri: primaryImage }}
                            style={styles.featuredImage}
                          />
                          <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.6)']}
                            style={styles.featuredGradient}
                          />
                          <View style={styles.featuredBadge}>
                            <Text style={styles.featuredBadgeText}>{listing.type || 'Room'}</Text>
                          </View>
                        </View>
                        <View style={styles.featuredContent}>
                          <Text style={styles.featuredTitle} numberOfLines={1}>{listing.title}</Text>
                          <View style={styles.featuredLocation}>
                            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                            <Text style={styles.featuredLocationText} numberOfLines={1}>{listing.location}</Text>
                          </View>
                          <View style={styles.featuredPrice}>
                            <Ionicons name="cash-outline" size={12} color={colors.primary} />
                            <Text style={styles.featuredPriceText}>${listing.budget_min || listing.price || 0}/mo</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <Text style={styles.sectionTitle}>
                {filteredListings.length} {filteredListings.length === 1 ? 'listing' : 'listings'} found
              </Text>
              {filteredListings.map(renderListing)}
            </>
          )}
        </ScrollView>
      </View>
      <BottomNavBar activeTab="roommate" navigation={navigation} />

      {/* Advanced Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Advanced Filters</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Location */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Location</Text>
                <View style={styles.locationInput}>
                  <Ionicons name="location-outline" size={20} color={colors.textSecondary} style={styles.locationIcon} />
                  <TextInput
                    style={styles.locationText}
                    placeholder="Enter city or area"
                    placeholderTextColor={colors.textLight}
                    value={locationInput}
                    onChangeText={setLocationInput}
                  />
                </View>
              </View>

              {/* Geolocation Toggle */}
              <View style={styles.filterSection}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.filterLabel}>Use My Location</Text>
                    <Text style={styles.toggleSubtitle}>Prioritize listings near you</Text>
                  </View>
                  <Switch
                    value={geoLocationEnabled}
                    onValueChange={toggleGeoLocation}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={geoLocationEnabled ? colors.surface : colors.surface}
                  />
                </View>
              </View>

              {/* Budget Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Budget Range ($/mo)</Text>
                <View style={styles.budgetRow}>
                  <View style={styles.budgetInput}>
                    <TextInput
                      style={styles.budgetText}
                      placeholder="Min"
                      placeholderTextColor={colors.textLight}
                      value={minBudget}
                      onChangeText={setMinBudget}
                      keyboardType="numeric"
                    />
                  </View>
                  <Text style={styles.budgetSeparator}>-</Text>
                  <View style={styles.budgetInput}>
                    <TextInput
                      style={styles.budgetText}
                      placeholder="Max"
                      placeholderTextColor={colors.textLight}
                      value={maxBudget}
                      onChangeText={setMaxBudget}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Gender Preference */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Gender Preference</Text>
                <View style={styles.optionRow}>
                  {['All', 'Male', 'Female', 'Any'].map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={[
                        styles.optionButton,
                        selectedGender === gender && styles.optionButtonSelected
                      ]}
                      onPress={() => setSelectedGender(gender)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selectedGender === gender && styles.optionTextSelected
                        ]}
                      >
                        {gender}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Smoking Preference */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Smoking Preference</Text>
                <View style={styles.optionRow}>
                  {['All', 'Smoker', 'Non-smoker'].map((smoking) => (
                    <TouchableOpacity
                      key={smoking}
                      style={[
                        styles.optionButton,
                        selectedSmoking === smoking && styles.optionButtonSelected
                      ]}
                      onPress={() => setSelectedSmoking(smoking)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selectedSmoking === smoking && styles.optionTextSelected
                        ]}
                      >
                        {smoking}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setMinBudget('');
                  setMaxBudget('');
                  setSelectedGender('All');
                  setSelectedSmoking('All');
                  setLocationInput('');
                  setGeoLocationEnabled(false);
                }}
              >
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyFiltersButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyFiltersText}>Apply Filters</Text>
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
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerGreeting: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 16,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  clearButton: {
    marginLeft: 8,
  },
  filterIcon: {
    width: 50,
    height: 50,
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  viewAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  featuredCard: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16,
  },
  featuredImageContainer: {
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  featuredGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  featuredBadgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '700',
  },
  featuredContent: {
    padding: 14,
  },
  featuredTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  featuredLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredLocationText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  featuredPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredPriceText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  listingsContainer: {
    flex: 1,
  },
  listingsContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.surface,
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  listingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  listingImageContainer: {
    position: 'relative',
  },
  listingImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
  },
  newBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  newBadgeText: {
    color: colors.surface,
    fontSize: 9,
    fontWeight: '700',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  listingContent: {
    padding: 12,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  listingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  budgetText: {
    fontSize: 15,
    color: colors.text,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationIcon: {
    marginRight: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  budgetSeparator: {
    fontSize: 20,
    color: colors.textSecondary,
    marginHorizontal: 12,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  optionTextSelected: {
    color: colors.surface,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface,
  },
});

export default RoommateFinderScreen;
