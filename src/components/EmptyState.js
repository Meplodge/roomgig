import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const EmptyState = ({
  icon,
  title,
  message,
  actionText,
  onAction,
  illustration,
}) => {
  return (
    <View style={styles.container}>
      {illustration ? (
        <Image source={{ uri: illustration }} style={styles.illustration} />
      ) : (
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[colors.primarySoft, colors.primaryLight]}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={icon || 'search-outline'} size={64} color={colors.primary} />
          </LinearGradient>
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionText && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <View style={styles.buttonInner}>
            <Text style={styles.actionText}>{actionText}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  illustration: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  buttonInner: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default EmptyState;
