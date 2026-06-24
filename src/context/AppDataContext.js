import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { getProperties, getFavorites, toggleFavorite as toggleFavoriteApi, getBookings, createBooking, createProperty as createPropertyApi, testConnection } from '../services/supabaseApi';

const AppDataContext = createContext(null);

const FAV_KEY = '@realestate_favorites';
const BOOKINGS_KEY = '@realestate_bookings';

const monthsBetween = (start, end) => {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  const months = Math.round((e - s) / (1000 * 60 * 60 * 24 * 30));
  return Math.max(1, months);
};

const mapBooking = (b) => {
  const images = b.properties?.property_images || [];
  const primary = images.find((img) => img.is_primary) || images[0];
  return {
    reference: b.reference,
    propertyName: b.properties?.title || 'Property',
    propertyImage: primary?.image_url,
    date: b.check_in_date,
    months: monthsBetween(b.check_in_date, b.check_out_date),
    guests: b.guests || 1,
    total: Number(b.total_amount) || 0,
  };
};

export const AppDataProvider = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]); // array of property ids
  const [bookings, setBookings] = useState([]); // array of booking objects
  const [propertiesList, setPropertiesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Test database connection on startup
    testConnection();
    loadFavorites();
    loadBookings();
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (user) {
      loadProperties();
      loadFavorites();
      loadBookings();
    }
  }, [user]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await getProperties();
      setPropertiesList(data);
    } catch (e) {
      console.error('Error loading properties:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;
    try {
      const data = await getFavorites(user.id);
      const favoriteIds = data.map(f => f.property_id);
      setFavorites(favoriteIds);
      await AsyncStorage.setItem(FAV_KEY, JSON.stringify(favoriteIds));
    } catch (e) {
      console.error('Error loading favorites:', e);
    }
  };

  const loadBookings = async () => {
    if (!user) return;
    try {
      const data = await getBookings(user.id);
      const formatted = (data || []).map(mapBooking);
      setBookings(formatted);
      await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(formatted));
    } catch (e) {
      console.error('Error loading bookings:', e);
    }
  };

  const persistFavorites = async (next) => {
    setFavorites(next);
    try {
      await AsyncStorage.setItem(FAV_KEY, JSON.stringify(next));
    } catch (e) {
      // ignore
    }
  };

  const persistBookings = async (next) => {
    setBookings(next);
    try {
      await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(next));
    } catch (e) {
      // ignore
    }
  };

  const isFavorite = (id) => favorites.includes(id);

  const toggleFavorite = async (id) => {
    if (!user) return;
    try {
      const isNowFavorite = await toggleFavoriteApi(user.id, id);
      const next = isNowFavorite
        ? [...favorites, id]
        : favorites.filter((f) => f !== id);
      persistFavorites(next);
    } catch (e) {
      console.error('Error toggling favorite:', e);
    }
  };

  const addBooking = async (bookingData) => {
    if (!user) return;
    try {
      await createBooking({
        ...bookingData,
        user_id: user.id,
      });
      await loadBookings();
    } catch (e) {
      console.error('Error creating booking:', e);
    }
  };

  const addProperty = async (propertyData) => {
    if (!user) return;
    try {
      await createPropertyApi(propertyData, user.id);
      await loadProperties();
    } catch (e) {
      console.error('Error creating property:', e);
      throw e;
    }
  };

  return (
    <AppDataContext.Provider
      value={{
        favorites,
        bookings,
        propertiesList,
        loading,
        hydrated,
        isFavorite,
        toggleFavorite,
        addBooking,
        addProperty,
        loadProperties,
        refreshProperties: loadProperties,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return ctx;
};
