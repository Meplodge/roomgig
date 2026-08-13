import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api, onUnauthorized } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /** Confirms with admin-api that this Supabase user is an active admin. */
  const verifyAdmin = useCallback(async () => {
    try {
      const { data } = await api.get('/api/me');
      setAdmin(data);
      setError(null);
      return data;
    } catch (err) {
      setAdmin(null);
      // A valid Supabase login that is not on the admin allowlist must not be
      // left in a half-authenticated state.
      if (err.status === 403) {
        await supabase.auth.signOut();
        setSession(null);
      }
      setError(err.message);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) await verifyAdmin();
      if (active) setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'SIGNED_OUT') {
        setAdmin(null);
        setError(null);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [verifyAdmin]);

  // The API told us our token is no longer good.
  useEffect(
    () =>
      onUnauthorized(async () => {
        await supabase.auth.signOut();
        setSession(null);
        setAdmin(null);
      }),
    []
  );

  const signIn = useCallback(
    async (email, password) => {
      setError(null);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw new Error(signInError.message);

      setSession(data.session);
      const verified = await verifyAdmin();
      if (!verified) {
        throw new Error('This account does not have administrator access.');
      }
      return verified;
    },
    [verifyAdmin]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      admin,
      loading,
      error,
      signIn,
      signOut,
      isAuthenticated: Boolean(session && admin),
      role: admin?.role || null,
      can: (...roles) => Boolean(admin && roles.includes(admin.role)),
    }),
    [session, admin, loading, error, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
