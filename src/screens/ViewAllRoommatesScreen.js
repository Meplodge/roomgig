import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import FilterButton from '../components/FilterButton';

const mockRoommateListings = [
  {
    id: '1',
    type: 'Apartment',
    title: 'Looking for roommate for 2BR apartment',
    location: 'Downtown, Seattle',
    price: 1200,
    available: 'Available now',
    postedBy: {
      name: 'Sarah Johnson',
      avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
      age: 28,
      occupation: 'Software Engineer',
    },
    preferences: ['No smoking', 'Pet friendly', 'Quiet hours 10pm-7am'],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600'],
    amenities: ['WiFi', 'Laundry', 'Parking', 'Gym'],
  },
  {
    id: '2',
    type: 'House',
    title: 'Room available in shared house',
    location: 'Capitol Hill, Seattle',
    price: 900,
    available: 'Available July 1st',
    postedBy: {
      name: 'Mike Chen',
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      age: 31,
      occupation: 'Designer',
    },
    preferences: ['Clean common areas', 'Vegetarian friendly', 'Weekend guests OK'],
    images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600'],
    amenities: ['Backyard', 'BBQ', 'WiFi', 'Parking'],
  },
  {
    id: '3',
    type: 'Room',
    title: 'Private room in modern apartment',
    location: 'Belltown, Seattle',
    price: 1500,
    available: 'Available immediately',
    postedBy: {
      name: 'Emily Davis',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      age: 26,
      occupation: 'Marketing Manager',
    },
    preferences: ['Female preferred', 'Professional', 'No pets'],
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'],
    amenities: ['Pool', 'Gym', 'Concierge', 'WiFi'],
  },
  {
    id: '4',
    type: 'Apartment',
    title: 'Co-living space with private room',
    location: 'Fremont, Seattle',
    price: 1100,
    available: 'Available August 1st',
    postedBy: {
      name: 'Alex Thompson',
      avatar: 'https://randomuser.me/api/portraits/men/33.jpg',
      age: 29,
      occupation: 'Teacher',
    },
    preferences: ['LGBTQ+ friendly', 'Social atmosphere', 'Shared meals'],
    images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600'],
    amenities: ['Shared kitchen', 'Workspace', 'Garden', 'WiFi'],
  },
];

const roommateTypes = ['All', 'Apartment', 'House', 'Room'];

const ViewAllRoommatesScreen = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const filteredListings = selectedType === 'All' 
    ? mockRoommateListings 
    : mockRoommateListings.filter(listing => listing.type === selectedType);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderListing = ({ item }) => (
    <TouchableOpacity
      style={styles.personCard}
      onPress={() => navigation.navigate('RoommateDetails', { listing: item })}
    >
      <Image source={{ uri: item.postedBy.avatar }} style={styles.personAvatar} />
      <Text style={styles.personName} numberOfLines={1}>{item.postedBy.name}</Text>
      <Text style={styles.personDetails} numberOfLines={1}>{item.postedBy.occupation}</Text>
    </TouchableOpacity>
  );

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

      {/* Listings */}
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
            <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No roommates found</Text>
          </View>
        }
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
  personCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    alignItems: 'center',
    height: 160,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  personAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    backgroundColor: colors.border,
  },
  personName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  personDetails: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
});

export default ViewAllRoommatesScreen;
