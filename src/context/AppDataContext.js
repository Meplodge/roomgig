import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppDataContext = createContext(null);

const FAV_KEY = '@realestate_favorites';
const BOOKINGS_KEY = '@realestate_bookings';

export const AppDataProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]); // array of property ids
  const [bookings, setBookings] = useState([]); // array of booking objects
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [fav, bk] = await Promise.all([
          AsyncStorage.getItem(FAV_KEY),
          AsyncStorage.getItem(BOOKINGS_KEY),
        ]);
        if (fav) setFavorites(JSON.parse(fav));
        if (bk) setBookings(JSON.parse(bk));
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

  return (
    <AppDataContext.Provider
      value={{
        favorites,
        bookings,
        hydrated,
        isFavorite,
        toggleFavorite,
        addBooking,
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
