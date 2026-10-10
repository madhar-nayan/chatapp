import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import client, { setAuthToken } from '../api/client.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'instaclone_token';
const USER_KEY = 'instaclone_user';

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem(USER_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => !token || !user);

  const setToken = useCallback((t, userData = null) => {
    if (t) {
      localStorage.setItem(STORAGE_KEY, t);
      if (userData) {
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        setUser(userData);
      }
      setAuthToken(t);
      setTokenState(t);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_KEY);
      setAuthToken(null);
      setTokenState(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      client
        .get('/api/auth/me')
        .then((res) => {
          setUser(res.data.user);
          try {
            localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
          } catch {
            /* ignore */
          }
        })
        .catch((err) => {
          if (err.response?.status === 401 || err.response?.status === 403) {
            setToken(null);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, setToken]);

  const login = useCallback(async (email, password) => {
    const { data } = await client.post('/api/auth/login', { email, password });
    setToken(data.token, data.user);
    return data;
  }, [setToken]);

  const register = useCallback(async (formData) => {
    const { data } = await client.post('/api/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setToken(data.token, data.user);
    return data;
  }, [setToken]);

  const logout = useCallback(() => setToken(null), [setToken]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const { data } = await client.get('/api/auth/me');
    setUser(data.user);
  }, [token]);

  const validateToken = useCallback(async () => {
    if (!token) return { active: false };
    const { data } = await client.get('/api/auth/validate');
    return data;
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: !!token && !!user,
      login,
      register,
      logout,
      refreshUser,
      validateToken,
    }),
    [token, user, loading, login, register, logout, refreshUser, validateToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside provider');
  return ctx;
}
