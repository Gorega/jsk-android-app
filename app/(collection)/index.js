import { View, StyleSheet, RefreshControl, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import Search from '../../components/search/Search';
import CollectionsView from '../../components/collections/CollectionsView';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from "expo-router"
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useSocket } from '../../utils/socketContext';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import axios from 'axios';
import { useAuth } from "../../RootLayout";
import ModalPresentation from '../../components/ModalPresentation';
import PickerModal from '../../components/pickerModal/PickerModal';

export default function HomeScreen() {
    useSocket();
    const { language } = useLanguage();
    const isRTL = ["he", "ar"].includes(language);
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const { user } = useAuth();

    const [searchValue, setSearchValue] = useState("");
    const [activeFilter, setActiveFilter] = useState("");
    const [activeSearchBy, setActiveSearchBy] = useState("");
    const [activeDate, setActiveDate] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [data, setData] = useState({ data: [], metadata: { total_records: 0 } });
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const params = useLocalSearchParams();
    const { type, collectionIds, scannedReferenceId, focusCollectionId: focusCollectionIdParam } = params;
    const [refreshing, setRefreshing] = useState(false);
    const listRef = useRef(null);
    const [focusCollectionId, setFocusCollectionId] = useState(null);
    const hasAutoScrolledRef = useRef(false);

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedCollectionIds, setSelectedCollectionIds] = useState([]);

    const canEnterSelectionMode = useMemo(() => {
        return user && !['business', 'driver', 'delivery_company'].includes(user.role);
    }, [user]);

    const canDispatchToSender = useMemo(() => {
        return user && [1, 5, 3, 7, 8].includes(user.role_id);
    }, [user]);

    const canAdminOrAccountant = useMemo(() => {
        return user && [1, 5].includes(user.role_id);
    }, [user]);

    const currentCollections = data?.data || [];

    const [showStatusModal, setShowStatusModal] = useState(false);
    const [pendingStatus, setPendingStatus] = useState(null);
    const [statusNote, setStatusNote] = useState('');
    const [statusLoading, setStatusLoading] = useState(false);

    const openStatusModal = useCallback((status) => {
        setPendingStatus(status);
        setStatusNote('');
        setShowStatusModal(true);
    }, []);

    const performBatchStatusUpdate = useCallback(async () => {
        if (!pendingStatus) return;
        if (!Array.isArray(selectedCollectionIds) || selectedCollectionIds.length === 0) return;

        setStatusLoading(true);
        try {
            const results = await Promise.all(selectedCollectionIds.map(async (collectionId) => {
                try {
                    await axios.put(
                        `${process.env.EXPO_PUBLIC_API_URL}/api/collections/${collectionId}/status`,
                        {
                            status: pendingStatus,
                            note_content: statusNote?.trim() ? statusNote.trim() : undefined
                        },
                        {
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                                'Accept-Language': language
                            },
                            withCredentials: true
                        }
                    );
                    return { collectionId, ok: true };
                } catch (e) {
                    return { collectionId, ok: false, error: e?.response?.data?.message || e?.message };
                }
            }));

            const okCount = results.filter(r => r.ok).length;
            const failCount = results.length - okCount;

            setShowStatusModal(false);
            handleCancelSelection();
            setPage(1);
            fetchData(1, false);

            if (failCount === 0) {
                Alert.alert(
                    translations[language]?.common?.success || 'Success',
                    translations[language]?.common?.done || 'Done'
                );
            } else {
                Alert.alert(
                    translations[language]?.errors?.error || 'Error',
                    `Updated: ${okCount}, Failed: ${failCount}`
                );
            }
        } finally {
            setStatusLoading(false);
        }
    }, [pendingStatus, selectedCollectionIds, statusNote, language, handleCancelSelection]);

    const performBatchDelete = useCallback(() => {
        if (!Array.isArray(selectedCollectionIds) || selectedCollectionIds.length === 0) return;

        Alert.alert(
            translations[language]?.common?.confirm || 'Confirm',
            translations[language]?.common?.areYouSure || 'Are you sure?',
            [
                { text: translations[language]?.common?.cancel || 'Cancel', style: 'cancel' },
                {
                    text: translations[language]?.common?.delete || 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setStatusLoading(true);
                        try {
                            const results = await Promise.all(selectedCollectionIds.map(async (collectionId) => {
                                try {
                                    await axios.delete(
                                        `${process.env.EXPO_PUBLIC_API_URL}/api/collections/${collectionId}`,
                                        {
                                            headers: {
                                                'Accept': 'application/json',
                                                'Content-Type': 'application/json',
                                                'Accept-Language': language
                                            },
                                            withCredentials: true
                                        }
                                    );
                                    return { collectionId, ok: true };
                                } catch (e) {
                                    return { collectionId, ok: false, error: e?.response?.data?.message || e?.message };
                                }
                            }));

                            const okCount = results.filter(r => r.ok).length;
                            const failCount = results.length - okCount;

                            handleCancelSelection();
                            setPage(1);
                            fetchData(1, false);

                            if (failCount === 0) {
                                Alert.alert(
                                    translations[language]?.common?.success || 'Success',
                                    translations[language]?.common?.done || 'Done'
                                );
                            } else {
                                Alert.alert(
                                    translations[language]?.errors?.error || 'Error',
                                    `Deleted: ${okCount}, Failed: ${failCount}`
                                );
                            }
                        } finally {
                            setStatusLoading(false);
                        }
                    }
                }
            ]
        );
    }, [selectedCollectionIds, language, handleCancelSelection]);

    const handleLongPressCollection = useCallback((collectionId) => {
        if (!canEnterSelectionMode) return;
        setIsSelectionMode(true);
        setSelectedCollectionIds([collectionId]);
    }, [canEnterSelectionMode]);

    const handleSelectCollection = useCallback((collectionId) => {
        setSelectedCollectionIds(prev => {
            if (prev.includes(collectionId)) {
                const next = prev.filter(id => id !== collectionId);
                if (next.length === 0) setIsSelectionMode(false);
                return next;
            }
            setIsSelectionMode(true);
            return [...prev, collectionId];
        });
    }, []);

    const handleCancelSelection = useCallback(() => {
        setIsSelectionMode(false);
        setSelectedCollectionIds([]);
    }, []);

    const handleSelectAll = useCallback(() => {
        if (!canEnterSelectionMode) return;
        const allIds = currentCollections.map(c => c.collection_id).filter(Boolean);
        setIsSelectionMode(true);
        setSelectedCollectionIds(allIds);
    }, [canEnterSelectionMode, currentCollections]);

    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [dispatchDriver, setDispatchDriver] = useState(null);
    const [dispatchNote, setDispatchNote] = useState('');
    const [dispatchLoading, setDispatchLoading] = useState(false);
    const [showPickerModal, setShowPickerModal] = useState(false);

    const openDispatchModal = useCallback(() => {
        setDispatchDriver(null);
        setDispatchNote('');
        setShowDispatchModal(true);
    }, []);

    const openDriverPicker = useCallback(() => {
        if (Platform.OS === 'ios') {
            // iOS can't stack two <Modal> components — close dispatch modal first
            setShowDispatchModal(false);
            setTimeout(() => {
                setShowPickerModal(true);
            }, 400);
        } else {
            setShowPickerModal(true);
        }
    }, []);

    const driverPickerField = useMemo(() => ({
        name: 'toDriver',
        label: translations[language]?.camera?.toDriver || translations[language]?.camera?.selectDriverFrom || 'Select Driver',
        showSearchBar: true
    }), [language]);

    const driverPickerApiConfig = useMemo(() => ({
        endpoint: `${process.env.EXPO_PUBLIC_API_URL}/api/users`,
        params: {
            role_id: '4,9',
            language_code: language
        },
        searchParam: 'name',
        dataPath: 'data'
    }), [language]);

    const handleDispatchToSender = useCallback(async () => {
        if (!dispatchDriver?.user_id) {
            Alert.alert(
                translations[language]?.errors?.error || 'Error',
                translations[language]?.camera?.driversError || 'Please select a driver'
            );
            return;
        }
        if (!Array.isArray(selectedCollectionIds) || selectedCollectionIds.length === 0) {
            return;
        }

        setDispatchLoading(true);
        try {
            await axios.put(
                `${process.env.EXPO_PUBLIC_API_URL}/api/collections/send/dispatch-to-sender`,
                {
                    collection_ids: selectedCollectionIds,
                    driver_id: dispatchDriver.user_id,
                    note_content: dispatchNote?.trim() ? dispatchNote.trim() : undefined
                },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Accept-Language': language
                    },
                    withCredentials: true
                }
            );

            setShowDispatchModal(false);
            handleCancelSelection();
            setPage(1);
            fetchData(1, false);
        } catch (err) {
            Alert.alert(
                translations[language]?.errors?.error || 'Error',
                err?.response?.data?.message || err?.message || 'Failed to dispatch collections'
            );
        } finally {
            setDispatchLoading(false);
        }
    }, [dispatchDriver, dispatchNote, selectedCollectionIds, language, handleCancelSelection]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setPage(1);
        fetchData(1, false).finally(() => setRefreshing(false));
    }, [language]);

    useEffect(() => {
        if (focusCollectionIdParam && focusCollectionIdParam !== 'undefined') {
            const idValue = String(focusCollectionIdParam);
            setFocusCollectionId(idValue);
            hasAutoScrolledRef.current = false;
            setTimeout(() => {
                router.setParams({ focusCollectionId: undefined });
            }, 500);
        }
    }, [focusCollectionIdParam]);

    const handleScrollToIndexFailed = useCallback((info) => {
        const offset = info.averageItemLength * info.index;
        listRef.current?.scrollToOffset({ offset, animated: true });
        setTimeout(() => {
            listRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.2 });
        }, 300);
    }, []);

    useEffect(() => {
        if (!focusCollectionId || !currentCollections?.length || hasAutoScrolledRef.current) return;
        const targetIndex = currentCollections.findIndex(
            (item) => String(item.collection_id) === String(focusCollectionId)
        );
        if (targetIndex < 0) return;
        hasAutoScrolledRef.current = true;
        const scrollTimer = setTimeout(() => {
            listRef.current?.scrollToIndex({ index: targetIndex, animated: true, viewPosition: 0.2 });
        }, 300);
        return () => {
            clearTimeout(scrollTimer);
        };
    }, [focusCollectionId, currentCollections]);

    // Function to handle scanned collection ID
    const scanCollectionId = (collectionId) => {

        // Make sure we have valid searchByGroup before proceeding
        if (!searchByGroup || searchByGroup.length === 0) {
            console.error("searchByGroup is not available yet");
            return;
        }

        // Find the collection_id search option
        const collectionIdSearchOption = searchByGroup.find(option => option.action === "collection_id");

        if (!collectionIdSearchOption) {
            console.error("Could not find collection_id search option");
            return;
        }

        setActiveSearchBy(collectionIdSearchOption);
        setSearchValue(collectionId);

        // We need to manually construct and execute the search since the state updates might not be reflected immediately
        const fetchScannedData = async () => {
            try {
                // Ensure we have a valid type
                const currentType = type || params.type;

                if (!currentType) {
                    return;
                }

                // Determine type_id based on collection type (same logic as fetchData)
                let typeId;
                switch (currentType) {
                    case "business_money":
                        typeId = 4;
                        break;
                    case "driver_money":
                        typeId = 1;
                        break;
                    case "business_returned":
                        typeId = 5;
                        break;
                    case "driver_returned":
                        typeId = 2;
                        break;
                    case "dispatched":
                        typeId = 3;
                        break;
                    default:
                        typeId = 1; // Default to type 1 if unknown
                }

                const queryParams = new URLSearchParams();
                queryParams.append('type_id', typeId);
                queryParams.append('collection_id', collectionId);
                queryParams.append('page', 1);
                queryParams.append('language_code', language);

                setIsLoading(true);
                const res = await axios.get(
                    `${process.env.EXPO_PUBLIC_API_URL}/api/collections`,
                    {
                        params: Object.fromEntries(queryParams),
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Accept-Language': language
                        },
                        withCredentials: true
                    }
                );

                const response = res.data;

                // Handle the response data structure consistently
                const newData = {
                    data: response.data || response.collections || [],
                    metadata: response.metadata || response.pagination || {}
                };

                setData(newData);
                setPage(1);
            } catch (err) {
                console.error(" [collection/index.js] fetchScannedData - Error:", err.message);
            } finally {
                setIsLoading(false);
            }
        };

        // Execute the fetch
        fetchScannedData();
    };

    // Handle scannedReferenceId from URL params
    useEffect(() => {
        if (scannedReferenceId && scannedReferenceId !== 'undefined') {

            // Clear the param to prevent reapplying on subsequent renders
            setTimeout(() => {
                router.setParams({ scannedReferenceId: undefined });
            }, 500);

            // Apply the scanned ID to search
            scanCollectionId(scannedReferenceId);
        }
    }, [scannedReferenceId]);


    const searchByGroup = [
        { name: translations[language].collections.filters.collectionId, action: "collection_id" },
        { name: translations[language].collections.filters.sender, action: "bussiness_name" },
        (type === "sent" || type === "dispatched") ? { name: translations[language].collections.filters.driver, action: "driver_name" } : { name: translations[language].collections.filters.prevDriver, action: "previous_driver_name" },
        { name: translations[language].collections.filters.currentBranch, action: "current_branch_name" }
    ]

    const searchByDateGroup = [{
        name: translations[language].collections.filters.today,
        action: "today"
    }, {
        name: translations[language].collections.filters.yesterday,
        action: "yesterday"
    }, {
        name: translations[language].collections.filters.thisWeek,
        action: "this_week"
    }, {
        name: translations[language].collections.filters.thisMonth,
        action: "this_month"
    }, {
        name: translations[language].collections.filters.thisYear,
        action: "this_year"
    }, {
        name: translations[language].collections.filters.selectDate,
        action: "custom"
    }]

    const clearFilters = () => {
        router.setParams({
            collectionIds: undefined,
            scannedReferenceId: undefined,
            focusCollectionId: undefined
        });
        setSearchValue("");
        setActiveSearchBy("");
        setActiveDate("");
        setSelectedDate("");
        setActiveFilter("");
        setFocusCollectionId(null);
        hasAutoScrolledRef.current = false;
        setPage(1);
        fetchData(1, false);
    };

    const fetchData = async (pageNumber = 1, isLoadMore = false) => {
        if (!isLoadMore) setIsLoading(true);
        try {
            const queryParams = new URLSearchParams();
            let typeId;

            // Determine type_id based on collection type
            switch (type) {
                case "business_money":
                    typeId = 4;
                    break;
                case "driver_money":
                    typeId = 1;
                    break;
                case "business_returned":
                    typeId = 5;
                    break;
                case "driver_returned":
                    typeId = 2;
                    break;
                case "dispatched":
                    typeId = 3;
                    break;
                default:
                    typeId = 1; // Default to type 1 if unknown
            }

            // Always add type_id as the primary filter
            queryParams.append('type_id', typeId);
            queryParams.append('page', pageNumber);
            queryParams.append('language_code', language);

            // Build additional query parameters only if they exist
            if (!activeSearchBy && searchValue) {
                queryParams.append('search', searchValue);
            }

            if (collectionIds && collectionIds !== 'undefined') {
                try {
                    const parsedCollectionIds = JSON.parse(collectionIds);
                    if (Array.isArray(parsedCollectionIds) && parsedCollectionIds.length > 0) {
                        queryParams.append('collection_id', parsedCollectionIds.join(','));
                    }
                } catch (err) {
                    console.error("Error parsing collection IDs:", err);
                }
            }

            if (activeSearchBy && searchValue) {
                queryParams.append(activeSearchBy.action, searchValue);
            }

            if (activeDate) {
                queryParams.append("date_range", activeDate.action);
            }

            if (activeDate && activeDate.action === "custom") {
                queryParams.append("start_date", selectedDate);
                queryParams.append("end_date", selectedDate);
            }

            const res = await axios.get(
                `${process.env.EXPO_PUBLIC_API_URL}/api/collections`,
                {
                    params: Object.fromEntries(queryParams),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Accept-Language': language
                    },
                    withCredentials: true
                }
            );

            const response = res.data;

            // Handle the response data structure consistently
            const newData = {
                data: response.data || response.collections || [],
                metadata: response.metadata || response.pagination || {}
            };

            if (isLoadMore) {
                setData(prevData => ({
                    ...prevData,
                    data: [...(prevData.data || []), ...(newData.data || [])],
                }));
            } else {
                setData(newData);
            }
        } catch (err) {
            console.error(" [collection/index.js] fetchData - Error:", err.message);
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    }

    const loadMoreData = async () => {
        if (!loadingMore) {
            const currentData = data.data || [];
            const totalRecords = data.metadata?.total_records || 0;

            if (!currentData?.length > 0) return;

            // Check if there's more data to load
            if (currentData.length >= totalRecords) {
                return;
            }

            setLoadingMore(true);
            const nextPage = page + 1;
            setPage(nextPage);
            try {
                await fetchData(nextPage, true);
            } catch (error) {
                console.error("Error loading more data:", error);
            } finally {
                setLoadingMore(false);
            }
        }
    };


    useEffect(() => {
        setPage(1);
        fetchData(1, false);
        if (collectionIds && collectionIds !== 'undefined') {
            setActiveSearchBy(searchByGroup[0]);
            // Set default type to driver_money if not already specified
            if (!type) {
                router.setParams({ type: "driver_money" });
            }
        }
    }, [type, searchValue, activeFilter, activeDate, collectionIds]);


    // const handleCollectionsUpdate = useCallback((notification) => {
    //     switch (notification.type) {
    //         case 'COLLECTION_CREATED':
    //         case 'COLLECTION_UPDATED':
    //         case 'COLLECTION_DELETED':
    //         case 'STATUS_UPDATED':
    //             // Refresh orders data only if update is recent
    //             fetchData(1,false);
    //             break;
    //         default:
    //             break;
    //     }
    // }, []);

    // useEffect(() => {
    //     if(socket){
    //         socket.on('collectionUpdate', handleCollectionsUpdate);
    //         return () => {
    //             socket.off('collectionUpdate', handleCollectionsUpdate);
    //         };
    //     }
    // }, [socket, handleCollectionsUpdate]);


    const showDispatchAction = isSelectionMode &&
        selectedCollectionIds.length > 0 &&
        canDispatchToSender &&
        (type === 'business_money' || type === 'business_returned');

    const showConfirmAction = isSelectionMode &&
        selectedCollectionIds.length > 0 &&
        canAdminOrAccountant &&
        type === 'business_money';

    const showCompletedAction = isSelectionMode &&
        selectedCollectionIds.length > 0 &&
        canAdminOrAccountant &&
        ['driver_money', 'driver_returned', 'business_money', 'business_returned'].includes(type);

    const showDeleteAction = isSelectionMode &&
        selectedCollectionIds.length > 0 &&
        canAdminOrAccountant &&
        ['driver_money', 'driver_returned', 'business_money', 'business_returned', 'sent'].includes(type);

    return <View style={[styles.main, { backgroundColor: colors.background }]}>
        <Search
            searchValue={searchValue}
            setSearchValue={(input) => setSearchValue(input)}
            filterByGroup={[]}
            searchByGroup={searchByGroup}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            activeSearchBy={activeSearchBy}
            setActiveSearchBy={setActiveSearchBy}
            searchByDateGroup={searchByDateGroup}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            activeDate={activeDate}
            setActiveDate={setActiveDate}
            onClearFilters={clearFilters}
            onScanCollection={scanCollectionId}
        />
        <View style={styles.section}>
            <CollectionsView
                data={data?.data || []}
                type={type}
                loadMoreData={loadMoreData}
                loadingMore={loadingMore}
                isLoading={isLoading}
                isSelectionMode={isSelectionMode}
                selectedCollectionIds={selectedCollectionIds}
                onSelectCollection={handleSelectCollection}
                onLongPressCollection={handleLongPressCollection}
                listRef={listRef}
                onScrollToIndexFailed={handleScrollToIndexFailed}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]} // Android
                        tintColor={colors.primary} // iOS
                    />
                }
            />
        </View>
        {isSelectionMode && selectedCollectionIds.length > 0 && (
            <View style={[styles.selectionBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <Text style={[styles.selectionText, {
                    color: colors.text, ...Platform.select({
                        ios: {
                            textAlign: isRTL ? "left" : ""
                        }
                    })
                }]}>
                    {(translations[language]?.common?.selected || 'Selected')}: {selectedCollectionIds.length}
                </Text>
                <View style={styles.selectionActions}>
                    <TouchableOpacity
                        style={[styles.selectionButton, { borderColor: colors.border }]}
                        onPress={handleSelectAll}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.selectionButtonText, { color: colors.text }]}>
                            {translations[language]?.common?.selectAll || 'Select All'}
                        </Text>
                    </TouchableOpacity>
                    {showDispatchAction && (
                        <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                            onPress={openDispatchModal}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.primaryButtonText, { color: '#fff' }]}>
                                {translations[language]?.collections?.collection?.dispatch_to_sender || 'Dispatch to sender'}
                            </Text>
                        </TouchableOpacity>
                    )}
                    {showConfirmAction && (
                        <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: statusLoading ? 0.7 : 1 }]}
                            onPress={() => openStatusModal('confirm')}
                            activeOpacity={0.8}
                            disabled={statusLoading}
                        >
                            <Text style={[styles.primaryButtonText, { color: '#fff' }]}>
                                {translations[language]?.collections?.collection?.confirm || translations[language]?.common?.confirm || 'Confirm'}
                            </Text>
                        </TouchableOpacity>
                    )}
                    {showCompletedAction && (
                        <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: colors.success, opacity: statusLoading ? 0.7 : 1 }]}
                            onPress={() => openStatusModal('completed')}
                            activeOpacity={0.8}
                            disabled={statusLoading}
                        >
                            <Text style={[styles.primaryButtonText, { color: '#fff' }]}>
                                {translations[language]?.collections?.collection?.completed || 'Completed'}
                            </Text>
                        </TouchableOpacity>
                    )}
                    {showDeleteAction && (
                        <TouchableOpacity
                            style={[styles.dangerButton, { backgroundColor: colors.error, opacity: statusLoading ? 0.7 : 1 }]}
                            onPress={performBatchDelete}
                            activeOpacity={0.8}
                            disabled={statusLoading}
                        >
                            <Text style={[styles.primaryButtonText, { color: '#fff' }]}>
                                {translations[language]?.common?.delete || 'Delete'}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.dangerButton, { backgroundColor: colors.error }]}
                        onPress={handleCancelSelection}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.primaryButtonText, { color: '#fff' }]}>
                            {translations[language]?.common?.cancel || 'Cancel'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        )}

        <ModalPresentation
            showModal={showDispatchModal}
            setShowModal={setShowDispatchModal}
            customStyles={{ bottom: 15 }}
            position="bottom"
        >
            <View style={[styles.dispatchModalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.dispatchModalTitle, {
                    color: colors.text, ...Platform.select({
                        ios: {
                            textAlign: isRTL ? "left" : ""
                        }
                    })
                }]}>
                    {translations[language]?.collections?.collection?.dispatch_to_sender || 'Dispatch to sender'}
                </Text>
            </View>
            <View style={styles.dispatchModalContent}>
                <Text style={[styles.dispatchLabel, {
                    color: colors.textSecondary, ...Platform.select({
                        ios: {
                            textAlign: isRTL ? "left" : ""
                        }
                    })
                }]}>
                    {(translations[language]?.common?.selected || 'Selected')}: {selectedCollectionIds.length}
                </Text>

                <TouchableOpacity
                    style={[styles.driverSelectButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                    onPress={openDriverPicker}
                    activeOpacity={0.8}
                >
                    <Text style={{
                        color: colors.text, ...Platform.select({
                            ios: {
                                textAlign: isRTL ? "left" : ""
                            }
                        })
                    }}>
                        {dispatchDriver?.name || dispatchDriver?.user_name || dispatchDriver?.commercial_name || (translations[language]?.camera?.toDriver || 'Select Driver')}
                    </Text>
                </TouchableOpacity>

                <TextInput
                    style={[styles.noteInput, {
                        borderColor: colors.border, color: colors.text, backgroundColor: colors.surface, ...Platform.select({
                            ios: {
                                textAlign: isRTL ? "right" : ""
                            }
                        })
                    }]}
                    placeholder={translations[language]?.common?.note || 'Note (optional)'}
                    placeholderTextColor={colors.textTertiary}
                    value={dispatchNote}
                    onChangeText={setDispatchNote}
                    multiline
                />

                <View style={styles.dispatchButtonsRow}>
                    <TouchableOpacity
                        style={[styles.selectionButton, { borderColor: colors.border }]}
                        onPress={() => setShowDispatchModal(false)}
                        activeOpacity={0.8}
                        disabled={dispatchLoading}
                    >
                        <Text style={[styles.selectionButtonText, { color: colors.text }]}>
                            {translations[language]?.common?.cancel || 'Cancel'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: dispatchLoading ? 0.7 : 1 }]}
                        onPress={handleDispatchToSender}
                        activeOpacity={0.8}
                        disabled={dispatchLoading}
                    >
                        {dispatchLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={[styles.primaryButtonText, { color: '#fff' }]}>
                                {translations[language]?.common?.confirm || 'Confirm'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </ModalPresentation>

        <ModalPresentation
            showModal={showStatusModal}
            setShowModal={setShowStatusModal}
            customStyles={{ bottom: 15 }}
            position="bottom"
        >
            <View style={[styles.dispatchModalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.dispatchModalTitle, {
                    color: colors.text, ...Platform.select({
                        ios: {
                            textAlign: isRTL ? "left" : ""
                        }
                    })
                }]}>
                    {pendingStatus === 'completed'
                        ? (translations[language]?.collections?.collection?.completed || 'Completed')
                        : (translations[language]?.collections?.collection?.confirm || translations[language]?.common?.confirm || 'Confirm')}
                </Text>
            </View>
            <View style={styles.dispatchModalContent}>
                <Text style={[styles.dispatchLabel, {
                    color: colors.textSecondary, ...Platform.select({
                        ios: {
                            textAlign: isRTL ? "left" : ""
                        }
                    })
                }]}>
                    {(translations[language]?.common?.selected || 'Selected')}: {selectedCollectionIds.length}
                </Text>

                <TextInput
                    style={[styles.noteInput, {
                        borderColor: colors.border, color: colors.text, backgroundColor: colors.surface, ...Platform.select({
                            ios: {
                                textAlign: isRTL ? "right" : ""
                            }
                        })
                    }]}
                    placeholder={translations[language]?.common?.note || 'Note (optional)'}
                    placeholderTextColor={colors.textTertiary}
                    value={statusNote}
                    onChangeText={setStatusNote}
                    multiline
                />

                <View style={styles.dispatchButtonsRow}>
                    <TouchableOpacity
                        style={[styles.selectionButton, { borderColor: colors.border }]}
                        onPress={() => setShowStatusModal(false)}
                        activeOpacity={0.8}
                        disabled={statusLoading}
                    >
                        <Text style={[styles.selectionButtonText, { color: colors.text }]}>
                            {translations[language]?.common?.cancel || 'Cancel'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: statusLoading ? 0.7 : 1 }]}
                        onPress={performBatchStatusUpdate}
                        activeOpacity={0.8}
                        disabled={statusLoading}
                    >
                        {statusLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={[styles.primaryButtonText, { color: '#fff' }]}>
                                {translations[language]?.common?.confirm || 'Confirm'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </ModalPresentation>

        {showPickerModal && (
            <PickerModal
                list={[]}
                showPickerModal={showPickerModal}
                setShowModal={(val) => {
                    setShowPickerModal(val);
                    // On iOS, reopen the dispatch modal after the picker closes
                    if (!val && Platform.OS === 'ios') {
                        setTimeout(() => {
                            setShowDispatchModal(true);
                        }, 400);
                    }
                }}
                loading={false}
                field={driverPickerField}
                apiConfig={driverPickerApiConfig}
                setSelectedValue={(value) => {
                    if (typeof value === 'function') {
                        const newValueObj = value({ toDriver: null });
                        const selectedItem = newValueObj?.toDriver;
                        if (selectedItem) {
                            setDispatchDriver(selectedItem);
                        }
                        return;
                    }
                    if (value) {
                        setDispatchDriver(value);
                    }
                }}
            />
        )}
    </View>
}

const styles = StyleSheet.create({
    main: {
        flex: 1,
    },
    section: {
        marginTop: 15,
        flex: 1
    },
    selectionBar: {
        borderTopWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    selectionText: {
        fontSize: 14,
        fontWeight: "600"
    },
    selectionActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 10,
        flexWrap: "wrap"
    },
    selectionButton: {
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    selectionButtonText: {
        fontSize: 14,
        fontWeight: "600"
    },
    primaryButton: {
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    primaryButtonText: {
        fontSize: 14,
        fontWeight: "700"
    },
    dangerButton: {
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    dispatchModalHeader: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    dispatchModalTitle: {
        fontSize: 16,
        fontWeight: "700"
    },
    dispatchModalContent: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    dispatchLabel: {
        fontSize: 13,
        fontWeight: "600",
    },
    driverSelectButton: {
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    noteInput: {
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        minHeight: 80,
        textAlignVertical: "top"
    },
    dispatchButtonsRow: {
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        flexWrap: "wrap"
    }
})
