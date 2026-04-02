import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, loginWithGoogle as apiGoogleLogin, login as apiLogin, signup as apiSignup, logout as apiLogout, isLoggedIn } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!isLoggedIn()) { setLoading(false); return; }
    try {
      const userData = await getMe();
      setUser(userData);
    } catch {
      apiLogout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const loginGoogle = async (credential) => {
    const data = await apiGoogleLogin(credential);
    setUser(data.user);
    return data;
  };

  const loginEmail = async ({ email, password }) => {
    const data = await apiLogin({ email, password });
    setUser(data.user);
    return data;
  };

  const signupEmail = async ({ email, password, name }) => {
    const data = await apiSignup({ email, password, name });
    setUser(data.user);
    return data;
  };

  const logout = () => { apiLogout(); setUser(null); };

  const refreshUser = async () => {
    try { const u = await getMe(); setUser(u); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginGoogle, loginEmail, signupEmail, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
