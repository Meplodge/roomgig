import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import { MessagesProvider } from './context/MessagesContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationsProvider } from './context/NotificationsContext';
import SplashScreen from './screens/SplashScreen';
import { requestNotificationPermissions, setupNotificationListeners } from './services/notificationService';

export default function AppShell() {
  const [isSplashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    let subscription = { remove: () => {} };
    let responseListener = { remove: () => {} };

    (async () => {
      // Request notification permissions on app start
      await requestNotificationPermissions();

      // Set up notification listeners
      const listeners = await setupNotificationListeners();
      subscription = listeners.subscription;
      responseListener = listeners.responseListener;
    })();

    // Cleanup listeners on unmount
    return () => {
      subscription.remove();
      responseListener.remove();
    };
  }, []);

  const handleSplashFinish = () => {
    setSplashVisible(false);
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppDataProvider>
            <MessagesProvider>
              <NotificationsProvider>
                {isSplashVisible ? (
                  <SplashScreen onFinish={handleSplashFinish} />
                ) : (
                  <>
                    <AppNavigator />
                    <StatusBar style="auto" />
                  </>
                )}
              </NotificationsProvider>
            </MessagesProvider>
          </AppDataProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
