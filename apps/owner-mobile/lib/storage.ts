import * as SecureStore from 'expo-secure-store';

export const storage = {
  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async set(key: string, value: string): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(key, value);
      return true;
    } catch {
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch {
      return false;
    }
  },
};

export const StorageKeys = {
  ACCESS_TOKEN: 'owner_access_token',
  REFRESH_TOKEN: 'owner_refresh_token',
  OWNER_DATA: 'owner_data',
} as const;
