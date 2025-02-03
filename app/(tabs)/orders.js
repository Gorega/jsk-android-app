import { View,StyleSheet} from 'react-native';
import Search from '../../components/search/Search';
import OrdersView from '../../components/orders/OrdersView';
import { useEffect, useState } from 'react';
import {router, useLocalSearchParams} from "expo-router"
import { useAuth } from '../_layout';

export default function Orders(){
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
        name:"All",
        action:"",
    },{
        name:"Waiting",
        action:"waiting",
    },{
        name:"rejected",
        action:"rejected"
    },{
        name:"in Branch",
        action:"in_branch"
    },{
        name:"in Progress",
        action:"in_progress"
    },{
        name:"stuck",
        action:"stuck"
    },{
        name:"Delayed",
        action:"delayed"
    },{
        name:"On The Way",
        action:"on_the_way"
    },{
        name:"Reschedule",
        action:"reschedule"
    },{
        name:"Return Before Delivered Initiated",
        action:"return_before_delivered_initiated"
    },{
        name:"Return After Delivered Initiated",
        action:"return_after_delivered_initiated"
    },{
        name:"Retuned",
        action:"returned"
    },{
        name:"Returned In Branch",
        action:"returned_in_branch"
    },{
        name:"Returned Out",
        action:"returned_out"
    },{
        name:"Business Returned Delivered",
        action:"business_returned_delivered"
    },{
        name:"Delivered",
        action:"delivered"
    },{
        name:"money In Branch",
        action:"money_in_branch"
    },{
        name:"money Out",
        action:"money_out"
    },{
        name:"business Paid",
        action:"business_paid"
    },{
        name:"completed",
        action:"completed"
    }]

    const searchByGroup = [{
        name:"Order ID",
        action:"order_id"
    },{
        name:"Reference ID",
        action:"reference_id"
    },{
        name:"Sender",
        action:"sender"
    },{
        name:"Receiver Name",
        action:"receiver_name"
    },{
        name:"Receiver Phone",
        action:"receiver_phone"
    },{
        name:"Receiver City",
        action:"receiver_city"
    },{
        name:"Receiver Area",
        action:"receiver_area"
    },{
        name:"Receiver Address",
        action:"receiver_address"
    },{
        name:"Driver Name",
        action:"driver"
    }]

    const searchByDateGroup = [{
        name:"Today",
        action:"today"
    },{
        name:"Yesterday",
        action:"yesterday"
    },{
        name:"This Week",
        action:"this_week"
    },{
        name:"This Month",
        action:"this_month"
    },{
        name:"This Year",
        action:"this_year"
    },{
        name:"Select a Date",
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