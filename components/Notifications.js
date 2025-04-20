import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLanguage } from '../utils/languageContext';
import { translations } from '../utils/languageContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '@/app/_layout';
import { router } from 'expo-router';
import FlatListData from './FlatListData';
import { useSocket } from '../utils/socketContext';

export default function Notifications() {
  const socket = useSocket();
  const { language } = useLanguage();
  const {user} = useAuth();
  const [notificationsData,setNotificationsData] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const fetchNotificationsData = async (pageNum = 1) => {
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications?user_id=${user.userId}&page=${pageNum}&language_code=${language}`, {
        method: "GET",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json"
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
    }
  };

  const loadMoreNotifications = async () => {
    if (!loadingMore && notificationsData?.length > 0) {
        // Check if there's more data to load based on the current page size
        if (notificationsData.length < 10 * page) {
            console.log("No more data to load");
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

      if (notificationType === "order") {
        router.push({
          pathname: "(track)",
          params: { orderId: notificationOrderId }
        });
      }

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications/${notificationId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json"
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

      socket.emit('notification', {
        type: 'UPDATE_COUNT',
        user_id: Number(user.userId),
        timestamp: Date.now()
      });

      // No need to emit socket event as the server will handle it
    } catch (error) {
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications/all`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: user.userId
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      setNotificationsData([]);
      // No need to emit socket event as the server will handle it
    } catch (error) {
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      console.log('Deleting notification:', notificationId);
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications/${notificationId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json"
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
      // No need to emit socket event as the server will handle it
    } catch (error) {
    }
  };

  useEffect(() => {
    if (!socket || !user) return;

    const handleNotification = (notification) => {
        console.log('Received notification in list:', notification);
        
        // Ensure we're working with numbers for comparison
        const currentUserId = Number(user.userId);
        const notificationUserId = Number(notification.user_id);
        
        if (currentUserId !== notificationUserId) {
            return;
        }

        try {
            switch (notification.type) {
                case 'NEW_NOTIFICATION':
                    // Ensure we have all required fields
                    const newNotification = {
                        notification_id: notification.notification_id,
                        message: notification.message,
                        is_read: false,
                        is_read_count: false,
                        created_at: new Date().toISOString(), // Use current time if timestamp not provided
                        user_id: notificationUserId,
                        type: notification.notificationType || 'order', // Default to 'order' if not specified
                        order_id: notification.orderId
                    };
                    
                    setNotificationsData(prev => {
                      const exists = prev.some(n => n.notification_id === newNotification.notification_id);
                      if (exists) {
                          return prev;
                      }
                      return [newNotification, ...prev];
                  });

                  // Emit UPDATE_COUNT event with additional data
                  socket.emit('notification', {
                      type: 'UPDATE_COUNT',
                      user_id: currentUserId,
                      notification_id: notification.notification_id,
                      is_read: false,
                      timestamp: Date.now()
                  });
                  break;
                    

                case 'NOTIFICATION_UPDATED':
                    console.log('Updating notification:', notification.notification_id);
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
                    // Emit UPDATE_COUNT event after deleting
                    socket.emit('notification', {
                        type: 'UPDATE_COUNT',
                        user_id: currentUserId,
                        timestamp: Date.now()
                    });
                    return filtered;
                });
                break;

                case 'ALL_NOTIFICATIONS_DELETED':
                  setNotificationsData([]);
                  // Emit UPDATE_COUNT event after clearing all
                  socket.emit('notification', {
                      type: 'UPDATE_COUNT',
                      user_id: currentUserId,
                      timestamp: Date.now()
                  });
                  break;

                default:
            }
        } catch (error) {
        }
    };

    // Remove existing listeners before adding new one
    socket.off('notification');
    socket.on('notification', handleNotification);

    // Initial fetch
    fetchNotificationsData();

    return () => {
        socket.off('notification', handleNotification);
    };
}, [socket, user]);


  const getIcon = (type) => {
    switch (type) {
      case 'order':
        return <MaterialIcons name="shopping-bag" size={24} color="#F8C332" />;
      case 'delivery':
        return <MaterialIcons name="local-shipping" size={24} color="#4CAF50" />;
      default:
        return <MaterialIcons name="notifications" size={24} color="#2196F3" />;
    }
  };

  const renderNotification = (notification) => (
    <View key={notification.notification_id} style={[styles.notificationItem, !notification.is_read && styles.unread, {flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
      <TouchableOpacity 
        style={[styles.notificationContent,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}
        onPress={() => handleNotificationItemClick(notification.notification_id, notification.type, notification.order_id)}
      >
        <View style={[styles.iconContainer,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
          {getIcon(notification.type)}
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.title,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{`${translations[language].notifications.order} #${notification.order_id}`}</Text>
          <Text style={[styles.message,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{notification.translated_message}</Text>
          <Text style={[styles.time,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>
            {new Date(notification.created_at).toLocaleDateString(language, {hour: '2-digit',minute: '2-digit'})}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => deleteNotification(notification.notification_id)}
        style={styles.deleteButton}
      >
        <MaterialIcons name="delete" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

return (
  <View style={styles.container}>
    <View style={[styles.header,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
      <View style={[styles.headerTitleContianer,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons style={{transform:["he", "ar"].includes(language) ? [{ scaleX: -1 }] : []}} name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{translations[language].notifications.title}</Text>
      </View>
        <View style={styles.headerButtons}>
          {notificationsData.length > 0 && (
            <TouchableOpacity 
              style={styles.deleteAllButton}
              onPress={deleteAllNotifications}
            >
              <Text style={styles.deleteAllText}>{translations[language].notifications.deleteAll}</Text>
            </TouchableOpacity>
          )}
        </View>
    </View>
    {notificationsData.length === 0 ? (
        <Text style={styles.noNotifications}>{translations[language].notifications.noNotifications}</Text>
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
        borderRadius: 12,
        flex:1,
        backgroundColor: 'white',
      },
      scrollView: {
        flex: 1, // Added to allow scrolling
    },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
      },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerTitleContianer:{
      flexDirection:"row",
      alignItems:"center",
      gap:12
    },
    noNotifications: {
        flexDirection: 'row',
        padding: 25,
        backgroundColor: 'white',
        textAlign:"center"
    },
    unread: {
        backgroundColor: '#f0f9ff',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    message: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    time: {
        fontSize: 12,
        color: '#999',
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    deleteAllButton: {
      backgroundColor: '#FF6B6B',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 5,
    },
    deleteAllText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '500',
    },
    notificationContent: {
      flex: 1,
      flexDirection: 'row',
      gap:10
    },
    deleteButton: {
      padding: 10,
      justifyContent: 'center',
    },
    notificationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      backgroundColor: 'white',
    },
});