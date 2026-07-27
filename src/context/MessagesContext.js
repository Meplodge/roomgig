import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { getConversations, getMessages, sendMessage as sendMessageApi, deleteMessageFromDB } from '../services/supabaseApi';

const MessagesContext = createContext(null);

const CONVERSATIONS_KEY = '@realestate_conversations';
const MESSAGES_KEY = '@realestate_messages';
const LAST_SYNC_KEY = '@realestate_last_sync';

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// DB conversation_id is a uuid column. Chat ids coming from mock data or
// notifications (e.g. "2") are not uuids, so we must not route those to the DB.
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (value) => typeof value === 'string' && UUID_REGEX.test(value);

export const MessagesProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    loadConversations();
    loadMessagesFromStorage();
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (user) {
      loadConversations();
      startPolling();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [user]);

  const startPolling = () => {
    stopPolling();
    // Poll for new messages every 10 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchAndDeleteNewMessages();
    }, 10000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const loadMessagesFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(MESSAGES_KEY);
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading messages from storage:', e);
    }
  };

  const loadConversations = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getConversations(user.id);
      const formattedConversations = data.map(conv => ({
        id: conv.id,
        name: conv.profiles?.full_name || 'Unknown',
        avatar: conv.profiles?.avatar_url,
        property: conv.properties?.title,
        lastMessage: conv.last_message,
        updatedAt: new Date(conv.last_message_at || conv.created_at).getTime(),
        unread: conv.unread_count || 0,
        phone: conv.profiles?.phone,
      }));
      setConversations(formattedConversations);
      await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(formattedConversations));
    } catch (e) {
      console.error('Error loading conversations:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMessagesForConversation = async (conversationId) => {
    // Load from local storage instead of database
    try {
      const stored = await AsyncStorage.getItem(MESSAGES_KEY);
      if (stored) {
        const allMessages = JSON.parse(stored);
        const conversationMessages = allMessages[conversationId] || [];
        setMessages(prev => ({
          ...prev,
          [conversationId]: conversationMessages,
        }));
      }
    } catch (e) {
      console.error('Error loading messages from storage:', e);
    }
  };

  const fetchAndDeleteNewMessages = async () => {
    if (!user) return;

    try {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      const lastSyncTime = lastSync ? new Date(lastSync) : new Date(0);

      // Fetch all conversations for the user
      const convData = await getConversations(user.id);

      for (const conv of convData) {
        // Fetch messages from database for this conversation
        const dbMessages = await getMessages(conv.id);

        // Filter messages that are newer than last sync and are from other users
        const newMessages = dbMessages.filter(
          msg => new Date(msg.created_at) > lastSyncTime && msg.sender_id !== user.id
        );

        if (newMessages.length > 0) {
          // Add new messages to local storage
          const formattedMessages = newMessages.map(msg => ({
            id: msg.id,
            text: msg.content,
            sender: 'other',
            time: formatTime(msg.created_at),
            dbMessageId: msg.id, // Store DB ID for deletion
          }));

          setMessages(prev => {
            const existing = prev[conv.id] || [];
            const updated = [...existing, ...formattedMessages];
            const next = { ...prev, [conv.id]: updated };
            AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(next));
            return next;
          });

          // Delete messages from database after storing locally
          for (const msg of newMessages) {
            try {
              await deleteMessageFromDB(msg.id);
            } catch (e) {
              console.error('Error deleting message from DB:', e);
            }
          }

          // Update conversation with last message
          const lastMsg = newMessages[newMessages.length - 1];
          setConversations(prev => {
            const updated = prev.map(c =>
              c.id === conv.id
                ? { ...c, lastMessage: lastMsg.content, updatedAt: Date.now(), unread: (c.unread || 0) + newMessages.length }
                : c
            ).sort((a, b) => b.updatedAt - a.updatedAt);
            AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated));
            return updated;
          });
        }
      }

      // Update last sync time
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (e) {
      console.error('Error fetching new messages:', e);
    }
  };

  const persistConversations = async (next) => {
    setConversations(next);
    try {
      await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(next));
    } catch (e) {
      // ignore
    }
  };

  const persistMessages = async (next) => {
    setMessages(next);
    try {
      await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(next));
    } catch (e) {
      // ignore
    }
  };

  const getMessagesForConversation = (conversationId) => messages[conversationId] || [];

  const getConversation = (conversationId) =>
    conversations.find((c) => c.id === conversationId);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  const bumpConversation = (conversationId, lastMessage, conversationsBase) => {
    const base = conversationsBase || conversations;
    return base
      .map((c) =>
        c.id === conversationId
          ? { ...c, lastMessage, updatedAt: Date.now() }
          : c
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  };

  const sendMessage = async (conversationId, text) => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;

    try {
      // Save to local storage first
      const userMessage = {
        id: `${conversationId}-${Date.now()}`,
        text: trimmed,
        sender: 'user',
        time: formatTime(new Date()),
      };

      const nextMessages = {
        ...messages,
        [conversationId]: [...getMessagesForConversation(conversationId), userMessage],
      };
      persistMessages(nextMessages);
      persistConversations(bumpConversation(conversationId, trimmed));

      // Then send to database for routing (will be deleted by receiver).
      // Only real DB conversations have uuid ids; skip mock/notification chats.
      if (isUuid(conversationId)) {
        try {
          await sendMessageApi(conversationId, user.id, trimmed);
        } catch (e) {
          console.error('Error sending message to DB (routing):', e.message, e);
          // Message is already saved locally, so don't throw error
        }
      }
    } catch (e) {
      console.error('Error sending message:', e);
    }
  };

  const markAsRead = async (conversationId) => {
    const target = conversations.find((c) => c.id === conversationId);
    if (!target || !target.unread) return;
    const next = conversations.map((c) =>
      c.id === conversationId ? { ...c, unread: 0 } : c
    );
    persistConversations(next);
  };

  return (
    <MessagesContext.Provider
      value={{
        conversations,
        messages,
        loading,
        hydrated,
        totalUnread,
        getMessages: getMessagesForConversation,
        loadMessages: loadMessagesForConversation,
        getConversation,
        sendMessage,
        markAsRead,
        loadConversations,
        fetchNewMessages: fetchAndDeleteNewMessages,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessages = () => {
  const ctx = useContext(MessagesContext);
  if (!ctx) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return ctx;
};
