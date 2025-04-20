import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../_layout';
import { useLanguage } from '../../utils/languageContext';
import { translations } from '../../utils/languageContext';
import { useSocket } from '../../utils/socketContext';

const TrackingOrder = ({}) => {
  const socket = useSocket();
  const {user:authUser} = useAuth();
  const params = useLocalSearchParams();
  const { orderId } = params;
  const [order,setOrder] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();
  const isRTL = language === 'ar' || language === 'he';
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchOrderData();
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  }, [fetchOrderData]);

  const fetchOrderData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/${orderId}?language_code=${language}`, {
        method: "GET",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      setOrder(data);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, [orderId, language]);

  const getStatusIcon = (statusKey) => {
    switch (statusKey) {
      // Waiting/Processing states
      case 'waiting':
      case 'in_branch':
      case 'in_progress':
        return 'clock';
      
      // Error/Rejection states
      case 'rejected':
      case 'return_before_delivered_initiated':
      case 'return_after_delivered_initiated':
        return 'x-circle';
      
      // Warning states
      case 'stuck':
      case 'delayed':
      case 'reschedule':
        return 'alert-triangle';
      
      // Delivery states
      case 'on_the_way':
        return 'truck';
      
      // Return states
      case 'returned':
      case 'returned_in_branch':
      case 'returned_out':
        return 'corner-up-left';
      
      // Money states
      case 'money_in_branch':
      case 'money_out':
      case 'business_paid':
        return 'dollar-sign';
      
      // Success states
      case 'business_returned_delivered':
      case 'delivered':
      case 'completed':
        return 'check-circle';
      
      default:
        return 'help-circle';
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, [language]);

  const handleOrderUpdate = useCallback((notification) => {
    
      switch (notification.type) {
          case 'ORDER_UPDATED':
          case 'COLLECTION_CREATED':
          case 'COLLECTION_UPDATED':
          case 'COLLECTION_DELETED':
          case 'STATUS_UPDATED':
              fetchOrderData()
              break;
          default:
              break;
      }
  }, []);

  useEffect(() => {
      if (socket) {
          // Set up both listeners at once
          socket.on('orderUpdate', handleOrderUpdate);
          socket.on('collectionUpdate', handleOrderUpdate);

          return () => {
              socket.off('orderUpdate', handleOrderUpdate);
              socket.off('collectionUpdate', handleOrderUpdate);
          };
      }
  }, [socket, handleOrderUpdate]);

  if (isLoading) {
    return (
      <View style={styles.overlay}>
          <View style={styles.spinnerContainer}>
              <ActivityIndicator size="large" color="#F8C332" />
          </View>
      </View>
    );
  }

  return (
    <ScrollView
    style={[
      styles.container, 
      { direction: isRTL ? 'rtl' : 'ltr' }
    ]}
    refreshControl={
      <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#F8C332"]} // Android
          tintColor="#F8C332" // iOS
      />}
    >
      {/* Order Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{translations[language].tabs.orders.track.orderTracking}</Text>
        <Text style={styles.orderNumber}>{translations[language].tabs.orders.track.order} #{orderId}</Text>
      </View>

      {/* Package Info */}
      <View style={styles.packageInfo}>
        <Feather name="package" size={32} color="#F8C332" />
        <Text style={styles.packageName}>{translations[language].tabs.orders.track.package}: {order?.order_items ? order?.order_items : translations[language].tabs.orders.track.unknown}</Text>
        <Text style={styles.packageDetails}>{translations[language].tabs.orders.track.quantity}: {order?.number_of_items}</Text>
        <Text style={styles.packageDetails}>{translations[language].tabs.orders.track.weight}: {order?.order_weight} kg</Text>
        {order.received_items && <Text style={styles.packageDetails}>{translations[language].tabs.orders.track.receivedItems}: {order?.received_items}</Text>} 
        {order.received_quantity && <Text style={styles.packageDetails}>{translations[language].tabs.orders.track.receivedQuantity}: {order?.received_quantity}</Text>}
      </View>

     {/* Delivery Status */}
     <View style={[styles.statusContainer]}>
        <Text style={[styles.statusTitle]}>
          {translations[language].tabs.orders.track.deliveryStatus}
        </Text>

        {/* Timeline */}
        <View style={[styles.timelineContainer, { paddingLeft: isRTL ? 0 : 30, paddingRight: isRTL ? 30 : 0 }]}>
          <View style={[styles.timelineLine, { left: isRTL ? undefined : 15, right: isRTL ? 15 : undefined }]}></View>
          {order.order_status_history?.map((item, index) => (
            <View key={index} style={[styles.timelineItem, { flexDirection: isRTL ? 'row' : 'row' }]}>
              <View style={[styles.timelineCircle, index === order.order_status_history.length - 1]}>
                <Feather name={getStatusIcon(item.status_key)} size={16} color="white" />
              </View>
              <View style={[styles.statusTextContainer, { marginLeft: isRTL ? 0 : 15, marginRight: isRTL ? 15 : 0 }]}>
                <Text style={[styles.timelineStatus]}>{item.new_status}</Text>
                <Text style={[styles.timelineTime]}>
                  {translations[language].tabs.orders.track.branch}: {item.branch}
                </Text>
                <Text style={[styles.timelineTime]}>{item.created_at?.slice(0,10)}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {authUser.role === "business" &&
      <View style={styles.supportContainer}>
        <Text style={styles.supportText}>{translations[language].tabs.orders.track.issue}</Text>
        <TouchableOpacity onPress={()=> router.push({
            pathname:"/(complaints)/open_complaint",
            params:{orderId:orderId}
        })}>
          <Text style={styles.supportLink}>{translations[language].tabs.orders.track.openCase}</Text>
        </TouchableOpacity>
      </View>}
      
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  orderNumber: {
    fontSize: 16,
    color: '#777',
  },
  packageInfo: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  packageImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  packageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  packageDetails: {
    fontSize: 14,
    color: '#777',
  },
  statusContainer: {
    marginBottom: 30,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: 30,
  },
  timelineLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#F8C332',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  timelineCircle: {
    backgroundColor: '#F8C332',
    width: 25,
    height: 25,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  statusTextContainer: {
    marginLeft: 15,
  },
  timelineStatus: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  timelineTime: {
    fontSize: 14,
    color: '#777',
  },
  supportContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom:36
  },
  supportText: {
    fontSize: 16,
    color: '#333',
  },
  supportLink: {
    fontSize: 16,
    color: '#007BFF',
    marginTop: 5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
},
spinnerContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
}
});

export default TrackingOrder;
