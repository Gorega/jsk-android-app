import { View, StyleSheet, Text, TouchableOpacity, StatusBar, Alert, ActivityIndicator, Platform, ScrollView, TextInput } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../utils/languageContext';
import { useAuth } from "../../RootLayout";
import { translations } from '../../utils/languageContext';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FixedHeader from "../../components/FixedHeader";
import { router, useLocalSearchParams, Stack } from 'expo-router';
// import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
// import * as Location from 'expo-location';
import { Linking } from 'react-native';
import ModalPresentation from "../../components/ModalPresentation";
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';

export default function RouteNavigate() {
    const { language } = useLanguage();
    const { user } = useAuth();
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const params = useLocalSearchParams();
    const { routeId } = params;
    const isRTL = ["ar","he"].includes(language);
    
    const [loading, setLoading] = useState(true);
    const [route, setRoute] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [location, setLocation] = useState(null);
    const [locationSubscription, setLocationSubscription] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'map' or 'list'
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [orderStatus, setOrderStatus] = useState({});
    const [pendingRescheduleOrder, setPendingRescheduleOrder] = useState(null);
    const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [selectedReason, setSelectedReason] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showCallOptionsModal, setShowCallOptionsModal] = useState(false);
    const [currentPhoneNumber, setCurrentPhoneNumber] = useState(null);
    const [currentOrderForContact, setCurrentOrderForContact] = useState(null);
    // Add search state for filtering reasons
    const [reasonSearchQuery, setReasonSearchQuery] = useState('');
    const [filteredReasons, setFilteredReasons] = useState([]);
    
    const mapRef = useRef(null);
    
    // Check if user has appropriate role
    const isAllowed = ["driver", "delivery_company"].includes(user.role);
    
    // Add these status options
    const statusOptions = [{
        label: translations[language].tabs.orders.order.states.rescheduled, value: "reschedule",
        requiresReason: true,
        reasons: [
            { value: 'closed', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.closed},
            { value: 'no_response', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.no_response},
            { value: 'cancelled_from_office', label: translations[language].tabs?.orders.order?.states?.suspendReasons?.cancelled_from_office},
            { value: 'address_changed', label: translations[language].tabs?.orders.order?.states?.suspendReasons?.address_changed},
            { value: 'not_compatible', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.not_compatible},
            { value: 'delivery_fee_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.delivery_fee_issue},
            { value: 'duplicate_reschedule', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.duplicate_reschedule },
            { value: 'receive_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receive_issue},
            { value: 'sender_cancelled', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.sender_cancelled},
            { value: 'reschedule_request', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.reschedule_request},
            { value: 'incorrect_number', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.incorrect_number},
            { value: 'not_existing', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.not_existing},
            { value: 'cod_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.cod_issue},
            { value: 'death_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.death_issue},
            { value: 'not_exist_in_address', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.not_exist_in_address},
            { value: 'receiver_cancelled', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receiver_cancelled},
            { value: 'receiver_no_response', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receiver_no_response},
            { value: 'order_incomplete', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.order_incomplete},
            { value: 'receive_request_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receive_request_issue},
            { value: 'other', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.other}
        ]
        },{
            label: translations[language].tabs?.orders?.order?.states?.rejected, value: "rejected",
            requiresReason: true,
            reasons: [
                { value: 'closed', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.closed},
                { value: 'no_response', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.no_response},
                { value: 'cancelled_from_office', label: translations[language].tabs?.orders.order?.states?.suspendReasons?.cancelled_from_office},
                { value: 'address_changed', label: translations[language].tabs?.orders.order?.states?.suspendReasons?.address_changed},
                { value: 'not_compatible', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.not_compatible},
                { value: 'delivery_fee_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.delivery_fee_issue},
                { value: 'duplicate_reschedule', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.duplicate_reschedule },
                { value: 'receive_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receive_issue},
                { value: 'sender_cancelled', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.sender_cancelled},
                { value: 'reschedule_request', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.reschedule_request},
                { value: 'incorrect_number', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.incorrect_number},
                { value: 'not_existing', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.not_existing},
                { value: 'cod_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.cod_issue},
                { value: 'death_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.death_issue},
                { value: 'not_exist_in_address', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.not_exist_in_address},
                { value: 'receiver_cancelled', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receiver_cancelled},
                { value: 'receiver_no_response', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receiver_no_response},
                { value: 'order_incomplete', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.order_incomplete},
                { value: 'receive_request_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receive_request_issue},
                { value: 'other', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.other}
            ]
        }, {
            label: translations[language].tabs?.orders?.order?.states?.stuck, value: "stuck",
            requiresReason: true,
            reasons: [
                { value: 'closed', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.closed},
                { value: 'no_response', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.no_response},
                { value: 'cancelled_from_office', label: translations[language].tabs?.orders.order?.states?.suspendReasons?.cancelled_from_office},
                { value: 'address_changed', label: translations[language].tabs?.orders.order?.states?.suspendReasons?.address_changed},
                { value: 'not_compatible', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.not_compatible},
                { value: 'delivery_fee_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.delivery_fee_issue},
                { value: 'duplicate_reschedule', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.duplicate_reschedule },
                { value: 'receive_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receive_issue},
                { value: 'sender_cancelled', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.sender_cancelled},
                { value: 'reschedule_request', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.reschedule_request},
                { value: 'incorrect_number', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.incorrect_number},
                { value: 'not_existing', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.not_existing},
                { value: 'cod_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.cod_issue},
                { value: 'death_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.death_issue},
                { value: 'not_exist_in_address', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.not_exist_in_address},
                { value: 'receiver_cancelled', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receiver_cancelled},
                { value: 'receiver_no_response', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receiver_no_response},
                { value: 'order_incomplete', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.order_incomplete},
                { value: 'receive_request_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receive_request_issue},
                { value: 'other', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.other}
            ]
        }, {
        label: translations[language].tabs?.orders?.order?.states?.return_before_delivered_initiated, value: "return_before_delivered_initiated",
        requiresReason: true,
        reasons: [
            { value: 'closed', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.closed},
            { value: 'no_response', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.no_response},
            { value: 'cancelled_from_office', label: translations[language].tabs?.orders.order?.states?.suspendReasons?.cancelled_from_office},
            { value: 'address_changed', label: translations[language].tabs?.orders.order?.states?.suspendReasons?.address_changed},
            { value: 'not_compatible', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.not_compatible},
            { value: 'delivery_fee_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.delivery_fee_issue},
            { value: 'duplicate_reschedule', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.duplicate_reschedule },
            { value: 'receive_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receive_issue},
            { value: 'sender_cancelled', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.sender_cancelled},
            { value: 'reschedule_request', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.reschedule_request},
            { value: 'incorrect_number', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.incorrect_number},
            { value: 'not_existing', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.not_existing},
            { value: 'cod_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.cod_issue},
            { value: 'death_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.death_issue},
            { value: 'not_exist_in_address', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.not_exist_in_address},
            { value: 'receiver_cancelled', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receiver_cancelled},
            { value: 'receiver_no_response', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receiver_no_response},
            { value: 'order_incomplete', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.order_incomplete},
            { value: 'receive_request_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receive_request_issue},
            { value: 'other', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.other}
        ]
    }, {
        label: translations[language].tabs?.orders?.order?.states?.return_after_delivered_initiated, value: "return_after_delivered_initiated",
        requiresReason: true,
        reasons: [
            { value: 'closed', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.closed},
            { value: 'no_response', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.no_response},
            { value: 'cancelled_from_office', label: translations[language].tabs?.orders.order?.states?.suspendReasons?.cancelled_from_office},
            { value: 'address_changed', label: translations[language].tabs?.orders.order?.states?.suspendReasons?.address_changed},
            { value: 'not_compatible', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.not_compatible},
            { value: 'delivery_fee_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.delivery_fee_issue},
            { value: 'duplicate_reschedule', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.duplicate_reschedule },
            { value: 'receive_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receive_issue},
            { value: 'sender_cancelled', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.sender_cancelled},
            { value: 'reschedule_request', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.reschedule_request},
            { value: 'incorrect_number', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.incorrect_number},
            { value: 'not_existing', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.not_existing},
            { value: 'cod_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.cod_issue},
            { value: 'death_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.death_issue},
            { value: 'not_exist_in_address', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.not_exist_in_address},
            { value: 'receiver_cancelled', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receiver_cancelled},
            { value: 'receiver_no_response', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receiver_no_response},
            { value: 'order_incomplete', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.order_incomplete},
            { value: 'receive_request_issue', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.receive_request_issue},
            { value: 'other', label: translations[language].tabs?.orders?.order?.states?.suspendReasons?.other}
        ]
    }, {
        label: translations[language].tabs?.orders?.order?.states?.delivered, value: "delivered"
    }, {
        label: translations[language].tabs?.orders?.order?.states?.received, value: "received"
    }, {
        label: translations[language].tabs?.orders?.order?.states?.delivered_received, value: "delivered/received"
    }];
    
    // Add these state variables near the other useState declarations
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [allOrders, setAllOrders] = useState([]);
    const ITEMS_PER_PAGE = 10; // Number of orders to fetch per page

    // First, define the allowed statuses that can be changed
    const allowedStatuses = [
        'on_the_way',
        'reschedule',
        'rejected',
        "driver_responsibility",
    ];

    // Modify the fetchRouteDetails function to prevent duplicates
    const fetchRouteDetails = async (pageNum = 1, isLoadMore = false) => {
        if (isLoadMore) {
            setIsLoadingMore(true);
        } else {
            setLoading(true);
        }

        try {
            if (!routeId) {
                Alert.alert(
                    translations[language].routes?.error || "Error",
                    translations[language].routes?.routeNotFound || "Route not found",
                    [{ text: "OK", onPress: () => router.back() }]
                );
                return;
            }

            // const token = await getToken("userToken");
            const res = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/driver/routes/${routeId}?language_code=${language}&page=${pageNum}&per_page=${ITEMS_PER_PAGE}`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json",
                        // "Cookie": token ? `token=${token}` : "",
                        "Accept-Language": language
                    }
                }
            );

            if (res.ok) {
                const data = await res.json();
                if (data && data.route) {
                    const routeData = {
                        ...data.route,
                        orders: Array.isArray(data.route.orders) ? data.route.orders : []
                    };

                    if (isLoadMore) {
                        // Prevent duplicates when loading more
                        setAllOrders(prevOrders => {
                            const existingIds = new Set(prevOrders.map(order => order.id));
                            const newOrders = routeData.orders.filter(order => !existingIds.has(order.id));
                            return [...prevOrders, ...newOrders];
                        });
                    } else {
                        setRoute(routeData);
                        setAllOrders(routeData.orders);
                    }

                    // Update hasMore based on whether we received a full page of items
                    setHasMore(routeData.orders.length === ITEMS_PER_PAGE);

                    // Initialize order status tracking
                    const statusObj = {};
                    routeData.orders.forEach(order => {
                        statusObj[order.id] = order.delivery_info.status_key;
                    });
                    setOrderStatus(prevStatus => ({ ...prevStatus, ...statusObj }));
                }
            }
        } catch (error) {
            Alert.alert(
                translations[language].common?.error || "Error",
                translations[language].routes?.errorLoadingRoute || "Error loading route details"
            );
        } finally {
            setLoading(false);
            setIsLoadingMore(false);
        }
    };

    // Add a function to handle scroll events
    const handleScroll = (event) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 20;
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

        if (isCloseToBottom && !isLoadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchRouteDetails(nextPage, true);
        }
    };

    // Add a loading indicator component
    const LoadingIndicator = () => (
        <View style={styles.loadingMoreContainer}>
            <ActivityIndicator size="small" color="#4361EE" />
            <Text style={styles.loadingMoreText}>
                {translations[language].common?.loadingMore || "Loading more..."}
            </Text>
        </View>
    );
    
    useEffect(() => {
        if (!isAllowed) {
            // Redirect if not a driver or delivery company
            Alert.alert(
                translations[language].common?.accessDenied || "Access Denied",
                translations[language].routes?.accessDeniedMessage || "This feature is only available for drivers and delivery companies.",
                [{ text: "OK", onPress: () => router.replace("/(tabs)/index") }]
            );
            return;
        }
        
        // // Get location permission and start tracking
        // (async () => {
        //     let { status } = await Location.requestForegroundPermissionsAsync();
        //     if (status !== 'granted') {
        //         Alert.alert(
        //             translations[language].routes?.locationPermission || "Location Permission",
        //             translations[language].routes?.locationNeeded || "Location permission is needed for navigation."
        //         );
        //         return;
        //     }
            
        //     let currentLocation = await Location.getCurrentPositionAsync({});
        //     setLocation(currentLocation);
            
        //     // Subscribe to location updates
        //     const subscription = await Location.watchPositionAsync(
        //         {
        //             accuracy: Location.Accuracy.High,
        //             distanceInterval: 10, // Update every 10 meters
        //         },
        //         (newLocation) => {
        //             setLocation(newLocation);
        //         }
        //     );
            
        //     setLocationSubscription(subscription);
        // })();
        
        // Fetch route data
        fetchRouteDetails();
        
        // // Cleanup location subscription
        // return () => {
        //     if (locationSubscription) {
        //         locationSubscription.remove();
        //     }
        // };
    }, [isAllowed, routeId, language]);
    
    // Generate WhatsApp message template with dynamic order data
    const generateWhatsAppMessage = (order) => {
        if (!order) return '';
        
        // Extract all available data with fallbacks
        const receiverName = order.receiver_name || '';
        const orderReference = order.order_id || order.reference || '';
        const businessName = user?.business?.name || 'طيار للتوصيل';
        const codValue = order.cod_value || '';
        const currency = order.currency || '₪';
        const deliveryDate = 'اليوم';
        
        // Create message based on language
        if (language === 'ar' || language === 'he') {
            return `مرحبا ${receiverName}، منحكي معك من شركة طيار للتوصيل سنقوم بتوصيل طردكم (${orderReference})${codValue ? ` بقيمة ${codValue}${currency}` : ''} من (${businessName}) ${deliveryDate}... الرجاء ارسال موقعكم واسم البلد لتاكيد وصول طلبكم (لا يمكن تحديد ساعات لوصول الطلبيه بسبب حركه السير وظروف اخرى) عدم الرد على هذه الرساله يؤدي الى تاجيل`;
        } else {
            return `Hello ${receiverName}, this is Taiar delivery service. We will deliver your package (${orderReference})${codValue ? ` with value ${codValue}${currency}` : ''} from (${businessName}) ${deliveryDate}. Please send your location and city name to confirm your order delivery (delivery time cannot be specified due to traffic and other conditions). Not responding to this message will lead to postponement.`;
        }
    };

    const handleCall = (phoneNumber, order) => {
        if (!phoneNumber) return;
        
        setCurrentPhoneNumber(phoneNumber);
        setCurrentOrderForContact(order);
        setShowCallOptionsModal(true);
    };
    
    // Add function to handle message sending
    const handleMessage = (phoneNumber, order) => {
        if (!phoneNumber) return;
        
        // Record contact history
        recordContactHistory('رسالة SMS');
        
        // Generate message and open SMS app
        const message = generateWhatsAppMessage(order);
        Linking.openURL(`sms:${phoneNumber}?body=${encodeURIComponent(message)}`);
    };

    const handleStatusUpdate = (order) => {
        const currentStatus = orderStatus[order.id];
        
        // Check if the current status is in the allowed list
        if (!allowedStatuses.includes(currentStatus)) {
            Alert.alert(
                translations[language].common?.error || "Error",
                translations[language].routes?.statusChangeNotAllowed || "Cannot change status for this order",
                [{ text: "OK" }]
            );
            return;
        }
        
        setPendingRescheduleOrder(order);
        setShowStatusUpdateModal(true);
    };
    
    const handleStatusSelect = (status) => {
        setSelectedStatus(status);
        setShowStatusUpdateModal(false);
        
        if (status.requiresReason) {
            // Reset search query and set filtered reasons to all reasons
            setReasonSearchQuery('');
            setFilteredReasons(status.reasons || []);
            setShowReasonModal(true);
        } else {
            setShowConfirmModal(true);
        }
    };

    // Add a function to handle reason search
    const handleReasonSearch = (text) => {
        setReasonSearchQuery(text);
        if (!selectedStatus || !selectedStatus.reasons) return;
        
        if (text.trim() === '') {
            setFilteredReasons(selectedStatus.reasons);
        } else {
            const filtered = selectedStatus.reasons.filter(reason => 
                reason.label.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredReasons(filtered);
        }
    };

    const handleReasonSelect = (reason) => {
        setSelectedReason(reason);
        setShowReasonModal(false);
        setShowConfirmModal(true);
    };
    
    const confirmStatusUpdate = async () => {
        if (!pendingRescheduleOrder || !selectedStatus) return;
        if (selectedStatus.requiresReason && !selectedReason) return;

        setIsUpdating(true);
        try {
            // const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/status`, {
                method: "PUT",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Accept-Language': language,
                    // "Cookie": token ? `token=${token}` : ""
                },
                credentials: "include",
                body: JSON.stringify({
                    updates: {
                        order_id: pendingRescheduleOrder.order_id,
                        status: selectedStatus.value,
                        ...(selectedReason && { reason: selectedReason.value })
                    }
                })
            });

            const data = await res.json();
            
            if (!data.error) {
                // Update order status locally
                setOrderStatus(prevStatus => ({
                    ...prevStatus,
                    [pendingRescheduleOrder.id]: selectedStatus.value
                }));
                
                // Update the order in allOrders list
                setAllOrders(prevOrders => 
                    prevOrders.map(order => {
                        if (order.id === pendingRescheduleOrder.id) {
                            return {
                                ...order,
                                delivery_info: {
                                    ...order.delivery_info,
                                    status: selectedStatus.label,
                                    status_key: selectedStatus.value
                                }
                            };
                        }
                        return order;
                    })
                );
                
                // If this is the current order, move to next
                if (currentIndex < route.orders.length - 1 && route.orders[currentIndex].id === pendingRescheduleOrder.id) {
                    const nextIndex = currentIndex + 1;
                    setCurrentIndex(nextIndex);
                }

                // Update route orders as well
                if (route) {
                    setRoute(prevRoute => ({
                        ...prevRoute,
                        orders: prevRoute.orders.map(order => {
                            if (order.id === pendingRescheduleOrder.id) {
                                return {
                                    ...order,
                                    delivery_info: {
                                        ...order.delivery_info,
                                        status: selectedStatus.label,
                                        status_key: selectedStatus.value
                                    }
                                };
                            }
                            return order;
                        })
                    }));
                }
            } else {
                Alert.alert(
                    translations[language].common?.error || "Error",
                    data.error || translations[language].routes?.errorUpdatingStatus || "Failed to update status"
                );
            }
        } catch (error) {
            Alert.alert(
                translations[language].common?.error || "Error",
                translations[language].routes?.errorUpdatingStatus || "Failed to update status"
            );
        } finally {
            // Reset all states
            setIsUpdating(false);
            setShowStatusUpdateModal(false);
            setShowReasonModal(false);
            setShowConfirmModal(false);
            setSelectedStatus(null);
            setSelectedReason(null);
            setPendingRescheduleOrder(null);
        }
    };
    
    const toggleExpandOrder = (orderId) => {
        if (expandedOrder === orderId) {
            setExpandedOrder(null);
        } else {
            setExpandedOrder(orderId);
        }
    };
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered':
            case 'received':
            case 'delivered/received':
                return colors.success; // Green
            case 'on_the_way':
            case'driver_responsibility':
                return colors.primary; // Blue
            case 'pending':
                return colors.warning; // Yellow
            case 'reschedule':
                return colors.warning; // Yellow
            case 'return_before_delivered_initiated':
            case 'return_after_delivered_initiated':
            case 'cancelled':
                return colors.error; // Red
            default:
                return colors.textSecondary; // Gray
        }
    };

    // Add this function to record contact history
    const recordContactHistory = async (contactType) => {
        // Only record if user is driver or delivery_company and orderId exists
        if (!user || !['driver', 'delivery_company'].includes(user.role?.toLowerCase()) || !currentOrderForContact?.order_id) {
            return;
        }

        try {
            await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/${currentOrderForContact.order_id}/history/record`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Accept-Language': language
                },
                body: JSON.stringify({
                    orderId: currentOrderForContact.order_id,
                    fieldName: contactType,
                    oldValue: '',
                    newValue: `تواصل السائق مع ${currentOrderForContact.receiver_name} عبر ${contactType}`
                })
            });
        } catch (error) {
            console.error('Error recording contact history:', error);
        }
    };

    if (!isAllowed) {
        return null; // Will be redirected in useEffect
    }
    
    if (loading || !route) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.statusBarBg} />
                <FixedHeader 
                    title={translations[language]?.routes?.navigation || "Route Navigation"} 
                    showBackButton={true} 
                />
                
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        {translations[language]?.common?.loading || "Loading..."}
                    </Text>
                </View>
            </View>
        );
    }
    
    // Safe access to route and orders
    const safeRoute = route || { orders: [] };
    const safeOrders = Array.isArray(safeRoute.orders) ? safeRoute.orders : [];
    const currentOrder = safeOrders[currentIndex] || null;

    // Count orders that are either delivered or have unrecognized statuses
    const deliveredCount = Object.values(orderStatus).filter(status => 
        status === 'delivered' || !allowedStatuses.includes(status)
    ).length;

    const totalOrders = safeOrders.length;
    
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.statusBarBg} />
            <FixedHeader 
                title={safeRoute.name} 
                showBackButton={true} 
            />
            
            <View style={[styles.progressContainer, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
                <View style={styles.progressInfo}>
                    <Text style={[styles.progressText, { color: colors.success }]}>
                        {deliveredCount}/{totalOrders} {translations[language]?.routes?.delivered || "Delivered"}
                    </Text>
                    <Text style={[styles.routeInfoText, { color: colors.textSecondary }]}>
                        {translations[language]?.routes?.stop || "Stop"} {currentIndex + 1}/{totalOrders}
                    </Text>
                </View>
                <View style={[styles.progressBarContainer, { backgroundColor: isDark ? '#3A3A3A' : '#E2E8F0' }]}>
                    <View 
                        style={[
                            styles.progressBar, 
                            { width: `${(deliveredCount / totalOrders) * 100}%`, backgroundColor: colors.success }
                        ]} 
                    />
                </View>
            </View>
            
            <View style={[styles.viewToggle, { backgroundColor: colors.card }]}>
                <TouchableOpacity 
                    style={[
                        styles.toggleButton, 
                        viewMode === 'list' && [styles.activeToggleButton, { backgroundColor: colors.primary }]
                    ]}
                    onPress={() => setViewMode('list')}
                >
                    <Feather 
                        name="list" 
                        size={16} 
                        color={viewMode === 'list' ? colors.buttonText : colors.textSecondary} 
                    />
                    <Text style={[
                        styles.toggleText, 
                        { color: viewMode === 'list' ? colors.buttonText : colors.textSecondary },
                        viewMode === 'list' && styles.activeToggleText
                    ]}>
                        {translations[language]?.routes?.list || "List"}
                    </Text>
                </TouchableOpacity>
            </View>
            
            <View style={styles.listContainer}>
                <ScrollView
                    onScroll={handleScroll}
                    scrollEventThrottle={400}
                    showsVerticalScrollIndicator={false}
                >
                    {allOrders.map((order, index) => (
                        <TouchableOpacity
                            key={`${order.id}-${index}`}
                            style={[
                                styles.listItemCard,
                                { 
                                    backgroundColor: colors.card,
                                    borderLeftColor: getStatusColor(orderStatus[order.id])
                                },
                                expandedOrder === order.id && styles.expandedListItem
                            ]}
                            onPress={() => toggleExpandOrder(order.id)}
                            onLongPress={() => router.push({
                                pathname: "(track)",
                                params: { orderId: order.order_id }
                            })}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.listItemHeader]}>
                                <View style={[styles.orderNumberContainer, { backgroundColor: getStatusColor(orderStatus[order.id]) }]}>
                                    <Text style={styles.orderNumber}>{index + 1}</Text>
                                </View>
                                
                                <View style={styles.listItemTitleContainer}>
                                    <Text style={[styles.listItemName, { color: colors.text },{
                                        ...Platform.select({
                                            ios: {
                                                textAlign:isRTL ? "left" : ""
                                            }
                                        }),
                                    }]}>
                                        {order.receiver_name}
                                    </Text>
                                    <Text style={[styles.listItemAddress, { color: colors.textSecondary },{
                                        ...Platform.select({
                                            ios: {
                                                textAlign:isRTL ? "left" : ""
                                            }
                                        }),
                                    }]}>
                                        {order.receiver_address}
                                    </Text>
    
                                    {(order.delivery_info.to_branch || order.delivery_info.to_driver) && (
                                        <Text style={[styles.listItemAddress, { color: colors.textSecondary },{
                                            ...Platform.select({
                                                ios: {
                                                    textAlign:isRTL ? "left" : ""
                                                }
                                            }),
                                        }]}>
                                            {translations[language]?.routes?.dispatchTo} {order.delivery_info.to_branch || order.delivery_info.to_driver}
                                        </Text>
                                    )}
                                </View>
                                
                                <View style={styles.listItemStatus}>
                                    <View style={[
                                        styles.statusBadge, 
                                        { backgroundColor: `${getStatusColor(orderStatus[order.id])}${isDark ? '30' : '20'}` }
                                    ]}>
                                        <Text style={[styles.statusText, { color: getStatusColor(orderStatus[order.id]) }]}>
                                            {order.delivery_info.status}
                                        </Text>
                                    </View>
                                    <MaterialIcons 
                                        name={expandedOrder === order.id ? "expand-less" : "expand-more"} 
                                        size={24} 
                                        color={colors.textTertiary} 
                                    />
                                </View>
                            </View>
                            
                            {expandedOrder === order.id && (
                                <View style={styles.expandedContent}>
                                    <View style={styles.orderDetails}>
                                        <View style={[styles.orderDetailItem]}>
                                            <Feather name="package" size={16} color={colors.textSecondary} />
                                            <Text style={[styles.orderDetailLabel, { color: colors.textSecondary },{
                                                ...Platform.select({
                                                    ios: {
                                                        textAlign:isRTL ? "left" : ""
                                                    }
                                                }),
                                            }]}>
                                                {translations[language]?.routes?.orderId || "Order ID"}:
                                            </Text>
                                            <Text style={[styles.orderDetailText, { color: colors.text },{
                                                ...Platform.select({
                                                    ios: {
                                                        textAlign:isRTL ? "left" : ""
                                                    }
                                                }),
                                            }]}>
                                                {order.order_id}
                                            </Text>
                                        </View>
                                        
                                        <View style={[styles.orderDetailItem]}>
                                            <Feather name="phone" size={16} color={colors.textSecondary} />
                                            <Text style={[styles.orderDetailLabel, { color: colors.textSecondary },{
                                                ...Platform.select({
                                                    ios: {
                                                        textAlign:isRTL ? "left" : ""
                                                    }
                                                }),
                                            }]}>
                                                {translations[language]?.routes?.phone || "Phone"}:
                                            </Text>
                                            <Text style={[styles.orderDetailText, { color: colors.text },{
                                                ...Platform.select({
                                                    ios: {
                                                        textAlign:isRTL ? "left" : ""
                                                    }
                                                }),
                                            }]}>
                                                {order.receiver_mobile}
                                            </Text>
                                        </View>

                                        <View style={[styles.orderDetailItem]}>
                                            <Feather name="package" size={16} color={colors.textSecondary} />
                                            <Text style={[styles.orderDetailLabel, { color: colors.textSecondary },{
                                                ...Platform.select({
                                                    ios: {
                                                        textAlign:isRTL ? "left" : ""
                                                    }
                                                }),
                                            }]}>
                                                {translations[language].tabs?.orders?.order?.orderType || "Order Type"}:
                                            </Text>
                                            <Text style={[styles.orderDetailText, { color: colors.text },{
                                                ...Platform.select({
                                                    ios: {
                                                        textAlign:isRTL ? "left" : ""
                                                    }
                                                }),
                                            }]}>
                                                {order.order_type}
                                            </Text>
                                        </View>

                                        <View style={[styles.orderDetailItem]}>
                                            <MaterialIcons name="payment" size={16} color={colors.textSecondary} />
                                            <Text style={[styles.orderDetailLabel, { color: colors.textSecondary },{
                                                ...Platform.select({
                                                    ios: {
                                                        textAlign:isRTL ? "left" : ""
                                                    }
                                                }),
                                            }]}>
                                                {translations[language].tabs?.orders?.track?.paymentType || "Payment Type"}:
                                            </Text>
                                            <Text style={[styles.orderDetailText, { color: colors.text },{
                                                ...Platform.select({
                                                    ios: {
                                                        textAlign:isRTL ? "left" : ""
                                                    }
                                                }),
                                            }]}>
                                                {order.payment_type}
                                            </Text>
                                        </View>

                                        <View style={[styles.orderDetailItem]}>
                                            <MaterialIcons name="attach-money" size={16} color={colors.textSecondary} />
                                            <Text style={[styles.orderDetailLabel, { color: colors.textSecondary },{
                                                ...Platform.select({
                                                    ios: {
                                                        textAlign:isRTL ? "left" : ""
                                                    }
                                                }),
                                            }]}>
                                               {order.order_type_key === "receive" ?  translations[language].tabs?.orders?.create?.sections?.cost?.fields?.packageCost : 
                                                order.order_type_key === "payment" ? translations[language].tabs?.orders?.create?.sections?.cost?.fields?.amount : 
                                                translations[language].tabs?.orders?.create?.sections?.cost?.fields?.totalPackageCost}:
                                            </Text>
                                            <Text style={[styles.orderDetailText, { color: colors.text },{
                                                ...Platform.select({
                                                    ios: {
                                                        textAlign:isRTL ? "left" : ""
                                                    }
                                                }),
                                            }]}>
                                                {order.cod_value}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity 
                                            style={[styles.actionButton, styles.callButton]}
                                            onPress={() => handleCall(order.receiver_mobile, order)}
                                        >
                                            <Feather name="phone" size={16} color={colors.success} />
                                            <Text style={[styles.callButtonText,{color: colors.success}]}>
                                                {translations[language]?.routes?.call || "Call"}
                                            </Text>
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity 
                                            style={[styles.actionButton, styles.messageButton]}
                                            onPress={() => handleMessage(order.receiver_mobile, order)}
                                        >
                                            <Feather name="message-square" size={16} color={colors.primary} />
                                            <Text style={[styles.messageButtonText,{color: colors.primary}]}>
                                                {translations[language]?.routes?.message || "Message"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    
                                    {/* Only show status update button if the current status is allowed */}
                                    {allowedStatuses.includes(orderStatus[order.id]) && (
                                        <View style={styles.deliveryButtons}>
                                            <TouchableOpacity 
                                                style={[styles.deliveryButton, styles.updateStatusButton]}
                                                onPress={() => handleStatusUpdate(order)}
                                            >
                                                <Feather name="edit-2" size={16} color="#FFFFFF" />
                                                <Text style={styles.updateStatusButtonText}>
                                                    {translations[language]?.routes?.changeStatus || "Update Status"}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                    {isLoadingMore && <LoadingIndicator />}
                </ScrollView>
            </View>
            
            {showStatusUpdateModal && (
                <ModalPresentation
                    showModal={showStatusUpdateModal}
                    setShowModal={setShowStatusUpdateModal}
                    customStyles={{ bottom: 15 }}
                >
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalHeaderText,
                            {
                                ...Platform.select({
                                    ios: {
                                        textAlign:isRTL ? "left" : ""
                                    }
                                }),
                            }]}>
                            {translations[language]?.routes?.selectStatus || "Select Status"}
                        </Text>
                    </View>
                    <View style={styles.reasonContainer}>
                        {statusOptions.map((status, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.reasonOption,{backgroundColor: colors.surface,borderColor: colors.border}
                                ]}
                                onPress={() => handleStatusSelect(status)}
                            >
                                <Text style={[styles.reasonText,{
                                    color: colors.text,
                                    ...Platform.select({
                                        ios: {
                                            textAlign:isRTL ? "left" : ""
                                        },
                                    }),
                                }]}>
                                    {status.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ModalPresentation>
            )}
            
            {showReasonModal && (
                <ModalPresentation
                    showModal={showReasonModal}
                    setShowModal={setShowReasonModal}
                    customStyles={{ bottom: 15 }}
                >
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalHeaderText,{
                            ...Platform.select({
                                ios: {
                                    textAlign:isRTL ? "left" : ""
                                }
                            }),
                        }]}>
                            {translations[language]?.routes?.selectReason || "Select Reason"}
                        </Text>
                    </View>
                    
                    {/* Add search input */}
                    <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                        <Feather name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder={translations[language]?.common?.search || "Search reasons..."}
                            placeholderTextColor={colors.textSecondary}
                            value={reasonSearchQuery}
                            onChangeText={handleReasonSearch}
                        />
                        {reasonSearchQuery ? (
                            <TouchableOpacity onPress={() => handleReasonSearch('')}>
                                <Feather name="x" size={18} color={colors.textSecondary} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                    
                    {/* Make the reason container scrollable with fixed height */}
                    <ScrollView 
                        style={[styles.reasonScrollContainer]}
                        contentContainerStyle={styles.reasonContainer}
                        showsVerticalScrollIndicator={true}
                    >
                        {filteredReasons.length > 0 ? (
                            filteredReasons.map((reason, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.reasonOption,{backgroundColor: colors.surface,borderColor: colors.border}
                                    ]}
                                    onPress={() => handleReasonSelect(reason)}
                                >
                                    <Text style={[styles.reasonText,{
                                        color: colors.text,
                                        ...Platform.select({
                                            ios: {
                                                textAlign:isRTL ? "left" : ""
                                            }
                                        }),
                                    }]}>
                                        {reason.label}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                                {translations[language]?.common?.noResults || "No results found"}
                            </Text>
                        )}
                    </ScrollView>
                </ModalPresentation>
            )}
            
            {showConfirmModal && (
                <ModalPresentation
                    showModal={showConfirmModal}
                    setShowModal={setShowConfirmModal}
                    customStyles={{ bottom: 15 }}
                >
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalHeaderText,{
                            color: colors.text,
                            ...Platform.select({
                                ios: {
                                    textAlign:isRTL ? "left" : ""
                                }
                            }),
                        }]}>
                            {translations[language]?.routes?.confirmStatusChange || "Confirm Status Change"}
                        </Text>
                    </View>
                    <View style={styles.confirmContainer}>
                        <Text style={[styles.confirmText,{
                            color: colors.text,
                            ...Platform.select({
                                ios: {
                                    textAlign:isRTL ? "left" : ""
                                }
                            }),
                        }]}>
                            {translations[language]?.routes?.confirmStatusChangeMessage || "Are you sure you want to change the status to"} {selectedStatus?.label}?
                        </Text>
                        {selectedReason && (
                            <Text style={[styles.reasonText,{
                                color: colors.text,
                                ...Platform.select({
                                    ios: {
                                        textAlign:isRTL ? "left" : ""
                                    }
                                }),
                            }]}>
                                {translations[language]?.routes?.reason || "Reason"}: {selectedReason.label}
                            </Text>
                        )}
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[styles.confirmButton, styles.cancelButton]}
                                onPress={() => {
                                    setShowConfirmModal(false);
                                    setSelectedStatus(null);
                                    setSelectedReason(null);
                                    setPendingRescheduleOrder(null);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>
                                    {translations[language]?.common?.cancel || "Cancel"}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, styles.submitButton]}
                                onPress={confirmStatusUpdate}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.submitButtonText}>
                                        {translations[language]?.common?.confirm || "Confirm"}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ModalPresentation>
            )}
            
            {showCallOptionsModal && (
                <ModalPresentation
                    showModal={showCallOptionsModal}
                    setShowModal={setShowCallOptionsModal}
                    customStyles={{ bottom: 15 }}
                >
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalHeaderText,{
                            color: colors.text,
                            ...Platform.select({
                                ios: {
                                    textAlign:isRTL ? "left" : ""
                                }
                            }),
                        }]}>
                            {translations[language]?.routes?.callOptions}
                        </Text>
                    </View>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={[styles.modalOption,{borderColor: colors.border}]}
                            onPress={() => {
                                setShowCallOptionsModal(false);
                                // Record contact history for phone call
                                recordContactHistory('اتصال هاتفي');
                                Linking.openURL(`tel:${currentPhoneNumber}`);
                            }}
                        >
                            <Text style={[styles.modalOptionText,{
                                color: colors.text,
                                ...Platform.select({
                                    ios: {
                                        textAlign:isRTL ? "left" : ""
                                    }
                                }),
                            }]}>
                                {translations[language]?.routes?.regularCall}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.modalOption,{borderColor: colors.border}]}
                            onPress={() => {
                                setShowCallOptionsModal(false);
                                const whatsappNumber = currentPhoneNumber.startsWith('0') ? 
                                    currentPhoneNumber.substring(1) : currentPhoneNumber;
                                // Record contact history for WhatsApp 972
                                recordContactHistory('whatsapp_972');
                                const message = generateWhatsAppMessage(currentOrderForContact);
                                Linking.openURL(`whatsapp://send?phone=972${whatsappNumber}&text=${encodeURIComponent(message)}`);
                            }}
                        >
                            <Text style={[styles.modalOptionText,{
                                color: colors.text,
                                ...Platform.select({
                                    ios: {
                                        textAlign:isRTL ? "left" : ""
                                    }
                                }),
                            }]}> {translations[language]?.routes?.whatsapp} (972)</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.modalOption,{borderColor: colors.border}]}
                            onPress={() => {
                                setShowCallOptionsModal(false);
                                const whatsappNumber = currentPhoneNumber.startsWith('0') ? 
                                    currentPhoneNumber.substring(1) : currentPhoneNumber;
                                // Record contact history for WhatsApp 970
                                recordContactHistory('whatsapp_970');
                                const message = generateWhatsAppMessage(currentOrderForContact);
                                Linking.openURL(`whatsapp://send?phone=970${whatsappNumber}&text=${encodeURIComponent(message)}`);
                            }}
                        >
                            <Text style={[styles.modalOptionText,{
                                color: colors.text,
                                ...Platform.select({
                                    ios: {
                                        textAlign:isRTL ? "left" : ""
                                    }
                                }),
                            }]}> {translations[language]?.routes?.whatsapp} (970)</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.modalOption, styles.cancelOption]}
                            onPress={() => {
                                setShowCallOptionsModal(false);
                                setCurrentPhoneNumber(null);
                            }}
                        >
                            <Text style={[styles.cancelOptionText,{
                                color: colors.text,
                                ...Platform.select({
                                    ios: {
                                        textAlign:isRTL ? "left" : ""
                                    }
                                }),
                            }]}>
                                {translations[language]?.routes?.cancel}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ModalPresentation>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    progressContainer: {
        marginVertical:10,
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10B981',
    },
    routeInfoText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#10B981',
        borderRadius: 3,
    },
    viewToggle: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        margin: 16,
        padding: 4,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 6,
    },
    activeToggleButton: {
        backgroundColor: '#4361EE',
    },
    toggleText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    activeToggleText: {
        color: '#FFFFFF',
    },
    mapContainer: {
        flex: 1,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    currentLocationMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(67, 97, 238, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentLocationDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4361EE',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    customMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#94A3B8',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentMarker: {
        backgroundColor: '#4361EE',
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    deliveredMarker: {
        backgroundColor: '#10B981',
    },
    rescheduledMarker: {
        backgroundColor: '#F59E0B',
    },
    markerNumber: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    navigationControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    disabledNavButton: {
        opacity: 0.5,
    },
    navButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4361EE',
    },
    disabledNavButtonText: {
        color: '#94A3B8',
    },
    currentDestination: {
        backgroundColor: '#F1F5F9',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    currentDestinationText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    currentOrderCard: {
        position: 'absolute',
        bottom: 80,
        left: 16,
        right: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    currentOrderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    currentOrderInfo: {
        flex: 1,
    },
    currentOrderName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    currentOrderAddress: {
        fontSize: 14,
        color: '#64748B',
    },
    callIconButton: {
        marginLeft: 12,
        borderRadius: 20,
        overflow: 'hidden',
    },
    callIconGradient: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentOrderActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    directionsIconButton: {
        alignItems: 'center',
    },
    directionsIconGradient: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    deliveredIconButton: {
        alignItems: 'center',
    },
    deliveredIconBackground: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    rescheduleIconButton: {
        alignItems: 'center',
    },
    rescheduleIconBackground: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    iconButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingBottom: 40
    },
    listItemCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#94A3B8',
        overflow: 'hidden',
    },
    currentListItem: {
        borderLeftColor: '#4361EE',
    },
    deliveredListItem: {
        borderLeftColor: '#10B981',
    },
    rescheduledListItem: {
        borderLeftColor: '#F59E0B',
    },
    expandedListItem: {
        borderLeftWidth: 4,
    },
    listItemHeader: {
        flexDirection: 'row',
        padding: 12,
        gap:10
    },
    orderNumberContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#94A3B8',
        justifyContent: 'center',
        alignItems: 'center'
    },
    orderNumber: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    listItemTitleContainer: {
        flex: 1,
    },
    listItemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    listItemAddress: {
        fontSize: 13,
        color: '#64748B',
    },
    listItemStatus: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    expandedContent: {
        padding: 12,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    orderDetails: {
        marginTop: 16,
        marginBottom: 16,
    },
    orderDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap:4
    },
    orderDetailLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
    },
    orderDetailText: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
    },
    actionButtons: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    callButton: {
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
    },
    callButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#4361EE',
    },
    messageButton: {
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
    },
    messageButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#4361EE',
    },
    directionsButton: {
        backgroundColor: '#4361EE',
    },
    directionsButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    deliveryButtons: {
        flexDirection: 'row',
    },
    deliveryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    deliveredButton: {
        backgroundColor: '#10B981',
    },
    deliveredButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    rescheduleButton: {
        backgroundColor: '#F59E0B',
    },
    rescheduleButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#64748B',
    },
    markerTitle: {
        position: 'absolute',
        top: -24,
        backgroundColor: 'white',
        padding: 2,
        borderRadius: 4,
        fontSize: 10,
        color: '#333',
        fontWeight: '500',
    },
    modalHeader: {
        backgroundColor: '#4361EE',
        padding: 16,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    modalHeaderText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    reasonContainer: {
        padding: 16,
    },
    reasonOption: {
        padding: 12,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        marginBottom: 8,
    },
    reasonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    confirmContainer: {
        padding: 16,
    },
    confirmText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 16,
    },
    confirmButtons: {
        marginTop: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    confirmButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#E2E8F0',
    },
    submitButton: {
        backgroundColor: '#4361EE',
    },
    cancelButtonText: {
        color: '#64748B',
        fontWeight: '600',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    updateStatusButton: {
        backgroundColor: '#4361EE',
        flex: 1,
        marginHorizontal: 4,
    },
    updateStatusButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    updateStatusIconButton: {
        alignItems: 'center',
    },
    updateStatusIconBackground: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    loadingMoreContainer: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    loadingMoreText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#64748B',
    },
    modalContent: {
        padding: 16,
    },
    modalOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalOptionText: {
        fontSize: 16,
        color: '#333',
    },
    cancelOption: {
        borderBottomWidth: 0,
    },
    cancelOptionText: {
        fontSize: 16,
        color: '#64748B',
    },
    // Add new styles for search and scrollable container
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 14,
    },
    reasonScrollContainer: {
        maxHeight: 400, // Fixed height for the scrollable area
    },
    noResultsText: {
        textAlign: 'center',
        padding: 16,
        fontSize: 14,
    },
});