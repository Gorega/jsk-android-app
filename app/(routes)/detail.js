import { View, StyleSheet, Text, TouchableOpacity, StatusBar, Alert, ActivityIndicator, FlatList, TextInput } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../utils/languageContext';
import { useAuth } from "../../RootLayout";
import { translations } from '../../utils/languageContext';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import DraggableFlatList from 'react-native-draggable-flatlist';
// import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
// import * as Location from 'expo-location';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Modal from 'react-native-modal';
import { useSocket } from '../../utils/socketContext';
import FixedHeader from "../../components/FixedHeader";
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';

export default function RouteDetail() {
    const socket = useSocket();
    const { language } = useLanguage();
    const { user } = useAuth();
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const params = useLocalSearchParams();
    const { routeId } = params;
    const mapRef = useRef(null);
    
    // Main state
    const [loading, setLoading] = useState(true);
    const [route, setRoute] = useState(null);
    const [orders, setOrders] = useState([]);
    const [routeName, setRouteName] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    
    // UI state
    const [showMap, setShowMap] = useState(false);
    
    // Operation state
    const [optimizing, setOptimizing] = useState(false);
    const [savingRoute, setSavingRoute] = useState(false);
    const [removingOrder, setRemovingOrder] = useState(false);
    
    // Order selection state - moved to separate modal
    const [orderSelectionVisible, setOrderSelectionVisible] = useState(false);
    
    // Check if user has appropriate role
    const isAllowed = ["driver", "delivery_company", "admin", "manager"].includes(user?.role);
    const canEdit = ["driver", "delivery_company"].includes(user?.role);
    const isCompleted = route?.status === 'completed';
        
    useEffect(() => {
        if (!socket) return;

        const handleRouteUpdate = (notification) => {
            switch (notification.type) {
                case 'ROUTE_UPDATED':
                    fetchRouteDetails();
                    break;
                default:
                    break;
            }
        };

        socket.on('routeUpdate', handleRouteUpdate);

        return () => {
            socket.off('routeUpdate', handleRouteUpdate);
        };
    }, [socket])

    
    useEffect(() => {
        if (!isAllowed) {
            // Redirect if not an allowed user
            Alert.alert(
                translations[language]?.common?.accessDenied || "Access Denied",
                translations[language]?.routes?.accessDeniedMessage || "This feature is only available for drivers and delivery companies.",
                [{ text: "OK", onPress: () => router.replace("/(tabs)/index") }]
            );
            return;
        }
        
        // // Get location permission and location
        // (async () => {
        //     let { status } = await Location.requestForegroundPermissionsAsync();
        //     if (status !== 'granted') {
        //         console.log('Location permission denied');
        //         return;
        //     }
            
        //     let currentLocation = await Location.getCurrentPositionAsync({});
        //     setUserLocation(currentLocation);
        // })();
        
        // Fetch route data
        fetchRouteDetails();
    }, [isAllowed, routeId, language]);
    
    const fetchRouteDetails = async () => {
        setLoading(true);
        try {
            // Check if routeId is valid before making API call
            if (!routeId) {
                const newRoute = {
                    id: 'new',
                    name: 'New Route',
                    status: 'active',
                    created_at: new Date().toISOString(),
                    orders: [],
                    optimized: false
                };
                setRoute(newRoute);
                setRouteName(newRoute.name);
                setOrders([]);
                setLoading(false);
                return;
            }
            
            // const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/driver/routes/${routeId}?language_code=${language}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    // "Cookie": token ? `token=${token}` : ""
                }
            });
            
            if (res.ok) {
                const data = await res.json();
                
                if (data && data.success && data.route) {
                    const routeData = {
                        ...data.route,
                        orders: Array.isArray(data.route.orders) ? data.route.orders : []
                    };
                    
                    setRoute(routeData);
                    setRouteName(routeData.name || '');
                    setOrders(routeData.orders || []);
                    
                    // // Focus map on first order if in map view and orders exist
                    // if (routeData.orders.length > 0 && showMap) {
                    //     setTimeout(() => {
                    //         if (mapRef.current) {
                    //             mapRef.current.animateToRegion({
                    //                 latitude: routeData.orders[0].latitude || 0,
                    //                 longitude: routeData.orders[0].longitude || 0,
                    //                 latitudeDelta: 0.05,
                    //                 longitudeDelta: 0.05,
                    //             }, 1000);
                    //         }
                    //     }, 500);
                    // }
                } else {
                    throw new Error(data.message || 'Failed to load route');
                }
            } else {
                throw new Error('Failed to load route');
            }
        } catch (error) {
            Alert.alert(
                translations[language]?.common?.error || "Error",
                translations[language]?.routes?.errorLoadingRoute || "Error loading route details"
            );
        } finally {
            setLoading(false);
        }
    };
    
    // This function now only handles opening the OrderSelectionModal
    const handleAddOrders = () => {
        if (isCompleted) {
            Alert.alert(
                translations[language]?.common?.error || "Error",
                translations[language]?.routes?.cannotModifyCompleted || "Cannot modify a completed route"
            );
            return;
        }
        
        // Show the selection modal
        setOrderSelectionVisible(true);
    };
    
    const removeOrderFromRoute = (orderId) => {
        if (isCompleted) {
            Alert.alert(
                translations[language]?.common?.error || "Error",
                translations[language]?.routes?.cannotModifyCompleted || "Cannot modify a completed route"
            );
            return;
        }
        
        Alert.alert(
            translations[language]?.routes?.removeOrder || "Remove Order",
            translations[language]?.routes?.removeOrderConfirm || "Are you sure you want to remove this order from the route?",
            [
                {
                    text: translations[language]?.common?.cancel || "Cancel",
                    style: "cancel"
                },
                {
                    text: translations[language]?.common?.remove || "Remove",
                    onPress: () => confirmRemoveOrder(orderId),
                    style: "destructive"
                }
            ]
        );
    };
    
    const confirmRemoveOrder = async (orderId) => {
        setRemovingOrder(true);
        try {
            // const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/driver/routes/${routeId}/orders/${orderId}`, {
                method: "DELETE",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    // "Cookie": token ? `token=${token}` : "",
                    "Accept-Language": language
                }
            });
            
            const data = await res.json();
            
            if (res.ok && data.success) {
                // Update route with new data from server
                if (data.route) {
                    setRoute(data.route);
                    setOrders(Array.isArray(data.route.orders) ? data.route.orders : []);
                } else {
                    // Fallback if server doesn't return updated route
                    setOrders(orders.filter(o => o.id !== orderId));
                }
            } else {
                Alert.alert(
                    translations[language]?.common?.error || "Error",
                    data.message || translations[language]?.routes?.errorRemovingOrder || "Failed to remove order from route"
                );
            }
        } catch (error) {
            Alert.alert(
                translations[language]?.common?.error || "Error",
                translations[language]?.routes?.errorRemovingOrder || "Failed to remove order from route"
            );
        } finally {
            setRemovingOrder(false);
        }
    };
    
    const handleSaveRoute = async () => {
        if (!routeName.trim()) {
            Alert.alert(
                translations[language]?.common?.error || "Error",
                translations[language]?.routes?.enterRouteName || "Please enter a route name"
            );
            return;
        }
        
        if (isCompleted) {
            Alert.alert(
                translations[language]?.common?.error || "Error",
                translations[language]?.routes?.cannotModifyCompleted || "Cannot modify a completed route"
            );
            return;
        }
        
        setSavingRoute(true);
        try {
            // const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/driver/routes/${routeId}`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    // "Cookie": token ? `token=${token}` : "",
                    "Accept-Language": language
                },
                body: JSON.stringify({ 
                    name: routeName.trim(),
                    status: route?.status || 'active',
                    orders: orders.map((order, index) => ({
                        id: order.order_id,
                        sequence: index + 1
                    }))
                })
            });
            
            const data = await res.json();
            
            if (res.ok && data.success) {
                Alert.alert(
                    translations[language]?.common?.success || "Success",
                    translations[language]?.routes?.routeSaved || "Route saved successfully",
                    [
                        {
                            text: "OK",
                            onPress: () => router.back()
                        }
                    ]
                );
            } else {
                Alert.alert(
                    translations[language]?.common?.error || "Error",
                    data.message || translations[language]?.routes?.saveFailed || "Failed to save route"
                );
            }
        } catch (error) {
            Alert.alert(
                translations[language]?.common?.error || "Error",
                translations[language]?.routes?.saveFailed || "Failed to save route"
            );
        } finally {
            setSavingRoute(false);
        }
    };
    
    // const optimizeRoute = async () => {
    //     if (orders.length < 2) {
    //         Alert.alert(
    //             translations[language]?.common?.error || "Error",
    //             translations[language]?.routes?.needMoreOrders || "You need at least 2 orders to optimize a route"
    //         );
    //         return;
    //     }
        
    //     if (isCompleted) {
    //         Alert.alert(
    //             translations[language]?.common?.error || "Error",
    //             translations[language]?.routes?.cannotModifyCompleted || "Cannot modify a completed route"
    //         );
    //         return;
    //     }
        
    //     setOptimizing(true);
        
    //     try {
    //         const token = await getToken("userToken");
    //         // Send user's current location as starting point for optimization
    //         const requestBody = {};
            
    //         if (userLocation) {
    //             requestBody.startLat = userLocation.coords.latitude;
    //             requestBody.startLng = userLocation.coords.longitude;
    //         }
            
    //         const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/driver/routes/${routeId}/optimize`, {
    //             method: "POST",
    //             credentials: "include",
    //             headers: {
    //                 'Accept': 'application/json',
    //                 "Content-Type": "application/json",
    //                 "Cookie": token ? `token=${token}` : "",
    //                 "Accept-Language": language
    //             },
    //             body: JSON.stringify(requestBody)
    //         });
            
    //         const data = await res.json();
            
    //         if (res.ok && data.success) {
    //             // Update route with optimized data from server
    //             if (data.route) {
    //                 setRoute(data.route);
    //                 setOrders(Array.isArray(data.route.orders) ? data.route.orders : []);
                    
    //                 Alert.alert(
    //                     translations[language]?.routes?.optimized || "Route Optimized",
    //                     translations[language]?.routes?.routeOptimizedMessage || "Your route has been optimized for the most efficient delivery sequence."
    //                 );
    //             } else {
    //                 throw new Error('Optimization response missing route data');
    //             }
    //         } else {
    //             Alert.alert(
    //                 translations[language]?.common?.error || "Error",
    //                 data.message || translations[language]?.routes?.optimizationFailed || "Failed to optimize route"
    //             );
    //         }
    //     } catch (error) {
    //         Alert.alert(
    //             translations[language]?.common?.error || "Error",
    //             translations[language]?.routes?.optimizationFailed || "Failed to optimize route"
    //         );
    //     } finally {
    //         setOptimizing(false);
    //     }
    // };
    
    const completeRoute = async () => {
        if (isCompleted) {
            Alert.alert(
                translations[language]?.common?.error || "Error",
                translations[language]?.routes?.alreadyCompleted || "This route is already completed"
            );
            return;
        }
        
        if (orders.length === 0) {
            Alert.alert(
                translations[language]?.common?.error || "Error",
                translations[language]?.routes?.emptyRouteCompletion || "Cannot complete an empty route"
            );
            return;
        }
        
        Alert.alert(
            translations[language]?.routes?.completeRoute || "Complete Route",
            translations[language]?.routes?.completeRouteConfirm || "Are you sure you want to mark this route as completed? This action cannot be undone.",
            [
                {
                    text: translations[language]?.common?.cancel || "Cancel",
                    style: "cancel"
                },
                {
                    text: translations[language]?.common?.complete || "Complete",
                    onPress: confirmCompleteRoute
                }
            ]
        );
    };
    
    const confirmCompleteRoute = async () => {
        setLoading(true);
        try {
            // const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/driver/routes/${routeId}/complete`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    // "Cookie": token ? `token=${token}` : ""
                }
            });
            
            const data = await res.json();
            
            if (res.ok && data.success) {
                setRoute({
                    ...route,
                    status: 'completed'
                });
                
                Alert.alert(
                    translations[language]?.common?.success || "Success",
                    translations[language]?.routes?.routeCompleted || "Route marked as completed successfully",
                    [
                        {
                            text: "OK",
                            onPress: () => router.back()
                        }
                    ]
                );
            } else {
                Alert.alert(
                    translations[language]?.common?.error || "Error",
                    data.message || translations[language]?.routes?.completionFailed || "Failed to complete route"
                );
            }
        } catch (error) {
            Alert.alert(
                translations[language]?.common?.error || "Error",
                translations[language]?.routes?.completionFailed || "Failed to complete route"
            );
        } finally {
            setLoading(false);
        }
    };
    
    const handleDragEnd = ({ data }) => {
        // Update local state with new order
        setOrders(data);
    };
    
    const renderOrderItem = useCallback(({ item, drag, isActive }) => {
        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onLongPress={!isCompleted ? drag : null}
                style={[
                    styles.orderItem,
                    { backgroundColor: colors.card },
                    isActive && [styles.orderItemActive, { shadowColor: colors.cardShadow }]
                ]}
            >
                <View style={styles.orderDragHandle}>
                    {!isCompleted && <MaterialIcons name="drag-handle" size={24} color={colors.textTertiary} />}
                </View>
                
                <View style={styles.orderContent}>
                    <View style={[styles.orderHeader]}>
                        <View style={styles.orderIdContainer}>
                            <Text style={[styles.orderId, { color: colors.primary }]}>
                                {item.order_id}
                            </Text>
                            {item.status && (
                                <View style={[styles.statusBadge, 
                                    { backgroundColor: getStatusColor(item.status) }]}>
                                    <Text style={styles.statusText}>
                                        {getStatusText(item.delivery_info.status, language)}
                                    </Text>
                                </View>
                            )}
                        </View>
                        
                        {!isCompleted && (
                            <TouchableOpacity 
                                style={[styles.orderRemoveButton, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)' }]}
                                onPress={() => removeOrderFromRoute(item.id)}
                                disabled={removingOrder}
                            >
                                <Feather name="x" size={18} color={colors.error} />
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    <Text style={[styles.orderName, { color: colors.text }]}>
                        {item.receiver_name} | {item.receiver_mobile}
                    </Text>
                    
                    <View style={[styles.addressContainer]}>
                        <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.orderAddress, { color: colors.textSecondary }]}>
                            {item.receiver_address}
                        </Text>
                    </View>

                    {(item.delivery_info.to_branch || item.delivery_info.to_driver) && <View style={[styles.availableAddressContainer]}>
                        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.availableOrderAddress, { color: colors.textSecondary }]}>
                            {translations[language]?.routes?.dispatchTo} {`${item.delivery_info.to_branch || item.delivery_info.to_driver || ''}`}
                        </Text>
                    </View>}
                </View>
            </TouchableOpacity>
        );
    }, [isCompleted, language, removingOrder, colors, isDark]);
    
    // Helper functions
    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered':
                return colors.success; // Green
            case 'on_the_way':
                return colors.primary; // Blue
            case 'driver_responsibility':
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
    
    const getStatusText = (status, language) => {
        switch (status) {
            case 'delivered':
                return translations[language]?.tabs?.orders?.filters?.delivered || "Delivered";
            case 'driver_responsibility':
                return translations[language]?.tabs?.orders?.filters?.driverResponsibility;
            case 'on_the_way':
                return translations[language]?.tabs?.orders?.filters?.onTheWay || "On the way";
            case 'pending':
                return translations[language]?.tabs?.orders?.filters?.pending || "Pending";
            case 'reschedule':
                return translations[language]?.tabs?.orders?.filters?.reschedule || "Reschedule";
            case 'return_before_delivered_initiated':
            case 'return_after_delivered_initiated':
                return translations[language]?.tabs?.orders?.filters?.returned || "Returned";
            case 'cancelled':
                return translations[language]?.tabs?.orders?.filters?.cancelled || "Cancelled";
            default:
                return status;
        }
    };
    
    // Handle orders added from OrderSelectionModal
    const handleOrdersAdded = (newOrders) => {
        if (newOrders && newOrders.length > 0) {
            // Update orders with the new ones
            setOrders(prevOrders => [...prevOrders, ...newOrders]);
            
            // Update route object if needed
            if (route) {
                setRoute(prev => ({
                    ...prev,
                    orders: [...(prev.orders || []), ...newOrders]
                }));
            }
        }
    };
    
    const renderDraggableList = () => {
        if (orderSelectionVisible) {
            // When modal is open, render a regular FlatList instead of DraggableFlatList
            // to avoid gesture handler conflicts
            return (
                <FlatList
                    data={orders}
                    renderItem={({ item }) => renderOrderItem({ item, drag: () => {}, isActive: false })}
                    keyExtractor={(item, index) => 
                        item.id ? String(item.id) : 
                        item.order_id ? String(item.order_id) : 
                        item.reference_id ? String(item.reference_id) : 
                        `item-${index}`
                    }
                    contentContainerStyle={styles.orderListContent}
                />
            );
        }
        
        // When modal is closed, use the DraggableFlatList
        return (
            <DraggableFlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={(item, index) => 
                    item.id ? String(item.id) : 
                    item.order_id ? String(item.order_id) : 
                    item.reference_id ? String(item.reference_id) : 
                    `item-${index}`
                }
                onDragEnd={handleDragEnd}
                contentContainerStyle={styles.orderListContent}
                disabled={isCompleted}
            />
        );
    };
    
    if (!isAllowed) {
        return null; // Will be redirected in useEffect
    }
    
    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.statusBarBg} />
                <FixedHeader 
                    title={translations[language]?.routes?.routeDetails || "Route Details"} 
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
    
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.statusBarBg} />
                <FixedHeader 
                    title={routeName || translations[language]?.routes?.routeDetails || "Route Details"} 
                    showBackButton={true} 
                />
                
                <View style={styles.content}>
                    <View style={[styles.routeInfoCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.routeInfoLabel, { color: colors.textSecondary }]}>
                            {translations[language]?.routes?.routeName || "Route Name"}
                        </Text>
                        <TextInput 
                            style={[
                                styles.routeNameInput, 
                                { 
                                    borderColor: colors.inputBorder,
                                    backgroundColor: colors.inputBg,
                                    color: colors.inputText
                                },
                                isCompleted && [styles.disabledInput, { backgroundColor: isDark ? '#333333' : '#F1F5F9', color: colors.textSecondary }]
                            ]}
                            value={routeName}
                            onChangeText={setRouteName}
                            placeholder={translations[language]?.routes?.enterRouteName || "Enter route name"}
                            placeholderTextColor={colors.textTertiary}
                            editable={!isCompleted && canEdit}
                        />
                        
                        <View style={[styles.routeStats, { borderTopColor: colors.divider }]}>
                            <View style={[styles.statItem]}>
                                <Feather name="package" size={16} color={colors.textSecondary} />
                                <Text style={[styles.statText, { color: colors.textSecondary }]}>
                                    {orders.length} {translations[language]?.routes?.orders || "Orders"}
                                </Text>
                            </View>
                            
                            {isCompleted ? (
                                <View style={[styles.statItem]}>
                                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                                        {translations[language]?.routes?.completed || "Completed"}
                                    </Text>
                                </View>
                            ) : route?.optimized ? (
                                <View style={[styles.statItem]}>
                                    <MaterialIcons name="route" size={16} color={colors.primary} />
                                    <Text style={[styles.statText, { color: colors.primary }]}>
                                        {translations[language]?.routes?.optimized || "Optimized"}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                        
                        {!isCompleted && canEdit && (
                            <View style={styles.routeActionButtons}>
                                <TouchableOpacity 
                                    style={[
                                        styles.actionButton, 
                                        styles.addOrdersButton, 
                                        { backgroundColor: isDark ? 'rgba(108, 142, 255, 0.15)' : 'rgba(67, 97, 238, 0.1)' }
                                    ]} 
                                    onPress={handleAddOrders}
                                    disabled={isCompleted}
                                >
                                    <Feather name="plus" size={16} color={colors.primary} />
                                    <Text style={[styles.addOrdersText, { color: colors.primary }]}>
                                        {translations[language]?.routes?.addOrders || "Add Orders"}
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.actionButton, styles.optimizeButton, { backgroundColor: colors.primary }]} 
                                    onPress={() => {}}
                                    disabled={optimizing || isCompleted || orders.length < 2}
                                >
                                    {optimizing ? (
                                        <ActivityIndicator size="small" color={colors.buttonText} />
                                    ) : (
                                        <>
                                            <MaterialIcons name="route" size={16} color={colors.buttonText} />
                                            <Text style={[styles.optimizeText, { color: colors.buttonText }]}>
                                                {translations[language]?.routes?.optimize || "Optimize"}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                    
                    {orders.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? 'rgba(108, 142, 255, 0.15)' : 'rgba(67, 97, 238, 0.1)' }]}>
                                <MaterialCommunityIcons name="routes" size={40} color={colors.primary} />
                            </View>
                            <Text style={[styles.emptyText, { color: colors.text }]}>
                                {translations[language]?.routes?.noOrders || "No orders in this route"}
                            </Text>
                            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                                {translations[language]?.routes?.addOrdersPrompt || "Add orders to create your delivery route"}
                            </Text>
                            
                            {!isCompleted && canEdit && (
                                <TouchableOpacity 
                                    style={styles.emptyAddButton}
                                    onPress={handleAddOrders}
                                >
                                    <LinearGradient
                                        colors={[colors.gradientStart, colors.gradientEnd]}
                                        style={styles.emptyAddButtonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Feather name="plus" size={18} color={colors.buttonText} style={{ marginRight: 8 }} />
                                        <Text style={[styles.emptyAddButtonText, { color: colors.buttonText }]}>
                                            {translations[language]?.routes?.addOrders || "Add Orders"}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <View style={styles.ordersList}>
                            {!isCompleted && canEdit && (
                                <Text style={[styles.dragInstructions, { color: colors.textSecondary }]}>
                                    {translations[language]?.routes?.dragInstructions || "Long press and drag to reorder"}
                                </Text>
                            )}
                            
                            {renderDraggableList()}
                        </View>
                    )}
                    
                    {!isCompleted && canEdit ? (
                        <View style={styles.bottomButtonsContainer}>
                            <TouchableOpacity 
                                style={[styles.completeButton, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)' }]}
                                onPress={completeRoute}
                                disabled={orders.length === 0 || loading}
                            >
                                <Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginRight: 8 }} />
                                <Text style={[styles.completeButtonText, { color: colors.success }]}>
                                    {translations[language]?.routes?.markAsCompleted || "Mark as Completed"}
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.saveButton}
                                onPress={handleSaveRoute}
                                disabled={savingRoute}
                            >
                                <LinearGradient
                                    colors={[colors.gradientStart, colors.gradientEnd]}
                                    style={styles.saveButtonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {savingRoute ? (
                                        <ActivityIndicator size="small" color={colors.buttonText} />
                                    ) : (
                                        <>
                                            <Feather name="save" size={18} color={colors.buttonText} style={{ marginRight: 8 }} />
                                            <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>
                                                {translations[language]?.routes?.saveRoute || "Save Route"}
                                            </Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </View>
                
                {/* Order Selection Modal - Using a separate component for better performance */}
                {orderSelectionVisible && (
                    <OrderSelectionModal
                        routeId={routeId}
                        language={language}
                        onClose={() => setOrderSelectionVisible(false)}
                        onOrdersAdded={handleOrdersAdded}
                        colors={colors}
                        isDark={isDark}
                    />
                )}
            </View>
        </GestureHandlerRootView>
    );
}

// Separate component for order selection with theme support
function OrderSelectionModal({ routeId, language, onClose, onOrdersAdded, colors, isDark }) {
    const [loading, setLoading] = useState(true);
    const [availableOrders, setAvailableOrders] = useState([]);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [addingOrders, setAddingOrders] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    
    // Fetch available orders when component mounts
    useEffect(() => {
        fetchOrders();
    }, []);
    
    // Handle search
    const handleSearch = (text) => {
        setSearchText(text);
        if (text.length > 2 || text.length === 0) {
            // Create search parameters object
            const queryParams = new URLSearchParams();
            
            // Use a single search parameter instead of multiple fields
            if (text) {
                queryParams.append('search', text);
            }
            
            // Add language code
            queryParams.append('language_code', language);
            
            // Update the URL with search parameters
            const url = `${process.env.EXPO_PUBLIC_API_URL}/api/orders?${queryParams.toString()}`;
            
            // Fetch orders with the new search parameters
            fetchOrders(true, url);
        }
    };
    
    // Modify fetchOrders to accept a custom URL
    const fetchOrders = async (refresh = false, customUrl = null) => {
        if (refresh) {
            setPage(1);
            setHasMore(true);
            setAvailableOrders([]);
        }
        
        if (!hasMore && !refresh) return;
        
        try {
            setLoading(true);
            const currentPage = refresh ? 1 : page;
            // const token = await getToken("userToken");
            
            // Use custom URL if provided, otherwise construct default URL
            const url = customUrl || `${process.env.EXPO_PUBLIC_API_URL}/api/orders?language_code=${language}`;
            
            const res = await fetch(url, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    // "Cookie": token ? `token=${token}` : ""
                }
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.data)) {
                    // Filter to ensure all items have valid keys and limit the number of items
                    const validOrders = data.data
                        .filter(item => item && (item.order_id !== undefined || item.reference_id !== undefined))
                        .slice(0, 50); // Limit to max 50 items for better performance
                    
                    // Update available orders list
                    setAvailableOrders(validOrders);
                    setHasMore(false); // Since we're not using pagination for now
                } else {
                    setAvailableOrders([]);
                    setHasMore(false);
                }
            } else {                
                // Handle specific status codes
                if (res.status === 500) {                    
                    // Try a more basic request without parameters
                    if (searchText || currentPage > 1) {
                        // If this was a search or paginated request, don't show error
                        // Just set empty results
                        setAvailableOrders([]);
                    } else {
                        // Show error message only for basic requests
                        Alert.alert(
                            translations[language]?.common?.error || "Error",
                            translations[language]?.orders?.errorFetchingOrders || "Server error when loading orders. Please try again later."
                        );
                    }
                }
                
                setAvailableOrders([]);
                setHasMore(false);
            }
        } catch (error) {
            Alert.alert(
                translations[language]?.common?.error || "Error",
                translations[language]?.orders?.errorFetchingOrders || "Failed to load available orders. Please check your connection."
            );
            setAvailableOrders([]);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };
    
    // Handle order selection
    const toggleOrderSelection = (order) => {
        // Use a more reliable identifier (combination of properties)
        const orderIdentifier = order.id || order.order_id || order.reference_id;
        
        if (selectedOrders.find(o => (o.id || o.order_id || o.reference_id) === orderIdentifier)) {
            setSelectedOrders(selectedOrders.filter(o => 
                (o.id || o.order_id || o.reference_id) !== orderIdentifier
            ));
        } else {
            setSelectedOrders([...selectedOrders, order]);
        }
    };
    
    // Add selected orders to route
    const addOrdersToRoute = async () => {
        if (selectedOrders.length === 0) return;
        
        setAddingOrders(true);
        try {
            // const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/driver/routes/${routeId}/orders`, {
                method: "POST",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    // "Cookie": token ? `token=${token}` : "",
                    "Accept-Language": language
                },
                body: JSON.stringify({ 
                    orderIds: selectedOrders.map(order => order.order_id || order.reference_id) 
                })
            });
            
            const data = await res.json();
            
            if (res.ok && data.success) {
                // Notify parent component of added orders
                if (data.route && Array.isArray(data.route.orders)) {
                    // Find the newly added orders
                    const newOrders = data.route.orders.filter(order => 
                        !order.id || selectedOrders.some(
                            selectedOrder => selectedOrder.order_id === order.order_id || 
                            selectedOrder.reference_id === order.reference_id
                        )
                    );
                    
                    onOrdersAdded(newOrders);
                } else {
                    // Fallback: just pass the selected orders
                    onOrdersAdded(selectedOrders);
                }
                
                // Close the modal
                onClose();
            } else {
                Alert.alert(
                    translations[language]?.common?.error || "Error",
                    data.message || translations[language]?.routes?.errorAddingOrders || "Failed to add orders to route"
                );
            }
        } catch (error) {
            Alert.alert(
                translations[language]?.common?.error || "Error",
                translations[language]?.routes?.errorAddingOrders || "Failed to add orders to route"
            );
        } finally {
            setAddingOrders(false);
        }
    };
    
    // Render order item
    const renderOrderItem = ({ item }) => {
        const orderIdentifier = item.order_id || item.reference_id;
        const isSelected = selectedOrders.some(o => 
            (o.order_id || o.reference_id) === orderIdentifier
        );
        
        return (
            <TouchableOpacity
                style={[styles.availableOrderItem, isSelected && styles.selectedOrderItem, { backgroundColor: colors.surface,borderColor: colors.border }]}
                onPress={() => toggleOrderSelection(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.availableOrderContent]}>
                    <View style={styles.checkboxContainer}>
                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected,{backgroundColor: colors.surface}]}>
                            {isSelected && <Feather name="check" size={16} color="#FFFFFF" />}
                        </View>
                    </View>
                    
                    <View style={styles.availableOrderDetails}>
                        <Text style={[styles.availableOrderId]}>
                            {item.order_id || item.reference_id}
                        </Text>
                        
                        <Text style={[styles.availableOrderName,{color: colors.text}]}>
                            {item.receiver_name} | {item.receiver_mobile}
                        </Text>
                        
                        <View style={[styles.availableAddressContainer]}>
                            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                            <Text style={[styles.availableOrderAddress,{color: colors.text}]}>
                                {`${item.receiver_city || ''} ${item.receiver_address ? `, ${item.receiver_address}` : ''}`}
                            </Text>
                        </View>

                        {(item.to_branch || item.to_driver) && <View style={[styles.availableAddressContainer]}>
                            <Ionicons name="location-outline" size={14} color="#64748B" />
                            <Text style={[styles.availableOrderAddress]}>
                                 {translations[language]?.routes?.dispatchTo} {`${item.to_branch || item.to_driver || ''}`}
                            </Text>
                        </View>}
                        
                    </View>
                </View>
            </TouchableOpacity>
        );
    };
    
    return (
        <Modal
            isVisible={true}
            onBackdropPress={onClose}
            onBackButtonPress={onClose}
            backdropOpacity={0.5}
            style={{ margin: 0, justifyContent: 'flex-end' }}
            swipeDirection="down"
            onSwipeComplete={onClose}
            propagateSwipe={true}
            avoidKeyboard={true}
            useNativeDriver={true}
            statusBarTranslucent={true}
            useNativeDriverForBackdrop={true}
            hideModalContentWhileAnimating={true}
            backdropTransitionOutTiming={0}
        >
            <View style={{
                backgroundColor: colors.modalBg,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                minHeight: '70%',
                maxHeight: '80%',
                paddingTop: 24,
            }}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                        {translations[language]?.routes?.addOrders || "Add Orders"}
                    </Text>
                    <TouchableOpacity onPress={onClose}>
                        <Feather name="x" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.searchContainer}>
                    <View style={[styles.searchInputContainer,{backgroundColor: colors.surface}]}>
                        <Feather name="search" size={18} color="#64748B" style={styles.searchIcon} />
                        <TextInput
                            style={[styles.searchInput,{color: colors.text}]}
                            placeholder={translations[language]?.common?.search || "Search orders..."}
                            placeholderTextColor={colors.textSecondary}
                            value={searchText}
                            onChangeText={handleSearch}
                            returnKeyType="search"
                            onSubmitEditing={() => fetchOrders(true)}
                        />
                        {searchText ? (
                            <TouchableOpacity onPress={() => handleSearch(searchText)}>
                                <Feather name="x" size={18} color="#64748B" />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
                
                {loading && availableOrders.length === 0 ? (
                    <View style={styles.loadingOrdersContainer}>
                        <ActivityIndicator size="large" color="#4361EE" />
                        <Text style={[styles.loadingText,{color: colors.text}]}>
                            {translations[language]?.common?.loadingOrders || "Loading available orders..."}
                        </Text>
                    </View>
                ) : availableOrders.length > 0 ? (
                    <>
                        <FlatList
                            data={availableOrders}
                            renderItem={renderOrderItem}
                            keyExtractor={(item, index) => 
                                item.order_id ? String(item.order_id) : 
                                item.reference_id ? String(item.reference_id) : 
                                `item-${index}`
                            }
                            contentContainerStyle={styles.availableOrdersList}
                            removeClippedSubviews={true}
                            maxToRenderPerBatch={8}
                            windowSize={8}
                            initialNumToRender={5}
                            onEndReached={() => {
                                if (!loading && hasMore) {
                                    fetchOrders();
                                }
                            }}
                            onEndReachedThreshold={0.3}
                            ListFooterComponent={
                                loading && hasMore ? (
                                    <View style={styles.listFooter}>
                                        <ActivityIndicator size="small" color="#4361EE" />
                                    </View>
                                ) : null
                            }
                        />
                        
                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton,{borderColor: colors.border}]}
                                onPress={onClose}
                                disabled={addingOrders}
                            >
                                <Text style={[styles.cancelButtonText,{color: colors.text}]}>
                                    {translations[language]?.common?.cancel || "Cancel"}
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[
                                    styles.modalButton, 
                                    styles.addButton,
                                    (selectedOrders.length === 0 || addingOrders) && styles.disabledButton
                                ]}
                                onPress={addOrdersToRoute}
                                disabled={selectedOrders.length === 0 || addingOrders}
                            >
                                {addingOrders ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.addButtonText}>
                                        {translations[language]?.common?.add || "Add"} ({selectedOrders.length})
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <View style={styles.noOrdersContainer}>
                        <MaterialCommunityIcons name="package-variant" size={48} color="#94A3B8" />
                        <Text style={[styles.noOrdersText,{color: colors.text}]}>
                            {translations[language]?.routes?.noAvailableOrders || "No available orders"}
                        </Text>
                        <Text style={[styles.noOrdersSubtext,{color: colors.text}]}>
                            {translations[language]?.routes?.checkOrders || "Check your orders page for available deliveries"}
                        </Text>
                        <TouchableOpacity 
                            style={styles.retryButton}
                            onPress={() => fetchOrders(true)}
                        >
                            <Text style={styles.retryButtonText}>
                                {translations[language]?.common?.retry || "Retry"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    routeInfoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    routeInfoLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
        marginBottom: 8,
    },
    routeNameInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#F8FAFC',
        marginBottom: 16,
    },
    disabledInput: {
        backgroundColor: '#F1F5F9',
        color: '#64748B',
    },
    routeStats: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
        marginBottom: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 8,
    },
    statText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    routeActionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        flex: 1,
        marginHorizontal: 4,
    },
    addOrdersButton: {
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
    },
    addOrdersText: {
        marginLeft: 6,
        fontSize: 13,
        fontWeight: '600',
        color: '#4361EE',
    },
    optimizeButton: {
        backgroundColor: '#4361EE',
    },
    optimizeText: {
        marginLeft: 6,
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    mapButton: {
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
    },
    mapButtonText: {
        marginLeft: 6,
        fontSize: 13,
        fontWeight: '600',
        color: '#4361EE',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        maxWidth: 240,
    },
    emptyAddButton: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    emptyAddButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    emptyAddButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    ordersList: {
        flex: 1,
    },
    dragInstructions: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    orderListContent: {
        paddingBottom: 100,
    },
    orderItem: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: 10,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    orderItemActive: {
        opacity: 0.8,
        elevation: 5,
        shadowOpacity: 0.2,
        transform: [{ scale: 1.02 }],
    },
    orderDragHandle: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    orderContent: {
        flex: 1,
        padding: 12,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderIdContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    orderId: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4361EE',
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 2,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    orderRemoveButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderAddress: {
        fontSize: 13,
        color: '#64748B',
        marginLeft: 6,
        flex: 1,
    },
    bottomButtonsContainer: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
        flexDirection: 'row',
        gap:15
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 8
    },
    completeButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#10B981',
        padding:7
    },
    saveButton: {
        flex: 2,
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#4361EE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    saveButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    addOrdersModal: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        minHeight: '70%',
        maxHeight: '80%',
        paddingTop: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    availableOrdersList: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    availableOrderItem: {
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    selectedOrderItem: {
        backgroundColor: 'rgba(67, 97, 238, 0.05)',
        borderColor: '#4361EE',
    },
    availableOrderContent: {
        flexDirection: 'row',
        padding: 12,
        gap: 12,
    },
    checkboxContainer: {
        justifyContent: 'center',
        marginRight: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    checkboxSelected: {
        backgroundColor: '#4361EE',
        borderColor: '#4361EE',
    },
    availableOrderDetails: {
        flex: 1,
    },
    availableOrderId: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4361EE',
        marginBottom: 4,
    },
    availableOrderName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    availableAddressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    availableOrderAddress: {
        fontSize: 13,
        color: '#64748B',
        marginLeft: 6,
        flex: 1,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginRight: 8,
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#64748B',
    },
    addButton: {
        backgroundColor: '#4361EE',
        marginLeft: 8,
    },
    addButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    disabledButton: {
        backgroundColor: '#94A3B8',
        opacity: 0.7,
    },
    noOrdersContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        flex: 1,
    },
    noOrdersText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    noOrdersSubtext: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
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
    mapContainer: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 80,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    customMarker: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#4361EE',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deliveredMarker: {
        backgroundColor: '#10B981',
    },
    markerNumber: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    userLocationMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#4361EE',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingOrdersContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    searchContainer: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#334155',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    searchIcon: {
        marginRight: 8,
    },
    listFooter: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingVertical: 8,
        paddingHorizontal: 20,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#4361EE',
        fontWeight: '600',
        fontSize: 14,
    },
});