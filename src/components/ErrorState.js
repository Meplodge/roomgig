import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const ErrorState = ({
  icon = 'alert-circle-outline',
  title = 'Something went wrong',
  message = 'An error occurred while loading the content. Please try again.',
  actionText = 'Retry',
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['rgba(224, 120, 86, 0.1)', 'rgba(224, 120, 86, 0.2)']}
          style={styles.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={icon} size={64} color={colors.error} />
        </LinearGradient>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionText && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <View style={styles.buttonInner}>
            <Ionicons name="refresh-outline" size={20} color={colors.surface} style={styles.buttonIcon} />
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
    backgroundColor: colors.error,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ErrorState;
