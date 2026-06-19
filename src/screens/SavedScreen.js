import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { properties } from '../data/mockData';
import PropertyCard from '../components/PropertyCard';
import BottomNavBar from '../components/BottomNavBar';
import EmptyState from '../components/EmptyState';
import { useAppData } from '../context/AppDataContext';

const SavedScreen = ({ navigation }) => {
  const { favorites, toggleFavorite } = useAppData();
  const saved = properties.filter((p) => favorites.includes(p.id));

  const removeItem = (id) => {
    toggleFavorite(id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Properties</Text>
        <Text style={styles.subtitle}>{saved.length} properties saved</Text>
      </View>

      {saved.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="No Saved Properties"
          message="Start exploring and tap the heart icon to save properties you love."
          actionText="Explore Properties"
          onAction={() => navigation.navigate('Home')}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {saved.map((property) => (
            <View key={property.id} style={styles.cardWrapper}>
              <PropertyCard
                property={property}
                onPress={() => navigation.navigate('PropertyDetails', { property })}
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeItem(property.id)}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <BottomNavBar activeTab="roommate" navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  cardWrapper: {
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    backgroundColor: colors.surface,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default SavedScreen;
