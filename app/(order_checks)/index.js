import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams } from 'expo-router';

const OrderChecks = () => {
  const params = useLocalSearchParams();
  const { orderId } = params;
  const [order, setOrder] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
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
    } catch (error) {
      console.error("Error fetching order data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Checks</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <ScrollView>
          {order.checks && order.checks.length > 0 ? (
            order.checks.map((check, index) => (
              <View key={index} style={styles.checkItem}>
                <View style={{flexDirection:"row",gap:7,marginBottom:7}}>
                  <Feather name="check-circle" size={20} color="green" />
                  <Text>Check {index + 1}</Text>
                </View>
                <Text style={styles.checkText}>Check Number: {check.number}</Text>
                <Text style={styles.checkText}>Check Value: {check.value}</Text>
                <Text style={styles.checkText}>Check Currency: {check.currency}</Text>
                <Text style={styles.checkText}>Check Date: {check.date?.slice(0,10)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No checks available.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  loader: {
    marginTop: 20,
  },
  checkItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  checkText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 10,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
    marginTop: 20,
  },
});

export default OrderChecks;
