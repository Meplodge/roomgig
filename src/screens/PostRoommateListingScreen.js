import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../constants/colors';
import { setCropHandler } from '../utils/cropBridge';
import { createRoommateListing, updateRoommateListing } from '../services/supabaseApi';
import { supabase } from '../utils/supabase';

const { width: windowWidth } = Dimensions.get('window');

const PostRoommateListingScreen = ({ navigation, route }) => {
  const { listing, isEdit } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [title, setTitle] = useState(listing?.title || '');
  const [type, setType] = useState(listing?.type || 'Apartment');
  const [location, setLocation] = useState(listing?.location || '');
  const [price, setPrice] = useState(listing?.price?.toString() || '');
  const [availableDate, setAvailableDate] = useState(listing?.available || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState(listing?.description || '');
  const [selectedPreferences, setSelectedPreferences] = useState(listing?.preferences || []);
  const [selectedAmenities, setSelectedAmenities] = useState(listing?.amenities || []);
  const [images, setImages] = useState(listing?.images || []);
  const [roommatePhotoIndex, setRoommatePhotoIndex] = useState(listing?.roommatePhotoIndex || null);
  
  // Personal Information
  const [age, setAge] = useState(listing?.age?.toString() || '');
  const [occupation, setOccupation] = useState(listing?.occupation || '');
  const [sleepSchedule, setSleepSchedule] = useState(listing?.sleepSchedule || 'flexible');
  const [workSchedule, setWorkSchedule] = useState(listing?.workSchedule || 'office');
  const [dietaryPreference, setDietaryPreference] = useState(listing?.dietaryPreference || 'omnivore');
  const [languages, setLanguages] = useState(Array.isArray(listing?.languages) ? listing.languages.join(', ') : (listing?.languages || ''));
  const [socialStyle, setSocialStyle] = useState(listing?.socialStyle || 'ambivert');
  const [cleanlinessLevel, setCleanlinessLevel] = useState(listing?.cleanlinessLevel || 'moderate');
  
  // Lifestyle Preferences
  const [guestPolicy, setGuestPolicy] = useState(listing?.guestPolicy || 'occasional');
  const [noiseTolerance, setNoiseTolerance] = useState(listing?.noiseTolerance || 'moderate');
  const [cookingHabits, setCookingHabits] = useState(listing?.cookingHabits || 'sometimes');
  const [alcoholConsumption, setAlcoholConsumption] = useState(listing?.alcoholConsumption || 'social');
  const [workEnvironment, setWorkEnvironment] = useState(listing?.workEnvironment || 'moderate_noise');
  const [dietaryAllergies, setDietaryAllergies] = useState(Array.isArray(listing?.dietaryAllergies) ? listing.dietaryAllergies.join(', ') : (listing?.dietaryAllergies || ''));

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
      }
    };
    getCurrentUser();
  }, []);

  // Auto-close success modal after 2 seconds
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
        navigation.goBack();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, navigation]);

  // Redirect to login if user is not authenticated
  if (!currentUser) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const preferences = [
    'No smoking', 'Pet friendly', 'Quiet hours', 'Clean common areas',
    'Vegetarian friendly', 'Weekend guests OK', 'Female preferred',
    'Male preferred', 'LGBTQ+ friendly', 'Social atmosphere',
  ];

  const amenities = [
    'WiFi', 'Laundry', 'Parking', 'Gym', 'Pool', 'Backyard',
    'BBQ', 'Shared kitchen', 'Workspace', 'Garden', 'Concierge',
  ];

  const sleepScheduleOptions = [
    { label: 'Early Bird', value: 'early_bird' },
    { label: 'Night Owl', value: 'night_owl' },
    { label: 'Flexible', value: 'flexible' },
  ];

  const workScheduleOptions = [
    { label: 'Remote', value: 'remote' },
    { label: 'Office', value: 'office' },
    { label: 'Hybrid', value: 'hybrid' },
    { label: 'Student', value: 'student' },
    { label: 'Unemployed', value: 'unemployed' },
    { label: 'Retired', value: 'retired' },
  ];

  const dietaryOptions = [
    { label: 'Omnivore', value: 'omnivore' },
    { label: 'Vegetarian', value: 'vegetarian' },
    { label: 'Vegan', value: 'vegan' },
    { label: 'Allergies', value: 'allergies' },
    { label: 'Other', value: 'other' },
  ];

  const socialStyleOptions = [
    { label: 'Introvert', value: 'introvert' },
    { label: 'Extrovert', value: 'extrovert' },
    { label: 'Ambivert', value: 'ambivert' },
  ];

  const cleanlinessOptions = [
    { label: 'Minimal', value: 'minimal' },
    { label: 'Moderate', value: 'moderate' },
    { label: 'Very Clean', value: 'very_clean' },
    { label: 'Obsessive', value: 'obsessive' },
  ];

  const guestPolicyOptions = [
    { label: 'No Guests', value: 'no_guests' },
    { label: 'Occasional', value: 'occasional' },
    { label: 'Frequent', value: 'frequent' },
  ];

  const noiseToleranceOptions = [
    { label: 'Quiet', value: 'quiet' },
    { label: 'Moderate', value: 'moderate' },
    { label: 'Loud', value: 'loud' },
  ];

  const cookingHabitsOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Sometimes', value: 'sometimes' },
    { label: 'Rarely', value: 'rarely' },
    { label: 'Never', value: 'never' },
  ];

  const alcoholOptions = [
    { label: 'Non-drinker', value: 'non_drinker' },
    { label: 'Social', value: 'social' },
    { label: 'Regular', value: 'regular' },
  ];

  const workEnvironmentOptions = [
    { label: 'Needs Quiet', value: 'needs_quiet' },
    { label: 'Moderate Noise', value: 'moderate_noise' },
    { label: "Doesn't Mind Noise", value: 'doesnt_mind_noise' },
  ];

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images');
      return;
    }

    if (images.length >= 4) {
      Alert.alert('Limit reached', 'You can upload a maximum of 4 images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setCropHandler((croppedUri) => {
        setImages((prev) => {
          const newImages = prev.length >= 4 ? prev : [...prev, croppedUri];
          // Auto-set first image as roommate photo
          if (newImages.length === 1) {
            setRoommatePhotoIndex(0);
          }
          return newImages;
        });
      });
      navigation.navigate('ImageCrop', {
        imageUri: asset.uri,
        imageWidth: asset.width,
        imageHeight: asset.height,
      });
    }
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      // Reset roommate photo index if first image was removed
      if (index === roommatePhotoIndex) {
        setRoommatePhotoIndex(newImages.length > 0 ? 0 : null);
      } else if (index < roommatePhotoIndex) {
        setRoommatePhotoIndex(roommatePhotoIndex - 1);
      }
      return newImages;
    });
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

  const handlePost = async () => {
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
    if (!age.trim()) {
      Alert.alert('Error', 'Please enter your age');
      return;
    }
    if (images.length < 1) {
      Alert.alert('Error', 'Please upload at least 1 image');
      return;
    }

    try {
      setLoading(true);
      
      const listingData = {
        title,
        type,
        location,
        price: parseFloat(price),
        available: availableDate,
        age: parseInt(age),
        occupation,
        description,
        preferences: selectedPreferences,
        amenities: selectedAmenities,
        images,
        roommatePhotoIndex,
        sleepSchedule,
        workSchedule,
        dietaryPreference,
        languages,
        socialStyle,
        cleanlinessLevel,
        guestPolicy,
        noiseTolerance,
        cookingHabits,
        alcoholConsumption,
        workEnvironment,
        dietaryAllergies,
      };

      if (isEdit && listing?.id) {
        await updateRoommateListing(listing.id, listingData, currentUser.id);
      } else {
        await createRoommateListing(listingData, currentUser.id);
      }
      
      const message = isEdit
        ? 'Your roommate listing has been updated!'
        : 'Your roommate listing has been posted!';
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error posting roommate listing:', error);
      Alert.alert('Error', 'Failed to post listing. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.sectionSubtitle}>Upload 4 photos • First photo is your roommate photo</Text>
          <View style={styles.imagesGrid}>
            {images.map((imageUri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
                {roommatePhotoIndex === index && (
                  <View style={styles.roommatePhotoBadge}>
                    <Ionicons name="person" size={12} color={colors.surface} />
                    <Text style={styles.roommatePhotoBadgeText}>You</Text>
                  </View>
                )}
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

        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          {/* Age */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Your Age</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your age"
              placeholderTextColor={colors.textSecondary}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
          
          {/* Occupation */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Your Occupation</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Software Engineer, Student"
              placeholderTextColor={colors.textSecondary}
              value={occupation}
              onChangeText={setOccupation}
            />
          </View>
          
          {/* Sleep Schedule */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Sleep Schedule</Text>
            <View style={styles.optionsRow}>
              {sleepScheduleOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, sleepSchedule === option.value && styles.optionButtonActive]}
                  onPress={() => setSleepSchedule(option.value)}
                >
                  <Text style={[styles.optionText, sleepSchedule === option.value && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Work Schedule */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Work Schedule</Text>
            <View style={styles.optionsRow}>
              {workScheduleOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, workSchedule === option.value && styles.optionButtonActive]}
                  onPress={() => setWorkSchedule(option.value)}
                >
                  <Text style={[styles.optionText, workSchedule === option.value && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dietary Preference */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Dietary Preference</Text>
            <View style={styles.optionsRow}>
              {dietaryOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, dietaryPreference === option.value && styles.optionButtonActive]}
                  onPress={() => setDietaryPreference(option.value)}
                >
                  <Text style={[styles.optionText, dietaryPreference === option.value && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Languages */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Languages Spoken</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., English, Spanish, French"
              value={languages}
              onChangeText={setLanguages}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Social Style */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Social Style</Text>
            <View style={styles.optionsRow}>
              {socialStyleOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, socialStyle === option.value && styles.optionButtonActive]}
                  onPress={() => setSocialStyle(option.value)}
                >
                  <Text style={[styles.optionText, socialStyle === option.value && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cleanliness Level */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Cleanliness Level</Text>
            <View style={styles.optionsRow}>
              {cleanlinessOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, cleanlinessLevel === option.value && styles.optionButtonActive]}
                  onPress={() => setCleanlinessLevel(option.value)}
                >
                  <Text style={[styles.optionText, cleanlinessLevel === option.value && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Lifestyle Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lifestyle Preferences</Text>
          
          {/* Guest Policy */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Guest Policy</Text>
            <View style={styles.optionsRow}>
              {guestPolicyOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, guestPolicy === option.value && styles.optionButtonActive]}
                  onPress={() => setGuestPolicy(option.value)}
                >
                  <Text style={[styles.optionText, guestPolicy === option.value && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Noise Tolerance */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Noise Tolerance</Text>
            <View style={styles.optionsRow}>
              {noiseToleranceOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, noiseTolerance === option.value && styles.optionButtonActive]}
                  onPress={() => setNoiseTolerance(option.value)}
                >
                  <Text style={[styles.optionText, noiseTolerance === option.value && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cooking Habits */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Cooking Habits</Text>
            <View style={styles.optionsRow}>
              {cookingHabitsOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, cookingHabits === option.value && styles.optionButtonActive]}
                  onPress={() => setCookingHabits(option.value)}
                >
                  <Text style={[styles.optionText, cookingHabits === option.value && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Alcohol Consumption */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Alcohol Consumption</Text>
            <View style={styles.optionsRow}>
              {alcoholOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, alcoholConsumption === option.value && styles.optionButtonActive]}
                  onPress={() => setAlcoholConsumption(option.value)}
                >
                  <Text style={[styles.optionText, alcoholConsumption === option.value && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Work Environment */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Work Environment</Text>
            <View style={styles.optionsRow}>
              {workEnvironmentOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, workEnvironment === option.value && styles.optionButtonActive]}
                  onPress={() => setWorkEnvironment(option.value)}
                >
                  <Text style={[styles.optionText, workEnvironment === option.value && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dietary Allergies */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Dietary Allergies (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="List any food allergies"
              value={dietaryAllergies}
              onChangeText={setDietaryAllergies}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>
      </ScrollView>

      {/* Post Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.postButton} 
          onPress={handlePost}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <>
              <Text style={styles.postButtonText}>Post Listing</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.surface} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color={colors.primary} />
            </View>
            <Text style={styles.successTitle}>
              {isEdit ? 'Listing Updated!' : 'Listing Posted!'}
            </Text>
            <Text style={styles.successMessage}>
              {isEdit
                ? 'Your roommate listing has been successfully updated.'
                : 'Your roommate listing has been successfully posted.'}
            </Text>
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
  subsection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  optionTextActive: {
    color: colors.surface,
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
  roommatePhotoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roommatePhotoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.surface,
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
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default PostRoommateListingScreen;
