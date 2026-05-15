import { create } from 'zustand';
import { storage } from '@/lib/storage';

export const AUTH_TOKEN_KEY = 'access_token';

export interface AuthUser {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isInitialized: boolean;
  setAuth: (token: string, user: AuthUser) => Promise<void>;
  clearAuth: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isInitialized: false,

  setAuth: async (token: string, user: AuthUser) => {
    await storage.set(AUTH_TOKEN_KEY, token);
    set({ accessToken: token, user });
  },

  clearAuth: async () => {
    await storage.del(AUTH_TOKEN_KEY);
    set({ accessToken: null, user: null });
  },

  initialize: async () => {
    try {
      const token = await storage.get(AUTH_TOKEN_KEY);
      if (token) {
        set({ accessToken: token });
      }
    } catch {
      // Silently fail — no stored token
    } finally {
      set({ isInitialized: true });
    }
  },
}));

export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.accessToken !== null);
}
