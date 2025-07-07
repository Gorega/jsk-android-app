import { View, StyleSheet, RefreshControl, StatusBar, DeviceEventEmitter } from 'react-native';
import Search from '../../components/search/Search';
import OrdersView from '../../components/orders/OrdersView';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useLocalSearchParams, usePathname } from "expo-router";
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
    const { orderIds, reset } = params;
    const [refreshing, setRefreshing] = useState(false);
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    // Reset filters when reset param changes
    useEffect(() => {
        if (reset && !orderIds) {
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
        fetchData(1, false);
    }, []);

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
            await fetchData(1, false);
        } catch (error) {
        } finally {
            setRefreshing(false);
        }
    }, [language]);

    // Memoize filter groups to prevent unnecessary re-renders
    const filterByGroup = useMemo(() => ["driver", "delivery_company"].includes(user.role) ? [{
        name: translations[language].tabs.orders.filters.all,
        action: "",
    }, {
        name: translations[language].tabs.orders.filters.onTheWay,
        action: "on_the_way"
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
        action: "delivered"
    }, {
        name: translations[language].tabs.orders.filters.received,
        action: "received"
    }, {
        name: translations[language].tabs.orders.filters["delivered/received"],
        action: "delivered/received"
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
        name: translations[language].tabs.orders.filters.inProgress,
        action: "in_progress"
    }, {
        name: translations[language].tabs.orders.filters.stuck,
        action: "stuck"
    }, {
        name: translations[language].tabs.orders.filters.delayed,
        action: "delayed"
    }, {
        name: translations[language].tabs.orders.filters.onTheWay,
        action: "on_the_way"
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
        action: "delivered"
    }, {
        name: translations[language].tabs.orders.filters.received,
        action: "received"
    }, {
        name: translations[language].tabs.orders.filters["delivered/received"],
        action: "delivered/received"
    }, {
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
        name: translations[language].tabs.orders.filters.receiverArea,
        action: "receiver_area"
    }, {
        name: translations[language].tabs.orders.filters.receiverAddress,
        action: "receiver_address"
    }, {
        name: translations[language].tabs.orders.filters.driverName,
        action: "driver"
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


    const fetchData = useCallback(async (pageNumber = 1, isLoadMore = false) => {
        if (!isLoadMore) setIsLoading(true);
        try {
            // const token = await getToken("userToken");
            const queryParams = new URLSearchParams();
            if (!activeSearchBy && searchValue) queryParams.append('search', searchValue);
            if (orderIds) queryParams.append('order_id', orderIds)
            if (activeFilter) queryParams.append('status_key', activeFilter);
            if (activeSearchBy) queryParams.append(activeSearchBy.action, searchValue)
            if (activeDate) queryParams.append("date_range", activeDate.action)
            if (activeDate.action === "custom") queryParams.append("start_date", selectedDate)
            if (activeDate.action === "custom") queryParams.append("end_date", selectedDate)
            queryParams.append('page', pageNumber);
            queryParams.append('language_code', language);

            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders?${queryParams.toString()}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    // "Cookie": token ? `token=${token}` : ""
                }
            });
            const newData = await res.json();
            if (isLoadMore) {
                setData(prevData => ({
                    ...prevData,
                    data: [...prevData.data, ...newData.data],
                }));
            } else {
                setData(newData);
            }
        } catch (err) {
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    }, [activeDate, activeFilter, activeSearchBy, language, orderIds, searchValue, selectedDate]);

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
                console.error("Error loading more data:", error);
            } finally {
                setLoadingMore(false);
            }
        }
    }, [loadingMore, data, page, fetchData]);

    useEffect(() => {
        if (!socket) return;

        const handleOrderUpdate = (notification) => {
            switch (notification.type) {
                case 'ORDER_CREATED':
                case 'ORDER_UPDATED':
                case 'COLLECTION_CREATED':
                case 'COLLECTION_UPDATED':
                case 'COLLECTION_DELETED':
                case 'STATUS_UPDATED':
                    fetchData(1, false);
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
    }, [socket, fetchData]);

    useEffect(() => {
        setPage(1);
        fetchData(1, false);
    }, [searchValue, activeFilter, activeDate, orderIds, language, fetchData]);

    // Reset all filters when re-entering the orders route or when params change
    useEffect(() => {
        if (pathname === "/(tabs)/orders") {
            // Only reset if there are no orderIds in params
            if (!orderIds) {
                setSearchValue("");
                setActiveFilter("");
                setActiveSearchBy("");
                setActiveDate("");
                setSelectedDate("");
                setPage(1);
                fetchData(1, false);
            }
        }
    }, [pathname, params, fetchData, orderIds]);

    // Memoize the refresh control to prevent unnecessary re-renders
    const refreshControl = useMemo(() => (
        <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
        />
    ), [refreshing, onRefresh, colors.primary]);

    // Memoize the search component props to prevent unnecessary re-renders
    const searchProps = useMemo(() => ({
        searchValue,
        setSearchValue: (input) => setSearchValue(input),
        filterByGroup,
        searchByGroup,
        activeFilter,
        setActiveFilter,
        activeSearchBy,
        setActiveSearchBy,
        searchByDateGroup,
        selectedDate,
        setSelectedDate,
        activeDate,
        setActiveDate,
        addPaddingSpace: true
    }), [
        searchValue, 
        filterByGroup, 
        searchByGroup, 
        activeFilter, 
        activeSearchBy, 
        searchByDateGroup, 
        selectedDate, 
        activeDate
    ]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.statusBarBg} />
            
            <Search {...searchProps} />
            
            <View style={styles.ordersList}>
                <OrdersView
                    data={data.data || []}
                    metadata={data.metadata}
                    loadMoreData={loadMoreData}
                    loadingMore={loadingMore}
                    isLoading={isLoading}
                    refreshControl={refreshControl}
                />
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
        marginTop: 10,
    },
});