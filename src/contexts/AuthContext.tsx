import { createContext, useContext, useEffect, useState } from 'react';
import { Profile, TokenResponse } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  profile: Profile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const loadProfile = async () => {
    try {
      const userData = await api.get<Profile>('/users/me');
      setProfile(userData);
    } catch (error) {
      console.error('Error loading profile:', error);
      localStorage.removeItem('auth_token');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const data = await api.post<TokenResponse>('/auth/login', formData);
    localStorage.setItem('auth_token', data.access_token);
    await loadProfile();
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setProfile(null);
  };

  const value = {
    profile,
    loading,
    signIn,
    signOut,
    isAdmin: profile?.role === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
