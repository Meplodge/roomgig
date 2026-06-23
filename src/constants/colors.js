import { Appearance } from 'react-native';

export const lightColors = {
  primary: '#1F4D3F',
  primaryLight: '#C9E4D3',
  primarySoft: '#E8F3EC',
  secondary: '#6FB99A',
  accent: '#E07856',
  background: '#F4F1EC',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#7A7A7A',
  textLight: '#B0B0B0',
  border: '#ECECEC',
  star: '#F5A623',
  success: '#2E8B57',
  warning: '#FDCB6E',
  error: '#E07856',
  shadow: 'rgba(0, 0, 0, 0.08)',
};

export const darkColors = {
  primary: '#5FB89A',
  primaryLight: '#1E3A30',
  primarySoft: '#16241E',
  secondary: '#6FB99A',
  accent: '#E07856',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#F5F5F5',
  textSecondary: '#A0A0A0',
  textLight: '#8A8A8A',
  border: '#2C2C2C',
  star: '#F5A623',
  success: '#3FAE6B',
  warning: '#FDCB6E',
  error: '#E07856',
  shadow: 'rgba(0, 0, 0, 0.5)',
};

export const getColors = (scheme) => (scheme === 'dark' ? darkColors : lightColors);

// Resolve the palette from the device theme at module load. Because most screens
// build their StyleSheet once at import time, this makes the whole app follow the
// system (device) light/dark setting on launch without per-screen refactors.
export const colors = getColors(Appearance.getColorScheme());
