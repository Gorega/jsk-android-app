import { View,StyleSheet} from 'react-native';
import Search from '../../components/search/Search';
import { useEffect, useState } from 'react';
import {router, useLocalSearchParams} from "expo-router"
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import UsersView from '../../components/users/UsersView';


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

    const filterByGroup = [{
        name:translations[language].users.filters.all,
        action:"",
    },{
        name:translations[language].users.filters.active,
        action:"true",
    },{
        name:translations[language].users.filters.inactive,
        action:"false"
    }]

    const searchByGroup = [{
        name:translations[language].users.filters.userId,
        action:"user_id"
    },{
        name:translations[language].users.filters.name,
        action:"name"
    },{
        name:translations[language].users.filters.commercial,
        action:"comercial_name"
    },{
        name:translations[language].users.filters.email,
        action:"email"
    },{
        name:translations[language].users.filters.phone,
        action:"phone"
    },{
        name:translations[language].users.filters.branch,
        action:"branch"
    },{
        name:translations[language].users.filters.role,
        action:"role"
    },{
        name:translations[language].users.filters.city,
        action:"city"
    },{
        name:translations[language].users.filters.area,
        action:"area"
    },{
        name:translations[language].users.filters.address,
        action:"address"
    }]

    const searchByDateGroup = [{
        name:translations[language].users.filters.today,
        action:"today"
    },{
        name:translations[language].users.filters.yesterday,
        action:"yesterday"
    },{
        name:translations[language].users.filters.thisWeek,
        action:"this_week"
    },{
        name:translations[language].users.filters.thisMonth,
        action:"this_month"
    },{
        name:translations[language].users.filters.thisYear,
        action:"this_year"
    },{
        name:translations[language].users.filters.selectDate,
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