import { Platform } from 'react-native';

let Notifications = null;

// Only load expo-notifications if not in Expo Go
try {
  // This will fail in Expo Go, but work in development builds
  const Constants = require('expo-constants');
  const isExpoGo = Constants.appOwnership === 'expo';
  
  if (!isExpoGo) {
    Notifications = require('expo-notifications');
    
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (error) {
  console.log('Notifications not available (Expo Go or missing expo-constants)');
}

// Check if notifications are available
export const isNotificationsAvailable = () => Notifications !== null;

// Request notification permissions
export async function requestNotificationPermissions() {
  if (!Notifications) return false;
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permissions');
    return false;
  }
  
  return true;
}

// Schedule a local notification
export async function scheduleNotification(title, body, data = {}, delaySeconds = 1) {
  if (!Notifications) {
    console.log('Notifications not available - skipping');
    return;
  }
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: {
      seconds: delaySeconds,
    },
  });
}

// Send an immediate notification
export async function sendNotification(title, body, data = {}) {
  if (!Notifications) {
    console.log('Notifications not available - skipping');
    return;
  }
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // null means immediately
  });
}

// Cancel all scheduled notifications
export async function cancelAllNotifications() {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Cancel a specific notification
export async function cancelNotification(notificationId) {
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Get push notification token (for remote notifications)
export async function getPushNotificationToken() {
  if (!Notifications) return null;
  
  const hasPermission = await requestNotificationPermissions();
  
  if (!hasPermission) {
    return null;
  }
  
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

// Set up notification listeners
export function setupNotificationListeners() {
  if (!Notifications) {
    return { subscription: { remove: () => {} }, responseListener: { remove: () => {} } };
  }
  
  // Listener for when a notification is received while app is foregrounded
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });
  
  // Listener for when user taps a notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response:', response);
  });
  
  return { subscription, responseListener };
}
