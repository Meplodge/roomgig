import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MessagesContext = createContext(null);

const CONVERSATIONS_KEY = '@realestate_conversations';
const MESSAGES_KEY = '@realestate_messages';

const initialConversations = [
  {
    id: '1',
    name: 'Christopher Estate',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    property: 'Suncrest Manor',
    lastMessage: 'The property is still available for viewing.',
    updatedAt: Date.now() - 2 * 60 * 1000,
    unread: 2,
    phone: '+15551234567',
  },
  {
    id: '2',
    name: 'Premium Homes',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    property: 'Luxury 3BHK',
    lastMessage: 'Would you like to schedule a tour?',
    updatedAt: Date.now() - 60 * 60 * 1000,
    unread: 0,
    phone: '+15559876543',
  },
  {
    id: '3',
    name: 'Elite Properties',
    avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
    property: 'Green Valley Villa',
    lastMessage: 'Thanks for your interest! Let me know if you have any questions.',
    updatedAt: Date.now() - 3 * 60 * 60 * 1000,
    unread: 1,
    phone: '+15555555555',
  },
];

const initialMessages = {
  '1': [
    { id: '1-1', text: "Hi! I'm interested in your property.", sender: 'user', time: '10:30 AM' },
    { id: '1-2', text: 'Hello! Thanks for your interest. The property is still available for viewing.', sender: 'other', time: '10:32 AM' },
    { id: '1-3', text: 'Great! When can I schedule a tour?', sender: 'user', time: '10:35 AM' },
    { id: '1-4', text: 'The property is still available for viewing.', sender: 'other', time: '10:38 AM' },
  ],
  '2': [
    { id: '2-1', text: 'Hello, is the 3BHK still on the market?', sender: 'user', time: '09:10 AM' },
    { id: '2-2', text: 'Yes it is! Would you like to schedule a tour?', sender: 'other', time: '09:15 AM' },
  ],
  '3': [
    { id: '3-1', text: 'Hi, I have a few questions about the villa.', sender: 'user', time: 'Yesterday' },
    { id: '3-2', text: 'Thanks for your interest! Let me know if you have any questions.', sender: 'other', time: 'Yesterday' },
  ],
};

const AUTO_REPLIES = [
  'Thanks for your message! I\'ll get back to you shortly.',
  'Got it! Let me check and confirm.',
  'Sure, that works for me.',
  'Happy to help with any questions you have.',
];

const formatTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const MessagesProvider = ({ children }) => {
  const [conversations, setConversations] = useState(initialConversations);
  const [messages, setMessages] = useState(initialMessages);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [conv, msgs] = await Promise.all([
          AsyncStorage.getItem(CONVERSATIONS_KEY),
          AsyncStorage.getItem(MESSAGES_KEY),
        ]);
        if (conv) setConversations(JSON.parse(conv));
        if (msgs) setMessages(JSON.parse(msgs));
      } catch (e) {
        // ignore read errors
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

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

  const getMessages = (conversationId) => messages[conversationId] || [];

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

  const sendMessage = (conversationId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage = {
      id: `${conversationId}-${Date.now()}`,
      text: trimmed,
      sender: 'user',
      time: formatTime(),
    };

    const nextMessages = {
      ...messages,
      [conversationId]: [...getMessages(conversationId), userMessage],
    };
    persistMessages(nextMessages);
    persistConversations(bumpConversation(conversationId, trimmed));

    // Simulate reply from the other party
    setTimeout(() => {
      const reply = {
        id: `${conversationId}-${Date.now() + 1}`,
        text: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)],
        sender: 'other',
        time: formatTime(),
      };
      setMessages((prevMessages) => {
        const updated = {
          ...prevMessages,
          [conversationId]: [...(prevMessages[conversationId] || []), reply],
        };
        AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
      setConversations((prevConvos) => {
        const updated = bumpConversation(conversationId, reply.text, prevConvos);
        AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    }, 1500);
  };

  const markAsRead = (conversationId) => {
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
        hydrated,
        totalUnread,
        getMessages,
        getConversation,
        sendMessage,
        markAsRead,
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
