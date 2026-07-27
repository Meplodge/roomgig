import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
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

const ForgotPasswordScreen = ({ navigation }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleReset = async () => {
    setError('');
    setSuccess(false);
    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.logoRow}>
            <View style={styles.logoBadge}>
              <Ionicons name="home" size={22} color={colors.surface} />
            </View>
            <Text style={styles.logoText}>Estatery</Text>
          </View>

          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.successText}>
                Password reset email sent! Check your inbox.
              </Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="you@email.com"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleReset}
            disabled={submitting}
            activeOpacity={0.9}
          >
            {submitting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backToLoginText}>Back to Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 40 },
  backButton: { alignSelf: 'flex-start', marginBottom: 20 },
  logoRow: { flexDirection: 'column', alignItems: 'center', marginBottom: 40 },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoText: { fontSize: 22, fontWeight: '700', color: colors.text },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: 28, textAlign: 'center' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: colors.error, fontSize: 13, marginLeft: 8, flex: 1 },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: { color: colors.primary, fontSize: 13, marginLeft: 8, flex: 1 },
  field: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, fontSize: 16, color: colors.text, marginLeft: 10 },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 17,
    borderRadius: 28,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.surface, fontSize: 17, fontWeight: '700' },
  backToLogin: { alignSelf: 'center', marginTop: 28 },
  backToLoginText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});

export default ForgotPasswordScreen;
