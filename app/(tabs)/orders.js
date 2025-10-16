import { View, StyleSheet, RefreshControl, StatusBar, DeviceEventEmitter, ActivityIndicator, Text, FlatList, TouchableOpacity } from 'react-native';
import Search from '../../components/search/Search';
import OrdersView from '../../components/orders/OrdersView';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useAuth } from "../../RootLayout";
import { useSocket } from '../../utils/socketContext';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';

export default function Orders() {
    const socket = useSocket();
    const { language } = useLanguage();
    const pathname = usePathname();
    const router = useRouter();
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [activeFilter, setActiveFilter] = useState("");
    const [activeSearchBy, setActiveSearchBy] = useState("");
    const [activeDate, setActiveDate] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const params = useLocalSearchParams();
    const { user } = useAuth();
    const { orderIds, reset, multi_id } = params;
    const [refreshing, setRefreshing] = useState(false);
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const isOnOrdersScreen = useRef(true);
    const abortControllerRef = useRef(null);
    const pendingFetchRef = useRef(null);
    const isMountedRef = useRef(true);
    
    // City grouping state
    const [cityGroups, setCityGroups] = useState([]);
    const [cityOrdersMap, setCityOrdersMap] = useState({});
    const [loadingCityOrdersMap, setLoadingCityOrdersMap] = useState({});
    const [cityGroupsLoading, setCityGroupsLoading] = useState(false);
    const [expandedCities, setExpandedCities] = useState({});

    // Extract URL parameters when component mounts
    useEffect(() => {
        // Handle status_key parameter
        if (params.status_key !== undefined) {
            setActiveFilter(params.status_key);
        } else if (params.status_key === undefined && activeFilter !== '') {
            // If status_key was removed from URL, clear the filter
            setActiveFilter('');
        }
        
        // Handle date_range parameter
        if (params.date_range) {
            const dateFilter = searchByDateGroup.find(date => date.action === params.date_range);
            if (dateFilter) {
                setActiveDate(dateFilter);
            }
        } else if (params.date_range === undefined && activeDate) {
            // If date_range was removed from URL, clear the date filter
            setActiveDate('');
        }
    }, [params.status_key, params.date_range, searchByDateGroup, activeFilter, activeDate]);

    // Track if component is mounted
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            // Abort any pending requests when unmounting
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Track if we're on the orders screen
    useEffect(() => {
        isOnOrdersScreen.current = pathname === "/(tabs)/orders";
    }, [pathname]);

    // Reset filters when reset param changes
    useEffect(() => {
        if (reset) {
            setSearchValue("");
            setActiveFilter("");
            setActiveSearchBy("");
            setActiveDate("");
            setSelectedDate("");
            setPage(1);
            fetchData(1, false);
        }
    }, [reset]);

    // Function to reset all filters
    const resetAllFilters = useCallback(() => {
        setSearchValue("");
        setActiveFilter("");
        setActiveSearchBy("");
        setActiveDate("");
        setSelectedDate("");
        setPage(1);
        // Clear all URL params on the same route
        router.setParams({});
        fetchData(1, false, { ignoreOrderIds: true });
    }, [router, fetchData]);

    // Listen for reset event
    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener(
            'resetOrdersFilters',
            resetAllFilters
        );

        return () => {
            subscription.remove();
        };
    }, [resetAllFilters]);

    const onRefresh = useCallback(async () => {
        try {
            setRefreshing(true);
            setPage(1);
            // Clear all filters when refreshing
            setSearchValue("");
            setActiveFilter("");
            setActiveSearchBy("");
            setActiveDate("");
            setSelectedDate("");
            
            // Refresh based on current view mode
            if (activeSearchBy?.action === "group_by_city") {
                await fetchCityGroups();
            } else {
                // Fetch all orders and explicitly ignore any orderIds from params
                await fetchData(1, false, { ignoreOrderIds: true });
            }
        } catch (error) {
            console.error("Refresh error:", error);
        } finally {
            setRefreshing(false);
        }
    }, [fetchData, fetchCityGroups, activeSearchBy]);
    
    // No longer needed - removed toggleCityGrouping and handleCitySelect functions

    // Apply multi_id param if provided (for barcode scanning)
    useEffect(() => {
        if (multi_id) {
            if (multi_id.trim() !== "") {
                // Set the search value to show the scanned code in the input
                setSearchValue(multi_id);
                
                // Clear other filters but keep the multi_id for searching
                setActiveFilter("");
                setActiveSearchBy("");
                setActiveDate("");
                setSelectedDate("");
                setPage(1);
                fetchData(1, false);
            } else {
                // If multi_id is empty, just move the value to regular search
                // without clearing other filters
                setSearchValue(multi_id);
            }
        }
    }, [multi_id]);

    // Memoize filter groups to prevent unnecessary re-renders
    const filterByGroup = useMemo(() => ["driver", "delivery_company"].includes(user.role) ? [{
        name: translations[language].tabs.orders.filters.all,
        action: "",
    }, {
        name: translations[language].tabs.orders.filters.onTheWay,
        action: "on_the_way"
    }, {
        name: translations[language].tabs.orders.filters.driverResponsibilityOrders,
        action: "with_driver"
    },{
        name: translations[language].tabs.orders.filters.rescheduled,
        action: "reschedule"
    }, {
        name: translations[language].tabs.orders.filters.dispatched_to_branch,
        action: "dispatched_to_branch"
    }, {
        name: translations[language].tabs.orders.filters.returnBeforeDeliveredInitiated,
        action: "return_before_delivered_initiated"
    }, {
        name: translations[language].tabs.orders.filters.returnAfterDeliveredInitiated,
        action: "return_after_delivered_initiated"
    }, {
        name: translations[language].tabs.orders.filters.returned,
        action: "returned"
    }, {
        name: translations[language].tabs.orders.filters.delivered,
        action: "delivered,received"
    }] : [{
        name: translations[language].tabs.orders.filters.all,
        action: "",
    }, {
        name: translations[language].tabs.orders.filters.waiting,
        action: "waiting",
    }, {
        name: translations[language].tabs.orders.filters.rejected,
        action: "rejected"
    }, {
        name: translations[language].tabs.orders.filters.inBranch,
        action: "in_branch"
    }, {
        name: translations[language].tabs.orders.filters.stuck,
        action: "stuck"
    },{
        name: translations[language].tabs.orders.filters.rescheduled,
        action: "reschedule"
    }, {
        name: translations[language].tabs.orders.filters.onTheWay,
        action: "on_the_way"
    },{
        name: translations[language].tabs.orders.filters.driverResponsibilityOrders,
        action: "with_driver"
    }, {
        name: translations[language].tabs.orders.filters.returnBeforeDeliveredInitiated,
        action: "return_before_delivered_initiated"
    }, {
        name: translations[language].tabs.orders.filters.returnAfterDeliveredInitiated,
        action: "return_after_delivered_initiated"
    }, {
        name: translations[language].tabs.orders.filters.returned,
        action: "returned"
    }, {
        name: translations[language].tabs.orders.filters.returnedInBranch,
        action: "returned_in_branch"
    }, {
        name: translations[language].tabs.orders.filters.returnedOut,
        action: "returned_out"
    }, {
        name: translations[language].tabs.orders.filters.businessReturnedDelivered,
        action: "business_returned_delivered"
    }, {
        name: translations[language].tabs.orders.filters.delivered,
        action: "delivered,received"
    },{
        name: translations[language].tabs.orders.filters.replacedDeliveredOrders,
        action: "replaced_delivered"
    },{
        name: translations[language].tabs.orders.filters.moneyInBranch,
        action: "money_in_branch"
    }, {
        name: translations[language].tabs.orders.filters.moneyOut,
        action: "money_out"
    }, {
        name: translations[language].tabs.orders.filters.businessPaid,
        action: "business_paid"
    }, {
        name: translations[language].tabs.orders.filters.completed,
        action: "completed"
    }], [language, user.role, translations]);

    const searchByGroup = useMemo(() => [{
        name: translations[language].tabs.orders.filters.orderId,
        action: "order_id"
    }, {
        name: translations[language].tabs.orders.filters.referenceID,
        action: "reference_id"
    }, {
        name: translations[language].tabs.orders.filters.sender,
        action: "sender"
    }, {
        name: translations[language].tabs.orders.filters.receiverName,
        action: "receiver_name"
    }, {
        name: translations[language].tabs.orders.filters.receiverPhone,
        action: "receiver_phone"
    }, {
        name: translations[language].tabs.orders.filters.receiverCity,
        action: "receiver_city"
    }, {
        name: translations[language].tabs.orders.filters.receiverAddress,
        action: "receiver_address"
    }, {
        name: translations[language].tabs.orders.filters.driverName,
        action: "driver"
    }, {
        name: translations[language]?.tabs?.orders?.filters?.groupByCity || "Group By City",
        action: "group_by_city",
        isSpecial: true
    }], [language, translations]);

    const searchByDateGroup = useMemo(() => [{
        name: translations[language].tabs.orders.filters.today,
        action: "today"
    }, {
        name: translations[language].tabs.orders.filters.yesterday,
        action: "yesterday"
    }, {
        name: translations[language].tabs.orders.filters.thisWeek,
        action: "this_week"
    }, {
        name: translations[language].tabs.orders.filters.thisMonth,
        action: "this_month"
    }, {
        name: translations[language].tabs.orders.filters.thisYear,
        action: "this_year"
    }, {
        name: translations[language].tabs.orders.filters.selectDate,
        action: "custom"
    }], [language, translations]);

    const fetchOrdersData = async (queryParams, signal) => {
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders?${queryParams.toString()}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                },
                signal // Support for aborting requests
            });
            return await res.json();
        } catch (err) {
            if (err.name === 'AbortError') {
                // Request was aborted, which is expected behavior
                return null;
            }
            throw err;
        }
    };
    
    // Use ref to track if we're already fetching city groups
    const isFetchingCityGroupsRef = useRef(false);
    
    // Fetch city groups
    const fetchCityGroups = useCallback(async () => {
        // Prevent multiple simultaneous calls
        if (cityGroupsLoading || isFetchingCityGroupsRef.current) {
            return;
        }
        
        // Set loading state and lock
        setCityGroupsLoading(true);
        isFetchingCityGroupsRef.current = true;
        
        try {
            // Cancel any ongoing fetch
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            
            // Create a new abort controller for this request
            abortControllerRef.current = new AbortController();
            
            const queryParams = new URLSearchParams();
            
            // Explicitly set group_by parameter for receiver_city
            queryParams.append('group_by', 'receiver_city');
            
            // Add language code
            queryParams.append('language_code', language);
            
            // Add any active filters
            if (activeFilter) queryParams.append('status_key', activeFilter);
            if (activeDate) queryParams.append("date_range", activeDate.action);
            if (activeDate && activeDate.action === "custom") {
                queryParams.append("start_date", selectedDate);
                queryParams.append("end_date", selectedDate);
            }
                        
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/orders?${queryParams.toString()}`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json",
                    },
                    signal: abortControllerRef.current.signal
                }
            );
            
            // Check if response is ok before trying to parse JSON
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Log the full response for debugging
            const responseText = await response.text();
            
            let result;
            try {
                result = JSON.parse(responseText);
                
                // Check if the data is in the expected format
                if (result && result.data && Array.isArray(result.data)) {
                    setCityGroups(result.data);
                } else if (result && result.data) {
                    // If data exists but is not an array, try to handle it anyway
                    const dataArray = Array.isArray(result.data) ? result.data : [result.data];
                    setCityGroups(dataArray);
                } else {
                    setCityGroups([]);
                }
            } catch (parseError) {
                setCityGroups([]);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                setCityGroups([]);
            }
        } finally {
            setCityGroupsLoading(false);
            isFetchingCityGroupsRef.current = false;
        }
    }, [
        language, 
        activeFilter, 
        activeDate, 
        selectedDate
    ]);
    
    // Fetch orders for a specific city
    const fetchCityOrders = useCallback(async (cityGroup) => {
        if (!cityGroup || !cityGroup.order_ids || cityGroup.order_ids.length === 0) {
            console.error('Invalid city group or missing order IDs:', cityGroup);
            return;
        }
        
        const cityKey = cityGroup.group_value;
        if (!cityKey) {
            console.error('Missing group_value in city group:', cityGroup);
            return;
        }
        
        // Set loading state for this city
        setLoadingCityOrdersMap(prev => ({
            ...prev,
            [cityKey]: true
        }));
        
        try {
            // Create query params with order_id list
            // Limit to 50 orders at a time to prevent URL length issues
            const orderIds = cityGroup.order_ids.slice(0, 50);
            
            const queryParams = new URLSearchParams();
            queryParams.append('order_id', orderIds.join(','));
            queryParams.append('language_code', language);
                        
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/orders?${queryParams.toString()}`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json",
                    }
                }
            );
            
            // Check if response is ok before trying to parse JSON
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result && result.data) {
                setCityOrdersMap(prev => ({
                    ...prev,
                    [cityKey]: result.data
                }));
            } else {
                console.error('Invalid orders data format for city:', cityKey, result);
                // Set empty array for this city to prevent repeated fetch attempts
                setCityOrdersMap(prev => ({
                    ...prev,
                    [cityKey]: []
                }));
            }
        } catch (error) {
            console.error('Error fetching city orders:', error);
            // Set empty array for this city to prevent repeated fetch attempts
            setCityOrdersMap(prev => ({
                ...prev,
                [cityKey]: []
            }));
        } finally {
            setLoadingCityOrdersMap(prev => ({
                ...prev,
                [cityKey]: false
            }));
        }
    }, [language]);


    const fetchData = useCallback(async (pageNumber = 1, isLoadMore = false, options = {}) => {
        const { ignoreOrderIds = false } = options;
        // Cancel any ongoing fetch
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        // Create a new abort controller for this request
        abortControllerRef.current = new AbortController();
        
        if (!isLoadMore) setIsLoading(true);
        
        try {
            const queryParams = new URLSearchParams();
            
            // Clear orderIds and use a clean request if:
            // 1. User explicitly selected a status filter (including "All" which is empty string) AND it's not from a predefined filter with orderIds
            // 2. User is using search or other filtering methods
            const isFilterSelected = (typeof activeFilter === 'string'); // Any string value means filter was selected
            const isUsingSearch = activeSearchBy || (searchValue && searchValue.trim() !== '');
            
            // Use orderIds if:
            // - We have orderIds parameter AND
            // - We're not ignoring orderIds AND
            // - Either no filter is selected OR we have a date filter (like "today") which should work with orderIds
            const shouldUseOrderIds = orderIds && !ignoreOrderIds && (!isFilterSelected || activeDate) && !isUsingSearch;
            
            if (!activeSearchBy && searchValue) queryParams.append('search', searchValue);
            
            // Only include orderIds if no explicit filter is selected (including "All")
            if (shouldUseOrderIds && orderIds) {
                queryParams.append('order_id', orderIds);
            }
            
            if (multi_id && multi_id.trim() !== "") queryParams.append('multi_id', multi_id);
            
            // Include status_key only if activeFilter has a value (not empty string)
            if (typeof activeFilter === 'string' && activeFilter !== '') {
                queryParams.append('status_key', activeFilter);
            }
            
            if (activeSearchBy) queryParams.append(activeSearchBy.action, searchValue);
            if (activeDate) queryParams.append("date_range", activeDate.action);
            if (activeDate && activeDate.action === "custom") queryParams.append("start_date", selectedDate);
            if (activeDate && activeDate.action === "custom") queryParams.append("end_date", selectedDate);
            queryParams.append('page', pageNumber);
            queryParams.append('language_code', language);
                        
            // Store the fetch promise in the ref
            pendingFetchRef.current = fetchOrdersData(queryParams, abortControllerRef.current.signal);
            const newData = await pendingFetchRef.current;
            
            // Only update state if the component is still mounted and the request wasn't aborted
            if (isMountedRef.current && newData) {
                if (isLoadMore) {
                    setData(prevData => ({
                        ...prevData,
                        data: [...prevData.data, ...newData.data],
                    }));
                } else {
                    setData(newData);
                }
                setIsLoading(false);
            }
        } catch (err) {
            // Handle errors silently
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        } finally {
            if (isMountedRef.current) {
                setLoadingMore(false);
            }
        }
    }, [activeDate, activeFilter, activeSearchBy, language, orderIds, multi_id, searchValue, selectedDate]);

    const loadMoreData = useCallback(async () => {
        if (!loadingMore && data.data?.length > 0) {
            // Check if there's more data to load
            if (data?.data?.length >= data.metadata.total_records) {
                return;
            }

            setLoadingMore(true);
            const nextPage = page + 1;
            setPage(nextPage);
            try {
                await fetchData(nextPage, true);
            } catch (error) {
            } finally {
                setLoadingMore(false);
            }
        }
    }, [loadingMore, data, page, fetchData]);

    // Function to handle order status updates locally
    const handleOrderStatusUpdate = useCallback((orderId, statusLabel, statusKey) => {
        try {
            if (!orderId || (statusKey === undefined)) {
                console.warn("Invalid order update data", { orderId, statusLabel, statusKey });
                return;
            }
            
            setData(prevData => {
                try {
                    // If no data yet, don't update anything
                    if (!prevData?.data || !Array.isArray(prevData.data)) return prevData;
                    
                    // Find the order in the current data
                    const orderIndex = prevData.data.findIndex(order => order && order.order_id === orderId);
                    
                    // If order not found, return unchanged data
                    if (orderIndex === -1) return prevData;
                    
                    // Check if the updated status matches the current filter
                    // If there's an active filter and the new status doesn't match, remove the order
                    if (activeFilter && activeFilter !== statusKey) {
                        // Create a new array without the updated order
                        const filteredData = prevData.data.filter(order => order && order.order_id !== orderId);
                        
                        // Return the updated data object with the order remokoved
                        return {
                            ...prevData,
                            data: filteredData,
                            // Update metadata to reflect the removed item
                            metadata: {
                                ...(prevData.metadata || {}),
                                total_records: ((prevData.metadata && prevData.metadata.total_records) || 0) - 1
                            }
                        };
                    }
                    
                    // If no filter or status matches filter, update the order
                    // Create a new array with the updated order
                    const updatedData = [...prevData.data];
                    updatedData[orderIndex] = {
                        ...updatedData[orderIndex],
                        status: statusLabel || statusKey, // Fallback to statusKey if label is missing
                        status_key: statusKey
                    };
                    
                    // Return the updated data object
                    return {
                        ...prevData,
                        data: updatedData
                    };
                } catch (error) {
                    return prevData;
                }
            });
        } catch (error) {
        }
    }, [activeFilter]);

    useEffect(() => {
        if (!socket) return;

        const handleOrderUpdate = (notification) => {
            // Only process updates if we're on the orders screen
            if (!isOnOrdersScreen.current) return;
            
            // Safely access notification data
            const notificationData = notification?.data || {};
            
            switch (notification?.type) {
                case 'ORDER_CREATED':
                    // For new orders, we don't need to refresh the entire list
                    // Only fetch if the current filter would include this order
                    if (!activeFilter || (notificationData.status_key === activeFilter)) {
                        // Instead of refreshing the entire list, we could append the new order
                        // But for simplicity and to ensure proper sorting, we'll fetch
                        fetchData(1, false);
                    }
                    break;
                    
                case 'COLLECTION_CREATED':
                case 'COLLECTION_UPDATED':
                case 'COLLECTION_DELETED':
                    // For collection changes, we need to refresh as they might affect multiple orders
                    fetchData(1, false);
                    break;
                    
                case 'ORDER_UPDATED':
                case 'STATUS_UPDATED':
                    // If we have the order ID and status information in the notification,
                    // update it locally instead of fetching the entire list
                    if (notificationData.order_id) {
                        const orderId = notificationData.order_id;
                        const statusKey = notificationData.status || notificationData.status_key;
                        const statusLabel = notificationData.status_label || notificationData.status;
                        
                        // Only update if we have all the necessary information
                        if (orderId && statusKey) {
                            try {
                                // Check if the order is in our current view
                                const orderExists = data?.data && Array.isArray(data.data) && 
                                    data.data.some(order => order && order.order_id === orderId);
                                
                                // Check if the order should be in our view based on filter
                                const shouldBeInView = !activeFilter || activeFilter === statusKey;
                                
                                if (orderExists) {
                                    // If the order exists in our current view, update it
                                    // Our handleOrderStatusUpdate will take care of removing it if it no longer matches the filter
                                    handleOrderStatusUpdate(orderId, statusLabel, statusKey);
                                } else if (shouldBeInView) {
                                    // If the order isn't in our view but should be (based on filter),
                                    // we need to refresh to include it
                                    // This is a rare case - only happens when another user/device changes an order's status
                                    // to match our current filter
                                    fetchData(1, false);
                                }
                                // If the order isn't in our view and shouldn't be based on filter, do nothing
                            } catch (error) {
                                console.error("Error handling order update:", error);
                            }
                        }
                    }
                    break;
                    
                default:
                    break;
            }
        };

        socket.on('orderUpdate', handleOrderUpdate);
        socket.on('collectionUpdate', handleOrderUpdate);

        return () => {
            socket.off('orderUpdate', handleOrderUpdate);
            socket.off('collectionUpdate', handleOrderUpdate);
        };
    }, [socket, fetchData, handleOrderStatusUpdate, activeFilter, data]);

    // Main data fetching effect
    // Create a ref to track previous filter values
    const prevFiltersRef = useRef({
        searchValue: '',
        activeFilter: '',
        activeDate: '',
        selectedDate: '',
        activeSearchBy: null,
        orderIds: []
    });
    
    useEffect(() => {
        // Skip unnecessary fetches by comparing with previous values
        const shouldFetch = 
            prevFiltersRef.current.searchValue !== searchValue ||
            prevFiltersRef.current.activeFilter !== activeFilter ||
            prevFiltersRef.current.activeDate !== (activeDate?.action || '') ||
            prevFiltersRef.current.orderIds !== orderIds ||
            prevFiltersRef.current.language !== language ||
            prevFiltersRef.current.activeSearchBy !== (activeSearchBy?.action || '');
        
        if (!shouldFetch) {
            return;
        }
        
        setPage(1);
        
        if (activeSearchBy?.action === "group_by_city") {
            // Only fetch if not already loading
            if (!isFetchingCityGroupsRef.current) {
                fetchCityGroups();
            }
        } else {
            fetchData(1, false);
        }
        
        // Update previous values
        prevFiltersRef.current = {
            searchValue,
            activeFilter,
            activeDate: activeDate?.action || '',
            selectedDate,
            activeSearchBy: activeSearchBy?.action || '',
            orderIds,
            language
        };
    }, [searchValue, activeFilter, activeDate, orderIds, language, fetchData, activeSearchBy, fetchCityGroups]);
    
    // Initial load effect - only runs once on component mount
    useEffect(() => {
        // Initial data load
        fetchData(1, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset all filters when re-entering the orders route or when params change
    useEffect(() => {
        if (pathname === "/(tabs)/orders") {
            // Check if we're coming from a different screen or if reset flag is set
            // The reset flag is set by other components when they want to clear filters
            if (params.reset === "true") {
                setSearchValue("");
                setActiveFilter("");
                setActiveSearchBy("");
                setActiveDate("");
                setSelectedDate("");
                setPage(1);
                fetchData(1, false);
            } 
            // If we have status_key param, set it as the active filter
            else if (params.status_key) {
                setActiveFilter(params.status_key);
                // Keep other filters as they are, just update the status filter
                setPage(1);
                // No need to call fetchData here as the dependency array will trigger it
            }
            // If we have date_range param, set it as the active date filter
            else if (params.date_range) {
                // Find the date filter object that matches the date_range param
                const dateFilter = searchByDateGroup.find(date => date.action === params.date_range);
                if (dateFilter) {
                    setActiveDate(dateFilter);
                    setPage(1);
                    // No need to call fetchData here as the dependency array will trigger it
                }
            }
            // If we have orderIds but no reset flag, keep the orderIds filter
            // This allows specific order filtering from other screens
        }
    }, [pathname, params, fetchData, searchByDateGroup]);

    // Handle filter changes from user interaction
    const handleFilterChange = useCallback((filter) => {
        
        // When selecting "All" filter, ensure it's an empty string, not undefined
        const newFilter = filter === undefined ? '' : filter;
        
        // Clear orderIds when filter is manually changed
        setActiveFilter(newFilter);
        
        // When selecting a filter (including "All"), clear orderIds from URL
        router.setParams({ status_key: newFilter });
        
    }, [router]);

    // Handle date filter changes from user interaction
    const handleDateChange = useCallback((date) => {
        
        // Clear orderIds when date filter is manually changed
        setActiveDate(date);
        
        // When changing date filter, clear orderIds from URL
        if (date && date.action) {
            router.setParams({ date_range: date.action });
        } else {
            router.setParams({});
        }
        
    }, [router]);

    // Handle search by changes from user interaction
    const handleSearchByChange = useCallback((searchBy) => {
        // Check if this is the special "group_by_city" action
        if (searchBy && searchBy.action === "group_by_city") {
            
            // Set active search by to group_by_city
            setActiveSearchBy(searchBy);
            
            // Clear search value
            setSearchValue("");
            
            // Clear other filters
            setActiveFilter("");
            setActiveDate("");
            setSelectedDate("");
            
            // The useEffect will handle the data fetching based on activeSearchBy change
            // No need to call fetchCityGroups directly here
            
            // Clear URL parameters on same route
            router.setParams({});
            return;
        }
        
        // Regular search by handling
        setActiveSearchBy(searchBy);
        
        // Clear URL parameters on same route
        router.setParams({});
        
    }, [router]);

    // Handle search value changes from user interaction
    const handleSearchValueChange = useCallback((input) => {        
        // Clear orderIds when search value is manually changed
        setSearchValue(input);
        
        // Only clear URL parameters if typing a search query
        if (input.trim() !== '') {
            // Clear URL parameters on same route
            router.setParams({});
            
        }
    }, [router]);

    // Function to clear all filters and params
    const clearAllFilters = useCallback(() => {
        
        // Clear all state
        setSearchValue("");
        setActiveFilter("");
        setActiveSearchBy("");
        setActiveDate("");
        setSelectedDate("");
        setPage(1);
        
        // Clear all URL params on same route
        router.setParams({});
        
        // Fetch data with no filters
        fetchData(1, false, { ignoreOrderIds: true });
    }, [router, fetchData]);

    // Memoize the refresh control to prevent unnecessary re-renders
    const refreshControl = useMemo(() => (
        <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
        />
    ), [refreshing, onRefresh, colors.primary]);

    // Update search props with our custom handlers
    const searchProps = useMemo(() => ({
        searchValue,
        setSearchValue: handleSearchValueChange, // Replace with our custom handler
        filterByGroup,
        searchByGroup,
        activeFilter,
        setActiveFilter: handleFilterChange, // Replace with our custom handler
        activeSearchBy,
        setActiveSearchBy: handleSearchByChange, // Replace with our custom handler
        searchByDateGroup,
        selectedDate,
        setSelectedDate,
        activeDate,
        setActiveDate: handleDateChange, // Replace with our custom handler
        addPaddingSpace: true,
        onClearFilters: clearAllFilters // Add clear all filters function
    }), [
        searchValue, 
        filterByGroup, 
        searchByGroup, 
        activeFilter, 
        activeSearchBy, 
        searchByDateGroup, 
        selectedDate, 
        activeDate,
        handleFilterChange,
        handleDateChange,
        handleSearchByChange,
        handleSearchValueChange,
        clearAllFilters
    ]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.statusBarBg} />
            
            <Search {...searchProps} searchResultCount={activeSearchBy?.action === "group_by_city" ? null : data?.metadata?.total_records} />
            
            <View style={styles.ordersList}>
                {activeSearchBy?.action === "group_by_city" ? (
                    cityGroupsLoading ? (
                        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : cityGroups && cityGroups.length > 0 ? (
                        // Show city groups - direct implementation without using CityGrouping component
                        <FlatList
                            data={cityGroups}
                            keyExtractor={(item) => item.group_value}
                            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
                            refreshControl={refreshControl}
                            renderItem={({ item: cityGroup }) => {
                                const cityKey = cityGroup.group_value;
                                const isExpanded = expandedCities[cityKey] || false;
                                const isLoading = loadingCityOrdersMap[cityKey] || false;
                                const cityOrders = cityOrdersMap[cityKey] || [];
                                
                                return (
                                    <View style={[styles.cityCard, { backgroundColor: colors.card }]}>
                                        {/* City header */}
                                        <TouchableOpacity 
                                            style={[styles.cityHeader, { borderBottomColor: colors.border }]} 
                                            onPress={() => {
                                                // Toggle expanded state
                                                const newExpandedState = !isExpanded;
                                                setExpandedCities(prev => ({
                                                    ...prev,
                                                    [cityKey]: newExpandedState
                                                }));
                                                
                                                // Load orders if expanding and no orders loaded yet
                                                if (newExpandedState && cityOrders.length === 0 && !isLoading) {
                                                    // Set loading state
                                                    setLoadingCityOrdersMap(prev => ({
                                                        ...prev,
                                                        [cityKey]: true
                                                    }));
                                                    
                                                    // Get order IDs
                                                    const orderIds = cityGroup.order_ids || [];
                                                    if (orderIds.length > 0) {
                                                        // Create query params
                                                        const queryParams = new URLSearchParams();
                                                        queryParams.append('order_id', orderIds.slice(0, 50).join(','));
                                                        queryParams.append('language_code', language);
                                                        
                                                        // Fetch orders
                                                        fetch(
                                                            `${process.env.EXPO_PUBLIC_API_URL}/api/orders?${queryParams.toString()}`,
                                                            {
                                                                method: "GET",
                                                                credentials: "include",
                                                                headers: {
                                                                    'Accept': 'application/json',
                                                                    "Content-Type": "application/json",
                                                                }
                                                            }
                                                        )
                                                        .then(response => {
                                                            if (!response.ok) {
                                                                throw new Error(`HTTP error! status: ${response.status}`);
                                                            }
                                                            return response.json();
                                                        })
                                                        .then(result => {
                                                            if (result && result.data) {
                                                                setCityOrdersMap(prev => ({
                                                                    ...prev,
                                                                    [cityKey]: result.data
                                                                }));
                                                            } else {
                                                                setCityOrdersMap(prev => ({
                                                                    ...prev,
                                                                    [cityKey]: []
                                                                }));
                                                            }
                                                        })
                                                        .catch(error => {
                                                            console.error('Error fetching city orders:', error);
                                                            setCityOrdersMap(prev => ({
                                                                ...prev,
                                                                [cityKey]: []
                                                            }));
                                                        })
                                                        .finally(() => {
                                                            setLoadingCityOrdersMap(prev => ({
                                                                ...prev,
                                                                [cityKey]: false
                                                            }));
                                                        });
                                                    }
                                                }
                                            }}
                                        >
                                            <View style={styles.cityInfo}>
                                                <View style={[styles.cityIconContainer, { backgroundColor: colors.primary + '20' }]}>
                                                    <MaterialCommunityIcons name="city-variant-outline" size={20} color={colors.primary} />
                                                </View>
                                                <View style={styles.cityTextContainer}>
                                                    <Text style={[styles.cityName, { color: colors.text }]}>
                                                        {cityGroup.group_value_label || cityGroup.group_value}
                                                    </Text>
                                                    <Text style={[styles.orderCount, { color: colors.textSecondary }]}>
                                                        {cityGroup.total_orders} {translations[language]?.tabs?.orders?.orderCount || 'Orders'}
                                                    </Text>
                                                </View>
                                            </View>
                                            
                                            <View style={styles.cityAction}>
                                                <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                                                    <Text style={styles.countBadgeText}>{cityGroup.total_orders}</Text>
                                                </View>
                                                <MaterialIcons 
                                                    name={isExpanded ? "expand-less" : "expand-more"} 
                                                    size={24} 
                                                    color={colors.primary} 
                                                />
                                            </View>
                                        </TouchableOpacity>
                                        
                                        {/* Expanded content */}
                                        {isExpanded && (
                                            <View style={styles.expandedContent}>
                                                {isLoading ? (
                                                    <View style={styles.cityLoadingContainer}>
                                                        <ActivityIndicator size="large" color={colors.primary} />
                                                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                                            {translations[language]?.common?.loading || 'Loading orders...'}
                                                        </Text>
                                                    </View>
                                                ) : cityOrders.length > 0 ? (
                                                    <View style={styles.ordersContainer}>
                                                        {cityOrders.map(order => (
                                                            <View key={order.order_id} style={styles.orderItem}>
                                                                <OrdersView
                                                                    data={[order]}
                                                                    metadata={data?.metadata}
                                                                    isLoading={false}
                                                                    onStatusChange={handleOrderStatusUpdate}
                                                                    hideEmptyState={true}
                                                                />
                                                            </View>
                                                        ))}
                                                    </View>
                                                ) : (
                                                    <View style={styles.emptyOrdersContainer}>
                                                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                                                            {translations[language]?.tabs?.orders?.noOrdersInCity || 'No orders available for this city'}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                );
                            }}
                        />
                    ) : (
                        // No city groups found
                        <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
                            <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: 'center' }}>
                                {translations[language]?.tabs?.orders?.emptyArray || 'No city groups available'}
                            </Text>
                        </View>
                    )
                ) : (
                    // Regular orders view
                    <OrdersView
                        data={isLoading ? [] : (data.data || [])}
                        metadata={data.metadata}
                        loadMoreData={loadMoreData}
                        loadingMore={loadingMore}
                        isLoading={isLoading}
                        refreshControl={refreshControl}
                        onStatusChange={handleOrderStatusUpdate}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    ordersList: {
        flex: 1,
        marginTop: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    // City card styles
    cityCard: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    cityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cityIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cityTextContainer: {
        flex: 1,
    },
    cityName: {
        fontSize: 16,
        fontWeight: '700',
    },
    orderCount: {
        fontSize: 13,
        marginTop: 2,
    },
    cityAction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    countBadge: {
        minWidth: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        paddingHorizontal: 8,
    },
    countBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    expandedContent: {
        width: '100%',
    },
    cityLoadingContainer: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    ordersContainer: {
        padding: 8,
    },
    orderItem: {
        marginBottom: 8,
    },
    emptyOrdersContainer: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
});