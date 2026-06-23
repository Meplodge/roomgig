import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import {
  getDeviceId,
  bindDeviceToAccount,
  isDeviceBound,
  removeDeviceBinding,
  validateDeviceBinding,
} from '../utils/deviceUtils';

const AuthContext = createContext(null);

const STORAGE_KEY = '@realestate_user';
const ONBOARDING_KEY = '@realestate_onboarding_completed';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState(true);

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

      if (data && !error) {
        setProfile(data);
        // Update user avatar if profile has avatar_url
        if (data.avatar_url && user) {
          setUser(prev => ({ ...prev, avatar: data.avatar_url }));
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
        emailConfirmed,
        isAuthenticated: !!user,
        onboardingCompleted,
        completeOnboarding,
        loadProfile,
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
      emailConfirmed: true,
      isAuthenticated: false,
      onboardingCompleted: false,
      completeOnboarding: async () => {},
    };
  }
  return ctx;
};
