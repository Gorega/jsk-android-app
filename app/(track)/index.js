import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Linking, StatusBar, Platform, Clipboard, Alert, Pressable } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from "../../RootLayout";
import { useLanguage } from '../../utils/languageContext';
import { translations } from '../../utils/languageContext';
import { useSocket } from '../../utils/socketContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import axios from 'axios';

const TrackingOrder = () => {
  const socket = useSocket();
  const { user: authUser } = useAuth();
  const params = useLocalSearchParams();
  const { orderId, public: publicMode } = params;
  const isPublic = !!publicMode;
  const [order, setOrder] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { language } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const isRTL = language === 'ar' || language === 'he';
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      await fetchOrderData();
    } catch (error) {
      console.error(' [track/index.js] onRefresh - Error:', error.message);
    } finally {
      setRefreshing(false);
    }
  }, [fetchOrderData]);

  const fetchOrderData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const formattedOrderId = String(orderId).trim();
      const baseStripped = formattedOrderId.replace(/-(B|R)$/i, '');
      const numericOnly = (formattedOrderId.match(/\d+/) || [formattedOrderId])[0];
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';

      const candidates = [
        baseStripped,
        numericOnly,
        formattedOrderId,
        formattedOrderId.endsWith('-B') ? formattedOrderId : `${formattedOrderId}-B`,
        formattedOrderId.endsWith('-R') ? formattedOrderId : `${formattedOrderId}-R`
      ].filter(Boolean).filter((v, idx, arr) => arr.indexOf(v) === idx);

      const commonOpts = {
        params: { language_code: language },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        withCredentials: true
      };
      const attempts = [];

      const tryFetch = async (endpointLabel, id) => {
        const endpoint = endpointLabel === 'public' 
          ? `/api/orders/${encodeURIComponent(id)}/public_info` 
          : `/api/orders/${encodeURIComponent(id)}`;
        const url = `${baseUrl}${endpoint}`;
        try {
          const res = await axios.get(url, commonOpts);
          attempts.push({ endpointLabel, id, url, status: res.status, ok: true });
          return res.data;
        } catch (e) {
          const status = e.response?.status;
          const msg = e.response?.data?.message || e.message || '';
          attempts.push({ endpointLabel, id, url, status, ok: false, msg });
          throw e;
        }
      };

      const sequence = [];
      if (publicMode) {
        candidates.forEach(id => sequence.push(['public', id]));
        candidates.forEach(id => sequence.push(['private', id]));
      } else {
        candidates.forEach(id => sequence.push(['private', id]));
        candidates.forEach(id => sequence.push(['public', id]));
      }

      let lastError = null;
      for (const [label, id] of sequence) {
        try {
          const data = await tryFetch(label, id);
          setOrder(data);
          lastError = null;
          break;
        } catch (e) {
          lastError = e;
          const status = e.response?.status;
          const msg = e.response?.data?.message || e.message || '';
          const recoverable = status === 404 || /not found/i.test(msg) || status === 401;
          if (!recoverable) {
            break;
          }
        }
      }

      if (lastError) {
        const errorMessage = lastError.response?.data?.message || lastError.message || 'Could not load order data';
        const isExpected = /not found/i.test(errorMessage) || /authorization token required/i.test(errorMessage);
        (isExpected ? console.warn : console.error)(' [track/index.js] fetchOrderData - Error:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Could not load order data';
      const isExpected = /not found/i.test(errorMessage) || /authorization token required/i.test(errorMessage);
      (isExpected ? console.warn : console.error)(' [track/index.js] fetchOrderData - Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [orderId, language, publicMode]);

  const getStatusInfo = (statusKey) => {
    const statusMap = {
      // Waiting/Processing states
      'waiting': { icon: 'clock', color: '#64748B', background: 'rgba(100, 116, 139, 0.1)', gradient: ['#64748B', '#475569'] },
      'in_branch': { icon: 'archive', color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', gradient: ['#3B82F6', '#2563EB'] },
      'in_progress': { icon: 'clock', color: '#8B5CF6', background: 'rgba(139, 92, 246, 0.1)', gradient: ['#8B5CF6', '#7C3AED'] },
      
      // Error/Rejection states
      'rejected': { icon: 'x-circle', color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', gradient: ['#EF4444', '#DC2626'] },
      'return_before_delivered_initiated': { icon: 'x-circle', color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', gradient: ['#EF4444', '#DC2626'] },
      'return_after_delivered_initiated': { icon: 'x-circle', color: '#F97316', background: 'rgba(249, 115, 22, 0.1)', gradient: ['#F97316', '#EA580C'] },
      
      // Warning states
      'stuck': { icon: 'alert-triangle', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', gradient: ['#F59E0B', '#D97706'] },
      'delayed': { icon: 'alert-triangle', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', gradient: ['#F59E0B', '#D97706'] },
      'reschedule': { icon: 'alert-triangle', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', gradient: ['#F59E0B', '#D97706'] },
      
      // Delivery states
      'on_the_way': { icon: 'truck', color: '#6366F1', background: 'rgba(99, 102, 241, 0.1)', gradient: ['#6366F1', '#4F46E5'] },
      
      // Return states
      'returned': { icon: 'corner-up-left', color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', gradient: ['#3B82F6', '#2563EB'] },
      'returned_in_branch': { icon: 'corner-up-left', color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', gradient: ['#3B82F6', '#2563EB'] },
      'returned_out': { icon: 'corner-up-left', color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', gradient: ['#3B82F6', '#2563EB'] },
      
      // Money states
      'money_in_branch': { icon: 'dollar-sign', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', gradient: ['#10B981', '#059669'] },
      'money_out': { icon: 'dollar-sign', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', gradient: ['#10B981', '#059669'] },
      'business_paid': { icon: 'dollar-sign', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', gradient: ['#10B981', '#059669'] },
      
      // Success states
      'business_returned_delivered': { icon: 'check-circle', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', gradient: ['#10B981', '#059669'] },
      'delivered': { icon: 'check-circle', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', gradient: ['#10B981', '#059669'] },
      'completed': { icon: 'check-circle', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', gradient: ['#10B981', '#059669'] },
      
      // Default
      'default': { icon: 'help-circle', color: '#64748B', background: 'rgba(100, 116, 139, 0.1)', gradient: ['#64748B', '#475569'] }
    };
    
    return statusMap[statusKey] || statusMap.default;
  };

  const handlePhoneCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleCopyToClipboard = async (text, label) => {
    if (text && text !== '-') {
      try {
        await Clipboard.setString(text);
        Alert.alert(
          translations[language].tabs.orders.track.copySuccess || 'Copied!',
          `${label} ${translations[language].tabs.orders.track.copiedToClipboard || 'copied to clipboard'}`,
          [{ text: translations[language].common.ok || 'OK' }]
        );
      } catch (error) {
        Alert.alert(
          translations[language].tabs.orders.track.copyError || 'Error',
          translations[language].tabs.orders.track.copyErrorMessage || 'Failed to copy to clipboard',
          [{ text: translations[language].common.ok || 'OK' }]
        );
      }
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderData();
    }
  }, [fetchOrderData, language, orderId]);

  if (isLoading) {
    return (
      <View style={[styles.overlay, { 
        backgroundColor: colorScheme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(31, 41, 55, 0.8)' 
      }]}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor={colorScheme === 'dark' ? '#000000' : colors.primary} 
        />
        <View style={[styles.spinnerContainer, { 
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
        }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.primary }]}>
            {translations[language].tabs.orders.track.loading || 'Loading order...'}
          </Text>
        </View>
      </View>
    );
  }
  
  // Show error state if there was a problem loading the order
  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={colorScheme === 'dark' ? "light-content" : "dark-content"} backgroundColor={colors.error} />
        <View style={[styles.errorContent, { backgroundColor: colors.card }]}>
          <View style={[styles.errorIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)' }]}>
            <Feather name="alert-circle" size={48} color={colors.error} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            {translations[language]?.tabs.orders.track.errorTitle || 'Oops!'}
          </Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
            {translations[language]?.tabs.orders.track.orderNotFound || 'Order not found or could not be loaded'}
          </Text>
          <Text style={[styles.errorDetail, { color: colors.textTertiary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.errorButtonGradient}
            >
              <Feather name="arrow-left" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.errorButtonText}>
                {translations[language]?.tabs.orders.track.goBack || 'Go Back'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.errorButton, { marginTop: 12 }]}
            onPress={onRefresh}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.errorButtonGradient}
            >
              <Feather name="refresh-cw" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.errorButtonText}>
                {translations[language]?.tabs.orders.track.tryAgain || 'Try Again'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(
      'en-US',
      { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    );
  };

  // Helper function to format currency values
  const formatCurrencyValue = (value, currency) => {
    // Check if value contains multiple currencies
    if (typeof value === 'string' && (value.includes('ILS:') || value.includes('JOD:') || value.includes('USD:'))) {
        // Split the string by '|' and create a wrapped display
        const currencies = value.split('|').map(item => item.trim());
        return (
            <View style={[styles.currencyContainer]}>
                {currencies.map((curr, idx) => (
                    <Text key={idx} style={[styles.currencyText, { color: colors.text }]}>{curr}</Text>
                ))}
            </View>
        );
    }
    
    // Regular display for simple values - Wrap in Text component
    return <Text style={[styles.costText, { color: colors.text }]}>{value} {currency}</Text>;
  };

  return (
    <>
      <StatusBar barStyle={colorScheme === 'dark' ? "light-content" : "dark-content"} backgroundColor={colors.primary} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero Header with Order Info */}
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#1E293B', '#0F172A'] : ['#4361EE', '#3730A3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroContainer}
        >
          <View style={styles.heroContent}>
            <View style={styles.orderBadge}>
              <Pressable onPress={() => Clipboard.setString(order.order_id.toString())}>
                <Text style={styles.orderIdLabel}>#{orderId}</Text>
              </Pressable>
            </View>
            <Text style={styles.heroTitle}>{translations[language].tabs.orders.track.orderTracking}</Text>
            
            {/* Current Status */}
            <LinearGradient
              colors={(getStatusInfo(order.status_key)?.gradient) || ['#64748B', '#475569']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.currentStatusBadge}
            >
              <Feather 
                name={(getStatusInfo(order.status_key)?.icon) || 'help-circle'} 
                size={18} 
                color="#ffffff" 
                style={{ marginRight: 8 }}
              />
              <Text style={styles.currentStatusText}>{order.status || '-'} {order.status_reason ? ` | ${order.status_reason}` : ''}</Text>
            </LinearGradient>
            
            {/* Edit Receiver Phone Button */}
            {(
              (!isPublic && ["driver", "delivery_company"].includes(authUser?.role) && 
               ["on_the_way", "reschedule", "rejected", "stuck", "delayed", "driver_responsibility"].includes(order.status_key)) ||
              (!isPublic && authUser?.role === "business" && 
               ["in_branch", "rejected", "stuck", "delayed", "on_the_way", "reschedule", 
                "dispatched_to_branch", "dispatched_to_driver"].includes(order.status_key))
            ) && (
              <TouchableOpacity 
                style={styles.editPhoneButton}
                onPress={() => {
                  router.push({
                    pathname: "(edit_receiver_phones)",
                    params: { orderId: order.order_id, editPhoneOnly: true }
                  });
                }}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.editPhoneButtonGradient}
                >
                  <Feather name="phone" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.editPhoneButtonText}>
                    {translations[language]?.tabs?.orders?.order?.editPhone || 'Edit Receiver Phone'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            {/* Edit Button */}
            {(
              (!isPublic && authUser?.role === "business" && order.status_key === "waiting") ||
              (!isPublic && !["driver", "delivery_company", "business"].includes(authUser?.role) && 
               ["waiting", "in_branch", "rejected", "stuck", "delayed", "on_the_way", 
                "reschedule", "dispatched_to_branch", "dispatched_to_driver", "delivered",
                "return_before_delivered_initiated", "return_after_delivered_initiated", 
                "business_returned_delivered", "received", "delivered/received"].includes(order.status_key))
            ) && (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => {
                  router.push({
                    pathname: "(create)",
                    params: { orderId: order.order_id }
                  });
                }}
              >
                <LinearGradient
                  colors={['#4361EE', '#3730A3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.editButtonGradient}
                >
                  <Feather name="edit" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.editButtonText}>
                    {translations[language]?.tabs?.orders?.order?.edit || 'Edit Order'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            {/* Order created info */}
            <View style={styles.heroInfoContainer}>
              {order.order_created_by ? (
                <View style={styles.heroInfoItem}>
                  <Feather name="user" size={14} color="#E0E7FF" style={styles.heroInfoIcon} />
                  <Text style={styles.heroInfoText}>
                    {order.order_created_by}
                  </Text>
                </View>
              ) : null}
              {order.created_at ? (
                <View style={styles.heroInfoItem}>
                  <Feather name="calendar" size={14} color="#E0E7FF" style={styles.heroInfoIcon} />
                  <Text style={styles.heroInfoText}>
                    {formatDate(order.created_at)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </LinearGradient>

        {/* Main Content */}
        <View style={styles.cardsContainer}>
          {/* Customer Info Card */}
          <View style={[styles.modernCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
            <LinearGradient 
              colors={colorScheme === 'dark' ? ['#3B82F6', '#2563EB'] : ['#4F46E5', '#4338CA']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cardHeader]}
            >
              <View style={[styles.cardIconContainer]}>
                <Ionicons name="person" size={22} color="#ffffff" />
              </View>
                  <Text style={[styles.cardHeaderText]}>
                {(translations[language].tabs.orders.track.receiverInfo) || 'Receiver Information'}
              </Text>
            </LinearGradient>
            
            <View style={styles.cardContent}>
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.labelContainer]}>
                  <Feather name="user" size={16} color={colors.primary} style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    {translations[language].tabs.orders.track.name}
                  </Text>
                </View>
                <View style={styles.infoValueContainer}>
                  <Text style={[styles.infoValue, { 
                    color: colors.text,
                    flex: 1,
                    ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    }),
                  }]}>
                    {order.receiver_name || '-'}
                  </Text>
                  {order.receiver_name && order.receiver_name !== '-' && (
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={() => handleCopyToClipboard(order.receiver_name, translations[language].tabs.orders.track.name)}
                    >
                      <Feather name="copy" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              {order.receiver_mobile ? (
                <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.labelContainer]}>
                    <Feather name="phone" size={16} color={colors.primary} style={styles.labelIcon} />
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      {translations[language].tabs.orders.track.mobile}
                    </Text>
                  </View>
                  <View style={styles.infoValueContainer}>
                    <TouchableOpacity 
                      style={[styles.phoneButton, { flex: 1 }]}
                      onPress={() => handlePhoneCall(order.receiver_mobile)}
                    >
                      <Text style={styles.phoneButtonText}>{order.receiver_mobile}</Text>
                      <Feather name="phone-call" size={14} color="#ffffff" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={() => handleCopyToClipboard(order.receiver_mobile, translations[language].tabs.orders.track.mobile)}
                    >
                      <Feather name="copy" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
              
              {order.receiver_second_mobile && (
                <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.labelContainer]}>
                    <Feather name="phone-forwarded" size={16} color={colors.primary} style={styles.labelIcon} />
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      {translations[language].tabs.orders.track.secondMobile}
                    </Text>
                  </View>
                  <View style={styles.infoValueContainer}>
                    <TouchableOpacity 
                      style={[styles.phoneButton, { flex: 1 }]}
                      onPress={() => handlePhoneCall(order.receiver_second_mobile)}
                    >
                      <Text style={styles.phoneButtonText}>{order.receiver_second_mobile}</Text>
                      <Feather name="phone-call" size={14} color="#ffffff" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={() => handleCopyToClipboard(order.receiver_second_mobile, translations[language].tabs.orders.track.secondMobile)}
                    >
                      <Feather name="copy" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.labelContainer]}>
                  <Feather name="map-pin" size={16} color={colors.primary} style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    {translations[language].tabs.orders.track.location}
                  </Text>
                </View>
                <View style={styles.infoValueContainer}>
                  <Text style={[styles.infoValue, { 
                    color: colors.text,
                    flex: 1,
                    ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    }),
                  }]}>
                    {order.receiver_city || '-'}{order.receiver_address ? `, ${order.receiver_address}` : ''}
                  </Text>
                  {(order.receiver_city || order.receiver_address) && (
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={() => handleCopyToClipboard(
                        `${order.receiver_city || ''}${order.receiver_address ? `, ${order.receiver_address}` : ''}`.trim().replace(/^,\s*/, ''),
                        translations[language].tabs.orders.track.location
                      )}
                    >
                      <Feather name="copy" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.labelContainer]}>
                  <Feather name="home" size={16} color={colors.primary} style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    {translations[language].tabs.orders.track.address}
                  </Text>
                </View>
                <View style={styles.infoValueContainer}>
                  <Text style={[styles.infoValue, { 
                    color: colors.text,
                    flex: 1,
                    ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    }),
                  }]}>
                    {order.receiver_address || '-'}
                  </Text>
                  {order.receiver_address && order.receiver_address !== '-' && (
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={() => handleCopyToClipboard(order.receiver_address, translations[language].tabs.orders.track.address)}
                    >
                      <Feather name="copy" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
          
          {/* Sender Info Card */}
          <View style={[styles.modernCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
            <LinearGradient 
              colors={colorScheme === 'dark' ? ['#8B5CF6', '#7C3AED'] : ['#8B5CF6', '#7C3AED']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cardHeader]}
            >
              <View style={[styles.cardIconContainer]}>
                <Ionicons name="business" size={22} color="#ffffff" />
              </View>
              <Text style={[styles.cardHeaderText]}>
                {translations[language].tabs.orders.track.senderInfo || 'Sender Information'}
              </Text>
            </LinearGradient>
            
            <View style={styles.cardContent}>
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.labelContainer]}>
                  <Feather name="briefcase" size={16} color="#7C3AED" style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    {translations[language].tabs.orders.track.name}
                  </Text>
                </View>
                <View style={styles.infoValueContainer}>
                  <Text style={[styles.infoValue, { 
                    color: colors.text,
                    flex: 1,
                    ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    }),
                  }]}>
                    {order.sender || order.sender_name || '-'}
                  </Text>
                  {order.sender && order.sender !== '-' && (
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={() => handleCopyToClipboard(order.sender, translations[language].tabs.orders.track.name)}
                    >
                      <Feather name="copy" size={16} color="#7C3AED" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              {order.sender_mobile ? (<View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.labelContainer]}>
                  <Feather name="phone" size={16} color="#7C3AED" style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    {translations[language].tabs.orders.track.mobile}
                  </Text>
                </View>
                <View style={styles.infoValueContainer}>
                  <TouchableOpacity 
                    style={[styles.phoneButton, { backgroundColor: '#7C3AED', flex: 1 }]}
                    onPress={() => handlePhoneCall(order.sender_mobile)}
                  >
                    <Text style={[styles.phoneButtonText]}>{order.sender_mobile}</Text>
                    <Feather name="phone-call" size={14} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => handleCopyToClipboard(order.sender_mobile, translations[language].tabs.orders.track.mobile)}
                  >
                    <Feather name="copy" size={16} color="#7C3AED" />
                  </TouchableOpacity>
                </View>
              </View>) : null}
              
              {order.sender_second_mobile && (
                <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.labelContainer]}>
                    <Feather name="phone-forwarded" size={16} color="#7C3AED" style={styles.labelIcon} />
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      {translations[language].tabs.orders.track.secondMobile}
                    </Text>
                  </View>
                  <View style={styles.infoValueContainer}>
                    <TouchableOpacity 
                      style={[styles.phoneButton, { backgroundColor: '#7C3AED', flex: 1 }]}
                      onPress={() => handlePhoneCall(order.sender_second_mobile)}
                    >
                      <Text style={[styles.phoneButtonText]}>{order.sender_second_mobile}</Text>
                      <Feather name="phone-call" size={14} color="#ffffff" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={() => handleCopyToClipboard(order.sender_second_mobile, translations[language].tabs.orders.track.secondMobile)}
                    >
                      <Feather name="copy" size={16} color="#7C3AED" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.labelContainer]}>
                  <Feather name="map-pin" size={16} color="#7C3AED" style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    {translations[language].tabs.orders.track.location}
                  </Text>
                </View>
                <View style={styles.infoValueContainer}>
                  <Text style={[styles.infoValue, { 
                    color: colors.text,
                    flex: 1,
                    ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    }),
                  }]}>
                    {order.sender_city || '-'}{order.sender_address ? `, ${order.sender_address}` : ''}
                  </Text>
                  {(order.sender_city || order.sender_address) && (
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={() => handleCopyToClipboard(
                        `${order.sender_city || ''}${order.sender_address ? `, ${order.sender_address}` : ''}`.trim().replace(/^,\s*/, ''),
                        translations[language].tabs.orders.track.location
                      )}
                    >
                      <Feather name="copy" size={16} color="#7C3AED" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
            </View>
          </View>

          {/* Order Details Card */}
          <View style={[styles.modernCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
            <LinearGradient 
              colors={['#F97316', '#EA580C']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cardHeader]}
            >
              <View style={[styles.cardIconContainer]}>
                <Feather name="info" size={22} color="#ffffff" />
              </View>
              <Text style={[styles.cardHeaderText]}>
                {translations[language].tabs.orders.track.orderDetails || 'Order Details'}
              </Text>
            </LinearGradient>
            
            <View style={styles.cardContent}>
              <View style={styles.detailsGrid}>
                <View style={[styles.detailsGridItem, { backgroundColor: colorScheme === 'dark' ? colors.cardAlt : '#F9FAFB' }]}>
                  <View style={[styles.detailsIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)' }]}>
                    <Feather name="package" size={18} color="#F97316" />
                  </View>
                  <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>
                    {translations[language].tabs.orders.track.orderType}
                  </Text>
                  <Text style={[styles.detailsValue, { color: colors.text }]}>{order.order_type || '-'}</Text>
                </View>
                
                {order.payment_type ? (
                  <View style={[styles.detailsGridItem, { backgroundColor: colorScheme === 'dark' ? colors.cardAlt : '#F9FAFB' }]}>
                    <View style={[styles.detailsIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)' }]}>
                      <Feather name="credit-card" size={18} color="#F97316" />
                    </View>
                    <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>
                      {translations[language].tabs.orders.track.paymentType}
                    </Text>
                    <Text style={[styles.detailsValue, { color: colors.text }]}>{order.payment_type}</Text>
                  </View>
                ) : null}
                
                {order.reference_id ? (
                  <View style={[styles.detailsGridItem, { backgroundColor: colorScheme === 'dark' ? colors.cardAlt : '#F9FAFB' }]}>
                    <View style={[styles.detailsIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)' }]}>
                      <Feather name="hash" size={18} color="#F97316" />
                    </View>
                    <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>
                      {translations[language].tabs.orders.track.referenceId}
                    </Text>
                    <Text style={[styles.detailsValue, { color: colors.text }]}>{order.reference_id}</Text>
                  </View>
                ) : <></>}
                
                {order.items_type ? (
                  <View style={[styles.detailsGridItem, { backgroundColor: colorScheme === 'dark' ? colors.cardAlt : '#F9FAFB' }]}>
                    <View style={[styles.detailsIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)' }]}>
                      <Feather name="box" size={18} color="#F97316" />
                    </View>
                    <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>
                      {translations[language].tabs.orders.track.itemType}
                    </Text>
                    <Text style={[styles.detailsValue, { color: colors.text }]}>{order.items_type}</Text>
                  </View>
                ) : null}
              </View>
              
              {!isPublic && order.driver ? (
                <View style={[styles.driverContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(249, 115, 22, 0.05)' }]}>
                  <View style={styles.driverHeader}>
                    <View style={[styles.driverIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)' }]}>
                      <Feather name="truck" size={18} color="#F97316" />
                    </View>
                    <Text style={[styles.driverHeaderText, { color: '#F97316' }]}>
                      {translations[language].tabs.orders.track.driver}
                    </Text>
                  </View>
                  
                  <View style={styles.driverContent}>
                    <Text style={[styles.driverName, { color: colors.text }]}>{order.driver}</Text>
                    {order.driver_mobile && (
                      <TouchableOpacity 
                        style={[styles.phoneButton, { backgroundColor: '#F97316' }]}
                        onPress={() => handlePhoneCall(order.driver_mobile)}
                      >
                        <Text style={styles.phoneButtonText}>{order.driver_mobile}</Text>
                        <Feather name="phone-call" size={14} color="#ffffff" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          {/* Financial Details Card */}
          {(!isPublic && (order.total_cod_value || order.delivery_fee || order.total_net_value || (order.checks && order.checks.length > 0))) ? (
          <View style={[styles.modernCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
            <LinearGradient 
              colors={['#10B981', '#059669']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cardHeader]}
            >
              <View style={[styles.cardIconContainer]}>
                <FontAwesome name="money" size={22} color="#ffffff" />
              </View>
              <Text style={[styles.cardHeaderText]}>
                {translations[language].tabs.orders.track.financialDetails || 'Financial Details'}
              </Text>
            </LinearGradient>
            
            <View style={styles.cardContent}>
              <View style={styles.financialSummary}>
                <View style={[styles.financialItem, { borderBottomColor: colors.border }]}>
                  <View style={[styles.financialIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)' }]}>
                    <Feather name="dollar-sign" size={18} color="#10B981" />
                  </View>
                  <Text style={[styles.financialLabel, {
                    color: colors.textSecondary,
                    ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    }),
                  }]}>
                    {translations[language].tabs.orders.track.codValue}
                  </Text>
                  <Text style={[styles.financialValue, { color: colors.text }]}>{order.total_cod_value}</Text>
                </View>
                
                {!["driver","delivery_company"].includes(authUser?.role) && (<View style={[styles.financialItem, { borderBottomColor: colors.border }]}>
                  <View style={[styles.financialIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)' }]}>
                    <Feather name="truck" size={18} color="#10B981" />
                  </View>
                  <Text style={[styles.financialLabel, {
                    color: colors.textSecondary,
                    ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    }),
                  }]}>
                    {translations[language].tabs.orders.track.deliveryFee}
                  </Text>
                  <Text style={[styles.financialValue, { color: colors.text }]}>{order.delivery_fee}</Text>
                </View>)}
                
                {!["driver","delivery_company"].includes(authUser?.role) && (<View style={[styles.financialItem, styles.highlightedFinancialItem, { backgroundColor: colorScheme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)' }]}>
                  <View style={[styles.financialIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.15)' }]}>
                    <Feather name="check-circle" size={18} color="#10B981" />
                  </View>
                  <Text style={[styles.financialLabelHighlight, {
                    ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    }),
                  }]}>
                    {translations[language].tabs.orders.track.netValue}
                  </Text>
                  <Text style={styles.financialValueHighlight}>{order.total_net_value}</Text>
                </View>)}
              </View>
              
              {/* Checks Section */}
              {order.checks && order.checks.length > 0 && (
                <View style={[styles.checksContainer]}>
                  <LinearGradient 
                    colors={colorScheme === 'dark' ? ['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.1)'] : ['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.05)']} 
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.checksHeader}
                  >
                    <Feather name="credit-card" size={18} color="#10B981" style={{ marginRight: 10 }} />
                    <Text style={[styles.checksHeaderText, { color: '#10B981' }]}>
                      {translations[language].tabs.orders.track.checks || 'Checks'}
                    </Text>
                  </LinearGradient>
                  
                  {order.checks.map((check, index) => (
                    <View key={index} style={[styles.checkItem, { backgroundColor: colorScheme === 'dark' ? colors.cardAlt : '#F9FAFB' }]}>
                      <View style={[styles.checkHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.checkNumberLabel, { color: colors.text }]}>
                          {translations[language].tabs.orders.track.checkNumber}: {check.number || '-'}
                        </Text>
                      </View>
                      
                      <View style={styles.checkDetails}>
                        <View style={[styles.checkDetailItem]}>
                          <Feather name="dollar-sign" size={14} color="#10B981" style={styles.checkDetailIcon} />
                          <Text style={[styles.checkDetailLabel, { color: colors.textSecondary }]}>
                            {translations[language].tabs.orders.track.checkValue}:
                          </Text>
                          <Text style={[styles.checkDetailValue, { color: colors.text }]}>
                            {formatCurrencyValue(check.value, check.currency)}
                          </Text>
                        </View>
                        
                        <View style={[styles.checkDetailItem]}>
                          <Feather name="calendar" size={14} color="#10B981" style={styles.checkDetailIcon} />
                          <Text style={[styles.checkDetailLabel, { color: colors.textSecondary }]}>
                            {translations[language].tabs.orders.track.checkDate}:
                          </Text>
                          <Text style={[styles.checkDetailValue, { color: colors.text }]}>
                            {formatDate(check.date)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
          ) : null}

          {/* Notes Section if applicable */}
          {!isPublic && order.note_content ? (
            <View style={[styles.modernCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
              <LinearGradient 
                colors={['#F59E0B', '#D97706']} 
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.cardHeader]}
              >
                <View style={[styles.cardIconContainer]}>
                  <Feather name="file-text" size={22} color="#ffffff" />
                </View>
                <Text style={[styles.cardHeaderText]}>
                  {translations[language].tabs.orders.track.notes || 'Notes'}
                </Text>
              </LinearGradient>
              
              <View style={styles.cardContent}>
                <View style={[styles.noteContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)' }]}>
                  <Feather name="message-square" size={20} color="#F59E0B" style={styles.noteIcon} />
                  <Text style={[styles.noteText, {
                    color: colors.text,
                    ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    }),
                  }]}>
                    {order.note_content}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Package Info Card */}
          {(!isPublic && (order?.order_items || order?.number_of_items || order?.order_weight || order?.received_items || order?.received_quantity)) ? (
          <View style={[styles.modernCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
            <LinearGradient 
              colors={colorScheme === 'dark' ? ['#3B82F6', '#2563EB'] : ['#4361EE', '#3730A3']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cardHeader]}
            >
              <View style={[styles.cardIconContainer]}>
                <Feather name="package" size={22} color="#ffffff" />
              </View>
              <Text style={[styles.cardHeaderText]}>
                {translations[language].tabs.orders.track.packageDetails || 'Package Details'}
              </Text>
            </LinearGradient>
            
            <View style={styles.cardContent}>
              <View style={[styles.packageWrapper]}>
                <View>
                  <View style={[styles.packageImagePlaceholder, { backgroundColor: colorScheme === 'dark' ? 'rgba(67, 97, 238, 0.2)' : 'rgba(67, 97, 238, 0.1)' }]}>
                    <Feather name="box" size={32} color="#4361EE" />
                  </View>
                </View>
                
                <View style={styles.packageInfo}>
                  <View style={[styles.packageInfoRow, { borderBottomColor: colors.border }]}>
                    <View style={[styles.packageLabelContainer]}>
                      <Feather name="box" size={16} color="#4361EE" style={styles.packageLabelIcon} />
                      <Text style={[styles.packageInfoLabel, { color: colors.textSecondary }]}>
                        {translations[language].tabs.orders.track.package}
                      </Text>
                    </View>
                    <Text style={[styles.packageInfoValue, {
                      color: colors.text,
                      ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : ""
                        }
                      }),
                    }]}>
                      {order?.order_items ? order?.order_items : translations[language].tabs.orders.track.unknown}
                    </Text>
                  </View>
                  
                  <View style={[styles.packageInfoRow, { borderBottomColor: colors.border }]}>
                    <View style={[styles.packageLabelContainer]}>
                      <Feather name="hash" size={16} color="#4361EE" style={styles.packageLabelIcon} />
                      <Text style={[styles.packageInfoLabel, { color: colors.textSecondary }]}>
                        {translations[language].tabs.orders.track.quantity}
                      </Text>
                    </View>
                    <Text style={[styles.packageInfoValue, {
                      color: colors.text,
                      ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : ""
                        }
                      }),
                    }]}>
                      {order?.number_of_items || 0}
                    </Text>
                  </View>
                  
                  <View style={[styles.packageInfoRow, { borderBottomColor: colors.border }]}>
                    <View style={[styles.packageLabelContainer]}>
                      <Feather name="anchor" size={16} color="#4361EE" style={styles.packageLabelIcon} />
                      <Text style={[styles.packageInfoLabel, { color: colors.textSecondary }]}>
                        {translations[language].tabs.orders.track.weight}
                      </Text>
                    </View>
                    <Text style={[styles.packageInfoValue, {
                      color: colors.text,
                      ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : ""
                        }
                      }),
                    }]}>
                      {order?.order_weight || 0} kg
                    </Text>
                  </View>
                  
                  {order.received_items ? (
                    <View style={[styles.packageInfoRow, { borderBottomColor: colors.border }]}>
                      <View style={styles.packageLabelContainer}>
                        <Feather name="check-square" size={16} color="#4361EE" style={styles.packageLabelIcon} />
                        <Text style={[styles.packageInfoLabel, { color: colors.textSecondary }]}>
                          {translations[language].tabs.orders.track.receivedItems}
                        </Text>
                      </View>
                      <Text style={[styles.packageInfoValue, {
                        color: colors.text,
                        ...Platform.select({
                          ios: {
                            textAlign: isRTL ? "left" : ""
                          }
                        }),
                      }]}>
                        {order?.received_items}
                      </Text>
                    </View>
                  ) : <></>}
                  
                  {order.received_quantity ? (
                    <View style={[styles.packageInfoRow, { borderBottomColor: colors.border }]}>
                      <View style={styles.packageLabelContainer}>
                        <Feather name="check-circle" size={16} color="#4361EE" style={styles.packageLabelIcon} />
                        <Text style={[styles.packageInfoLabel, { color: colors.textSecondary }]}>
                          {translations[language].tabs.orders.track.receivedQuantity}
                        </Text>
                      </View>
                      <Text style={[styles.packageInfoValue, {
                        color: colors.text,
                        ...Platform.select({
                          ios: {
                            textAlign: isRTL ? "left" : ""
                          }
                        }),
                      }]}>
                        {order?.received_quantity}
                      </Text>
                    </View>
                  ) : <></>}
                </View>
              </View>
            </View>
          </View>
          ) : null}

          {/* Delivery Status Timeline */}
          <View style={[styles.modernCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
            <LinearGradient 
              colors={['#6366F1', '#4F46E5']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cardHeader]}
            >
              <View style={[styles.cardIconContainer]}>
                <MaterialCommunityIcons name="timeline-clock" size={22} color="#ffffff" />
              </View>
              <Text style={[styles.cardHeaderText]}>
                {translations[language].tabs.orders.track.deliveryStatus}
              </Text>
            </LinearGradient>

            {/* Timeline */}
            <View style={[
              styles.timelineContainer,
              { backgroundColor: colors.card }
            ]}>
              <View style={[
                styles.timelineLine,
                { backgroundColor: colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)' }
              ]}></View>
              
              {order.order_status_history?.map((item, index) => {
                const statusInfo = getStatusInfo(item.status_key);
                const isLast = index === order.order_status_history.length - 1;
                const date = new Date(item.created_at);
                
                return (
                  <View 
                    key={index} 
                    style={[
                      styles.timelineItem, 
                      isLast && styles.lastTimelineItem
                    ]}
                  >
                    <LinearGradient
                      colors={statusInfo.gradient}
                      style={[
                        styles.timelineIconContainer
                      ]}
                    >
                      <Feather name={statusInfo.icon} size={20} color="#ffffff" />
                    </LinearGradient>
                    <View style={[styles.timelineContent, { backgroundColor: colorScheme === 'dark' ? colors.cardAlt : '#F9FAFB' }]}>
                      <Text style={[styles.timelineStatus, {
                        color: colors.text,
                        ...Platform.select({
                          ios: {
                            textAlign: isRTL ? "left" : ""
                          }
                        }),
                      }]}>
                        {item.new_status} {item?.status_reason ? ` | ${item?.status_reason}` : ''}
                        {item.note_content ? ` | ${item.note_content}` : ''}
                      </Text>
                      
                      <View style={[styles.timelineDetailsContainer]}>
                        <Feather name="map-pin" size={14} color="#6366F1" />
                        <Text style={[styles.timelineDetails, { color: colors.textSecondary }]}>
                          {item.branch}
                        </Text>
                      </View>
                      
                      <View style={[styles.timelineDateContainer]}>
                        <View style={styles.timelineDateItem}>
                          <Feather name="calendar" size={12} color={colors.textTertiary} />
                          <Text style={[styles.timelineDate, { color: colors.textTertiary }]}>
                            {date.toLocaleDateString(
                              'en-US',
                              { year: 'numeric', month: 'short', day: 'numeric' }
                            )}
                          </Text>
                        </View>
                        <View style={styles.timelineDateItem}>
                          <Feather name="clock" size={12} color={colors.textTertiary} />
                          <Text style={[styles.timelineDate, { color: colors.textTertiary }]}>
                            {date.toLocaleTimeString(
                              'en-US',
                              { hour: '2-digit', minute: '2-digit' }
                            )}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Support Section */}
          {!isPublic && authUser?.role === "business" && (
            <View style={[styles.modernCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
              <LinearGradient 
                colors={['#EF4444', '#DC2626']} 
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.cardHeader]}
              >
                <View style={[styles.cardIconContainer]}>
                  <Ionicons name="help-buoy" size={20} color="#ffffff" />
                </View>
                <Text style={[styles.cardHeaderText]}>
                  {translations[language]?.tabs.orders.track.needHelp || 'Need Help?'}
                </Text>
              </LinearGradient>
              
              <View style={styles.supportContent}>
                <View style={styles.supportTextContainer}>
                  <Feather name="alert-circle" size={24} color="#EF4444" style={styles.supportTextIcon} />
                  <Text style={[styles.supportText, {
                    color: colors.textSecondary,
                    ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    }),
                  }]}>
                    {translations[language].tabs.orders.track.issue}
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.supportButton}
                  onPress={() => router.push({
                    pathname: "/(complaints)/open_complaint",
                    params: { orderId: orderId }
                  })}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.supportButtonGradient}
                  >
                    <Feather name="message-circle" size={18} color="#ffffff" style={{ marginRight: 10 }} />
                    <Text style={[styles.supportButtonText, {
                      ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : ""
                        }
                      }),
                    }]}>
                      {translations[language].tabs.orders.track.openCase}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  cardsContainer: {
    padding: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  blurContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#4361EE',
  },
  
  // Hero Header Styles
  heroContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  orderBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
  },
  orderIdLabel: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
  currentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    marginTop: 12,
  },
  currentStatusText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#ffffff',
  },
  heroInfoContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  heroInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    gap:10
  },
  heroInfoText: {
    color: '#E0E7FF',
    fontSize: 14,
  },
  
  // Modern Card Styles
  modernCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap:10
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardContent: {
    padding: 20,
  },
  
  // Info Row Styles
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap:7
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1.5,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'space-between',
    flex: 1.5,
  },
  phoneButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.5,
    gap: 8,
  },
  copyButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  
  // Details Grid Styles
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  detailsGridItem: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  detailsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
  },
  detailsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  
  // Driver Section
  driverContainer: {
    backgroundColor: 'rgba(249, 115, 22, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10
  },
  driverIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  driverHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F97316',
  },
  driverContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10
  },
  driverName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1
  },
  
  // Financial Summary
  financialSummary: {
    marginBottom: 20,
  },
  financialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: 7
  },
  highlightedFinancialItem: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
    borderBottomWidth: 0,
  },
  financialIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  financialLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    flex: 1,
  },
  financialValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  financialLabelHighlight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    flex: 1,
  },
  financialValueHighlight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
  
  // Checks Section
  checksContainer: {
    marginTop: 10,
  },
  checksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
  },
  checksHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  checkItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  checkHeader: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  checkNumberLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  checkDetails: {
    paddingLeft: 6,
  },
  checkDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10
  },
  checkDetailLabel: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 8,
  },
  checkDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  
  // Note Styles
  noteContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 15
  },
  noteIcon: {
    marginTop: 2,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1F2937',
    flex: 1,
  },
  
  // Package Styles
  packageWrapper: {
    flexDirection: 'row',
    gap: 10
  },
  packageImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageInfo: {
    flex: 1,
  },
  packageInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  packageLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 7
  },
  packageInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  packageInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  // Timeline Styles
  timelineContainer: {
    position: 'relative',
    padding: 20,
  },
  timelineLine: {
    position: 'absolute',
    left: 30,
    top: 40,
    bottom: 40,
    width: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 30,
    position: 'relative',
    gap: 10
  },
  lastTimelineItem: {
    marginBottom: 0,
  },
  timelineIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
  },
  timelineStatus: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1F2937',
  },
  timelineDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10
  },
  timelineDetails: {
    fontSize: 14,
    color: '#64748B',
  },
  timelineDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10
  },
  timelineDateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  timelineDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  
  // Support Section
  supportContent: {
    padding: 20,
    alignItems: 'center',
  },
  supportTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  supportTextIcon: {
    marginRight: 12,
  },
  supportText: {
    fontSize: 15,
    color: '#64748B',
    flex: 1,
    lineHeight: 22,
  },
  supportButton: {
    width: '100%',
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  supportButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  
  // Error Styles
  errorContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  errorButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  errorButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  errorButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Currency display
  currencyContainer: {
    flexDirection: 'column',
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  costText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  // Edit Button Styles
  editButton: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#4361EE',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Edit Phone Button Styles
  editPhoneButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  editPhoneButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPhoneButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default TrackingOrder;