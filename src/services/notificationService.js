import { Platform } from 'react-native';

let Notifications = null;
let notificationsPromise = null;

// expo-notifications is not available in Expo Go (SDK 53+)
// It only works in development builds or production builds
// This will be safely ignored in Expo Go
notificationsPromise = (async () => {
  try {
    const NotificationsModule = await import('expo-notifications');
    if (NotificationsModule) {
      Notifications = NotificationsModule;
      
      // Configure notification behavior
      if (Notifications.setNotificationHandler) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });
      }
    }
  } catch (error) {
    // expo-notifications not available - expected in Expo Go
    console.log('Notifications not available in this environment');
  }
})();

// Check if notifications are available
export const isNotificationsAvailable = () => Notifications !== null;

// Request notification permissions
export async function requestNotificationPermissions() {
  await notificationsPromise;
  if (!Notifications || !Notifications.getPermissionsAsync) return false;
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted' && Notifications.requestPermissionsAsync) {
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
  await notificationsPromise;
  if (!Notifications || !Notifications.scheduleNotificationAsync) {
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
  await notificationsPromise;
  if (!Notifications || !Notifications.scheduleNotificationAsync) {
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
  await notificationsPromise;
  if (!Notifications || !Notifications.cancelAllScheduledNotificationsAsync) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Cancel a specific notification
export async function cancelNotification(notificationId) {
  await notificationsPromise;
  if (!Notifications || !Notifications.cancelScheduledNotificationAsync) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Get push notification token (for remote notifications)
export async function getPushNotificationToken() {
  await notificationsPromise;
  if (!Notifications || !Notifications.getExpoPushTokenAsync) return null;
  
  const hasPermission = await requestNotificationPermissions();
  
  if (!hasPermission) {
    return null;
  }
  
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

// Set up notification listeners
export async function setupNotificationListeners() {
  await notificationsPromise;
  if (!Notifications || !Notifications.addNotificationReceivedListener || !Notifications.addNotificationResponseReceivedListener) {
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
