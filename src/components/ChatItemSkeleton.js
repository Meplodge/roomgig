import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';

const ChatItemSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={styles.avatar} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.skeleton, styles.name]} />
          <View style={[styles.skeleton, styles.time]} />
        </View>
        <View style={[styles.skeleton, styles.property]} />
        <View style={[styles.skeleton, styles.message]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    marginBottom: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    flex: 1,
    height: 16,
    marginRight: 12,
  },
  time: {
    width: 50,
    height: 12,
  },
  property: {
    width: '60%',
    height: 13,
    marginBottom: 2,
  },
  message: {
    width: '80%',
    height: 14,
  },
  skeleton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 6,
  },
});

export default ChatItemSkeleton;
