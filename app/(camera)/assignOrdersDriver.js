import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Text, View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, SafeAreaView, Platform, StatusBar, Animated, Vibration } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from "../../RootLayout";
import PickerModal from '../../components/pickerModal/PickerModal';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import { useRTLStyles } from '../../utils/RTLWrapper';

export default function CameraScanner() {
  const { user } = useAuth();
  const [showDriverSelection, setShowDriverSelection] = useState(false);
  const { language } = useLanguage();
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState(null);
  const [formSpinner, setFormSpinner] = useState({ status: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showCreateDispatchedCollectionModal, setShowCreateDispatchedCollectionModal] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [note, setNote] = useState("");
  const { isRTL } = useRTLStyles();
  const [manualOrderId, setManualOrderId] = useState("");
  const [showStatusSelection, setShowStatusSelection] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showDriverField, setShowDriverField] = useState(false);
  const [showBranchField, setShowBranchField] = useState(false);
  const [showStatusReason, setShowStatusReason] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  
  const [selectedValue, setSelectedValue] = useState({
    toBranch: null,
    toDriver: null,
    fromDriver: null
  });
  const [processingBarcode, setProcessingBarcode] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  
  // Define status options
  const suspendReasons = useMemo(() => [
    { value: 'closed', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.closed || 'Closed' },
    { value: 'no_response', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.no_response || 'No Response' },
    { value: 'cancelled_from_office', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.cancelled_from_office || 'Cancelled From Office' },
    { value: 'address_changed', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.address_changed || 'Address Changed' },
    { value: 'not_compatible', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.not_compatible || 'Not Compatible' },
    { value: 'delivery_fee_issue', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.delivery_fee_issue || 'Delivery Fee Issue' },
    { value: 'duplicate_reschedule', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.duplicate_reschedule || 'Duplicate Reschedule' },
    { value: 'receive_issue', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.receive_issue || 'Receive Issue' },
    { value: 'sender_cancelled', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.sender_cancelled || 'Sender Cancelled' },
    { value: 'reschedule_request', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.reschedule_request || 'Reschedule Request' },
    { value: 'incorrect_number', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.incorrect_number || 'Incorrect Number' },
    { value: 'not_existing', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.not_existing || 'Not Existing' },
    { value: 'cod_issue', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.cod_issue || 'COD Issue' },
    { value: 'death_issue', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.death_issue || 'Death Issue' },
    { value: 'not_exist_in_address', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.not_exist_in_address || 'Not Exist In Address' },
    { value: 'receiver_cancelled', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.receiver_cancelled || 'Receiver Cancelled' },
    { value: 'receiver_no_response', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.receiver_no_response || 'Receiver No Response' },
    { value: 'order_incomplete', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.order_incomplete || 'Order Incomplete' },
    { value: 'receive_request_issue', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.receive_request_issue || 'Receive Request Issue' },
    { value: 'other', label: translations[language]?.tabs?.orders?.order?.states?.suspendReasons?.other || 'Other' }
  ], [language]);
  
  // Define status options - adding name property for compatibility with PickerModal
  const statusOptions = useMemo(() => [
    { label: translations[language]?.tabs?.orders?.order?.states?.waiting || 'Waiting', value: 'waiting', name: translations[language]?.tabs?.orders?.order?.states?.waiting || 'Waiting' },
    { label: translations[language]?.tabs?.orders?.order?.states?.inBranch || 'In Branch', value: 'in_branch', name: translations[language]?.tabs?.orders?.order?.states?.in_branch || 'In Branch', requiresBranch: true },
    { label: translations[language]?.tabs?.orders?.order?.states?.rejected || 'Rejected', value: 'rejected', name: translations[language]?.tabs?.orders?.order?.states?.rejected || 'Rejected', requiresReason: true },
    { label: translations[language]?.tabs?.orders?.order?.states?.stuck || 'Stuck', value: 'stuck', name: translations[language]?.tabs?.orders?.order?.states?.stuck || 'Stuck', requiresReason: true },
    { label: translations[language]?.tabs?.orders?.order?.states?.rescheduled || 'Rescheduled', value: 'reschedule', name: translations[language]?.tabs?.orders?.order?.states?.rescheduled || 'Rescheduled', requiresReason: true },
    { label: translations[language]?.tabs?.orders?.order?.states?.on_the_way || 'On The Way', value: 'on_the_way', name: translations[language]?.tabs?.orders?.order?.states?.on_the_way || 'On The Way', requiresDriver: true },
    { label: translations[language]?.tabs?.orders?.order?.states?.dispatched_to_branch || 'Dispatched To Branch', value: 'dispatched_to_branch', name: translations[language]?.tabs?.orders?.order?.states?.dispatched_to_branch || 'Dispatched To Branch', requiresDriver: true, requiresBranch: true },
    { label: translations[language]?.tabs?.orders?.order?.states?.return_before_delivered_initiated || 'Return Before Delivered Initiated', value: 'return_before_delivered_initiated', name: translations[language]?.tabs?.orders?.order?.states?.return_before_delivered_initiated || 'Return Before Delivered Initiated', requiresReason: true },
    { label: translations[language]?.tabs?.orders?.order?.states?.return_after_delivered_initiated || 'Return After Delivered Initiated', value: 'return_after_delivered_initiated', name: translations[language]?.tabs?.orders?.order?.states?.return_after_delivered_initiated || 'Return After Delivered Initiated', requiresReason: true },
    { label: translations[language]?.tabs?.orders?.order?.states?.return_after_delivered_fee_received || 'Return After Delivered Fee Received', value: 'return_after_delivered_fee_received', name: translations[language]?.tabs?.orders?.order?.states?.return_after_delivered_fee_received || 'Return After Delivered Fee Received', requiresReason: true },
    { label: translations[language]?.tabs?.orders?.order?.states?.delivered || 'Delivered', value: 'delivered', name: translations[language]?.tabs?.orders?.order?.states?.delivered || 'Delivered' },
    { label: translations[language]?.tabs?.orders?.order?.states?.received || 'Received', value: 'received', name: translations[language]?.tabs?.orders?.order?.states?.received || 'Received' }
  ], [language]);
  
  // Add name property to suspendReasons for compatibility with PickerModal
  const suspendReasonsWithName = useMemo(() => {
    return suspendReasons.map(reason => ({
      ...reason,
      name: reason.label
    }));
  }, [suspendReasons]);
  
  // Start animations
  useEffect(() => {
    // Check if user is admin, manager, entry, warehouse_admin, or warehouse_staff
    const adminRoles = ["admin", "manager", "entery", "warehouse_admin", "warehouse_staff"];
    // Don't show status selection for driver or delivery_company roles
    if (user && adminRoles.includes(user.role) && user.role !== 'driver' && user.role !== 'delivery_company') {
      setShowStatusSelection(true);
    }
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Slide up animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Scan line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Use vibration instead of sound to avoid audio focus issues
  const vibrate = (pattern) => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      try {
        if (pattern === 'success') {
          // Short vibration for success
          if (Platform.OS === 'android') {
            // Android specific vibration
            Vibration.vibrate(100);
          } else {
            // iOS specific vibration (shorter)
            Vibration.vibrate(50);
          }
        } else if (pattern === 'error') {
          // Pattern vibration for error (vibrate-pause-vibrate)
          Vibration.vibrate([0, 100, 100, 100]);
        }
      } catch (error) {
        console.log('Vibration error:', error);
      }
    }
  };

  // Try to play sound, but fall back to vibration if it fails
  const playSound = async (type) => {
    try {
      // First attempt to play sound
      const soundFile = type === 'success' 
        ? require('../../assets/sound/success.mp3') 
        : require('../../assets/sound/failure.mp3');
      
      const { sound } = await Audio.Sound.createAsync(soundFile, 
        { shouldPlay: true },
        (status) => {
          if (status.didJustFinish) {
            sound.unloadAsync();
          }
        }
      );
      
      // If sound creation was successful but we can't play it, use vibration as fallback
      sound.playAsync().catch(() => {
        vibrate(type);
      });
    } catch (error) {
      // If sound creation fails, fall back to vibration
      vibrate(type);
    }
  };

  const playSuccessSound = async () => {
    vibrate('success'); // Just use vibration directly to avoid audio issues
  };

  const playErrorSound = async () => {
    vibrate('error'); // Just use vibration directly to avoid audio issues
  };

  const createDispatchedCollection = async () => {
    // Create a timeout promise that rejects after 30 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), 30000);
    });

    try {
      setFormSpinner({ status: true });
      
      const ids = scannedItems || [];
      if (ids.length === 0) {
        Alert.alert(
          translations[language].errors.error,
          translations[language].camera.noItemsScanned
        );
        setFormSpinner({ status: false });
        return;
      }
      
      // Check if driver selection is required but no driver is selected
      if (showDriverSelection && !selectedValue.fromDriver) {
        Alert.alert(
          translations[language].errors.error,
          translations[language]?.camera?.driverSelectionRequired || "Please select a driver"
        );
        setFormSpinner({ status: false });
        return;
      }

      // Format orders array based on collection type
      const formattedOrders = ids.map(id => {
        const orderId = typeof id === 'object' ? id.order_id : id;
        return { order_id: orderId };
      });
      
      // Create the fetch promise
      const fetchPromise = fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/collections`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          'Accept-Language': language
        },
        body: JSON.stringify({
          type_id: 3,
          orders: formattedOrders,
          driver_id: showDriverSelection && selectedValue.fromDriver ? selectedValue.fromDriver.user_id : user?.userId,
          to_branch_id: selectedValue.toBranch?.branch_id ? selectedValue.toBranch?.branch_id : null,
          to_driver_id: selectedValue.toDriver?.user_id ? selectedValue.toDriver?.user_id : null
        })
      });
      
      // Race between the fetch and the timeout
      const res = await Promise.race([fetchPromise, timeoutPromise]);
      
      // Try to parse the response, with error handling
      let responseData;
      try {
        responseData = await res.json();
      } catch (parseError) {
        setFormSpinner({ status: false });
        Alert.alert(
          translations[language].errors.error,
          translations[language].errors.failedToParse
        );
        return;
      }
      
      if (!res.ok) {
        setFormSpinner({ status: false });
        Alert.alert(
          translations[language].errors.error,
          responseData.message || 'An unknown error occurred'
        );
        return;
      } 
      
      // Success case
      setSuccess(true);
      setFormSpinner({ status: false });
      
      // Small delay before navigation to ensure UI updates
      setTimeout(() => {
        router.back();
      }, 100);
      
    } catch (err) {
      setFormSpinner({ status: false });
      
      // Show appropriate error message based on error type
      if (err.message === 'Request timed out') {
        Alert.alert(
          translations[language].errors.error,
          translations[language].errors.requestTimedOut
        );
      } else if (err.name === 'AbortError') {
        Alert.alert(
          translations[language].errors.error,
          translations[language].errors.requestAborted
        );
      } else {
        Alert.alert(
          translations[language].errors.error,
          translations[language].errors.unexpectedError
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    setLoading(true)
    try {
      // const token = await getToken("userToken");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/branches?language_code=${language}`, {
        method: "GET",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
          // "Cookie": token ? `token=${token}` : ""
        }
      });
      const data = await res.json();
      setBranches(data.data);
      setLoading(false)
    } catch (err) {
      Alert.alert(
        translations[language].errors.error,
        translations[language].camera.branchesError
      );
    }
  };

  const fetchDrivers = async () => {
    setLoading(true)
    try {
      // const token = await getToken("userToken");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users?role_id=4,9&language_code=${language}`, {
        method: "GET",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
          // "Cookie": token ? `token=${token}` : ""
        }
      });
      const data = await res.json();
      setDrivers(data.data);
      setLoading(false)
    } catch (err) {
      Alert.alert(
        translations[language].errors.error,
        translations[language].camera.driversError
      );
    }
  };

  const branchHandler = (fieldType) => {
    setShowPickerModal(true);
    fetchBranches();
    setCurrentField(fieldType);
  };

  const driverHandler = (fieldType) => {
    setShowPickerModal(true);
    fetchDrivers();
    setCurrentField(fieldType);
  };

  const clearSelection = (fieldType) => {
    setSelectedValue(prev => ({...prev, [fieldType]: null}));
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      setLoading(true);
      // const token = await getToken("userToken");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/${orderId}/basic_info?language_code=${language}`, {
        method: "GET",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
          // "Cookie": token ? `token=${token}` : ""
        }
      });
      
      // Check for non-JSON responses first
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setError(translations[language].camera.orderNotFoundError);
        setTimeout(() => setError(null), 2000);
        return null;
      }
      
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        setError(translations[language].camera.orderNotFoundError);
        setTimeout(() => setError(null), 2000);
        return null;
      }
      
      if (!res.ok) {
        setError(data.message || translations[language].camera.orderNotFoundError);
        setTimeout(() => setError(null), 2000);
        return null;
      }
      
      return data.data;
    } catch (err) {
      setError(translations[language].camera.orderLookupError);
      setTimeout(() => setError(null), 2000);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleManualOrderAdd = async () => {
    if (!manualOrderId.trim()) return;

    const stringifiedItem = String(manualOrderId).trim();
    
    // Enhanced duplicate detection - check multiple fields and variations
    const isDuplicate = scannedItems.some(item => {
      const itemOrderId = String(item.order_id || '').trim();
      const itemReferenceId = String(item.reference_id || '').trim();
      const itemId = String(item.id || '').trim();
      
      // Check exact matches with the entered data
      return itemOrderId === stringifiedItem || 
             itemReferenceId === stringifiedItem ||
             itemId === stringifiedItem ||
             // Also check if the entered item matches any of the stored identifiers
             stringifiedItem === itemOrderId ||
             stringifiedItem === itemReferenceId ||
             stringifiedItem === itemId;
    });

    if (isDuplicate) {
      setError(translations[language].camera.scanDuplicateTextError || "This order has already been scanned");
      playErrorSound();
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Set processing flag to show loading state
    setProcessingBarcode(true);
    
    // Fetch order details
    const orderDetails = await fetchOrderDetails(manualOrderId);
    
    if (orderDetails) {
      // Final duplicate check with the fetched order details
      const finalDuplicateCheck = scannedItems.some(item => {
        const itemOrderId = String(item.order_id || '').trim();
        const itemReferenceId = String(item.reference_id || '').trim();
        const itemId = String(item.id || '').trim();
        
        const detailsOrderId = String(orderDetails.order_id || '').trim();
        const detailsReferenceId = String(orderDetails.reference_id || '').trim();
        const detailsId = String(orderDetails.id || '').trim();
        
        // Check if any identifier matches
        return (itemOrderId && (itemOrderId === detailsOrderId || itemOrderId === detailsReferenceId || itemOrderId === detailsId)) ||
               (itemReferenceId && (itemReferenceId === detailsOrderId || itemReferenceId === detailsReferenceId || itemReferenceId === detailsId)) ||
               (itemId && (itemId === detailsOrderId || itemId === detailsReferenceId || itemId === detailsId));
      });
      
      if (finalDuplicateCheck) {
        setError(translations[language].camera.scanDuplicateTextError || "This order has already been scanned");
        playErrorSound();
        setTimeout(() => setError(null), 5000);
      } else {
        setScannedItems(prev => [...prev, orderDetails]);
        setManualOrderId(""); // Clear input after adding
        playSuccessSound();
      }
    } else {
      playErrorSound();
    }
    
    // Reset processing flag
    setProcessingBarcode(false);
  };
  
  // Handle status change
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    
    // Check if the selected status requires a driver or branch
    const statusOption = statusOptions.find(option => option.value === status);
    
    if (statusOption) {
      // Handle reason requirement
      if (statusOption.requiresReason) {
        setShowStatusReason(true);
      } else {
        setShowStatusReason(false);
        setSelectedReason(null);
      }
      
      // Handle driver field visibility
      const shouldShowDriver = status === 'on_the_way' || status === 'dispatched_to_branch';
      setShowDriverField(shouldShowDriver);
      
      // Handle branch field visibility
      const shouldShowBranch = status === 'dispatched_to_branch' || status === 'in_branch';
      setShowBranchField(shouldShowBranch);
    }
  };
  
  // Update order status
  const updateOrderStatus = async () => {
    // For driver or delivery_company roles, use the selected status or default to with_driver
    if (user && (user.role === 'driver' || user.role === 'delivery_company')) {
      // Use selectedStatus if available, otherwise default to with_driver
      const driverStatus = selectedStatus || 'with_driver';
      
      // Check if we have any orders to update
      if (scannedItems.length === 0) {
        Alert.alert(
          translations[language].errors.error,
          translations[language].camera.noItemsScanned
        );
        return;
      }
      
      setFormSpinner({ status: true });
      
      // Process orders with driver assignment
      try {
        // First create a collection to assign the driver_id
        // Format orders array
        const formattedOrders = scannedItems.map(item => {
          const orderId = typeof item === 'object' ? item.order_id : item;
          return { order_id: orderId };
        });
        
        // Prepare the collection request body
        const collectionRequestBody = {
          type_id: 3, // For dispatched collection
          orders: formattedOrders,
          driver_id: user.userId
        };
        
        // Send the collection request to assign driver_id
        const collectionRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/collections`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            'Accept-Language': language
          },
          body: JSON.stringify(collectionRequestBody)
        });
        
        const collectionData = await collectionRes.json();
        
        if (!collectionRes.ok) {
          throw new Error(collectionData.message || 'Failed to assign driver');
        }
        
        // After successful driver assignment, update the status
        const updates = scannedItems.map(item => {
          const orderId = typeof item === 'object' ? item.order_id : item;
          
          return {
            order_id: orderId,
            status: driverStatus,
            note_content: note
          };
        });
        
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/status`, {
          method: "PUT",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Accept-Language': language
          },
          credentials: "include",
          body: JSON.stringify({ updates })
        });
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.details || 'Failed to update status');
        }
        
        setSuccess(true);
        setTimeout(() => {
          router.back();
        }, 100);
        
        return; // Exit early since we've handled the special case
      } catch (error) {
        setFormSpinner({ status: false });
        Alert.alert(
          translations[language].errors.error,
          error.message || translations[language].errors.unexpectedError
        );
        return;
      }
    }
    
    // Regular flow for other user roles
    if (!selectedStatus) {
      Alert.alert(
        translations[language].errors.error,
        translations[language].errors.pleaseSelectStatus
      );
      return;
    }
    
    // Check if we need a reason but don't have one
    const statusOption = statusOptions.find(option => option.value === selectedStatus);
    if (statusOption?.requiresReason && !selectedReason) {
      Alert.alert(
        translations[language].errors.error,
        translations[language].errors.pleaseSelectReason
      );
      return;
    }
    
    // Validate driver selection for on_the_way status
    if (selectedStatus === 'on_the_way' && !selectedValue.fromDriver) {
      Alert.alert(
        translations[language].errors.error,
        translations[language]?.camera?.driverSelectionRequired || 'Please select a driver'
      );
      return;
    }
    
    // Validate branch selection for dispatched_to_branch or in_branch status
    if ((selectedStatus === 'dispatched_to_branch' || selectedStatus === 'in_branch') && !selectedValue.toBranch) {
      Alert.alert(
        translations[language].errors.error,
        translations[language].errors.pleaseSelectBranch
      );
      return;
    }
    
    // Check if we have any orders to update
    if (scannedItems.length === 0) {
      Alert.alert(
        translations[language].errors.error,
        translations[language].errors.noItemsScanned
      );
      return;
    }
    
    setFormSpinner({ status: true });
    
    try {
      // For on_the_way or dispatched_to_branch, use collection endpoint
      if (selectedStatus === 'on_the_way' || selectedStatus === 'dispatched_to_branch') {
        // Format orders array
        const formattedOrders = scannedItems.map(item => {
          const orderId = typeof item === 'object' ? item.order_id : item;
          return { order_id: orderId };
        });
        
        // Prepare the request body
        const requestBody = {
          type_id: 3, // For dispatched collection
          orders: formattedOrders,
          driver_id: selectedValue.fromDriver ? selectedValue.fromDriver.user_id : user?.userId
        };
        
        // Add branch if needed
        if (selectedStatus === 'dispatched_to_branch' && selectedValue.toBranch) {
          requestBody.to_branch_id = selectedValue.toBranch.branch_id;
        }
        
        // Add driver if needed
        if (selectedValue.toDriver) {
          requestBody.to_driver_id = selectedValue.toDriver.user_id;
        }
        
        // Send the request
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/collections`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            'Accept-Language': language
          },
          body: JSON.stringify(requestBody)
        });
        
        const responseData = await res.json();
        
        if (!res.ok) {
          throw new Error(responseData.message || 'Failed to update status');
        }
        
        setSuccess(true);
        setTimeout(() => {
          router.back();
        }, 100);
      } else {
        // For other statuses, use the orders/status endpoint
        const updates = scannedItems.map(item => {
          const orderId = typeof item === 'object' ? item.order_id : item;
          
          return {
            order_id: orderId,
            status: selectedStatus,
            note_content: note,
            ...(selectedReason && { reason: selectedReason }),
            ...(selectedStatus === 'in_branch' && selectedValue.toBranch && { 
              current_branch: selectedValue.toBranch.branch_id 
            })
          };
        });
        
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/status`, {
          method: "PUT",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Accept-Language': language
          },
          credentials: "include",
          body: JSON.stringify({ updates })
        });
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.details || 'Failed to update status');
        }
        
        setSuccess(true);
        setTimeout(() => {
          router.back();
        }, 100);
      }
    } catch (err) {
      Alert.alert(
        translations[language].errors.error,
        err.message || 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setFormSpinner({ status: false });
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    // Prevent duplicate scans by checking if we're already processing a barcode
    if (processingBarcode) return;
    
    // Set processing flag to prevent duplicate scans
    setProcessingBarcode(true);
    
    try {
      let itemToAdd = data;
      
      if (type === 'qr') {
        try {
          // Try parsing as JSON first
          const parsedData = JSON.parse(data);
          itemToAdd = parsedData;
        } catch (parseError) {
          // If parsing fails, use the raw data
          itemToAdd = data;
        }
      }

      // Convert to string for comparison
      const stringifiedItem = String(itemToAdd).trim();
      
      // Enhanced duplicate detection - check multiple fields and variations
      const isDuplicate = scannedItems.some(item => {
        const itemOrderId = String(item.order_id || '').trim();
        const itemReferenceId = String(item.reference_id || '').trim();
        const itemId = String(item.id || '').trim();
        
        // Check exact matches with the scanned data
        return itemOrderId === stringifiedItem || 
               itemReferenceId === stringifiedItem ||
               itemId === stringifiedItem ||
               // Also check if the scanned item matches any of the stored identifiers
               stringifiedItem === itemOrderId ||
               stringifiedItem === itemReferenceId ||
               stringifiedItem === itemId;
      });

      if (isDuplicate) {
        setError(translations[language].camera.scanDuplicateTextError || "This order has already been scanned");
        playErrorSound();
        setTimeout(() => setError(null), 5000);
        setProcessingBarcode(false);
        // Don't set scanned to true for duplicates, so we can scan again immediately
        return;
      }

      // Set scanned to true to disable camera and show rescan button
      setScanned(true);
      
      // Fetch order details
      const orderDetails = await fetchOrderDetails(stringifiedItem);
      
      if (orderDetails) {
        // Final duplicate check with the fetched order details
        const finalDuplicateCheck = scannedItems.some(item => {
          const itemOrderId = String(item.order_id || '').trim();
          const itemReferenceId = String(item.reference_id || '').trim();
          const itemId = String(item.id || '').trim();
          
          const detailsOrderId = String(orderDetails.order_id || '').trim();
          const detailsReferenceId = String(orderDetails.reference_id || '').trim();
          const detailsId = String(orderDetails.id || '').trim();
          
          // Check if any identifier matches
          return (itemOrderId && (itemOrderId === detailsOrderId || itemOrderId === detailsReferenceId || itemOrderId === detailsId)) ||
                 (itemReferenceId && (itemReferenceId === detailsOrderId || itemReferenceId === detailsReferenceId || itemReferenceId === detailsId)) ||
                 (itemId && (itemId === detailsOrderId || itemId === detailsReferenceId || itemId === detailsId));
        });
        
        if (finalDuplicateCheck) {
          setError(translations[language].camera.scanDuplicateTextError || "This order has already been scanned");
          playErrorSound();
          setTimeout(() => setError(null), 5000);
          setScanned(false);
        } else {
          setScannedItems(prev => [...prev, orderDetails]);
          playSuccessSound();
        }
      } else {
        playErrorSound();
        // If order details fetch fails, allow immediate rescan
        setScanned(false);
      }
    } catch (err) {
      setError(translations[language].camera.scanInvalidTextError);
      playErrorSound();
      setTimeout(() => setError(null), 5000);
      // If there's an error, allow immediate rescan
      setScanned(false);
    } finally {
      // Only reset processing flag, keep scanned state to require manual rescan
      setProcessingBarcode(false);
    }
  };

  useEffect(() => {
    const requestCameraPermission = async () => {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        setError(translations[language].camera.permission.notGranted);
      }
    };

    if (!permission) {
      requestCameraPermission();
    }
  }, [requestPermission, permission]);

  if (!permission?.granted) {
    return (
      <SafeAreaView style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.statusBarBg} />
        <View style={[styles.permissionContent, { backgroundColor: colors.card }]}>
          <Feather name="camera-off" size={50} color={colors.primary} />
          <Text style={[styles.permissionText, { color: colors.text }]}>
            {translations[language].camera.permission.request}
          </Text>
          <TouchableOpacity 
            style={[styles.permissionButton, { backgroundColor: colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={[styles.permissionButtonText, { color: colors.buttonText }]}>
              {translations[language]?.camera?.permission?.grant || 'Grant Permission'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.statusBarBg} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <CameraView
          style={[StyleSheet.absoluteFillObject, { height: '60%' }]}
          active={!showCreateDispatchedCollectionModal}
          facing='back'
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barCodeScannerSettings={{
            barCodeTypes: [
              'qr',
              'ean-13',
              'ean-8',
              'code-128',
              'code-39',
              'upc-e',
              'codabar'
            ],
            // Adjust settings to improve scan accuracy for a single code
            interval: 1000, // milliseconds between scan attempts (higher = less frequent)
          }}
        >
          <View style={styles.overlay}>
             {/* Back button */}
              <TouchableOpacity 
                style={[
                  styles.backButtonContainer,
                  isRTL ? { left: 20 } : { left: 20 }
                ]}
                onPress={() => router.back()}
              >
                <View style={[styles.backButtonCircle, {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                }]}>
                  <MaterialCommunityIcons name="window-close" size={24} color="#ffffff" />
                </View>
              </TouchableOpacity>
            
            {/* Scanner focus area - using a more neutral design */}
            <View style={[
              styles.scannerFocusArea,
              { 
                borderColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 5,
              }
            ]}>
              <Animated.View 
                style={[
                  styles.scanLine,
                  {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    transform: [
                      {
                        translateY: scanLineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-120, 120]
                        })
                      }
                    ]
                  }
                ]} 
              />
            </View>
          
            {/* Instructions text */}
            <View style={styles.instructionsContainer}>
              <Animated.Text 
                style={[
                  styles.scanText, 
                  {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    borderRadius: 30,
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    overflow: 'hidden',
                    textAlign: 'center',
                    fontWeight: '500',
                    opacity: fadeAnim
                  }
                ]}
              >
                {!scanned && translations[language].camera.scanText}
              </Animated.Text>
              
              {error && (
                <Animated.View 
                  style={[
                    styles.errorBanner, 
                    {
                      backgroundColor: 'rgba(239, 68, 68, 0.9)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 30,
                      marginTop: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 3,
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }]
                    }
                  ]}
                >
                  <MaterialIcons name="error-outline" size={20} color="white" />
                  <Text style={[styles.errorBannerText, { marginLeft: 8, color: 'white', fontWeight: '500' }]}>
                    {error}
                  </Text>
                </Animated.View>
              )}
              
              {(scanned && !showCreateDispatchedCollectionModal) && (
                <Animated.View 
                  style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }}
                >
                  <TouchableOpacity
                    style={[styles.rescanButton, { 
                      backgroundColor: colors.primary,
                      paddingVertical: 14,
                      paddingHorizontal: 24,
                      borderRadius: 30,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 20,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.3,
                      shadowRadius: 5,
                      elevation: 5,
                    }]}
                    onPress={() => {
                      setScanned(false);
                      setProcessingBarcode(false);
                    }}
                  >
                    <Feather name="refresh-cw" size={18} color={colors.buttonText} style={{marginRight: 10}} />
                    <Text style={[styles.rescanButtonText, { 
                      color: colors.buttonText,
                      fontSize: 16,
                      fontWeight: '600'
                    }]}>
                      {translations[language].camera.scanAgainTapText}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>
          </View>
        </CameraView>
      
        {showCreateDispatchedCollectionModal ? (
          <Animated.View 
            style={[
              styles.modalContainer, 
              { 
                backgroundColor: colors.card,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {user && (user.role === 'driver' || user.role === 'delivery_company') 
                  ? (translations[language]?.tabs?.orders?.order?.selectStatus || 'Select Status')
                  : (selectedStatus 
                      ? `${translations[language]?.tabs?.orders?.order?.changeStatus || 'Change Status'}: ${statusOptions.find(opt => opt.value === selectedStatus)?.label || selectedStatus}` 
                      : translations[language]?.tabs?.orders?.order?.changeStatus || 'Change Status')}
              </Text>
              <TouchableOpacity 
                style={[styles.backButton, isRTL && { left: 16 }]} 
                onPress={() => setShowCreateDispatchedCollectionModal(false)}
              >
                <Feather 
                  name={isRTL ? "chevron-right" : "chevron-left"} 
                  size={24} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalContent}>
                {/* Special options for driver or delivery_company roles */}
                {user && (user.role === 'driver' || user.role === 'delivery_company') ? (
                  <View style={styles.driverOptionsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.driverOptionButton,
                        { 
                          backgroundColor: selectedStatus === 'with_driver' ? colors.primary : colors.inputBg,
                          borderColor: selectedStatus === 'with_driver' ? colors.primary : colors.inputBorder,
                        }
                      ]}
                      onPress={() => setSelectedStatus('with_driver')}
                    >
                      <View style={styles.driverOptionContent}>
                        <View style={[
                          styles.driverOptionIconContainer,
                          { backgroundColor: selectedStatus === 'with_driver' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(67, 97, 238, 0.1)' }
                        ]}>
                          <MaterialIcons 
                            name="person" 
                            size={24} 
                            color={selectedStatus === 'with_driver' ? colors.buttonText : colors.primary} 
                          />
                        </View>
                        <View style={styles.driverOptionTextContainer}>
                          <Text style={[
                            styles.driverOptionTitle,
                            { color: selectedStatus === 'with_driver' ? colors.buttonText : colors.text }
                          ]}>
                            {translations[language]?.tabs?.orders?.order?.states?.with_driver || 'With Driver'}
                          </Text>
                          <Text style={[
                            styles.driverOptionDescription,
                            { color: selectedStatus === 'with_driver' ? colors.buttonText : colors.textSecondary }
                          ]}>
                            {translations[language]?.tabs?.orders?.order?.states?.withDriverDescription || 'Assign orders to yourself'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.driverOptionButton,
                        { 
                          backgroundColor: selectedStatus === 'on_the_way' ? colors.primary : colors.inputBg,
                          borderColor: selectedStatus === 'on_the_way' ? colors.primary : colors.inputBorder,
                        }
                      ]}
                      onPress={() => setSelectedStatus('on_the_way')}
                    >
                      <View style={styles.driverOptionContent}>
                        <View style={[
                          styles.driverOptionIconContainer,
                          { backgroundColor: selectedStatus === 'on_the_way' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(67, 97, 238, 0.1)' }
                        ]}>
                          <MaterialIcons 
                            name="local-shipping" 
                            size={24} 
                            color={selectedStatus === 'on_the_way' ? colors.buttonText : colors.primary} 
                          />
                        </View>
                        <View style={styles.driverOptionTextContainer}>
                          <Text style={[
                            styles.driverOptionTitle,
                            { color: selectedStatus === 'on_the_way' ? colors.buttonText : colors.text }
                          ]}>
                            {translations[language]?.tabs?.orders?.order?.states?.on_the_way_assign_driver || 'On The Way'}
                          </Text>
                          <Text style={[
                            styles.driverOptionDescription,
                            { color: selectedStatus === 'on_the_way' ? colors.buttonText : colors.textSecondary }
                          ]}>
                            {translations[language]?.tabs?.orders?.order?.states?.onTheWayDescription || 'Orders are out for delivery'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : showStatusSelection ? (
                  <>
                    {/* Status selection */}
                    <View style={styles.fieldContainer}>
                      <Text style={[
                        styles.fieldLabel,
                        { color: colors.textSecondary },
                        {
                          ...Platform.select({
                            ios: {
                              textAlign: isRTL ? "left" : "right"
                            }
                          }),
                        }
                      ]}>
                        {translations[language]?.tabs?.orders?.order?.status || "Status"}
                      </Text>
                      <View style={styles.pickerWithClearButton}>
                        <TouchableOpacity 
                          style={[
                            styles.pickerButton, 
                            { 
                              borderColor: selectedStatus ? colors.primary : colors.inputBorder,
                              backgroundColor: colors.inputBg,
                              flex: 1,
                              height: 50,
                              borderRadius: 12
                            }
                          ]} 
                          onPress={() => {
                            setShowPickerModal(true);
                            setCurrentField("status");
                          }}
                        >
                          <Text style={[
                            styles.pickerButtonText, 
                            selectedStatus 
                              ? [styles.pickerSelectedText, { color: colors.text }] 
                              : [styles.pickerPlaceholderText, { color: colors.textTertiary }],
                          ]}>
                            {selectedStatus ? statusOptions.find(opt => opt.value === selectedStatus)?.label || selectedStatus : translations[language]?.tabs?.orders?.order?.selectStatus || "Select Status"}
                          </Text>
                          <Feather name="chevron-down" size={18} color={selectedStatus ? colors.primary : colors.textSecondary} />
                        </TouchableOpacity>
                        {selectedStatus && (
                          <TouchableOpacity
                            style={[styles.clearFieldButton, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)' }]}
                            onPress={() => {
                              setSelectedStatus(null);
                              setShowStatusReason(false);
                              setSelectedReason(null);
                              setShowDriverField(false);
                              setShowBranchField(false);
                            }}
                          >
                            <Feather name="x" size={18} color={colors.error} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    
                    {/* Reason selection for statuses that require it */}
                    {showStatusReason && (
                      <View style={styles.fieldContainer}>
                        <Text style={[
                          styles.fieldLabel,
                          { color: colors.textSecondary },
                          {
                            ...Platform.select({
                              ios: {
                                textAlign: isRTL ? "left" : "right"
                              }
                            }),
                          }
                        ]}>
                          {translations[language]?.tabs?.orders?.order?.reason || "Reason"}
                        </Text>
                        <View style={styles.pickerWithClearButton}>
                          <TouchableOpacity 
                            style={[
                              styles.pickerButton, 
                              { 
                                borderColor: selectedReason ? colors.primary : colors.inputBorder,
                                backgroundColor: colors.inputBg,
                                flex: 1,
                                height: 50,
                                borderRadius: 12
                              }
                            ]} 
                            onPress={() => {
                              setShowPickerModal(true);
                              setCurrentField("reason");
                            }}
                          >
                            <Text style={[
                              styles.pickerButtonText, 
                              selectedReason 
                                ? [styles.pickerSelectedText, { color: colors.text }] 
                                : [styles.pickerPlaceholderText, { color: colors.textTertiary }],
                            ]}>
                              {selectedReason ? suspendReasons.find(r => r.value === selectedReason)?.label || selectedReason : translations[language]?.tabs?.orders?.order?.selectReason || "Select Reason"}
                            </Text>
                            <Feather name="chevron-down" size={18} color={selectedReason ? colors.primary : colors.textSecondary} />
                          </TouchableOpacity>
                          {selectedReason && (
                            <TouchableOpacity
                              style={[styles.clearFieldButton, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)' }]}
                              onPress={() => setSelectedReason(null)}
                            >
                              <Feather name="x" size={18} color={colors.error} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    )}
                    
                    {/* Note field */}
                    <View style={styles.fieldContainer}>
                      {/* Note field is currently disabled */}
                    </View>
                  </>
                ) : null}

                {/* Show driver selection based on status */}
                {(showDriverSelection || showDriverField) && (
                  <View style={styles.fieldContainer}>
                    <Text style={[
                      styles.fieldLabel,
                      { color: colors.textSecondary },
                      {
                        ...Platform.select({
                          ios: {
                            textAlign: isRTL ? "left" : "right"
                          }
                        }),
                      }
                    ]}>
                      {translations[language]?.camera?.selectDriverFrom || "Select Driver"}
                    </Text>
                    <View style={styles.pickerWithClearButton}>
                      <TouchableOpacity 
                        style={[
                          styles.pickerButton, 
                          { 
                            borderColor: selectedValue.fromDriver ? colors.primary : colors.inputBorder,
                            backgroundColor: colors.inputBg,
                            flex: 1,
                            height: 50,
                            borderRadius: 12
                          }
                        ]} 
                        onPress={() => {
                          setShowPickerModal(true);
                          fetchDrivers();
                          setCurrentField("fromDriver");
                        }}
                      >
                        <Text style={[
                          styles.pickerButtonText, 
                          selectedValue.fromDriver?.name 
                            ? [styles.pickerSelectedText, { color: colors.text }] 
                            : [styles.pickerPlaceholderText, { color: colors.textTertiary }],
                        ]}>
                          {selectedValue.fromDriver?.name || translations[language]?.camera?.selectDriver || "Select Driver"}
                        </Text>
                        <Feather name="chevron-down" size={18} color={selectedValue.fromDriver ? colors.primary : colors.textSecondary} />
                      </TouchableOpacity>
                      {selectedValue.fromDriver && (
                        <TouchableOpacity
                          style={[styles.clearFieldButton, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)' }]}
                          onPress={() => clearSelection('fromDriver')}
                        >
                          <Feather name="x" size={18} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
                
                {/* <View style={styles.fieldContainer}>
                  <Text style={[
                    styles.fieldLabel,
                    isRTL && { textAlign: "left" },
                    { color: colors.textSecondary },
                    {
                      ...Platform.select({
                        ios: {
                          textAlign:isRTL ? "left" : "right"
                        }
                      }),
                    }
                  ]}>
                    {translations[language].camera.note}
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput, 
                      { 
                        borderColor: colors.inputBorder,
                        backgroundColor: colors.inputBg,
                        color: colors.inputText,
                        borderRadius: 12,
                        padding: 14,
                        textAlignVertical: "top"
                      }
                    ]}
                    placeholder={translations[language].camera.notePlaceholder}
                    placeholderTextColor={colors.textTertiary}
                    value={note}
                    onChangeText={(input) => setNote(input)}
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View> */}
                
                {/* Branch selection - show only for in_branch or dispatched_to_branch status */}
                {(showBranchField) && (
                <View style={styles.fieldContainer}>
                  <Text style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary },
                    {
                      ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : "right"
                        }
                      }),
                    }
                  ]}>
                    {translations[language].camera.branch}
                  </Text>
                  <View style={styles.pickerWithClearButton}>
                    <TouchableOpacity 
                      style={[
                        styles.pickerButton, 
                        { 
                          borderColor: selectedValue.toBranch ? colors.primary : colors.inputBorder,
                          backgroundColor: colors.inputBg,
                          flex: 1,
                          height: 50,
                          borderRadius: 12
                        }
                      ]} 
                      onPress={() => branchHandler('toBranch')}
                    >
                      <Text style={[
                        styles.pickerButtonText, 
                        selectedValue.toBranch?.name 
                          ? [styles.pickerSelectedText, { color: colors.text }] 
                          : [styles.pickerPlaceholderText, { color: colors.textTertiary }],
                      ]}>
                        {selectedValue.toBranch?.name || translations[language].camera.selectBranch}
                      </Text>
                      <Feather name="chevron-down" size={18} color={selectedValue.toBranch ? colors.primary : colors.textSecondary} />
                    </TouchableOpacity>
                    {selectedValue.toBranch && (
                      <TouchableOpacity
                        style={[styles.clearFieldButton, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)' }]}
                        onPress={() => clearSelection('toBranch')}
                      >
                        <Feather name="x" size={18} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                )}

                {/* To Driver selection - show only for dispatched_to_branch status
                {console.log('Rendering toDriver field, selectedStatus:', selectedStatus) || (selectedStatus === 'dispatched_to_branch') && (
                <View style={[styles.fieldContainer]}>
                  <Text style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary },
                    {
                      ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : "right"
                        }
                      }),
                    }
                  ]}>
                    {translations[language].camera.toDriver}
                  </Text>
                  <View style={styles.pickerWithClearButton}>
                    <TouchableOpacity 
                      style={[
                        styles.pickerButton, 
                        { 
                          borderColor: selectedValue.toDriver ? colors.primary : colors.inputBorder,
                          backgroundColor: colors.inputBg,
                          flex: 1,
                          height: 50,
                          borderRadius: 12
                        }
                      ]} 
                      onPress={() => driverHandler('toDriver')}
                    >
                      <Text style={[
                        styles.pickerButtonText, 
                        selectedValue.toDriver?.name 
                          ? [styles.pickerSelectedText, { color: colors.text }] 
                          : [styles.pickerPlaceholderText, { color: colors.textTertiary }],
                      ]}>
                        {selectedValue.toDriver?.name || translations[language].camera.selectDriver}
                      </Text>
                      <Feather name="chevron-down" size={18} color={selectedValue.toDriver ? colors.primary : colors.textSecondary} />
                    </TouchableOpacity>
                    {selectedValue.toDriver && (
                      <TouchableOpacity
                        style={[styles.clearFieldButton, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)' }]}
                        onPress={() => clearSelection('toDriver')}
                      >
                        <Feather name="x" size={18} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                
                
                {/* Action buttons - shown for all user types */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.cancelButton, { borderColor: colors.border }]} 
                    onPress={() => setShowCreateDispatchedCollectionModal(false)}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                      {translations[language].camera.cancel}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.confirmButton, 
                      { backgroundColor: colors.primary },
                      formSpinner.status && { opacity: 0.7 },
                      // For driver/delivery_company, disable if no status is selected
                      (user && (user.role === 'driver' || user.role === 'delivery_company') && !selectedStatus) && { opacity: 0.5 }
                    ]} 
                    onPress={updateOrderStatus}
                    disabled={
                      formSpinner.status || 
                      (showStatusSelection && !selectedStatus) ||
                      (user && (user.role === 'driver' || user.role === 'delivery_company') && !selectedStatus)
                    }
                  >
                    {formSpinner.status ? (
                      <ActivityIndicator size="small" color={colors.buttonText} />
                    ) : (
                      <Text style={[styles.confirmButtonText, { color: colors.buttonText }]}>
                        {translations[language].camera.confirm}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        ) : (
          <Animated.View 
            style={[
              styles.scannedItemsContainer, 
              { 
                backgroundColor: colors.card,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={[styles.scannedHeaderContainer, { borderBottomColor: colors.divider }]}>
              <View style={[
                styles.scannedHeader
              ]}>
                <View style={styles.totalContainer}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>
                    {translations[language].camera.totalScanned}:
                  </Text>
                  <View style={[styles.totalBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.totalValue}>{scannedItems.length}</Text>
                  </View>
                </View>
                
                {scannedItems.length > 0 && (
                  <TouchableOpacity 
                    style={[styles.nextButton, { backgroundColor: colors.primary }]} 
                    onPress={() => {
                      // For driver or delivery_company roles, show options modal instead of confirmation
                      if (user && (user.role === 'driver' || user.role === 'delivery_company')) {
                        setShowCreateDispatchedCollectionModal(true);
                      } else {
                        setShowCreateDispatchedCollectionModal(true);
                      }
                    }}
                  >
                    <Text style={[styles.nextButtonText, { color: colors.buttonText }]}>
                      {showStatusSelection ? translations[language]?.tabs?.orders?.order?.changeStatus || 'Change Status' : translations[language].camera.next}
                    </Text>
                    <Feather 
                      name={isRTL ? "chevron-left" : "chevron-right"} 
                      size={16} 
                      color={colors.buttonText} 
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* Add manual input section */}
            <View style={[styles.manualInputContainer, { 
              borderBottomColor: colors.border, 
              borderBottomWidth: 1,
              paddingVertical: 16,
              paddingHorizontal: 16
            }]}>
              <View style={styles.inputWithButtonContainer}>
                <View style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: manualOrderId ? colors.primary : colors.border,
                    borderWidth: 1,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingLeft: 16,
                    height: 54,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 1,
                  }
                ]}>
                  <TextInput
                    style={[
                      styles.manualInput, 
                      {
                        ...Platform.select({
                          ios: {
                            textAlign:isRTL ? "right" : ""
                          }
                        }),
                      },
                      { 
                        color: colors.text,
                        fontSize: 16,
                        flex: 1,
                        paddingVertical: 12,
                        fontWeight: '400',
                      }
                    ]}
                    placeholder={translations[language].camera.enterOrderId}
                    value={manualOrderId}
                    onChangeText={setManualOrderId}
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TouchableOpacity 
                    style={[
                      styles.inlineAddButton, 
                      { 
                        backgroundColor: colors.primary,
                        height: 40,
                        width: 40,
                        borderRadius: 10,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 7,
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 2,
                        elevation: 2,
                      }
                    ]}
                    onPress={handleManualOrderAdd}
                    activeOpacity={0.7}
                  >
                    <Feather name="plus" size={22} color={colors.buttonText} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            {/* Scanned items list */}
            {scannedItems.length > 0 ? (
              <ScrollView 
                style={styles.itemsScrollView}
                contentContainerStyle={styles.itemsList}
                showsVerticalScrollIndicator={false}
              >
                {scannedItems.map((item, index) => (
                  <Animated.View 
                    key={index} 
                    style={[
                      styles.itemContainer,
                      { 
                        backgroundColor: isDark ? colors.surface : '#F9FAFB',
                        shadowColor: colors.cardShadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isDark ? 0.2 : 0.08,
                        shadowRadius: 4,
                        elevation: 2,
                        marginBottom: 12,
                        borderRadius: 12,
                        borderLeftWidth: 3,
                        borderLeftColor: colors.primary,
                        opacity: fadeAnim,
                        transform: [{ 
                          translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0]
                          }) 
                        }]
                      }
                    ]}
                  >
                    <View style={[
                      styles.itemContent
                    ]}>
                      <View style={[
                        styles.itemIconContainer,
                        { 
                          backgroundColor: isDark ? 'rgba(108, 142, 255, 0.15)' : 'rgba(67, 97, 238, 0.1)',
                          width: 40,
                          height: 40,
                          borderRadius: 12
                        }
                      ]}>
                        <Feather name="package" size={18} color={colors.primary} />
                      </View>
                      <View style={[
                        styles.itemTextContainer,
                        {
                          ...Platform.select({
                            ios: {
                              alignItems: isRTL ? "flex-start" : "flex-end"
                            }
                          }),
                        }
                      ]}>
                        <Text style={[styles.itemText, { color: colors.text, fontWeight: '600' },{
                      ...Platform.select({
                        ios: {
                          textAlign:isRTL ? "left" : ""
                        }
                      }),
                    }]}>
                          {typeof item === 'object' ? item.order_id : item}
                        </Text>
                        {typeof item === 'object' && (
                          <>
                            <Text style={[styles.itemDetailText, { color: colors.textSecondary, marginTop: 4 },{
                              ...Platform.select({
                                ios: {
                                  textAlign:isRTL ? "left" : ""
                                }
                              }),
                            }]}>
                              {item.receiver_name}
                            </Text>
                            <Text style={[styles.itemDetailText, { color: colors.textSecondary },{
                                ...Platform.select({
                                  ios: {
                                    textAlign:isRTL ? "left" : ""
                                  }
                                }),
                              }]}>
                              {item.receiver_city}{item.receiver_area ? ` - ${item.receiver_area}` : ''}{item.receiver_address ? ` - ${item.receiver_address}` : ''}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={[
                        styles.deleteButton,
                        { 
                          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                          width: 40,
                          height: 40,
                          borderRadius: 12
                        }
                      ]}
                      onPress={() => {
                        const updatedItems = scannedItems.filter((_, i) => i !== index);
                        setScannedItems(updatedItems);
                      }}
                    >
                      <Feather name="trash-2" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </ScrollView>
            ) : (
              <Animated.View 
                style={[
                  styles.emptyContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <Feather name="inbox" size={48} color={colors.textTertiary} style={{marginBottom: 12}} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {translations[language].camera.noItemsYet}
                </Text>
                <Text style={[styles.emptySubText, { color: colors.textTertiary }]}>
                  {translations[language]?.camera?.scanOrEnterOrderId}
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        )}
      </View>

      {showPickerModal && (
        <PickerModal
          list={currentField === "toBranch" ? branches : 
                currentField === "status" ? statusOptions : 
                currentField === "reason" ? suspendReasonsWithName : 
                drivers}
          setSelectedValue={(value) => {
            // IMPORTANT: PickerModal internally calls setSelectedValue with a function
            // that updates the state. We need to handle both cases.
            if (typeof value === 'function') {
              // Execute the function to get the actual value
              const prevValue = {...selectedValue};
              const newValueObj = value(prevValue);
              
              // Get the selected item from the newValueObj
              const selectedItem = newValueObj[currentField];
              
              if (selectedItem) {
                // Handle different field types
                if (currentField === "status") {
                  setSelectedStatus(selectedItem.value);
                  handleStatusChange(selectedItem.value);
                } else if (currentField === "reason") {
                  setSelectedReason(selectedItem.value);
                } else {
                  // For other fields, update the selectedValue state
                  setSelectedValue(newValueObj);
                }
              }
            } else {
              // Direct item selection (this is the case we were handling before)
              
              if (currentField === "status" && value) {
                setSelectedStatus(value.value);
                handleStatusChange(value.value);
              } else if (currentField === "reason" && value) {
                setSelectedReason(value.value);
              } else {
                // For branch and driver selections
                const newValues = {...selectedValue};
                newValues[currentField] = value;
                setSelectedValue(newValues);
              }
            }
          }}
          showPickerModal={showPickerModal}
          setShowModal={setShowPickerModal}
          loading={loading}
          field={{
            name: currentField,
            label: currentField === 'toBranch' ? translations[language].camera.toBranch : 
                  currentField === 'fromDriver' ? translations[language]?.camera?.selectDriverFrom || "Select Driver" : 
                  currentField === 'status' ? translations[language]?.tabs?.orders?.order?.status || "Status" : 
                  currentField === 'reason' ? translations[language]?.tabs?.orders?.order?.reason || "Reason" : 

                  translations[language].camera.toDriver,
            showSearchBar: true
          }}
          colors={colors}
          isDark={isDark}
          allowClear={true}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // Driver option styles
  driverOptionsContainer: {
    marginBottom: 20,
    gap: 16,
  },
  driverOptionButton: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  driverOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  driverOptionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverOptionTextContainer: {
    flex: 1,
  },
  driverOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  driverOptionDescription: {
    fontSize: 14,
  },
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButtonContainer: {
    position: 'absolute',
    top: 40,
    zIndex: 10
  },
  backButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFocusArea: {
    width: 280,
    height: 280,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#4361EE',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  scanLine: {
    width: '100%',
    height: 3,
    backgroundColor: '#4361EE',
    position: 'absolute',
    opacity: 0.8,
    shadowColor: '#4361EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 95,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scanText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    maxWidth: '90%',
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4361EE',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  rescanButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 16,
  },
  errorBannerText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 8,
  },
  scannedItemsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    height: '50%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    paddingBottom: 10,
  },
  scannedHeaderContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  scannedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937'
  },
  totalBadge: {
    backgroundColor: '#4361EE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#4361EE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  totalValue: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4361EE',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#4361EE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15
  },
  manualInputContainer: {
    width: '100%',
  },
  inputWithButtonContainer: {
    width: '100%',
  },
  inputWrapper: {
    width: '100%',
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
  manualInput: {
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
  },
  inlineAddButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsScrollView: {
    flex: 1,
  },
  itemsList: {
    padding: 16,
  },
  itemContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16
  },
  itemIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  itemDetailText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 3,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    padding: 20,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  backButton: {
    position: 'absolute',
    padding: 8,
  },
  modalContent: {
    padding: 20,
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    fontSize: 15,
    color: '#1F2937',
    minHeight: 100,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  pickerButtonText: {
    fontSize: 15,
  },
  pickerPlaceholderText: {
    color: '#94A3B8',
  },
  pickerSelectedText: {
    color: '#1F2937',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 'auto',
    paddingBottom: 20,
    position:"fixed"
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 15,
  },
  confirmButton: {
    backgroundColor: '#4361EE',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#4361EE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContent: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    width: '80%',
  },
  permissionText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#4361EE',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  pickerWithClearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearFieldButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});