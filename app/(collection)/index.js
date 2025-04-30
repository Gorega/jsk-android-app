import { View,StyleSheet,RefreshControl} from 'react-native';
import Search from '../../components/search/Search';
import CollectionsView from '../../components/collections/CollectionsView';
import { useCallback, useEffect, useState } from 'react';
import {router, useLocalSearchParams} from "expo-router"
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useSocket } from '../../utils/socketContext';
import { getToken } from "../../utils/secureStore";


export default function HomeScreen(){
    const socket = useSocket();
    const { language } = useLanguage();
    const [searchValue, setSearchValue] = useState("");
    const [activeFilter, setActiveFilter] = useState("");
    const [activeSearchBy,setActiveSearchBy] = useState("");
    const [activeDate,setActiveDate] = useState("");
    const [selectedDate,setSelectedDate] = useState("");
    const [data,setData] = useState([]);
    const [page,setPage] = useState(1);
    const [loadingMore,setLoadingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const params = useLocalSearchParams();
    const { type,collectionIds } = params;
    const [refreshing, setRefreshing] = useState(false);
    
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setPage(1);
        fetchData(1, false).finally(() => setRefreshing(false));
    }, [language]);

    const filterByGroup = ["business_returned","driver_returned"].includes(type)
    ? [
        { name: translations[language].collections.filters.all, action: "" },
        { name: translations[language].collections.filters.returnedInBranch, action: "returned_in_branch" },
        { name: translations[language].collections.filters.deleted, action: "deleted" },
        { name: translations[language].collections.filters.returnedOut, action: "returned_out" },
        { name: translations[language].collections.filters.returnedDelivered, action: "returned_delivered" },
        { name: translations[language].collections.filters.completed, action: "completed" }
      ]
    : ["business_money","driver_money"].includes(type)
    ? [
        { name: translations[language].collections.filters.all, action: "" },
        { name: translations[language].collections.filters.moneyInBranch, action: "money_in_branch" },
        { name: translations[language].collections.filters.deleted, action: "deleted" },
        { name: translations[language].collections.filters.moneyOut, action: "money_out" },
        { name: translations[language].collections.filters.paid, action: "paid" },
        { name: translations[language].collections.filters.completed, action: "completed" },
      ]
    : type === "dispatched"
    ? [
        { name: translations[language].collections.filters.all, action: "" },
        { name: translations[language].collections.filters.pending, action: "pending" },
        { name: translations[language].collections.filters.deleted, action: "deleted" },
        { name: translations[language].collections.filters.inDispatchedToBranch, action: "in_dispatched_to_branch" },
        { name: translations[language].collections.filters.partial, action: "partial" },
        { name: translations[language].collections.filters.completed, action: "completed" },
    ]
    : type === "sent"
    ? [
        { name: translations[language].collections.filters.all, action: "" },
        { name: translations[language].collections.filters.paid, action: "paid" },
        { name: translations[language].collections.filters.returnedDelivered, action: "returned_delivered" },
        { name: translations[language].collections.filters.completed, action: "completed" },
      ]
    : []

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
            const token = await getToken("userToken");
            const queryParams = new URLSearchParams();
            if (!activeSearchBy && searchValue) queryParams.append('search', searchValue);
            // if (collectionIds) queryParams.append('collection_ids', collectionIds)
            if (activeFilter) queryParams.append('status_key', activeFilter);
            if (activeSearchBy) queryParams.append(activeSearchBy.action, searchValue)
            if (activeDate) queryParams.append("date_range", activeDate.action)
            if (activeDate.action === "custom") queryParams.append("start_date", selectedDate)
            if (activeDate.action === "custom") queryParams.append("end_date", selectedDate)
            queryParams.append('page', pageNumber);
            queryParams.append('language_code', language);
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/collections/${type}?${queryParams.toString()}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    "Cookie": token ? `token=${token}` : ""
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
        } catch(err) {
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    }

    const loadMoreData = async () => {
        if (!loadingMore && data.data?.length > 0) {
            // Check if there's more data to load
            if (data.data.length >= data.metadata.total_records) {
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
    };


    useEffect(() => {
        setPage(1);
        fetchData(1, false);
        if(collectionIds){
            setActiveSearchBy(searchByGroup[0]);
            type = "business_money"
        }
    }, [type,searchValue, activeFilter,activeDate,collectionIds]);


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


    return <View style={styles.main}>
    <Search
        searchValue={searchValue}
        setSearchValue={(input)=> setSearchValue(input)}
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
    />
    <View style={styles.section}>
        <CollectionsView
            data={data.data || []}
            type={type}
            loadMoreData={loadMoreData}
            loadingMore={loadingMore}
            isLoading={isLoading}
            refreshControl={
            <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#4361EE"]} // Android
                tintColor="#4361EE" // iOS
            />
            }
        />
    </View>
</View>
}

const styles = StyleSheet.create({
    main:{
        flex: 1,
    },
    section:{
        marginTop:15,
        flex:1
    }

})