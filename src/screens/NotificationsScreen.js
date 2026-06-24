import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const NotificationsScreen = ({ navigation }) => {
  const [notifications] = useState([
    {
      id: '1',
      type: 'booking',
      title: 'Booking Confirmed',
      message: 'Your booking for Suncrest Manor has been confirmed for June 20-25, 2026',
      time: '2 hours ago',
      read: false,
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=100',
    },
    {
      id: '2',
      type: 'message',
      title: 'New Message',
      message: 'Christopher Estate sent you a message about your booking inquiry',
      time: '5 hours ago',
      read: false,
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    {
      id: '3',
      type: 'price',
      title: 'Price Drop Alert',
      message: 'Luxury 3BHK price has dropped by $2,000/month',
      time: '1 day ago',
      read: true,
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=100',
    },
    {
      id: '4',
      type: 'review',
      title: 'New Review',
      message: 'Someone left a 5-star review on your property',
      time: '2 days ago',
      read: true,
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    {
      id: '5',
      type: 'system',
      title: 'Payment Successful',
      message: 'Your payment of $56,000 for Suncrest Manor has been processed',
      time: '3 days ago',
      read: true,
      image: null,
    },
  ]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking':
        return 'calendar';
      case 'message':
        return 'chatbubble';
      case 'price':
        return 'pricetag';
      case 'review':
        return 'star';
      case 'system':
        return 'receipt';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'booking':
        return colors.primary;
      case 'message':
        return '#4CAF50';
      case 'price':
        return '#FF9800';
      case 'review':
        return colors.star;
      case 'system':
        return '#2196F3';
      default:
        return colors.textSecondary;
    }
  };

  const markAsRead = (id) => {
    // In a real app, this would update the backend
    console.log('Mark as read:', id);
  };

  const clearAll = () => {
    // In a real app, this would clear all notifications
    console.log('Clear all notifications');
  };

  const handleNotificationPress = (notification) => {
    markAsRead(notification.id);
    
    if (notification.type === 'message') {
      // Navigate to chat screen
      navigation.navigate('Chat', {
        chatId: notification.id,
        userName: 'Christopher Estate',
        userImage: notification.image,
      });
    } else if (notification.type === 'booking') {
      // Navigate to booking history or property details
      navigation.navigate('BookingHistory');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>You're all caught up!</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[styles.notificationItem, !notification.read && styles.unreadItem]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.notificationIconContainer}>
                {notification.image ? (
                  <Image source={{ uri: notification.image }} style={styles.notificationImage} />
                ) : (
                  <View
                    style={[
                      styles.notificationIcon,
                      { backgroundColor: getNotificationColor(notification.type) },
                    ]}
                  >
                    <Ionicons
                      name={getNotificationIcon(notification.type)}
                      size={24}
                      color={colors.surface}
                    />
                  </View>
                )}
              </View>

              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={[styles.notificationTitle, !notification.read && styles.unreadTitle]}>
                    {notification.title}
                  </Text>
                  {!notification.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notificationMessage} numberOfLines={2}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>

              <TouchableOpacity style={styles.notificationArrow}>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadItem: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  notificationIconContainer: {
    marginRight: 12,
  },
  notificationImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  unreadTitle: {
    color: colors.primary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  notificationArrow: {
    marginLeft: 12,
    padding: 4,
  },
});

export default NotificationsScreen;
