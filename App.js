import 'react-native-gesture-handler';
import React, { Suspense, useEffect, useState } from 'react';
import { View, ActivityIndicator, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// NOTE: This entry intentionally avoids importing anything that transitively
// imports `src/constants/colors`. We must apply the saved theme via
// Appearance.setColorScheme BEFORE the screen modules build their StyleSheets,
// so the chosen light/dark palette is used at launch. AppShell is lazy-loaded
// only after the theme has been applied.
const THEME_MODE_KEY = '@realestate_theme_mode';

export default function App() {
  const [ready, setReady] = useState(false);
  const [AppShell, setAppShell] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const mode = await AsyncStorage.getItem(THEME_MODE_KEY);
        if (mode === 'light' || mode === 'dark') {
          Appearance.setColorScheme(mode);
        } else {
          Appearance.setColorScheme(null); // follow device
        }
      } catch (e) {
        // ignore, fall back to system theme
      }
      // Dynamic import after theme is applied
      const module = await import('./src/AppShell');
      setAppShell(() => module.default);
      setReady(true);
    })();
  }, []);

  if (!ready || !AppShell) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#5FB89A" />
      </View>
    );
  }

  return (
    <Suspense
      fallback={
        <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#5FB89A" />
        </View>
      }
    >
      <AppShell />
    </Suspense>
  );
}
