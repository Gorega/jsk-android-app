import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, I18nManager, Linking, StatusBar, Platform } from 'react-native';
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
import { BlurView } from 'expo-blur';
import { getToken } from '../../utils/secureStore';

// Helper functions for RTL
const getTextAlign = (isRTL) => isRTL ? 'right' : 'left';
const getFlexDirection = (isRTL) => isRTL ? 'row-reverse' : 'row';
const getMargin = (isRTL, size = 15) => isRTL ? { marginRight: 0, marginLeft: size } : { marginLeft: 0, marginRight: size };

const TrackingOrder = () => {
  const socket = useSocket();
  const { user: authUser } = useAuth();
  const params = useLocalSearchParams();
  const { orderId } = params;
  const [order, setOrder] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { language } = useLanguage();
  const isRTL = language === 'ar' || language === 'he';
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      await fetchOrderData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const fetchOrderData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken("userToken");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/${orderId}?language_code=${language}`, {
        method: "GET",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
          "Cookie": token ? `token=${token}` : ""
        }
      });
      
      if (!res.ok) {
        // Handle server errors with proper error message
        const errorText = await res.text();
        throw new Error(errorText || `Error ${res.status}: Order could not be loaded`);
      }
      
      const text = await res.text();
      try {
        // Try to parse the JSON response
        const data = JSON.parse(text);
        setOrder(data);
      } catch (parseError) {
        // If JSON parsing fails, throw a more specific error
        throw new Error(`Invalid response format: ${parseError.message}`);
      }
    } catch (error) {
      console.error('Error fetching order data:', error);
      setError(error.message || 'Could not load order data');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, language]);

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

  const handleOrderUpdate = useCallback((notification) => {
    switch (notification.type) {
      case 'ORDER_UPDATED':
      case 'COLLECTION_CREATED':
      case 'COLLECTION_UPDATED':
      case 'COLLECTION_DELETED':
      case 'STATUS_UPDATED':
        fetchOrderData();
        break;
      default:
        break;
    }
  }, [fetchOrderData]);

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData, language]);

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
        <StatusBar barStyle="light-content" backgroundColor="#4361EE" />
        <BlurView intensity={80} style={styles.blurContainer}>
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color="#4361EE" />
            <Text style={styles.loadingText}>
              {translations[language].tabs.orders.track.loading || 'Loading order...'}
            </Text>
          </View>
        </BlurView>
      </View>
    );
  }
  
  // Show error state if there was a problem loading the order
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#EF4444" />
        <View style={styles.errorContent}>
          <View style={styles.errorIconContainer}>
            <Feather name="alert-circle" size={48} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>
            {translations[language]?.tabs.orders.track.errorTitle || 'Oops!'}
          </Text>
          <Text style={styles.errorMessage}>
            {translations[language]?.tabs.orders.track.orderNotFound || 'Order not found or could not be loaded'}
          </Text>
          <Text style={styles.errorDetail}>
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
      isRTL ? (language === 'he' ? 'he-IL' : 'ar-SA') : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#4361EE" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4361EE"]}
            tintColor="#4361EE"
          />
        }
      >
        {/* Hero Header with Order Info */}
        <LinearGradient
          colors={['#4361EE', '#3730A3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroContainer}
        >
          <View style={styles.heroContent}>
            <View style={styles.orderBadge}>
              <Text style={styles.orderIdLabel}>#{orderId}</Text>
            </View>
            <Text style={styles.heroTitle}>{translations[language].tabs.orders.track.orderTracking}</Text>
            
            {/* Current Status */}
            <LinearGradient
              colors={getStatusInfo(order.status_key)?.gradient || ['#64748B', '#475569']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.currentStatusBadge}
            >
              <Feather 
                name={getStatusInfo(order.status_key)?.icon || 'help-circle'} 
                size={18} 
                color="#ffffff" 
                style={{ marginRight: 8 }}
              />
              <Text style={styles.currentStatusText}>{order.status} {order.status_reason ? ` | ${order.status_reason}` : ''}</Text>
            </LinearGradient>
            
            {/* Order created info */}
            <View style={styles.heroInfoContainer}>
              <View style={styles.heroInfoItem}>
                <Feather name="user" size={14} color="#E0E7FF" style={styles.heroInfoIcon} />
                <Text style={styles.heroInfoText}>
                  {order.order_created_by}
                </Text>
              </View>
              <View style={styles.heroInfoItem}>
                <Feather name="calendar" size={14} color="#E0E7FF" style={styles.heroInfoIcon} />
                <Text style={styles.heroInfoText}>
                  {formatDate(order.created_at)}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Main Content */}
        <View style={styles.cardsContainer}>
          {/* Customer Info Card */}
          <View style={styles.modernCard}>
            <LinearGradient 
              colors={['#4F46E5', '#4338CA']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cardHeader, { flexDirection: getFlexDirection(isRTL) }]}
            >
              <View style={[styles.cardIconContainer, getMargin(isRTL)]}>
                <Ionicons name="person" size={22} color="#ffffff" />
              </View>
              <Text style={[styles.cardHeaderText, { textAlign: getTextAlign(isRTL) }]}>
                {translations[language].tabs.orders.track.receiverInfo || 'Receiver Information'}
              </Text>
            </LinearGradient>
            
            <View style={styles.cardContent}>
              <View style={[styles.infoRow, { flexDirection: getFlexDirection(isRTL) }]}>
                <View style={[styles.labelContainer, { flexDirection: getFlexDirection(isRTL) }]}>
                  <Feather name="user" size={16} color="#4F46E5" style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { textAlign: getTextAlign(isRTL) }]}>
                    {translations[language].tabs.orders.track.name}
                  </Text>
                </View>
                <Text style={[styles.infoValue, { textAlign: getTextAlign(isRTL) }]}>
                  {order.receiver_name || '-'}
                </Text>
              </View>
              
              <View style={[styles.infoRow, { flexDirection: getFlexDirection(isRTL) }]}>
                <View style={[styles.labelContainer,{ flexDirection: getFlexDirection(isRTL) }]}>
                  <Feather name="phone" size={16} color="#4F46E5" style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { textAlign: getTextAlign(isRTL) }]}>
                    {translations[language].tabs.orders.track.mobile}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.phoneButton,{ flexDirection: getFlexDirection(isRTL) }]}
                  onPress={() => handlePhoneCall(order.receiver_mobile)}
                >
                  <Text style={styles.phoneButtonText}>{order.receiver_mobile || '-'}</Text>
                  <Feather name="phone-call" size={14} color="#ffffff" />
                </TouchableOpacity>
              </View>
              
              {order.receiver_second_mobile && (
                <View style={[styles.infoRow, { flexDirection: getFlexDirection(isRTL) }]}>
                  <View style={[styles.labelContainer,{ flexDirection: getFlexDirection(isRTL) }]}>
                    <Feather name="phone-forwarded" size={16} color="#4F46E5" style={styles.labelIcon} />
                    <Text style={[styles.infoLabel, { textAlign: getTextAlign(isRTL) }]}>
                      {translations[language].tabs.orders.track.secondMobile}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.phoneButton,{ flexDirection: getFlexDirection(isRTL) }]}
                    onPress={() => handlePhoneCall(order.receiver_second_mobile)}
                  >
                    <Text style={styles.phoneButtonText}>{order.receiver_second_mobile}</Text>
                    <Feather name="phone-call" size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={[styles.infoRow, { flexDirection: getFlexDirection(isRTL) }]}>
                <View style={[styles.labelContainer,{ flexDirection: getFlexDirection(isRTL) }]}>
                  <Feather name="map-pin" size={16} color="#4F46E5" style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { textAlign: getTextAlign(isRTL) }]}>
                    {translations[language].tabs.orders.track.location}
                  </Text>
                </View>
                <Text style={[styles.infoValue, { textAlign: getTextAlign(isRTL) }]}>
                  {order.receiver_city || '-'}{order.receiver_area ? `, ${order.receiver_area}` : ''}
                </Text>
              </View>
              
              <View style={[styles.infoRow, { flexDirection: getFlexDirection(isRTL) }]}>
                <View style={[styles.labelContainer,{ flexDirection: getFlexDirection(isRTL) }]}>
                  <Feather name="home" size={16} color="#4F46E5" style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { textAlign: getTextAlign(isRTL) }]}>
                    {translations[language].tabs.orders.track.address}
                  </Text>
                </View>
                <Text style={[styles.infoValue, { textAlign: getTextAlign(isRTL) }]}>
                  {order.receiver_address || '-'}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Sender Info Card */}
          <View style={styles.modernCard}>
            <LinearGradient 
              colors={['#8B5CF6', '#7C3AED']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cardHeader, { flexDirection: getFlexDirection(isRTL) }]}
            >
              <View style={[styles.cardIconContainer, getMargin(isRTL)]}>
                <Ionicons name="business" size={22} color="#ffffff" />
              </View>
              <Text style={[styles.cardHeaderText, { textAlign: getTextAlign(isRTL) }]}>
                {translations[language].tabs.orders.track.senderInfo || 'Sender Information'}
              </Text>
            </LinearGradient>
            
            <View style={styles.cardContent}>
              <View style={[styles.infoRow, { flexDirection: getFlexDirection(isRTL) }]}>
                <View style={[styles.labelContainer,{ flexDirection: getFlexDirection(isRTL) }]}>
                  <Feather name="briefcase" size={16} color="#7C3AED" style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { textAlign: getTextAlign(isRTL) }]}>
                    {translations[language].tabs.orders.track.name}
                  </Text>
                </View>
                <Text style={[styles.infoValue, { textAlign: getTextAlign(isRTL) }]}>
                  {order.sender || '-'}
                </Text>
              </View>
              
              <View style={[styles.infoRow, { flexDirection: getFlexDirection(isRTL) }]}>
                <View style={[styles.labelContainer,{ flexDirection: getFlexDirection(isRTL) }]}>
                  <Feather name="phone" size={16} color="#7C3AED" style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { textAlign: getTextAlign(isRTL) }]}>
                    {translations[language].tabs.orders.track.mobile}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.phoneButton, { backgroundColor: '#7C3AED' },{ flexDirection: getFlexDirection(isRTL) }]}
                  onPress={() => handlePhoneCall(order.sender_mobile)}
                >
                  <Text style={[styles.phoneButtonText,{ flexDirection: getFlexDirection(isRTL) }]}>{order.sender_mobile || '-'}</Text>
                  <Feather name="phone-call" size={14} color="#ffffff" />
                </TouchableOpacity>
              </View>
              
              {order.sender_second_mobile && (
                <View style={[styles.infoRow, { flexDirection: getFlexDirection(isRTL) }]}>
                  <View style={[styles.labelContainer,{ flexDirection: getFlexDirection(isRTL) }]}>
                    <Feather name="phone-forwarded" size={16} color="#7C3AED" style={styles.labelIcon} />
                    <Text style={[styles.infoLabel, { textAlign: getTextAlign(isRTL) }]}>
                      {translations[language].tabs.orders.track.secondMobile}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.phoneButton, { backgroundColor: '#7C3AED' },{ flexDirection: getFlexDirection(isRTL) }]}
                    onPress={() => handlePhoneCall(order.sender_second_mobile)}
                  >
                    <Text style={[styles.phoneButtonText,{ flexDirection: getFlexDirection(isRTL) }]}>{order.sender_second_mobile}</Text>
                    <Feather name="phone-call" size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={[styles.infoRow, { flexDirection: getFlexDirection(isRTL) }]}>
                <View style={[styles.labelContainer,{ flexDirection: getFlexDirection(isRTL) }]}>
                  <Feather name="map-pin" size={16} color="#7C3AED" style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { textAlign: getTextAlign(isRTL) }]}>
                    {translations[language].tabs.orders.track.location}
                  </Text>
                </View>
                <Text style={[styles.infoValue, { textAlign: getTextAlign(isRTL) }]}>
                  {order.sender_city || '-'}{order.sender_area ? `, ${order.sender_area}` : ''}
                </Text>
              </View>
              
              <View style={[styles.infoRow, { flexDirection: getFlexDirection(isRTL) }]}>
                <View style={[styles.labelContainer,{ flexDirection: getFlexDirection(isRTL) }]}>
                  <Feather name="map" size={16} color="#7C3AED" style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { textAlign: getTextAlign(isRTL) }]}>
                    {translations[language].tabs.orders.track.branch}
                  </Text>
                </View>
                <Text style={[styles.infoValue, { textAlign: getTextAlign(isRTL) }]}>
                  {order.sender_branch || '-'}
                </Text>
              </View>
            </View>
          </View>

          {/* Order Details Card */}
          <View style={styles.modernCard}>
            <LinearGradient 
              colors={['#F97316', '#EA580C']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cardHeader, { flexDirection: getFlexDirection(isRTL) }]}
            >
              <View style={[styles.cardIconContainer, getMargin(isRTL)]}>
                <Feather name="info" size={22} color="#ffffff" />
              </View>
              <Text style={[styles.cardHeaderText, { textAlign: getTextAlign(isRTL) }]}>
                {translations[language].tabs.orders.track.orderDetails || 'Order Details'}
              </Text>
            </LinearGradient>
            
            <View style={styles.cardContent}>
              <View style={styles.detailsGrid}>
                <View style={[styles.detailsGridItem]}>
                  <View style={[styles.detailsIconContainer, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                    <Feather name="package" size={18} color="#F97316" />
                  </View>
                  <Text style={[styles.detailsLabel]}>
                    {translations[language].tabs.orders.track.orderType}
                  </Text>
                  <Text style={styles.detailsValue}>{order.order_type || '-'}</Text>
                </View>
                
                <View style={styles.detailsGridItem}>
                  <View style={[styles.detailsIconContainer, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                    <Feather name="credit-card" size={18} color="#F97316" />
                  </View>
                  <Text style={styles.detailsLabel}>
                    {translations[language].tabs.orders.track.paymentType}
                  </Text>
                  <Text style={styles.detailsValue}>{order.payment_type || '-'}</Text>
                </View>
                
                {order.reference_id && (
                  <View style={styles.detailsGridItem}>
                    <View style={[styles.detailsIconContainer, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                      <Feather name="hash" size={18} color="#F97316" />
                    </View>
                    <Text style={styles.detailsLabel}>
                      {translations[language].tabs.orders.track.referenceId}
                    </Text>
                    <Text style={styles.detailsValue}>{order.reference_id}</Text>
                  </View>
                )}
                
                <View style={styles.detailsGridItem}>
                  <View style={[styles.detailsIconContainer, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                    <Feather name="box" size={18} color="#F97316" />
                  </View>
                  <Text style={styles.detailsLabel}>
                    {translations[language].tabs.orders.track.itemType}
                  </Text>
                  <Text style={styles.detailsValue}>{order.items_type || '-'}</Text>
                </View>
              </View>
              
              {order.driver && (
                <View style={styles.driverContainer}>
                  <View style={styles.driverHeader}>
                    <View style={[styles.driverIconContainer,{ flexDirection: getFlexDirection(isRTL) }]}>
                      <Feather name="truck" size={18} color="#F97316" />
                    </View>
                    <Text style={styles.driverHeaderText}>
                      {translations[language].tabs.orders.track.driver}
                    </Text>
                  </View>
                  
                  <View style={styles.driverContent}>
                    <Text style={styles.driverName}>{order.driver}</Text>
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
              )}
            </View>
          </View>

          {/* Financial Details Card */}
          <View style={styles.modernCard}>
            <LinearGradient 
              colors={['#10B981', '#059669']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cardHeader, { flexDirection: getFlexDirection(isRTL) }]}
            >
              <View style={[styles.cardIconContainer, getMargin(isRTL)]}>
                <FontAwesome name="money" size={22} color="#ffffff" />
              </View>
              <Text style={[styles.cardHeaderText, { textAlign: getTextAlign(isRTL) }]}>
                {translations[language].tabs.orders.track.financialDetails || 'Financial Details'}
              </Text>
            </LinearGradient>
            
            <View style={styles.cardContent}>
              <View style={styles.financialSummary}>
                <View style={[styles.financialItem,{ flexDirection: getFlexDirection(isRTL) }]}>
                  <View style={[styles.financialIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <Feather name="dollar-sign" size={18} color="#10B981" />
                  </View>
                  <Text style={[styles.financialLabel,{ textAlign: getTextAlign(isRTL) }]}>
                    {translations[language].tabs.orders.track.codValue}
                  </Text>
                  <Text style={styles.financialValue}>{order.total_cod_value || '0'}</Text>
                </View>
                
                <View style={[styles.financialItem,{ flexDirection: getFlexDirection(isRTL) }]}>
                  <View style={[styles.financialIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <Feather name="truck" size={18} color="#10B981" />
                  </View>
                  <Text style={[styles.financialLabel,{ textAlign: getTextAlign(isRTL) }]}>
                    {translations[language].tabs.orders.track.deliveryFee}
                  </Text>
                  <Text style={styles.financialValue}>{order.delivery_fee || '0'}</Text>
                </View>
                
                <View style={[styles.financialItem, styles.highlightedFinancialItem,{ flexDirection: getFlexDirection(isRTL) }]}>
                  <View style={[styles.financialIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Feather name="check-circle" size={18} color="#10B981" />
                  </View>
                  <Text style={[styles.financialLabelHighlight,{ textAlign: getTextAlign(isRTL) }]}>
                    {translations[language].tabs.orders.track.netValue}
                  </Text>
                  <Text style={styles.financialValueHighlight}>{order.total_net_value || '0'}</Text>
                </View>
              </View>
              
              {/* Checks Section */}
              {order.checks && order.checks.length > 0 && (
                <View style={[styles.checksContainer,{ flexDirection: getFlexDirection(isRTL) }]}>
                  <LinearGradient 
                    colors={['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.05)']} 
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.checksHeader}
                  >
                    <Feather name="credit-card" size={18} color="#10B981" style={{ marginRight: 10 }} />
                    <Text style={styles.checksHeaderText}>
                      {translations[language].tabs.orders.track.checks || 'Checks'}
                    </Text>
                  </LinearGradient>
                  
                  {order.checks.map((check, index) => (
                    <View key={index} style={[styles.checkItem]}>
                      <View style={[styles.checkHeader,{ flexDirection: getFlexDirection(isRTL) }]}>
                        <Text style={styles.checkNumberLabel}>
                          {translations[language].tabs.orders.track.checkNumber}: {check.number || '-'}
                        </Text>
                      </View>
                      
                      <View style={styles.checkDetails}>
                        <View style={[styles.checkDetailItem,{ flexDirection: getFlexDirection(isRTL) }]}>
                          <Feather name="dollar-sign" size={14} color="#10B981" style={styles.checkDetailIcon} />
                          <Text style={styles.checkDetailLabel}>
                            {translations[language].tabs.orders.track.checkValue}:
                          </Text>
                          <Text style={styles.checkDetailValue}>
                            {check.value} {check.currency}
                          </Text>
                        </View>
                        
                        <View style={[styles.checkDetailItem,{ flexDirection: getFlexDirection(isRTL) }]}>
                          <Feather name="calendar" size={14} color="#10B981" style={styles.checkDetailIcon} />
                          <Text style={styles.checkDetailLabel}>
                            {translations[language].tabs.orders.track.checkDate}:
                          </Text>
                          <Text style={styles.checkDetailValue}>
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

          {/* Notes Section if applicable */}
          {order.note_content && (
            <View style={styles.modernCard}>
              <LinearGradient 
                colors={['#F59E0B', '#D97706']} 
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.cardHeader, { flexDirection: getFlexDirection(isRTL) }]}
              >
                <View style={[styles.cardIconContainer, getMargin(isRTL)]}>
                  <Feather name="file-text" size={22} color="#ffffff" />
                </View>
                <Text style={[styles.cardHeaderText, { textAlign: getTextAlign(isRTL) }]}>
                  {translations[language].tabs.orders.track.notes || 'Notes'}
                </Text>
              </LinearGradient>
              
              <View style={styles.cardContent}>
                <View style={[styles.noteContainer,{ flexDirection: getFlexDirection(isRTL) }]}>
                  <Feather name="message-square" size={20} color="#F59E0B" style={styles.noteIcon} />
                  <Text style={[styles.noteText, { textAlign: getTextAlign(isRTL) }]}>
                    {order.note_content}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Package Info Card */}
          <View style={styles.modernCard}>
            <LinearGradient 
              colors={['#4361EE', '#3730A3']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cardHeader, { flexDirection: getFlexDirection(isRTL) }]}
            >
              <View style={[styles.cardIconContainer, getMargin(isRTL)]}>
                <Feather name="package" size={22} color="#ffffff" />
              </View>
              <Text style={[styles.cardHeaderText, { textAlign: getTextAlign(isRTL) }]}>
                {translations[language].tabs.orders.track.packageDetails || 'Package Details'}
              </Text>
            </LinearGradient>
            
            <View style={styles.cardContent}>
              <View style={[styles.packageWrapper,{ flexDirection: getFlexDirection(isRTL) }]}>
                <View style={styles.packageImageContainer}>
                  <View style={styles.packageImagePlaceholder}>
                    <Feather name="box" size={32} color="#4361EE" />
                  </View>
                </View>
                
                <View style={styles.packageInfo}>
                  <View style={[styles.packageInfoRow, { flexDirection: getFlexDirection(isRTL) }]}>
                    <View style={[styles.packageLabelContainer,{ flexDirection: getFlexDirection(isRTL) }]}>
                      <Feather name="box" size={16} color="#4361EE" style={styles.packageLabelIcon} />
                      <Text style={[styles.packageInfoLabel, { textAlign: getTextAlign(isRTL) }]}>
                        {translations[language].tabs.orders.track.package}
                      </Text>
                    </View>
                    <Text style={[styles.packageInfoValue, { textAlign: getTextAlign(isRTL) }]}>
                      {order?.order_items ? order?.order_items : translations[language].tabs.orders.track.unknown}
                    </Text>
                  </View>
                  
                  <View style={[styles.packageInfoRow, { flexDirection: getFlexDirection(isRTL) }]}>
                    <View style={[styles.packageLabelContainer,{ flexDirection: getFlexDirection(isRTL) }]}>
                      <Feather name="hash" size={16} color="#4361EE" style={styles.packageLabelIcon} />
                      <Text style={[styles.packageInfoLabel, { textAlign: getTextAlign(isRTL) }]}>
                        {translations[language].tabs.orders.track.quantity}
                      </Text>
                    </View>
                    <Text style={[styles.packageInfoValue, { textAlign: getTextAlign(isRTL) }]}>
                      {order?.number_of_items || 0}
                    </Text>
                  </View>
                  
                  <View style={[styles.packageInfoRow, { flexDirection: getFlexDirection(isRTL) }]}>
                    <View style={[styles.packageLabelContainer,{ flexDirection: getFlexDirection(isRTL) }]}>
                      <Feather name="anchor" size={16} color="#4361EE" style={styles.packageLabelIcon} />
                      <Text style={[styles.packageInfoLabel, { textAlign: getTextAlign(isRTL) }]}>
                        {translations[language].tabs.orders.track.weight}
                      </Text>
                    </View>
                    <Text style={[styles.packageInfoValue, { textAlign: getTextAlign(isRTL) }]}>
                      {order?.order_weight || 0} kg
                    </Text>
                  </View>
                  
                  {order.received_items && (
                    <View style={[styles.packageInfoRow, { flexDirection: getFlexDirection(isRTL) }]}>
                      <View style={styles.packageLabelContainer}>
                        <Feather name="check-square" size={16} color="#4361EE" style={styles.packageLabelIcon} />
                        <Text style={[styles.packageInfoLabel, { textAlign: getTextAlign(isRTL) }]}>
                          {translations[language].tabs.orders.track.receivedItems}
                        </Text>
                      </View>
                      <Text style={[styles.packageInfoValue, { textAlign: getTextAlign(isRTL) }]}>
                        {order?.received_items}
                      </Text>
                    </View>
                  )}
                  
                  {order.received_quantity && (
                    <View style={[styles.packageInfoRow, { flexDirection: getFlexDirection(isRTL) }]}>
                      <View style={styles.packageLabelContainer}>
                        <Feather name="check-circle" size={16} color="#4361EE" style={styles.packageLabelIcon} />
                        <Text style={[styles.packageInfoLabel, { textAlign: getTextAlign(isRTL) }]}>
                          {translations[language].tabs.orders.track.receivedQuantity}
                        </Text>
                      </View>
                      <Text style={[styles.packageInfoValue, { textAlign: getTextAlign(isRTL) }]}>
                        {order?.received_quantity}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Delivery Status Timeline */}
          <View style={styles.modernCard}>
            <LinearGradient 
              colors={['#6366F1', '#4F46E5']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cardHeader, { flexDirection: getFlexDirection(isRTL) }]}
            >
              <View style={[styles.cardIconContainer, getMargin(isRTL)]}>
                <MaterialCommunityIcons name="timeline-clock" size={22} color="#ffffff" />
              </View>
              <Text style={[styles.cardHeaderText, { textAlign: getTextAlign(isRTL) }]}>
                {translations[language].tabs.orders.track.deliveryStatus}
              </Text>
            </LinearGradient>

            {/* Timeline */}
            <View style={[
              styles.timelineContainer, 
              isRTL ? { paddingRight: 20, paddingLeft: 10 } : { paddingLeft: 20, paddingRight: 10 }
            ]}>
              <View style={[
                styles.timelineLine, 
                isRTL ? { right: 30 } : { left: 30 }
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
                      { flexDirection: getFlexDirection(isRTL) },
                      isLast && styles.lastTimelineItem
                    ]}
                  >
                    <LinearGradient
                      colors={statusInfo.gradient}
                      style={[
                        styles.timelineIconContainer,
                        getMargin(isRTL, 15)
                      ]}
                    >
                      <Feather name={statusInfo.icon} size={20} color="#ffffff" />
                    </LinearGradient>
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineStatus, { textAlign: getTextAlign(isRTL) }]}>
                        {item.new_status} {item?.status_reason ? ` | ${item?.status_reason}` : ''}
                      </Text>
                      
                      <View style={[styles.timelineDetailsContainer,{ flexDirection: getFlexDirection(isRTL) }]}>
                        <Feather name="map-pin" size={14} color="#6366F1" style={styles.timelineDetailIcon} />
                        <Text style={[styles.timelineDetails, { textAlign: getTextAlign(isRTL) }]}>
                          {item.branch}
                        </Text>
                      </View>
                      
                      <View style={[styles.timelineDateContainer,{ flexDirection: getFlexDirection(isRTL) }]}>
                        <View style={styles.timelineDateItem}>
                          <Feather name="calendar" size={12} color="#94A3B8" style={styles.timelineDateIcon} />
                          <Text style={[styles.timelineDate, { textAlign: getTextAlign(isRTL) }]}>
                            {date.toLocaleDateString(
                              isRTL ? (language === 'he' ? 'he-IL' : 'ar-SA') : 'en-US',
                              { year: 'numeric', month: 'short', day: 'numeric' }
                            )}
                          </Text>
                        </View>
                        <View style={styles.timelineDateItem}>
                          <Feather name="clock" size={12} color="#94A3B8" style={styles.timelineDateIcon} />
                          <Text style={[styles.timelineDate, { textAlign: getTextAlign(isRTL) }]}>
                            {date.toLocaleTimeString(
                              isRTL ? (language === 'he' ? 'he-IL' : 'ar-SA') : 'en-US',
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
          {authUser.role === "business" && (
            <View style={styles.modernCard}>
              <LinearGradient 
                colors={['#EF4444', '#DC2626']} 
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.cardHeader, { flexDirection: getFlexDirection(isRTL) }]}
              >
                <View style={[styles.cardIconContainer, getMargin(isRTL)]}>
                  <Ionicons name="help-buoy" size={20} color="#ffffff" />
                </View>
                <Text style={[styles.cardHeaderText, { textAlign: getTextAlign(isRTL) }]}>
                  {translations[language]?.tabs.orders.track.needHelp || 'Need Help?'}
                </Text>
              </LinearGradient>
              
              <View style={styles.supportContent}>
                <View style={styles.supportTextContainer}>
                  <Feather name="alert-circle" size={24} color="#EF4444" style={styles.supportTextIcon} />
                  <Text style={[styles.supportText, { textAlign: getTextAlign(isRTL) }]}>
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
                    <Text style={styles.supportButtonText}>
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
  },
  heroInfoIcon: {
    marginRight: 6,
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
  },
  driverIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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
  },
  driverName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 10,
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
    gap:7
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
    alignItems: 'center',
    marginRight: 12,
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
  },
  checkDetailIcon: {
    marginRight: 8,
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
    gap:15
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
  },
  packageImageContainer: {
    marginRight: 16,
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
    gap:7
  },
  packageLabelIcon: {
    marginRight: 8,
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
    flex: 1,
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
    zIndex: 2,
    marginRight: 15,
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
  },
  timelineDetailIcon: {
    marginRight: 8,
  },
  timelineDetails: {
    fontSize: 14,
    color: '#64748B',
  },
  timelineDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  timelineDateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDateIcon: {
    marginRight: 4,
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
  },
  errorButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default TrackingOrder;