import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import { getToken } from './secureStore';
import * as TaskManager from 'expo-task-manager';

// Define the background notification task name
export const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

// Configure notification handler for when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Register the background task handler for notifications
export async function registerBackgroundNotificationTask() {
  // Check if task is already registered
  const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
  
  if (!isTaskRegistered) {
    await TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error }) => {
      if (error) {
        console.error(`Error in background task ${BACKGROUND_NOTIFICATION_TASK}:`, error);
        return;
      }

      if (data) {
        const { notification } = data;
        
        // Process the notification data
        if (notification && notification.request && notification.request.content) {
          const notificationData = notification.request.content.data;
          const title = notification.request.content.title;
          const body = notification.request.content.body;
          
          // Schedule a local notification to ensure it's visible
          // This is needed because some Android devices might suppress background notifications
          Notifications.scheduleNotificationAsync({
            content: {
              title: title || "New Notification",
              body: body || "You have a new notification",
              data: notificationData,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.MAX,
              channelId: 'high_priority',
            },
            trigger: null, // Show immediately
          }).catch(err => console.error("Failed to schedule notification:", err));
        }
        
        return true;
      }
    });
    
    // Register the task with notifications
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
  }
}

// Register for push notifications
export async function registerForPushNotificationsAsync() {
  let token;
  
  // Check if running in Expo Go vs development build
  const isExpoGo = Constants.appOwnership === 'expo';
  const isDevelopmentBuild = !isExpoGo;
  
  if (isExpoGo && Platform.OS === 'android') {
    console.warn('Push notifications are not supported in Expo Go on Android with SDK 53+. Use a development build instead.');
    return null;
  }
  
  if (Platform.OS === 'android' && !isDevelopmentBuild) {
    console.warn('Android Push notifications functionality requires a development build with SDK 53+');
    return null;
  }
  
  if (Platform.OS === 'android') {
    // Create a channel for Android notifications with higher importance
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: true,
      enableVibrate: true,
      showBadge: true,
    });
    
    // Create a high priority channel for critical notifications
    await Notifications.setNotificationChannelAsync('high_priority', {
      name: 'High Priority',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: true,
      enableVibrate: true,
      showBadge: true,
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.error('Permission not granted to get push token for push notification!');
      return;
    }
    
    try {
      // Get the push token
      if (Platform.OS === 'android') {
        if (isDevelopmentBuild) {
          // Use device push token for Android
          token = (await Notifications.getDevicePushTokenAsync()).data;
        } else {
          console.warn('Push notifications require a development build on Android with SDK 53+');
          return null;
        }
      } else {
        // For iOS, we can still use Expo push tokens
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig.extra?.eas?.projectId
        })).data;
      }
      
      // Register background task for handling notifications when app is closed
      await registerBackgroundNotificationTask();
      
      // Send token to backend
      if (token) {
        // Check if user is authenticated before sending token to server
        const userToken = await getToken('userToken');
        const userId = await getToken('userId');
        if (userToken && userId) {
          await sendPushTokenToServer(token);
        } else {
          console.log('User not authenticated, skipping token registration with server');
        }
      }
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  } else {
    console.log('Must use physical device for push notifications');
  }

  return token;
}
  
// Send push token to server
async function sendPushTokenToServer(pushToken) {
  try {
    const token = await getToken('userToken');
    if (!token) return false;

    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    
    // Determine if it's an Expo token or native device token
    const isExpoToken = typeof pushToken === 'string' && pushToken.startsWith('ExponentPushToken[');
    const response = await fetch(`${apiUrl}/api/notifications/token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        pushToken,
        platform: Platform.OS,
        tokenType: isExpoToken ? 'expo' : 'native'
      })
    });
    
    // Check if response is ok before parsing JSON
    if (!response.ok) {
      const text = await response.text();
      console.error("Error response from server:", text);
      return false;
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    return false;
  }
}

// Set up notification listeners
export function setupNotificationListeners(onNotification, onNotificationResponse) {
  // When a notification is received while the app is in the foreground
  const notificationListener = Notifications.addNotificationReceivedListener(
    notification => {
      if (onNotification) {
        onNotification(notification);
      }
    }
  );

  // When the user taps on a notification (works in foreground, background, or killed states)
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    response => {
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    }
  );

  return {
    remove: () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    }
  };
}

// Get the last notification response (useful for handling deep linking when app opens from a notification)
export async function getLastNotificationResponse() {
  return await Notifications.getLastNotificationResponseAsync();
}

// Clear all notifications
export async function dismissAllNotifications() {
  return await Notifications.dismissAllNotificationsAsync();
}

// Set badge count
export async function setBadgeCount(count) {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
  }
}

// Schedule a local notification
export async function scheduleLocalNotification(title, body, data = {}) {
  try {
    // Check if notification has user_id and if it matches current user
    if (data && data.user_id) {
      const currentUserId = await getToken('userId');
      if (!currentUserId || Number(currentUserId) !== Number(data.user_id)) {
        return;
      }
    }
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        channelId: 'high_priority',
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error("Error scheduling local notification:", error);
  }
}

// This function should be called in the App.js or index.js file to ensure notifications work when app is closed
export async function initializeNotifications() {
  // Register for push notifications
  await registerForPushNotificationsAsync();
  
  // Explicitly register background task
  await registerBackgroundNotificationTask();
  
  // Check for any notifications that launched the app
  const lastNotificationResponse = await getLastNotificationResponse();
  if (lastNotificationResponse) {
    // Handle the notification that launched the app
  }
  
  // Set up notification listeners
  return setupNotificationListeners(
    (notification) => {
    },
    (response) => {
      // Handle notification response (e.g., navigate to a specific screen)
      const data = response.notification.request.content.data;
      
      // Example: Handle different notification types
      if (data.type === 'order') {
        // Navigate to order details
        // navigation.navigate('OrderDetails', { orderId: data.orderId });
      } else if (data.type === 'collection') {
        // Navigate to collection details
        // navigation.navigate('CollectionDetails', { collectionId: data.collectionId });
      }
    }
  );
}