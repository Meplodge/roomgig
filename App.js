import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { AppDataProvider } from './src/context/AppDataContext';
import SplashScreen from './src/screens/SplashScreen';

export default function App() {
  const [isSplashVisible, setSplashVisible] = useState(true);

  const handleSplashFinish = () => {
    setSplashVisible(false);
  };

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppDataProvider>
          {isSplashVisible ? (
            <SplashScreen onFinish={handleSplashFinish} />
          ) : (
            <>
              <AppNavigator />
              <StatusBar style="auto" />
            </>
          )}
        </AppDataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
