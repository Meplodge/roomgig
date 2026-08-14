import { Platform } from 'react-native';
import { supabase } from '../utils/supabase';
import * as Device from 'expo-device';

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

// Set up notification listeners with navigation callback
export async function setupNotificationListeners(onNotificationTap = null) {
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
    const data = response.notification.request.content.data;
    if (onNotificationTap && data) {
      onNotificationTap(data);
    }
  });
  
  return { subscription, responseListener };
}

// ============================================================================
// Push Token Management
// ============================================================================

// Register push token with Supabase
export async function registerPushToken(userId) {
  if (!userId) {
    console.log('No user ID provided for push token registration');
    return null;
  }

  const token = await getPushNotificationToken();
  if (!token) {
    console.log('Could not get push token');
    return null;
  }

  try {
    const deviceType = Platform.OS;
    const deviceName = Device.deviceName || `${Device.brand} ${Device.modelName}`;

    const { data, error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token: token,
        device_type: deviceType,
        device_name: deviceName,
        is_active: true,
        last_used_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,token',
      })
      .select()
      .single();

    if (error) {
      console.error('Error registering push token:', error);
      return null;
    }

    console.log('Push token registered successfully');
    return data;
  } catch (e) {
    console.error('Error in registerPushToken:', e);
    return null;
  }
}

// Unregister push token (on logout)
export async function unregisterPushToken(userId) {
  const token = await getPushNotificationToken();
  if (!token || !userId) return;

  try {
    await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('token', token);
    
    console.log('Push token unregistered');
  } catch (e) {
    console.error('Error unregistering push token:', e);
  }
}

// ============================================================================
// Notification CRUD Operations
// ============================================================================

// Fetch notifications from Supabase
export async function fetchNotifications(userId, limit = 50, offset = 0) {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        property:properties(id, title, city),
        booking:bookings(id, reference, status)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('Error in fetchNotifications:', e);
    return [];
  }
}

// Get unread notification count
export async function getUnreadCount(userId) {
  if (!userId) return 0;

  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  } catch (e) {
    console.error('Error in getUnreadCount:', e);
    return 0;
  }
}

// Mark notification as read
export async function markAsRead(notificationId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Error in markAsRead:', e);
    return false;
  }
}

// Mark all notifications as read
export async function markAllAsRead(userId) {
  if (!userId) return false;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all as read:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Error in markAllAsRead:', e);
    return false;
  }
}

// Delete a notification
export async function deleteNotification(notificationId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Error in deleteNotification:', e);
    return false;
  }
}

// Clear all notifications for a user
export async function clearAllNotifications(userId) {
  if (!userId) return false;

  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Error in clearAllNotifications:', e);
    return false;
  }
}

// ============================================================================
// Create Notifications (for local triggers)
// ============================================================================

// Create a notification in Supabase
export async function createNotification({
  userId,
  type,
  title,
  message,
  data = null,
  propertyId = null,
  bookingId = null,
  conversationId = null,
  sendPush = true,
}) {
  if (!userId) return null;

  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: type,
        title: title,
        message: message,
        data: data,
        property_id: propertyId,
        booking_id: bookingId,
        conversation_id: conversationId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    // Send local push notification if requested
    if (sendPush) {
      await sendNotification(title, message, {
        notificationId: notification.id,
        type: type,
        ...data,
      });
    }

    return notification;
  } catch (e) {
    console.error('Error in createNotification:', e);
    return null;
  }
}

// ============================================================================
// Notification Helpers for Common Events
// ============================================================================

// Notify about new message
export async function notifyNewMessage(userId, senderName, messagePreview, conversationId) {
  return createNotification({
    userId,
    type: 'message',
    title: `New message from ${senderName}`,
    message: messagePreview.substring(0, 100),
    data: { conversationId, senderName },
    conversationId,
  });
}

// Notify about booking confirmation
export async function notifyBookingConfirmed(userId, propertyTitle, bookingId, propertyId) {
  return createNotification({
    userId,
    type: 'booking',
    title: 'Booking Confirmed!',
    message: `Your booking for ${propertyTitle} has been confirmed.`,
    data: { bookingId, propertyId },
    propertyId,
    bookingId,
  });
}

// Notify about payment reminder
export async function notifyPaymentReminder(userId, amount, propertyTitle, bookingId) {
  return createNotification({
    userId,
    type: 'system',
    title: 'Payment Reminder',
    message: `You have a pending payment of $${amount} for ${propertyTitle}.`,
    data: { bookingId, amount },
    bookingId,
  });
}

// Notify about new listing matching saved search
export async function notifyNewListing(userId, propertyTitle, city, propertyId) {
  return createNotification({
    userId,
    type: 'system',
    title: 'New Listing Alert',
    message: `A new property "${propertyTitle}" is available in ${city}.`,
    data: { propertyId },
    propertyId,
  });
}

// Notify about price drop
export async function notifyPriceDropped(userId, propertyTitle, oldPrice, newPrice, propertyId) {
  const savings = oldPrice - newPrice;
  return createNotification({
    userId,
    type: 'promotion',
    title: 'Price Drop Alert!',
    message: `${propertyTitle} price dropped by $${savings.toLocaleString()}!`,
    data: { propertyId, oldPrice, newPrice },
    propertyId,
  });
}

// Notify about new review on user's property
export async function notifyNewReview(userId, reviewerName, rating, propertyTitle, propertyId) {
  return createNotification({
    userId,
    type: 'review',
    title: 'New Review Received',
    message: `${reviewerName} left a ${rating}-star review on ${propertyTitle}.`,
    data: { propertyId, rating },
    propertyId,
  });
}

// ============================================================================
// Real-time Subscription
// ============================================================================

// Subscribe to real-time notifications
export function subscribeToNotifications(userId, onNewNotification) {
  if (!userId) return null;

  const channelName = `notifications:${userId}`;

  // Remove any existing channel with the same name to avoid
  // "cannot add postgres_changes callbacks after subscribe()" errors
  // when the effect re-runs (e.g. React Strict Mode double-mount).
  const existing = supabase.getChannels().find(ch => ch.topic === channelName);
  if (existing) {
    supabase.removeChannel(existing);
  }

  const subscription = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log('New notification received:', payload);
        
        // Send local push notification
        const notification = payload.new;
        await sendNotification(notification.title, notification.message, {
          notificationId: notification.id,
          type: notification.type,
          ...notification.data,
        });
        
        // Call the callback
        if (onNewNotification) {
          onNewNotification(notification);
        }
      }
    )
    .subscribe();

  return subscription;
}

// Unsubscribe from notifications
export async function unsubscribeFromNotifications(subscription) {
  if (subscription) {
    await supabase.removeChannel(subscription);
  }
}

// Set badge count
export async function setBadgeCount(count) {
  await notificationsPromise;
  if (!Notifications || !Notifications.setBadgeCountAsync) return;
  
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (e) {
    console.log('Could not set badge count:', e);
  }
}

// Get badge count
export async function getBadgeCount() {
  await notificationsPromise;
  if (!Notifications || !Notifications.getBadgeCountAsync) return 0;
  
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (e) {
    console.log('Could not get badge count:', e);
    return 0;
  }
}
