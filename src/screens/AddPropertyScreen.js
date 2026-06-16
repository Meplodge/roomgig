import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../constants/colors';
import { useAppData } from '../context/AppDataContext';
import ErrorState from '../components/ErrorState';

const AddPropertyScreen = ({ navigation }) => {
  const { addBooking } = useAppData();
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
        latitude: 40.7128 + Math.random() * 0.1,
        longitude: -74.0060 + Math.random() * 0.1,
      };

      // In a real app, this would be saved to a backend
      // For now, we'll just show success and navigate back
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
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={[styles.input, focusedInput === 'location' && styles.inputFocused]}
              placeholder="Enter location"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              onFocus={() => setFocusedInput('location')}
              onBlur={() => setFocusedInput(null)}
            />
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
});

export default AddPropertyScreen;
