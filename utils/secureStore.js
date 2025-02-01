import * as SecureStore from "expo-secure-store";

export const saveToken = async (key, value) => {
  try {
    await SecureStore.setItemAsync(key, value);
    console.log(`Token saved with key: ${key}`); // Debug log
  } catch (error) {
    console.error('Error saving token:', error);
    throw error;
  }
};

export const getToken = async (key) => {
  try {
    const result = await SecureStore.getItemAsync(key);
    return result;
  } catch (error) {
    console.error('Error getting token:', error);
    throw error;
  }
};

export const deleteToken = async (key) => {
  try {
    await SecureStore.deleteItemAsync(key);
    console.log(`Token deleted with key: ${key}`); // Debug log
  } catch (error) {
    console.error('Error deleting token:', error);
    throw error;
  }
};