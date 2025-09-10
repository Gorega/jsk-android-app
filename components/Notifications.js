import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform, Animated } from 'react-native';
import { useLanguage } from '../utils/languageContext';
import { translations } from '../utils/languageContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from "../RootLayout";
import { router, useLocalSearchParams } from 'expo-router';
import FlatListData from './FlatListData';
import { LinearGradient } from 'expo-linear-gradient';
import ModalPresentation from './ModalPresentation';
import { registerForPushNotificationsAsync } from '../utils/notificationHelper';
import { useTheme } from '../utils/themeContext';
import { Colors } from '../constants/Colors';
import { useSocket } from '../utils/socketContext';

export default function NotificationsComponent() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { refreshKey } = useLocalSearchParams();
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const [notificationsData, setNotificationsData] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expoPushToken, setExpoPushToken] = useState('');
  const isRTL = language === 'ar' || language === 'he';
  
  // Add state for confirmation modal
  const [confirmationModal, setConfirmationModal] = useState({
    visible: false,
    notificationId: null,
    loading: false,
    notificationType: null,
    orderData: null
  });

  // Register for push notifications
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
  }, []);

  // Get socket instance
  const socket = useSocket();
  // Animation ref for new notifications
  const newNotificationAnimation = useRef(new Animated.Value(0)).current;

  // Listen for changes in notificationsCount to update UI or refreshKey changes
  useEffect(() => {
    if (user?.userId) {
      // Reset page to 1 when refreshKey changes
      setPage(1);
      fetchNotificationsData();
    }
  }, [user, refreshKey]);
  
  // Socket notification handling
  useEffect(() => {
    if (!socket || !user || !user.userId) return;
    
    const handleNotification = (notification) => {
      // Validate notification data and user match
      if (!notification || Number(user.userId) !== Number(notification.user_id)) {
        return;
      }
      
      // Handle different notification types
      switch (notification.type) {
        case 'NEW_NOTIFICATION':
          // Add the new notification to the list if we have the full notification data
          if (notification.notification_id && notification.translated_message) {
            // Add to the top of the list with animation
            setNotificationsData(prev => {
              // Check if notification already exists to avoid duplicates
              const exists = prev.some(n => n.notification_id === notification.notification_id);
              if (exists) return prev;
              
              // Create a complete notification object
              const newNotification = {
                notification_id: notification.notification_id,
                user_id: notification.user_id,
                message: notification.message,
                translated_message: notification.translated_message,
                is_read: false,
                is_read_count: false,
                type: notification.notificationType || 'system',
                order_id: notification.orderId,
                created_at: new Date().toISOString(),
                metadata: notification.metadata
              };
              
              // Trigger animation
              Animated.sequence([
                Animated.timing(newNotificationAnimation, {
                  toValue: 1,
                  duration: 300,
                  useNativeDriver: true,
                }),
                Animated.timing(newNotificationAnimation, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }),
              ]).start();
              
              // Return new array with the new notification at the top
              return [newNotification, ...prev];
            });
          } else {
            // If we don't have full data, refresh the list
            fetchNotificationsData();
          }
          break;
          
        case 'NOTIFICATION_UPDATED':
          // Update notification read status
          if (notification.notification_id) {
            setNotificationsData(prev => 
              prev.map(n => n.notification_id === notification.notification_id 
                ? {...n, is_read: notification.is_read} 
                : n
              )
            );
          }
          break;
          
        case 'NOTIFICATION_DELETED':
          // Remove the notification from the list
          if (notification.notification_id) {
            setNotificationsData(prev => 
              prev.filter(n => n.notification_id !== notification.notification_id)
            );
          }
          break;
          
        case 'ALL_NOTIFICATIONS_DELETED':
          // Clear all notifications
          setNotificationsData([]);
          break;
      }
    };
    
    // Register socket event listener
    socket.on('notification', handleNotification);
    
    // Clean up event listener on unmount
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, user, language]);

  const fetchNotificationsData = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setIsLoading(true);
      
      if (!user || !user.userId) {
        setIsLoading(false);
        return false;
      }
      
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications?user_id=${user.userId}&page=${pageNum}&language_code=${language}`, {
        method: "GET",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
          "Accept-Language": language
        }
      });

      if (!res.ok) {
        setIsLoading(false);
        return false;
      }

      const data = await res.json();
      
      if (pageNum === 1) {
        setNotificationsData(data.data || []);
      } else {
        setNotificationsData(prev => [...prev, ...(data.data || [])]);
      }
      
      return (data.data || []).length > 0;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreNotifications = async () => {
    if (!loadingMore && notificationsData?.length > 0) {
      // Check if there's more data to load based on the current page size
      if (notificationsData.length < 10 * page) {
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

  const handleNotificationItemClick = async (notificationId, notificationType, notificationOrderId, metadata) => {
    try {
      // For confirmation type notifications, show confirmation modal
      if (notificationType === "confirmation") {
        // Initialize metadata type
        let metadataType = 'generic';
        let parsedMetadata = metadata;
        
        // Handle metadata - could be a string type identifier or a JSON object
        if (metadata) {
          if (typeof metadata === 'string') {
            // If metadata is a simple string, use it as the type
            metadataType = metadata;
            // Try parsing if it's a JSON string
            try {
              parsedMetadata = JSON.parse(metadata);
              metadataType = parsedMetadata.type || 'generic';
            } catch (e) {
              // If parsing fails, keep the original metadata
              parsedMetadata = metadata;
            }
          } else if (typeof metadata === 'object') {
            // If metadata is already an object, get the type property
            metadataType = metadata.type || 'generic';
            parsedMetadata = metadata;
          }
        }
        
        // Find the notification in notificationsData to get the message
        const notificationItem = notificationsData.find(n => n.notification_id === notificationId);
        const notificationMessage = notificationItem ? notificationItem.translated_message : '';
        
        setConfirmationModal({
          visible: true,
          notificationId: notificationId,
          loading: false,
          notificationType: metadataType,
          orderData: {
            orderId: notificationOrderId,
            metadata: parsedMetadata,
            notificationMessage: notificationMessage
          }
        });
        return;
      }
      
      // Navigate FIRST before starting the async operation
      if (notificationType === "order" && notificationOrderId) {
        router.push({
          pathname: "/(track)",
          params: { orderId: notificationOrderId }
        });
      }
      
      // Then mark as read (this happens in the background)
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
    } catch (error) {
      // Error handled silently
    }
  };

  // Handle COD value update confirmation
  const handleCodValueUpdateConfirmation = async (action) => {
    
    try {
      // Show loading state
      setConfirmationModal(prev => ({ ...prev, loading: true }));
      
      const url = `${process.env.EXPO_PUBLIC_API_URL}/api/orders/${confirmationModal.orderData.orderId}/confirm_cod_value_update`;
      
      const requestBody = {
        notification_id: confirmationModal.notificationId,
        action: action ? 'approve' : 'reject'
      };
      
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
          "Accept-Language": language
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || data.error || `HTTP error! status: ${res.status}`);
      }
      
      // Update notifications list - remove the notification
      setNotificationsData(prev => 
        prev.filter(n => n.notification_id !== confirmationModal.notificationId)
      );
      
      // Show success message
      setConfirmationModal({
        visible: true,
        notificationId: null,
        loading: false,
        success: true,
        confirmed: action,
        notificationType: 'cod_update_request',
        orderData: {
          ...confirmationModal.orderData,
          orderId: data.order_id
        }
      });
      
    } catch (error) {
      
      // Show error message
      setConfirmationModal(prev => ({ 
        ...prev, 
        loading: false,
        error: error.message 
      }));
    }
  };

  // Handle money transaction confirmation
  const handleMoneyTransactionConfirmation = async (confirm) => {
    try {
      // Show loading state
      setConfirmationModal(prev => ({ ...prev, loading: true }));
      
      // Send confirmation/rejection to backend
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/finance/money_records/confirmation`, {
        method: "POST",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
          "Accept-Language": language
        },
        body: JSON.stringify({
          notificationId: confirmationModal.notificationId,
          confirm: confirm
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.details || data.error || `HTTP error! status: ${res.status}`);
      }
      
      // Update notifications list - remove the notification
      setNotificationsData(prev => 
        prev.filter(n => n.notification_id !== confirmationModal.notificationId)
      );
      
      // Show success message
      setConfirmationModal({
        visible: true,
        notificationId: null,
        loading: false,
        success: true,
        confirmed: confirm,
        notificationType: confirmationModal.notificationType,
        transactionId: data.transactionId
      });
      
    } catch (error) {
      // Show error message
      setConfirmationModal(prev => ({ 
        ...prev, 
        loading: false,
        error: error.message 
      }));
    }
  };

  // Update function to handle confirmation response
  const handleConfirmationResponse = async (confirm) => {
    try {
      // Check notification type and handle accordingly
      switch (confirmationModal.notificationType) {
        case 'cod_update_request':
          return handleCodValueUpdateConfirmation(confirm);
        case 'money_in':
        case 'money_out':
          return handleMoneyTransactionConfirmation(confirm);
        default:
          // Generic confirmation handling for other types
          return handleMoneyTransactionConfirmation(confirm);
      }
    } catch (error) {
      // Show error message
      setConfirmationModal(prev => ({ 
        ...prev, 
        loading: false,
        error: error.message 
      }));
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
    } catch (error) {
      // Error handled silently
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
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
    } catch (error) {
      // Error handled silently
    }
  };

  const getIcon = (type, metadata, isAlert = false) => {
    switch (type) {
      case 'order':
        if (isAlert) {
          return (
            <LinearGradient
              colors={['#DC2626', '#B91C1C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.notificationIconGradient, styles.alertIcon]}
            >
              <MaterialIcons name="warning" size={20} color="white" />
            </LinearGradient>
          );
        }
        return (
          <LinearGradient
            colors={['#4CC9F0', '#4361EE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.notificationIconGradient}
          >
            <MaterialIcons name="shopping-bag" size={20} color="white" />
          </LinearGradient>
        );
      case 'delivery':
        return (
          <LinearGradient
            colors={['#7209B7', '#F72585']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.notificationIconGradient}
          >
            <MaterialIcons name="local-shipping" size={20} color="white" />
          </LinearGradient>
        );
      case 'confirmation':
        // Check metadata type if available
        let metadataType = 'generic';
        if (metadata && typeof metadata === 'object' && metadata.type) {
          metadataType = metadata.type;
        }
        
        // Return icon based on confirmation type
        switch (metadataType) {
          case 'cod_update_request':
            return (
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.notificationIconGradient}
              >
                <MaterialIcons name="attach-money" size={20} color="white" />
              </LinearGradient>
            );
          case 'money_in':
          case 'money_out':
            return (
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.notificationIconGradient}
              >
                <MaterialIcons name="account-balance-wallet" size={20} color="white" />
              </LinearGradient>
            );
          default:
            return (
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.notificationIconGradient}
              >
                <MaterialIcons name="check-circle" size={20} color="white" />
              </LinearGradient>
            );
        }
      default:
        return (
          <LinearGradient
            colors={['#3A0CA3', '#480CA8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.notificationIconGradient}
          >
            <MaterialIcons name="notifications" size={20} color="white" />
          </LinearGradient>
        );
    }
  };

  const formatDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    
    // Check if it's today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return translations[language]?.notifications?.yesterday || 'Yesterday';
    }
    
    // Otherwise return formatted date
    return date.toLocaleDateString(language, { day: 'numeric', month: 'short' });
  };

  // Helper function to check if notification is an alert (order with stuck/delayed status)
  const isAlertNotification = (notification) => {
    if (notification.type !== 'order') return false;
    
    try {
      // Extract newStatus from the message using the backend template pattern
      const message = notification.message || '';
      
      // Pattern 1: "status changed from X to Y" - extract Y
      const changeMatch = message.match(/status changed from "[^"]+" to "([^"]+)"/i);
      if (changeMatch) {
        const newStatus = changeMatch[1].toLowerCase().trim();
        const isAlert = newStatus === 'stuck' || newStatus === 'delayed';
        
        return isAlert;
      }
      
      // Pattern 2: "status set to Y" - extract Y
      const setMatch = message.match(/status set to "([^"]+)"/i);
      if (setMatch) {
        const newStatus = setMatch[1].toLowerCase().trim();
        const isAlert = newStatus === 'stuck' || newStatus === 'delayed';
        
        return isAlert;
      }
      
      return false;
      
    } catch (error) {
      console.error('❌ Alert detection error:', error);
      return false;
    }
  };

  const renderNotification = (notification, index) => {
    const isAlert = isAlertNotification(notification);
    
    return (
      <Animated.View 
        key={notification.notification_id} 
        style={[
          styles.notificationItem, 
          { 
            backgroundColor: isAlert ? '#FEF2F2' : colors.card,
            shadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : "#000",
            // Apply animation to the first item if it's new
            transform: index === 0 ? [
              { 
                translateY: newNotificationAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10]
                }) 
              },
              {
                scale: newNotificationAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.03, 1]
                })
              }
            ] : []
          },
          isAlert && (notification.is_read ? styles.alertNotificationRead : styles.alertNotification),
          !notification.is_read && [
            styles.unread,
            { borderLeftColor: isAlert ? '#DC2626' : colors.primary }
          ]
        ]}
    >
      <TouchableOpacity 
        style={styles.notificationContent}
        onPress={() => handleNotificationItemClick(notification.notification_id, notification.type, notification.order_id, notification.metadata)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          {getIcon(notification.type, notification.metadata, isAlert)}
          {!notification.is_read && <View style={styles.unreadIndicator} />}
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.time, { color: isAlert && notification.is_read ? '#6B7280' : colors.textSecondary }]}>
              {formatDate(notification.created_at)}
            </Text>
          </View>
          
          <Text 
            style={[
              styles.message,
              { color: isAlert ? (notification.is_read ? '#6B7280' : '#DC2626') : colors.textSecondary },
              !notification.is_read && [
                styles.unreadText,
                { color: isAlert ? '#B91C1C' : colors.text }
              ],
              isAlert && (notification.is_read ? styles.alertTextRead : styles.alertText),
              {
                ...Platform.select({
                  ios: {
                    textAlign: isRTL ? "left" : ""
                  }
                }),
              }
            ]} 
          >
            {notification.translated_message}
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => deleteNotification(notification.notification_id)}
        style={[
          styles.deleteButton,
          { backgroundColor: isDark ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 107, 107, 0.1)' }
        ]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
      </TouchableOpacity>
    </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
      <Image 
        source={""} 
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {translations[language]?.notifications?.noNotificationsTitle || 'No Notifications'}
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {translations[language]?.notifications?.noNotifications || "You don't have any notifications yet."}
      </Text>
    </View>
  );

  const renderLoading = () => (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
        {translations[language]?.notifications?.loading || 'Loading notifications...'}
      </Text>
    </View>
  );

  // Get confirmation title and message based on notification type
  const getConfirmationContent = () => {
    const notificationType = confirmationModal.notificationType;
    const metadata = typeof confirmationModal.orderData?.metadata === 'object' 
      ? confirmationModal.orderData?.metadata 
      : {};
    
    switch (notificationType) {
      case 'cod_update_request':
        // Extract information from metadata
        const currentCodValue = metadata.current_cod_value || '';
        const requestedCodValue = metadata.requested_cod_value || '';
        const currentCurrency = metadata.current_currency || '';
        const requestedCurrency = metadata.requested_currency || '';
        const reason = metadata.reason || '';
        
        return {
          title: translations[language]?.notifications?.confirmation?.cod_update?.title || "Confirm COD Value Update",
          message: translations[language]?.notifications?.confirmation?.cod_update?.message || 
                  `Do you want to approve changing the COD value from ${currentCodValue} ${currentCurrency} to ${requestedCodValue} ${requestedCurrency}?${reason ? `\nReason: ${reason}` : ''}`,
          confirmText: translations[language]?.notifications?.confirmation?.cod_update?.approve || "Approve",
          cancelText: translations[language]?.notifications?.confirmation?.cod_update?.reject || "Reject",
          successMessage: translations[language]?.notifications?.confirmation?.cod_update?.successMessage || 
                        "COD value update request has been processed successfully."
        };
      
      case 'money_in':
        // Extract information from metadata
        const amount = metadata.amount || '';
        const currency = metadata.currency || '';
        const fromUserId = metadata.from_user_id || '';
        const toUserId = metadata.to_user_id || '';
        
        // Extract user information from the notification message if available
        let userInfo = '';
        if (confirmationModal.orderData && typeof confirmationModal.orderData.notificationMessage === 'string') {
          const message = confirmationModal.orderData.notificationMessage;
          // Try to extract user info from message format like "Please confirm transaction 100 ILS to wael | 0593686817"
          const match = message.match(/to\s+([^|]+)\s*\|\s*([0-9]+)/i);
          if (match && match.length >= 3) {
            userInfo = `${match[1].trim()} | ${match[2].trim()}`;
          }
        }
        
        return {
          title: translations[language]?.notifications?.confirmation?.money_in?.title || "Confirm Money Transaction",
          message: translations[language]?.notifications?.confirmation?.money_in?.message || 
                  `Do you want to confirm receiving ${amount} ${currency}?${userInfo ? `\nTo: ${userInfo}` : ''}`,
          confirmText: translations[language]?.notifications?.confirmation?.money_in?.confirm || "Confirm",
          cancelText: translations[language]?.notifications?.confirmation?.money_in?.cancel || "Cancel",
          successMessage: translations[language]?.notifications?.confirmation?.money_in?.successMessage || 
                        "Transaction has been confirmed successfully.",
          detailsContent: (
            <View style={styles.transactionDetails}>
              <Text style={[styles.transactionDetailItem, { color: colors.textSecondary }]}>
                {translations[language]?.notifications?.confirmation?.money_in?.amount || "Amount"}: {amount} {currency}
              </Text>
              {userInfo && (
                <Text style={[styles.transactionDetailItem, { color: colors.textSecondary }]}>
                  {translations[language]?.notifications?.confirmation?.money_in?.recipient || "Recipient"}: {userInfo}
                </Text>
              )}
            </View>
          )
        };
        
      case 'money_out':
        const outAmount = metadata.amount || '';
        const outCurrency = metadata.currency || '';
        
        return {
          title: translations[language]?.notifications?.confirmation?.money_out?.title || "Confirm Money Transaction",
          message: translations[language]?.notifications?.confirmation?.money_out?.message || 
                  `Do you want to confirm sending ${outAmount} ${outCurrency}?`,
          confirmText: translations[language]?.notifications?.confirmation?.money_out?.confirm || "Confirm",
          cancelText: translations[language]?.notifications?.confirmation?.money_out?.cancel || "Cancel",
          successMessage: translations[language]?.notifications?.confirmation?.money_out?.successMessage || 
                        "Transaction has been confirmed successfully.",
          detailsContent: (
            <View style={styles.transactionDetails}>
              <Text style={[styles.transactionDetailItem, { color: colors.textSecondary }]}>
                {translations[language]?.notifications?.confirmation?.money_out?.amount || "Amount"}: {outAmount} {outCurrency}
              </Text>
            </View>
          )
        };
      
      default:
        return {
          title: translations[language]?.notifications?.confirmation?.title || "Confirmation Required",
          message: translations[language]?.notifications?.confirmation?.message || "Do you want to confirm this request?",
          confirmText: translations[language]?.notifications?.confirmation?.confirm || "Confirm",
          cancelText: translations[language]?.notifications?.confirmation?.cancel || "Cancel",
          successMessage: translations[language]?.notifications?.confirmation?.successMessage || "Your confirmation has been processed successfully."
        };
    }
  };

  const confirmationContent = getConfirmationContent();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        renderLoading()
      ) : notificationsData.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatListData
          list={notificationsData}
          loadMoreData={loadMoreNotifications}
          loadingMore={loadingMore}
        >
          {(notification, index) => renderNotification(notification, index)}
        </FlatListData>
      )}
      
      {/* Confirmation Modal */}
      <ModalPresentation
        showModal={confirmationModal.visible}
        setShowModal={() => {
          if (!confirmationModal.loading) {
            setConfirmationModal({
              visible: false,
              notificationId: null,
              loading: false,
              success: false,
              error: null,
              notificationType: null,
              orderData: null
            });
          }
        }}
        position="center"
      >
        <View style={[styles.confirmationContainer, { backgroundColor: colors.card }]}>
          {confirmationModal.loading ? (
            <>
              <ActivityIndicator size="large" color={colors.primary} style={styles.confirmationLoader} />
              <Text style={[styles.confirmationTitle, { color: colors.text }]}>
                {translations[language]?.notifications?.confirmation?.processing || "Processing"}
              </Text>
              <Text style={[styles.confirmationMessage, { color: colors.textSecondary }]}>
                {translations[language]?.notifications?.confirmation?.pleaseWait || "Please wait..."}
              </Text>
            </>
          ) : confirmationModal.error ? (
            <>
              <View style={styles.confirmationIconError}>
                <Ionicons name="alert-circle" size={40} color="white" />
              </View>
              <Text style={[styles.confirmationTitle, { color: colors.text }]}>
                {translations[language]?.notifications?.confirmation?.error || "Error"}
              </Text>
              <Text style={[styles.confirmationMessage, { color: colors.textSecondary }]}>
                {confirmationModal.error}
              </Text>
              <TouchableOpacity
                style={styles.confirmationButtonSingle}
                onPress={() => setConfirmationModal({
                  visible: false,
                  notificationId: null,
                  loading: false,
                  notificationType: null,
                  orderData: null
                })}
              >
                <Text style={styles.confirmationButtonText}>
                  {translations[language]?.ok || "OK"}
                </Text>
              </TouchableOpacity>
            </>
          ) : confirmationModal.success ? (
            <>
              <View style={[
                styles.confirmationIcon, 
                confirmationModal.confirmed ? styles.confirmationIconSuccess : styles.confirmationIconInfo
              ]}>
                <Ionicons 
                  name={confirmationModal.confirmed ? "checkmark-circle" : "information-circle"} 
                  size={40} 
                  color="white" 
                />
              </View>
              <Text style={[styles.confirmationTitle, { color: colors.text }]}>
                {confirmationModal.confirmed 
                  ? (translations[language]?.notifications?.confirmation?.success || "Success") 
                  : (translations[language]?.notifications?.confirmation?.cancelled || "Cancelled")}
              </Text>
              <Text style={[styles.confirmationMessage, { color: colors.textSecondary }]}>
                {confirmationModal.confirmed 
                  ? (confirmationContent.successMessage || translations[language]?.notifications?.confirmation?.successMessage || "Your confirmation has been processed successfully.")
                  : (translations[language]?.notifications?.confirmation?.cancelledMessage || "The request has been cancelled.")}
              </Text>
              {confirmationModal.confirmed && confirmationModal.transactionId && (
                <Text style={[styles.transactionId, { color: colors.textSecondary }]}>
                  {translations[language]?.notifications?.confirmation?.transactionId || "Transaction ID"}: {confirmationModal.transactionId}
                </Text>
              )}
              <TouchableOpacity
                style={[
                  styles.confirmationButtonSingle,
                  confirmationModal.confirmed ? styles.confirmationButtonSuccess : styles.confirmationButtonInfo
                ]}
                onPress={() => setConfirmationModal({
                  visible: false,
                  notificationId: null,
                  loading: false,
                  notificationType: null,
                  orderData: null
                })}
              >
                <Text style={styles.confirmationButtonText}>
                  {translations[language]?.ok || "OK"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.confirmationIconQuestion}>
                <Ionicons name="help-circle" size={40} color="white" />
              </View>
              <Text style={[styles.confirmationTitle, { color: colors.text }]}>
                {confirmationContent.title}
              </Text>
              <Text style={[styles.confirmationMessage, { color: colors.textSecondary }]}>
                {confirmationContent.message}
              </Text>
              
              {/* Show additional details if available */}
              {confirmationContent.detailsContent}
              
              <View style={styles.confirmationButtonsRow}>
                <TouchableOpacity
                  style={[styles.confirmationButton, styles.confirmationButtonCancel]}
                  onPress={() => handleConfirmationResponse(false)}
                >
                  <Text style={styles.confirmationButtonText}>
                    {confirmationContent.cancelText}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmationButton, styles.confirmationButtonConfirm]}
                  onPress={() => handleConfirmationResponse(true)}
                >
                  <Text style={styles.confirmationButtonText}>
                    {confirmationContent.confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ModalPresentation>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
    height: 110,
    zIndex:100
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 16,
    marginLeft: 4,
  },
  deleteAllButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  deleteAllGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteAllText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertNotification: {
    borderWidth: 2,
    borderColor: '#FCA5A5',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  alertNotificationRead: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    opacity: 0.7,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    transform: [{ scale: 1.0 }],
  },
  unread: {
    borderLeftWidth: 3,
    borderLeftColor: '#4361EE',
  },
  iconContainer: {
    position: 'relative',
  },
  notificationIconGradient: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertIcon: {
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F72585',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  contentContainer: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  unreadText: {
    color: '#1F2937',
    fontWeight: '500',
  },
  alertText: {
    fontWeight: '600',
    fontSize: 15,
  },
  alertTextRead: {
    fontWeight: '500',
    fontSize: 14,
    opacity: 1.0,
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    gap:10
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyImage: {
    width: 160,
    height: 160,
    marginBottom: 24,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4B5563',
  },
  confirmationContainer: {
    padding: 24,
    alignItems: 'center',
  },
  confirmationIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmationIconQuestion: {
    backgroundColor: '#4361EE',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmationIconSuccess: {
    backgroundColor: '#10B981',
  },
  confirmationIconInfo: {
    backgroundColor: '#3B82F6',
  },
  confirmationIconError: {
    backgroundColor: '#EF4444',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmationMessage: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmationButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  confirmationButtonSingle: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#4361EE',
    minWidth: 120,
  },
  confirmationButtonCancel: {
    backgroundColor: '#6B7280',
  },
  confirmationButtonConfirm: {
    backgroundColor: '#4361EE',
  },
  confirmationButtonSuccess: {
    backgroundColor: '#10B981',
  },
  confirmationButtonInfo: {
    backgroundColor: '#3B82F6',
  },
  confirmationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationLoader: {
    marginBottom: 20,
  },
  transactionId: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  transactionDetails: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  transactionDetailItem: {
    fontSize: 14,
    marginBottom: 4,
    color: '#4B5563',
  },
});