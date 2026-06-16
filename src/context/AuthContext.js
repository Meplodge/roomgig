import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

const STORAGE_KEY = '@realestate_user';
const ONBOARDING_KEY = '@realestate_onboarding_completed';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    loadUser();
    checkOnboarding();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      // ignore read errors
    } finally {
      setLoading(false);
    }
  };

  const checkOnboarding = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      setOnboardingCompleted(completed === 'true');
    } catch (e) {
      // ignore read errors
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setOnboardingCompleted(true);
    } catch (e) {
      // ignore write errors
    }
  };

  const persist = async (userData) => {
    setUser(userData);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (e) {
      // ignore write errors
    }
  };

  // Mock auth — accepts any valid-looking credentials
  const login = async (email, password) => {
    if (!email || !password) {
      throw new Error('Please enter your email and password.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    const userData = {
      id: Date.now().toString(),
      name: email.split('@')[0].replace(/[._]/g, ' ') || 'User',
      email,
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    };
    await persist(userData);
    return userData;
  };

  const signup = async (name, email, password) => {
    if (!name || !email || !password) {
      throw new Error('Please fill in all fields.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    const userData = {
      id: Date.now().toString(),
      name,
      email,
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    };
    await persist(userData);
    return userData;
  };

  const logout = async () => {
    setUser(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        loading, 
        login, 
        signup, 
        logout, 
        isAuthenticated: !!user,
        onboardingCompleted,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
