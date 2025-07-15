import { Alert, Linking, Platform } from 'react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';

// Store URLs
const APP_STORE_URL = 'https://apps.apple.com/us/app/taiar/id6746768193'; // Replace with your App Store ID
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.taiar&pli=1'; // Replace with your app's package name

// Check if the app needs to be updated by comparing versions
export const checkForUpdates = async (language = 'ar') => {
  try {
    // Get current app version from Constants
    const currentVersion = Constants.expoConfig?.version || '2.3.0';
    
    // Get the latest version from your API
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/app-version`, {
      timeout: 5000, // Add timeout to prevent long waits
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      console.log('Network error fetching app version:', error);
      return null;
    });
    
    if (!response || !response.ok) {
      console.log('Failed to fetch app version, status:', response?.status);
      return { needsUpdate: false, currentVersion };
    }
    
    const data = await response.json().catch(error => {
      console.log('Error parsing app version response:', error);
      return null;
    });
    
    if (!data) {
      return { needsUpdate: false, currentVersion };
    }
    
    const latestVersion = data.version;
    const isUpdateRequired = data.forceUpdate || false;
    
    // Compare versions (simple string comparison, assumes semver format x.y.z)
    const needsUpdate = compareVersions(currentVersion, latestVersion) < 0;
    
    return {
      needsUpdate,
      isUpdateRequired,
      currentVersion,
      latestVersion,
      updateMessage: data.updateMessage?.[language] || data.updateMessage?.en || 'A new version is available. Please update to continue.'
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
    // If there's an error, don't force update
    return { needsUpdate: false };
  }
};

// Compare two version strings
// Returns: 
// -1 if version1 < version2
// 0 if version1 === version2
// 1 if version1 > version2
export const compareVersions = (version1, version2) => {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part < v2Part) return -1;
    if (v1Part > v2Part) return 1;
  }
  
  return 0;
};

// Show update alert
export const showUpdateAlert = (updateInfo, language = 'ar') => {
  const { isUpdateRequired, updateMessage } = updateInfo;
  
  const title = language === 'ar' ? 'تحديث التطبيق' : 'App Update';
  const updateButtonText = language === 'ar' ? 'تحديث الآن' : 'Update Now';
  
  return new Promise((resolve) => {
    Alert.alert(
      title,
      updateMessage,
      isUpdateRequired
        ? [
            {
              text: updateButtonText,
              onPress: () => {
                openAppStore();
                resolve(false); // User will update
              },
            },
          ]
        : [
            {
              text: updateButtonText,
              onPress: () => {
                openAppStore();
                resolve(false); // User will update
              },
            }
          ],
      { cancelable: !isUpdateRequired }
    );
  });
};

// Open the appropriate app store based on platform
export const openAppStore = () => {
  const storeUrl = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
  Linking.openURL(storeUrl).catch((err) => {
    console.error('Error opening store URL:', err);
  });
};

// Check for OTA updates using expo-updates
export const checkForOTAUpdates = async () => {
  try {
    // First check if we're in Expo Go
    const isExpoGo = Constants.appOwnership === 'expo';
    
    // Skip OTA update check if in Expo Go
    if (isExpoGo) {
      console.log('Skipping OTA update check in Expo Go');
      return false;
    }
    
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      // New update has been downloaded
      return true;
    }
  } catch (error) {
    console.error('Error checking for OTA updates:', error);
  }
  return false;
};

// Main function to check updates and show alert if needed
export const handleAppUpdates = async (language = 'en') => {
  try {
    // First check for OTA updates
    const hasOTAUpdate = await checkForOTAUpdates();
    if (hasOTAUpdate) {
      Alert.alert(
        language === 'ar' ? 'تحديث التطبيق' : 'App Update',
        language === 'ar' ? 'تم تنزيل تحديث جديد. سيتم إعادة تشغيل التطبيق لتطبيق التحديث.' : 'A new update has been downloaded. The app will restart to apply the update.',
        [
          {
            text: 'OK',
            onPress: () => {
              Updates.reloadAsync();
            },
          },
        ]
      );
      return false; // Don't continue with app initialization
    }

    // Then check for store updates
    const updateInfo = await checkForUpdates(language);
    
    if (updateInfo.needsUpdate) {
      // Show update alert and get user's decision
      const shouldContinue = await showUpdateAlert(updateInfo, language);
      return shouldContinue;
    }
    
    return true; // Continue with app initialization
  } catch (error) {
    console.error('Error handling app updates:', error);
    return true; // Continue with app initialization in case of error
  }
}; 