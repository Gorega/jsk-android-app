import { View, StyleSheet, Text, TouchableOpacity, Pressable, Animated, ActivityIndicator,TextInput } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useState, useRef } from 'react';
import ModalPresentation from '../ModalPresentation';
import { router } from 'expo-router';
import PickerModal from "../pickerModal/PickerModal";
import { useAuth } from "../../RootLayout";
import UserBox from "./userBox/UserBox";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { getToken } from "../../utils/secureStore";
import { RTLWrapper } from '@/utils/RTLWrapper';

// Helper function to format currency values
const formatCurrencyValue = (value, currency) => {
    // Check if value contains multiple currencies
    if (typeof value === 'string' && (value.includes('ILS:') || value.includes('JOD:') || value.includes('USD:'))) {
        // Split the string by '|' and create a wrapped display
        const currencies = value.split('|').map(item => item.trim());
        return (
            <View style={[styles.currencyContainer]}>
                {currencies.map((curr, idx) => (
                    <Text key={idx} style={[styles.currencyText]}>{curr}</Text>
                ))}
            </View>
        );
    }
    
    // Regular display for simple values
    return <Text style={[styles.costText]}>{value} {currency}</Text>;
};

export default function Order({ user, order }) {
    const { language } = useLanguage();
    const { user: authUser } = useAuth();
    const [showControl, setShowControl] = useState(false);
    const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
    const [showConfirmStatusChangeUpdateModal, setShowConfirmStatusChangeUpdateModal] = useState(false);
    const [selectedValue, setSelectedValue] = useState({});
    const [UpdatedStatusNote, setUpdatedStatusNote] = useState("");
    const [isMinimized, setIsMinimized] = useState(["driver", "delivery_company"].includes(authUser.role));
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    
    // Animation value for smooth transition
    const heightAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

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
    };

    // Interpolate rotation for chevron icon
    const rotateInterpolation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg']
    });

    const statusOptions = authUser.role === "driver" ? [{
        label: translations[language].tabs.orders.order.states.rescheduleReasons?.title, value: "reschedule",
        requiresReason: true,
        reasons: [
            { value: 'receiver_request', label: translations[language].tabs?.orders?.order?.states?.rescheduleReasons?.receiverRequest || "Receiver Request" },
            { value: 'customer_unavailable', label: translations[language].tabs?.orders?.order?.states?.rescheduleReasons?.receiverUnavailable || "Customer Unavailable" },
            { value: 'incorrect_timing', label: translations[language].tabs?.orders.order?.states?.rescheduleReasons?.incorrectTiming || "Incorrect Timing" },
            { value: 'business_request', label: translations[language].tabs?.orders.order?.states?.rescheduleReasons?.businessRequest || "Business Request" },
            { value: 'delivery_overload', label: translations[language].tabs?.orders?.order?.states?.rescheduleReasons?.deliveryOverload || "Delivery Overload" }
        ]
    }, {
        label: translations[language].tabs?.orders?.order?.states?.return_before_delivered_initiated?.title, value: "return_before_delivered_initiated",
        requiresReason: true,
        reasons: [
            { value: 'business_cancellation', label: translations[language].tabs?.orders?.order?.states.return_before_delivered_initiated?.businessCancellation || "Business Cancellation" },
            { value: 'receiver_cancellation', label: translations[language].tabs?.orders?.order?.states.return_before_delivered_initiated?.receiverCancellation || "Receiver Cancellation" },
            { value: 'address_error', label: translations[language].tabs?.orders.order?.states?.return_before_delivered_initiated?.addressRrror || "Address Error" },
            { value: 'no_response', label: translations[language].tabs?.orders.order?.states?.return_before_delivered_initiated?.noResponse || "No Response" }
        ]
    }, {
        label: translations[language].tabs?.orders?.order?.states?.return_after_delivered_initiated?.title, value: "return_after_delivered_initiated",
        requiresReason: true,
        reasons: [
            { value: 'business_cancellation', label: translations[language].tabs?.orders?.order?.states?.return_after_delivered_initiated?.businessCancellation || "Business Cancellation" },
            { value: 'receiver_cancellation', label: translations[language].tabs?.orders?.order?.states?.return_after_delivered_initiated?.receiverCancellation || "Receiver Cancellation" },
            { value: 'payment_failure', label: translations[language].tabs?.orders.order?.states.return_after_delivered_initiated?.paymentFailure || "Payment Failure" },
            { value: 'address_error', label: translations[language].tabs?.orders?.order?.states.return_after_delivered_initiated?.addressError || "Address Error" },
            { value: 'no_response', label: translations[language].tabs?.orders?.order?.states.return_after_delivered_initiated?.noResponse || "No Response" },
            { value: 'package_issue', label: translations[language].tabs?.orders?.order?.states.return_after_delivered_initiated?.packageIssue || "Package Issue" }
        ]
    }, {
        label: translations[language].tabs?.orders?.order?.states?.delivered, value: "delivered"
    }, {
        label: translations[language].tabs?.orders?.order?.states?.received, value: "received"
    }, {
        label: translations[language].tabs?.orders?.order?.states?.delivered_received, value: "delivered/received"
    }]
    :
    [{
        label: translations[language].tabs.orders.order?.states?.waiting, value: "waiting"
    }, {
        label: translations[language].tabs?.orders?.order?.states?.inBranch, value: "in_branch",
        requiresBranch: true
    }, {
        label: translations[language].tabs?.orders?.order?.states?.rejected?.title, value: "rejected",
        requiresReason: true,
        reasons: [
            { value: 'business_cancellation', label: translations[language].tabs.orders?.order?.states?.rejected?.rejectionReasons?.businessCancellation || "Business Cancellation" },
            { value: 'invalid_order', label: translations[language].tabs.orders?.order?.states?.rejected?.rejectionReasons?.invalidOrder || "Invalid Order" }
        ]
    }, {
        label: translations[language].tabs?.orders?.order?.states?.stuck?.title, value: "stuck",
        requiresReason: true,
        reasons: [
            { value: 'payment_issue', label: translations[language].tabs?.orders?.order?.states?.stuck?.stuckReasons?.paymentIssue || "Payment Issue" },
            { value: 'incorrect_address', label: translations[language].tabs?.orders?.order?.states?.stuck?.stuckReasons?.incorrectAddress || "Incorrect Address" }
        ]
    }, {
        label: translations[language].tabs?.orders?.order?.states?.delayed?.title, value: "delayed",
        requiresReason: true,
        reasons: [
            { value: 'sorting_delay', label: translations[language].tabs?.orders?.order?.states?.delayed?.delayReasons?.sortingDelay || "Sorting Delay" },
            { value: 'high_order_volume', label: translations[language].tabs?.orders?.order?.states?.delayed?.delayReasons?.highOrderVolume || "High Order Volume" },
            { value: 'technical_issue', label: translations[language].tabs?.orders?.order?.states?.delayed?.delayReasons?.technicalIssue || "Technical Issue" }
        ]
    }];

    const [selectedReason, setSelectedReason] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [branches, setBranches] = useState([]);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusUpdate = (newStatusOrUpdater) => {
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
                setShowBranchModal(true);
            } else if (statusOption?.requiresReason) {
                // Show reason selection modal
                setShowReasonModal(true);
            } else {
                // Directly show confirmation modal if no branch or reason needed
                setShowConfirmStatusChangeUpdateModal(true);
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
                setShowBranchModal(true);
            } else if (statusOption?.requiresReason) {
                setShowReasonModal(true);
            } else {
                setShowConfirmStatusChangeUpdateModal(true);
            }
        }
    };

    const fetchBranches = async () => {
        try {
            const token = await getToken("userToken");
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/branches?language_code=${language}`, {
                method: "GET",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    "Cookie": token ? `token=${token}` : ""
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
        setShowReasonModal(false);
        setShowConfirmStatusChangeUpdateModal(true);
    };

    const handleBranchSelect = (branchOption) => {
        setSelectedBranch(branchOption);
        setShowBranchModal(false);
        setShowConfirmStatusChangeUpdateModal(true);
    };

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
                ...(selectedReason && { reason: selectedReason.value })
            };
            
            if (!updates.status) {
                setErrorMessage(translations[language].tabs.orders.order.missingStatus || "Missing status value");
                setShowErrorModal(true);
                setIsUpdating(false);
                return;
            }
            
            const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/status`, {
                method: "PUT",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Accept-Language': language,
                    "Cookie": token ? `token=${token}` : ""
                },
                credentials: "include",
                body: JSON.stringify({ updates })
            });
            
            const data = await res.json();
            
            if (!data.error) {
                // Reset all state values on successful update
                setShowConfirmStatusChangeUpdateModal(false);
                setSelectedReason(null);
                setSelectedBranch(null);
                setUpdatedStatusNote("");
                
                // Show success modal
                setSuccessMessage(translations[language].tabs.orders.order.statusChangeSuccess || "Status updated successfully");
                setShowSuccessModal(true);
                setTimeout(() => setShowSuccessModal(false), 2500);
            } else {                
                // Show error modal with the error message from the backend
                setErrorMessage(data.error || translations[language].tabs.orders.order.statusChangeError || "Failed to update status");
                setShowErrorModal(true);
            }
        } catch (error) {            
            // Show error modal for network or unexpected errors
            setErrorMessage(translations[language].tabs.orders.order.statusChangeError || "Failed to update status");
            setShowErrorModal(true);
        } finally {
            setIsUpdating(false);
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
                <View style={styles.orderCard}>
                    {/* Header section with order ID and status */}
                    <View style={[styles.header]}>
                        {/* Minimize/Expand toggle button */}
                        <TouchableOpacity 
                                onPress={toggleMinimize}
                                style={styles.toggleButton}
                                activeOpacity={0.7}
                            >
                                <Animated.View style={{ 
                                    transform: [{ rotate: rotateInterpolation }],
                                }}>
                                    <MaterialIcons 
                                        name="expand-more" 
                                        size={24} 
                                        color="#4361EE" 
                                    />
                                </Animated.View>
                            </TouchableOpacity>
                        <View style={[styles.orderIdSection]}>
                            <View style={[styles.orderIdContainer]}>
                                <Text style={styles.orderIdText}>#{order.order_id}</Text>
                            </View>
                            {order.reference_id && !isMinimized && (
                                <Text style={[styles.referenceId]}>
                                    Ref: {order.reference_id}
                                </Text>
                            )}
                        </View>
                        
                        <View style={{alignItems: 'center' }}>
                            
                            <TouchableOpacity 
                                onPress={() => authUser.role !== "business" && setShowStatusUpdateModal(true)} 
                                style={[
                                    styles.statusBadge, 
                                    { 
                                        backgroundColor: getStatusColor(order.status_key)
                                    }
                                ]}
                                activeOpacity={authUser.role !== "business" ? 0.7 : 1}
                            >
                                {authUser.role !== "business" && (
                                    <MaterialIcons 
                                        name="published-with-changes" 
                                        size={18} 
                                        color="white" 
                                        style={styles.statusIcon} 
                                    />
                                )}
                                <Text style={styles.statusText}>{order.status}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Compact View for minimized state - only shows essential details */}
                    {isMinimized ? (
                        <View style={styles.minimizedContainer}>
                            <View style={[styles.minimizedRow]}>
                                <View style={[
                                    styles.minimizedSection 
                                ]}>
                                    <Text style={[styles.minimizedLabel]}>
                                        {translations[language].tabs.orders.order.userClientBoxLabel || 'Client'}
                                    </Text>
                                    <Text style={[styles.minimizedValue]}>
                                        {order.receiver_name}
                                    </Text>
                                </View>
                                
                                <View style={[
                                    styles.minimizedSection, 
                                    styles.locationMinimized
                                ]}>
                                    <Text style={[styles.minimizedLabel]}>
                                        {translations[language].tabs.orders.order.codValue || 'COD Value'}
                                    </Text>
                                    <Text style={[styles.minimizedValue]}>
                                        {order.total_cod_value} {order.currency}
                                    </Text>
                                </View>
                            </View>
                            
                            {/* Additional minimized info - location with area and address */}
                            <View style={[styles.minimizedRow]}>
                                <View style={[
                                    styles.minimizedSection
                                ]}>
                                    <Text style={[styles.minimizedLabel]}>
                                        {translations[language].tabs.orders.order.location || 'Location'}
                                    </Text>
                                    <Text style={[styles.minimizedValue]}>
                                        {order.receiver_city}, {order.receiver_area}{order.receiver_address ? `, ${order.receiver_address}` : ''}
                                    </Text>
                                </View>
                            </View>
                            
                            {/* Show to_branch or to_driver if not null */}
                            {(order.to_branch || order.to_driver) && (
                                <View style={[styles.minimizedRow, { marginTop: 10 }]}>
                                    <View style={[
                                        styles.minimizedSection
                                    ]}>
                                        <Text style={[styles.minimizedLabel]}>
                                            {order.to_branch ? 
                                                (translations[language].tabs.orders.order.to_branch || 'To Branch') : 
                                                (translations[language].tabs.orders.order.to_driver || 'To Driver')}
                                        </Text>
                                        <Text style={[styles.minimizedValue]}>
                                            {order.to_branch || order.to_driver}
                                        </Text>
                                    </View>
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
                            <View style={styles.userInfoSection}>
                                {authUser.role !== "business" && (
                                    <UserBox 
                                        box={{
                                            label: translations[language].tabs.orders.order.userSenderBoxLabel,
                                            userName: order.sender,
                                            phone: order.sender_mobile
                                        }} 
                                    />
                                )}
                                
                                <UserBox 
                                    box={{
                                        label: translations[language].tabs.orders.order.userClientBoxLabel,
                                        userName: order.receiver_name,
                                        phone: order.receiver_mobile
                                    }} 
                                />
                                
                                {!["driver", "business"].includes(authUser.role) && (
                                    <UserBox 
                                        box={{
                                            label: translations[language].tabs.orders.order.userDriverBoxLabel,
                                            userName: order.driver ? order.driver : translations[language].tabs.orders.order.unknown,
                                            phone: order.driver_mobile ? order.driver_mobile : ""
                                        }} 
                                    />
                                )}
                            </View>
                            
                            {/* Location section */}
                            <View style={styles.locationSection}>
                                <View style={[styles.sectionRow]}>
                                    <View style={[
                                        styles.iconWrapper, 
                                        { backgroundColor: '#4CC9F0' }
                                    ]}>
                                        <Ionicons name="location-outline" size={20} color="#ffffff" />
                                    </View>
                                    <View style={styles.sectionContent}>
                                        <Text style={[styles.sectionTitle]}>
                                            {translations[language].tabs.orders.order.location || 'Delivery Location'}
                                        </Text>
                                        <Text style={[styles.locationCity]}>
                                            {order.receiver_city}
                                        </Text>
                                        <Text style={[styles.locationAddress]}>
                                            {order.receiver_area}{order.receiver_address ? `, ${order.receiver_address}` : ''}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* sent to branch section */}
                            {((order.to_branch || order.to_driver) && ["driver","delivery_company"].includes(authUser.role)) && <View style={styles.orderTypeSection}>
                                <View style={[styles.sectionRow]}>
                                    <View style={[
                                        styles.iconWrapper, 
                                        { backgroundColor: '#7209B7' }
                                    ]}>
                                        <MaterialCommunityIcons name="package-variant" size={20} color="#ffffff" />
                                    </View>
                                    <View style={styles.sectionContent}>
                                        <Text style={[styles.sectionTitle]}>
                                            {order.to_branch ? translations[language].tabs.orders.order.to_branch : translations[language].tabs.orders.order.to_driver}
                                        </Text>
                                        <Text style={[styles.orderTypeText]}>
                                            {order.to_branch || order.to_driver}
                                        </Text>
                                    </View>
                                </View>
                            </View>}
                            
                            {/* Order type section */}
                            <View style={styles.orderTypeSection}>
                                <View style={[styles.sectionRow]}>
                                    <View style={[
                                        styles.iconWrapper, 
                                        { backgroundColor: '#7209B7' }
                                    ]}>
                                        <MaterialCommunityIcons name="package-variant" size={20} color="#ffffff" />
                                    </View>
                                    <View style={styles.sectionContent}>
                                        <Text style={[styles.sectionTitle]}>
                                            {translations[language].tabs.orders.order.orderType}
                                        </Text>
                                        <Text style={[styles.orderTypeText]}>
                                            {order.order_type}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            
                            {/* Cost information section */}
                            <View style={styles.costSectionWrapper}>
                                <Text style={[styles.costSectionTitle]}>
                                    {translations[language].tabs.orders.order.financialDetails || 'Financial Details'}
                                </Text>
                                
                                <View style={styles.costSection}>
                                    <View style={[
                                        styles.costCard
                                    ]}>
                                        <View style={[
                                            styles.costIconContainer, 
                                            { backgroundColor: '#4361EE' }
                                        ]}>
                                            <Feather name="package" size={16} color="#ffffff" />
                                        </View>
                                        <View style={[styles.costLabelContainer]}>
                                            <Text style={[styles.costLabel]}>
                                                {translations[language].tabs.orders.order.codValue || 'COD Value'}
                                            </Text>
                                            {formatCurrencyValue(order.total_cod_value, order.currency)}
                                        </View>
                                    </View>
                                    
                                    {/* Only show delivery fee for non-driver/delivery_company roles */}
                                    {!["driver", "delivery_company"].includes(authUser.role) && (
                                        <View style={[
                                            styles.costCard
                                        ]}>
                                            <View style={[
                                                styles.costIconContainer, 
                                                { backgroundColor: '#F72585' }
                                            ]}>
                                                <Feather name="truck" size={16} color="#ffffff" />
                                            </View>
                                            <View style={[styles.costLabelContainer]}>
                                                <Text style={[styles.costLabel]}>
                                                    {translations[language].tabs.orders.order.deliveryFee || 'Delivery Fee'}
                                                </Text>
                                                <Text style={[styles.costText]}>
                                                    {order.delivery_fee} {order.currency}
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                    
                                    {/* Only show net value for non-driver/delivery_company roles */}
                                    {!["driver", "delivery_company"].includes(authUser.role) && (
                                        <View style={[
                                            styles.costCard
                                        ]}>
                                            <View style={[
                                                styles.costIconContainer, 
                                                { backgroundColor: '#3A0CA3' }
                                            ]}>
                                                <FontAwesome name="money" size={16} color="#ffffff" />
                                            </View>
                                            <View style={[styles.costLabelContainer]}>
                                                <Text style={[styles.costLabel]}>
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
                                        <View style={[styles.checksTextContainer]}>
                                            <Text style={[styles.checksTitle]}>
                                                {translations[language].tabs.orders.order.checksAvailable || 'Checks Available'}
                                            </Text>
                                            <Text style={[styles.checksText]}>
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
                                    <View style={[styles.noteContent]}>
                                        <Text style={[styles.noteTitle]}>
                                            {translations[language].tabs.orders.order.note || 'Notes'}
                                        </Text>
                                        <Text style={[styles.noteText]}>
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
                                    <Text style={[styles.dateTimeText]}>
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
                        <Text style={[styles.modalHeaderText]}>
                            {translations[language].tabs.orders.order.orderActions || 'Order Actions'}
                        </Text>
                    </View>
                    
                    <View style={styles.controlContainer}>
                        {/* Edit Order button logic */}
                        {(
                            // For business users, only show on "waiting" status
                            (authUser.role === "business" && order.status_key === "waiting") ||
                            
                            // For driver and delivery_company, never show
                            (!["driver", "delivery_company", "business"].includes(authUser.role) && 
                             ["waiting", "in_branch", "rejected", "stuck", "delayed", "on_the_way", 
                              "reschedule", "dispatched_to_branch", "dispatched_to_driver", "delivered",
                              "return_before_delivered_initiated", "return_after_delivered_initiated", 
                              "business_returned_delivered", "received", "delivered/received"].includes(order.status_key))
                        ) && (
                            <TouchableOpacity 
                                style={[
                                    styles.controlOption
                                ]} 
                                onPress={() => router.push({
                                    pathname: "(create)",
                                    params: { orderId: order.order_id }
                                })}
                            >
                                <View style={[
                                    styles.controlIconContainer, 
                                    { backgroundColor: '#4361EE' }
                                ]}>
                                    <Feather name="edit" size={18} color="#ffffff" />
                                </View>
                                <Text style={[styles.controlText]}>
                                    {translations[language].tabs.orders.order.edit}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Edit receiver phone button logic */}
                        {(
                            // For driver and delivery_company
                            (["driver", "delivery_company"].includes(authUser.role) && 
                             ["on_the_way", "reschedule", "rejected", "stuck", "delayed", "driver_responsibility"].includes(order.status_key)) ||
                            
                            // For business users
                            (authUser.role === "business" && 
                             ["in_branch", "rejected", "stuck", "delayed", "on_the_way", "reschedule", 
                              "dispatched_to_branch", "dispatched_to_driver"].includes(order.status_key))
                        ) && (
                            <TouchableOpacity 
                                style={[
                                    styles.controlOption 
                                ]} 
                                onPress={() => router.push({
                                    pathname: "(edit_receiver_phones)",
                                    params: { orderId: order.order_id, editPhoneOnly: true }
                                })}
                            >
                                <View style={[
                                    styles.controlIconContainer, 
                                    { backgroundColor: '#4361EE' }
                                ]}>
                                    <Feather name="phone" size={18} color="#ffffff" />
                                </View>
                                <Text style={[styles.controlText]}>
                                    {translations[language].tabs.orders.order.editPhone || "Edit Receiver Phone"}
                                </Text>
                            </TouchableOpacity>
                        )}
                        
                        {!["business"].includes(authUser.role) && (
                            <TouchableOpacity 
                                style={[
                                    styles.controlOption, 
                                    styles.noBorder
                                ]} 
                                onPress={() => setShowStatusUpdateModal(true)}
                            >
                                <View style={[
                                    styles.controlIconContainer, 
                                    { backgroundColor: '#7209B7' }
                                ]}>
                                    <MaterialIcons name="published-with-changes" size={18} color="#ffffff" />
                                </View>
                                <Text style={[styles.controlText]}>
                                    {translations[language].tabs.orders.order.changeStatus}
                                </Text>
                            </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity 
                            style={[
                                styles.controlOption, 
                                styles.noBorder
                            ]} 
                            onPress={() => router.push({
                                pathname: "(track)",
                                params: { orderId: order.order_id }
                            })}
                        >
                            <View style={[
                                styles.controlIconContainer, 
                                { backgroundColor: '#10B981' }
                            ]}>
                                <MaterialIcons name="track-changes" size={18} color="#ffffff" />
                            </View>
                            <Text style={[styles.controlText]}>
                                {translations[language].tabs.orders.track.orderTracking || 'Track Order'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ModalPresentation>
            )}

            {/* Status update modal */}
            {showStatusUpdateModal && (
                <PickerModal
                    list={statusOptions}
                    setSelectedValue={handleStatusUpdate}
                    showPickerModal={showStatusUpdateModal}
                    setShowPickerModal={setShowStatusUpdateModal}
                    field={{
                        name: 'status',
                        label: 'Status',
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
                        <Text style={styles.modalHeaderText}>
                            {translations[language].tabs.orders.order.selectReason || "Select Reason"}
                        </Text>
                    </View>
                    <View style={styles.reasonContainer}>
                        {statusOptions.find(option => option.value === selectedValue.status?.value)?.reasons?.map((reason, index) => (
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

            {showBranchModal && (
                <ModalPresentation
                    showModal={showBranchModal}
                    setShowModal={setShowBranchModal}
                    customStyles={{ bottom: 15 }}
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalHeaderText}>
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
                                <Text style={[styles.branchText]}>
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
                        <Text style={[styles.confirmModalTitle]}>
                            {translations[language].tabs.orders.order.changeStatusAlert} 
                            <Text style={styles.highlightText}> {statusOptions.find(option => option.value === selectedValue.status?.value)?.label || ''}</Text>
                        </Text>
                        
                        {selectedBranch && (
                            <View style={[styles.selectedDetailContainer]}>
                                <Text style={styles.selectedDetailLabel}>
                                    {translations[language].tabs.orders.order.branch || "Branch"}:
                                </Text>
                                <Text style={styles.selectedDetailValue}>{selectedBranch.label}</Text>
                            </View>
                        )}
                        
                        {selectedReason && (
                            <View style={[styles.selectedDetailContainer]}>
                                <Text style={styles.selectedDetailLabel}>
                                    {translations[language].tabs.orders.order.reason || "Reason"}:
                                </Text>
                                <Text style={styles.selectedDetailValue}>{selectedReason.label}</Text>
                            </View>
                        )}
                        
                        <TextInput
                            style={[
                                styles.noteInput
                            ]}
                            placeholder={translations[language].tabs.orders.order.changeStatusAlertNote}
                            value={UpdatedStatusNote}
                            onChangeText={(input) => setUpdatedStatusNote(input)}
                            multiline={true}
                            numberOfLines={3}
                            placeholderTextColor="#94A3B8"
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
                                    <Text style={styles.confirmButtonText}>
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
                                <Text style={styles.cancelButtonText}>
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
                        <Text style={styles.successModalTitle}>
                            {translations[language].tabs.orders.order.success || "Success"}
                        </Text>
                        <Text style={styles.successModalMessage}>
                            {successMessage}
                        </Text>
                    </View>
                </ModalPresentation>
            )}

            {/* Error Modal */}
            {showErrorModal && (
                <ModalPresentation
                    showModal={showErrorModal}
                    setShowModal={setShowErrorModal}
                    position="center"
                >
                    <View style={styles.errorModalContainer}>
                        <View style={styles.errorIconContainer}>
                            <FontAwesome5 name="exclamation-circle" size={32} color="#FFFFFF" />
                        </View>
                        <Text style={styles.errorModalTitle}>
                            {translations[language].tabs.orders.order.error || "Error"}
                        </Text>
                        <Text style={styles.errorModalMessage}>
                            {errorMessage}
                        </Text>
                        <TouchableOpacity
                            style={styles.errorModalButton}
                            onPress={() => setShowErrorModal(false)}
                        >
                            <Text style={styles.errorModalButtonText}>
                                {translations[language].tabs.orders.order.ok || "OK"}
                            </Text>
                        </TouchableOpacity>
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
    toggleButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        marginRight: 10,
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
        width: '100%',
        maxHeight: 300,
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
        maxHeight: 300,
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
});