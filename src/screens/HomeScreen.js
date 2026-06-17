import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { colors } from '../constants/colors';
import { propertyTypes } from '../data/mockData';
import PropertyCard from '../components/PropertyCard';
import FilterButton from '../components/FilterButton';
import SearchBar from '../components/SearchBar';
import BottomNavBar from '../components/BottomNavBar';
import FilterModal, { defaultFilters } from '../components/FilterModal';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { filterProperties, countActiveFilters } from '../utils/filterProperties';

const HomeScreen = ({ navigation }) => {
  const { propertiesList } = useAppData();
  const { user } = useAuth();
  const firstName = (user?.name || 'there').split(' ')[0];
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(defaultFilters);
  const [filterVisible, setFilterVisible] = useState(false);
  const [location, setLocation] = useState('California, USA');
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation('California, USA');
        setLoadingLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;

      // Reverse geocode to get city name
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode && geocode.length > 0) {
        const { city, region } = geocode[0];
        setLocation(`${city}, ${region}`);
      } else {
        setLocation('Unknown Location');
      }
    } catch (error) {
      console.log('Error getting location:', error);
      setLocation('California, USA');
    } finally {
      setLoadingLocation(false);
    }
  };

  const filteredProperties = filterProperties(propertiesList || [], {
    filters,
    query: searchQuery,
  });
  const activeCount = countActiveFilters(filters);

  const setSelectedType = (type) => setFilters((f) => ({ ...f, type }));
  const selectedType = filters.type;

  const applyFilters = (next) => {
    setFilters(next);
    setFilterVisible(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getCurrentLocation();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
                style={styles.avatar}
              />
              <LinearGradient
                colors={['rgba(31, 77, 63, 0.1)', 'rgba(31, 77, 63, 0.3)']}
                style={styles.avatarGradient}
              />
            </View>
            <View>
              <Text style={styles.greeting}>Hi, {displayName}</Text>
              <View style={styles.locationContainer}>
                <Ionicons name="location-sharp" size={14} color={colors.primary} />
                {loadingLocation ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.location}>{location}</Text>
                )}
                <TouchableOpacity onPress={getCurrentLocation}>
                  <Ionicons name="refresh" size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <SearchBar
          placeholder="Search destination"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => setFilterVisible(true)}
          filterCount={activeCount}
        />

        {/* Property Type Filters */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {propertyTypes.map((type) => (
              <FilterButton
                key={type}
                label={type}
                isSelected={selectedType === type}
                onPress={() => setSelectedType(type)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Featured Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {activeCount > 0 || searchQuery
                ? `${filteredProperties.length} Result${filteredProperties.length === 1 ? '' : 's'}`
                : 'Featured Listings'}
            </Text>
          </View>
          {filteredProperties.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="No Properties Found"
              message="We couldn't find any properties matching your search criteria. Try adjusting your filters or search terms."
              actionText="Clear Filters"
              onAction={() => {
                setFilters(defaultFilters);
                setSearchQuery('');
              }}
            />
          ) : (
            filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onPress={() => navigation.navigate('PropertyDetails', { property })}
              />
            ))
          )}
        </View>

        {/* Top Properties */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Property</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllProperties')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filteredProperties.map((property) => (
              <TouchableOpacity
                key={property.id}
                style={styles.topPropertyCard}
                onPress={() => navigation.navigate('PropertyDetails', { property })}
                activeOpacity={0.8}
              >
                <Image source={{ uri: property.image }} style={styles.topPropertyImage} />
                <View style={styles.topPropertyBadge}>
                  <Text style={styles.topPropertyBadgeText}>{property.type}</Text>
                </View>
                <View style={styles.topPropertyRating}>
                  <Ionicons name="star" size={11} color={colors.star} />
                  <Text style={styles.topPropertyRatingText}>{property.rating}</Text>
                </View>
                <Text style={styles.topPropertyName}>{property.name}</Text>
                <Text style={styles.topPropertyPrice}>${property.price.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavBar activeTab="home" navigation={navigation} />

      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={applyFilters}
        initialFilters={filters}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
  },
  avatarGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  location: {
    fontSize: 13,
    color: colors.textSecondary,
    marginHorizontal: 3,
  },
  notificationButton: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  viewAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  topPropertyCard: {
    width: 180,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  topPropertyImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  topPropertyBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topPropertyBadgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  topPropertyRating: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topPropertyRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 3,
  },
  topPropertyName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  topPropertyPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navIconActive: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  navLabelActive: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default HomeScreen;
