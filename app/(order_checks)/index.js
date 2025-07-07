import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, router } from 'expo-router';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { getToken } from "../../utils/secureStore";
import { useRTLStyles } from '../../utils/RTLWrapper';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';

const OrderChecks = () => {
  const params = useLocalSearchParams();
  const { orderId } = params;
  const [order, setOrder] = useState({});
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const rtl = useRTLStyles();
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      // const token = await getToken("userToken");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/${orderId}`, {
        method: "GET",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
          // "Cookie": token ? `token=${token}` : ""
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

  // Format currency
  const formatCurrency = (value, currency) => {
    return `${value} ${currency || ''}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.backButton,
            rtl.isRTL ? { right: 16 } : { left: 16 }
          ]}
          onPress={() => router.back()}
        >
          <Feather 
            name={rtl.isRTL ? "chevron-right" : "chevron-left"} 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: colors.text }]}>
          {translations[language]?.tabs.orders.order.orderChecks?.title || "Order Checks"}
        </Text>
        
        <View style={styles.orderIdContainer}>
          <Text style={[styles.orderId, { color: colors.textSecondary }]}>#{orderId}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {translations[language]?.tabs.orders.order.orderChecks?.loading || "Loading checks..."}
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {order.checks && order.checks.length > 0 ? (
            <>
              <View style={[styles.summaryCard, { backgroundColor: isDark ? colors.cardDark : "#EEF2FF" }]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.primary }]}>
                    {translations[language]?.tabs.orders.order.orderChecks?.totalChecks || "Total Checks"}:
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>{order.checks.length}</Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.primary }]}>
                    {translations[language]?.tabs.orders.order.orderChecks?.totalValue || "Total Value"}:
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {order.checks.reduce((sum, check) => sum + Number(check.value), 0)} 
                    {order.checks[0]?.currency}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {translations[language]?.tabs.orders.order.orderChecks?.checkDetails || "Check Details"}
              </Text>
              
              {order.checks.map((check, index) => (
                <View key={index} style={[styles.checkItem, { 
                  backgroundColor: colors.card,
                  shadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : "#64748B" 
                }]}>
                  <View style={[
                    styles.checkHeader,
                    { 
                      borderBottomColor: colors.border,
                      backgroundColor: isDark ? colors.cardDark : "#FAFAFA" 
                    }
                  ]}>
                    <View style={styles.checkNumberContainer}>
                      <Text style={styles.checkNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.checkTitle, { color: colors.text }]}>
                      {translations[language]?.tabs.orders.order.orderChecks?.check || "Check"} #{check.number}
                    </Text>
                    <View style={styles.checkStatusContainer}>
                      <Feather name="check-circle" size={16} color="#10B981" />
                    </View>
                  </View>
                  
                  <View style={styles.checkBody}>
                    <View style={styles.checkRow}>
                      <MaterialIcons 
                        name="attach-money" 
                        size={18} 
                        color={colors.primary}
                      />
                      <Text style={[styles.checkLabel, { color: colors.textSecondary }]}>
                        {translations[language]?.tabs.orders.order.orderChecks?.value || "Value"}:
                      </Text>
                      <Text style={[styles.checkValue, { color: colors.text }]}>
                        {formatCurrency(check.value, check.currency)}
                      </Text>
                    </View>
                    
                    <View style={styles.checkRow}>
                      <MaterialIcons 
                        name="date-range" 
                        size={18} 
                        color={colors.primary} 
                      />
                      <Text style={[styles.checkLabel, { color: colors.textSecondary }]}>
                        {translations[language]?.tabs.orders.order.orderChecks?.date || "Date"}:
                      </Text>
                      <Text style={[styles.checkValue, { color: colors.text }]}>
                        {check.date?.slice(0,10)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="assignment" size={60} color={isDark ? "#3F3F46" : "#E2E8F0"} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {translations[language]?.tabs.orders.order.orderChecks?.noChecks || "No Checks Found"}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {translations[language]?.tabs.orders.order.orderChecks?.noChecksMessage || "There are no checks associated with this order."}
              </Text>
              <TouchableOpacity 
                style={[styles.backToOrderButton, { backgroundColor: colors.primary }]}
                onPress={() => router.back()}
              >
                <Text style={styles.backToOrderText}>
                  {translations[language]?.tabs.orders.order.orderChecks?.backToOrder || "Back to Order"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop:40,
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    position: 'relative',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  orderIdContainer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap:10
  },
  orderIdLabel: {
    fontSize: 14,
    color: "#64748B"
  },
  orderId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748B",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4361EE",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  checkItem: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2.65,
    elevation: 2,
    overflow: 'hidden',
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap:10,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FAFAFA",
    gap:10
  },
  checkNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4361EE",
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkNumberText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  checkTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
  },
  checkStatusContainer: {
    marginLeft: 8,
  },
  checkBody: {
    padding: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap:10
  },
  checkLabel: {
    width: 70,
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  checkValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#334155",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#64748B",
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: '80%',
  },
  backToOrderButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#4361EE",
    borderRadius: 8,
  },
  backToOrderText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
});

export default OrderChecks;
