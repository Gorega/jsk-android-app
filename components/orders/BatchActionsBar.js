import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { TouchableOpacity, ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage, translations } from '../../utils/languageContext';
import { Colors } from '../../constants/Colors';
import { useTheme } from '../../utils/themeContext';
import PickerModal from "../pickerModal/PickerModal";
import CreateMoneyRecordModal from "../collections/CreateMoneyRecordModal";
import axios from 'axios';
import { useAuth } from "../../RootLayout";

export default function BatchActionsBar({ selectedOrderIds, onActionComplete, onCancelSelection, orders, onSelectAll, onSelectAllUnpaid }) {
    const { language } = useLanguage();
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || Number(user?.role_id) === 1;
    const defaultUserBranchId = user?.branch_id || null;
    const isRTL = language === 'ar' || language === 'he';
    const insets = useSafeAreaInsets();

    const [isLoading, setIsLoading] = useState(false);
    const [showDriverModal, setShowDriverModal] = useState(false);
    const [drivers, setDrivers] = useState([]);
    const [actionType, setActionType] = useState(null); // 'business-record-collections' or 'business_money'
    const [fromDriverBalance, setFromDriverBalance] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedStatusOption, setSelectedStatusOption] = useState(null);
    const [showStatusReasonModal, setShowStatusReasonModal] = useState(false);
    const [selectedStatusReason, setSelectedStatusReason] = useState(null);
    const [showStatusDriverModal, setShowStatusDriverModal] = useState(false);
    const [selectedStatusDriver, setSelectedStatusDriver] = useState(null);
    const [showStatusBranchModal, setShowStatusBranchModal] = useState(false);
    const [selectedStatusBranch, setSelectedStatusBranch] = useState(null);
    const [branches, setBranches] = useState([]);

    const [showMoneyRecordModal, setShowMoneyRecordModal] = useState(false);
    const [moneyRecordType, setMoneyRecordType] = useState(null); // 'business_money' or 'business_returned'

    const canCreateBusinessCollection = user?.permissions?.includes("money_collection") && !["driver", "delivery_company"].includes(user?.role);
    const canCreateMoneyRecord = user?.permissions?.includes("money_collection") && !["driver", "delivery_company"].includes(user?.role);
    const canCreateReturnedRecord = user?.permissions?.includes("money_collection") && !["driver", "delivery_company"].includes(user?.role);
    const canCreateReturnedCollection = user?.permissions?.includes("money_collection") && !["driver", "delivery_company"].includes(user?.role);
    const canChangeBatchStatus = !["business"].includes(user?.role);

    const reasonsStuck = [
        { value: 'مغلق او لا يوجد رد', label: 'مغلق او لا يوجد رد' },
        { value: 'تم تغيير العنوان', label: 'تم تغيير العنوان' },
        { value: 'رقم غير صحيح', label: 'رقم غير صحيح' },
        { value: 'تأجيل متكرر', label: 'تأجيل متكرر' }
    ];
    const reasonsRejected = [
        { value: 'غير مطابق للمواصفات', label: 'غير مطابق للمواصفات' },
        { value: 'لا يريد الاستلام', label: 'لا يريد الاستلام' },
        { value: 'ملغي من المرسل', label: 'ملغي من المرسل' }
    ];
    const defaultOther = [
        { value: 'other', label: 'سبب اخر' }
    ];

    const selectedOrders = Array.isArray(orders)
        ? orders.filter(order => selectedOrderIds.includes(order?.order_id))
        : [];
    const hasReceiveType = selectedOrders.some(order => ["receive", "delivery/receive"].includes(order?.order_type_key));
    const hasNonReceiveType = selectedOrders.some(order => !["receive", "delivery/receive"].includes(order?.order_type_key));

    const batchStatusOptions = ["driver", "delivery_company"].includes(user?.role) ? [{
        label: translations[language]?.tabs?.orders?.order?.states?.rescheduled, value: "reschedule",
        requiresReason: true,
        reasons: defaultOther
    }, {
        label: translations[language]?.tabs?.orders?.order?.states?.rejected, value: "rejected",
        requiresReason: true,
        reasons: [...reasonsRejected, ...defaultOther]
    }, {
        label: translations[language]?.tabs?.orders?.order?.states?.stuck, value: "stuck",
        requiresReason: true,
        reasons: [...reasonsStuck, ...defaultOther]
    }, {
        label: translations[language]?.tabs?.orders?.order?.states?.return_after_delivered_initiated, value: "return_after_delivered_initiated",
        requiresReason: true,
        reasons: defaultOther
    },
    ...(hasReceiveType ? [{
        label: translations[language]?.tabs?.orders?.order?.states?.received, value: "received"
    }] : []),
    ...(hasNonReceiveType || !hasReceiveType ? [{
        label: translations[language]?.tabs?.orders?.order?.states?.delivered, value: "delivered"
    }] : [])
    ]
        :
        [{
            label: translations[language]?.tabs?.orders?.order?.states?.on_the_way || "On The Way", value: "on_the_way",
            requiresDriver: true
        }, {
            label: translations[language]?.tabs?.orders?.order?.states?.waiting, value: "waiting"
        }, {
            label: translations[language]?.tabs?.orders?.order?.states?.inBranch, value: "in_branch",
            requiresBranch: isAdmin
        }, {
            label: translations[language]?.tabs?.orders?.order?.states?.cancelled, value: "cancelled",
            requiresReason: true,
            reasons: defaultOther
        }, {
            label: translations[language]?.tabs?.orders?.order?.states?.rejected, value: "rejected",
            requiresReason: true,
            reasons: [...reasonsRejected, ...defaultOther]
        }, {
            label: translations[language]?.tabs?.orders?.order?.states?.rescheduled, value: "reschedule",
            requiresReason: true,
            reasons: defaultOther
        }, {
            label: translations[language]?.tabs?.orders?.order?.states?.stuck, value: "stuck",
            requiresReason: true,
            reasons: [...reasonsStuck, ...defaultOther]
        },
        ...(hasReceiveType ? [{
            label: translations[language]?.tabs?.orders?.order?.states?.received, value: "received"
        }] : []),
        ...(hasNonReceiveType || !hasReceiveType ? [{
            label: translations[language]?.tabs?.orders?.order?.states?.delivered, value: "delivered"
        }] : [])
        ];

    const resolveDriverId = (driver) => {
        if (driver === null || driver === undefined) return undefined;
        if (typeof driver === 'number' || typeof driver === 'string') return driver;
        return driver?.user_id || driver?.id || driver?.driver_id || driver?.value || driver?.user?.user_id || driver?.user?.id || driver?.data?.user_id || driver?.data?.id || driver?.driver?.user_id || driver?.driver?.id;
    };

    const resolvePickerValue = (valueOrUpdater, currentValue) => {
        return typeof valueOrUpdater === 'function' ? valueOrUpdater(currentValue) : valueOrUpdater;
    };

    const fetchDrivers = async () => {
        try {
            const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/users?role_id=4,9`, {
                withCredentials: true
            });
            if (response.data && Array.isArray(response.data.data)) {
                setDrivers(response.data.data.map(d => ({
                    label: `${d.name} (${d.phone || d.user_id})`,
                    value: d.user_id,
                    ...d
                })));
            }
        } catch (error) {
            console.error("Error fetching drivers:", error);
            Alert.alert(translations[language]?.common?.error || "Error", "Failed to load drivers");
        }
    };

    const fetchBranches = async () => {
        try {
            const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/branches`, {
                params: { language_code: language },
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                withCredentials: true
            });

            const data = response.data;
            if (data && data.data) {
                const branchOptions = (data.data || [])
                    .filter(branch => branch && (branch.name || branch.branch_name || branch.branch_id))
                    .map(branch => ({
                        label: branch.name || branch.branch_name || String(branch.branch_id),
                        value: branch.branch_id
                    }));
                setBranches(branchOptions);
            }
        } catch (error) {
            Alert.alert(translations[language]?.common?.error || "Error", translations[language]?.tabs?.orders?.order?.selectBranch || "Select Branch");
        }
    };

    const handleCreateBusinessCollection = () => {
        setActionType('business-record-collections');
        // Ask if from driver balance
        Alert.alert(
            translations[language]?.action?.options?.businessRecordTitle || "Create Business Collection",
            translations[language]?.action?.options?.fromDriverBalance || "Create from Driver Balance?",
            [
                {
                    text: translations[language]?.action?.options?.noFromDriverBalance || "No",
                    onPress: () => processBusinessCollection(false)
                },
                {
                    text: translations[language]?.action?.options?.yesFromDriverBalance || "Yes",
                    onPress: () => {
                        setFromDriverBalance(true);
                        fetchDrivers();
                        setShowDriverModal(true);
                    }
                },
                {
                    text: translations[language]?.common?.cancel || "Cancel",
                    style: "cancel"
                }
            ]
        );
    };

    const handleCreateReturnedCollection = () => {
        setActionType('returned-record-collections');
        Alert.alert(
            translations[language]?.action?.options?.returnedRecordCollections || "Returned Collection",
            translations[language]?.action?.options?.businessReturnedConfirmText || "Are you sure you want to create a returned collection?",
            [
                {
                    text: translations[language]?.common?.cancel || "Cancel",
                    style: "cancel"
                },
                {
                    text: translations[language]?.common?.confirm || "Confirm",
                    onPress: () => processReturnedCollection(false)
                }
            ]
        );
    };

    const processReturnedCollection = async (useDriverBalance, driverId = null) => {
        setIsLoading(true);
        try {
            const requestBody = {
                orders: selectedOrderIds.map(id => ({ order_id: id })),
                print_type: 'returned'
            };

            if (useDriverBalance && driverId) {
                requestBody.from_driver_balance = true;
                requestBody.driver_id = driverId;
            }

            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/api/collections/business-record-collections`,
                requestBody,
                {
                    headers: { 'Accept-Language': language },
                    withCredentials: true
                }
            );

            handleCollectionSuccess(response.data);

        } catch (error) {
            handleError(error);
        } finally {
            if (!showDriverModal) setIsLoading(false);
        }
    };


    const processBusinessCollection = async (useDriverBalance, driverId = null) => {
        setIsLoading(true);
        try {
            const requestBody = {
                orders: selectedOrderIds.map(id => ({ order_id: id })),
                print_type: 'money' // Default to money for business-record-collections
            };

            if (useDriverBalance && driverId) {
                requestBody.from_driver_balance = true;
                requestBody.driver_id = driverId;
            }

            // First attempt
            try {
                const response = await axios.post(
                    `${process.env.EXPO_PUBLIC_API_URL}/api/collections/business-record-collections`,
                    requestBody,
                    {
                        headers: { 'Accept-Language': language },
                        withCredentials: true
                    }
                );

                handleCollectionSuccess(response.data);
            } catch (error) {
                const data = error.response?.data;

                // Handle Insufficient Balance
                if (data && data.type === 'INSUFFICIENT_BALANCE') {
                    const isAuthorizedToSkip = [1, 5].includes(user?.role_id) || ['admin', 'accountant'].includes(user?.role);

                    const insufficientSenders = data.details?.senders || [];
                    let warningText = data.messages?.[language] || data.message || "Insufficient Balance";

                    if (insufficientSenders.length > 1) {
                        warningText += "\n" + insufficientSenders.map(s => `- ${s.senderName} (${s.senderPhone})`).join('\n');
                    }

                    const buttons = [
                        { text: translations[language]?.common?.cancel || "Cancel", style: "cancel" }
                    ];

                    if (isAuthorizedToSkip) {
                        buttons.push({
                            text: translations[language]?.common?.skip || "Skip Balance Check",
                            onPress: async () => {
                                // Retry with skip_balance_check
                                try {
                                    const retryResponse = await axios.post(
                                        `${process.env.EXPO_PUBLIC_API_URL}/api/collections/business-record-collections`,
                                        { ...requestBody, skip_balance_check: true },
                                        { withCredentials: true }
                                    );
                                    handleCollectionSuccess(retryResponse.data);
                                } catch (retryError) {
                                    handleError(retryError);
                                }
                            }
                        });
                    }

                    // Option to create without senders (simplified logic for mobile)
                    buttons.push({
                        text: translations[language]?.action?.options?.createWithoutSender || "Exclude Senders",
                        onPress: async () => {
                            // Filter out orders from insufficient senders
                            const senderIdsToExclude = insufficientSenders.map(s => String(s.senderId));
                            // We need to look up orders to find their sender_ids. 
                            // Since we only have IDs, we might need to rely on the `orders` prop passed to this component
                            const validOrders = selectedOrderIds.filter(id => {
                                const order = orders.find(o => o.order_id === id);
                                if (!order) return true; // Keep if not found (safe bet?) or exclude?
                                const senderId = String(order.sender_id || order.business_id);
                                return !senderIdsToExclude.includes(senderId);
                            });

                            if (validOrders.length === 0) {
                                Alert.alert("Info", "No orders left after exclusion.");
                                setIsLoading(false);
                                return;
                            }

                            try {
                                const newRequestBody = {
                                    ...requestBody,
                                    orders: validOrders.map(id => ({ order_id: id }))
                                };
                                const retryResponse = await axios.post(
                                    `${process.env.EXPO_PUBLIC_API_URL}/api/collections/business-record-collections`,
                                    newRequestBody,
                                    { withCredentials: true }
                                );
                                handleCollectionSuccess(retryResponse.data);
                            } catch (retryError) {
                                handleError(retryError);
                            }
                        }
                    });

                    Alert.alert(translations[language]?.common?.warning || "Warning", warningText, buttons);
                    return;
                }

                throw error; // Rethrow if not handled above
            }

        } catch (error) {
            handleError(error);
        } finally {
            if (!showDriverModal) setIsLoading(false); // Only stop loading if we're not showing modal (which handles its own flow)
        }
    };

    const handleCollectionSuccess = (data) => {
        setIsLoading(false);
        const collectionIds = data.collections?.map(c => c.collection_id) || [data.collection_id || data.id];
        Alert.alert(
            translations[language]?.common?.success || "Success",
            `${translations[language]?.messages?.collectionCreated || "Collection Created"}: #${collectionIds.join(', ')}`,
            [{ text: "OK", onPress: () => onActionComplete() }]
        );
    };

    const handleError = (error) => {
        setIsLoading(false);
        const msg = error.response?.data?.messages?.[language] || error.response?.data?.message || error.message || "An error occurred";
        Alert.alert(translations[language]?.common?.error || "Error", msg);
    };

    const onDriverSelected = (driver) => {
        setShowDriverModal(false);
        const resolvedDriver = resolvePickerValue(driver, selectedStatusDriver);
        const driverValue = resolvedDriver?.driver || resolvedDriver?.value || resolvedDriver;
        const driverId = resolveDriverId(driverValue);
        if (driverId) {
            if (actionType === 'business-record-collections') {
                processBusinessCollection(true, driverId);
            } else if (actionType === 'returned-record-collections') {
                processReturnedCollection(true, driverId);
            }
        } else {
            setIsLoading(false);
        }
    };

    const handleCreateMoneyRecord = () => {
        setMoneyRecordType('business_money');
        setShowMoneyRecordModal(true);
    };

    const handleCreateReturnedRecord = () => {
        Alert.alert(
            translations[language]?.action?.options?.businessReturnedConfirmTitle || "Create Returned Record?",
            translations[language]?.action?.options?.businessReturnedConfirmText || "Are you sure you want to create a returned record?",
            [
                {
                    text: translations[language]?.common?.cancel || "Cancel",
                    style: "cancel"
                },
                {
                    text: translations[language]?.common?.confirm || "Confirm",
                    onPress: () => processCreateCollection(2, "business_returned")
                }
            ]
        );
    };

    const handleMoneyRecordSubmit = (data) => {
        // data contains { current_branch_id, expenses, received_amounts }
        processCreateCollection(1, "business_money", data);
    };

    const processCreateCollection = async (typeId, name, additionalData = {}) => {
        setIsLoading(true);
        try {
            // 1. Validate
            await axios.get(
                `${process.env.EXPO_PUBLIC_API_URL}/api/collections/${typeId}/validate?order_ids=${selectedOrderIds.join(',')}`,
                {
                    headers: { 'Accept-Language': language },
                    withCredentials: true
                }
            );

            // 2. Create
            const requestBody = {
                type_id: typeId,
                orders: selectedOrderIds.map(id => ({ order_id: id })),
                expenses: additionalData.expenses || [],
                received_amounts: additionalData.received_amounts || [],
                from_driver_balance: false,
                ...additionalData // Spread other fields like current_branch_id
            };

            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/api/collections`,
                requestBody,
                {
                    headers: { 'Accept-Language': language },
                    withCredentials: true
                }
            );

            setShowMoneyRecordModal(false);
            handleCollectionSuccess(response.data);

        } catch (error) {
            // Check if validation error (data.error) or axios error
            if (error.response && error.response.data && error.response.data.error) {
                Alert.alert(translations[language]?.common?.error || "Error", error.response.data.error);
                setIsLoading(false);
            } else {
                handleError(error);
            }
        }
    };

    if (selectedOrderIds.length === 0) return null;

    const resetBatchStatusFlow = () => {
        setSelectedStatusOption(null);
        setSelectedStatusReason(null);
        setSelectedStatusDriver(null);
        setSelectedStatusBranch(null);
        setShowStatusModal(false);
        setShowStatusReasonModal(false);
        setShowStatusDriverModal(false);
        setShowStatusBranchModal(false);
    };

    const submitBatchStatusChange = async (statusOption, reasonOption = null, branchOption = null, driverOption = null) => {
        if (!statusOption?.value) return;
        if (statusOption.value === 'in_branch' && !isAdmin && !defaultUserBranchId) {
            Alert.alert(translations[language]?.common?.error || "Error", translations[language]?.tabs?.orders?.order?.selectBranch || "Select Branch");
            return;
        }
        const resolvedDriver = resolvePickerValue(driverOption, selectedStatusDriver);
        const driverValue = resolvedDriver?.driver || resolvedDriver;
        const driverId = resolveDriverId(driverValue);
        setIsLoading(true);
        try {
            if (statusOption.value === 'on_the_way' && driverId) {
                await Promise.all(
                    selectedOrderIds.map(orderId => axios.put(
                        `${process.env.EXPO_PUBLIC_API_URL}/api/orders/${orderId}`,
                        { driver_id: driverId },
                        {
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                                'Accept-Language': language,
                            },
                            withCredentials: true
                        }
                    ))
                );
            }

            const updates = selectedOrderIds.map(id => ({
                order_id: id,
                status: statusOption.value,
                ...(reasonOption?.value ? { reason: reasonOption.value } : {}),
                ...(branchOption?.value ? { current_branch: branchOption.value } : {}),
                ...(statusOption.value === 'in_branch' && !isAdmin && defaultUserBranchId ? { current_branch: defaultUserBranchId } : {}),
                ...(driverId ? { driver_id: driverId } : {})
            }));

            const response = await axios.put(
                `${process.env.EXPO_PUBLIC_API_URL}/api/orders/status`,
                { updates },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Accept-Language': language,
                    },
                    withCredentials: true
                }
            );

            if (response.data?.error) {
                throw new Error(response.data?.details || response.data?.error || "Failed to update status");
            }

            Alert.alert(
                translations[language]?.common?.success || "Success",
                translations[language]?.tabs?.orders?.order?.statusChangeSuccess || "Status updated successfully",
                [{ text: "OK", onPress: () => onActionComplete() }]
            );
        } catch (error) {
            const msg = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to update status";
            Alert.alert(translations[language]?.common?.error || "Error", msg);
        } finally {
            setIsLoading(false);
            resetBatchStatusFlow();
        }
    };

    const handleBatchStatusChange = () => {
        resetBatchStatusFlow();
        setShowStatusModal(true);
    };

    const handleBatchStatusSelect = (statusOption) => {
        setSelectedStatusOption(statusOption);
        setShowStatusModal(false);

        if (statusOption?.requiresDriver) {
            fetchDrivers();
            setShowStatusDriverModal(true);
            return;
        }

        if (statusOption?.requiresBranch) {
            fetchBranches();
            setShowStatusBranchModal(true);
            return;
        }

        if (statusOption?.requiresReason) {
            setShowStatusReasonModal(true);
            return;
        }

        Alert.alert(
            translations[language]?.tabs?.orders?.order?.changeStatusAlert || "Change Status",
            `${translations[language]?.tabs?.orders?.order?.changeStatusConfirm || "Change status to"} ${statusOption?.label || statusOption?.value}?`,
            [
                { text: translations[language]?.common?.cancel || "Cancel", style: "cancel" },
                { text: translations[language]?.common?.confirm || "Confirm", onPress: () => submitBatchStatusChange(statusOption) }
            ]
        );
    };

    const handleBatchReasonSelect = (reasonOption) => {
        setSelectedStatusReason(reasonOption);
        setShowStatusReasonModal(false);
        if (selectedStatusOption) {
            Alert.alert(
                translations[language]?.tabs?.orders?.order?.changeStatusAlert || "Change Status",
                `${translations[language]?.tabs?.orders?.order?.changeStatusConfirm || "Change status to"} ${selectedStatusOption?.label || selectedStatusOption?.value}?`,
                [
                    { text: translations[language]?.common?.cancel || "Cancel", style: "cancel" },
                    { text: translations[language]?.common?.confirm || "Confirm", onPress: () => submitBatchStatusChange(selectedStatusOption, reasonOption) }
                ]
            );
        }
    };

    const handleBatchBranchSelect = (branchOption) => {
        setSelectedStatusBranch(branchOption);
        setShowStatusBranchModal(false);
        if (selectedStatusOption) {
            Alert.alert(
                translations[language]?.tabs?.orders?.order?.changeStatusAlert || "Change Status",
                `${translations[language]?.tabs?.orders?.order?.changeStatusConfirm || "Change status to"} ${selectedStatusOption?.label || selectedStatusOption?.value}?`,
                [
                    { text: translations[language]?.common?.cancel || "Cancel", style: "cancel" },
                    { text: translations[language]?.common?.confirm || "Confirm", onPress: () => submitBatchStatusChange(selectedStatusOption, null, branchOption) }
                ]
            );
        }
    };

    const handleBatchDriverSelect = (driverOption) => {
        const resolvedDriver = resolvePickerValue(driverOption, selectedStatusDriver);
        const driverValue = resolvedDriver?.driver || resolvedDriver;
        const driverId = resolveDriverId(driverValue);
        const normalizedDriver = driverValue && typeof driverValue === 'object'
            ? { ...driverValue, value: driverId ?? driverValue.value }
            : { value: driverId };
        setSelectedStatusDriver(normalizedDriver);
        setShowStatusDriverModal(false);
        if (selectedStatusOption) {
            Alert.alert(
                translations[language]?.tabs?.orders?.order?.changeStatusAlert || "Change Status",
                `${translations[language]?.tabs?.orders?.order?.changeStatusConfirm || "Change status to"} ${selectedStatusOption?.label || selectedStatusOption?.value}?`,
                [
                    { text: translations[language]?.common?.cancel || "Cancel", style: "cancel" },
                    { text: translations[language]?.common?.confirm || "Confirm", onPress: () => submitBatchStatusChange(selectedStatusOption, null, null, normalizedDriver) }
                ]
            );
        }
    };

    const actions = [
        {
            id: 'status',
            show: canChangeBatchStatus,
            label: translations[language]?.tabs?.orders?.order?.status || "Change Status",
            onPress: handleBatchStatusChange,
            color: colors.primary
        },
        {
            id: 'money',
            show: canCreateMoneyRecord,
            label: translations[language]?.action?.options?.moneyRecord || "Money Record",
            onPress: handleCreateMoneyRecord,
            color: colors.secondary || '#6c757d'
        },
        {
            id: 'returned',
            show: canCreateReturnedRecord,
            label: translations[language]?.action?.options?.returnedRecord || "Returned Record",
            onPress: handleCreateReturnedRecord,
            color: colors.secondary || '#6c757d'
        },
        {
            id: 'business-collection',
            show: canCreateBusinessCollection,
            label: translations[language]?.action?.options?.businessRecordCollections || "Business Collection",
            onPress: handleCreateBusinessCollection,
            color: colors.primary,
            isLoading: isLoading
        },
        {
            id: 'returned-collection',
            show: canCreateReturnedCollection,
            label: translations[language]?.action?.options?.returnedRecordCollections || "Returned Collection",
            onPress: handleCreateReturnedCollection,
            color: colors.primary || '#6c757d'
        }
    ].filter(a => a.show);

    const renderActionButton = ({ item }) => (
        <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: item.color }]}
            onPress={item.onPress}
            disabled={isLoading}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            activeOpacity={0.6}
        // Removed disallowInterruption to allow ScrollView to take over
        >
            {item.isLoading ? (
                <ActivityIndicator color="white" size="small" />
            ) : (
                <Text style={styles.actionButtonText}>{item.label}</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                    paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 10) : 10,
                    zIndex: 999,
                }
            ]}
        >
            <View style={styles.infoRow}>
                <Text style={[styles.selectedText, { color: colors.text }]}>
                    {selectedOrderIds.length} {translations[language]?.common?.selected || "Selected"}
                </Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                    <TouchableOpacity onPress={onSelectAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={{ color: colors.primary }}>
                            {translations[language]?.common?.selectAll || "Select All"}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onSelectAllUnpaid} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={{ color: colors.primary }}>
                            {translations[language]?.common?.selectAllUnpaid || "Select All false financial_status"}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onCancelSelection} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                            {translations[language]?.common?.cancel || "Cancel"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.scrollContainer}
                contentContainerStyle={styles.actionsListContent}
                keyboardShouldPersistTaps="always"
                scrollEventThrottle={16}
                decelerationRate="fast"
                bounces={true}
                alwaysBounceHorizontal={true}
                directionalLockEnabled={true}
            >
                {actions.map(action => (
                    <View key={action.id}>
                        {renderActionButton({ item: action })}
                    </View>
                ))}
            </ScrollView>

            <PickerModal
                visible={showDriverModal}
                title={translations[language]?.common?.selectDriver || "Select Driver"}
                data={drivers}
                onSelect={onDriverSelected}
                onClose={() => { setShowDriverModal(false); setIsLoading(false); }}
                searchPlaceholder={translations[language]?.common?.search || "Search..."}
            />

            <PickerModal
                visible={showStatusModal}
                title={translations[language]?.tabs?.orders?.order?.status || "Change Status"}
                data={batchStatusOptions}
                onSelect={handleBatchStatusSelect}
                onClose={() => setShowStatusModal(false)}
                searchPlaceholder={translations[language]?.common?.search || "Search..."}
            />

            <PickerModal
                visible={showStatusReasonModal}
                title={translations[language]?.tabs?.orders?.order?.selectReason || "Select Reason"}
                data={selectedStatusOption?.reasons || []}
                onSelect={handleBatchReasonSelect}
                onClose={() => setShowStatusReasonModal(false)}
                searchPlaceholder={translations[language]?.common?.search || "Search..."}
            />

            <PickerModal
                visible={showStatusBranchModal}
                title={translations[language]?.tabs?.orders?.order?.selectBranch || "Select Branch"}
                data={branches}
                onSelect={handleBatchBranchSelect}
                onClose={() => setShowStatusBranchModal(false)}
                searchPlaceholder={translations[language]?.common?.search || "Search..."}
            />

            <PickerModal
                visible={showStatusDriverModal}
                title={translations[language]?.common?.selectDriver || "Select Driver"}
                data={drivers}
                onSelect={handleBatchDriverSelect}
                onClose={() => setShowStatusDriverModal(false)}
                searchPlaceholder={translations[language]?.common?.search || "Search..."}
            />

            <CreateMoneyRecordModal
                visible={showMoneyRecordModal}
                onClose={() => setShowMoneyRecordModal(false)}
                onSubmit={handleMoneyRecordSubmit}
                type={moneyRecordType}
                isLoading={isLoading}
                selectedOrderIds={selectedOrderIds}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 10,
        borderTopWidth: 1,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    selectedText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    actionsRow: {
        paddingVertical: 2,
        paddingHorizontal: 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    scrollContainer: {
        height: 44,
        width: Dimensions.get('window').width,
    },
    actionsListContent: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        alignItems: 'center',
        paddingBottom: 2, // Small room for shadow
    },
    actionButton: {
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 34,
        marginHorizontal: 4,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 1.2,
    },
    actionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12.5,
    }
});
