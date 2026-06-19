import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
  Modal,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { colors } from '../constants/colors';
import { useAppData } from '../context/AppDataContext';
import ErrorState from '../components/ErrorState';

const AddPropertyScreen = ({ navigation }) => {
  const { addBooking, addProperty } = useAppData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Rent',
    category: 'Apartment',
    location: '',
    price: '',
    beds: '',
    baths: '',
    sqft: '',
    description: '',
    facilities: '',
  });
  const [images, setImages] = useState([]);
  const [focusedInput, setFocusedInput] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [loadingLocation, setLoadingLocation] = useState(false);

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Location permission is required to detect your current position. You can still select a location manually.'
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setSelectedLocation({ latitude, longitude });
    } catch (err) {
      Alert.alert('Location Error', 'Unable to fetch your current location. Please select a location manually.');
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    if (showMapModal) {
      getCurrentLocation();
    }
  }, [showMapModal]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError({
          title: 'Permission Needed',
          message: 'Please grant camera roll permissions to upload images',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const selectedImages = result.assets.map(asset => asset.uri);
        setImages([...images, ...selectedImages]);
        setError(null);
      }
    } catch (err) {
      setError({
        title: 'Image Upload Failed',
        message: 'Failed to load images. Please try again.',
      });
    }
  };

  const handleAddProperty = () => {
    if (!formData.name || !formData.location || !formData.price || !formData.beds || !formData.baths) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!selectedLocation) {
      Alert.alert('Error', 'Please pin the location on the map');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const newProperty = {
        id: Date.now().toString(),
        name: formData.name,
        type: formData.type,
        category: formData.category,
        location: formData.location,
        price: parseFloat(formData.price),
        beds: parseInt(formData.beds),
        baths: parseInt(formData.baths),
        sqft: parseInt(formData.sqft) || 0,
        image: images[0],
        images: images,
        description: formData.description,
        facilities: formData.facilities.split(',').map(f => f.trim()).filter(f => f),
        host: 'You',
        rating: 0,
        reviews: 0,
        isFavorite: false,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      };

      // Save property to context
      addProperty(newProperty);

      setLoading(false);
      Alert.alert('Success', 'Property added successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    }, 1500);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);
    setMapRegion({
      ...mapRegion,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      setShowMapModal(false);
      // Don't overwrite the location text field - keep it separate from coordinates
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Property</Text>
        <View style={styles.headerRight} />
      </View>

      {error ? (
        <ErrorState
          title={error.title}
          message={error.message}
          actionText="Try Again"
          onAction={() => setError(null)}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
        {/* Image Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Images</Text>
          <View style={styles.imageGrid}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: image }} style={styles.uploadedImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Ionicons name="add" size={32} color={colors.primary} />
              <Text style={styles.addImageText}>Add Image</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Property Name *</Text>
            <TextInput
              style={[styles.input, focusedInput === 'name' && styles.inputFocused]}
              placeholder="Enter property name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              onFocus={() => setFocusedInput('name')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Type *</Text>
              <View style={styles.pickerContainer}>
                <TextInput
                  style={styles.picker}
                  value={formData.type}
                  onChangeText={(text) => setFormData({ ...formData, type: text })}
                />
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </View>
            </View>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.pickerContainer}>
                <TextInput
                  style={styles.picker}
                  value={formData.category}
                  onChangeText={(text) => setFormData({ ...formData, category: text })}
                />
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location Name/Address *</Text>
            <TextInput
              style={[styles.input, focusedInput === 'location' && styles.inputFocused]}
              placeholder="Enter location name or address"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              onFocus={() => setFocusedInput('location')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pin Location on Map *</Text>
            <TouchableOpacity
              style={[styles.input, styles.mapInput, focusedInput === 'mapLocation' && styles.inputFocused]}
              onPress={() => setShowMapModal(true)}
            >
              <Text style={selectedLocation ? styles.mapLocationText : styles.placeholderText}>
                {selectedLocation ? `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}` : 'Tap to pin location on map'}
              </Text>
              <Ionicons name="map" size={20} color={selectedLocation ? colors.primary : colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price (per month) *</Text>
            <TextInput
              style={[styles.input, focusedInput === 'price' && styles.inputFocused]}
              placeholder="Enter price"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="numeric"
              onFocus={() => setFocusedInput('price')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
        </View>

        {/* Property Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Bedrooms *</Text>
              <TextInput
                style={[styles.input, focusedInput === 'beds' && styles.inputFocused]}
                placeholder="0"
                value={formData.beds}
                onChangeText={(text) => setFormData({ ...formData, beds: text })}
                keyboardType="numeric"
                onFocus={() => setFocusedInput('beds')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Bathrooms *</Text>
              <TextInput
                style={[styles.input, focusedInput === 'baths' && styles.inputFocused]}
                placeholder="0"
                value={formData.baths}
                onChangeText={(text) => setFormData({ ...formData, baths: text })}
                keyboardType="numeric"
                onFocus={() => setFocusedInput('baths')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Sq Ft</Text>
              <TextInput
                style={[styles.input, focusedInput === 'sqft' && styles.inputFocused]}
                placeholder="0"
                value={formData.sqft}
                onChangeText={(text) => setFormData({ ...formData, sqft: text })}
                keyboardType="numeric"
                onFocus={() => setFocusedInput('sqft')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, focusedInput === 'description' && styles.inputFocused]}
              placeholder="Describe your property..."
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
              onFocus={() => setFocusedInput('description')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Facilities (comma separated)</Text>
            <TextInput
              style={[styles.input, focusedInput === 'facilities' && styles.inputFocused]}
              placeholder="e.g. Pool, Gym, Parking"
              value={formData.facilities}
              onChangeText={(text) => setFormData({ ...formData, facilities: text })}
              onFocus={() => setFocusedInput('facilities')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleAddProperty}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.submitButtonText}>Add Property</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      )}

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.mapModal}>
          <View style={styles.mapHeader}>
            <TouchableOpacity style={styles.mapBackButton} onPress={() => setShowMapModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.mapTitle}>Select Location</Text>
            <TouchableOpacity
              style={[styles.confirmButton, !selectedLocation && styles.confirmButtonDisabled]}
              onPress={handleConfirmLocation}
              disabled={!selectedLocation}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
          <MapView
            style={styles.map}
            region={mapRegion}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                draggable
                onDragEnd={(e) => handleMapPress(e)}
              />
            )}
          </MapView>
          {loadingLocation && (
            <View style={styles.locationLoadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.locationLoadingText}>Finding your location...</Text>
            </View>
          )}
          <TouchableOpacity style={styles.myLocationButton} onPress={getCurrentLocation}>
            <Ionicons name="locate" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.mapInstructions}>
            <Text style={styles.mapInstructionsText}>Tap on the map to select property location</Text>
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
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  flex1: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  picker: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationText: {
    fontSize: 15,
    color: colors.text,
  },
  mapInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapLocationText: {
    fontSize: 15,
    color: colors.text,
  },
  placeholderText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  mapModal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  mapBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.border,
  },
  confirmButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  mapInstructions: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mapInstructionsText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  locationLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  locationLoadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: colors.surface,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default AddPropertyScreen;
