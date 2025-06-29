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

// User-specific storage (keeping for backward compatibility)
export const saveUserData = async (userId, key, value) => {
  try {
    const userKey = `user_${userId}_${key}`;
    await SecureStore.setItemAsync(userKey, value);
  } catch (error) {
    throw error;
  }
};

export const getUserData = async (userId, key) => {
  try {
    const userKey = `user_${userId}_${key}`;
    const result = await SecureStore.getItemAsync(userKey);
    return result;
  } catch (error) {
    throw error;
  }
};

export const deleteUserData = async (userId, key) => {
  try {
    const userKey = `user_${userId}_${key}`;
    await SecureStore.deleteItemAsync(userKey);
  } catch (error) {
    throw error;
  }
};

// Account registry - each master account has its own registry
export const getAccountsForMaster = async (masterUserId) => {
  try {
    if (!masterUserId) return [];
    
    const accountsJson = await SecureStore.getItemAsync(`master_${masterUserId}_accounts`);
    if (!accountsJson) return [];
    
    const accounts = JSON.parse(accountsJson);
    return Array.isArray(accounts) ? accounts : [];
  } catch (error) {
    return [];
  }
};

export const saveAccountsForMaster = async (masterUserId, accounts) => {
  try {
    if (!masterUserId || !Array.isArray(accounts)) {
      throw new Error("Invalid master ID or accounts array");
    }
    
    // Ensure no duplicates by userId
    const uniqueAccounts = [];
    const seen = new Set();
    
    for (const account of accounts) {
      if (account && account.userId && !seen.has(account.userId.toString())) {
        seen.add(account.userId.toString());
        uniqueAccounts.push(account);
      }
    }
    
    await SecureStore.setItemAsync(`master_${masterUserId}_accounts`, JSON.stringify(uniqueAccounts));
    return true;
  } catch (error) {
    return false;
  }
};

// Add a single account to a master's registry
export const addAccountToMaster = async (masterUserId, account) => {
  try {
    if (!masterUserId || !account || !account.userId) {
      throw new Error("Invalid master ID or account object");
    }
    
    const accounts = await getAccountsForMaster(masterUserId);
    
    // Check if account already exists
    const existingIndex = accounts.findIndex(a => a.userId.toString() === account.userId.toString());
    
    if (existingIndex >= 0) {
      // Update existing account
      accounts[existingIndex] = {...accounts[existingIndex], ...account};
    } else {
      // Add new account
      accounts.push(account);
    }
    
    return await saveAccountsForMaster(masterUserId, accounts);
  } catch (error) {
    console.error("Error adding account to master:", error);
    return false;
  }
};

// Remove an account from a master's registry
export const removeAccountFromMaster = async (masterUserId, accountUserId) => {
  try {
    if (!masterUserId || !accountUserId) return false;
    
    const accounts = await getAccountsForMaster(masterUserId);
    const filteredAccounts = accounts.filter(a => a.userId.toString() !== accountUserId.toString());
    
    if (filteredAccounts.length === accounts.length) {
      // No account was removed
      return false;
    }
    
    return await saveAccountsForMaster(masterUserId, filteredAccounts);
  } catch (error) {
    return false;
  }
};

// Get a specific account from a master's registry
export const getAccountFromMaster = async (masterUserId, accountUserId) => {
  try {
    if (!masterUserId || !accountUserId) return null;
    
    const accounts = await getAccountsForMaster(masterUserId);
    return accounts.find(a => a.userId.toString() === accountUserId.toString()) || null;
  } catch (error) {
    return null;
  }
};

// Master account management
export const getMasterAccountId = async () => {
  try {
    return await SecureStore.getItemAsync("master_account_id");
  } catch (error) {
    return null;
  }
};

export const setMasterAccountId = async (userId) => {
  try {
    if (!userId) return false;
    await SecureStore.setItemAsync("master_account_id", userId.toString());
    return true;
  } catch (error) {
    return false;
  }
};

export const clearMasterAccountId = async () => {
  try {
    await SecureStore.deleteItemAsync("master_account_id");
    return true;
  } catch (error) {
    return false;
  }
};

// Session management - track if this is a direct login or a switched account
export const setDirectLogin = async (isDirectLogin) => {
  try {
    await SecureStore.setItemAsync("is_direct_login", isDirectLogin ? "true" : "false");
    return true;
  } catch (error) {
    return false;
  }
};

export const isDirectLogin = async () => {
  try {
    const value = await SecureStore.getItemAsync("is_direct_login");
    return value === "true";
  } catch (error) {
    return false;
  }
};

// For backward compatibility
export const saveMasterAccount = setMasterAccountId;
export const getMasterAccount = getMasterAccountId;
export const clearMasterAccount = clearMasterAccountId;
export const saveInitialLoginFlag = setMasterAccountId;
export const getInitialLoginFlag = getMasterAccountId;
export const clearInitialLoginFlag = clearMasterAccountId;

// Compatibility with the new system
export const getAllAccounts = async () => {
  const masterId = await getMasterAccountId();
  if (!masterId) return [];
  return getAccountsForMaster(masterId);
};

export const saveAllAccounts = async (accounts) => {
  const masterId = await getMasterAccountId();
  if (!masterId) return false;
  return saveAccountsForMaster(masterId, accounts);
};

export const addAccount = async (account) => {
  const masterId = await getMasterAccountId();
  if (!masterId) return false;
  return addAccountToMaster(masterId, account);
};

export const removeAccount = async (accountUserId) => {
  const masterId = await getMasterAccountId();
  if (!masterId) return false;
  return removeAccountFromMaster(masterId, accountUserId);
};

export const getAccount = async (accountUserId) => {
  const masterId = await getMasterAccountId();
  if (!masterId) return null;
  return getAccountFromMaster(masterId, accountUserId);
};