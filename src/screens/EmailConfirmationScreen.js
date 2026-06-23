import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

const EmailConfirmationScreen = ({ route, navigation }) => {
  const { email } = route.params || {};
  const { resendConfirmationEmail } = useAuth();
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');

  const handleResendEmail = async () => {
    setMessage('');
    setResending(true);
    try {
      await resendConfirmationEmail(email);
      setMessage('Confirmation email sent! Please check your inbox.');
    } catch (error) {
      setMessage('Failed to resend confirmation email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconContainer}>
            <View style={styles.iconBadge}>
              <Ionicons name="mail-outline" size={48} color={colors.primary} />
            </View>
          </View>

          <Text style={styles.title}>Confirm your email</Text>
          <Text style={styles.subtitle}>
            We've sent a confirmation email to:
          </Text>
          <Text style={styles.emailText}>{email || 'your email address'}</Text>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              Please check your inbox and click the confirmation link to activate your account.
            </Text>
          </View>

          {message ? (
            <View style={styles.messageBox}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, resending && styles.buttonDisabled]}
            onPress={handleResendEmail}
            disabled={resending}
            activeOpacity={0.9}
          >
            {resending ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.buttonText}>Resend Email</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleBackToLogin}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryButtonText}>Back to Login</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Didn't receive the email? Check your spam folder.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 40, paddingBottom: 40 },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 32,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    color: colors.text,
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  messageText: {
    color: colors.success,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 17,
    borderRadius: 28,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.surface, fontSize: 17, fontWeight: '700' },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 17,
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 24,
  },
  secondaryButtonText: { color: colors.text, fontSize: 17, fontWeight: '700' },
  footer: { alignItems: 'center' },
  footerText: { color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
});

export default EmailConfirmationScreen;
