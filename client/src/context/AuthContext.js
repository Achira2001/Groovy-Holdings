'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data.user);
    return data.user;
  }, []);

  const googleLogin = useCallback(async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, setUser, loading, refresh, login, googleLogin, logout, isAdmin: user?.role === 'admin' }),
    [user, loading, refresh, login, googleLogin, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

/** Where to send a user right after signing in. */
export const homeFor = (user, next) => {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  if (!user) return '/login';
  if (user.role === 'admin') return '/admin';
  if (!user.whatsapp) return '/complete-profile';
  return '/account';
};
