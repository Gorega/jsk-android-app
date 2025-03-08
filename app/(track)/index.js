import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../_layout';
import { useLanguage } from '../../utils/languageContext';
import { translations } from '../../utils/languageContext';

const TrackingOrder = ({}) => {
  const {user:authUser} = useAuth();
  const params = useLocalSearchParams();
  const { orderId } = params;
  const [order,setOrder] = useState({});
  const { language } = useLanguage();
  const isRTL = language === 'ar' || language === 'he';
  

  const fetchOrderData = async ()=>{
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
  }

  useEffect(() => {
    fetchOrderData();
  }, [language]);


  return (
    <ScrollView style={[
      styles.container, 
      { direction: isRTL ? 'rtl' : 'ltr' }
    ]}>
      {/* Order Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{translations[language].tabs.orders.track.orderTracking}</Text>
        <Text style={styles.orderNumber}>{translations[language].tabs.orders.track.order} #{orderId}</Text>
      </View>

      {/* Package Info */}
      <View style={styles.packageInfo}>
        <Feather name="package" size={40} color="#F8C332" />
        <Text style={styles.packageName}>{translations[language].tabs.orders.track.package}: {order?.orderItems ? order?.orderItems : translations[language].tabs.orders.track.unknown}</Text>
        <Text style={styles.packageDetails}>{translations[language].tabs.orders.track.quantity}: {order?.numberOfItems}</Text>
        <Text style={styles.packageDetails}>{translations[language].tabs.orders.track.weight}: {order?.orderWeight} kg</Text>
        {order.receivedItems && <Text style={styles.packageDetails}>{translations[language].tabs.orders.track.receivedItems}: {order?.receivedItems}</Text>} 
        {order.receivedQuantity && <Text style={styles.packageDetails}>{translations[language].tabs.orders.track.receivedQuantity}: {order?.receivedQuantity}</Text>}
      </View>

     {/* Delivery Status */}
     <View style={[styles.statusContainer]}>
        <Text style={[styles.statusTitle]}>
          {translations[language].tabs.orders.track.deliveryStatus}
        </Text>

        {/* Timeline */}
        <View style={[styles.timelineContainer, { paddingLeft: isRTL ? 0 : 30, paddingRight: isRTL ? 30 : 0 }]}>
          <View style={[styles.timelineLine, { left: isRTL ? undefined : 15, right: isRTL ? 15 : undefined }]}></View>
          {order.orderStatusHistory?.map((item, index) => (
            <View key={index} style={[styles.timelineItem, { flexDirection: isRTL ? 'row' : 'row' }]}>
              <View style={[styles.timelineCircle, index === order.orderStatusHistory.length - 1 && styles.timelineCircleLast]}>
                {/* <FontAwesome5 name={item.icon} size={20} color="white" /> */}
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
    backgroundColor: '#4CAF50',
    width: 25,
    height: 25,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineCircleLast: {
    backgroundColor: '#F8C332',
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
});

export default TrackingOrder;
