import { create } from 'zustand';
import api from '../api/client';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('cyvera_access_token'),
  isAuthenticated: !!localStorage.getItem('cyvera_access_token'),
  isLoading: true,

  login: (token, refreshToken, user) => {
    localStorage.setItem('cyvera_access_token', token);
    localStorage.setItem('cyvera_refresh_token', refreshToken);
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('cyvera_access_token');
    localStorage.removeItem('cyvera_refresh_token');
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('cyvera_access_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return false;
    }

    if (token.startsWith('cyvera_demo_')) {
      const demoUser: User = {
        id: 'usr_secops_demo_01',
        email: 'demo@cyvera.io',
        username: 'secops_demo',
        is_active: true,
        is_verified: true,
        created_at: new Date().toISOString()
      };
      set({ user: demoUser, isAuthenticated: true, isLoading: false });
      return true;
    }

    try {
      const res = await api.get<User>('/auth/me');
      set({ user: res.data, isAuthenticated: true, isLoading: false });
      return true;
    } catch {
      localStorage.removeItem('cyvera_access_token');
      localStorage.removeItem('cyvera_refresh_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return false;
    }
  }
}));
