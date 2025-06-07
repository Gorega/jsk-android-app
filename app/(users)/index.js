import { View, StyleSheet, ActivityIndicator, Text, RefreshControl, ScrollView, TouchableOpacity, Platform } from 'react-native';
import Search from '../../components/search/Search';
import { useEffect, useState, useCallback } from 'react';
import { router } from "expo-router";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import UsersView from '../../components/users/UsersView';
import { getToken } from "../../utils/secureStore";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
    const { language } = useLanguage();
    const [searchValue, setSearchValue] = useState("");
    const [activeFilter, setActiveFilter] = useState("");
    const [activeSearchBy, setActiveSearchBy] = useState("");
    const [activeDate, setActiveDate] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [data, setData] = useState({ data: [], metadata: { total_records: 0 } });
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const filterByGroup = [
        {
            name: translations[language].users.filters.all,
            action: "",
        },
        {
            name: translations[language].users.filters.active,
            action: 1,
        },
        {
            name: translations[language].users.filters.inactive,
            action: 0
        }
    ];

    const searchByGroup = [
        {
            name: translations[language].users.filters.userId,
            action: "user_id"
        },
        {
            name: translations[language].users.filters.name,
            action: "name"
        },
        {
            name: translations[language].users.filters.commercial,
            action: "comercial_name"
        },
        {
            name: translations[language].users.filters.email,
            action: "email"
        },
        {
            name: translations[language].users.filters.phone,
            action: "phone"
        },
        {
            name: translations[language].users.filters.branch,
            action: "branch"
        },
        {
            name: translations[language].users.filters.role,
            action: "role"
        },
        {
            name: translations[language].users.filters.city,
            action: "city"
        },
        {
            name: translations[language].users.filters.area,
            action: "area"
        },
        {
            name: translations[language].users.filters.address,
            action: "address"
        }
    ];

    const searchByDateGroup = [
        {
            name: translations[language].users.filters.today,
            action: "today"
        },
        {
            name: translations[language].users.filters.yesterday,
            action: "yesterday"
        },
        {
            name: translations[language].users.filters.thisWeek,
            action: "this_week"
        },
        {
            name: translations[language].users.filters.thisMonth,
            action: "this_month"
        },
        {
            name: translations[language].users.filters.thisYear,
            action: "this_year"
        },
        {
            name: translations[language].users.filters.selectDate,
            action: "custom"
        }
    ];

    const clearFilters = () => {
        router.setParams("");
    };

    const fetchData = async (pageNumber = 1, isLoadMore = false) => {
        if (!isLoadMore) setIsLoading(true);
        try {
            // const token = await getToken("userToken");
            const queryParams = new URLSearchParams();
            if (!activeSearchBy && searchValue) queryParams.append('search', searchValue);
            if (activeFilter) queryParams.append('active_status', activeFilter);
            if (activeSearchBy) queryParams.append(activeSearchBy.action, searchValue);
            if (activeDate) queryParams.append("date_range", activeDate.action);
            if (activeDate.action === "custom") queryParams.append("start_date", selectedDate);
            if (activeDate.action === "custom") queryParams.append("end_date", selectedDate);
            queryParams.append('page', pageNumber);
            queryParams.append('language_code', language);
            
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users?${queryParams.toString()}`, {
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
            setRefreshing(false);
        }
    };

    const loadMoreData = async () => {
        if (!loadingMore && data.data?.length > 0) {
            // Check if there's more data to load
            if (data.data.length >= data.metadata?.total_records) {
                return;
            }

            setLoadingMore(true);
            const nextPage = page + 1;
            setPage(nextPage);
            try {
                await fetchData(nextPage, true);
            } finally {
                setLoadingMore(false);
            }
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setPage(1);
        fetchData(1, false);
    }, [language, searchValue, activeFilter, activeDate, selectedDate]);

    useEffect(() => {
        setPage(1);
        fetchData(1, false);
    }, [searchValue, activeFilter, activeDate, selectedDate, language]);

    const renderEmptyState = () => {
        if (isLoading) return null;
        
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={60} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>
                    {translations[language].users.noUsersFound}
                </Text>
                <Text style={styles.emptyMessage}>
                    {translations[language].users.tryDifferentFilters}
                </Text>
                {(activeFilter || activeSearchBy || activeDate || searchValue) && (
                    <TouchableOpacity 
                        style={styles.clearButton}
                        onPress={() => {
                            setSearchValue("");
                            setActiveFilter("");
                            setActiveSearchBy("");
                            setActiveDate("");
                            setSelectedDate("");
                            clearFilters();
                        }}
                    >
                        <Text style={styles.clearButtonText}>
                            {translations[language].users.clearFilters}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Search
                searchValue={searchValue}
                setSearchValue={(input) => setSearchValue(input)}
                filterByGroup={filterByGroup}
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
                showScanButton={false}
                addPaddingSpace={Platform.OS === 'ios'}
            />
            
            <View style={styles.content}>
                {data.data?.length === 0 && !isLoading ? renderEmptyState() : (
                    <UsersView
                        data={data.data || []}
                        loadMoreData={loadMoreData}
                        loadingMore={loadingMore}
                        isLoading={isLoading}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={["#4361EE"]}
                                tintColor="#4361EE"
                            />
                        }
                    />
                )}
            </View>

            {/* Loading Spinner */}
            {isLoading && !refreshing && (
                <View style={styles.overlay}>
                    <View style={styles.spinnerContainer}>
                        <ActivityIndicator size="large" color="#4361EE" />
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    content: {
        flex: 1,
        marginTop: 8,
    },
    statsContainer: {
        marginHorizontal: 16,
        marginVertical: 12,
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: "#64748B",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.08,
        shadowRadius: 2.65,
        elevation: 2,
    },
    statsContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
    statsDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E2E8F0',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#334155',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyMessage: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },
    clearButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: '#4361EE',
        borderRadius: 8,
    },
    clearButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    spinnerContainer: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    }
});