import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getData } from '../api/client';
import type { User } from '../types';
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      setUser(await getData<User>('/auth/me'));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    const next = response.data.data.user as User;
    setUser(next);
    return next;
  }
  async function logout() {
    await api.post('/auth/logout');
    setUser(null);
  }
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider қажет');
  return context;
}
