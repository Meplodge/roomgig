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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../constants/colors';
import FilterButton from '../components/FilterButton';
import PropertyCardSkeleton from '../components/PropertyCardSkeleton';
import BottomNavBar from '../components/BottomNavBar';
import { getRoommateListings } from '../services/supabaseApi';

const roommateTypes = ['All', 'Apartment', 'House', 'Room'];

const RoommateFinderScreen = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

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
    const matchesType = selectedType === 'All' || listing.type === selectedType;
    const matchesSearch = searchQuery === '' || 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.postedBy.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const renderListing = (listing) => (
    <TouchableOpacity
      key={listing.id}
      style={styles.listingCard}
      onPress={() => navigation.navigate('RoommateDetails', { listing })}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600' }}
        style={styles.listingImage}
      />
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
        <View style={styles.postedByRow}>
          <Image source={{ uri: listing.postedBy.avatar }} style={styles.posterAvatar} />
          <View style={styles.posterInfo}>
            <Text style={styles.posterName}>{listing.postedBy.name}</Text>
            <Text style={styles.posterDetails}>{listing.postedBy.age} • {listing.postedBy.occupation}</Text>
          </View>
        </View>
        <View style={styles.amenitiesRow}>
          {listing.amenities.slice(0, 3).map((amenity, index) => (
            <View key={index} style={styles.amenityChip}>
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
          {listing.amenities.length > 3 && (
            <Text style={styles.moreAmenities}>+{listing.amenities.length - 3}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

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
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by location, preferences..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
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
            <>
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
            </>
          ) : filteredListings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏠</Text>
              <Text style={styles.emptyTitle}>No Listings Found</Text>
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
                  {listings.slice(0, 5).map((listing) => (
                    <TouchableOpacity
                      key={listing.id}
                      style={styles.featuredCard}
                      onPress={() => navigation.navigate('RoommateDetails', { listing })}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600' }}
                        style={styles.featuredImage}
                      />
                      <View style={styles.featuredBadge}>
                        <Text style={styles.featuredBadgeText}>{listing.type}</Text>
                      </View>
                      <Text style={styles.featuredTitle} numberOfLines={1}>{listing.title}</Text>
                      <View style={styles.featuredLocation}>
                        <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                        <Text style={styles.featuredLocationText} numberOfLines={1}>{listing.location}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: colors.textSecondary,
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
  featuredCard: {
    width: 180,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featuredImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredBadgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  featuredPrice: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredPriceText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  featuredLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  featuredLocationText: {
    fontSize: 12,
    color: colors.textSecondary,
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
    marginBottom: 16,
  },
  location: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  postedByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 16,
  },
  posterAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  posterInfo: {
    flex: 1,
  },
  posterName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  posterDetails: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityChip: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  amenityText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  moreAmenities: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
});

export default RoommateFinderScreen;
