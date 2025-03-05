import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../_layout';

const TrackingOrder = ({}) => {
  const {user:authUser} = useAuth();
  const params = useLocalSearchParams();
  const { orderId } = params;
  const [order,setOrder] = useState({});

  const fetchOrderData = async ()=>{
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/${orderId}`, {
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
  }, []);


  return (
    <ScrollView style={styles.container}>
      {/* Order Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Order Tracking</Text>
        <Text style={styles.orderNumber}>Order #{orderId}</Text>
      </View>

      {/* Package Info */}
      <View style={styles.packageInfo}>
        <Feather name="package" size={40} color="#F8C332" />
        <Text style={styles.packageName}>Package: {order?.orderItems ? order?.orderItems : "Unknown"}</Text>
        <Text style={styles.packageDetails}>Quantity: {order?.numberOfItems}</Text>
        <Text style={styles.packageDetails}>Weight: {order?.orderWeight} kg</Text>
        {order.receivedItems && <Text style={styles.packageDetails}>Received Items: {order?.receivedItems}</Text>} 
        {order.receivedQuantity && <Text style={styles.packageDetails}>Received Quantity: {order?.receivedQuantity}</Text>}
      </View>

      {/* Delivery Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Delivery Status</Text>

        {/* Timeline */}
        <View style={styles.timelineContainer}>
          <View style={styles.timelineLine}></View>
          {order.orderStatusHistory?.map((item, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={[styles.timelineCircle, index === order.orderStatusHistory.length - 1 && styles.timelineCircleLast]}>
                {/* <FontAwesome5 name={item.icon} size={20} color="white" /> */}
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.timelineStatus}>{item.new_status}</Text>
                <Text style={styles.timelineTime}>Branch: {item.branch}</Text>
                <Text style={styles.timelineTime}>{item.created_at?.slice(0,10)}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {authUser.role === "business" &&
      <View style={styles.supportContainer}>
        <Text style={styles.supportText}>Have Issue? Apply a Complaint</Text>
        <TouchableOpacity onPress={()=> router.push({
            pathname:"/(complaints)/open_complaint",
            params:{orderId:orderId}
        })}>
          <Text style={styles.supportLink}>Open a complaint</Text>
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
    left: 15,
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
