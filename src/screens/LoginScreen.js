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
import googleLogo from '../../assets/google.png';

const { height } = Dimensions.get('window');
const AUTH_PRIMARY = '#2E8B57';
const LOGIN_IMAGE = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800';

const LoginScreen = ({ navigation }) => {
  const { login, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Full-width hero image with gradient overlay */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: LOGIN_IMAGE }} style={styles.heroImage} resizeMode="cover" />
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
        <View
          style={styles.content}
        >
          <View style={styles.inner}>
            <Text style={styles.title}>Login</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
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

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textLight}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity style={styles.checkbox} onPress={() => setRemember((r) => !r)} activeOpacity={0.8}>
                <Ionicons name={remember ? 'checkbox' : 'square-outline'} size={20} color={remember ? AUTH_PRIMARY : colors.textSecondary} />
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotText}>Forget password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={submitting}
              activeOpacity={0.9}
            >
              {submitting ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or sign in with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={[styles.socialButton, googleLoading && { opacity: 0.7 }]} onPress={handleGoogleSignIn} disabled={googleLoading} activeOpacity={0.9}>
                <Image source={googleLogo} style={styles.socialLogo} />
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>
              <View style={{ width: 12 }} />
              <TouchableOpacity style={styles.socialButton} onPress={() => console.log('Apple Sign In')} activeOpacity={0.9}>
                <Ionicons name="logo-apple" size={22} color={colors.text} />
                <Text style={styles.socialText}>Apple</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.footerLink}>Create an account</Text>
              </TouchableOpacity>
            </View>
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
  content: { flex: 1, justifyContent: 'center', paddingTop: 120 },
  inner: { paddingHorizontal: 28, paddingTop: 8, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 32 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: colors.error, fontSize: 13, marginLeft: 8, flex: 1 },
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
  optionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  checkbox: { flexDirection: 'row', alignItems: 'center' },
  rememberText: { fontSize: 14, color: colors.textSecondary, marginLeft: 8 },
  forgotText: { fontSize: 14, fontWeight: '600', color: AUTH_PRIMARY },
  button: {
    backgroundColor: '#2E8B57',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.surface, fontSize: 17, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: 12, color: colors.textSecondary, fontSize: 13 },
  socialRow: { flexDirection: 'row', marginBottom: 24 },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 14,
  },
  socialLogo: { width: 22, height: 22, resizeMode: 'contain', marginRight: 8 },
  socialText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: colors.textSecondary, fontSize: 14 },
  footerLink: { color: AUTH_PRIMARY, fontSize: 14, fontWeight: '700' },
});

export default LoginScreen;
