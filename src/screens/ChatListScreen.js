import React from 'react';
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
import BottomNavBar from '../components/BottomNavBar';
import EmptyState from '../components/EmptyState';
import ChatItemSkeleton from '../components/ChatItemSkeleton';
import { useMessages } from '../context/MessagesContext';

const formatRelativeTime = (timestamp) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

const ChatListScreen = ({ navigation }) => {
  const { conversations, loading } = useMessages();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.newMessageButton}>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <>
            <ChatItemSkeleton />
            <ChatItemSkeleton />
            <ChatItemSkeleton />
            <ChatItemSkeleton />
          </>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title="No Messages Yet"
            message="When you contact a property host, your conversations will appear here."
            actionText="Browse Properties"
            onAction={() => navigation.navigate('Home')}
          />
        ) : (
          conversations.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={styles.chatItem}
              onPress={() => navigation.navigate('Chat', { chat })}
            >
              <View style={styles.avatarContainer}>
                <Image source={{ uri: chat.avatar }} style={styles.avatar} />
                {chat.unread > 0 && <View style={styles.unreadBadge} />}
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatName}>{chat.name}</Text>
                  <Text style={styles.chatTime}>{formatRelativeTime(chat.updatedAt)}</Text>
                </View>
                <Text style={styles.propertyName}>{chat.property}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {chat.lastMessage}
                </Text>
              </View>
              {chat.unread > 0 && (
                <View style={styles.unreadCount}>
                  <Text style={styles.unreadCountText}>{chat.unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <BottomNavBar activeTab="messages" navigation={navigation} />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  newMessageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    marginBottom: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.border,
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  chatTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  propertyName: {
    fontSize: 13,
    color: colors.primary,
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  unreadCount: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  unreadCountText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default ChatListScreen;
