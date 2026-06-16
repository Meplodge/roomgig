import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { colors } from '../constants/colors';
import { properties, filterTypes } from '../data/mockData';
import FilterButton from '../components/FilterButton';
import BottomNavBar from '../components/BottomNavBar';
import { Ionicons } from '@expo/vector-icons';

const INITIAL_REGION = {
  latitude: 40.7448,
  longitude: -73.9762,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
};

const MapScreen = ({ navigation }) => {
  const mapRef = useRef(null);
  const [selectedFilter, setSelectedFilter] = useState('Any Type');
  const [selectedProperty, setSelectedProperty] = useState(properties[1]);
  const [userLocation, setUserLocation] = useState(null);

  const filteredProperties = properties.filter(
    (property) => selectedFilter === 'Any Type' || property.category === selectedFilter
  );

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

  const getCurrentLocation = async () => {
    try {
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
    }
  };

  const focusProperty = (property) => {
    setSelectedProperty(property);
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
          >
            <View style={styles.userLocationMarker}>
              <View style={styles.userLocationDot} />
              <View style={styles.userLocationPulse} />
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
            >
              <View style={[styles.marker, active && styles.markerActive]}>
                <Ionicons 
                  name="home" 
                  size={20} 
                  color={active ? colors.surface : colors.primary} 
                />
              </View>
            </Marker>
          );
        })}
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

      {/* Selected property floating card */}
      {selectedProperty && (
        <TouchableOpacity
          style={styles.floatingCard}
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
  marker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  markerActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
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
});

export default MapScreen;
