import { View, StyleSheet, RefreshControl, StatusBar, DeviceEventEmitter, ActivityIndicator, Text, FlatList, TouchableOpacity, Platform } from 'react-native';
import Search from '../../components/search/Search';
import OrdersView from '../../components/orders/OrdersView';
import BatchActionsBar from '../../components/orders/BatchActionsBar';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useLanguage, translations } from '../../utils/languageContext';
import { useAuth } from "../../RootLayout";
import { useSocket } from '../../utils/socketContext';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import axios from 'axios';

export default function Orders() {
    const socket = useSocket();
    const { language } = useLanguage();
    const isRTL = language === 'ar' || language === 'he';
    const pathname = usePathname();
    const router = useRouter();
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const ORDERS_LIMIT = 50; // STRICT LIMIT - only 50 orders per page
    const GROUP_ORDERS_LIMIT = 100;
    const [loadingMore, setLoadingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [activeFilter, setActiveFilter] = useState("");
    const [activeSearchBy, setActiveSearchBy] = useState("");
    const [activeDate, setActiveDate] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const params = useLocalSearchParams();
    const { user } = useAuth();
    const { orderIds, reset, multi_id, active_orders, completed_orders } = params;
    const [activeSenderId, setActiveSenderId] = useState("");
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

    // Selection state
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);

    // Grouping state
    const [activeGroupBy, setActiveGroupBy] = useState([]);
    const [groupSummary, setGroupSummary] = useState([]);
    const [groupSummaryLoading, setGroupSummaryLoading] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [groupDataCache, setGroupDataCache] = useState({});
    const [groupPagination, setGroupPagination] = useState({});
    const [groupLoadingMap, setGroupLoadingMap] = useState({});
    const groupSummaryAbortControllersRef = useRef(new Map());
    const groupSearchDebounceRef = useRef(null);
    const isFetchingGroupSummaryRef = useRef(false);

    const statusKeyMatchesFilter = useCallback((filterKey, statusKey) => {
        if (!filterKey) return true;
        if (filterKey === 'returned_out') {
            return statusKey === 'returned_out' || statusKey === 'received_order_out' || statusKey === 'replaced_order_out';
        }
        return filterKey === statusKey;
    }, []);

    const buildGroupId = useCallback((groupField, groupValue, depth, parentContext = []) => {
        const parentPath = parentContext.map(p => `${p.group_field}:${p.group_value}`).join('|');
        return parentPath ? `${parentPath}|${groupField}-${String(groupValue || 'Unassigned')}-${depth}` : `${groupField}-${String(groupValue || 'Unassigned')}-${depth}`;
    }, []);

    const handleLongPressOrder = useCallback((orderId) => {
        // Only for allowed roles (NOT business, driver, delivery_company)
        if (!['business', 'driver', 'delivery_company'].includes(user.role)) {
            setIsSelectionMode(true);
            setSelectedOrderIds([orderId]);
            return true;
        }
        return false;
    }, [user.role]);

    const handleSelectOrder = useCallback((orderId) => {
        setSelectedOrderIds(prev => {
            if (prev.includes(orderId)) {
                const newIds = prev.filter(id => id !== orderId);
                if (newIds.length === 0) setIsSelectionMode(false);
                return newIds;
            } else {
                return [...prev, orderId];
            }
        });
    }, []);

    const handleCancelSelection = useCallback(() => {
        setIsSelectionMode(false);
        setSelectedOrderIds([]);
    }, []);

    const [isSelectionClickGuard, setSelectionClickGuard] = useState(false);

    const handleExplicitSelect = useCallback((orderId, shouldSelect) => {
        setSelectionClickGuard(true);
        setTimeout(() => setSelectionClickGuard(false), 300);
        setIsSelectionMode(true);
        setSelectedOrderIds(prev => {
            const exists = prev.includes(orderId);
            if (shouldSelect) {
                return exists ? prev : [...prev, orderId];
            } else {
                return exists ? prev.filter(id => id !== orderId) : prev;
            }
        });
    }, []);

    const collectExpandedGroupOrderIds = useCallback(() => {
        if (!Array.isArray(groupSummary) || groupSummary.length === 0) {
            return [];
        }
        const collected = new Set();

        const collect = (groupItem, depth, parentContext) => {
            const id = buildGroupId(groupItem.group_field, groupItem.group_value, depth, parentContext);
            const isExpanded = expandedGroups.has(id);

            if (!isExpanded) {
                return;
            }

            const hasNested = groupItem.has_nested_groups || (Array.isArray(groupItem.next_group_fields) && groupItem.next_group_fields.length > 0);

            if (hasNested) {
                const children = groupDataCache[id] || [];
                children.forEach(child => {
                    collect(
                        child,
                        depth + 2,
                        [...parentContext, { group_field: groupItem.group_field, group_value: groupItem.group_value }]
                    );
                });
            } else {
                if (Array.isArray(groupItem.order_ids)) {
                    groupItem.order_ids.forEach(id => collected.add(id));
                }
            }
        };

        groupSummary.forEach(groupItem => collect(groupItem, 0, []));
        return Array.from(collected);
    }, [groupSummary, expandedGroups, groupDataCache, buildGroupId]);

    const isFinancialChecked = useCallback((value) => {
        if (value === true) return true;
        if (value === 1) return true;
        if (value === false) return false;
        if (value === 0) return false;
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') {
            const v = value.trim().toLowerCase();
            if (!v) return false;
            if (v === 'false' || v === '0' || v === 'no' || v === 'unchecked') return false;
            return true;
        }
        return Boolean(value);
    }, []);

    const knownOrdersById = useMemo(() => {
        const map = new Map();
        const addOrder = (order) => {
            const id = order?.order_id;
            if (id === undefined || id === null) return;
            if (map.has(id)) return;
            map.set(id, order);
        };

        if (Array.isArray(data?.data)) {
            data.data.forEach(addOrder);
        }

        if (groupDataCache && typeof groupDataCache === 'object') {
            Object.values(groupDataCache).forEach((items) => {
                if (!Array.isArray(items) || items.length === 0) return;
                if (items[0]?.group_field) return;
                items.forEach(addOrder);
            });
        }

        if (cityOrdersMap && typeof cityOrdersMap === 'object') {
            Object.values(cityOrdersMap).forEach((items) => {
                if (!Array.isArray(items) || items.length === 0) return;
                items.forEach(addOrder);
            });
        }

        return map;
    }, [data, groupDataCache, cityOrdersMap]);

    const handleSelectAll = useCallback(() => {
        // 1. Generic Grouping (activeGroupBy)
        if (activeGroupBy && activeGroupBy.length > 0) {
            const ids = collectExpandedGroupOrderIds();
            setSelectedOrderIds(ids);
            return;
        }

        // 2. Special "Group By City" Mode
        if (activeSearchBy?.action === "group_by_city") {
            const ids = [];
            if (Array.isArray(cityGroups)) {
                cityGroups.forEach(cityGroup => {
                    const cityKey = cityGroup.group_value;
                    if (expandedCities[cityKey]) {
                        if (Array.isArray(cityGroup.order_ids)) {
                            ids.push(...cityGroup.order_ids);
                        }
                    }
                });
            }
            setSelectedOrderIds([...new Set(ids)]);
            return;
        }

        // 3. Fallback: Flat List (No Grouping)
        if (data && data.data && Array.isArray(data.data)) {
            const allIds = data.data.map(order => order.order_id);
            setSelectedOrderIds(allIds);
        }
    }, [activeGroupBy, collectExpandedGroupOrderIds, activeSearchBy, expandedCities, cityGroups, data]);

    const fetchOrdersByIdsInChunks = useCallback(async (orderIds) => {
        const chunkSize = 100;
        const fetchedOrders = [];
        for (let i = 0; i < orderIds.length; i += chunkSize) {
            const chunk = orderIds.slice(i, i + chunkSize);
            const res = await fetchOrdersByIds(chunk, { limit: chunk.length, page: 1 });
            if (res && res.status === 'success' && Array.isArray(res.data)) {
                fetchedOrders.push(...res.data);
            }
        }
        return fetchedOrders;
    }, [fetchOrdersByIds]);

    const handleSelectAllUnpaid = useCallback(async () => {
        let candidateIds = [];

        if (activeGroupBy && activeGroupBy.length > 0) {
            candidateIds = collectExpandedGroupOrderIds();
        } else if (activeSearchBy?.action === "group_by_city") {
            const ids = [];
            if (Array.isArray(cityGroups)) {
                cityGroups.forEach(cityGroup => {
                    const cityKey = cityGroup.group_value;
                    if (expandedCities[cityKey]) {
                        if (Array.isArray(cityGroup.order_ids)) {
                            ids.push(...cityGroup.order_ids);
                        }
                    }
                });
            }
            candidateIds = ids;
        } else if (data && data.data && Array.isArray(data.data)) {
            candidateIds = data.data.map(order => order.order_id);
        }

        const uniqueCandidateIds = Array.from(new Set(candidateIds)).filter(id => id !== undefined && id !== null);
        if (uniqueCandidateIds.length === 0) {
            return;
        }

        const unpaidIds = new Set();
        const unknownIds = [];

        uniqueCandidateIds.forEach((id) => {
            const order = knownOrdersById.get(id);
            if (order) {
                if (!isFinancialChecked(order.financial_status)) unpaidIds.add(id);
            } else {
                unknownIds.push(id);
            }
        });

        if (unknownIds.length > 0) {
            try {
                const fetched = await fetchOrdersByIdsInChunks(unknownIds);
                fetched.forEach((order) => {
                    if (!order?.order_id) return;
                    if (!isFinancialChecked(order.financial_status)) unpaidIds.add(order.order_id);
                });
            } catch (e) {
            }
        }

        if (unpaidIds.size === 0) {
            Alert.alert(
                translations[language]?.common?.info || "Info",
                translations[language]?.common?.noUnpaidOrders || "No unpaid orders found"
            );
            return;
        }

        setSelectedOrderIds(Array.from(unpaidIds));
    }, [
        activeGroupBy,
        collectExpandedGroupOrderIds,
        activeSearchBy,
        cityGroups,
        expandedCities,
        data,
        knownOrdersById,
        isFinancialChecked,
        fetchOrdersByIdsInChunks,
        language
    ]);

    const handleActionComplete = useCallback(() => {
        handleCancelSelection();
        fetchData(1, false); // Refresh data
    }, [fetchData, handleCancelSelection]);



    // Extract URL parameters when component mounts
    useEffect(() => {
        const isCompletedOrdersParam = completed_orders === 'true' || completed_orders === true;

        if (isCompletedOrdersParam) {
            if (activeFilter !== 'completed') {
                setActiveFilter('completed');
            }
            return;
        }

        if (params.status_key !== undefined) {
            const normalizedStatusKey = Array.isArray(params.status_key) ? params.status_key[0] : params.status_key;
            setActiveFilter(normalizedStatusKey);
        } else if (params.status_key === undefined && activeFilter !== '') {
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
        const incomingSenderId = params.sender_id || params.senderId;
        const normalizedSenderId = Array.isArray(incomingSenderId) ? incomingSenderId[0] : incomingSenderId;
        if (normalizedSenderId !== undefined) {
            setActiveSenderId(String(normalizedSenderId || ""));
        } else if (normalizedSenderId === undefined && activeSenderId) {
            setActiveSenderId("");
        }
    }, [params.status_key, params.date_range, params.sender_id, params.senderId, completed_orders, searchByDateGroup, activeFilter, activeDate, activeSenderId]);

    // Track if component is mounted
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            // Abort any pending requests when unmounting
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (groupSearchDebounceRef.current) {
                clearTimeout(groupSearchDebounceRef.current);
                groupSearchDebounceRef.current = null;
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
            setActiveSenderId("");
            setPage(1);
            fetchData(1, false);
        }
    }, [reset]);

    // Function to reset all filters
    const resetAllFilters = useCallback(() => {
        // PREVENT calling this before initial fetch completes
        if (!hasCompletedInitialFetch.current) {
            return;
        }

        setSearchValue("");
        setActiveFilter("");
        setActiveSearchBy("");
        setActiveDate("");
        setSelectedDate("");
        setActiveSenderId("");
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
        // DON'T clear filters on refresh - just refetch with current filters
        // Clearing filters triggers the main effect which causes double fetch
        try {
            setRefreshing(true);
            setPage(1);

            // Determine if any filters/search are active
            const hasAnyFilter = (
                (typeof activeFilter === 'string' && activeFilter !== '') ||
                !!activeSearchBy ||
                (!!searchValue && searchValue.trim() !== '') ||
                !!activeDate
            );

            // Refresh based on current view mode
            if (activeGroupBy && activeGroupBy.length > 0) {
                await fetchTopGroups();
            } else if (activeSearchBy?.action === "group_by_city") {
                await fetchCityGroups();
            } else {
                // Refetch; when filters are active, ignore orderIds to preserve current filters
                await fetchData(1, false, hasAnyFilter ? { ignoreOrderIds: true } : {});
            }
        } catch (error) {
            console.error("❌ [onRefresh] Error:", error);
        } finally {
            setRefreshing(false);
        }
    }, [fetchData, fetchCityGroups, activeSearchBy, activeFilter, searchValue, activeDate]);

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
        name: translations[language].tabs.orders.filters.dispatchedToBranch,
        action: "dispatched_to_branch"
    }, {
        name: translations[language].tabs.orders.filters.driverResponsibilityOrders,
        action: "with_driver"
    }, {
        name: translations[language].tabs.orders.filters.receivedFromBusiness,
        action: "received_from_business"
    }, {
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
    }, {
        name: translations[language].tabs.orders.filters.rescheduled,
        action: "reschedule"
    }, {
        name: translations[language].tabs.orders.filters.onTheWay,
        action: "on_the_way"
    }, {
        name: translations[language].tabs.orders.filters.dispatchedToBranch,
        action: "dispatched_to_branch"
    }, {
        name: translations[language].tabs.orders.filters.driverResponsibilityOrders,
        action: "with_driver"
    }, {
        name: user.role === "business" ? translations[language].tabs.orders.filters.receivedFromMe : translations[language].tabs.orders.filters.receivedFromBusiness,
        action: "received_from_business"
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
        action: "returned_in_branch,returned_received_in_branch"
    }, {
        name: translations[language].tabs.orders.filters.returnedOut,
        action: "returned_out"
    }, {
        name: translations[language].tabs.orders.filters.businessReturnedDelivered,
        action: "business_returned_delivered"
    }, {
        name: translations[language].tabs.orders.filters.delivered,
        action: "delivered,received"
    }, {
        name: translations[language].tabs.orders.filters.moneyInBranch,
        action: "money_in_branch"
    }, ...(user.role === "business" ? [] : [{
        name: translations[language].tabs.orders.filters.moneyInProcess,
        action: "money_in_process"
    }]), {
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

    const groupByOptions = useMemo(() => {
        if (["business", "driver", "delivery_company"].includes(user?.role)) return [];

        const options = [
            { name: translations[language]?.tabs?.orders?.filters?.status, action: 'status' },
            { name: translations[language]?.tabs?.orders?.filters?.orderType, action: 'order_type' },
            { name: translations[language]?.tabs?.orders?.filters?.sender, action: 'sender' },
            { name: translations[language]?.tabs?.orders?.filters?.sender_city, action: 'sender_city' },
            { name: translations[language]?.tabs?.orders?.filters?.driver, action: 'driver' },
            { name: translations[language]?.tabs?.orders?.filters?.previous_driver, action: 'previous_driver' },
            { name: translations[language]?.tabs?.orders?.filters?.created_by, action: 'created_by' },
            { name: translations[language]?.tabs?.orders?.filters?.receiver_name, action: 'receiver_name' },
            { name: translations[language]?.tabs?.orders?.filters?.receiver_city, action: 'receiver_city' },
            { name: translations[language]?.tabs?.orders?.filters?.receiver_address, action: 'receiver_address' },
            { name: translations[language]?.tabs?.orders?.filters?.current_branch, action: 'current_branch' },
            { name: translations[language]?.tabs?.orders?.filters?.to_branch, action: 'to_branch' },
            { name: translations[language]?.tabs?.orders?.filters?.last_status_updated_by, action: 'last_status_updated_by' },
            { name: translations[language]?.tabs?.orders?.filters?.last_status_updated_at_day, action: 'last_status_updated_at_day' },
            { name: translations[language]?.tabs?.orders?.filters?.last_status_updated_at_week, action: 'last_status_updated_at_week' },
            { name: translations[language]?.tabs?.orders?.filters?.last_status_updated_at_month, action: 'last_status_updated_at_month' },
            { name: translations[language]?.tabs?.orders?.filters?.last_status_updated_at_quarter, action: 'last_status_updated_at_quarter' },
            { name: translations[language]?.tabs?.orders?.filters?.last_status_updated_at_year, action: 'last_status_updated_at_year' },
            { name: translations[language]?.tabs?.orders?.filters?.delivered_at_day, action: 'delivered_at_day' },
            { name: translations[language]?.tabs?.orders?.filters?.delivered_at_week, action: 'delivered_at_week' },
            { name: translations[language]?.tabs?.orders?.filters?.delivered_at_month, action: 'delivered_at_month' },
            { name: translations[language]?.tabs?.orders?.filters?.delivered_at_quarter, action: 'delivered_at_quarter' },
            { name: translations[language]?.tabs?.orders?.filters?.delivered_at_year, action: 'delivered_at_year' },
            { name: translations[language]?.tabs?.orders?.filters?.created_at_day, action: 'created_at_day' },
            { name: translations[language]?.tabs?.orders?.filters?.created_at_week, action: 'created_at_week' },
            { name: translations[language]?.tabs?.orders?.filters?.created_at_month, action: 'created_at_month' },
            { name: translations[language]?.tabs?.orders?.filters?.created_at_quarter, action: 'created_at_quarter' },
            { name: translations[language]?.tabs?.orders?.filters?.created_at_year, action: 'created_at_year' }
        ];

        return options.filter((item) => item.action);
    }, [language, user.role, translations]);
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
        const url = `${process.env.EXPO_PUBLIC_API_URL}/api/orders`;
        const params = Object.fromEntries(queryParams);

        try {

            // Use Axios for better performance
            const response = await axios.get(url, {
                params: params,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                withCredentials: true, // Same as credentials: "include"
                signal, // AbortController support
                timeout: 30000, // 30 second timeout
            });

            const data = response.data;


            return data;
        } catch (err) {
            if (axios.isCancel(err)) {
                return null;
            }
            console.error('❌ [AXIOS] Error:', err.message);
            if (err.response) {
                console.error('   Response status:', err.response.status);
                console.error('   Response data:', err.response.data);
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

            // Build filters object
            const filters = {};

            // Add search parameter if available
            if (searchValue && searchValue.trim() !== '') {
                filters.search = searchValue;
            }

            // Add any active filters
            if (activeFilter === 'completed') {
                filters.completed_orders = true;
            } else if (activeFilter === 'returned_out') {
                filters.returned_out_orders = true;
            } else if (activeFilter) {
                filters.status_key = activeFilter;
            }
            if (activeDate) {
                const pad2 = (n) => String(n).padStart(2, '0');
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = `${yesterday.getFullYear()}-${pad2(yesterday.getMonth() + 1)}-${pad2(yesterday.getDate())}`;
                const getWeekString = (date) => {
                    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                    const dayNum = d.getUTCDay() || 7;
                    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
                    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
                    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
                };
                const monthStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
                const yearStr = String(now.getFullYear());

                switch (activeDate.action) {
                    case 'today':
                        filters.created_at_day = todayStr;
                        break;
                    case 'yesterday':
                        filters.created_at_day = yesterdayStr;
                        break;
                    case 'this_week':
                        filters.created_at_week = getWeekString(now);
                        break;
                    case 'this_month':
                        filters.created_at_month = monthStr;
                        break;
                    case 'this_year':
                        filters.created_at_year = yearStr;
                        break;
                    case 'custom':
                        if (selectedDate) {
                            filters.created_at_day = selectedDate;
                        }
                        break;
                    default:
                        break;
                }
            }

            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/api/orders/grouped-summary`,
                {
                    groupBy: 'receiver_city',
                    language_code: language,
                    filters: filters
                },
                {
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                    signal: abortControllerRef.current.signal
                }
            );

            const result = response.data;

            // Check if the data is in the expected format
            if (result && result.data && Array.isArray(result.data)) {
                setCityGroups(result.data);
            } else {
                console.error('❌ [orders.js] fetchCityGroups - Invalid response format:', result);
                setCityGroups([]);
            }
        } catch (error) {
            if (axios.isCancel(error)) {
            } else {
                console.error('❌ [orders.js] fetchCityGroups - Error:', error.message);
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
        selectedDate,
        searchValue
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
            // Limit to 100 orders at a time (backend limit)
            const orderIds = cityGroup.order_ids.slice(0, 100);

            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/api/orders/fetch-by-ids`,
                {
                    orderIds: orderIds,
                    language_code: language,
                    includeDetails: true
                },
                {
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json",
                    },
                    withCredentials: true
                }
            );

            const result = response.data;

            if (result && result.data && Array.isArray(result.data)) {
                setCityOrdersMap(prev => ({
                    ...prev,
                    [cityKey]: result.data
                }));
            } else {
                console.error('❌ [orders.js] fetchCityOrders - Invalid orders data format for city:', cityKey, result);
                // Set empty array for this city to prevent repeated fetch attempts
                setCityOrdersMap(prev => ({
                    ...prev,
                    [cityKey]: []
                }));
            }
        } catch (error) {
            console.error('❌ [orders.js] fetchCityOrders - Error:', error.message);
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

        // Only show loading on initial load or when not loading more
        if (!isLoadMore && pageNumber === 1) {
            setIsLoading(true);
        }

        try {
            const queryParams = new URLSearchParams();

            const isFilterSelected = (typeof activeFilter === 'string' && activeFilter !== '');
            const isUsingSearch = activeSearchBy || (searchValue && searchValue.trim() !== '');
            const isUsingDate = !!activeDate;
            const shouldUseOrderIds = orderIds && !ignoreOrderIds && !isFilterSelected && !isUsingSearch && !isUsingDate;

            if (activeSenderId && String(activeSenderId).trim() !== "") {
                queryParams.append('sender_id', String(activeSenderId));
            }

            // Add search if present
            if (!activeSearchBy && searchValue) {
                queryParams.append('search', searchValue);
            }

            // Only include orderIds if conditions are met
            if (shouldUseOrderIds && orderIds) {
                queryParams.append('order_id', orderIds);
            }

            if (multi_id && multi_id.trim() !== "") {
                queryParams.append('multi_id', multi_id);
            }

            if (typeof activeFilter === 'string' && activeFilter !== '') {
                if (activeFilter === 'completed') {
                    queryParams.append('completed_orders', 'true');
                } else if (activeFilter === 'returned_out') {
                    queryParams.append('returned_out_orders', 'true');
                } else if (activeFilter === 'on_the_way') {
                    queryParams.append('on_the_way_orders', 'true');
                } else if (activeFilter === 'dispatched_to_branch') {
                    queryParams.append('dispatched_to_branch_orders', 'true');
                } else if (activeFilter === 'returned_in_branch') {
                    queryParams.append('returned_in_branch_orders', 'true');
                } else if (activeFilter === 'stuck_in_branch') {
                    queryParams.append('stuck_in_branch_orders', 'true');
                } else if (activeFilter === 'rejected_in_branch') {
                    queryParams.append('rejected_in_branch_orders', 'true');
                } else if (activeFilter === 'reschedule_in_branch') {
                    queryParams.append('reschedule_in_branch_orders', 'true');
                } else if (activeFilter === 'received_order_in_branch') {
                    queryParams.append('received_order_in_branch_orders', 'true');
                } else if (activeFilter === 'replaced_order_in_branch') {
                    queryParams.append('replaced_order_in_branch_orders', 'true');
                } else {
                    queryParams.append('status_key', activeFilter);
                }
            }

            if (activeSearchBy) {
                queryParams.append(activeSearchBy.action, searchValue);
            }

            if (activeDate) {
                const pad2 = (n) => String(n).padStart(2, '0');
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = `${yesterday.getFullYear()}-${pad2(yesterday.getMonth() + 1)}-${pad2(yesterday.getDate())}`;
                const getWeekString = (date) => {
                    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                    const dayNum = d.getUTCDay() || 7;
                    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
                    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
                    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
                };
                const monthStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
                const yearStr = String(now.getFullYear());

                switch (activeDate.action) {
                    case 'today':
                        queryParams.append('created_at_day', todayStr);
                        break;
                    case 'yesterday':
                        queryParams.append('created_at_day', yesterdayStr);
                        break;
                    case 'this_week':
                        queryParams.append('created_at_week', getWeekString(now));
                        break;
                    case 'this_month':
                        queryParams.append('created_at_month', monthStr);
                        break;
                    case 'this_year':
                        queryParams.append('created_at_year', yearStr);
                        break;
                    case 'custom':
                        if (selectedDate) {
                            queryParams.append('created_at_day', selectedDate);
                        }
                        break;
                    default:
                        break;
                }
            }

            queryParams.append('page', String(pageNumber));
            queryParams.append('limit', String(ORDERS_LIMIT));
            queryParams.append('language_code', language);

            // Add active_orders filter if present
            if (active_orders) {
                queryParams.append('active_orders', active_orders);
            }

            const finalLimit = queryParams.get('limit');
            if (!finalLimit || finalLimit === 'undefined' || finalLimit === 'null') {
                queryParams.set('limit', String(ORDERS_LIMIT));
            }

            // Store the fetch promise in the ref
            pendingFetchRef.current = fetchOrdersData(queryParams, abortControllerRef.current.signal);
            const newData = await pendingFetchRef.current;

            if (isMountedRef.current && newData) {

                if (isLoadMore) {
                    setData(prevData => {
                        const newTotal = prevData.data.length + newData.data.length;
                        return {
                            ...prevData,
                            data: [...prevData.data, ...newData.data],
                            metadata: newData.metadata
                        };
                    });
                } else {
                    setData(newData);

                    // Mark initial fetch as completed
                    if (!hasCompletedInitialFetch.current) {
                        hasCompletedInitialFetch.current = true;
                    }
                }
                setIsLoading(false);
            }
        } catch (err) {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        } finally {
            if (isMountedRef.current) {
                setLoadingMore(false);
            }
        }
    }, [activeDate, activeFilter, activeSearchBy, language, orderIds, multi_id, searchValue, selectedDate, active_orders, activeSenderId]);

    const loadMoreData = useCallback(async () => {
        // Prevent multiple simultaneous loads
        if (loadingMore) return;

        // Check if we have data
        if (!data?.data || data.data.length === 0) return;

        // Check if there's more data to load based on metadata
        const totalRecords = data?.metadata?.total_records || 0;
        const currentCount = data.data.length;

        if (currentCount >= totalRecords) {
            return; // All data loaded
        }

        setLoadingMore(true);
        const nextPage = page + 1;
        setPage(nextPage);

        try {
            await fetchData(nextPage, true);
        } catch (error) {
            console.error('Error loading more data:', error);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, data, page, fetchData]);

    const buildFilters = useCallback(() => {
        const filters = {};
        if (activeSenderId && String(activeSenderId).trim() !== "") {
            filters.sender_id = String(activeSenderId);
        }
        if (searchValue && searchValue.trim() !== '') {
            if (activeSearchBy && activeSearchBy.action) {
                const mapping = {
                    receiver_phone: 'receiver_mobile'
                };
                const key = mapping[activeSearchBy.action] || activeSearchBy.action;
                filters[key] = searchValue;
            } else {
                // Generic search across all fields when no specific searchBy is selected
                filters.search = searchValue;
            }
        }
        if (typeof activeFilter === 'string' && activeFilter !== '') {
            if (activeFilter === 'completed') {
                filters.completed_orders = true;
            } else if (activeFilter === 'returned_out') {
                filters.returned_out_orders = true;
            } else if (activeFilter === 'on_the_way') {
                filters.on_the_way_orders = true;
            } else if (activeFilter === 'dispatched_to_branch') {
                filters.dispatched_to_branch_orders = true;
            } else if (activeFilter === 'returned_in_branch') {
                filters.returned_in_branch_orders = true;
            } else if (activeFilter === 'stuck_in_branch') {
                filters.stuck_in_branch_orders = true;
            } else if (activeFilter === 'rejected_in_branch') {
                filters.rejected_in_branch_orders = true;
            } else if (activeFilter === 'reschedule_in_branch') {
                filters.reschedule_in_branch_orders = true;
            } else if (activeFilter === 'received_order_in_branch') {
                filters.received_order_in_branch_orders = true;
            } else if (activeFilter === 'replaced_order_in_branch') {
                filters.replaced_order_in_branch_orders = true;
            } else {
                filters.status_key = activeFilter;
            }
        }
        if (activeDate) {
            const pad2 = (n) => String(n).padStart(2, '0');
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = `${yesterday.getFullYear()}-${pad2(yesterday.getMonth() + 1)}-${pad2(yesterday.getDate())}`;
            const getWeekString = (date) => {
                const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                const dayNum = d.getUTCDay() || 7;
                d.setUTCDate(d.getUTCDate() + 4 - dayNum);
                const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
                return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
            };
            const monthStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
            const yearStr = String(now.getFullYear());
            switch (activeDate.action) {
                case 'today':
                    filters.created_at_day = todayStr;
                    break;
                case 'yesterday':
                    filters.created_at_day = yesterdayStr;
                    break;
                case 'this_week':
                    filters.created_at_week = getWeekString(now);
                    break;
                case 'this_month':
                    filters.created_at_month = monthStr;
                    break;
                case 'this_year':
                    filters.created_at_year = yearStr;
                    break;
                case 'custom':
                    if (selectedDate) {
                        filters.created_at_day = selectedDate;
                    }
                    break;
                default:
                    break;
            }
        }
        if (multi_id && multi_id.trim() !== "") {
            filters.multi_id = multi_id;
        }
        if (active_orders) {
            filters.active_orders = active_orders;
        }
        return filters;
    }, [activeSearchBy, searchValue, activeFilter, activeDate, selectedDate, active_orders, activeSenderId]);

    const fetchGroupedSummary = useCallback(async (filters, groupByFields) => {
        isFetchingGroupSummaryRef.current = true;
        const controller = new AbortController();
        const key = `summary-${JSON.stringify(filters)}-${Array.isArray(groupByFields) ? groupByFields.join(',') : groupByFields}`;
        groupSummaryAbortControllersRef.current.set(key, controller);
        try {
            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/api/orders/grouped-summary`,
                {
                    filters,
                    groupBy: Array.isArray(groupByFields) ? groupByFields.join(',') : groupByFields,
                    language_code: language
                },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true,
                    signal: controller.signal
                }
            );
            const result = response.data;
            return result;
        } catch (error) {
            if (axios.isCancel(error)) {
                return null;
            }
            throw error;
        } finally {
            isFetchingGroupSummaryRef.current = false;
            groupSummaryAbortControllersRef.current.delete(key);
        }
    }, [language]);

    const cancelAllGroupSummaryRequests = useCallback(() => {
        try {
            const controllers = groupSummaryAbortControllersRef.current;
            controllers.forEach((c) => {
                try { c.abort(); } catch (e) { }
            });
            controllers.clear();
        } catch (e) { }
    }, []);

    const fetchNestedGroup = useCallback(async (nextGroupFields, parentOrderIds, userFilters = {}) => {
        const controller = new AbortController();
        const key = `nested-${JSON.stringify(userFilters)}-${Array.isArray(nextGroupFields) ? nextGroupFields.join(',') : nextGroupFields}-${(parentOrderIds || []).join(',')}`;
        groupSummaryAbortControllersRef.current.set(key, controller);
        try {
            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/api/orders/grouped-summary`,
                {
                    filters: userFilters,
                    groupBy: Array.isArray(nextGroupFields) ? nextGroupFields.join(',') : nextGroupFields,
                    language_code: language,
                    parent_order_ids: parentOrderIds
                },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true,
                    signal: controller.signal
                }
            );
            const result = response.data;
            return result;
        } catch (error) {
            if (axios.isCancel(error)) {
                return null;
            }
            throw error;
        } finally {
            groupSummaryAbortControllersRef.current.delete(key);
        }
    }, [language]);

    const fetchOrdersByIds = useCallback(async (orderIds, options = {}) => {
        const controller = new AbortController();
        const key = `ids-${(orderIds || []).slice(0, 100).join(',')}`;
        groupSummaryAbortControllersRef.current.set(key, controller);
        try {
            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/api/orders/fetch-by-ids`,
                {
                    orderIds: orderIds,
                    language_code: language,
                    includeDetails: true,
                    page: options.page || 1,
                    limit: options.limit || 100
                },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true,
                    signal: controller.signal
                }
            );
            const result = response.data;
            return result;
        } catch (error) {
            if (axios.isCancel(error)) {
                return null;
            }
            throw error;
        } finally {
            groupSummaryAbortControllersRef.current.delete(key);
        }
    }, [language]);


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
                    if (activeFilter && !statusKeyMatchesFilter(activeFilter, statusKey)) {
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
                                const shouldBeInView = !activeFilter || statusKeyMatchesFilter(activeFilter, statusKey);

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
    // Create a ref to track previous filter values and initial mount
    const prevFiltersRef = useRef({
        searchValue: '',
        activeFilter: '',
        activeDate: '',
        selectedDate: '',
        activeSearchBy: null,
        orderIds: [],
        activeSenderId: ''
    });
    const isInitialMount = useRef(true);
    const hasCompletedInitialFetch = useRef(false); // Track if first fetch completed

    useEffect(() => {
        // On initial mount, always fetch
        if (isInitialMount.current) {
            isInitialMount.current = false;
            setPage(1);

            if (activeSearchBy?.action === "group_by_city") {
                fetchCityGroups();
            } else {
                fetchData(1, false);
            }

            // Set initial values
            prevFiltersRef.current = {
                searchValue,
                activeFilter,
                activeDate: activeDate?.action || '',
                selectedDate,
                activeSearchBy: activeSearchBy?.action || '',
                orderIds,
                activeSenderId,
                language
            };
            return;
        }

        // Skip unnecessary fetches by comparing with previous values
        const shouldFetch =
            prevFiltersRef.current.searchValue !== searchValue ||
            prevFiltersRef.current.activeFilter !== activeFilter ||
            prevFiltersRef.current.activeDate !== (activeDate?.action || '') ||
            prevFiltersRef.current.orderIds !== orderIds ||
            prevFiltersRef.current.activeSenderId !== activeSenderId ||
            prevFiltersRef.current.language !== language ||
            prevFiltersRef.current.activeSearchBy !== (activeSearchBy?.action || '');

        if (!shouldFetch) {
            return;
        }

        setPage(1);

        if (activeSearchBy?.action === "group_by_city") {
            // Clear city orders when search changes to force re-fetch with new groups
            if (prevFiltersRef.current.searchValue !== searchValue) {
                setCityOrdersMap({});
                setExpandedCities({});
            }

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
            activeSenderId,
            language
        };
    }, [searchValue, activeFilter, activeDate, orderIds, language, fetchData, activeSearchBy, fetchCityGroups, activeSenderId]);

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
            else if (completed_orders === 'true' || completed_orders === true) {
                setActiveFilter('completed');
                setPage(1);
            }
            // If we have status_key param, set it as the active filter
            else if (params.status_key) {
                const normalizedStatusKey = Array.isArray(params.status_key) ? params.status_key[0] : params.status_key;
                setActiveFilter(normalizedStatusKey);
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
    }, [pathname, params, fetchData, searchByDateGroup, completed_orders]);

    // Handle filter changes from user interaction
    const handleFilterChange = useCallback((filter) => {

        // When selecting "All" filter, ensure it's an empty string, not undefined
        const newFilter = filter === undefined ? '' : filter;

        setActiveFilter(newFilter);

        if (newFilter === 'completed') {
            router.setParams({ completed_orders: 'true', status_key: '' });
        } else {
            router.setParams({ completed_orders: '', status_key: newFilter });
        }

        if (activeGroupBy && activeGroupBy.length > 0) {
            fetchTopGroups();
        }

    }, [router, activeGroupBy, fetchTopGroups]);

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

        if (activeGroupBy && activeGroupBy.length > 0) {
            fetchTopGroups();
        }

    }, [router, activeGroupBy, fetchTopGroups]);

    // Handle search by changes from user interaction
    const handleSearchByChange = useCallback((searchBy) => {
        // Check if this is the special "group_by_city" action
        if (searchBy && searchBy.action === "group_by_city") {

            // Set active search by to group_by_city
            setActiveSearchBy(searchBy);

            // Don't clear search value - allow searching within city groups
            // setSearchValue(""); // Removed this line

            // Clear other filters but keep search
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

        if (activeGroupBy && activeGroupBy.length > 0) {
            fetchTopGroups();
        }

    }, [router, activeGroupBy, fetchTopGroups]);

    // Handle search value changes from user interaction
    const handleSearchValueChange = useCallback((input) => {
        // Clear orderIds when search value is manually changed
        setSearchValue(input);

        // Only clear URL parameters if typing a search query
        if (input.trim() !== '') {
            // Clear URL parameters on same route
            router.setParams({});

        }
        if (activeGroupBy && activeGroupBy.length > 0) {
            if (groupSearchDebounceRef.current) {
                clearTimeout(groupSearchDebounceRef.current);
            }
            groupSearchDebounceRef.current = setTimeout(() => {
                fetchTopGroups();
            }, 250);
        }
    }, [router, activeGroupBy, fetchTopGroups]);

    // Function to clear all filters and params
    const clearAllFilters = useCallback(() => {

        // PREVENT calling this before initial fetch completes
        if (!hasCompletedInitialFetch.current) {
            return;
        }

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
        activeDate,
        setActiveDate: handleDateChange, // Replace with our custom handler
        selectedDate,
        setSelectedDate,
        addPaddingSpace: true,
        onClearFilters: clearAllFilters, // Add clear all filters function
        groupByOptions,
        activeGroupBy,
        setActiveGroupBy
    }), [
        searchValue,
        filterByGroup,
        searchByGroup,
        activeFilter,
        activeSearchBy,
        searchByDateGroup,
        activeDate,
        selectedDate,
        handleFilterChange,
        handleDateChange,
        handleSearchByChange,
        handleSearchValueChange,
        clearAllFilters,
        groupByOptions,
        activeGroupBy,
        setActiveGroupBy
    ]);

    const fetchTopGroups = useCallback(async () => {
        setGroupSummaryLoading(true);
        try {
            cancelAllGroupSummaryRequests();
            const filters = buildFilters();
            const groupBy = activeGroupBy.map(g => g.action);
            const result = await fetchGroupedSummary(filters, groupBy);
            if (result && result.status === 'success' && Array.isArray(result.data)) {
                const valid = result.data.filter(group => {
                    const hasOrderIds = group.order_ids && group.order_ids.length > 0;
                    const hasOrderCount = group.order_count > 0 || group.total_orders > 0;
                    return hasOrderIds || hasOrderCount;
                });
                setGroupSummary(valid.map(group => ({ ...group, children: [], isLazyLoaded: true })));
            } else {
                setGroupSummary([]);
            }
        } catch (error) {
            setGroupSummary([]);
        } finally {
            setExpandedGroups(new Set());
            setGroupDataCache({});
            setGroupSummaryLoading(false);
        }
    }, [activeGroupBy, buildFilters, fetchGroupedSummary, cancelAllGroupSummaryRequests]);

    const onToggleGroup = useCallback(async (groupItem, depth = 0, parentContext = []) => {
        const id = buildGroupId(groupItem.group_field, groupItem.group_value, depth, parentContext);
        const next = new Set(expandedGroups);
        if (next.has(id)) {
            next.delete(id);
            setExpandedGroups(next);

            // AUTO-DESELECT: Collect all order IDs within this group tree and remove them from selectedOrderIds
            const idsToDeselect = new Set();
            const collectIds = (nodeItem, nodeDepth, nodeParentContext) => {
                if (Array.isArray(nodeItem?.order_ids)) {
                    nodeItem.order_ids.forEach(oid => idsToDeselect.add(oid));
                }

                const nodeId = buildGroupId(nodeItem.group_field, nodeItem.group_value, nodeDepth, nodeParentContext);
                const children = groupDataCache[nodeId];
                if (!Array.isArray(children) || children.length === 0) {
                    return;
                }

                if (children[0]?.group_field) {
                    const nextParentContext = [...nodeParentContext, { group_field: nodeItem.group_field, group_value: nodeItem.group_value }];
                    children.forEach(child => collectIds(child, nodeDepth + 2, nextParentContext));
                    return;
                }

                children.forEach(order => {
                    if (order?.order_id) idsToDeselect.add(order.order_id);
                });
            };

            // Start collection from the current group
            // Note: Since we are collapsing, the data should be in cache if it was expanded
            // However, we need to be careful with the recursive structure reconstruction
            // Simpler approach: Iterate over current selection and remove if it belongs to this group
            // But checking "belongs to" requires tree traversal or data map.

            // Let's reuse the cache structure traversal
            collectIds(groupItem, depth, parentContext);

            if (idsToDeselect.size > 0) {
                setSelectedOrderIds(prev => prev.filter(oid => !idsToDeselect.has(oid)));
            }

            return;
        }
        next.add(id);
        setExpandedGroups(next);
        const hasNested = groupItem.has_nested_groups || (Array.isArray(groupItem.next_group_fields) && groupItem.next_group_fields.length > 0);
        const parentOrderIds = groupItem.order_ids || [];
        const userFilters = buildFilters();
        if (hasNested) {
            const res = await fetchNestedGroup(groupItem.next_group_fields, parentOrderIds, userFilters);
            if (res && res.status === 'success' && Array.isArray(res.data)) {
                setGroupDataCache(prev => ({ ...prev, [id]: res.data.map(g => ({ ...g, children: [], isLazyLoaded: true })) }));
            }
        } else if (Array.isArray(parentOrderIds) && parentOrderIds.length > 0) {
            const res = await fetchOrdersByIds(parentOrderIds, { limit: GROUP_ORDERS_LIMIT, page: 1 });
            if (res && res.status === 'success' && Array.isArray(res.data)) {
                setGroupDataCache(prev => ({ ...prev, [id]: res.data }));
                const total = (res.metadata && (res.metadata.total || res.metadata.total_records)) || parentOrderIds.length || (groupItem.order_count || groupItem.total_orders || 0);
                setGroupPagination(prev => ({
                    ...prev,
                    [id]: {
                        page: 1,
                        limit: GROUP_ORDERS_LIMIT,
                        total
                    }
                }));
            }
        }
    }, [expandedGroups, buildGroupId, buildFilters, fetchNestedGroup, fetchOrdersByIds, groupDataCache, GROUP_ORDERS_LIMIT]);

    const loadMoreGroupOrders = useCallback(async (groupItem, depth, parentContext = []) => {
        const id = buildGroupId(groupItem.group_field, groupItem.group_value, depth, parentContext);
        const pg = groupPagination[id] || { page: 1, limit: GROUP_ORDERS_LIMIT, total: (groupItem.order_ids?.length || groupItem.order_count || groupItem.total_orders || 0) };
        const canLoadMore = (pg.page * pg.limit) < pg.total;
        if (!canLoadMore || groupLoadingMap[id]) {
            return;
        }
        setGroupLoadingMap(prev => ({ ...prev, [id]: true }));
        try {
            const nextPage = pg.page + 1;
            const parentOrderIds = groupItem.order_ids || [];
            const res = await fetchOrdersByIds(parentOrderIds, { limit: pg.limit, page: nextPage });
            if (res && res.status === 'success' && Array.isArray(res.data)) {
                setGroupDataCache(prev => ({ ...prev, [id]: [...(prev[id] || []), ...res.data] }));
                const total = (res.metadata && (res.metadata.total || res.metadata.total_records)) || pg.total;
                setGroupPagination(prev => ({ ...prev, [id]: { page: nextPage, limit: pg.limit, total } }));
            }
        } finally {
            setGroupLoadingMap(prev => ({ ...prev, [id]: false }));
        }
    }, [buildGroupId, groupPagination, groupLoadingMap, fetchOrdersByIds, GROUP_ORDERS_LIMIT]);

    const renderGroupNode = useCallback((groupItem, depth, parentContext) => {
        const id = buildGroupId(groupItem.group_field, groupItem.group_value, depth, parentContext);
        const isExpanded = expandedGroups.has(id);
        const count = groupItem.order_count || groupItem.total_orders || (Array.isArray(groupItem.order_ids) ? groupItem.order_ids.length : 0);
        const children = groupDataCache[id] || [];
        const displayChildren = (() => {
            if (!(children[0]?.group_field && searchValue && searchValue.trim() !== '')) {
                return children;
            }
            const q = searchValue.toLowerCase();
            const filtered = children.filter(child => {
                const label = String(child.group_value_label || '').toLowerCase();
                const value = String(child.group_value || '').toLowerCase();
                return label.includes(q) || value.includes(q);
            });
            return filtered.length > 0 ? filtered : children;
        })();
        return (
            <View key={id} style={[styles.cityCard, { backgroundColor: colors.card }]}>
                <TouchableOpacity style={[styles.cityHeader, { borderBottomColor: colors.border }]} onPress={() => onToggleGroup(groupItem, depth, parentContext)} activeOpacity={0.7}>
                    <View style={styles.cityInfo}>
                        <View style={[styles.cityIconContainer, { backgroundColor: colors.primary + '20' }]}>
                            <MaterialCommunityIcons name="format-list-group" size={Math.max(16, 20 - depth)} color={colors.primary} />
                        </View>
                        <View style={styles.cityTextContainer}>
                            <Text style={[styles.cityName, {
                                color: colors.text, ...Platform.select({
                                    ios: {
                                        textAlign: isRTL ? "left" : ""
                                    }
                                })
                            }]}>
                                {String(
                                    groupItem.group_value_label ??
                                    groupItem.group_value ??
                                    (translations[language]?.common?.uncategorized || 'Unassigned')
                                )}
                            </Text>
                            <Text style={[styles.orderCount, {
                                color: colors.textSecondary, ...Platform.select({
                                    ios: {
                                        textAlign: isRTL ? "left" : ""
                                    }
                                })
                            }]}>
                                {count} {translations[language]?.tabs?.index?.boxes?.ofOrders || 'orders'}
                            </Text>
                            {groupItem.total_net_value !== undefined && groupItem.total_net_value !== null && (
                                <Text style={[styles.orderCount, {
                                    color: colors.textSecondary, ...Platform.select({
                                        ios: {
                                            textAlign: isRTL ? "left" : ""
                                        }
                                    })
                                }]}>
                                    {(translations[language]?.tabs?.orders?.order?.netValue || 'Net Value')}: {groupItem.total_net_value} ILS
                                </Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.cityAction}>
                        <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.countBadgeText}>{count}</Text>
                        </View>
                        <MaterialIcons name={isExpanded ? "expand-less" : "expand-more"} size={24} color={colors.textSecondary} />
                    </View>
                </TouchableOpacity>
                {isExpanded && (
                    <View style={styles.expandedContent}>
                        {children.length === 0 ? (
                            <View style={styles.cityLoadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </View>
                        ) : children[0]?.group_field ? (
                            <View style={styles.ordersContainer}>
                                {displayChildren.map(child => renderGroupNode(
                                    child,
                                    depth + 2,
                                    [...parentContext, { group_field: groupItem.group_field, group_value: groupItem.group_value }]
                                ))}
                            </View>
                        ) : (
                            <FlatList
                                data={children}
                                keyExtractor={(order, idx) => `${order.order_id}-${idx}`}
                                renderItem={({ item: order }) => (
                                    <View style={styles.orderItem}>
                                        <OrdersView
                                            data={[order]}
                                            metadata={data?.metadata}
                                            isLoading={false}
                                            onStatusChange={handleOrderStatusUpdate}
                                            isSelectionMode={isSelectionMode}
                                            selectedOrderIds={selectedOrderIds}
                                            onSelectOrder={handleSelectOrder}
                                            onLongPressOrder={handleLongPressOrder}
                                            onExplicitSelectOrder={handleExplicitSelect}
                                            isSelectionClickGuard={isSelectionClickGuard}
                                            hideEmptyState={true}
                                            initialMinimized={true}
                                        />
                                    </View>
                                )}
                                onEndReachedThreshold={0.2}
                                onEndReached={() => loadMoreGroupOrders(groupItem, depth, parentContext)}
                                ListFooterComponent={() => {
                                    const pg = groupPagination[id] || { page: 1, limit: GROUP_ORDERS_LIMIT, total: (groupItem.order_ids?.length || groupItem.order_count || groupItem.total_orders || 0) };
                                    const canLoadMore = (pg.page * pg.limit) < pg.total;
                                    if (!canLoadMore) return null;
                                    return (
                                        <View style={styles.cityLoadingContainer}>
                                            <ActivityIndicator size="large" color={colors.primary} />
                                        </View>
                                    );
                                }}
                            />
                        )}
                    </View>
                )}
            </View>
        );
    }, [expandedGroups, groupDataCache, colors, translations, language, onToggleGroup, buildGroupId, data, handleOrderStatusUpdate, loadMoreGroupOrders, groupPagination, searchValue, isSelectionMode, selectedOrderIds, handleSelectOrder, handleLongPressOrder, handleExplicitSelect, isSelectionClickGuard, GROUP_ORDERS_LIMIT]);
    const filteredGroupSummary = useMemo(() => {
        if (!Array.isArray(groupSummary) || groupSummary.length === 0) return groupSummary;
        if (!searchValue || searchValue.trim() === '') return groupSummary;
        const q = searchValue.toLowerCase();
        return groupSummary.filter(g => {
            const label = String(g.group_value_label || '').toLowerCase();
            const value = String(g.group_value || '').toLowerCase();
            return label.includes(q) || value.includes(q);
        });
    }, [groupSummary, searchValue]);
    useEffect(() => {
        if (activeGroupBy && activeGroupBy.length > 0) {
            fetchTopGroups();
        }
    }, [activeGroupBy, fetchTopGroups, searchValue, activeFilter, activeDate, selectedDate, activeSearchBy, active_orders]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.statusBarBg} />

            <Search {...searchProps} searchResultCount={(activeGroupBy && activeGroupBy.length > 0) || (activeSearchBy?.action === "group_by_city") ? null : data?.metadata?.total_records} />

            <View style={styles.ordersList}>
                {activeGroupBy && activeGroupBy.length > 0 ? (
                    groupSummaryLoading ? (
                        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : groupSummary && groupSummary.length > 0 ? (
                        <FlatList
                            data={Array.isArray(filteredGroupSummary) && filteredGroupSummary.length > 0 ? filteredGroupSummary : groupSummary}
                            keyExtractor={(item, index) => `${item.group_field}-${String(item.group_value ?? 'Unassigned')}-${index}`}
                            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
                            refreshControl={refreshControl}
                            renderItem={({ item }) => {
                                const id = buildGroupId(item.group_field, item.group_value, 0, []);
                                const isExpanded = expandedGroups.has(id);
                                const count = item.order_count || item.total_orders || (Array.isArray(item.order_ids) ? item.order_ids.length : 0);
                                const children = groupDataCache[id] || [];
                                return (
                                    <View style={[styles.cityCard, { backgroundColor: colors.card }]}>
                                        <TouchableOpacity style={[styles.cityHeader, { borderBottomColor: colors.border }]} onPress={() => onToggleGroup(item, 0, [])} activeOpacity={0.7}>
                                            <View style={styles.cityInfo}>
                                                <View style={[styles.cityIconContainer, { backgroundColor: colors.primary + '20' }]}>
                                                    <MaterialCommunityIcons name="format-list-group" size={20} color={colors.primary} />
                                                </View>
                                                <View style={styles.cityTextContainer}>
                                                    <Text style={[styles.cityName, {
                                                        color: colors.text, ...Platform.select({
                                                            ios: {
                                                                textAlign: isRTL ? "left" : ""
                                                            }
                                                        })
                                                    }]}>
                                                        {String(
                                                            item.group_value_label ??
                                                            item.group_value ??
                                                            (translations[language]?.common?.uncategorized || 'Unassigned')
                                                        )}
                                                    </Text>
                                                    <Text style={[styles.orderCount, {
                                                        color: colors.textSecondary, ...Platform.select({
                                                            ios: {
                                                                textAlign: isRTL ? "left" : ""
                                                            }
                                                        })
                                                    }]}>
                                                        {count} {translations[language]?.tabs?.index?.boxes?.ofOrders || 'orders'}
                                                    </Text>
                                                    {item.total_net_value !== undefined && item.total_net_value !== null && (
                                                        <Text style={[styles.orderCount, {
                                                            color: colors.textSecondary, ...Platform.select({
                                                                ios: {
                                                                    textAlign: isRTL ? "left" : ""
                                                                }
                                                            })
                                                        }]}>
                                                            {(translations[language]?.tabs?.orders?.order?.netValue || 'Net Value')}: {item.total_net_value} ILS
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                            <View style={styles.cityAction}>
                                                <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                                                    <Text style={styles.countBadgeText}>{count}</Text>
                                                </View>
                                                <MaterialIcons name={isExpanded ? "expand-less" : "expand-more"} size={24} color={colors.textSecondary} />
                                            </View>
                                        </TouchableOpacity>
                                        {isExpanded && (
                                            <View style={styles.expandedContent}>
                                                {children.length === 0 ? (
                                                    <View style={styles.cityLoadingContainer}>
                                                        <ActivityIndicator size="large" color={colors.primary} />
                                                    </View>
                                                ) : children[0]?.group_field ? (
                                                    <View style={styles.ordersContainer}>
                                                        {children.map(child =>
                                                            renderGroupNode(child, 2, [{ group_field: item.group_field, group_value: item.group_value }])
                                                        )}
                                                    </View>
                                                ) : (
                                                    <FlatList
                                                        data={children}
                                                        keyExtractor={(order, idx) => `${order.order_id}-${idx}`}
                                                        renderItem={({ item: order }) => (
                                                            <View style={styles.orderItem}>
                                                                <OrdersView
                                                                    data={[order]}
                                                                    metadata={data?.metadata}
                                                                    isLoading={false}
                                                                    onStatusChange={handleOrderStatusUpdate}
                                                                    isSelectionMode={isSelectionMode}
                                                                    selectedOrderIds={selectedOrderIds}
                                                                    onSelectOrder={handleSelectOrder}
                                                                    onLongPressOrder={handleLongPressOrder}
                                                                    onExplicitSelectOrder={handleExplicitSelect}
                                                                    isSelectionClickGuard={isSelectionClickGuard}
                                                                    hideEmptyState={true}
                                                                />
                                                            </View>
                                                        )}
                                                        onEndReachedThreshold={0.2}
                                                        onEndReached={() => loadMoreGroupOrders(item, 0, [])}
                                                        ListFooterComponent={() => {
                                                            const pg = groupPagination[id] || { page: 1, limit: GROUP_ORDERS_LIMIT, total: (item.order_ids?.length || item.order_count || item.total_orders || 0) };
                                                            const canLoadMore = (pg.page * pg.limit) < pg.total;
                                                            if (!canLoadMore) return null;
                                                            return (
                                                                <View style={styles.cityLoadingContainer}>
                                                                    <ActivityIndicator size="large" color={colors.primary} />
                                                                </View>
                                                            );
                                                        }}
                                                    />
                                                )}
                                            </View>
                                        )}
                                    </View>
                                );
                            }}
                        />
                    ) : (
                        <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
                            <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: 'center' }}>
                                {translations[language]?.tabs?.orders?.emptyArray || 'No groups available'}
                            </Text>
                        </View>
                    )
                ) : activeSearchBy?.action === "group_by_city" ? (
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
                                                    fetchCityOrders(cityGroup);
                                                }
                                            }}
                                        >
                                            <View style={styles.cityInfo}>
                                                <View style={[styles.cityIconContainer, { backgroundColor: colors.primary + '20' }]}>
                                                    <MaterialCommunityIcons name="city-variant-outline" size={20} color={colors.primary} />
                                                </View>
                                                <View style={styles.cityTextContainer}>
                                                    <Text style={[styles.cityName, {
                                                        color: colors.text, ...Platform.select({
                                                            ios: {
                                                                textAlign: isRTL ? "left" : ""
                                                            }
                                                        })
                                                    }]}
                                                    >
                                                        {cityGroup.group_value_label || cityGroup.group_value}
                                                    </Text>
                                                    <Text style={[styles.orderCount, {
                                                        color: colors.textSecondary, ...Platform.select({
                                                            ios: {
                                                                textAlign: isRTL ? "left" : ""
                                                            }
                                                        })
                                                    }]}
                                                    >
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
                                                        {cityOrders.map((order, idx) => (
                                                            <View key={`${order.order_id}-${idx}`} style={styles.orderItem}>
                                                                <OrdersView
                                                                    data={[order]}
                                                                    metadata={data?.metadata}
                                                                    isLoading={false}
                                                                    onStatusChange={handleOrderStatusUpdate}
                                                                    isSelectionMode={isSelectionMode}
                                                                    selectedOrderIds={selectedOrderIds}
                                                                    onSelectOrder={handleSelectOrder}
                                                                    onLongPressOrder={handleLongPressOrder}
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
                        onCategoryReorder={() => fetchData(page, false)}
                        isSelectionMode={isSelectionMode}
                        selectedOrderIds={selectedOrderIds}
                        onSelectOrder={handleSelectOrder}
                        onLongPressOrder={handleLongPressOrder}
                        onExplicitSelectOrder={handleExplicitSelect}
                        isSelectionClickGuard={isSelectionClickGuard}
                    />
                )}
            </View>
            {isSelectionMode && selectedOrderIds.length > 0 && (
                <BatchActionsBar
                    selectedOrderIds={selectedOrderIds}
                    onActionComplete={handleActionComplete}
                    onCancelSelection={handleCancelSelection}
                    onSelectAll={handleSelectAll}
                    onSelectAllUnpaid={handleSelectAllUnpaid}
                    orders={data?.data || []}
                />
            )}
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
