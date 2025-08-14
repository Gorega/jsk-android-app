import { View, StyleSheet, Text, TouchableOpacity, Pressable, Animated, Platform, ActivityIndicator, TextInput, ScrollView, Alert } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useState, useRef, useEffect } from 'react';
import ModalPresentation from '../ModalPresentation';
import { router } from 'expo-router';
import PickerModal from "../pickerModal/PickerModal";
import { useAuth } from "../../RootLayout";
import UserBox from "./userBox/UserBox";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { getToken } from "../../utils/secureStore";
import { RTLWrapper } from '@/utils/RTLWrapper';
import Contact from "./userBox/Contact";
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '@/utils/themeContext';
import { Colors } from '@/constants/Colors';
import React from 'react';

function Order({ user, order, globalOfflineMode, pendingUpdates, hideSyncUI = true, onStatusChange }) {
    const { language } = useLanguage();
    const { user: authUser } = useAuth();
    const [showControl, setShowControl] = useState(false);
    const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
    const [showConfirmStatusChangeUpdateModal, setShowConfirmStatusChangeUpdateModal] = useState(false);
    const [selectedValue, setSelectedValue] = useState({});
    const [UpdatedStatusNote, setUpdatedStatusNote] = useState("");
    const [isMinimized, setIsMinimized] = useState(["driver", "delivery_company"].includes(authUser?.role || ""));
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    // Reference ID modal states
    const [showReferenceModal, setShowReferenceModal] = useState(false);
    const [referenceIdInput, setReferenceIdInput] = useState("");
    const [isReferenceUpdating, setIsReferenceUpdating] = useState(false);
    const isRTL = language === 'ar' || language === 'he';
    const [isConnected, setIsConnected] = useState(!globalOfflineMode);
    const [pendingStatusUpdates, setPendingStatusUpdates] = useState([]);
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [reasonSearchQuery, setReasonSearchQuery] = useState('');
    const [showExpandHint, setShowExpandHint] = useState(false);
    
    // Safely access authUser role with a default value
    const authUserRole = authUser?.role || "user";
    
    // Animation value for smooth transition
    const heightAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Check if this is the first time the user is viewing orders
    useEffect(() => {
        const checkFirstTimeUser = async () => {
            try {
                const hasSeenOnboarding = await AsyncStorage.getItem('orders_onboarding_seen');
                // If onboarding hasn't been seen, show the expand hint
                if (!hasSeenOnboarding) {
                    setShowExpandHint(true);
                    
                    // Create a pulsing animation for the expand button
                    Animated.loop(
                        Animated.sequence([
                            Animated.timing(pulseAnim, {
                                toValue: 1.2,
                                duration: 800,
                                useNativeDriver: true
                            }),
                            Animated.timing(pulseAnim, {
                                toValue: 1,
                                duration: 800,
                                useNativeDriver: true
                            })
                        ])
                    ).start();
                    
                    // Auto-hide the hint after 5 seconds
                    setTimeout(() => {
                        setShowExpandHint(false);
                    }, 5000);
                }
            } catch (error) {
                // Silent fail for AsyncStorage errors
            }
        };
        
        checkFirstTimeUser();
    }, []);

    // Helper function to format currency values
    const formatCurrencyValue = (value, currency) => {
        // Check if value contains multiple currencies
        if (typeof value === 'string' && (value.includes('ILS:') || value.includes('JOD:') || value.includes('USD:'))) {
            // Split the string by '|' and create a wrapped display
            const currencies = value.split('|').map(item => item.trim());
            return (
                <View style={[styles.currencyContainer]}>
                    {currencies.map((curr, idx) => (
                        <Text key={idx} style={[styles.currencyText,{color:colors.text},isRTL && {textAlign: 'left'}]}>{curr}</Text>
                    ))}
                </View>
            );
        }
        
        // Regular display for simple values
        return <Text style={[styles.costText,{color:colors.text},isRTL && {textAlign: 'left'}]}>{value} {currency}</Text>;
    };

    // Toggle minimize/expand state with animation
    const toggleMinimize = () => {
        Animated.parallel([
            Animated.timing(heightAnim, {
                toValue: isMinimized ? 1 : 0,
                duration: 300,
                useNativeDriver: false
            }),
            Animated.timing(rotateAnim, {
                toValue: isMinimized ? 0 : 1,
                duration: 300,
                useNativeDriver: true
            })
        ]).start();
        
        setIsMinimized(!isMinimized);
        
        // Hide the expand hint after first use
        if (showExpandHint) {
            setShowExpandHint(false);
        }
    };

    // Interpolate rotation for chevron icon
    const rotateInterpolation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg']
    });

    const suspendReasons =  [
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
    ];

    const statusOptions = authUserRole === "driver" || authUserRole === "delivery_company" ? [{
        label: translations[language].tabs.orders.order.states.rescheduled, value: "reschedule",
        requiresReason: true,
        reasons: suspendReasons
        },{
        label: translations[language].tabs?.orders?.order?.states?.rejected, value: "rejected",
        requiresReason: true,
        reasons: suspendReasons
        }, {
        label: translations[language].tabs?.orders?.order?.states?.stuck, value: "stuck",
        requiresReason: true,
        reasons: suspendReasons
        },{
        label: translations[language].tabs?.orders?.order?.states?.return_after_delivered_initiated, value: "return_after_delivered_initiated",
        requiresReason: true,
        reasons: suspendReasons
    },{
        label: translations[language].tabs?.orders?.order?.states?.return_after_delivered_fee_received, value: "return_after_delivered_fee_received",
        requiresReason: true,
        reasons: suspendReasons
    }, {
        label: translations[language].tabs?.orders?.order?.states?.delivered, value: "delivered"
    }, {
        label: translations[language].tabs?.orders?.order?.states?.received, value: "received"
    }]
    :
    [{
        label: translations[language].tabs.orders.order?.states?.waiting, value: "waiting"
    }, {
        label: translations[language].tabs?.orders?.order?.states?.inBranch, value: "in_branch",
        requiresBranch: true
    },{
        label: translations[language].tabs?.orders?.order?.states?.cancelled, value: "cancelled",
        requiresReason: true,
        reasons: suspendReasons
    }, {
        label: translations[language].tabs?.orders?.order?.states?.rejected, value: "rejected",
        requiresReason: true,
        reasons: suspendReasons
    }, {
        label: translations[language].tabs?.orders?.order?.states?.stuck, value: "stuck",
        requiresReason: true,
        reasons: suspendReasons
    }];

    const [selectedReason, setSelectedReason] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [branches, setBranches] = useState([]);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Add this state to track which error messages have been shown
    const [shownErrorOrderIds, setShownErrorOrderIds] = useState([]);
    const [syncMessageShown, setSyncMessageShown] = useState(false);
    
    const handleStatusUpdate = (newStatusOrUpdater) => {
        // First close any open modals
        setShowStatusUpdateModal(false);
        
        // Check if the input is a function (updater) or direct value
        if (typeof newStatusOrUpdater === 'function') {
            // Call the updater function with the current selectedValue
            const updatedValue = newStatusOrUpdater(selectedValue);
            setSelectedValue(updatedValue);
            
            // Get the selected status from the updated value
            const selectedStatus = updatedValue.status?.value;
            
            if (!selectedStatus) {
                return;
            }
            
            // Check if the selected status requires a branch or reason
            const statusOption = statusOptions.find(option => option.value === selectedStatus);
            
            if (statusOption?.requiresBranch) {
                // Fetch branches and show branch selection modal
                fetchBranches();
                setTimeout(() => setShowBranchModal(true), 100); // Add delay to ensure previous modal closes
            } else if (statusOption?.requiresReason) {
                // Show reason selection modal
                setTimeout(() => setShowReasonModal(true), 100); // Add delay to ensure previous modal closes
            } else {
                // Directly show confirmation modal if no branch or reason needed
                setTimeout(() => setShowConfirmStatusChangeUpdateModal(true), 100); // Add delay to ensure previous modal closes
            }
        } else {
            // Direct value (not a function updater)
            setSelectedValue(newStatusOrUpdater);
            
            // Handle the direct value case
            const selectedStatus = newStatusOrUpdater.status?.value;
            
            if (!selectedStatus) {
                return;
            }
            
            // Continue with the same logic as above
            const statusOption = statusOptions.find(option => option.value === selectedStatus);
            
            if (statusOption?.requiresBranch) {
                fetchBranches();
                setTimeout(() => setShowBranchModal(true), 100); // Add delay to ensure previous modal closes
            } else if (statusOption?.requiresReason) {
                setTimeout(() => setShowReasonModal(true), 100); // Add delay to ensure previous modal closes
            } else {
                setTimeout(() => setShowConfirmStatusChangeUpdateModal(true), 100); // Add delay to ensure previous modal closes
            }
        }
    };

    const fetchBranches = async () => {
        try {
            // const token = await getToken("userToken");
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/branches?language_code=${language}`, {
                method: "GET",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    // "Cookie": token ? `token=${token}` : ""
                },
                credentials: "include"
            });
            
            const data = await response.json();
            if (data && data.data) {
                const branchOptions = data.data.map(branch => ({
                    label: branch.name,
                    value: branch.branch_id
                }));
                setBranches(branchOptions);
            }
        } catch (error) {
        }
    };

    const handleReasonSelect = (reasonOption) => {
        setSelectedReason(reasonOption);
        // Close current modal first, then open the next one with a slight delay
        setShowReasonModal(false);
        setTimeout(() => setShowConfirmStatusChangeUpdateModal(true), 300);
    };

    const handleBranchSelect = (branchOption) => {
        setSelectedBranch(branchOption);
        // Close current modal first, then open the next one with a slight delay
        setShowBranchModal(false);
        setTimeout(() => setShowConfirmStatusChangeUpdateModal(true), 300);
    };

    // Add this function to manually retry pending updates
    const retryPendingUpdates = async () => {
        if (pendingStatusUpdates.length === 0) {
            setErrorMessage(translations[language]?.common?.noPendingUpdates || "No pending updates to retry");
            setShowErrorModal(true);
            return;
        }
        
        const networkState = await NetInfo.fetch();
        if (!networkState.isConnected || !networkState.isInternetReachable) {
            setErrorMessage(translations[language]?.common?.noInternetConnection || "No internet connection");
            setShowErrorModal(true);
            return;
        }
        
        // Show loading indicator
        setIsUpdating(true);
        
        try {
            const result = await processPendingStatusUpdates();
            // If we still have failed updates, show an error with details if available
            if (result && result.failedUpdates && result.failedUpdates.length > 0) {
                // Check if we have specific error details from any of the failed updates
                const errorDetails = result.failedUpdates.find(update => update.errorDetails)?.errorDetails;
                
                setErrorMessage(
                    errorDetails || 
                    translations[language]?.common?.someUpdatesFailed || 
                    "Some updates failed. Please try again later."
                );
                setShowErrorModal(true);
            }
        } catch (error) {
            setErrorMessage(translations[language]?.common?.updateError || "Error processing updates");
            setShowErrorModal(true);
        } finally {
            setIsUpdating(false);
        }
    };

    // Process any pending status updates when online - complete rewrite with better performance
    const processPendingStatusUpdates = async (updates = pendingStatusUpdates, showSuccessMessage = true) => {
        if (!updates || updates.length === 0) {
            return { successCount: 0, failedUpdates: [] };
        }
                
        // Make a copy of the updates to avoid any state mutation issues
        const updatesToProcess = [...updates];
        const failedUpdates = [];
        let successCount = 0;
        let failedOrderIds = [];
        
        for (const update of updatesToProcess) {
            try {
                // Skip if this order ID has already had an error shown
                if (shownErrorOrderIds.includes(update.order_id)) {
                    continue;
                }
                
                // Attempt to send the update to the server
                const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/status`, {
                    method: "PUT",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Accept-Language': language,
                    },
                    credentials: "include",
                    body: JSON.stringify({ updates: update })
                });
                
                // Get the response text for debugging
                const responseText = await res.text();
                
                // Try to parse the response as JSON
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    // Add to failed updates with order ID for error reporting
                    failedUpdates.push(update);
                    failedOrderIds.push(update.order_id);
                    continue;
                }
                
                if (data.error) {
                    // Check if this is the "already has status" error
                    const alreadyHasStatusRegex = /لديه بالفعل الحالة|already has the status/i;
                    
                    if (alreadyHasStatusRegex.test(data.details || '')) {
                        successCount++;
                        
                        // Update the cached order with the status (to be safe)
                        await updateCachedOrder(update);
                        
                        // Call the onStatusChange callback to update the parent component
                        if (typeof onStatusChange === 'function' && update.order_id === order.order_id) {
                            // Find the status label from the options
                            const statusOption = statusOptions.find(option => option.value === update.status);
                            onStatusChange(update.order_id, statusOption?.label || update.status, update.status);
                        }
                    } else {
                        // It's a real error - store the error details with the update for better error reporting
                        update.errorDetails = data.details || data.error;
                        failedUpdates.push(update);
                        failedOrderIds.push(update.order_id);
                    }
                } else {
                    successCount++;
                    
                    // Update the cached order with the new status
                    await updateCachedOrder(update);
                    
                    // Call the onStatusChange callback to update the parent component
                    if (typeof onStatusChange === 'function' && update.order_id === order.order_id) {
                        // Find the status label from the options
                        const statusOption = statusOptions.find(option => option.value === update.status);
                        onStatusChange(update.order_id, statusOption?.label || update.status, update.status);
                    }
                }
            } catch (error) {
                // Store any error message with the update
                update.errorDetails = error.message || "Unknown error occurred";
                failedUpdates.push(update);
                failedOrderIds.push(update.order_id);
            }
        }
        
        // Add shown error order IDs to the list
        if (failedOrderIds.length > 0) {
            setShownErrorOrderIds(prev => [...new Set([...prev, ...failedOrderIds])]);
            
            // Save shown error IDs to AsyncStorage to persist across app refreshes
            try {
                const userId = authUser?.id || authUser?.user_id || await getToken("userId");
                if (userId) {
                    const storageKey = `shown_error_order_ids_${userId}`;
                    const existingIdsJson = await AsyncStorage.getItem(storageKey);
                    const existingIds = existingIdsJson ? JSON.parse(existingIdsJson) : [];
                    const updatedIds = [...new Set([...existingIds, ...failedOrderIds])];
                    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedIds));
                }
            } catch (error) {
                // Silent fail for AsyncStorage errors
            }
        }
                
        // Remove all successful updates from pending updates
        // We need to keep only the updates that failed
        const remainingUpdates = [];
        
        // Add each failed update to the remaining updates
        for (const failedUpdate of failedUpdates) {
            // Check if this update is already in remainingUpdates
            const alreadyExists = remainingUpdates.some(
                update => update.order_id === failedUpdate.order_id && update.status === failedUpdate.status
            );
            
            // Only add if not already in the array
            if (!alreadyExists) {
                remainingUpdates.push(failedUpdate);
            }
        }
                
        // Update state and storage with remaining failed updates
        setPendingStatusUpdates(remainingUpdates);
        await savePendingStatusUpdates(remainingUpdates);
        
        // If there were successful updates and showSuccessMessage is true, show a success message
        if (successCount > 0 && showSuccessMessage) {
            setSuccessMessage(
                successCount === 1 
                    ? (translations[language].tabs.orders.order.statusChangeSuccess || "Status updated successfully") 
                    : (translations[language].tabs.orders.order.multipleStatusesUpdated || `${successCount} statuses updated successfully`)
            );
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 2500);
        }
        
        // If there were failed updates that haven't been shown before, show an error message with the order IDs
        const newFailedOrderIds = failedOrderIds.filter(id => !shownErrorOrderIds.includes(id));
        if (newFailedOrderIds.length > 0 && showSuccessMessage && !syncMessageShown) {
            setSyncMessageShown(true);
            const uniqueFailedIds = [...new Set(newFailedOrderIds)];
            setErrorMessage(
                `${translations[language]?.tabs?.orders?.order?.states?.failedToUpdate} ${uniqueFailedIds.length} ${translations[language]?.tabs?.orders?.order?.states?.forOrders}: ${uniqueFailedIds.join(', ')}`
            );
            setShowErrorModal(true);
            
            // Automatically clear error history after showing the error message
            setTimeout(() => {
                setShowErrorModal(false);
            }, 5000);
        }
        
        return { successCount, failedUpdates };
    };

    // Helper function to update cached order
    const updateCachedOrder = async (update) => {
        try {
            // Get user ID from multiple possible sources
            let userId = null;
            
            // Try from authUser first
            if (authUser?.id) {
                userId = authUser.id;
            } else if (authUser?.user_id) {
                userId = authUser.user_id;
            }
            
            // If not found, try from secure storage
            if (!userId) {
                userId = await getToken("userId");
            }
            
            if (!userId) {
                return;
            }
            
            const cachedOrdersJson = await AsyncStorage.getItem(`cached_orders_${userId}`);
            if (!cachedOrdersJson) return;
            
            const cachedOrders = JSON.parse(cachedOrdersJson);
            if (!cachedOrders[update.order_id]) return;
            
            // Find the status label from the options
            const statusOption = statusOptions.find(option => option.value === update.status);
            const statusLabel = statusOption?.label || update.status;
            
            // Update the cached order
            cachedOrders[update.order_id] = {
                ...cachedOrders[update.order_id],
                status: statusLabel,
                status_key: update.status
            };
            
            // Save back to storage
            await AsyncStorage.setItem(`cached_orders_${userId}`, JSON.stringify(cachedOrders));
        } catch (error) {
        }
    };

    // Completely rewritten loadPendingStatusUpdates with better error handling
    const loadPendingStatusUpdates = async () => {
        try {
            // Get user ID from multiple possible sources
            const userId = authUser?.id || authUser?.user_id || await getToken("userId");
            if (!userId) return;
            
            // Try to get pending updates from storage
            const storageKey = `pending_status_updates_${userId}`;
            const pendingUpdatesJson = await AsyncStorage.getItem(storageKey);
            if (!pendingUpdatesJson) return;
            
            try {
                const pendingUpdates = JSON.parse(pendingUpdatesJson);
                
                // Validate the structure of each update
                const validUpdates = pendingUpdates.filter(update => 
                    update && 
                    update.order_id && 
                    update.status && 
                    typeof update.order_id === 'string' && 
                    typeof update.status === 'string'
                );
                
                if (validUpdates.length === 0) return;
                
                // Filter out updates for order IDs that have already had errors shown
                // and sort by timestamp to ensure oldest updates are processed first
                const filteredUpdates = validUpdates
                    .filter(update => !shownErrorOrderIds.includes(update.order_id))
                    .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
                
                setPendingStatusUpdates(filteredUpdates);
                
                // Update UI for any pending updates for the current order
                const currentOrderUpdates = filteredUpdates.filter(update => update.order_id === order.order_id);
                if (currentOrderUpdates.length > 0 && typeof onStatusChange === 'function') {
                    // Use the most recent update for this order
                    const latestUpdate = currentOrderUpdates[currentOrderUpdates.length - 1];
                    const statusOption = statusOptions.find(option => option.value === latestUpdate.status);
                    if (statusOption) {
                        onStatusChange(
                            order.order_id, 
                            `${statusOption.label} (${translations[language]?.common?.pending || "Pending"})`, 
                            latestUpdate.status
                        );
                    }
                }
                
                // If we're connected, try to process them with a delay to ensure network stability
                const networkState = await NetInfo.fetch();
                if (networkState.isConnected && networkState.isInternetReachable && filteredUpdates.length > 0) {
                    setTimeout(() => {
                        processPendingStatusUpdates(filteredUpdates, false);
                    }, 2000);
                }
            } catch (parseError) {
                // Clear corrupted data
                await AsyncStorage.removeItem(storageKey);
            }
        } catch (error) {
            // Silent fail for AsyncStorage errors
        }
    };
    
    // Save pending status updates to AsyncStorage
    const savePendingStatusUpdates = async (updates) => {
        try {
            // Get user ID from multiple possible sources
            let userId = null;
            
            // Try from authUser first
            if (authUser?.id) {
                userId = authUser.id;
            } else if (authUser?.user_id) {
                userId = authUser.user_id;
            }
            
            // If not found, try from secure storage
            if (!userId) {
                userId = await getToken("userId");
            }
            
            if (!userId) {
                return;
            }
            
            const storageKey = `pending_status_updates_${userId}`;
            await AsyncStorage.setItem(storageKey, JSON.stringify(updates));
        } catch (error) {
        }
    };
    
    // Cache orders for offline viewing
    const cacheOrder = async (orderData) => {
        try {
            const userId = authUser?.id || authUser?.user_id;
            if (!userId) return;
            
            // Get existing cached orders
            const cachedOrdersJson = await AsyncStorage.getItem(`cached_orders_${userId}`);
            let cachedOrders = cachedOrdersJson ? JSON.parse(cachedOrdersJson) : {};
            
            // Update or add the order to the cache
            cachedOrders[orderData.order_id] = {
                ...orderData,
                cached_at: new Date().toISOString()
            };
            
            // Save back to storage
            await AsyncStorage.setItem(`cached_orders_${userId}`, JSON.stringify(cachedOrders));
        } catch (error) {
        }
    };
    
    // Cache the current order when component mounts
    useEffect(() => {
        if (order) {
            cacheOrder(order);
        }
    }, [order]);

    // Modified changeStatusHandler with validation for "other" reason
    const changeStatusHandler = async () => {
        // Prevent multiple rapid clicks
        if (isUpdating) return;
        
        try {
            setIsUpdating(true);
            
            const updates = {
                order_id: order.order_id,
                status: selectedValue.status?.value,
                note_content: UpdatedStatusNote,
                ...(selectedBranch && { current_branch: selectedBranch.value }),
                ...(selectedReason && { reason: selectedReason.value }),
                timestamp: new Date().toISOString() // Add timestamp for ordering
            };
            
            if (!updates.status) {
                // Close current modal first, then show error
                setShowConfirmStatusChangeUpdateModal(false);
                setTimeout(() => {
                    setErrorMessage(translations[language].tabs.orders.order.missingStatus);
                    setShowErrorModal(true);
                }, 300);
                setIsUpdating(false);
                return;
            }
            
            // Check if reason is "other" and note is empty
            if (selectedReason?.value === 'other' && !UpdatedStatusNote.trim()) {
                setErrorMessage(translations[language]?.tabs?.orders?.order?.noteRequiredForOther);
                setShowErrorModal(true);
                setIsUpdating(false);
                return;
            }
            
            // Close current modal first
            setShowConfirmStatusChangeUpdateModal(false);
            
            // Check if we're online
            const networkState = await NetInfo.fetch();
            const isOnline = networkState.isConnected && networkState.isInternetReachable;
            
            if (isOnline) {
                // We're online, send the update directly
                try {
                    
                    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/status`, {
                        method: "PUT",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Accept-Language': language,
                        },
                        credentials: "include",
                        body: JSON.stringify({ updates }) // This is the expected format by the API
                    });
                    
                    // Log the raw response for debugging
                    const responseText = await res.text();
                    
                    // Try to parse the response
                    let data;
                    try {
                        data = JSON.parse(responseText);
                    } catch (parseError) {
                        throw new Error('Invalid server response');
                    }
                    
                    if (!data.error) {
                        // Update was successful
                        
                        // Update the cached order with the new status
                        const updatedOrder = {
                            ...order,
                            status: selectedValue.status?.label,
                            status_key: selectedValue.status?.value
                        };
                        await cacheOrder(updatedOrder);
                        
                        // Call the onStatusChange callback to update the parent component
                        if (typeof onStatusChange === 'function') {
                            onStatusChange(order.order_id, selectedValue.status?.label, selectedValue.status?.value);
                        }
                        
                        // Reset state values
                        setSelectedReason(null);
                        setSelectedBranch(null);
                        setUpdatedStatusNote("");
                        
                        // Show success message
                        setTimeout(() => {
                            setSuccessMessage(translations[language].tabs.orders.order.statusChangeSuccess);
                            setShowSuccessModal(true);
                            setTimeout(() => setShowSuccessModal(false), 2500);
                        }, 100);

                        // If the new status is "received" AND order ID ends with R or B, prompt for reference ID
                        const orderIdSuffix = order.order_id?.toString().slice(-1);
                        if (selectedValue?.status?.value === 'received' && (orderIdSuffix === 'R' || orderIdSuffix === 'B')) {
                            setTimeout(() => {
                                setReferenceIdInput("");
                                setShowReferenceModal(true);
                            }, 200);
                        }
                        } else {
                        // Show error message with the actual error details from backend
                        setTimeout(() => {
                            // Normalize possible object/array error shapes
                            const rawErr = data.details || data.error;
                            let normalized = null;
                            if (typeof rawErr === 'string') {
                                normalized = rawErr;
                            } else if (Array.isArray(rawErr)) {
                                normalized = rawErr.map(e => (typeof e === 'string' ? e : `${e.field ? e.field + ': ' : ''}${e.message || ''}`)).join('\n');
                            } else if (rawErr && typeof rawErr === 'object') {
                                normalized = rawErr.message || `${rawErr.field ? rawErr.field + ': ' : ''}${rawErr.message || ''}`;
                            }
                            setErrorMessage(normalized || translations[language].tabs.orders.order.statusChangeError);
                            setShowErrorModal(true);
                        }, 100);
                    }
                } catch (error) {
                    // Network error while trying to update - fall back to offline mode
                    handleOfflineStatusUpdate(updates);
                }
            } else {
                // We're offline, store the update for later
                handleOfflineStatusUpdate(updates);
            }
        } catch (error) {
            // Close current modal first
            setShowConfirmStatusChangeUpdateModal(false);
            
            // Show error modal
            setTimeout(() => {
                setErrorMessage(translations[language].tabs.orders.order.statusChangeError);
                setShowErrorModal(true);
            }, 100);
        } finally {
            setIsUpdating(false);
        }
    };
    
    // Handle status updates when offline
    const handleOfflineStatusUpdate = async (updates) => {
        try {
            // Add to pending updates with timestamp for ordering
            const updatedPendingUpdates = [...pendingStatusUpdates, {
                ...updates,
                timestamp: new Date().toISOString()
            }];
            
            // Sort by timestamp to ensure oldest updates are processed first
            updatedPendingUpdates.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            // Update state and storage
            setPendingStatusUpdates(updatedPendingUpdates);
            await savePendingStatusUpdates(updatedPendingUpdates);
            
            // Reset state values
            setSelectedReason(null);
            setSelectedBranch(null);
            setUpdatedStatusNote("");
            
            // Show offline pending message
            setTimeout(() => {
                setSuccessMessage(translations[language].tabs.orders.order.statusChangeOffline || "Status update saved for when you're back online");
                setShowSuccessModal(true);
                setTimeout(() => setShowSuccessModal(false), 2500);
            }, 100);
            
            // Update local UI to show pending status
            if (typeof onStatusChange === 'function') {
                // Find the status label from the options
                const statusOption = statusOptions.find(option => option.value === updates.status);
                if (statusOption) {
                    onStatusChange(
                        order.order_id, 
                        `${statusOption.label} (${translations[language]?.common?.pending || "Pending"})`, 
                        updates.status
                    );
                }
            }
        } catch (error) {
            // Show error if offline update fails
            setErrorMessage(translations[language]?.common?.offlineUpdateError || "Failed to save update for later");
            setShowErrorModal(true);
        }
    };

    // Get status color based on status key
    const getStatusColor = (statusKey) => {
        const statusColors = {
            "waiting": "#64748B",
            "in_branch": "#3B82F6",
            "in_progress": "#8B5CF6",
            "rejected": "#EF4444",
            "stuck": "#F59E0B",
            "delayed": "#F59E0B",
            "on_the_way": "#6366F1",
            "driver_responsibility": "#6366F1",
            "reschedule": "#F59E0B",
            "return_before_delivered_initiated": "#EF4444",
            "return_after_delivered_initiated": "#F97316",
            "returned": "#3B82F6",
            "returned_in_branch": "#3B82F6",
            "returned_out": "#3B82F6",
            "business_returned_delivered": "#10B981",
            "delivered": "#3B82F6",
            "money_in_branch": "#10B981",
            "money_out": "#10B981",
            "business_paid": "#10B981",
            "completed": "#10B981"
        };
        
        return statusColors[statusKey] || "#64748B";
    };

    // Add a small indicator for offline mode in the header
    const renderConnectivityStatus = () => {
        if (isConnected || hideSyncUI) return null;
        
        return (
            <View style={styles.offlineIndicator}>
                <MaterialIcons name="cloud-off" size={16} color="#FFFFFF" />
                <Text style={styles.offlineText}>
                    {translations[language]?.common?.offline || "Offline"}
                </Text>
            </View>
        );
    };

    // Improved network state monitoring effect with better reconnection handling
    useEffect(() => {
        // If we're using global offline mode, update our local state
        if (globalOfflineMode !== undefined) {
            setIsConnected(!globalOfflineMode);
        }
        
        // Track reconnection state
        let reconnectionAttemptInProgress = false;
        let lastConnectionState = isConnected;
        
        // Set up network listener with debounced reconnection handling
        const unsubscribe = NetInfo.addEventListener(async (state) => {
            const wasConnected = lastConnectionState;
            const nowConnected = state.isConnected && state.isInternetReachable;
            
            // Update last known connection state
            lastConnectionState = nowConnected;
            
            // Update connection state
            setIsConnected(nowConnected);
            
            // If we just came back online and have pending updates, try to sync
            if (!wasConnected && nowConnected && !reconnectionAttemptInProgress) {
                // Force reload pending updates to ensure we have the latest data
                try {
                    const userId = authUser?.id || authUser?.user_id || await getToken("userId");
                    if (userId) {
                        const storageKey = `pending_status_updates_${userId}`;
                        const pendingUpdatesJson = await AsyncStorage.getItem(storageKey);
                        if (pendingUpdatesJson) {
                            const storedUpdates = JSON.parse(pendingUpdatesJson);
                            if (storedUpdates && storedUpdates.length > 0) {
                                reconnectionAttemptInProgress = true;
                                
                                // Add a small delay to ensure network is stable before attempting sync
                                setTimeout(async () => {
                                    try {
                                        // Process updates with showing messages enabled
                                        await processPendingStatusUpdates(storedUpdates, true);
                                    } catch (error) {
                                    } finally {
                                        reconnectionAttemptInProgress = false;
                                    }
                                }, 2000);
                            }
                        }
                    }
                } catch (error) {
                }
            }
        });
        
        // Initial check
        NetInfo.fetch().then(state => {
            lastConnectionState = state.isConnected && state.isInternetReachable;
            setIsConnected(lastConnectionState);
        });
        
        // Cleanup subscription
        return () => {
            unsubscribe();
        };
    }, [globalOfflineMode]);

    // Optimized auto-sync effect with throttling
    useEffect(() => {
        let syncTimeout = null;
        let syncInProgress = false;
        
        // Function to attempt sync with throttling
        const attemptThrottledSync = async () => {
            // Don't start a new sync if one is already in progress
            if (syncInProgress) return;
            
            // Clear any existing timeout
            if (syncTimeout) {
                clearTimeout(syncTimeout);
            }
            
            // Set a new timeout to prevent rapid successive syncs
            syncTimeout = setTimeout(async () => {
                try {
                    // Check if we're online and have updates to process
                    if (isConnected && pendingStatusUpdates.length > 0) {
                        syncInProgress = true;
                        
                        // Force reload pending updates from storage to ensure we have the latest data
                        const userId = authUser?.id || authUser?.user_id || await getToken("userId");
                        if (userId) {
                            const storageKey = `pending_status_updates_${userId}`;
                            const pendingUpdatesJson = await AsyncStorage.getItem(storageKey);
                            if (pendingUpdatesJson) {
                                const storedUpdates = JSON.parse(pendingUpdatesJson);
                                if (storedUpdates && storedUpdates.length > 0) {
                                    await processPendingStatusUpdates(storedUpdates, false);
                                }
                            }
                        }
                    }
                } catch (error) {
                } finally {
                    syncInProgress = false;
                }
            }, 2000); // 2-second throttle
        };
        
        // Attempt sync when component mounts or dependencies change
        if (isConnected && pendingStatusUpdates.length > 0) {
            attemptThrottledSync();
        }
        
        // Set up a sync interval when online
        let syncInterval;
        if (isConnected) {
            syncInterval = setInterval(() => {
                if (pendingStatusUpdates.length > 0) {
                    attemptThrottledSync();
                }
            }, 30000); // Check every 30 seconds when online
        }
        
        // Clean up
        return () => {
            if (syncTimeout) clearTimeout(syncTimeout);
            if (syncInterval) clearInterval(syncInterval);
        };
    }, [isConnected, pendingStatusUpdates.length]);

    // Add this effect to handle network connectivity changes
    useEffect(() => {
        // If we're using global offline mode, update our local state
        if (globalOfflineMode !== undefined) {
            setIsConnected(!globalOfflineMode);
        }
        
        // Only set up network listener if we're not using global offline mode
        let unsubscribe;
        if (globalOfflineMode === undefined) {
        // Function to handle connectivity change
        const handleConnectivityChange = async (state) => {
            const connected = state.isConnected && state.isInternetReachable;
            setIsConnected(connected);
        };
        
        // Subscribe to network state changes
            unsubscribe = NetInfo.addEventListener(handleConnectivityChange);
        
        // Initial check
        NetInfo.fetch().then(state => {
            setIsConnected(state.isConnected && state.isInternetReachable);
        });
        }
        
        // Cleanup subscription
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [globalOfflineMode]);

    // Add this effect to periodically check for pending updates
    useEffect(() => {
        let syncInterval;
        
        // Only set up the interval if we have pending updates and are connected
        if (isConnected && pendingStatusUpdates.length > 0) {
            syncInterval = setInterval(async () => {
                await processPendingStatusUpdates();
            }, 60000); // Check every minute
        }
        
        // Clean up the interval
        return () => {
            if (syncInterval) {
                clearInterval(syncInterval);
            }
        };
    }, [isConnected, pendingStatusUpdates.length]);

    // Monitor changes to pendingStatusUpdates
    useEffect(() => {
        // If we have pending updates and we're connected, try to process them
        if (isConnected && pendingStatusUpdates.length > 0) {
            processPendingStatusUpdates();
        }
    }, [pendingStatusUpdates.length]);


    // Update pendingStatusUpdates to use global pendingUpdates if provided
    useEffect(() => {
        if (pendingUpdates) {
            // Filter to only include updates for this specific order
            const orderUpdates = pendingUpdates.filter(update => update.order_id === order.order_id);
            setPendingStatusUpdates(orderUpdates);
        } else {
            // If not using global updates, load from storage as before
            loadPendingStatusUpdates();
        }
    }, [pendingUpdates, order.order_id]);

    // Add this function to render pending status indicator
    const renderPendingStatusIndicator = () => {
        // Only show the indicator if there are pending updates for this order
        // AND they haven't been shown in an error message yet
        const hasPendingUpdate = pendingStatusUpdates.some(update => 
            update.order_id === order.order_id && 
            !shownErrorOrderIds.includes(update.order_id)
        );
        
        if (hasPendingUpdate) {
            return (
                <View style={styles.pendingStatusIndicator}>
                    <MaterialIcons name="sync" size={14} color="#F59E0B" />
                    <Text style={styles.pendingStatusText}>
                        {translations[language]?.common?.pendingUpdate || "Pending"}
                    </Text>
                </View>
            );
        }
        
        return null;
    };

    // Load shown error order IDs from AsyncStorage
    const loadShownErrorOrderIds = async () => {
        try {
            const userId = authUser?.id || authUser?.user_id || await getToken("userId");
            if (userId) {
                const storageKey = `shown_error_order_ids_${userId}`;
                const shownIdsJson = await AsyncStorage.getItem(storageKey);
                if (shownIdsJson) {
                    const shownIds = JSON.parse(shownIdsJson);
                    setShownErrorOrderIds(shownIds);
                }
            }
        } catch (error) {
        }
    };

    // Add this to the Error Modal to handle closing
    const handleErrorModalClose = () => {
        setShowErrorModal(false);
    };

    // Pick up scanned reference ID from the camera scanner screen
    useEffect(() => {
        try {
            if (showReferenceModal && global && global.scannedReferenceId) {
                setReferenceIdInput(global.scannedReferenceId);
                global.scannedReferenceId = null;
            }
        } catch (_) {
            // ignore
        }
    }, [showReferenceModal]);

    // Submit reference ID to backend
    const submitReferenceId = async () => {
        if (!referenceIdInput || !referenceIdInput.toString().trim()) {
            setErrorMessage(translations[language]?.tabs?.orders?.order?.referenceIdRequired);
            setShowErrorModal(true);
            return;
        }
        try {
            setIsReferenceUpdating(true);
            let res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/${order.order_id}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Accept-Language': language,
                },
                credentials: 'include',
                body: JSON.stringify({ reference_id: referenceIdInput.toString().trim() })
            });

            const data = await res.json();
            
            if (res.ok) {
                // Success case - API returns 200-299 status code
                // Update the local order data if needed
                if (order && data.order) {
                    updateCachedOrder(data.order);
                }
                
                // Show success message
                setSuccessMessage(translations[language]?.tabs?.orders?.order?.states?.referenceIdUpdated || 'Reference ID updated successfully');
                setShowSuccessModal(true);
                
                // Close the reference modal immediately
                setShowReferenceModal(false);
                
                // Clear the input
                setReferenceIdInput("");
            } else {
                // HTTP error
                setErrorMessage(data.message || (translations[language]?.tabs?.orders?.order?.states?.referenceIdUpdateError || 'Failed to update Reference ID'));
                setShowErrorModal(true);
            }
        } catch (error) {
            setErrorMessage(translations[language]?.tabs?.orders?.order?.states?.referenceIdUpdateError || 'Failed to update Reference ID');
            setShowErrorModal(true);
        } finally {
            setIsReferenceUpdating(false);
        }
    };

    // While the reference modal is open, poll for scanned value to auto-fill input
    useEffect(() => {
        if (!showReferenceModal) return;
        const interval = setInterval(() => {
            try {
                if (global && global.scannedReferenceId) {
                    setReferenceIdInput(global.scannedReferenceId);
                    global.scannedReferenceId = null;
                }
            } catch (_) {}
        }, 300);
        return () => clearInterval(interval);
    }, [showReferenceModal]);

    // Load shown error order IDs when component mounts
    useEffect(() => {
        loadShownErrorOrderIds();
    }, []);

    // Update loadPendingStatusUpdates to depend on shownErrorOrderIds
    useEffect(() => {
        loadPendingStatusUpdates();
    }, [shownErrorOrderIds]);

    return (
        <RTLWrapper>
            <Pressable 
                onPress={() => router.push({
                    pathname: "(track)",
                    params: { orderId: order.order_id }
                })} 
                onLongPress={() => setShowControl(true)}
                style={({ pressed }) => [
                    styles.pressable,
                    pressed && styles.pressablePressed
                ]}
            >
                <View style={[styles.orderCard,{
                    backgroundColor: colors.card
                }]}>
                    {/* Header section with order ID and status */}
                    <View style={[styles.header, {
                        backgroundColor: isDark ? colors.card : 'rgba(67, 97, 238, 0.05)',
                        borderBottomColor: colors.border,
                    }]}>
                        {/* Minimize/Expand toggle button with hint animation */}
                        <Animated.View 
                            style={[
                                styles.toggleButtonContainer,
                                showExpandHint && {
                                    transform: [{ scale: pulseAnim }],
                                    zIndex: 10
                                }
                            ]}
                        >
                            <TouchableOpacity 
                                onPress={toggleMinimize}
                                style={[
                                    styles.toggleButton,
                                    showExpandHint && styles.toggleButtonHighlight
                                ]}
                                activeOpacity={0.7}
                            >
                                <Animated.View style={{ 
                                    transform: [{ rotate: rotateInterpolation }],
                                }}>
                                    <MaterialIcons 
                                        name="expand-more" 
                                        size={24} 
                                        color={showExpandHint ? "#FFFFFF" : "#4361EE"} 
                                    />
                                </Animated.View>
                            </TouchableOpacity>
                            
                            {/* Hint tooltip */}
                            {showExpandHint && (
                                <View style={styles.expandHintTooltip}>
                                    <Text style={styles.expandHintText}>
                                        {translations[language]?.onboarding?.orders?.tapToExpand || "Tap to expand"}
                                    </Text>
                                </View>
                            )}
                        </Animated.View>
                        
                        <View style={[styles.orderIdSection]}>
                            <View style={[styles.orderIdContainer]}>
                             <Text style={[styles.orderIdText, { color: colors.primary }]}>#{order.order_id}</Text>
                                {!isConnected && pendingStatusUpdates.some(update => update.order_id === order.order_id) && (
                                    <View style={styles.pendingIndicator}>
                                        <MaterialIcons name="sync" size={14} color="#F59E0B" />
                                    </View>
                                )}
                            </View>
                            {order.reference_id && !isMinimized && (
                               <Text style={[styles.referenceId, { color: colors.textSecondary, textAlign: isRTL ? "left" : "left" },{
                                
                                ...Platform.select({
                                    ios: {
                                        textAlign:isRTL ? "left" : ""
                                    }
                                }),
                            }]}>
                                    Ref: {order.reference_id}
                                </Text>
                            )}
                        </View>
                        
                        <View style={{alignItems: 'center', flexDirection: 'row' }}>
                            {renderConnectivityStatus()}
                            <TouchableOpacity 
                                onPress={() => !["business","accountant","support_agent","sales_representative","warehouse_admin","warehouse_staff"].includes(authUserRole) && setShowStatusUpdateModal(true)} 
                                style={[
                                    styles.statusBadge, 
                                    { 
                                        backgroundColor: getStatusColor(order.status_key)
                                    }
                                ]}
                                activeOpacity={!["business","accountant","support_agent","sales_representative","warehouse_admin","warehouse_staff"].includes(authUserRole) ? 0.7 : 1}
                            >
                                {!["business","accountant","support_agent","sales_representative","warehouse_admin","warehouse_staff"].includes(authUserRole) && (
                                    <MaterialIcons 
                                        name="published-with-changes" 
                                        size={18} 
                                        color="white" 
                                        style={styles.statusIcon} 
                                    />
                                )}
                                <Text style={styles.statusText}>{order.status}</Text>
                                {renderPendingStatusIndicator()}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Compact View for minimized state - only shows essential details */}
                    {isMinimized ? (
                         <View style={[styles.minimizedContainer, { 
                            backgroundColor: isDark ? colors.card : 'rgba(249, 250, 251, 0.8)',
                        }]}>
                            <View style={[styles.minimizedRow]}>
                                <View style={[
                                    styles.minimizedSection,
                                    {
                                        ...Platform.select({
                                            ios: {
                                                alignItems:isRTL ? "flex-start" : ""
                                            }
                                        })
                                    }
                                ]}>
                                     <Text style={[styles.minimizedLabel, { color: colors.textSecondary }]}>
                                        {translations[language].tabs.orders.order.userClientBoxLabel || 'Client'}
                                    </Text>
                                    <Text style={[styles.minimizedValue, { color: colors.text }]}>
                                        {order.receiver_name}
                                    </Text>
                                </View>
                                
                                <View style={[
                                    styles.minimizedSection, 
                                    styles.locationMinimized,
                                    {
                                        ...Platform.select({
                                            ios: {
                                                alignItems:isRTL ? "flex-start" : ""
                                            }
                                        })
                                    }
                                ]}>
                                    <Text style={[styles.minimizedLabel,{color:colors.textSecondary}]}>
                                        {translations[language].tabs.orders.order.codValue || 'COD Value'}
                                    </Text>
                                    <Text style={[styles.minimizedValue,{color:colors.text}]} >
                                        {["business"].includes(authUserRole) ? order.total_net_value : order.total_cod_value} {order.currency}
                                    </Text>
                                </View>
                            </View>
                            
                            {/* Receiver phone with call and message icons */}
                            {order.receiver_mobile && (
                                <View style={[[styles.minimizedRow, styles.phoneRow,{
                                    ...Platform.select({
                                        ios: {
                                            alignItems:isRTL ? "flex-start" : ""
                                        }
                                    })
                                }]]}>
                                    <Text style={[styles.phoneText,{color:colors.success}]}>{order.receiver_mobile}</Text>
                                    <View style={styles.phoneActions}>
                                        <Contact
                                            contact={{
                                                type: "phone",
                                                label: translations[language].tabs.orders.order.userBoxPhoneContactLabel,
                                                phone: order.receiver_mobile,
                                                userName: order.receiver_name,
                                                msg: "",
                                                orderId: order.order_id,
                                                businessName: order.sender || "طيار للتوصيل",
                                                codValue: order.total_cod_value || "",
                                                currency: order.currency || ""
                                            }}
                                            orderId={order.order_id}
                                        />
                                        <Contact
                                            contact={{
                                                type: "msg",
                                                label: translations[language].tabs.orders.order.userBoxMessageContactLabel,
                                                phone: order.receiver_mobile,
                                                userName: order.receiver_name,
                                                msg: "",
                                                orderId: order.order_id,
                                                businessName: order.sender || "طيار للتوصيل",
                                                codValue: order.total_cod_value || "",
                                                currency: order.currency || ""
                                            }}
                                            orderId={order.order_id}
                                        />
                                    </View>
                                </View>
                            )}
                            
                            {/* Display order type if it's receive or delivery/receive */}
                            <View style={[styles.minimizedRow]}>
                                <View style={[styles.minimizedSection,{
                                        ...Platform.select({
                                            ios: {
                                                alignItems:isRTL ? "flex-start" : ""
                                            }
                                        }),
                                    }]}>
                                    <Text style={[styles.minimizedLabel,{color:colors.textSecondary}]}>
                                        {translations[language].tabs.orders.order.orderType || 'Order Type'}
                                    </Text>
                                    <Text style={[styles.minimizedValue, styles.highlightOrderType,{color:colors.text}]}>
                                        {order.order_type}
                                        {order.received_items ? ` (${order.received_items})` : ''}
                                        {order.received_quantity ? ` - ${order.received_quantity}` : ''}
                                    </Text>
                                </View>
                            </View>
                            
                            {/* Additional minimized info - location with area and address */}
                            <View style={[styles.minimizedRow]}>
                                <View style={[
                                    styles.minimizedSection,
                                    {
                                        ...Platform.select({
                                            ios: {
                                                alignItems:isRTL ? "flex-start" : ""
                                            }
                                        }),
                                    }
                                ]}>
                                    <Text style={[styles.minimizedLabel,{color:colors.textSecondary}]}>
                                        {translations[language].tabs.orders.order.location || 'Location'}
                                    </Text>
                                    <Text style={[styles.minimizedValue,{color:colors.text}]} >
                                        {order.receiver_city} {order.receiver_address ? `, ${order.receiver_address}` : ''}
                                    </Text>
                                </View>
                            </View>
                            
                            {/* Show note if available */}
                            {order.note && (
                                <View style={[styles.minimizedRow,]}>
                                    <View style={[styles.minimizedSection, styles.noteMinimized,{
                                                ...Platform.select({
                                                    ios: {
                                                        alignItems:isRTL ? "flex-start" : ""
                                                    }
                                                }),
                                            }]}>
                                        <Text style={[styles.minimizedLabel,{color:colors.textSecondary}]}>
                                            {translations[language].tabs.orders.order.note || 'Note'}
                                        </Text>
                                        <Text style={[styles.minimizedValue, styles.noteText,{color:colors.text}]} >
                                            {order.note}
                                        </Text>
                                    </View>
                                </View>
                            )}
                            
                            {/* Show checks if exist with navigation */}
                            {order.checks_value > 0 && (
                                <TouchableOpacity 
                                    style={[styles.minimizedRow]}
                                    onPress={() => router.push({
                                        pathname: "(order_checks)",
                                        params: { orderId: order.order_id }
                                    })}
                                >
                                    <View style={[styles.minimizedSection, styles.checksMinimized,{
                                                ...Platform.select({
                                                    ios: {
                                                        alignItems:isRTL ? "flex-start" : ""
                                                    }
                                                }),
                                            }]}>
                                        <View style={styles.checksMinimizedHeader}>
                                            <Text style={[styles.minimizedLabel,{color:colors.textSecondary}]}>
                                                {translations[language].tabs.orders.order.checksAvailable || 'Checks Available'}
                                            </Text>
                                            <MaterialIcons name="chevron-right" size={18} color="#EF4444" />
                                        </View>
                                        <Text style={[styles.minimizedValue, styles.checksValueText,{color:colors.text}]} >
                                            {order.checks_value} {order.currency}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            
                            {/* Show to_branch or to_driver if not null */}
                            {(order.to_branch || order.to_driver) && (
                                <View style={[styles.minimizedRow, { marginTop: 10 }]}>
                                    <View style={[
                                        styles.minimizedSection,
                                        {
                                            ...Platform.select({
                                                ios: {
                                                    alignItems:isRTL ? "flex-start" : ""
                                                }
                                            }),
                                        }
                                    ]}>
                                        <Text style={[styles.minimizedLabel,{color:colors.textSecondary}]}>
                                            {order.to_branch ? 
                                                (translations[language].tabs.orders.order.to_branch || 'To Branch') : 
                                                (translations[language].tabs.orders.order.to_driver || 'To Driver')}
                                        </Text>
                                        <Text style={[styles.minimizedValue,{color:colors.text}]} >
                                            {order.to_branch || order.to_driver}
                                        </Text>
                                    </View>
                                </View>
                            )}
                            
                            {/* Order date/time info if available */}
                            {order.created_at && (
                                <View style={styles.minimizedDateContainer}>
                                    <Text style={[styles.dateTimeText,{color:colors.textSecondary}]}>
                                        {new Date(order.created_at).toLocaleString('en-US')}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        // Full expanded view
                        <Animated.View 
                            style={[
                                styles.contentContainer,
                                { opacity: heightAnim }
                            ]}
                        >
                            {/* User information sections */}
                            <View style={[styles.userInfoSection]}>
                                {authUserRole !== "business" && (
                                    <UserBox 
                                        box={{
                                            label: translations[language].tabs.orders.order.userSenderBoxLabel,
                                            userName: order.sender,
                                            phone: order.sender_mobile
                                        }} 
                                        orderId={order.order_id}
                                    />
                                )}
                                
                                <UserBox 
                                    box={{
                                        label: translations[language].tabs.orders.order.userClientBoxLabel,
                                        userName: order.receiver_name,
                                        phone: order.receiver_mobile
                                    }} 
                                    orderId={order.order_id}
                                />
                                
                                {!["driver","delivery_company"].includes(authUserRole) && (
                                    <UserBox 
                                        box={{
                                            label: translations[language].tabs.orders.order.userDriverBoxLabel,
                                            userName: order.driver ? order.driver : translations[language].tabs.orders.order.unknown,
                                            phone: order.driver_mobile ? order.driver_mobile : ""
                                        }} 
                                        orderId={order.order_id}
                                    />
                                )}
                            </View>
                            
                            {/* Location section */}
                            <View style={[styles.locationSection,{
                                backgroundColor: colors.surface
                            }]}>
                                <View style={[styles.sectionRow]}>
                                <View style={[
                                        styles.iconWrapper, 
                                        { backgroundColor: '#4CC9F0' }
                                    ]}>
                                        <Ionicons name="location-outline" size={20} color="#ffffff" />
                                    </View>
                                    <View style={[styles.sectionContent,{
                                        ...Platform.select({
                                            ios: {
                                                alignItems:isRTL ? "flex-start" : ""
                                            }
                                        }),
                                    }]}>
                                         <Text style={[styles.sectionTitle,{
                                            color: colors.textSecondary
                                        }]}>
                                            {translations[language].tabs.orders.order.location || 'Delivery Location'}
                                        </Text>
                                        <Text style={[styles.locationCity,{
                                            color: colors.text
                                        }]}>
                                            {order.receiver_city}
                                        </Text>
                                        <Text style={[styles.locationAddress,{
                                            color: colors.text
                                        }]}>
                                           {order.receiver_address}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* sent to branch section */}
                            {((order.to_branch || order.to_driver) && ["driver","delivery_company"].includes(authUserRole)) && <View style={styles.orderTypeSection}>
                                <View style={[styles.sectionRow]}>
                                    <View style={[
                                        styles.iconWrapper, 
                                        {backgroundColor: colors.surface }
                                    ]}>
                                        <MaterialCommunityIcons name="package-variant" size={20} color="#ffffff" />
                                    </View>
                                    <View style={[styles.sectionContent,{
                                        ...Platform.select({
                                            ios: {
                                                alignItems:isRTL ? "flex-start" : ""
                                            }
                                        }),
                                    }]}>
                                         <Text style={[styles.sectionTitle,{
                                            color: colors.textSecondary
                                        }]}>
                                            {order.to_branch ? translations[language].tabs.orders.order.to_branch : translations[language].tabs.orders.order.to_driver}
                                        </Text>
                                        <Text style={[styles.orderTypeText,{
                                            color: colors.text
                                        }]}>
                                            {order.to_branch || order.to_driver}
                                        </Text>
                                    </View>
                                </View>
                            </View>}
                            
                            {/* Order type section */}
                            <View style={[styles.orderTypeSection,{
                                backgroundColor: colors.surface
                            }]}>
                                <View style={[styles.sectionRow,{
                                    backgroundColor: colors.surface
                                }]}>
                                    <View style={[
                                        styles.iconWrapper, 
                                        { backgroundColor: '#7209B7' }
                                    ]}>
                                        <MaterialCommunityIcons name="package-variant" size={20} color="#ffffff" />
                                    </View>
                                    <View style={[styles.sectionContent,{
                                        ...Platform.select({
                                            ios: {
                                                alignItems:isRTL ? "flex-start" : ""
                                            }
                                        }),
                                    }]}>
                                        <Text style={[styles.sectionTitle,{
                                            color: colors.textSecondary
                                        }]}>
                                            {translations[language].tabs.orders.order.orderType}
                                        </Text>
                                        <Text style={[styles.orderTypeText,{
                                            color: colors.text
                                        }]}>
                                            {order.order_type}
                                        </Text>
                                        {(order.received_items || order.received_quantity) ? (
                                            <View style={styles.receivedDetailsContainer}>
                                                {order.received_items && (
                                                     <Text style={[styles.receivedDetailsText,{
                                                        color: colors.text
                                                    }]}>
                                                        {translations[language].tabs.orders.order.receivedItems || 'Received Items'}: {order.received_items}
                                                    </Text>
                                                )}
                                                {order.received_quantity && (
                                                     <Text style={[styles.receivedDetailsText,{
                                                        color: colors.text
                                                    }]}>
                                                        {translations[language].tabs.orders.order.receivedQuantity || 'Quantity'}: {order.received_quantity}
                                                    </Text>
                                                )}
                                            </View>
                                        ) : (
                                            <></>
                                        )}
                                    </View>
                                </View>
                            </View>
                            
                            {/* Cost information section */}
                            <View style={[styles.costSectionWrapper]}>
                                <Text style={[styles.costSectionTitle,{
                                    color: colors.text,
                                    ...Platform.select({
                                        ios: {
                                            textAlign:isRTL ? "left" : ""
                                        }
                                    }),
                                }]}>
                                    {translations[language].tabs.orders.order.financialDetails || 'Financial Details'}
                                </Text>
                                
                                <View style={[styles.costSection]}>
                                    {!["business"].includes(authUserRole) && (<View style={[
                                        styles.costCard,{
                                            backgroundColor: colors.surface
                                        }
                                    ]}>
                                        <View style={[
                                            styles.costIconContainer, 
                                            { backgroundColor: '#4361EE' }
                                        ]}>
                                            <Feather name="package" size={16} color="#ffffff" />
                                        </View>
                                        <View style={[styles.costLabelContainer,{
                                                ...Platform.select({
                                                    ios: {
                                                        alignItems:isRTL ? "flex-start" : ""
                                                    }
                                                }),
                                            }]}>
                                             <Text style={[styles.costLabel,{
                                                color: colors.textSecondary
                                            }]}>
                                                {translations[language].tabs.orders.order.codValue || 'COD Value'}
                                            </Text>
                                            {formatCurrencyValue(order.total_cod_value, order.currency)}
                                        </View>
                                    </View>)}
                                    
                                    {/* Only show delivery fee for non-driver/delivery_company roles */}
                                    {!["driver", "delivery_company","business"].includes(authUserRole) && (
                                        <View style={[
                                            styles.costCard,{
                                                backgroundColor: colors.surface
                                            }
                                        ]}>
                                            <View style={[
                                                styles.costIconContainer, 
                                                { backgroundColor: '#F72585' }
                                            ]}>
                                                <Feather name="truck" size={16} color="#ffffff" />
                                            </View>
                                            <View style={[styles.costLabelContainer,{
                                                ...Platform.select({
                                                    ios: {
                                                        alignItems:isRTL ? "flex-start" : ""
                                                    }
                                                }),
                                            }]}>
                                                 <Text style={[styles.costLabel,{
                                                    color: colors.textSecondary
                                                }]}>
                                                    {translations[language].tabs.orders.order.deliveryFee || 'Delivery Fee'}
                                                </Text>
                                                <Text style={[styles.costText,{
                                                    color: colors.text,
                                                    textAlign: isRTL ? "left" : "left"
                                                }]}>
                                                    {order.delivery_fee} {order.currency}
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                    
                                    {/* Only show net value for non-driver/delivery_company roles */}
                                    {!["driver", "delivery_company"].includes(authUserRole) && (
                                        <View style={[
                                            styles.costCard,{
                                                backgroundColor: colors.surface
                                            }
                                        ]}>
                                            <View style={[
                                                styles.costIconContainer, 
                                                { backgroundColor: '#3A0CA3' }
                                            ]}>
                                                <FontAwesome name="money" size={16} color="#ffffff" />
                                            </View>
                                            <View style={[styles.costLabelContainer,{
                                                ...Platform.select({
                                                    ios: {
                                                        alignItems:isRTL ? "flex-start" : ""
                                                    }
                                                }),
                                            }]}>
                                               <Text style={[styles.costLabel,{
                                                    color: colors.textSecondary
                                                }]}>
                                                    {translations[language].tabs.orders.order.netValue || 'Net Value'}
                                                </Text>
                                                {formatCurrencyValue(order.total_net_value, order.currency)}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        
                            {/* Checks section if applicable */}
                            {order.checks_value > 0 && (
                                <Pressable 
                                    onPress={() => router.push({
                                        pathname: "(order_checks)",
                                        params: { orderId: order.order_id }
                                    })}
                                    style={({ pressed }) => [
                                        styles.checksButton,
                                        pressed && styles.checksButtonPressed
                                    ]}
                                >
                                    <View style={[
                                        styles.checksAlert
                                    ]}>
                                        <View style={[
                                            styles.checksIconContainer
                                        ]}>
                                            <FontAwesome name="money" size={16} color="#ffffff" />
                                        </View>
                                        <View style={[styles.checksTextContainer,{
                                                ...Platform.select({
                                                    ios: {
                                                        alignItems:isRTL ? "flex-start" : ""
                                                    }
                                                }),
                                            }]}>
                                            <Text style={[styles.checksTitle,{
                                                color: colors.textSecondary
                                            }]}>
                                                {translations[language].tabs.orders.order.checksAvailable || 'Checks Available'}
                                            </Text>
                                            <Text style={[styles.checksText,{
                                                color: colors.text
                                            }]}>
                                                {translations[language].tabs.orders.order.checksValue}: {order.checks_value} {order.currency}
                                            </Text>
                                        </View>
                                        <MaterialIcons 
                                            name={"chevron-right"} 
                                            size={24} 
                                            color="#E11D48" 
                                        />
                                    </View>
                                </Pressable>
                            )}
                            
                            {/* Notes section if applicable */}
                            {order.note && (
                                <View style={[
                                    styles.noteContainer
                                ]}>
                                    <View style={[
                                        styles.noteIconContainer
                                    ]}>
                                        <FontAwesome name="sticky-note-o" size={16} color="#ffffff" />
                                    </View>
                                    <View style={[styles.noteContent,{
                                                ...Platform.select({
                                                    ios: {
                                                        alignItems:isRTL ? "flex-start" : ""
                                                    }
                                                }),
                                            }]}>
                                        <Text style={[styles.noteTitle,{
                                            color: colors.textSecondary
                                        }]}>
                                            {translations[language].tabs.orders.order.note || 'Notes'}
                                        </Text>
                                        <Text style={[styles.noteText,{
                                            color: colors.text
                                        }]}>
                                            {order.note}
                                        </Text>
                                    </View>
                                </View>
                            )}
                            
                            {/* Order date/time info if available */}
                            {order.created_at && (
                                <View style={[
                                    styles.dateTimeContainer
                                ]}>
                                    <Text style={[styles.dateTimeText,{
                                        color: colors.textSecondary
                                    }]}>
                                        {new Date(order.created_at).toLocaleString('en-US')}
                                    </Text>
                                </View>
                            )}
                        </Animated.View>
                    )}
                </View>
            </Pressable>

            {/* Control modal for editing or changing status */}
            {showControl && (
                <ModalPresentation
                    showModal={showControl}
                    setShowModal={setShowControl}
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
                            {translations[language].tabs.orders.order.orderActions || 'Order Actions'}
                        </Text>
                    </View>
                    
                    <View style={styles.controlContainer}>
                        {/* Edit Order button logic */}
                        {(
                            // For business users, only show on "waiting" status
                            (authUserRole === "business" && order.status_key === "waiting") ||
                            
                            // For driver and delivery_company, never show
                            (!["driver", "delivery_company", "business"].includes(authUserRole) && 
                             ["waiting", "in_branch", "rejected", "stuck", "delayed", "on_the_way", 
                              "reschedule", "dispatched_to_branch", "dispatched_to_driver", "delivered",
                              "return_before_delivered_initiated", "return_after_delivered_initiated", 
                              "business_returned_delivered", "received", "delivered/received"].includes(order.status_key))
                        ) && (
                            <TouchableOpacity 
                                style={[
                                    styles.controlOption
                                ]} 
                                onPress={() => {
                                    setShowControl(false);
                                    router.push({
                                        pathname: "(create)",
                                        params: { orderId: order.order_id }
                                    });
                                }}
                            >
                                <View style={[
                                    styles.controlIconContainer, 
                                    { backgroundColor: '#4361EE' }
                                ]}>
                                    <Feather name="edit" size={18} color="#ffffff" />
                                </View>
                                <Text style={[styles.controlText,{
                                    color: colors.text,
                                        ...Platform.select({
                                            ios: {
                                                textAlign:isRTL ? "left" : ""
                                            }
                                        }),
                                    }]}>
                                    {translations[language].tabs.orders.order.edit}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Edit receiver phone button logic */}
                        {(
                            // For driver and delivery_company
                            (["driver", "delivery_company"].includes(authUserRole) && 
                             ["on_the_way", "reschedule", "rejected", "stuck", "delayed", "driver_responsibility"].includes(order.status_key)) ||
                            
                            // For business users
                            (authUserRole === "business" && 
                             ["in_branch", "rejected", "stuck", "delayed", "on_the_way", "reschedule", 
                              "dispatched_to_branch", "dispatched_to_driver"].includes(order.status_key))
                        ) && (
                            <TouchableOpacity 
                                style={[
                                    styles.controlOption
                                ]} 
                                onPress={() => {
                                    setShowControl(false);
                                    router.push({
                                        pathname: "(edit_receiver_phones)",
                                        params: { orderId: order.order_id, editPhoneOnly: true }
                                    });
                                }}
                            >
                                <View style={[
                                    styles.controlIconContainer, 
                                    { backgroundColor: '#4361EE' }
                                ]}>
                                    <Feather name="phone" size={18} color="#ffffff" />
                                </View>
                                <Text style={[styles.controlText,{
                                    color: colors.text,
                                        ...Platform.select({
                                            ios: {
                                                textAlign:isRTL ? "left" : ""
                                            }
                                        }),
                                    }]}>
                                    {translations[language].tabs.orders.order.editPhone || "Edit Receiver Phone"}
                                </Text>
                            </TouchableOpacity>
                        )}
                        
                        {!["business","accountant","support_agent","sales_representative","warehouse_admin","warehouse_staff"].includes(authUserRole) && (
                            <TouchableOpacity 
                                style={[
                                    styles.controlOption, 
                                    styles.noBorder
                                ]} 
                                onPress={() => {
                                    setShowControl(false);
                                    setShowStatusUpdateModal(true);
                                }}
                            >
                                <View style={[
                                    styles.controlIconContainer, 
                                    { backgroundColor: '#7209B7' }
                                ]}>
                                    <MaterialIcons name="published-with-changes" size={18} color="#ffffff" />
                                </View>
                                <Text style={[styles.controlText,{
                                    color: colors.text,
                                        ...Platform.select({
                                            ios: {
                                                textAlign:isRTL ? "left" : ""
                                            }
                                        }),
                                    }]}>
                                    {translations[language].tabs.orders.order.changeStatus}
                                </Text>
                            </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity 
                            style={[
                                styles.controlOption, 
                                styles.noBorder
                            ]} 
                            onPress={() => {
                                setShowControl(false);
                                router.push({
                                    pathname: "(track)",
                                    params: { orderId: order.order_id }
                                });
                            }}
                        >
                            <View style={[
                                styles.controlIconContainer, 
                                { backgroundColor: '#10B981' }
                            ]}>
                                <MaterialIcons name="track-changes" size={18} color="#ffffff" />
                            </View>
                            <Text style={[styles.controlText,{
                                color: colors.text,
                                        ...Platform.select({
                                            ios: {
                                                textAlign:isRTL ? "left" : ""
                                            }
                                        }),
                                    }]}>
                                {translations[language].tabs.orders.track.orderTracking || 'Track Order'}
                            </Text>
                        </TouchableOpacity>

                        {["business"].includes(authUserRole) && <TouchableOpacity 
                            style={[
                                styles.controlOption, 
                                styles.noBorder
                            ]} 
                            onPress={() => {
                                setShowControl(false);
                                router.push({
                                    pathname: "/(complaints)/open_complaint",
                                    params: { orderId: order.order_id }
                                });
                            }}
                        >
                            <View style={[
                                styles.controlIconContainer, 
                                { backgroundColor: '#EF4444' }
                            ]}>
                                <MaterialIcons name="report-problem" size={18} color="#ffffff" />
                            </View>
                            <Text style={[styles.controlText,{
                                color: colors.text,
                                        ...Platform.select({
                                            ios: {
                                                textAlign:isRTL ? "left" : ""
                                            }
                                        }),
                                    }]}>
                                {translations[language].tabs.orders.track.openCase}
                            </Text>
                        </TouchableOpacity>}

                        {pendingStatusUpdates.length > 0 && (
                            <TouchableOpacity 
                                style={[
                                    styles.controlOption, 
                                    styles.noBorder,
                                    { backgroundColor: isConnected ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
                                ]} 
                                onPress={retryPendingUpdates}
                            >
                                <View style={[
                                    styles.controlIconContainer, 
                                    { backgroundColor: isConnected ? '#F59E0B' : '#EF4444' }
                                ]}>
                                    <MaterialIcons name="sync" size={18} color="#ffffff" />
                                </View>
                                <Text style={[styles.controlText,{
                                    color: colors.text,
                                }]}>
                                    {isConnected 
                                        ? (translations[language]?.common?.retryPendingUpdates || `Retry Pending Updates (${pendingStatusUpdates.length})`)
                                        : (translations[language]?.common?.pendingUpdatesOffline || `Pending Updates (${pendingStatusUpdates.length}) - Offline`)}
                                </Text>
                            </TouchableOpacity>
                        )}

                    </View>
                </ModalPresentation>
            )}

            {/* Status update modal */}
            {showStatusUpdateModal && (
                <PickerModal
                    list={statusOptions}
                    setSelectedValue={handleStatusUpdate}
                    showPickerModal={showStatusUpdateModal}
                    setShowModal={setShowStatusUpdateModal}
                    field={{
                        name: 'status',
                        label: translations[language].tabs.orders.order.status,
                        showSearchBar: false
                    }}
                />
            )}

            {/* Add new modal components for reason and branch selection */}
            {showReasonModal && (
                <ModalPresentation
                    showModal={showReasonModal}
                    setShowModal={setShowReasonModal}
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
                            {translations[language].tabs.orders.order.selectReason || "Select Reason"}
                        </Text>
                    </View>
                    
                    {/* Search input for reasons */}
                    <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
                        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text,
                                ...Platform.select({
                                    ios: {
                                        textAlign:isRTL ? "right" : ""
                                    }
                                }),
                            }]}
                            placeholder={translations[language].common?.search || "Search reasons..."}
                            placeholderTextColor={colors.textSecondary}
                            value={reasonSearchQuery}
                            onChangeText={setReasonSearchQuery}
                        />
                        {reasonSearchQuery ? (
                            <TouchableOpacity onPress={() => setReasonSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                    
                    {/* Scrollable reason container with fixed height */}
                    <ScrollView 
                        style={styles.reasonScrollContainer}
                        contentContainerStyle={styles.reasonContainer}
                        showsVerticalScrollIndicator={true}
                    >
                        {statusOptions
                            .find(option => option.value === selectedValue.status?.value)?.reasons
                            ?.filter(reason => 
                                !reasonSearchQuery || 
                                reason.label.toLowerCase().includes(reasonSearchQuery.toLowerCase())
                            )
                            .map((reason, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.reasonOption
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
                        ))}
                    </ScrollView>
                </ModalPresentation>
            )}

            {showBranchModal && (
                <ModalPresentation
                    showModal={showBranchModal}
                    setShowModal={setShowBranchModal}
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
                            {translations[language].tabs.orders.order.selectBranch || "Select Branch"}
                        </Text>
                    </View>
                    <View style={styles.branchContainer}>
                        {branches.map((branch, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.branchOption
                                ]}
                                onPress={() => handleBranchSelect(branch)}
                            >
                                <Text style={[styles.branchText,{
                                    color: colors.text,
                                        ...Platform.select({
                                            ios: {
                                                textAlign:isRTL ? "left" : ""
                                            }
                                        }),
                                    }]}>
                                    {branch.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ModalPresentation>
            )}

            {/* Update the Confirm Status Change Modal */}
            {showConfirmStatusChangeUpdateModal && (
                <ModalPresentation
                    showModal={showConfirmStatusChangeUpdateModal}
                    setShowModal={setShowConfirmStatusChangeUpdateModal}
                    customStyles={{ bottom: 15 }}
                >
                    <View style={styles.confirmModalContent}>
                        <Text style={[styles.confirmModalTitle,{
                                    color: colors.text,
                                    ...Platform.select({
                                        ios: {
                                            textAlign:isRTL ? "left" : ""
                                        }
                                    }),
                                }]}>
                            {translations[language].tabs.orders.order.changeStatusAlert} 
                            <Text style={[styles.highlightText,{
                                color: colors.text,
                            }]}> {statusOptions.find(option => option.value === selectedValue.status?.value)?.label || ''}</Text>
                        </Text>
                        
                        {selectedBranch && (
                            <View style={[styles.selectedDetailContainer]}>
                                <Text style={[styles.selectedDetailLabel,{
                                    color: colors.text,
                                    ...Platform.select({
                                        ios: {
                                            textAlign:isRTL ? "left" : ""
                                        }
                                    }),
                                }]}>
                                    {translations[language].tabs.orders.order.branch || "Branch"}:
                                </Text>
                                <Text style={[styles.selectedDetailValue,{
                                    color: colors.text,
                                }]}>{selectedBranch.label}</Text>
                            </View>
                        )}
                        
                        {selectedReason && (
                            <View style={[styles.selectedDetailContainer]}>
                                <Text style={[styles.selectedDetailLabel,{
                                    color: colors.text,
                                    ...Platform.select({
                                        ios: {
                                            textAlign:isRTL ? "left" : ""
                                        }
                                    }),
                                }]}>
                                    {translations[language].tabs.orders.order.reason || "Reason"}:
                                </Text>
                                <Text style={[styles.selectedDetailValue,{
                                    color: colors.text,
                                ...Platform.select({
                                    ios: {
                                        textAlign:isRTL ? "left" : ""
                                    }
                                }),
                            }]}>{selectedReason.label}</Text>
                            </View>
                        )}
                        
                        <TextInput
                            style={[
                                styles.noteInput,
                                {
                                    backgroundColor: colors.surface,
                                    color: colors.text,
                                },
                                {
                                    ...Platform.select({
                                        ios: {
                                            textAlign:isRTL ? "right" : ""
                                        }
                                    }),
                                }
                            ]}
                            placeholder={translations[language].tabs.orders.order.changeStatusAlertNote}
                            value={UpdatedStatusNote}
                            onChangeText={(input) => setUpdatedStatusNote(input)}
                            multiline={true}
                            numberOfLines={3}
                            placeholderTextColor={colors.textSecondary}
                        />
                        
                        <View style={[
                            styles.confirmActions
                        ]}>
                            <TouchableOpacity 
                                style={[
                                    styles.confirmButton,
                                    isUpdating && styles.confirmButtonDisabled
                                ]}
                                onPress={changeStatusHandler}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={[styles.confirmButtonText,{
                                        color: isDark ?  colors.text : "#ffff"
                                    }]}>
                                        {translations[language].tabs.orders.order.changeStatusAlertConfirm}
                                    </Text>
                                )}
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowConfirmStatusChangeUpdateModal(false);
                                    setSelectedReason(null);
                                    setSelectedBranch(null);
                                }}
                            >
                                <Text style={[styles.cancelButtonText]}>
                                    {translations[language].tabs.orders.order.changeStatusAlertCancel}
                                </Text>
                                </TouchableOpacity>
                        </View>
                    </View>
                </ModalPresentation>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <ModalPresentation
                    showModal={showSuccessModal}
                    setShowModal={setShowSuccessModal}
                    position="center"
                >
                    <View style={styles.successModalContainer}>
                        <View style={styles.successIconContainer}>
                            <FontAwesome5 name="check-circle" size={32} color="#FFFFFF" />
                        </View>
                        <Text style={[styles.successModalTitle,{
                            color: colors.success
                        }]}>
                            {translations[language].tabs.orders.order.success}
                        </Text>
                        <Text style={[styles.successModalMessage,{
                            color: colors.success,
                            ...Platform.select({
                                ios: {
                                    textAlign:isRTL ? "left" : ""
                                }
                            }),
                        }]}>
                            {successMessage}
                        </Text>
                    </View>
                </ModalPresentation>
            )}

            {/* Error Modal */}
            {showErrorModal && (
                <ModalPresentation
                    showModal={showErrorModal}
                    setShowModal={handleErrorModalClose}
                    position="center"
                >
                    <View style={styles.errorModalContainer}>
                        <View style={styles.errorIconContainer}>
                            <FontAwesome5 name="exclamation-circle" size={32} color="#FFFFFF" />
                        </View>
                        <Text style={[styles.errorModalTitle,{
                            color: colors.error
                        }]}>
                            {translations[language].tabs.orders.order.error}
                        </Text>
                        <Text style={[styles.errorModalMessage,{
                            color: colors.error
                        }]}>
                            {errorMessage}
                        </Text>
                        <TouchableOpacity
                            style={styles.errorModalButton}
                            onPress={handleErrorModalClose}
                        >
                            <Text style={[styles.errorModalButtonText,{
                                color: isDark ? colors.text : "#ffff"
                            }]}>
                                {translations[language].tabs.orders.order.ok || "OK"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ModalPresentation>
            )}

            {/* Reference ID Modal (after received) */}
            {showReferenceModal && (
                <ModalPresentation
                    showModal={showReferenceModal}
                    setShowModal={setShowReferenceModal}
                    customStyles={{ bottom: 15 }}
                >
                    <View style={styles.referenceModalContainer}>
                        <View style={styles.referenceHeader}>
                            <View style={styles.referenceIconBubble}>
                                <MaterialIcons name="tag" size={18} color="#FFFFFF" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.referenceTitle, { color: colors.text }]}>
                                    {translations[language]?.tabs?.orders?.order?.enterReferenceId}
                                </Text>
                                <Text style={[styles.referenceSubtitle, { color: colors.textSecondary }]}>
                                    {translations[language]?.tabs?.orders?.order?.referenceIdHelper}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.referenceInputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <MaterialIcons name="confirmation-number" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                            <TextInput
                                style={[styles.referenceInput, { color: colors.text }]}
                                placeholder={translations[language]?.tabs?.orders?.order?.referenceIdPlaceholder}
                                placeholderTextColor={colors.textSecondary}
                                value={referenceIdInput}
                                onChangeText={setReferenceIdInput}
                                autoFocus
                            />
                            <TouchableOpacity
                                onPress={() => setReferenceIdInput("")}
                                style={styles.clearInputBtn}
                            >
                                <MaterialIcons name="close" size={18} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.referenceActionsRow}>
                            <TouchableOpacity 
                                style={[styles.scanActionButton]}
                                onPress={() => {
                                    try { if (global) global.scannedReferenceId = null; } catch (_) {}
                                    router.push({ pathname: '(camera)/scanReference' });
                                }}
                            >
                                <MaterialIcons name="qr-code-scanner" size={18} color="#4361EE" />
                                <Text style={styles.scanActionText}>
                                    {translations[language]?.tabs?.orders?.order?.scan}
                                </Text>
                            </TouchableOpacity>

                            <View style={{ flex: 1 }} />

                            <TouchableOpacity 
                                style={[styles.secondaryButton]}
                                onPress={() => setShowReferenceModal(false)}
                            >
                                <Text style={styles.secondaryButtonText}>
                                    {translations[language]?.tabs?.orders?.order?.skip}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.primaryButton, isReferenceUpdating && styles.primaryButtonDisabled]}
                                onPress={submitReferenceId}
                                disabled={isReferenceUpdating}
                            >
                                {isReferenceUpdating ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>
                                        {translations[language]?.tabs?.orders?.order?.save}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ModalPresentation>
            )}
        </RTLWrapper>
    );
}

const styles = StyleSheet.create({
    pressable: {
        borderRadius: 16,
        marginBottom: 16,
    },
    pressablePressed: {
        opacity: 0.9,
        transform: [{ scale: 0.995 }],
    },
    orderCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 0,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
        backgroundColor: 'rgba(67, 97, 238, 0.05)',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        gap:10
    },
    orderIdSection: {
        flex: 1,
    },
    orderIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    orderIdLabel: {
        fontSize: 14,
        color: '#64748B',
    },
    orderIdText: {
        fontWeight: '700',
        fontSize: 16,
        color: '#4361EE',
    },
    referenceId: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 30,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap:4,
        maxWidth: 150,
    },
    statusText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 13,
    },
    contentContainer: {
        padding: 16,
    },
    userInfoSection: {
        marginBottom: 12,
    },
    locationSection: {
        marginBottom: 16,
        backgroundColor: 'rgba(76, 201, 240, 0.06)',
        borderRadius: 12,
        padding: 12,
    },
    orderTypeSection: {
        marginBottom: 16,
        backgroundColor: 'rgba(114, 9, 183, 0.06)',
        borderRadius: 12,
        padding: 12,
    },
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    sectionContent: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B'
    },
    locationCity: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333'
    },
    locationAddress: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },
    orderTypeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    costSectionWrapper: {
        marginBottom: 16,
    },
    costSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 10,
    },
    costSection: {
        flexDirection: 'column',
        gap: 10,
    },
    costCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(249, 250, 251, 1)',
        borderRadius: 12,
        padding: 10,
        gap: 12,
    },
    costIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    costLabelContainer: {
        flex: 1,
    },
    costLabel: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 4,
    },
    currencyContainer: {
        flexDirection: 'column',
    },
    currencyText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    costText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    checksButton: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    checksButtonPressed: {
        opacity: 0.9,
    },
    checksAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        padding: 12,
        gap:10
    },
    checksIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center'
    },
    checksTextContainer: {
        flex: 1,
    },
    checksTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444',
        marginBottom: 2,
    },
    checksText: {
        fontSize: 13,
        color: '#64748B',
    },
    noteContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(67, 97, 238, 0.06)',
        borderRadius: 12,
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 16,
        gap:10
    },
    noteIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4361EE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    noteContent: {
        flex: 1,
    },
    noteTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4361EE',
        marginBottom: 4,
    },
    noteText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    dateTimeContainer: {
        padding: 16,
        paddingTop: 0,
        alignItems: 'flex-end',
    },
    dateTimeText: {
        fontSize: 12,
        color: '#94A3B8',
    },
    
    /* Modal Styles */
    modalHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    modalHeaderText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    controlContainer: {
        width: '100%',
    },
    controlOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
        width: '100%',
        gap:15
    },
    controlIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    controlText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        flex: 1,
    },
    noBorder: {
        borderBottomWidth: 0,
    },
    
    /* Confirm Modal Styles */
    confirmModalContent: {
        padding: 20,
    },
    confirmModalTitle: {
        fontSize: 17,
        fontWeight: '600',
        lineHeight: 24,
        color: '#333',
        marginBottom: 16,
    },
    highlightText: {
        color: '#4361EE',
        fontWeight: '700',
    },
    noteInput: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        borderRadius: 12,
        padding: 16,
        marginVertical: 16,
        backgroundColor: '#f9fafb',
        minHeight: 100,
        textAlignVertical: 'top',
        fontSize: 15,
    },
    confirmActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
        gap: 16,
    },
    confirmButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: '#4361EE',
        borderRadius: 10,
        shadowColor: "#4361EE",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15,
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.2)',
        backgroundColor: '#fff',
    },
    cancelButtonText: {
        color: '#333',
        fontWeight: '600',
        fontSize: 15,
    },
    confirmButtonDisabled: {
        backgroundColor: '#9AA5B1',
        opacity: 0.7,
    },

    // New styles for minimize/expand functionality
    toggleButtonContainer: {
        position: 'relative',
    },
    toggleButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        marginRight: 10,
    },
    toggleButtonHighlight: {
        backgroundColor: '#4361EE',
    },
    expandHintTooltip: {
        position: 'absolute',
        top: -40,
        left: -20,
        backgroundColor: '#4361EE',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        width: 120,
    },
    expandHintText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    minimizedContainer: {
        padding: 16,
        paddingTop: 12,
        paddingBottom: 12,
        backgroundColor: 'rgba(249, 250, 251, 0.8)',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    minimizedRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    minimizedSection: {
        flex: 1,
    },
    minimizedLabel: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 4,
    },
    minimizedValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom:10
    },
    locationMinimized: {
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(0,0,0,0.1)',
        paddingLeft: 16,
    },
    reasonContainer: {
        width: '100%'
    },
    reasonOption: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
        width: '100%',
    },
    reasonText: {
        fontSize: 16,
        color: '#333',
    },
    branchContainer: {
        width: '100%',
    },
    branchOption: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
        width: '100%',
    },
    branchText: {
        fontSize: 16,
        color: '#333',
    },
    selectedDetailContainer: {
        marginBottom: 12,
        padding: 10,
        backgroundColor: 'rgba(67, 97, 238, 0.05)',
        borderRadius: 8,
    },
    selectedDetailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 4,
    },
    selectedDetailValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    successModalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 360,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    successIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    successModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#10B981',
        marginBottom: 12,
        textAlign: 'center',
    },
    successModalMessage: {
        fontSize: 15,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 22,
    },
    errorModalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 360,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
    },
    errorIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    errorModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#EF4444',
        marginBottom: 12,
        textAlign: 'center',
    },
    errorModalMessage: {
        fontSize: 15,
        color: '#4B5563',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    errorModalButton: {
        backgroundColor: '#EF4444',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    errorModalButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
    },
    // Reference modal beautiful styles
    referenceModalContainer: {
        padding: 16,
        gap: 16,
    },
    referenceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    referenceIconBubble: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4361EE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    referenceTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    referenceSubtitle: {
        fontSize: 12,
        opacity: 0.8,
        marginTop: 2,
    },
    referenceInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    referenceInput: {
        flex: 1,
        fontSize: 15,
    },
    clearInputBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    referenceActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 4,
    },
    scanActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(67, 97, 238, 0.08)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    scanActionText: {
        color: '#4361EE',
        fontWeight: '600',
    },
    secondaryButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.15)',
        backgroundColor: '#fff',
    },
    secondaryButtonText: {
        color: '#374151',
        fontWeight: '600',
    },
    primaryButton: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        backgroundColor: '#10B981',
        borderRadius: 10,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryButtonDisabled: {
        backgroundColor: '#6EE7B7',
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    phoneRow: {
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    phoneText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#4361EE',
    },
    phoneActions: {
        flexDirection: 'row',
        gap: 12,
    },
    phoneActionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noteMinimized: {
        backgroundColor: 'rgba(67, 97, 238, 0.06)',
        padding: 8,
        borderRadius: 8,
        marginVertical: 4,
    },
    checksMinimized: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 8,
        borderRadius: 8,
        marginVertical: 4,
    },
    checksValueText: {
        color: '#EF4444',
    },
    highlightOrderType: {
        color: '#7209B7',
        fontWeight: '700',
    },
    checksMinimizedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    receivedDetailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    receivedDetailsText: {
        fontSize: 12,
        color: '#64748B',
        marginLeft: 8,
    },
    minimizedDateContainer: {
        alignItems: 'flex-end',
        marginTop: 5,
    },
    offlineIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#64748B',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 8,
    },
    offlineText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 4,
    },
    pendingIndicator: {
        marginLeft: 6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    syncBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F59E0B',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        marginBottom: -1, // Overlap with the card border
    },
    syncBannerText: {
        color: '#FFFFFF',
        fontWeight: '600',
        flex: 1,
        marginLeft: 8,
    },
    pendingUpdatesIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F59E0B',
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    pendingUpdatesText: {
        color: '#FFFFFF',
        marginLeft: 8,
        flex: 1,
    },
    syncNowButton: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
    },
    syncNowText: {
        color: '#F59E0B',
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
        backgroundColor: '#f9fafb',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        padding: 8,
    },
    reasonScrollContainer: {
        maxHeight: 300, // Fixed height for the scrollable area
    },
    reasonContainer: {
        width: '100%',
    },
    pendingStatusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 6,
    },
    pendingStatusText: {
        color: '#F59E0B',
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 2,
    },
    errorModalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 20,
    },
    errorModalButton: {
        backgroundColor: '#EF4444',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    clearErrorsButton: {
        backgroundColor: '#64748B',
        shadowColor: '#64748B',
    },
});

function areEqual(prevProps, nextProps) {
    // Only re-render if order or user or other relevant props actually change
    return (
        prevProps.order.order_id === nextProps.order.order_id &&
        prevProps.order.status_key === nextProps.order.status_key &&
        prevProps.order.status === nextProps.order.status &&
        prevProps.globalOfflineMode === nextProps.globalOfflineMode &&
        JSON.stringify(prevProps.pendingUpdates) === JSON.stringify(nextProps.pendingUpdates) &&
        prevProps.hideSyncUI === nextProps.hideSyncUI
    );
}

export default React.memo(Order, areEqual);