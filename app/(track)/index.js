import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';

const TrackingOrder = ({order}) => {
  const statuses = [
    { status: 'Package Picked Up', time: '9:00 AM', icon: 'box' },
    { status: 'In Transit', time: '12:00 PM', icon: 'truck' },
    { status: 'Arrived at Hub', time: '2:30 PM', icon: 'warehouse' },
    { status: 'Out for Delivery', time: '4:00 PM', icon: 'truck-loading' },
    { status: 'Delivered', time: '6:00 PM', icon: 'home' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Order Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Order Tracking</Text>
        <Text style={styles.orderNumber}>Order #123456</Text>
      </View>

      {/* Package Info */}
      <View style={styles.packageInfo}>
        <Feather name="package" size={50} color="#F8C332" />
        <Text style={styles.packageName}>Package: {order.orderItems ? order.orderItems : "Unknown"}</Text>
        <Text style={styles.packageDetails}>Quantity: {order.quantity}</Text>
        <Text style={styles.packageDetails}>Weight: {order.weight} kg</Text>
      </View>

      {/* Delivery Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Delivery Status</Text>

        {/* Timeline */}
        <View style={styles.timelineContainer}>
          <View style={styles.timelineLine}></View>
          {statuses.map((item, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={[styles.timelineCircle, index === statuses.length - 1 && styles.timelineCircleLast]}>
                <FontAwesome5 name={item.icon} size={20} color="white" />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.timelineStatus}>{item.status}</Text>
                <Text style={styles.timelineTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Contact Support */}
      <View style={styles.supportContainer}>
        <Text style={styles.supportText}>Need help? Contact Support</Text>
        <TouchableOpacity>
          <Text style={styles.supportLink}>Contact Us</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#4CAF50',
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
    backgroundColor: '#00BFAE',
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
