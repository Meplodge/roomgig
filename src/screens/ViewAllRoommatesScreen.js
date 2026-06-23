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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import FilterButton from '../components/FilterButton';
import { getRoommateListings } from '../services/supabaseApi';

const roommateTypes = ['All', 'Apartment', 'House', 'Room'];

const ViewAllRoommatesScreen = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const filteredListings = selectedType === 'All' 
    ? listings 
    : listings.filter(listing => listing.type === selectedType);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
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
              <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No roommates found</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
});

export default ViewAllRoommatesScreen;
