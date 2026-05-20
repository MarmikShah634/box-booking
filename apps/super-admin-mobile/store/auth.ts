import { create } from 'zustand';
import { deleteItem, StorageKeys } from '@/lib/storage';

export interface AdminUser {
  id: string;
  email: string;
}

interface AdminAuthState {
  accessToken: string | null;
  admin: AdminUser | null;
  hydrated: boolean;
  setAuth: (token: string, admin: AdminUser) => void;
  clearAuth: () => Promise<void>;
  setHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AdminAuthState>((set) => ({
  accessToken: null,
  admin: null,
  hydrated: false,

  setAuth: (token, admin) => {
    set({ accessToken: token, admin });
  },

  clearAuth: async () => {
    await deleteItem(StorageKeys.ACCESS_TOKEN);
    await deleteItem(StorageKeys.REFRESH_TOKEN);
    await deleteItem(StorageKeys.ADMIN_DATA);
    set({ accessToken: null, admin: null });
  },

  setHydrated: (value) => {
    set({ hydrated: value });
  },
}));
