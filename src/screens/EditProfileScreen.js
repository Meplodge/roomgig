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
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/supabaseApi';

const EditProfileScreen = ({ navigation }) => {
  const { user, profile, loadProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    bio: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    city: '',
    preferredLocation: '',
    occupation: '',
    companyName: '',
    workLocation: '',
  });
  const [avatar, setAvatar] = useState(user?.avatar || null);

  // Load profile data when component mounts
  useEffect(() => {
    if (user && !profile) {
      loadProfile(user.id);
    }
  }, [user, profile, loadProfile]);

  // Update form data when profile data is loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.full_name || user?.name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        dateOfBirth: profile.date_of_birth || '',
        gender: profile.gender || '',
        nationality: profile.nationality || '',
        city: profile.city || '',
        preferredLocation: profile.preferred_location || '',
        occupation: profile.occupation || '',
        companyName: profile.company_name || '',
        workLocation: profile.work_location || '',
      });
      setAvatar(profile.avatar_url || user?.avatar || null);
    }
  }, [profile, user]);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');

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

  const genderOptions = ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other'];

  const countries = [
    { name: 'Zimbabwe', flag: '🇿🇼', code: 'ZW' },
    { name: 'South Africa', flag: '🇿🇦', code: 'ZA' },
    { name: 'Nigeria', flag: '🇳🇬', code: 'NG' },
    { name: 'Kenya', flag: '🇰🇪', code: 'KE' },
    { name: 'Ghana', flag: '🇬🇭', code: 'GH' },
    { name: 'Ethiopia', flag: '🇪🇹', code: 'ET' },
    { name: 'Egypt', flag: '🇪🇬', code: 'EG' },
    { name: 'Tanzania', flag: '🇹🇿', code: 'TZ' },
    { name: 'Democratic Republic of the Congo', flag: '🇨🇩', code: 'CD' },
    { name: 'South Sudan', flag: '🇸🇸', code: 'SS' },
    { name: 'Uganda', flag: '🇺🇬', code: 'UG' },
    { name: 'Algeria', flag: '🇩🇿', code: 'DZ' },
    { name: 'Sudan', flag: '🇸🇩', code: 'SD' },
    { name: 'Morocco', flag: '🇲🇦', code: 'MA' },
    { name: 'Angola', flag: '🇦🇴', code: 'AO' },
    { name: 'Mozambique', flag: '🇲🇿', code: 'MZ' },
    { name: 'Madagascar', flag: '🇲🇬', code: 'MG' },
    { name: 'Cameroon', flag: '🇨🇲', code: 'CM' },
    { name: 'Ivory Coast', flag: '🇨🇮', code: 'CI' },
    { name: 'Niger', flag: '🇳🇪', code: 'NE' },
    { name: 'Burkina Faso', flag: '🇧🇫', code: 'BF' },
    { name: 'Mali', flag: '🇲🇱', code: 'ML' },
    { name: 'Malawi', flag: '🇲🇼', code: 'MW' },
    { name: 'Zambia', flag: '🇿🇲', code: 'ZM' },
    { name: 'Senegal', flag: '🇸🇳', code: 'SN' },
    { name: 'Chad', flag: '🇹🇩', code: 'TD' },
    { name: 'Somalia', flag: '🇸🇴', code: 'SO' },
    { name: 'Guinea', flag: '🇬🇳', code: 'GN' },
    { name: 'Rwanda', flag: '🇷🇼', code: 'RW' },
    { name: 'Benin', flag: '🇧🇯', code: 'BJ' },
    { name: 'Burundi', flag: '🇧🇮', code: 'BI' },
    { name: 'Tunisia', flag: '🇹🇳', code: 'TN' },
    { name: 'Sierra Leone', flag: '🇸🇱', code: 'SL' },
    { name: 'Liberia', flag: '🇱🇷', code: 'LR' },
    { name: 'Central African Republic', flag: '🇨🇫', code: 'CF' },
    { name: 'Eritrea', flag: '🇪🇷', code: 'ER' },
    { name: 'Togo', flag: '🇹🇬', code: 'TG' },
    { name: 'Libya', flag: '🇱🇾', code: 'LY' },
    { name: 'Gabon', flag: '🇬🇦', code: 'GA' },
    { name: 'Congo', flag: '🇨🇬', code: 'CG' },
    { name: 'Equatorial Guinea', flag: '🇬🇶', code: 'GQ' },
    { name: 'Mauritania', flag: '🇲🇷', code: 'MR' },
    { name: 'Namibia', flag: '🇳🇦', code: 'NA' },
    { name: 'Gambia', flag: '🇬🇲', code: 'GM' },
    { name: 'Botswana', flag: '🇧🇼', code: 'BW' },
    { name: 'Lesotho', flag: '🇱🇸', code: 'LS' },
    { name: 'Guinea-Bissau', flag: '🇬🇼', code: 'GW' },
    { name: 'Eswatini', flag: '🇸🇿', code: 'SZ' },
    { name: 'Djibouti', flag: '🇩🇯', code: 'DJ' },
    { name: 'Comoros', flag: '🇰🇲', code: 'KM' },
    { name: 'Cabo Verde', flag: '🇨🇻', code: 'CV' },
    { name: 'Seychelles', flag: '🇸🇨', code: 'SC' },
    { name: 'Mauritius', flag: '🇲🇺', code: 'MU' },
    { name: 'Sao Tome and Principe', flag: '🇸🇹', code: 'ST' },
    { name: 'Afghanistan', flag: '🇦🇫', code: 'AF' },
    { name: 'Albania', flag: '🇦🇱', code: 'AL' },
    { name: 'Andorra', flag: '🇦🇩', code: 'AD' },
    { name: 'Argentina', flag: '🇦🇷', code: 'AR' },
    { name: 'Armenia', flag: '🇦🇲', code: 'AM' },
    { name: 'Australia', flag: '🇦🇺', code: 'AU' },
    { name: 'Austria', flag: '🇦🇹', code: 'AT' },
    { name: 'Azerbaijan', flag: '🇦🇿', code: 'AZ' },
    { name: 'Bahamas', flag: '🇧🇸', code: 'BS' },
    { name: 'Bahrain', flag: '🇧🇭', code: 'BH' },
    { name: 'Bangladesh', flag: '🇧🇩', code: 'BD' },
    { name: 'Barbados', flag: '🇧🇧', code: 'BB' },
    { name: 'Belarus', flag: '🇧🇾', code: 'BY' },
    { name: 'Belgium', flag: '🇧🇪', code: 'BE' },
    { name: 'Belize', flag: '🇧🇿', code: 'BZ' },
    { name: 'Bhutan', flag: '🇧🇹', code: 'BT' },
    { name: 'Bolivia', flag: '🇧🇴', code: 'BO' },
    { name: 'Bosnia and Herzegovina', flag: '🇧🇦', code: 'BA' },
    { name: 'Brazil', flag: '🇧🇷', code: 'BR' },
    { name: 'Brunei', flag: '🇧🇳', code: 'BN' },
    { name: 'Bulgaria', flag: '🇧🇬', code: 'BG' },
    { name: 'Cambodia', flag: '🇰🇭', code: 'KH' },
    { name: 'Canada', flag: '🇨🇦', code: 'CA' },
    { name: 'Chile', flag: '🇨🇱', code: 'CL' },
    { name: 'China', flag: '🇨🇳', code: 'CN' },
    { name: 'Colombia', flag: '🇨🇴', code: 'CO' },
    { name: 'Costa Rica', flag: '🇨🇷', code: 'CR' },
    { name: 'Croatia', flag: '🇭🇷', code: 'HR' },
    { name: 'Cuba', flag: '🇨🇺', code: 'CU' },
    { name: 'Cyprus', flag: '🇨🇾', code: 'CY' },
    { name: 'Czech Republic', flag: '🇨🇿', code: 'CZ' },
    { name: 'Denmark', flag: '🇩🇰', code: 'DK' },
    { name: 'Dominican Republic', flag: '🇩🇴', code: 'DO' },
    { name: 'Ecuador', flag: '🇪🇨', code: 'EC' },
    { name: 'El Salvador', flag: '🇸🇻', code: 'SV' },
    { name: 'Estonia', flag: '🇪🇪', code: 'EE' },
    { name: 'Finland', flag: '🇫🇮', code: 'FI' },
    { name: 'France', flag: '🇫🇷', code: 'FR' },
    { name: 'Georgia', flag: '🇬🇪', code: 'GE' },
    { name: 'Germany', flag: '🇩🇪', code: 'DE' },
    { name: 'Greece', flag: '🇬🇷', code: 'GR' },
    { name: 'Guatemala', flag: '🇬🇹', code: 'GT' },
    { name: 'Haiti', flag: '🇭🇹', code: 'HT' },
    { name: 'Honduras', flag: '🇭🇳', code: 'HN' },
    { name: 'Hong Kong', flag: '🇭🇰', code: 'HK' },
    { name: 'Hungary', flag: '🇭🇺', code: 'HU' },
    { name: 'Iceland', flag: '🇮🇸', code: 'IS' },
    { name: 'India', flag: '🇮🇳', code: 'IN' },
    { name: 'Indonesia', flag: '🇮🇩', code: 'ID' },
    { name: 'Iran', flag: '🇮🇷', code: 'IR' },
    { name: 'Iraq', flag: '🇮🇶', code: 'IQ' },
    { name: 'Ireland', flag: '🇮🇪', code: 'IE' },
    { name: 'Israel', flag: '🇮🇱', code: 'IL' },
    { name: 'Italy', flag: '🇮🇹', code: 'IT' },
    { name: 'Jamaica', flag: '🇯🇲', code: 'JM' },
    { name: 'Japan', flag: '🇯🇵', code: 'JP' },
    { name: 'Jordan', flag: '🇯🇴', code: 'JO' },
    { name: 'Kazakhstan', flag: '🇰🇿', code: 'KZ' },
    { name: 'Kuwait', flag: '🇰🇼', code: 'KW' },
    { name: 'Kyrgyzstan', flag: '🇰🇬', code: 'KG' },
    { name: 'Laos', flag: '🇱🇦', code: 'LA' },
    { name: 'Latvia', flag: '🇱🇻', code: 'LV' },
    { name: 'Lebanon', flag: '🇱🇧', code: 'LB' },
    { name: 'Lithuania', flag: '🇱🇹', code: 'LT' },
    { name: 'Luxembourg', flag: '🇱🇺', code: 'LU' },
    { name: 'Macau', flag: '🇲🇴', code: 'MO' },
    { name: 'Malaysia', flag: '🇲🇾', code: 'MY' },
    { name: 'Maldives', flag: '🇲🇻', code: 'MV' },
    { name: 'Mexico', flag: '🇲🇽', code: 'MX' },
    { name: 'Moldova', flag: '🇲🇩', code: 'MD' },
    { name: 'Monaco', flag: '🇲🇨', code: 'MC' },
    { name: 'Mongolia', flag: '🇲🇳', code: 'MN' },
    { name: 'Montenegro', flag: '🇲🇪', code: 'ME' },
    { name: 'Myanmar', flag: '🇲🇲', code: 'MM' },
    { name: 'Nepal', flag: '🇳🇵', code: 'NP' },
    { name: 'Netherlands', flag: '🇳🇱', code: 'NL' },
    { name: 'New Zealand', flag: '🇳🇿', code: 'NZ' },
    { name: 'Nicaragua', flag: '🇳🇮', code: 'NI' },
    { name: 'North Korea', flag: '🇰🇵', code: 'KP' },
    { name: 'North Macedonia', flag: '🇲🇰', code: 'MK' },
    { name: 'Norway', flag: '🇳🇴', code: 'NO' },
    { name: 'Oman', flag: '🇴🇲', code: 'OM' },
    { name: 'Pakistan', flag: '🇵🇰', code: 'PK' },
    { name: 'Panama', flag: '🇵🇦', code: 'PA' },
    { name: 'Paraguay', flag: '🇵🇾', code: 'PY' },
    { name: 'Peru', flag: '🇵🇪', code: 'PE' },
    { name: 'Philippines', flag: '🇵🇭', code: 'PH' },
    { name: 'Poland', flag: '🇵🇱', code: 'PL' },
    { name: 'Portugal', flag: '🇵🇹', code: 'PT' },
    { name: 'Qatar', flag: '🇶🇦', code: 'QA' },
    { name: 'Romania', flag: '🇷🇴', code: 'RO' },
    { name: 'Russia', flag: '🇷🇺', code: 'RU' },
    { name: 'Saudi Arabia', flag: '🇸🇦', code: 'SA' },
    { name: 'Serbia', flag: '🇷🇸', code: 'RS' },
    { name: 'Singapore', flag: '🇸🇬', code: 'SG' },
    { name: 'Slovakia', flag: '🇸🇰', code: 'SK' },
    { name: 'Slovenia', flag: '🇸🇮', code: 'SI' },
    { name: 'South Korea', flag: '🇰🇷', code: 'KR' },
    { name: 'Spain', flag: '🇪🇸', code: 'ES' },
    { name: 'Sri Lanka', flag: '🇱🇰', code: 'LK' },
    { name: 'Sweden', flag: '🇸🇪', code: 'SE' },
    { name: 'Switzerland', flag: '🇨🇭', code: 'CH' },
    { name: 'Syria', flag: '🇸🇾', code: 'SY' },
    { name: 'Taiwan', flag: '🇹🇼', code: 'TW' },
    { name: 'Thailand', flag: '🇹🇭', code: 'TH' },
    { name: 'Turkey', flag: '🇹🇷', code: 'TR' },
    { name: 'Ukraine', flag: '🇺🇦', code: 'UA' },
    { name: 'United Arab Emirates', flag: '🇦🇪', code: 'AE' },
    { name: 'United Kingdom', flag: '🇬🇧', code: 'GB' },
    { name: 'United States', flag: '🇺🇸', code: 'US' },
    { name: 'Uruguay', flag: '🇺🇾', code: 'UY' },
    { name: 'Uzbekistan', flag: '🇺🇿', code: 'UZ' },
    { name: 'Vatican City', flag: '🇻🇦', code: 'VA' },
    { name: 'Venezuela', flag: '🇻🇪', code: 'VE' },
    { name: 'Vietnam', flag: '🇻🇳', code: 'VN' },
    { name: 'Yemen', flag: '🇾🇪', code: 'YE' },
  ].sort((a, b) => a.name.localeCompare(b.name));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload image');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const date = new Date(selectedDate);
      const formattedDate = date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      setFormData({ ...formData, dateOfBirth: formattedDate });
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Map form data to database fields
      const profileUpdates = {
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        nationality: formData.nationality || null,
        city: formData.city || null,
        preferred_location: formData.preferredLocation || null,
        occupation: formData.occupation || null,
        company_name: formData.companyName || null,
        work_location: formData.workLocation || null,
        bio: formData.bio || null,
      };

      await updateProfile(user.id, profileUpdates);

      // Refresh profile data in context
      await loadProfile(user.id);

      setLoading(false);
      setShowSuccessModal(true);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', `Failed to update profile: ${error.message}`);
    }
  };

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchCountry.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? (
            <Text style={styles.saveButtonText}>Saving...</Text>
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={avatar ? { uri: avatar } : { uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
              <Ionicons name="camera" size={20} color={colors.surface} />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarText}>Tap to change photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textLight}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={colors.textLight}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.textLight}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />
          </View>

          {/* Personal Information */}
          <Text style={styles.sectionHeader}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={formData.dateOfBirth ? styles.inputText : styles.placeholderText}>
                {formData.dateOfBirth || 'DD/MM/YYYY'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.dateOfBirth ? new Date(formData.dateOfBirth.split('/').reverse().join('-')) : new Date(2000, 0, 1)}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowGenderModal(true)}
            >
              <Text style={formData.gender ? styles.inputText : styles.placeholderText}>
                {formData.gender || 'Select gender'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nationality</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowCountryModal(true)}
            >
              <Text style={formData.nationality ? styles.inputText : styles.placeholderText}>
                {formData.nationality || 'Select nationality'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Location */}
          <Text style={styles.sectionHeader}>Location</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City/Region</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your city or region"
              placeholderTextColor={colors.textLight}
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Preferred area for properties"
              placeholderTextColor={colors.textLight}
              value={formData.preferredLocation}
              onChangeText={(text) => setFormData({ ...formData, preferredLocation: text })}
            />
          </View>

          {/* Professional */}
          <Text style={styles.sectionHeader}>Professional</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Occupation</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your occupation"
              placeholderTextColor={colors.textLight}
              value={formData.occupation}
              onChangeText={(text) => setFormData({ ...formData, occupation: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter company name (optional)"
              placeholderTextColor={colors.textLight}
              value={formData.companyName}
              onChangeText={(text) => setFormData({ ...formData, companyName: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Work Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your work location"
              placeholderTextColor={colors.textLight}
              value={formData.workLocation}
              onChangeText={(text) => setFormData({ ...formData, workLocation: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about yourself..."
              placeholderTextColor={colors.textLight}
              value={formData.bio}
              onChangeText={(text) => setFormData({ ...formData, bio: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      {/* Gender Modal */}
      <Modal
        visible={showGenderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              <TouchableOpacity onPress={() => setShowGenderModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={genderOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({ ...formData, gender: item });
                    setShowGenderModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {formData.gender === item && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Country Modal */}
      <Modal
        visible={showCountryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Nationality</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search country..."
                placeholderTextColor={colors.textLight}
                value={searchCountry}
                onChangeText={setSearchCountry}
              />
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({ ...formData, nationality: item.name });
                    setShowCountryModal(false);
                    setSearchCountry('');
                  }}
                >
                  <Text style={styles.flagText}>{item.flag}</Text>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {formData.nationality === item.name && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

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
            <Text style={styles.successTitle}>Profile Updated!</Text>
            <Text style={styles.successMessage}>
              Your profile has been successfully updated.
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.border,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  avatarText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  formSection: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 15,
    color: colors.text,
  },
  placeholderText: {
    fontSize: 15,
    color: colors.textLight,
  },
  textArea: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  modalItemText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  flagText: {
    fontSize: 24,
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

export default EditProfileScreen;
