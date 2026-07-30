import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, surfaceGradient } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

const { height } = Dimensions.get('window');
const AUTH_PRIMARY = '#2E8B57';
const AUTH_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800';

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
    <View style={styles.container}>
      {/* Full-width hero image with gradient overlay */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: AUTH_IMAGE }} style={styles.heroImage} resizeMode="cover" />
        <LinearGradient
          colors={surfaceGradient}
          locations={[0, 0.4, 0.7, 1]}
          style={styles.gradient}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.inner}>
            <Text style={styles.title}>Forgot password?</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={16} color={AUTH_PRIMARY} />
                <Text style={styles.successText}>
                  Password reset email sent! Check your inbox.
                </Text>
              </View>
            ) : null}

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
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
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.backToLoginText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.42,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: 'center' },
  inner: { paddingHorizontal: 28, paddingTop: 8, paddingBottom: 40, marginTop: 0 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 12 },
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
  successText: { color: AUTH_PRIMARY, fontSize: 13, marginLeft: 8, flex: 1 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 18,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: colors.text },
  button: {
    backgroundColor: '#2E8B57',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 28,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.surface, fontSize: 17, fontWeight: '700' },
  backToLogin: { alignSelf: 'center' },
  backToLoginText: { color: AUTH_PRIMARY, fontSize: 14, fontWeight: '600' },
});

export default ForgotPasswordScreen;
