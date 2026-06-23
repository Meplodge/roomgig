import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Appearance, DevSettings, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors } from '../constants/colors';

// Keep this key in sync with the literal used in App.js bootstrap.
export const THEME_MODE_KEY = '@realestate_theme_mode';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState('system'); // 'system' | 'light' | 'dark'

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_MODE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const scheme = mode === 'system' ? (systemScheme || 'light') : mode;
  const colors = getColors(scheme);

  // Persist + apply the chosen mode, then reload so module-level StyleSheets
  // rebuild with the new palette (styles are created once at import time).
  const setMode = useCallback(async (newMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, newMode);
    } catch (e) {
      // ignore
    }
    Appearance.setColorScheme(newMode === 'system' ? null : newMode);
    setTimeout(() => {
      if (DevSettings && typeof DevSettings.reload === 'function') {
        DevSettings.reload();
      }
    }, 60);
  }, []);

  const toggleDarkMode = useCallback(
    (enabled) => setMode(enabled ? 'dark' : 'light'),
    [setMode]
  );

  return (
    <ThemeContext.Provider value={{ mode, scheme, colors, setMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
