import { View,StyleSheet} from 'react-native';
import Search from '../../components/search/Search';
import OrdersView from '../../components/orders/OrdersView';
import { useEffect, useState } from 'react';
import {router, useLocalSearchParams} from "expo-router";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useAuth } from '../_layout';

export default function Orders(){
    const { language } = useLanguage();
    const [data,setData] = useState([]);
    const [page,setPage] = useState(1);
    const [loadingMore,setLoadingMore] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [activeFilter, setActiveFilter] = useState("");
    const [activeSearchBy,setActiveSearchBy] = useState("");
    const [activeDate,setActiveDate] = useState("");
    const [selectedDate,setSelectedDate] = useState("");
    const params = useLocalSearchParams();
    const {trackChanges} = useAuth();
    const { orderId,orderIds } = params;

    const filterByGroup = [{
        name:translations[language].tabs.orders.filters.all,
        action:"",
    },{
        name:translations[language].tabs.orders.filters.waiting,
        action:"waiting",
    },{
        name:translations[language].tabs.orders.filters.rejected,
        action:"rejected"
    },{
        name:translations[language].tabs.orders.filters.inBranch,
        action:"in_branch"
    },{
        name:translations[language].tabs.orders.filters.inProgress,
        action:"in_progress"
    },{
        name:translations[language].tabs.orders.filters.stuck,
        action:"stuck"
    },{
        name:translations[language].tabs.orders.filters.delayed,
        action:"delayed"
    },{
        name:translations[language].tabs.orders.filters.onTheWay,
        action:"on_the_way"
    },{
        name:translations[language].tabs.orders.filters.rescheduled,
        action:"reschedule"
    },{
        name:translations[language].tabs.orders.filters.returnBeforeDeliveredInitiated,
        action:"return_before_delivered_initiated"
    },{
        name:translations[language].tabs.orders.filters.returnAfterDeliveredInitiated,
        action:"return_after_delivered_initiated"
    },{
        name:translations[language].tabs.orders.filters.returned,
        action:"returned"
    },{
        name:translations[language].tabs.orders.filters.returnedInBranch,
        action:"returned_in_branch"
    },{
        name:translations[language].tabs.orders.filters.returnedOut,
        action:"returned_out"
    },{
        name:translations[language].tabs.orders.filters.businessReturnedDelivered,
        action:"business_returned_delivered"
    },{
        name:translations[language].tabs.orders.filters.delivered,
        action:"delivered"
    },{
        name:translations[language].tabs.orders.filters.moneyInBranch,
        action:"money_in_branch"
    },{
        name:translations[language].tabs.orders.filters.moneyOut,
        action:"money_out"
    },{
        name:translations[language].tabs.orders.filters.businessPaid,
        action:"business_paid"
    },{
        name:translations[language].tabs.orders.filters.completed,
        action:"completed"
    }]

    const searchByGroup = [{
        name:translations[language].tabs.orders.filters.orderId,
        action:"order_id"
    },{
        name:translations[language].tabs.orders.filters.referenceID,
        action:"reference_id"
    },{
        name:translations[language].tabs.orders.filters.sender,
        action:"sender"
    },{
        name:translations[language].tabs.orders.filters.receiverName,
        action:"receiver_name"
    },{
        name:translations[language].tabs.orders.filters.receiverPhone,
        action:"receiver_phone"
    },{
        name:translations[language].tabs.orders.filters.receiverCity,
        action:"receiver_city"
    },{
        name:translations[language].tabs.orders.filters.receiverArea,
        action:"receiver_area"
    },{
        name:translations[language].tabs.orders.filters.receiverAddress,
        action:"receiver_address"
    },{
        name:translations[language].tabs.orders.filters.driverName,
        action:"driver"
    }]

    const searchByDateGroup = [{
        name:translations[language].tabs.orders.filters.today,
        action:"today"
    },{
        name:translations[language].tabs.orders.filters.yesterday,
        action:"yesterday"
    },{
        name:translations[language].tabs.orders.filters.thisWeek,
        action:"this_week"
    },{
        name:translations[language].tabs.orders.filters.thisMonth,
        action:"this_month"
    },{
        name:translations[language].tabs.orders.filters.thisYear,
        action:"this_year"
    },{
        name:translations[language].tabs.orders.filters.selectDate,
        action:"custom"
    }]

    const clearFilters = () => {
        router.setParams({ orderIds: "", orderId: "" });
    };

    const fetchData = async (pageNumber = 1, isLoadMore = false) => {        
        try {
            const queryParams = new URLSearchParams();
            if (!activeSearchBy && searchValue) queryParams.append('search', searchValue);
            if (orderIds) queryParams.append('order_ids', orderIds)
            if (activeFilter) queryParams.append('status', activeFilter);
            if (activeSearchBy) queryParams.append(activeSearchBy.action, searchValue)
            if (activeDate) queryParams.append("date_range", activeDate.action)
            if (activeDate.action === "custom") queryParams.append("start_date", selectedDate)
            if (activeDate.action === "custom") queryParams.append("end_date", selectedDate)
            queryParams.append('page', pageNumber);

            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders?${queryParams.toString()}`, {
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
        if(orderIds){
            setActiveSearchBy(searchByGroup[0]);
        }
    }, [searchValue, activeFilter,activeDate,orderIds,trackChanges]);

    useEffect(()=>{
        if(orderId){
            setSearchValue(orderId);
            setActiveSearchBy(searchByGroup[0]);
        }
    },[orderId]);

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
            showClearFilters={!!orderIds}
            onClearFilters={clearFilters}
            addPaddingSpace={true}
        />
        <View style={styles.section}>
            <OrdersView
                data={data.data || []}
                metadata={data.metadata}
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