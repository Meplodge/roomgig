import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../constants/colors';

const { width: windowWidth } = Dimensions.get('window');

const PostRoommateListingScreen = ({ navigation, route }) => {
  const { listing, isEdit } = route.params || {};
  const [title, setTitle] = useState(listing?.title || '');
  const [type, setType] = useState(listing?.type || 'Apartment');
  const [location, setLocation] = useState(listing?.location || '');
  const [price, setPrice] = useState(listing?.price?.toString() || '');
  const [availableDate, setAvailableDate] = useState(listing?.available || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [selectedPreferences, setSelectedPreferences] = useState(listing?.preferences || []);
  const [selectedAmenities, setSelectedAmenities] = useState(listing?.amenities || []);
  const [images, setImages] = useState(listing?.images || []);

  const preferences = [
    'No smoking', 'Pet friendly', 'Quiet hours', 'Clean common areas',
    'Vegetarian friendly', 'Weekend guests OK', 'Female preferred',
    'Male preferred', 'LGBTQ+ friendly', 'Social atmosphere',
  ];

  const amenities = [
    'WiFi', 'Laundry', 'Parking', 'Gym', 'Pool', 'Backyard',
    'BBQ', 'Shared kitchen', 'Workspace', 'Garden', 'Concierge',
  ];

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (images.length >= 4) {
        Alert.alert('Limit reached', 'You can upload a maximum of 4 images');
        return;
      }
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const togglePreference = (pref) => {
    setSelectedPreferences(prev =>
      prev.includes(pref)
        ? prev.filter(p => p !== pref)
        : [...prev, pref]
    );
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = selectedDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      setAvailableDate(formattedDate);
    }
  };

  const handlePost = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }
    if (!price.trim()) {
      Alert.alert('Error', 'Please enter a price');
      return;
    }
    if (!availableDate.trim()) {
      Alert.alert('Error', 'Please enter availability date');
      return;
    }
    if (images.length < 4) {
      Alert.alert('Error', 'Please upload at least 4 images');
      return;
    }

    // In real app, this would send to backend
    const message = isEdit 
      ? 'Your roommate listing has been updated!' 
      : 'Your roommate listing has been posted!';
    Alert.alert('Success', message, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Listing' : 'Post Roommate Listing'}</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Type</Text>
          <View style={styles.typeRow}>
            {['Apartment', 'House', 'Room'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeButton, type === t && styles.typeButtonActive]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.typeButtonText, type === t && styles.typeButtonTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.sectionSubtitle}>Upload 4 photos</Text>
          <View style={styles.imagesGrid}>
            {images.map((imageUri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={20} color={colors.surface} />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 4 && (
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                <Ionicons name="add" size={32} color={colors.textSecondary} />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listing Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Looking for roommate for 2BR apartment"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.inputRow}>
            <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.inputFlex}
              placeholder="Enter address or neighborhood"
              value={location}
              onChangeText={setLocation}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Rent ($)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.inputFlex}
              placeholder="0"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available From</Text>
          <TouchableOpacity
            style={styles.inputRow}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.inputFlex, availableDate ? styles.inputText : styles.placeholderText]}>
              {availableDate || 'Select availability date'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Text style={styles.sectionSubtitle}>Select any preferences for potential roommates</Text>
          <View style={styles.chipsContainer}>
            {preferences.map((pref) => (
              <TouchableOpacity
                key={pref}
                style={[
                  styles.chip,
                  selectedPreferences.includes(pref) && styles.chipActive,
                ]}
                onPress={() => togglePreference(pref)}
              >
                <Text style={[
                  styles.chipText,
                  selectedPreferences.includes(pref) && styles.chipTextActive,
                ]}>
                  {pref}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <Text style={styles.sectionSubtitle}>Select available amenities</Text>
          <View style={styles.chipsContainer}>
            {amenities.map((amenity) => (
              <TouchableOpacity
                key={amenity}
                style={[
                  styles.chip,
                  selectedAmenities.includes(amenity) && styles.chipActive,
                ]}
                onPress={() => toggleAmenity(amenity)}
              >
                <Text style={[
                  styles.chipText,
                  selectedAmenities.includes(amenity) && styles.chipTextActive,
                ]}>
                  {amenity}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell potential roommates about yourself, the space, and what you're looking for..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </ScrollView>

      {/* Post Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.postButton} onPress={handlePost}>
          <Text style={styles.postButtonText}>Post Listing</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.surface} />
        </TouchableOpacity>
      </View>
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
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: colors.surface,
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
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  inputFlex: {
    flex: 1,
    fontSize: 15,
  },
  inputText: {
    color: colors.text,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.surface,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageContainer: {
    position: 'relative',
    width: (windowWidth - 64) / 2,
    height: (windowWidth - 64) / 2,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  addImageButton: {
    width: (windowWidth - 64) / 2,
    height: (windowWidth - 64) / 2,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addImageText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  bottomBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 28,
    gap: 8,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },
});

export default PostRoommateListingScreen;
