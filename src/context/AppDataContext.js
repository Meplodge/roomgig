import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { properties } from '../data/mockData';

const AppDataContext = createContext(null);

const FAV_KEY = '@realestate_favorites';
const BOOKINGS_KEY = '@realestate_bookings';
const PROPERTIES_KEY = '@realestate_properties';

export const AppDataProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]); // array of property ids
  const [bookings, setBookings] = useState([]); // array of booking objects
  const [propertiesList, setPropertiesList] = useState(properties);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [fav, bk, props] = await Promise.all([
          AsyncStorage.getItem(FAV_KEY),
          AsyncStorage.getItem(BOOKINGS_KEY),
          AsyncStorage.getItem(PROPERTIES_KEY),
        ]);
        if (fav) setFavorites(JSON.parse(fav));
        if (bk) setBookings(JSON.parse(bk));
        if (props) setPropertiesList(JSON.parse(props));
      } catch (e) {
        // ignore read errors
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

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

  const persistProperties = async (next) => {
    setPropertiesList(next);
    try {
      await AsyncStorage.setItem(PROPERTIES_KEY, JSON.stringify(next));
    } catch (e) {
      // ignore
    }
  };

  const isFavorite = (id) => favorites.includes(id);

  const toggleFavorite = (id) => {
    const next = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    persistFavorites(next);
  };

  const addBooking = (booking) => {
    const exists = bookings.some((b) => b.reference === booking.reference);
    if (exists) return;
    persistBookings([booking, ...bookings]);
  };

  const addProperty = (property) => {
    persistProperties([property, ...propertiesList]);
  };

  return (
    <AppDataContext.Provider
      value={{
        favorites,
        bookings,
        propertiesList,
        hydrated,
        isFavorite,
        toggleFavorite,
        addBooking,
        addProperty,
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
