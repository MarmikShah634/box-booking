import { create } from 'zustand';
import { storage, StorageKeys } from '@/lib/storage';

export interface Owner {
  id: string;
  name: string;
  email: string;
  kycStatus: string;
}

export interface OwnerAuthState {
  accessToken: string | null;
  owner: Owner | null;
  isHydrated: boolean;
  setAuth: (token: string, owner: Owner) => void;
  clearAuth: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<OwnerAuthState>((set, get) => ({
  accessToken: null,
  owner: null,
  isHydrated: false,

  setAuth: (token, owner) => {
    set({ accessToken: token, owner });
    void storage.set(StorageKeys.ACCESS_TOKEN, token);
    void storage.set(StorageKeys.OWNER_DATA, JSON.stringify(owner));
  },

  clearAuth: () => {
    set({ accessToken: null, owner: null });
    void storage.del(StorageKeys.ACCESS_TOKEN);
    void storage.del(StorageKeys.REFRESH_TOKEN);
    void storage.del(StorageKeys.OWNER_DATA);
  },

  hydrate: async () => {
    const token = await storage.get(StorageKeys.ACCESS_TOKEN);
    const ownerRaw = await storage.get(StorageKeys.OWNER_DATA);
    let owner: Owner | null = null;

    if (ownerRaw) {
      try {
        owner = JSON.parse(ownerRaw) as Owner;
      } catch {
        owner = null;
      }
    }

    set({ accessToken: token, owner, isHydrated: true });
  },
}));
