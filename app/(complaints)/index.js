import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Pressable } from "react-native";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import ModalPresentation from "../../components/ModalPresentation";
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from "../_layout";
import { router } from "expo-router";
import Search from "../../components/search/Search";
import FlatListData from "../../components/FlatListData";

export default function ComplaintsScreen() {
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
    { name: "All", action: "all" },
    { name: "open", action: "open" },
    { name: "closed", action: "closed" }
  ];

  const searchByGroup = [
    { name: "Complaint ID", action: "complaint_id" },
    { name: "order ID", action: "order_id" },
    { name: "Created By", action: "business_name" },
    { name: "Support Agent", action: "employee_name" },
    { name: "Subject", action: "subject" },
    { name: "Description", action: "description" }
  ];

  const searchByDateGroup = [{
          name:"Today",
          action:"today"
      },{
          name:"Yesterday",
          action:"yesterday"
      },{
          name:"this Week",
          action:"this_week"
      },{
          name:"this Month",
          action:"this_month"
      },{
          name:"this Year",
          action:"this_year"
      },{
          name:"Custom",
          action:"custom"
      }]

  const clearFilters = () => {
    router.setParams("");
  };

  // Fetch complaints from the backend
  const fetchComplaints = async (pageNumber = 1, isLoadMore = false) => {
    try {
      const queryParams = new URLSearchParams();
      if (!activeSearchBy && searchValue) queryParams.append('search', searchValue);
      if (activeFilter) queryParams.append('status', activeFilter === "all" ? "" : activeFilter);
      if (activeSearchBy) queryParams.append(activeSearchBy.action, searchValue);
      if (activeDate) queryParams.append("date_range", activeDate.action);
      if (activeDate.action === "custom") {
        queryParams.append("start_date", selectedDate);
        queryParams.append("end_date", selectedDate);
      }
      queryParams.append('page', pageNumber);

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
      console.error("Error fetching complaints:", error);
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
        console.log("No more data to load");
        return;
      }
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      try {
        await fetchComplaints(nextPage, true);
      } catch (error) {
        console.error("Error loading more data:", error);
      }
    }
  };

  useEffect(() => {
    setPage(1);
    fetchComplaints(1, false);
  }, [searchValue, activeFilter, activeDate]);

  const handleChangeStatus = async (item) => {
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/complaints/${item.complaint_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "closed" }),
      });
      // Refresh the list after updating the status
      fetchComplaints(1, false);
    } catch (err) {
      console.log(err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open": return "#FF9800";
      case "closed": return "#4CAF50";
      case "in_progress": return "#F44336";
      default: return "#FF9800";
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#F8C332" style={styles.loader} />;

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
                <View style={styles.cardHeader}>
                  <Text style={styles.subject}>{item.subject}</Text>
                  <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
                <Text style={styles.description}>{item.description}</Text>
                <View style={styles.footer}>
                  <Text style={styles.orderId}>Order ID: #{item.order_id}</Text>
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
                    <Text style={{ fontWeight: "500" }}>Resolved</Text>
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
});