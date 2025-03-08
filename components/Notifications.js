import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLanguage } from '../utils/languageContext';
import { translations } from '../utils/languageContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '@/app/_layout';

export default function Notifications({ showNotifications, setShowNotifications }) {
  const { language } = useLanguage();
  const {user} = useAuth();
  const [notificationsData,setNotificationsData] = useState([]);

    const fetchOrderData = async ()=>{
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications?user_id=${user.userId}`, {
        method: "GET",
        credentials: "include",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json"
        }
    });
    const data = await res.json();
    console.log(data)
    setNotificationsData(data.data);
    }

    useEffect(()=>{
        if(user){
            fetchOrderData();
        }
    },[user])


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

  if (!showNotifications) return null;

return (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{translations[language].notifications}</Text>
      <TouchableOpacity onPress={() => setShowNotifications(false)}>
        <MaterialIcons name="close" size={24} color="#666" />
      </TouchableOpacity>
    </View>
    
    <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        >
      {notificationsData.length === 0 ? (
        <Text style={styles.noNotifications}>No notifications</Text>
      ) : (
        notificationsData.map((notification) => (
          <TouchableOpacity 
            key={notification.notification_id} 
            style={[
              styles.notificationItem,
              !notification.is_read && styles.unread
            ]}
          >
            <View style={styles.iconContainer}>
              {getIcon(notification.type)}
            </View>
            <View style={styles.contentContainer}>
              <Text style={styles.title}>{`Order #${notification.order_id}`}</Text>
              <Text style={styles.message}>{notification.message}</Text>
              <Text style={styles.time}>
                {new Date(notification.created_at).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  </View>
);
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        right: 10,
        backgroundColor: 'white',
        borderRadius: 12,
        width: 300,
        height: 200,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 1000,
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
    notificationItem: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: 'white',
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
        marginRight: 12,
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
});