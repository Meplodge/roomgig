import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchNotifications,
  getUnreadCount,
  markAsRead as markNotificationAsRead,
  markAllAsRead as markAllNotificationsAsRead,
  clearAllNotifications,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  registerPushToken,
  unregisterPushToken,
  setBadgeCount,
} from '../services/notificationService';

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const subscriptionRef = useRef(null);

  // Load notifications when user changes
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      loadUnreadCount();
      setupRealtimeSubscription();
      registerToken();
    } else {
      // Clear state when user logs out
      setNotifications([]);
      setUnreadCount(0);
      cleanupSubscription();
    }

    return () => {
      cleanupSubscription();
    };
  }, [user?.id]);

  // Update badge count when unread count changes
  useEffect(() => {
    setBadgeCount(unreadCount);
  }, [unreadCount]);

  const registerToken = async () => {
    if (user?.id) {
      await registerPushToken(user.id);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user?.id) return;

    const sub = subscribeToNotifications(user.id, (newNotification) => {
      // Add new notification to the top of the list
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    subscriptionRef.current = sub;
  };

  const cleanupSubscription = async () => {
    if (subscriptionRef.current) {
      await unsubscribeFromNotifications(subscriptionRef.current);
      subscriptionRef.current = null;
    }
  };

  const loadNotifications = async (showLoading = true) => {
    if (!user?.id) return;

    if (showLoading) setLoading(true);
    try {
      const data = await fetchNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!user?.id) return;

    try {
      const count = await getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadNotifications(false), loadUnreadCount()]);
    setRefreshing(false);
  }, [user?.id]);

  const markAsRead = useCallback(async (notificationId) => {
    const success = await markNotificationAsRead(notificationId);
    if (success) {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    return success;
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return false;

    const success = await markAllNotificationsAsRead(user.id);
    if (success) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    }
    return success;
  }, [user?.id]);

  const clearAll = useCallback(async () => {
    if (!user?.id) return false;

    const success = await clearAllNotifications(user.id);
    if (success) {
      setNotifications([]);
      setUnreadCount(0);
    }
    return success;
  }, [user?.id]);

  const onLogout = useCallback(async () => {
    if (user?.id) {
      await unregisterPushToken(user.id);
    }
    await cleanupSubscription();
    setNotifications([]);
    setUnreadCount(0);
  }, [user?.id]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshing,
        refresh,
        markAsRead,
        markAllAsRead,
        clearAll,
        onLogout,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    console.warn('useNotifications must be used within a NotificationsProvider');
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      refreshing: false,
      refresh: async () => {},
      markAsRead: async () => false,
      markAllAsRead: async () => false,
      clearAll: async () => false,
      onLogout: async () => {},
    };
  }
  return ctx;
};

export default NotificationsContext;
