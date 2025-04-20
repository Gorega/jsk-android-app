import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Pressable } from "react-native";
import ModalPresentation from "../../components/ModalPresentation";
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from "../_layout";
import { router } from "expo-router";
import Search from "../../components/search/Search";
import FlatListData from "../../components/FlatListData";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useSocket } from '../../utils/socketContext';

export default function ComplaintsScreen() {
  const socket = useSocket();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showControl, setShowControl] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeSearchBy, setActiveSearchBy] = useState("");
  const [activeDate, setActiveDate] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const filterByGroup = [
    { name: translations[language].complaints.status.all, action: "all" },
    { name: translations[language].complaints.status.open, action: "open" },
    { name: translations[language].complaints.status.closed, action: "closed" }
  ];

  const searchByGroup = [
    { name: translations[language].complaints.complaintId, action: "complaint_id" },
    { name: translations[language].complaints.orderId, action: "order_id" },
    { name: translations[language].complaints.createdBy, action: "business_name" },
    { name: translations[language].complaints.employeeName, action: "employee_name" },
    { name: translations[language].complaints.subject, action: "subject" },
    { name:translations[language].complaints.description, action: "description" }
  ];

  const searchByDateGroup = [{
          name:translations[language].complaints.today,
          action:"today"
      },{
          name:translations[language].complaints.yesterday,
          action:"yesterday"
      },{
          name:translations[language].complaints.thisWeek,
          action:"this_week"
      },{
          name:translations[language].complaints.thisMonth,
          action:"this_month"
      },{
          name:translations[language].complaints.thisYear,
          action:"this_year"
      },{
          name:translations[language].complaints.selectDate,
          action:"custom"
      }]

  const clearFilters = () => {
    router.setParams("");
  };

  // Fetch complaints from the backend
  const fetchComplaints = async (pageNumber = 1, isLoadMore = false) => {
    if (!isLoadMore) setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (!activeSearchBy && searchValue) queryParams.append('search', searchValue);
      if (activeFilter) queryParams.append('status_key', activeFilter === "all" ? "" : activeFilter);
      if (activeSearchBy) queryParams.append(activeSearchBy.action, searchValue);
      if (activeDate) queryParams.append("date_range", activeDate.action);
      if (activeDate.action === "custom") {
        queryParams.append("start_date", selectedDate);
        queryParams.append("end_date", selectedDate);
      }
      queryParams.append('page', pageNumber);
      queryParams.append('language_code', language);

      const businessUserParam = user.role === "business" ? `business_user_id=${user.userId}&` : "";
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/complaints?${businessUserParam}${queryParams.toString()}`,
        { credentials: "include" }
      );
      const newData = await response.json();
      if (isLoadMore && complaints) {
        setComplaints(prev => ({
          ...prev,
          data: [...prev.data, ...newData.data]
        }));
      } else {
        setComplaints(newData);
      }
    } catch (error) {
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more data when the user scrolls to the bottom
  const loadMoreData = async () => {
    if (!loadingMore && complaints?.data?.length > 0) {
      // Check if there's more data to load based on metadata
      if (complaints.data.length >= complaints.metadata.total_records) {
        return;
      }
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      try {
        await fetchComplaints(nextPage, true);
      } catch (error) {
      }
    }
  };

  useEffect(() => {
    setPage(1);
    fetchComplaints(1, false);
  }, [searchValue, activeFilter, activeDate,language]);

  const handleChangeStatus = async (item) => {
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/complaints/${item.complaint_id}?language_code=${language}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "closed" }),
      });
      // Refresh the list after updating the status
      fetchComplaints(1, false);
    } catch (err) {
    }
  };


  useEffect(() => {
    if (!socket) return;

    const handleComplaintUpdate = (notification) => {
      switch (notification.type) {
        case 'COMPLAINT_CREATED':
        case 'COMPLAINT_UPDATED':
        case 'COMPLAINT_MESSAGE_CREATED':
          // Refresh the complaints list
          fetchComplaints(1, false);
          break;
      }
    };

    socket.on('complaintUpdate', handleComplaintUpdate);

    return () => {
      socket.off('complaintUpdate', handleComplaintUpdate);
    };
  }, [socket]);


  const getStatusColor = (status) => {
    switch (status) {
      case "open": return "#FF9800";
      case "closed": return "#4CAF50";
      case "in_progress": return "#F44336";
      default: return "#FF9800";
    }
  };

  if (loading){
    return <View style={styles.overlay}>
        <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color="#F8C332" />
        </View>
    </View>
  }

  return (
    <View style={styles.container}>
      <Search
        searchValue={searchValue}
        setSearchValue={setSearchValue}
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
      <View style={{ marginTop: 25 }}>
        <FlatListData
          list={complaints?.data || []}
          loadMoreData={loadMoreData}
          loadingMore={loadingMore}
          contentContainerStyle={styles.list}
          children={( item ) => {
            return <>
            <Pressable onLongPress={() => setShowControl(true)}>
              <View style={styles.card}>
                <View style={[styles.cardHeader,{flexDirection:["ar","he"].includes(language) ? "row-reverse" : "row"}]}>
                  <Text style={[styles.subject]}>{item.subject}</Text>
                  <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
                <Text style={[styles.description,{textAlign:["ar","he"].includes(language) ? "right" : "left"}]}>{item.description}</Text>
                <View style={[styles.footer,{flexDirection:["ar","he"].includes(language) ? "row-reverse" : "row"}]}>
                  <Text style={styles.orderId}>{translations[language].complaints.orderId}: #{item.order_id}</Text>
                  <TouchableOpacity onPress={() =>
                    router.push({
                      pathname: `/(complaints)/complaint`,
                      params: { complaintId: item.complaint_id }
                    })
                  }>
                    <MaterialIcons name="navigate-next" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
            {(showControl && ["admin", "manager", "support_agent"].includes(user.role)) &&
              <ModalPresentation
                showModal={showControl}
                setShowModal={setShowControl}
                customStyles={{ bottom: 15 }}
              >
                <View style={styles.control}>
                  <TouchableOpacity
                    style={{ flexDirection: "row", gap: 10, alignItems: "center", paddingVertical: 10 }}
                    onPress={() => handleChangeStatus(item)}
                  >
                    <Ionicons name="checkmark-done-circle-outline" size={24} color="black" />
                    <Text style={{ fontWeight: "500" }}>{translations[language].complaints.resolved}</Text>
                  </TouchableOpacity>
                </View>
              </ModalPresentation>
            }
          </>
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subject: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  status: {
    fontSize: 14,
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: {
    fontSize: 12,
    color: "#999",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
  },
  control: {
    padding: 20,
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
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
}
});