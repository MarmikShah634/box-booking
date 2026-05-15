import * as SecureStore from 'expo-secure-store';

export async function getItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

export const StorageKeys = {
  ACCESS_TOKEN: 'super_admin_access_token',
  REFRESH_TOKEN: 'super_admin_refresh_token',
  ADMIN_DATA: 'super_admin_data',
} as const;
