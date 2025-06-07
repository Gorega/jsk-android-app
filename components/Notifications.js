import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator,Platform } from 'react-native';
import { useLanguage } from '../utils/languageContext';
import { translations } from '../utils/languageContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from "../RootLayout";
import { router } from 'expo-router';
import FlatListData from './FlatListData';
import { useSocket } from '../utils/socketContext';
import { getToken } from '../utils/secureStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRTLStyles } from '../utils/RTLWrapper';
import * as ExpoNotifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure how notifications are presented when the app is in the foreground
ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function Notifications() {
  const socket = useSocket();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [notificationsData, setNotificationsData] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expoPushToken, setExpoPushToken] = useState('');
  const isRTL = language === 'ar' || language === 'he';


  // Register for push notifications
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
  }, []);

  // Function to register for push notifications
  async function registerForPushNotificationsAsync() {
    let token;
    
    if (Platform.OS === 'android') {
      await ExpoNotifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: ExpoNotifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await ExpoNotifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await ExpoNotifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      token = (await ExpoNotifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.eas.projectId,
      })).data;
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  // Function to schedule a local notification
  const scheduleLocalNotification = async (notification) => {
    await ExpoNotifications.scheduleNotificationAsync({
      content: {
        title: notification.type === 'order' ? 
          translations[language]?.notifications?.orderNotification || 'Order Notification' : 
          translations[language]?.notifications?.appNotification || 'App Notification',
        body: notification.translated_message,
        data: { type: notification.type, orderId: notification.order_id },
      },
      trigger: null, // Show immediately
    });
  };

  const fetchNotificationsData = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setIsLoading(true);
      // const token = await getToken("userToken");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications?user_id=${user.userId}&page=${pageNum}&language_code=${language}`, {
        method: "GET",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
          // "Cookie": token ? `token=${token}` : ""
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (pageNum === 1) {
        setNotificationsData(data.data);
      } else {
        setNotificationsData(prev => [...prev, ...data.data]);
      }
      return data.data.length > 0;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreNotifications = async () => {
    if (!loadingMore && notificationsData?.length > 0) {
      // Check if there's more data to load based on the current page size
      if (notificationsData.length < 10 * page) {
        return;
      }

      setLoadingMore(true);    
      const hasMore = await fetchNotificationsData(page + 1);
      if (hasMore) {
        setPage(prev => prev + 1);
      }
      setLoadingMore(false);
    }
  };

  const handleNotificationItemClick = async (notificationId, notificationType, notificationOrderId) => {
    try {
      // Navigate FIRST before starting the async operation
      if (notificationType === "order" && notificationOrderId) {
        router.push({
          pathname: "/(track)",
          params: { orderId: notificationOrderId }
        });
      }
      
      // Then mark as read (this happens in the background)
      // const token = await getToken("userToken");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications/${notificationId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
          // "Cookie": token ? `token=${token}` : ""
        },
        body: JSON.stringify({
          user_id: user.userId
        })
      });
  
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
  
      setNotificationsData(prev => 
        prev.map(n => n.notification_id === notificationId 
          ? {...n, is_read: true} 
          : n
        )
      );
    } catch (error) {
    }
  };

  const deleteAllNotifications = async () => {
    try {
      // const token = await getToken("userToken");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications/all`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
          // "Cookie": token ? `token=${token}` : ""
        },
        body: JSON.stringify({
          user_id: user.userId
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      setNotificationsData([]);
    } catch (error) {
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      // const token = await getToken("userToken");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications/${notificationId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
          // "Cookie": token ? `token=${token}` : ""
        },
        body: JSON.stringify({
          user_id: user.userId
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      setNotificationsData(prev => 
        prev.filter(n => n.notification_id !== notificationId)
      );
    } catch (error) {
    }
  };

  useEffect(() => {
    if (!socket || !user) return;

    const handleNotification = (notification) => {        
      // Ensure we're working with numbers for comparison
      const currentUserId = Number(user.userId);
      const notificationUserId = Number(notification.user_id);
      
      if (currentUserId !== notificationUserId) {
        return;
      }

      try {
        switch (notification.type) {
          case 'NEW_NOTIFICATION':
            fetchNotificationsData();
            
            // Schedule a system notification
            if (notification.message) {
              scheduleLocalNotification({
                type: notification.notificationType || 'order',
                translated_message: notification.message,
                order_id: notification.orderId
              });
            }
            break;
              
          case 'NOTIFICATION_UPDATED':
            setNotificationsData(prev =>
              prev.map(n => n.notification_id === notification.notification_id
                ? { ...n, is_read: true }
                : n
              )
            );
            break;

          case 'NOTIFICATION_DELETED':
            setNotificationsData(prev => {
              const filtered = prev.filter(n => n.notification_id !== notification.notification_id);
              return filtered;
            });
            break;

          case 'ALL_NOTIFICATIONS_DELETED':
            setNotificationsData([]);
            break;

          default:
            break;
        }
      } catch (error) {
        console.error('Error handling notification:', error);
      }
    };

    // Add a listener for notification responses
    const notificationListener = ExpoNotifications.addNotificationReceivedListener(response => {
      // Handle notification received while app is in foreground
    });

    // Add a listener for notification responses (when user taps)
    const responseListener = ExpoNotifications.addNotificationResponseReceivedListener(response => {
      const { type, orderId } = response.notification.request.content.data;
      
      if (type === "order" && orderId) {
        router.push({
          pathname: "/(track)",
          params: { orderId }
        });
      }
    });

    // Remove existing listeners before adding new one
    socket.off('notification');
    socket.on('notification', handleNotification);

    // Initial fetch
    fetchNotificationsData();

    return () => {
      socket.off('notification', handleNotification);
      ExpoNotifications.removeNotificationSubscription(notificationListener);
      ExpoNotifications.removeNotificationSubscription(responseListener);
    };
  }, [socket, user]);

  const getIcon = (type) => {
    switch (type) {
      case 'order':
        return (
          <LinearGradient
            colors={['#4CC9F0', '#4361EE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.notificationIconGradient}
          >
            <MaterialIcons name="shopping-bag" size={20} color="white" />
          </LinearGradient>
        );
      case 'delivery':
        return (
          <LinearGradient
            colors={['#7209B7', '#F72585']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.notificationIconGradient}
          >
            <MaterialIcons name="local-shipping" size={20} color="white" />
          </LinearGradient>
        );
      default:
        return (
          <LinearGradient
            colors={['#3A0CA3', '#480CA8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.notificationIconGradient}
          >
            <MaterialIcons name="notifications" size={20} color="white" />
          </LinearGradient>
        );
    }
  };

  const formatDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    
    // Check if it's today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return translations[language]?.notifications?.yesterday || 'Yesterday';
    }
    
    // Otherwise return formatted date
    return date.toLocaleDateString(language, { day: 'numeric', month: 'short' });
  };

  const renderNotification = (notification) => (
    <View 
      key={notification.notification_id} 
      style={[
        styles.notificationItem, 
        !notification.is_read && styles.unread
      ]}
    >
      <TouchableOpacity 
        style={[
          styles.notificationContent
        ]}
        onPress={() => handleNotificationItemClick(notification.notification_id, notification.type, notification.order_id)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          {getIcon(notification.type)}
          {!notification.is_read && <View style={styles.unreadIndicator} />}
        </View>
        
        <View style={[
          styles.contentContainer
        ]}>
          <View style={[
            styles.notificationHeader
          ]}>
            {/* <Text style={[
              styles.title,
              { textAlign: isRTL ? "right" : "left" }
            ]} numberOfLines={1}>
              {`${translations[language].notifications.order} #${notification.order_id}`}
            </Text> */}
            <Text style={styles.time}>
              {formatDate(notification.created_at)}
            </Text>
          </View>
          
          <Text 
            style={[
              styles.message,
              !notification.is_read && styles.unreadText,
              {
                ...Platform.select({
                    ios: {
                        textAlign:isRTL ? "left" : "right"
                    }
                }),
            }
            ]} 
          >
            {notification.translated_message}
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => deleteNotification(notification.notification_id)}
        style={styles.deleteButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={""} 
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>
        {translations[language]?.notifications?.noNotificationsTitle || 'No Notifications'}
      </Text>
      <Text style={styles.emptyText}>
        {translations[language]?.notifications?.noNotifications || "You don't have any notifications yet."}
      </Text>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4361EE" />
      <Text style={styles.loadingText}>
        {translations[language]?.notifications?.loading || 'Loading notifications...'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.headerGradient}
      >
        <View style={[
          styles.header
        ]}>
          <View style={[
            styles.headerTitleContainer
          ]}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <MaterialIcons 
                style={{ transform: rtl.isRTL ? [{ scaleX: -1 }] : [] }}
                name="arrow-back-ios" 
                size={22} 
                color="#1F2937" 
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {translations[language]?.notifications?.title || 'Notifications'}
            </Text>
          </View>
          
          {notificationsData.length > 0 && (
            <TouchableOpacity 
              style={styles.deleteAllButton}
              onPress={deleteAllNotifications}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#F72585', '#7209B7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.deleteAllGradient}
              >
                <Text style={styles.deleteAllText}>
                  {translations[language]?.notifications?.deleteAll || 'Clear All'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient> */}

      {isLoading ? (
        renderLoading()
      ) : notificationsData.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatListData
          list={notificationsData}
          loadMoreData={loadMoreNotifications}
          loadingMore={loadingMore}
        >
          {renderNotification}
        </FlatListData>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
    height: 110,
    zIndex:100
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 16,
    marginLeft: 4,
  },
  deleteAllButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  deleteAllGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteAllText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unread: {
    borderLeftWidth: 3,
    borderLeftColor: '#4361EE',
  },
  iconContainer: {
    position: 'relative',
  },
  notificationIconGradient: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F72585',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  contentContainer: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  unreadText: {
    color: '#1F2937',
    fontWeight: '500',
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    gap:10
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyImage: {
    width: 160,
    height: 160,
    marginBottom: 24,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4B5563',
  },
});