import { View,StyleSheet} from 'react-native';
import Search from '../../components/search/Search';
import { useEffect, useState } from 'react';
import {router, useLocalSearchParams} from "expo-router"
import UsersView from '../../components/users/UsersView';


export default function HomeScreen(){

    const [searchValue, setSearchValue] = useState("");
    const [activeFilter, setActiveFilter] = useState("");
    const [activeSearchBy,setActiveSearchBy] = useState("");
    const [activeDate,setActiveDate] = useState("");
    const [selectedDate,setSelectedDate] = useState("");
    const [data,setData] = useState([]);
    const [page,setPage] = useState(1);
    const [loadingMore,setLoadingMore] = useState(false);

    const filterByGroup = [{
        name:"All",
        action:"",
    },{
        name:"Active",
        action:"true",
    },{
        name:"Inactive",
        action:"false"
    }]

    const searchByGroup = [{
        name:"User ID",
        action:"user_id"
    },{
        name:"Name",
        action:"name"
    },{
        name:"Comercial Name",
        action:"comercial_name"
    },{
        name:"Email",
        action:"email"
    },{
        name:"Phone",
        action:"phone"
    },{
        name:"Branch",
        action:"branch"
    },{
        name:"Role",
        action:"role"
    },{
        name:"City",
        action:"city"
    },{
        name:"Area",
        action:"area"
    },{
        name:"Address",
        action:"address"
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
        router.setParams("");
    };

    const fetchData = async (pageNumber = 1, isLoadMore = false)=>{
        try {
            const queryParams = new URLSearchParams();
            if (!activeSearchBy && searchValue) queryParams.append('search', searchValue);
            if (activeFilter) queryParams.append('active_status', activeFilter);
            if (activeSearchBy) queryParams.append(activeSearchBy.action, searchValue)
            if (activeDate) queryParams.append("date_range", activeDate.action)
            if (activeDate.action === "custom") queryParams.append("start_date", selectedDate)
            if (activeDate.action === "custom") queryParams.append("end_date", selectedDate)
            queryParams.append('page', pageNumber);
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users?${queryParams.toString()}`, {
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
    }, [searchValue, activeFilter,activeDate]);


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
        showScanButton={false}
    />
    <View style={styles.section}>
        <UsersView
            data={data.data || []}
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