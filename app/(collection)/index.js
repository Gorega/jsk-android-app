import { View, StyleSheet, RefreshControl } from 'react-native';
import Search from '../../components/search/Search';
import CollectionsView from '../../components/collections/CollectionsView';
import { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from "expo-router"
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useSocket } from '../../utils/socketContext';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import axios from 'axios';

export default function HomeScreen() {
    const socket = useSocket();
    const { language } = useLanguage();
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    
    const [searchValue, setSearchValue] = useState("");
    const [activeFilter, setActiveFilter] = useState("");
    const [activeSearchBy, setActiveSearchBy] = useState("");
    const [activeDate, setActiveDate] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const params = useLocalSearchParams();
    const { type, collectionIds, scannedReferenceId } = params;
    const [refreshing, setRefreshing] = useState(false);
    
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setPage(1);
        fetchData(1, false).finally(() => setRefreshing(false));
    }, [language]);

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
                switch(currentType) {
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
        name:translations[language].collections.filters.today,
        action:"today"
    },{
        name:translations[language].collections.filters.yesterday,
        action:"yesterday"
    },{
        name:translations[language].collections.filters.thisWeek,
        action:"this_week"
    },{
        name:translations[language].collections.filters.thisMonth,
        action:"this_month"
    },{
        name:translations[language].collections.filters.thisYear,
        action:"this_year"
    },{
        name:translations[language].collections.filters.selectDate,
        action:"custom"
    }]

    const clearFilters = () => {
        router.setParams({ collectionIds: ""});
    };

    const fetchData = async (pageNumber = 1, isLoadMore = false)=>{
        if (!isLoadMore) setIsLoading(true);
        try {
            const queryParams = new URLSearchParams();
            let typeId;
            
            // Determine type_id based on collection type
            switch(type) {
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
        } catch(err) {
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
        if(collectionIds && collectionIds !== 'undefined'){
            setActiveSearchBy(searchByGroup[0]);
            // Set default type to driver_money if not already specified
            if (!type) {
                router.setParams({ type: "driver_money" });
            }
        }
    }, [type, searchValue, activeFilter, activeDate, collectionIds]);


    const handleCollectionsUpdate = useCallback((notification) => {
        switch (notification.type) {
            case 'COLLECTION_CREATED':
            case 'COLLECTION_UPDATED':
            case 'COLLECTION_DELETED':
            case 'STATUS_UPDATED':
                // Refresh orders data only if update is recent
                fetchData(1,false);
                break;
            default:
                break;
        }
    }, []);

    useEffect(() => {
        if(socket){
            socket.on('collectionUpdate', handleCollectionsUpdate);
            return () => {
                socket.off('collectionUpdate', handleCollectionsUpdate);
            };
        }
    }, [socket, handleCollectionsUpdate]);


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
    </View>
}

const styles = StyleSheet.create({
    main: {
        flex: 1,
    },
    section: {
        marginTop: 15,
        flex: 1
    }
})