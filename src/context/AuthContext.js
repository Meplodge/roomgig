import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { supabase } from '../utils/supabase';
import {
  getDeviceId,
  bindDeviceToAccount,
  isDeviceBound,
  removeDeviceBinding,
  validateDeviceBinding,
} from '../utils/deviceUtils';
import { notifyWelcome, notifyPasswordChanged } from '../services/email';

const AuthContext = createContext(null);

const STORAGE_KEY = '@realestate_user';
const ONBOARDING_KEY = '@realestate_onboarding_completed';
const FIRST_LOGIN_KEY = '@realestate_first_login_completed';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState(true);
  const [needsProfileUpdate, setNeedsProfileUpdate] = useState(false);

  useEffect(() => {
    loadUser();
    checkOnboarding();
    setupAuthListener();
  }, []);

  const setupAuthListener = () => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        const userData = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          avatar: session.user.user_metadata?.avatar_url,
          emailConfirmed: session.user.email_confirmed_at !== null,
        };
        setUser(userData);
        setEmailConfirmed(session.user.email_confirmed_at !== null);
        await loadProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setEmailConfirmed(true);
      } else if (event === 'USER_UPDATED') {
        if (session?.user) {
          setEmailConfirmed(session.user.email_confirmed_at !== null);
        }
      }
    });
  };

  const loadProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('Profile data loaded:', data);
      console.log('Profile avatar_url:', data?.avatar_url);

      if (data && !error) {
        setProfile(data);
        // Always update user avatar from profile (even if profile avatar is null, to clear old avatar)
        console.log('Updating user avatar from profile:', data.avatar_url);
        setUser(prev => ({ ...prev, avatar: data.avatar_url }));
        
        // Check if this is first login and profile needs update
        const firstLoginCompleted = await AsyncStorage.getItem(FIRST_LOGIN_KEY);
        if (!firstLoginCompleted) {
          const needsUpdate = !data.phone || !data.full_name || data.full_name === data.email?.split('@')[0];
          setNeedsProfileUpdate(needsUpdate);
        }
      }
    } catch (e) {
      console.error('Error loading profile:', e);
    }
  };

  const loadUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          avatar: session.user.user_metadata?.avatar_url,
        };
        setUser(userData);
        await loadProfile(session.user.id);
      }
    } catch (e) {
      console.error('Error loading user:', e);
    } finally {
      setLoading(false);
    }
  };

  const checkOnboarding = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      setOnboardingCompleted(completed === 'true');
    } catch (e) {
      // ignore read errors
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setOnboardingCompleted(true);
    } catch (e) {
      // ignore write errors
    }
  };

  const markProfileComplete = async () => {
    try {
      await AsyncStorage.setItem(FIRST_LOGIN_KEY, 'true');
      setNeedsProfileUpdate(false);
    } catch (e) {
      // ignore write errors
    }
  };

  const persist = async (userData) => {
    setUser(userData);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (e) {
      // ignore write errors
    }
  };

  const login = async (email, password) => {
    if (!email || !password) {
      throw new Error('Please enter your email and password.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Device binding disabled
    // const deviceId = await getDeviceId();
    // await bindDeviceToAccount(data.user.id, deviceId);

    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
      avatar: data.user.user_metadata?.avatar_url,
    };
  };

  const signup = async (name, email, password) => {
    if (!name || !email || !password) {
      throw new Error('Please fill in all fields.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    // Device binding disabled
    // const deviceAlreadyBound = await isDeviceBound();
    // if (deviceAlreadyBound) {
    //   throw new Error('This device is already registered to another account. Please log in instead.');
    // }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg',
        },
      },
    });

    if (error) throw error;

    // Send welcome email (do not block sign-up on email failures)
    try {
      await notifyWelcome({ email, name });
    } catch (emailError) {
      console.warn('Welcome email failed:', emailError);
    }

    // Device binding disabled
    // const deviceId = await getDeviceId();
    // await bindDeviceToAccount(data.user.id, deviceId);

    return {
      id: data.user.id,
      email: data.user.email,
      name,
      avatar: data.user.user_metadata?.avatar_url,
    };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      // Device binding disabled
      // await removeDeviceBinding();
    } catch (e) {
      // ignore
    }
  };

  const resendConfirmationEmail = async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    if (!email) {
      throw new Error('Please enter your email address.');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const redirectTo = 'com.realestate.app://auth/callback';

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });

    if (error) throw error;
    if (!data?.url) throw new Error('Could not start Google sign in.');

    return new Promise((resolve, reject) => {
      let timeout;

      const handleUrl = async (event) => {
        if (!event.url.startsWith(redirectTo)) return;

        subscription.remove();
        clearTimeout(timeout);

        const match = event.url.match(/[?&]code=([^&]+)/);
        const code = match ? decodeURIComponent(match[1]) : null;
        if (!code) {
          reject(new Error('Google sign in did not return an authorization code.'));
          return;
        }

        const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) reject(exchangeError);
        else resolve(sessionData.session);
      };

      const subscription = Linking.addEventListener('url', handleUrl);

      timeout = setTimeout(() => {
        subscription.remove();
        reject(new Error('Google sign in timed out.'));
      }, 120000);

      Linking.openURL(data.url).catch((openError) => {
        subscription.remove();
        clearTimeout(timeout);
        reject(openError);
      });
    });
  };

  const changePassword = async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const { data: userData, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    // Notify the user that their password changed
    try {
      await notifyPasswordChanged({ email: userData.user?.email });
    } catch (emailError) {
      console.warn('Password changed email notification failed:', emailError);
    }
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        profile,
        loading, 
        login, 
        signup, 
        logout,
        resendConfirmationEmail,
        resetPassword,
        changePassword,
        emailConfirmed,
        isAuthenticated: !!user,
        onboardingCompleted,
        completeOnboarding,
        loadProfile,
        needsProfileUpdate,
        markProfileComplete,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    console.warn('useAuth must be used within an AuthProvider, returning default values');
    return {
      user: null,
      profile: null,
      loading: false,
      login: async () => { throw new Error('Auth not available'); },
      signup: async () => { throw new Error('Auth not available'); },
      logout: async () => {},
      resendConfirmationEmail: async () => { throw new Error('Auth not available'); },
      resetPassword: async () => { throw new Error('Auth not available'); },
      signInWithGoogle: async () => { throw new Error('Auth not available'); },
      emailConfirmed: true,
      isAuthenticated: false,
      onboardingCompleted: false,
      completeOnboarding: async () => {},
    };
  }
  return ctx;
};
