import { View,StyleSheet} from 'react-native';
import Search from '../../components/search/Search';
import CollectionsView from '../../components/collections/CollectionsView';
import { useEffect, useState } from 'react';
import {router, useLocalSearchParams} from "expo-router"
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';

export default function HomeScreen(){

    const { language } = useLanguage();
    const [searchValue, setSearchValue] = useState("");
    const [activeFilter, setActiveFilter] = useState("");
    const [activeSearchBy,setActiveSearchBy] = useState("");
    const [activeDate,setActiveDate] = useState("");
    const [selectedDate,setSelectedDate] = useState("");
    const [data,setData] = useState([]);
    const [page,setPage] = useState(1);
    const [loadingMore,setLoadingMore] = useState(false);
    const params = useLocalSearchParams();
    const { type,collectionIds } = params;

    const filterByGroup = type === "returned" 
    ? [
        { name: translations[language].collections.filters.all, action: "" },
        { name: translations[language].collections.filters.returnedInBranch, action: "returned_in_branch" },
        { name: translations[language].collections.filters.deleted, action: "deleted" },
        { name: translations[language].collections.filters.returnedOut, action: "returned_out" },
        { name: translations[language].collections.filters.returnedDelivered, action: "returned_delivered" },
        { name: translations[language].collections.filters.completed, action: "completed" }
      ]
    : type === "money"
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
    : type === "driver"
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
        (type === "driver" || type === "dispatched") ? { name: translations[language].collections.filters.driver, action: "driver_name" } : { name: translations[language].collections.filters.prevDriver, action: "previous_driver_name" },
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
        try {
            const queryParams = new URLSearchParams();
            if (!activeSearchBy && searchValue) queryParams.append('search', searchValue);
            // if (collectionIds) queryParams.append('collection_ids', collectionIds)
            if (activeFilter) queryParams.append('status', activeFilter);
            if (activeSearchBy) queryParams.append(activeSearchBy.action, searchValue)
            if (activeDate) queryParams.append("date_range", activeDate.action)
            if (activeDate.action === "custom") queryParams.append("start_date", selectedDate)
            if (activeDate.action === "custom") queryParams.append("end_date", selectedDate)
            queryParams.append('page', pageNumber);
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/collections/${type}?${queryParams.toString()}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json"
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
            console.log(err);
        } finally {
            setLoadingMore(false);
        }
    }

    const loadMoreData = async () => {
        console.log("loadMoreData called");
        if (!loadingMore && data.data?.length > 0) {
            // Check if there's more data to load
            if (data.data.length >= data.metadata.total_records) {
                console.log("No more data to load");
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
        if(collectionIds){
            setActiveSearchBy(searchByGroup[0]);
            type = "money"
        }
    }, [type,searchValue, activeFilter,activeDate,collectionIds]);


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
        />
    </View>
</View>
}

const styles = StyleSheet.create({
    main:{
        height:"100%"
    },
    section:{
        marginTop:15,
        flex:1
    }

})