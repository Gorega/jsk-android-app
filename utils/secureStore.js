import * as SecureStore from "expo-secure-store";

export const saveToken = async (key, value) => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    throw error;
  }
};

export const getToken = async (key) => {
  try {
    const result = await SecureStore.getItemAsync(key);
    return result;
  } catch (error) {
    throw error;
  }
};

export const deleteToken = async (key) => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    throw error;
  }
};