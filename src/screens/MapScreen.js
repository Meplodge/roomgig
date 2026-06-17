import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { colors } from '../constants/colors';
import { filterTypes } from '../data/mockData';
import FilterButton from '../components/FilterButton';
import BottomNavBar from '../components/BottomNavBar';
import { Ionicons } from '@expo/vector-icons';
import { useAppData } from '../context/AppDataContext';
import { getDirections, calculateDistance } from '../utils/mapUtils';

const INITIAL_REGION = {
  latitude: 40.7448,
  longitude: -73.9762,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
};

const MapScreen = ({ navigation, route }) => {
  const mapRef = useRef(null);
  const { propertiesList } = useAppData();
  const [selectedFilter, setSelectedFilter] = useState('Any Type');
  const [selectedProperty, setSelectedProperty] = useState(route.params?.property || propertiesList?.[1] || null);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const spinValue = useRef(new Animated.Value(0)).current;
  const [routeCoordinates, setRouteCoordinates] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  useEffect(() => {
    let animation;
    if (locating) {
      spinValue.setValue(0);
      animation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
    }
    return () => animation?.stop();
  }, [locating, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const filteredProperties = (propertiesList || []).filter(
    (property) => selectedFilter === 'Any Type' || property.category === selectedFilter
  );

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 800);
    return () => clearTimeout(timer);
  }, [filteredProperties.length, userLocation]);

  useEffect(() => {
    if (
      selectedProperty &&
      !filteredProperties.some((p) => p.id === selectedProperty.id)
    ) {
      setSelectedProperty(filteredProperties[0] || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter]);

  useEffect(() => {
    getCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (route.params?.property && userLocation) {
      setSelectedProperty(route.params.property);
      calculateRoute(route.params.property);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.property, userLocation]);

  useEffect(() => {
    console.log('routeCoordinates changed:', routeCoordinates ? routeCoordinates.length : 'null');
  }, [routeCoordinates]);

  const getCurrentLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to show your current location');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      setUserLocation({ latitude, longitude });

      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        },
        400
      );
    } catch (error) {
      console.log('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your current location');
    } finally {
      setLocating(false);
    }
  };

  const focusProperty = (property) => {
    setSelectedProperty(property);
    setRouteCoordinates(null);
    setRouteInfo(null);
    mapRef.current?.animateToRegion(
      {
        latitude: property.latitude,
        longitude: property.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      },
      400
    );
  };

  const calculateRoute = async (property) => {
    if (!userLocation) {
      Alert.alert('Location Required', 'Please enable location services to calculate the route.');
      return;
    }

    try {
      setCalculatingRoute(true);
      console.log('Calculating route from', userLocation, 'to', { latitude: property.latitude, longitude: property.longitude });
      
      let directions;
      try {
        directions = await getDirections(
          userLocation,
          { latitude: property.latitude, longitude: property.longitude }
        );
      } catch (apiError) {
        console.log('OSRM API failed, using straight line fallback:', apiError);
        // Fallback to straight line
        const distance = calculateDistance(userLocation, { latitude: property.latitude, longitude: property.longitude });
        directions = {
          coordinates: [
            userLocation,
            { latitude: property.latitude, longitude: property.longitude }
          ],
          distance: `${distance.toFixed(1)} km`,
          duration: `${Math.round(distance * 1.5)} min`, // Rough estimate
        };
      }
      
      console.log('Directions received:', directions);
      console.log('Route coordinates length:', directions.coordinates.length);
      setRouteCoordinates(directions.coordinates);
      setRouteInfo({
        distance: directions.distance,
        duration: directions.duration,
      });

      // Fit map to show the entire route
      if (mapRef.current && directions.coordinates.length > 0) {
        const bounds = directions.coordinates.reduce(
          (acc, coord) => ({
            north: Math.max(acc.north, coord.latitude),
            south: Math.min(acc.south, coord.latitude),
            east: Math.max(acc.east, coord.longitude),
            west: Math.min(acc.west, coord.longitude),
          }),
          {
            north: directions.coordinates[0].latitude,
            south: directions.coordinates[0].latitude,
            east: directions.coordinates[0].longitude,
            west: directions.coordinates[0].longitude,
          }
        );

        mapRef.current.fitToCoordinates(directions.coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        });
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      Alert.alert(
        'Route Calculation Error',
        'Unable to calculate route. Please check your internet connection and try again.'
      );
    } finally {
      setCalculatingRoute(false);
    }
  };

  const clearRoute = () => {
    setRouteCoordinates(null);
    setRouteInfo(null);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        initialRegion={userLocation ? { ...userLocation, latitudeDelta: 0.09, longitudeDelta: 0.09 } : INITIAL_REGION}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            description="You are here"
            tracksViewChanges={tracksViewChanges}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.userLocationMarker}>
              <View style={styles.userLocationPulse} />
              <View style={styles.userLocationDot} />
            </View>
          </Marker>
        )}

        {filteredProperties.map((property) => {
          const active = selectedProperty?.id === property.id;
          return (
            <Marker
              key={property.id}
              coordinate={{
                latitude: property.latitude,
                longitude: property.longitude,
              }}
              onPress={() => focusProperty(property)}
              tracksViewChanges={tracksViewChanges}
            >
              <View style={styles.markerWrapper}>
                <View style={[styles.markerPin, active && styles.markerPinActive]}>
                  <View style={[styles.markerInner, active && styles.markerInnerActive]}>
                    <Ionicons 
                      name="home" 
                      size={18} 
                      color={active ? colors.surface : colors.primary} 
                    />
                  </View>
                  <View style={[styles.markerPoint, active && styles.markerPointActive]} />
                </View>
                {active && (
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceText}>${(property.price / 1000).toFixed(1)}k</Text>
                  </View>
                )}
              </View>
            </Marker>
          );
        })}

        {/* Route Polyline */}
        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.primary}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.locationContainer}>
            <Text style={styles.location}>Explore Map</Text>
          </View>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={getCurrentLocation}
          >
            <Ionicons name="navigate" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Filter Types */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filterTypes.map((type) => (
              <FilterButton
                key={type}
                label={type}
                isSelected={selectedFilter === type}
                onPress={() => setSelectedFilter(type)}
              />
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Route Info Card */}
      {routeInfo && (
        <View style={styles.routeInfoCard}>
          <View style={styles.routeInfoHeader}>
            <Ionicons name="navigate" size={20} color={colors.primary} />
            <Text style={styles.routeInfoTitle}>Route Information</Text>
            <TouchableOpacity onPress={clearRoute} style={styles.clearRouteButton}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.routeInfoContent}>
            <View style={styles.routeInfoItem}>
              <Ionicons name="car" size={16} color={colors.textSecondary} />
              <Text style={styles.routeInfoLabel}>Distance:</Text>
              <Text style={styles.routeInfoValue}>{routeInfo.distance}</Text>
            </View>
            <View style={styles.routeInfoItem}>
              <Ionicons name="time" size={16} color={colors.textSecondary} />
              <Text style={styles.routeInfoLabel}>Duration:</Text>
              <Text style={styles.routeInfoValue}>{routeInfo.duration}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Selected property floating card */}
      {selectedProperty && (
        <TouchableOpacity
          style={[styles.floatingCard, routeInfo && styles.floatingCardWithRoute]}
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate('PropertyDetails', { property: selectedProperty })
          }
        >
          <Image source={{ uri: selectedProperty.image }} style={styles.cardImage} />
          <View style={styles.cardInfo}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>{selectedProperty.name}</Text>
              <View style={styles.cardRating}>
                <Ionicons name="star" size={12} color={colors.star} />
                <Text style={styles.cardRatingText}>{selectedProperty.rating}</Text>
              </View>
            </View>
            <View style={styles.cardLocationRow}>
              <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.cardLocation} numberOfLines={1}>
                {selectedProperty.location}
              </Text>
            </View>
            <Text style={styles.cardPrice}>
              ${selectedProperty.price.toLocaleString()}
              <Text style={styles.cardPriceUnit}> /mo</Text>
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Bottom Navigation */}
      <BottomNavBar activeTab="location" navigation={navigation} />

      {/* Locating Loading Modal */}
      <Modal visible={locating} transparent animationType="fade">
        <View style={styles.loadingBackdrop}>
          <View style={styles.loadingCard}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="locate" size={40} color={colors.primary} />
            </Animated.View>
            <Text style={styles.loadingText}>Locating you...</Text>
          </View>
        </View>
      </Modal>

      {/* Route Calculation Loading Modal */}
      <Modal visible={calculatingRoute} transparent animationType="fade">
        <View style={styles.loadingBackdrop}>
          <View style={styles.loadingCard}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="navigate" size={40} color={colors.primary} />
            </Animated.View>
            <Text style={styles.loadingText}>Calculating route...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  locationContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  location: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  markerWrapper: {
    alignItems: 'center',
  },
  markerPin: {
    width: 48,
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  markerPinActive: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  markerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInnerActive: {
    backgroundColor: colors.primary,
  },
  markerPoint: {
    position: 'absolute',
    bottom: -6,
    width: 12,
    height: 12,
    backgroundColor: colors.surface,
    borderRadius: 6,
    transform: [{ rotate: '45deg' }],
  },
  markerPointActive: {
    backgroundColor: colors.primary,
  },
  priceBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  priceText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  floatingCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 104,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardImage: { width: 92, height: 92, borderRadius: 12, backgroundColor: colors.border },
  cardInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  cardRating: { flexDirection: 'row', alignItems: 'center' },
  cardRatingText: { fontSize: 12, fontWeight: '700', color: colors.text, marginLeft: 3 },
  cardLocationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cardLocation: { fontSize: 12, color: colors.textSecondary, marginLeft: 4, flex: 1 },
  cardPrice: { fontSize: 17, fontWeight: '700', color: colors.primary, marginTop: 6 },
  cardPriceUnit: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  userLocationMarker: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surface,
    position: 'absolute',
  },
  userLocationPulse: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    opacity: 0.2,
    position: 'absolute',
  },
  loadingBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: colors.surface,
    paddingHorizontal: 32,
    paddingVertical: 28,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  routeInfoCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 100,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  routeInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeInfoTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  clearRouteButton: {
    padding: 4,
  },
  routeInfoContent: {
    gap: 8,
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeInfoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    marginRight: 4,
  },
  routeInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  floatingCardWithRoute: {
    bottom: 180,
  },
});

export default MapScreen;
