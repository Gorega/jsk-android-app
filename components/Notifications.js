import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
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

export default function NotificationsComponent() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { refreshKey } = useLocalSearchParams();
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
    loading: false
  });

  // Register for push notifications
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
  }, []);

  // Listen for changes in notificationsCount to update UI or refreshKey changes
  useEffect(() => {
    if (user?.userId) {
      // Reset page to 1 when refreshKey changes
      setPage(1);
      fetchNotificationsData();
    }
  }, [user, refreshKey]);

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
          "Content-Type": "application/json"
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

  const handleNotificationItemClick = async (notificationId, notificationType, notificationOrderId) => {
    try {
      // For confirmation type notifications, show confirmation modal
      if (notificationType === "confirmation") {
        setConfirmationModal({
          visible: true,
          notificationId: notificationId,
          loading: false
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

  // Update function to handle confirmation response
  const handleConfirmationResponse = async (confirm) => {
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

  const getIcon = (type) => {
    switch (type) {
      case 'order':
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

  const renderNotification = (notification) => (
    <View 
      key={notification.notification_id} 
      style={[
        styles.notificationItem, 
        !notification.is_read && styles.unread
      ]}
    >
      <TouchableOpacity 
        style={[
          styles.notificationContent
        ]}
        onPress={() => handleNotificationItemClick(notification.notification_id, notification.type, notification.order_id)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          {getIcon(notification.type)}
          {!notification.is_read && <View style={styles.unreadIndicator} />}
        </View>
        
        <View style={[
          styles.contentContainer
        ]}>
          <View style={[
            styles.notificationHeader
          ]}>
            <Text style={styles.time}>
              {formatDate(notification.created_at)}
            </Text>
          </View>
          
          <Text 
            style={[
              styles.message,
              !notification.is_read && styles.unreadText,
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
        style={styles.deleteButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={""} 
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>
        {translations[language]?.notifications?.noNotificationsTitle || 'No Notifications'}
      </Text>
      <Text style={styles.emptyText}>
        {translations[language]?.notifications?.noNotifications || "You don't have any notifications yet."}
      </Text>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4361EE" />
      <Text style={styles.loadingText}>
        {translations[language]?.notifications?.loading || 'Loading notifications...'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
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
          {renderNotification}
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
              error: null
            });
          }
        }}
        position="center"
      >
        <View style={styles.confirmationContainer}>
          {confirmationModal.loading ? (
            <>
              <ActivityIndicator size="large" color="#4361EE" style={styles.confirmationLoader} />
              <Text style={styles.confirmationTitle}>
                {translations[language]?.notifications?.confirmation?.processing || "Processing"}
              </Text>
              <Text style={styles.confirmationMessage}>
                {translations[language]?.notifications?.confirmation?.pleaseWait || "Please wait..."}
              </Text>
            </>
          ) : confirmationModal.error ? (
            <>
              <View style={styles.confirmationIconError}>
                <Ionicons name="alert-circle" size={40} color="white" />
              </View>
              <Text style={styles.confirmationTitle}>
                {translations[language]?.notifications?.confirmation?.error || "Error"}
              </Text>
              <Text style={styles.confirmationMessage}>
                {confirmationModal.error}
              </Text>
              <TouchableOpacity
                style={styles.confirmationButtonSingle}
                onPress={() => setConfirmationModal({
                  visible: false,
                  notificationId: null,
                  loading: false
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
              <Text style={styles.confirmationTitle}>
                {confirmationModal.confirmed 
                  ? (translations[language]?.notifications?.confirmation?.success || "Success") 
                  : (translations[language]?.notifications?.confirmation?.cancelled || "Cancelled")}
              </Text>
              <Text style={styles.confirmationMessage}>
                {confirmationModal.confirmed 
                  ? (translations[language]?.notifications?.confirmation?.successMessage || "Your confirmation has been processed successfully.")
                  : (translations[language]?.notifications?.confirmation?.cancelledMessage || "The request has been cancelled.")}
              </Text>
              {confirmationModal.confirmed && confirmationModal.transactionId && (
                <Text style={styles.transactionId}>
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
                  loading: false
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
              <Text style={styles.confirmationTitle}>
                {translations[language]?.notifications?.confirmation?.title || "Confirmation Required"}
              </Text>
              <Text style={styles.confirmationMessage}>
                {translations[language]?.notifications?.confirmation?.message || "Do you want to confirm this request?"}
              </Text>
              <View style={styles.confirmationButtonsRow}>
                <TouchableOpacity
                  style={[styles.confirmationButton, styles.confirmationButtonCancel]}
                  onPress={() => handleConfirmationResponse(false)}
                >
                  <Text style={styles.confirmationButtonText}>
                    {translations[language]?.notifications?.confirmation?.cancel || "Cancel"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmationButton, styles.confirmationButtonConfirm]}
                  onPress={() => handleConfirmationResponse(true)}
                >
                  <Text style={styles.confirmationButtonText}>
                    {translations[language]?.notifications?.confirmation?.confirm || "Confirm"}
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
    backgroundColor: '#f8f9fa',
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
});