import { View, StyleSheet, Text, TouchableOpacity, StatusBar, Alert, ActivityIndicator, TextInput, Platform, ScrollView } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../utils/languageContext';
import { useAuth } from "../../RootLayout";
import { translations } from '../../utils/languageContext';
import { getToken } from "../../utils/secureStore";
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import FixedHeader from "../../components/FixedHeader";
import { router, useLocalSearchParams, Stack } from 'expo-router';
// import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
// import * as Location from 'expo-location';
import { Linking } from 'react-native';
import ModalPresentation from "../../components/ModalPresentation";

export default function RouteNavigate() {
    const { language } = useLanguage();
    const { user } = useAuth();
    const params = useLocalSearchParams();
    const { routeId } = params;
    
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
    
    const mapRef = useRef(null);
    
    // Check if user has appropriate role
    const isAllowed = ["driver", "delivery_company"].includes(user.role);
    
    // Add these status options
    const statusOptions = [
        {
            label: translations[language].tabs?.orders?.order?.states?.rescheduleReasons?.title,
            value: "reschedule",
            requiresReason: true,
            reasons: [
                { value: 'receiver_request', label: translations[language].tabs?.orders?.order?.states?.rescheduleReasons?.receiverRequest || "Receiver Request" },
                { value: 'customer_unavailable', label: translations[language].tabs?.orders?.order?.states?.rescheduleReasons?.receiverUnavailable || "Customer Unavailable" },
                { value: 'incorrect_timing', label: translations[language].tabs?.orders?.order?.states?.rescheduleReasons?.incorrectTiming || "Incorrect Timing" },
                { value: 'business_request', label: translations[language].tabs?.orders?.order?.states?.rescheduleReasons?.businessRequest || "Business Request" },
                { value: 'delivery_overload', label: translations[language].tabs?.orders?.order?.states?.rescheduleReasons?.deliveryOverload || "Delivery Overload" }
            ]
        },
        {
            label: translations[language].tabs?.orders?.order?.states?.return_before_delivered_initiated?.title,
            value: "return_before_delivered_initiated",
            requiresReason: true,
            reasons: [
                { value: 'business_cancellation', label: translations[language].tabs?.orders?.order?.states?.return_before_delivered_initiated?.businessCancellation || "Business Cancellation" },
                { value: 'receiver_cancellation', label: translations[language].tabs?.orders?.order?.states?.return_before_delivered_initiated?.receiverCancellation || "Receiver Cancellation" },
                { value: 'address_error', label: translations[language].tabs?.orders?.order?.states?.return_before_delivered_initiated?.addressError || "Address Error" },
                { value: 'no_response', label: translations[language].tabs?.orders?.order?.states?.return_before_delivered_initiated?.noResponse || "No Response" }
            ]
        },
        {
            label: translations[language].tabs?.orders?.order?.states?.return_after_delivered_initiated?.title,
            value: "return_after_delivered_initiated",
            requiresReason: true,
            reasons: [
                { value: 'business_cancellation', label: translations[language].tabs?.orders?.order?.states?.return_after_delivered_initiated?.businessCancellation || "Business Cancellation" },
                { value: 'receiver_cancellation', label: translations[language].tabs?.orders?.order?.states?.return_after_delivered_initiated?.receiverCancellation || "Receiver Cancellation" },
                { value: 'payment_failure', label: translations[language].tabs?.orders?.order?.states?.return_after_delivered_initiated?.paymentFailure || "Payment Failure" },
                { value: 'address_error', label: translations[language].tabs?.orders?.order?.states?.return_after_delivered_initiated?.addressError || "Address Error" },
                { value: 'no_response', label: translations[language].tabs?.orders?.order?.states?.return_after_delivered_initiated?.noResponse || "No Response" },
                { value: 'package_issue', label: translations[language].tabs?.orders?.order?.states?.return_after_delivered_initiated?.packageIssue || "Package Issue" }
            ]
        },
        {
            label: translations[language].tabs?.orders?.order?.states?.delivered,
            value: "delivered"
        },
        {
            label: translations[language].tabs?.orders?.order?.states?.received,
            value: "received"
        },
        {
            label: translations[language].tabs?.orders?.order?.states?.delivered_received,
            value: "delivered/received"
        }
    ];
    
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
    
    const handleCall = (phoneNumber) => {
        if (!phoneNumber) return;
        
        setCurrentPhoneNumber(phoneNumber);
        setShowCallOptionsModal(true);
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
            setShowReasonModal(true);
        } else {
            setShowConfirmModal(true);
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
                return '#10B981'; // Green
            case 'on_the_way':
            case'driver_responsibility':
                return '#4361EE'; // Blue
            case 'pending':
                return '#F59E0B'; // Yellow
            case 'reschedule':
                return '#F59E0B'; // Yellow
            case 'return_before_delivered_initiated':
            case 'return_after_delivered_initiated':
            case 'cancelled':
                return '#EF4444'; // Red
            default:
                return '#64748B'; // Gray
        }
    };

    
    if (!isAllowed) {
        return null; // Will be redirected in useEffect
    }
    
    if (loading || !route) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
                <FixedHeader 
                    title={translations[language].routes?.navigation || "Route Navigation"} 
                    showBackButton={true} 
                />
                
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4361EE" />
                    <Text style={styles.loadingText}>
                        {translations[language].common?.loading || "Loading..."}
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
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            <FixedHeader 
                title={safeRoute.name} 
                showBackButton={true} 
            />
            
            <View style={styles.progressContainer}>
                <View style={styles.progressInfo}>
                    <Text style={styles.progressText}>
                        {deliveredCount}/{totalOrders} {translations[language].routes?.delivered || "Delivered"}
                    </Text>
                    <Text style={styles.routeInfoText}>
                        {translations[language].routes?.stop || "Stop"} {currentIndex + 1}/{totalOrders}
                    </Text>
                </View>
                <View style={styles.progressBarContainer}>
                    <View 
                        style={[
                            styles.progressBar, 
                            { width: `${(deliveredCount / totalOrders) * 100}%` }
                        ]} 
                    />
                </View>
            </View>
            
            <View style={styles.viewToggle}>
                {/* <TouchableOpacity 
                    style={[styles.toggleButton, viewMode === 'map' && styles.activeToggleButton]}
                    onPress={() => setViewMode('map')}
                >
                    <Ionicons name="map" size={16} color={viewMode === 'map' ? "#FFFFFF" : "#64748B"} />
                    <Text style={[styles.toggleText, viewMode === 'map' && styles.activeToggleText]}>
                        {translations[language].routes?.map || "Map"}
                    </Text>
                </TouchableOpacity> */}
                
                <TouchableOpacity 
                    style={[styles.toggleButton, viewMode === 'list' && styles.activeToggleButton]}
                    onPress={() => setViewMode('list')}
                >
                    <Feather name="list" size={16} color={viewMode === 'list' ? "#FFFFFF" : "#64748B"} />
                    <Text style={[styles.toggleText, viewMode === 'list' && styles.activeToggleText]}>
                        {translations[language].routes?.list || "List"}
                    </Text>
                </TouchableOpacity>
            </View>
            
            {viewMode === 'map' ? (
                // <View style={styles.mapContainer}>
                //     <MapView
                //         ref={mapRef}
                //         style={styles.map}
                //         provider={PROVIDER_GOOGLE}
                //         initialRegion={{
                //             latitude: currentOrder?.latitude || 32.0853,
                //             longitude: currentOrder?.longitude || 34.7818,
                //             latitudeDelta: 0.05,
                //             longitudeDelta: 0.05,
                //         }}
                //         showsUserLocation={true}
                //         followsUserLocation={true}
                //         showsMyLocationButton={true}
                //     >
                //         {location && location.coords && 
                //          !isNaN(Number(location.coords.latitude)) && 
                //          !isNaN(Number(location.coords.longitude)) && (
                //             <Marker
                //                 coordinate={{
                //                     latitude: Number(location.coords.latitude),
                //                     longitude: Number(location.coords.longitude),
                //                 }}
                //             >
                //                 <View style={styles.currentLocationMarker}>
                //                     <View style={styles.currentLocationDot} />
                //                     <Text style={styles.markerTitle}>
                //                         {translations[language].routes?.yourLocation || "Your Location"}
                //                     </Text>
                //                 </View>
                //             </Marker>
                //         )}
                        
                //         {safeOrders.map((order, index) => {
                //             // Check if latitude and longitude are valid numbers before rendering the marker
                //             if (!order.latitude || !order.longitude || 
                //                 isNaN(Number(order.latitude)) || isNaN(Number(order.longitude))) {
                //                 return null; // Skip this marker if coordinates are invalid
                //             }
                            
                //             return (
                //                 <Marker
                //                     key={order.id}
                //                     coordinate={{
                //                         latitude: 1, // Ensure it's a number
                //                         longitude: 1, // Ensure it's a number
                //                     }}
                //                 >
                //                     <View style={[
                //                         styles.customMarker,
                //                         index === currentIndex && styles.currentMarker,
                //                         orderStatus[order.id] === 'delivered' && styles.deliveredMarker,
                //                         orderStatus[order.id] === 'reschedule' && styles.rescheduledMarker
                //                     ]}>
                //                         <Text style={styles.markerNumber}>{index + 1}</Text>
                //                     </View>
                //                 </Marker>
                //             );
                //         })}
                        
                //         {/* Draw route lines between points */}
                //         {safeOrders.length > 1 && (
                //             <Polyline
                //                 coordinates={safeOrders.map(order => ({
                //                     latitude:1,
                //                     longitude: 1,
                //                 }))}
                //                 strokeColor="#4361EE"
                //                 strokeWidth={3}
                //                 lineDashPattern={[1]}
                //             />
                //         )}
                //     </MapView>
                // </View>
                <></>
            ) : (
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
                                    index === currentIndex && styles.currentListItem,
                                    orderStatus[order.id] === 'delivered' && styles.deliveredListItem,
                                    orderStatus[order.id] === 'reschedule' && styles.rescheduledListItem,
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
                                        <Text style={[styles.listItemName]}>
                                            {order.receiver_name}
                                        </Text>
                                        <Text style={[styles.listItemAddress]}>
                                            {order.receiver_address}
                                        </Text>
        
                                        {(order.delivery_info.to_branch || order.delivery_info.to_driver) && (
                                            <Text style={[styles.listItemAddress]}>
                                                {translations[language].routes?.dispatchTo} {order.delivery_info.to_branch || order.delivery_info.to_driver}
                                            </Text>
                                        )}
                                    </View>
                                    
                                    <View style={styles.listItemStatus}>
                                        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(orderStatus[order.id])}20` }]}>
                                            <Text style={[styles.statusText, { color: getStatusColor(orderStatus[order.id]) }]}>
                                                {order.delivery_info.status}
                                            </Text>
                                        </View>
                                        <MaterialIcons 
                                            name={expandedOrder === order.id ? "expand-less" : "expand-more"} 
                                            size={24} 
                                            color="#94A3B8" 
                                        />
                                    </View>
                                </View>
                                
                                {expandedOrder === order.id && (
                                    <View style={styles.expandedContent}>
                                        <View style={styles.orderDetails}>
                                            <View style={[styles.orderDetailItem]}>
                                                <Feather name="package" size={16} color="#64748B" />
                                                <Text style={[styles.orderDetailLabel]}>
                                                    {translations[language].routes?.orderId || "Order ID"}:
                                                </Text>
                                                <Text style={styles.orderDetailText}>
                                                    {order.order_id}
                                                </Text>
                                            </View>
                                            
                                            <View style={[styles.orderDetailItem]}>
                                                <Feather name="phone" size={16} color="#64748B" />
                                                <Text style={[styles.orderDetailLabel]}>
                                                    {translations[language].routes?.phone || "Phone"}:
                                                </Text>
                                                <Text style={styles.orderDetailText}>
                                                    {order.receiver_mobile}
                                                </Text>
                                            </View>

                                            <View style={[styles.orderDetailItem]}>
                                                <Feather name="package" size={16} color="#64748B" />
                                                <Text style={[styles.orderDetailLabel]}>
                                                    {translations[language].tabs?.orders?.order?.orderType || "Order Type"}:
                                                </Text>
                                                <Text style={styles.orderDetailText}>
                                                    {order.order_type}
                                                </Text>
                                            </View>

                                            <View style={[styles.orderDetailItem]}>
                                                <MaterialIcons name="payment" size={16} color="#64748B" />
                                                <Text style={[styles.orderDetailLabel]}>
                                                    {translations[language].tabs?.orders?.track?.paymentType || "Payment Type"}:
                                                </Text>
                                                <Text style={styles.orderDetailText}>
                                                    {order.payment_type}
                                                </Text>
                                            </View>

                                            <View style={[styles.orderDetailItem]}>
                                                <MaterialIcons name="attach-money" size={16} color="#64748B" />
                                                <Text style={[styles.orderDetailLabel]}>
                                                   {order.order_type_key === "receive" ?  translations[language].tabs?.orders?.create?.sections?.cost?.fields?.packageCost : 
                                                    order.order_type_key === "payment" ? translations[language].tabs?.orders?.create?.sections?.cost?.fields?.amount : 
                                                    translations[language].tabs?.orders?.create?.sections?.cost?.fields?.totalPackageCost}:
                                                </Text>
                                                <Text style={styles.orderDetailText}>
                                                    {order.cod_value}
                                                </Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.actionButtons}>
                                            <TouchableOpacity 
                                                style={[styles.actionButton, styles.callButton]}
                                                onPress={() => handleCall(order.receiver_mobile)}
                                            >
                                                <Feather name="phone" size={16} color="#4361EE" />
                                                <Text style={styles.callButtonText}>
                                                    {translations[language].routes?.call || "Call"}
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
                                                        {translations[language].routes?.changeStatus || "Update Status"}
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
            )}
            
            {/* <View style={styles.navigationControls}>
                <TouchableOpacity 
                    style={[styles.navButton, currentIndex === 0 && styles.disabledNavButton]}
                    onPress={navigateToPrevOrder}
                    disabled={currentIndex === 0}
                >
                    <Feather name="chevron-left" size={24} color={currentIndex === 0 ? "#94A3B8" : "#4361EE"} />
                    <Text style={[styles.navButtonText, currentIndex === 0 && styles.disabledNavButtonText]}>
                        {translations[language].routes?.previous || "Previous"}
                    </Text>
                </TouchableOpacity>
                
                <View style={styles.currentDestination}>
                    <Text style={styles.currentDestinationText}>
                        {currentIndex + 1}/{safeOrders.length}
                    </Text>
                </View>
                
                <TouchableOpacity 
                    style={[styles.navButton, currentIndex === safeOrders.length - 1 && styles.disabledNavButton]}
                    onPress={navigateToNextOrder}
                    disabled={currentIndex === safeOrders.length - 1}
                >
                    <Text style={[styles.navButtonText, currentIndex === safeOrders.length - 1 && styles.disabledNavButtonText]}>
                        {translations[language].routes?.next || "Next"}
                    </Text>
                    <Feather name="chevron-right" size={24} color={currentIndex === safeOrders.length - 1 ? "#94A3B8" : "#4361EE"} />
                </TouchableOpacity>
            </View> */}
            
            {viewMode === 'map' && (
                <View style={styles.currentOrderCard}>
                    <View style={[styles.currentOrderHeader]}>
                        <View style={styles.currentOrderInfo}>
                            <Text style={[styles.currentOrderName]}>
                                {currentOrder?.receiver_name}
                            </Text>
                            <Text style={[styles.currentOrderAddress]}>
                                {currentOrder?.receiver_address}
                            </Text>
                        </View>
                        
                        {/* Only show status update button if the current status is allowed */}
                        {allowedStatuses.includes(orderStatus[currentOrder?.id]) && (
                            <TouchableOpacity 
                                style={styles.updateStatusIconButton}
                                onPress={() => handleStatusUpdate(currentOrder)}
                            >
                                <View style={styles.updateStatusIconBackground}>
                                    <Feather name="edit-2" size={24} color="#4361EE" />
                                </View>
                                <Text style={styles.iconButtonText}>
                                    {translations[language].routes?.changeStatus || "Update Status"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    <View style={styles.currentOrderActions}>
                        <TouchableOpacity 
                            style={styles.directionsIconButton}
                            onPress={() => handleDirections(currentOrder)}
                        >
                            <LinearGradient
                                colors={['#4361EE', '#3A0CA3']}
                                style={styles.directionsIconGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Feather name="navigation" size={24} color="#FFFFFF" />
                            </LinearGradient>
                            <Text style={styles.iconButtonText}>
                                {translations[language].routes?.navigate || "Navigate"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            
            {showStatusUpdateModal && (
                <ModalPresentation
                    showModal={showStatusUpdateModal}
                    setShowModal={setShowStatusUpdateModal}
                    customStyles={{ bottom: 15 }}
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalHeaderText}>
                            {translations[language].routes?.selectStatus || "Select Status"}
                        </Text>
                    </View>
                    <View style={styles.reasonContainer}>
                        {statusOptions.map((status, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.reasonOption
                                ]}
                                onPress={() => handleStatusSelect(status)}
                            >
                                <Text style={[styles.reasonText]}>
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
                        <Text style={styles.modalHeaderText}>
                            {translations[language].routes?.selectReason || "Select Reason"}
                        </Text>
                    </View>
                    <View style={styles.reasonContainer}>
                        {selectedStatus?.reasons?.map((reason, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.reasonOption
                                ]}
                                onPress={() => handleReasonSelect(reason)}
                            >
                                <Text style={[styles.reasonText]}>
                                    {reason.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ModalPresentation>
            )}
            
            {showConfirmModal && (
                <ModalPresentation
                    showModal={showConfirmModal}
                    setShowModal={setShowConfirmModal}
                    customStyles={{ bottom: 15 }}
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalHeaderText}>
                            {translations[language].routes?.confirmStatusChange || "Confirm Status Change"}
                        </Text>
                    </View>
                    <View style={styles.confirmContainer}>
                        <Text style={[styles.confirmText]}>
                            {translations[language].routes?.confirmStatusChangeMessage || "Are you sure you want to change the status to"} {selectedStatus?.label}?
                        </Text>
                        {selectedReason && (
                            <Text style={[styles.reasonText]}>
                                {translations[language].routes?.reason || "Reason"}: {selectedReason.label}
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
                                    {translations[language].common?.cancel || "Cancel"}
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
                                        {translations[language].common?.confirm || "Confirm"}
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
                        <Text style={styles.modalHeaderText}>
                            {translations[language].routes?.callOptions}
                        </Text>
                    </View>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                setShowCallOptionsModal(false);
                                Linking.openURL(`tel:${currentPhoneNumber}`);
                            }}
                        >
                            <Text style={styles.modalOptionText}>
                                {translations[language].routes?.regularCall}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                setShowCallOptionsModal(false);
                                const whatsappNumber = currentPhoneNumber.startsWith('0') ? 
                                    currentPhoneNumber.substring(1) : currentPhoneNumber;
                                Linking.openURL(`whatsapp://send?phone=972${whatsappNumber}`);
                            }}
                        >
                            <Text style={styles.modalOptionText}> {translations[language].routes?.whatsapp} (972)</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                setShowCallOptionsModal(false);
                                const whatsappNumber = currentPhoneNumber.startsWith('0') ? 
                                    currentPhoneNumber.substring(1) : currentPhoneNumber;
                                Linking.openURL(`whatsapp://send?phone=970${whatsappNumber}`);
                            }}
                        >
                            <Text style={styles.modalOptionText}> {translations[language].routes?.whatsapp} (970)</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.modalOption, styles.cancelOption]}
                            onPress={() => {
                                setShowCallOptionsModal(false);
                                setCurrentPhoneNumber(null);
                            }}
                        >
                            <Text style={styles.cancelOptionText}>
                                {translations[language].routes?.cancel}
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
});