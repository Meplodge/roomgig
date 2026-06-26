import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import FilterButton from '../components/FilterButton';
import { getRoommateListings } from '../services/supabaseApi';

const { width } = Dimensions.get('window');

const roommateTypes = ['All', 'Apartment', 'House', 'Room'];

const ViewAllRoommatesScreen = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchListings();
  }, []);

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
      listing.postedBy?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.postedBy?.occupation?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  };

  const renderListing = ({ item }) => {
    const isNew = isRecentListing(item.created_at);
    const primaryImage = item.roommate_images?.find(img => img.is_primary)?.image_url ||
                       item.roommate_images?.[0]?.image_url ||
                       item.postedBy?.avatar ||
                       'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600';

    return (
      <TouchableOpacity
        style={styles.personCard}
        onPress={() => navigation.navigate('RoommateDetails', { listing: item })}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: primaryImage }} 
            style={styles.cardImage} 
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.imageGradient}
          />
          <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) }]}>
            <Text style={styles.typeText}>{item.type || 'Room'}</Text>
          </View>
          {isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title || item.postedBy?.name || 'Anonymous'}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>{item.location || 'Location not specified'}</Text>
          </View>
          <View style={styles.priceRow}>
            <Ionicons name="cash-outline" size={12} color={colors.primary} />
            <Text style={styles.priceText}>${item.budget_min || item.price || 0}/mo</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const isRecentListing = (createdAt) => {
    if (!createdAt) return false;
    const listingDate = new Date(createdAt);
    const now = new Date();
    const daysDiff = (now - listingDate) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>All Roommates</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, location, or occupation..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={roommateTypes}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <FilterButton
              label={item}
              isSelected={selectedType === item}
              onPress={() => setSelectedType(item)}
            />
          )}
          contentContainerStyle={styles.filterContent}
        />
      </View>

      {/* Results count */}
      {!loading && filteredListings.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>{filteredListings.length} roommate{filteredListings.length !== 1 ? 's' : ''} found</Text>
        </View>
      )}

      {/* Listings */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredListings}
          renderItem={renderListing}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={80} color={colors.textLight} />
              </View>
              <Text style={styles.emptyTitle}>No roommates found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try adjusting your search or filters' : 'Check back later for new listings'}
              </Text>
              {searchQuery && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedType('All');
                  }}
                >
                  <Text style={styles.clearButtonText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
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
  filterContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  filterContent: {
    paddingRight: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  personCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '700',
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newBadgeText: {
    color: colors.surface,
    fontSize: 9,
    fontWeight: '700',
  },
  cardContent: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  clearButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  clearButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
});

export default ViewAllRoommatesScreen;
