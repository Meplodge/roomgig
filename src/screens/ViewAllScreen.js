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
import { useAppData } from '../context/AppDataContext';
import FilterButton from '../components/FilterButton';
import BottomNavBar from '../components/BottomNavBar';
import { filterTypes } from '../data/mockData';

const ViewAllScreen = ({ navigation }) => {
  const { propertiesList } = useAppData();
  const [selectedFilter, setSelectedFilter] = useState('Any Type');
  const [refreshing, setRefreshing] = useState(false);

  const filteredProperties = (propertiesList || []).filter(
    (property) => selectedFilter === 'Any Type' || property.category === selectedFilter
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderProperty = ({ item }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => navigation.navigate('PropertyDetails', { property: item })}
    >
      <Image source={{ uri: item.image }} style={styles.propertyImage} />
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.propertyLocation}>
          <Ionicons name="location" size={12} color={colors.textSecondary} />
          <Text style={styles.propertyLocationText} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
        <View style={styles.propertyFooter}>
          <Text style={styles.propertyPrice}>${item.price.toLocaleString()}</Text>
          <Text style={styles.propertyType}>{item.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>View All Properties</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['Any Type', ...filterTypes]}
          keyExtractor={(item, index) => `filter-${index}`}
          renderItem={({ item }) => (
            <FilterButton
              label={item}
              selected={selectedFilter === item}
              onPress={() => setSelectedFilter(item)}
            />
          )}
          contentContainerStyle={styles.filterContent}
        />
      </View>

      {/* Properties Grid */}
      <FlatList
        data={filteredProperties}
        renderItem={renderProperty}
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
            <Ionicons name="home-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No properties found</Text>
          </View>
        }
      />

      {/* Bottom Navigation */}
      <BottomNavBar activeTab="location" navigation={navigation} />
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
    paddingBottom: 120,
  },
  row: {
    justifyContent: 'space-between',
  },
  propertyCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  propertyImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  propertyInfo: {
    padding: 12,
  },
  propertyName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  propertyLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  propertyLocationText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  propertyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  propertyType: {
    fontSize: 11,
    color: colors.textSecondary,
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

export default ViewAllScreen;
