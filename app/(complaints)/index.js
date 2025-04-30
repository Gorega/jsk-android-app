import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Pressable, StatusBar, Image } from "react-native";
import ModalPresentation from "../../components/ModalPresentation";
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import { useAuth } from "../_layout";
import { router } from "expo-router";
import Search from "../../components/search/Search";
import FlatListData from "../../components/FlatListData";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useSocket } from '../../utils/socketContext';
import { getToken } from "../../utils/secureStore";
import { LinearGradient } from 'expo-linear-gradient';

export default function ComplaintsScreen() {
  const socket = useSocket();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showControl, setShowControl] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeSearchBy, setActiveSearchBy] = useState("");
  const [activeDate, setActiveDate] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const isRTL = ["ar", "he"].includes(language);

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
    { name: translations[language].complaints.description, action: "description" }
  ];

  const searchByDateGroup = [{
          name: translations[language].complaints.today,
          action: "today"
      },{
          name: translations[language].complaints.yesterday,
          action: "yesterday"
      },{
          name: translations[language].complaints.thisWeek,
          action: "this_week"
      },{
          name: translations[language].complaints.thisMonth,
          action: "this_month"
      },{
          name: translations[language].complaints.thisYear,
          action: "this_year"
      },{
          name: translations[language].complaints.selectDate,
          action: "custom"
      }];

  const clearFilters = () => {
    router.setParams("");
  };

  // Fetch complaints from the backend
  const fetchComplaints = async (pageNumber = 1, isLoadMore = false) => {
    if (!isLoadMore) setLoading(true);
    try {
      const token = await getToken("userToken");
      const queryParams = new URLSearchParams();
      if (!activeSearchBy && searchValue) queryParams.append('search', searchValue);
      if (activeFilter && activeFilter !== "all") queryParams.append('status_key', activeFilter);
      if (activeSearchBy) queryParams.append(activeSearchBy.action, searchValue);
      if (activeDate) queryParams.append("date_range", activeDate.action);
      if (activeDate?.action === "custom") {
        queryParams.append("start_date", selectedDate);
        queryParams.append("end_date", selectedDate);
      }
      queryParams.append('page', pageNumber);
      queryParams.append('language_code', language);

      const businessUserParam = user.role === "business" ? `business_user_id=${user.userId}&` : "";
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/complaints?${businessUserParam}${queryParams.toString()}`,
        { 
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cookie": token ? `token=${token}` : ""
          }
        },
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
      if (complaints.data.length >= complaints.metadata?.total_records) {
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
  }, [searchValue, activeFilter, activeDate, language]);

  const handleChangeStatus = async (item) => {
    try {
      const token = await getToken("userToken");
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/complaints/${item.complaint_id}?language_code=${language}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cookie": token ? `token=${token}` : ""
        },
        body: JSON.stringify({ status: "closed" }),
      });
      // Refresh the list after updating the status
      fetchComplaints(1, false);
      setShowControl(false);
    } catch (err) {
      console.error("Error changing status:", err);
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

  const getStatusInfo = (status) => {
    switch (status) {
      case "open":
        return { 
          color: "#FF9800", 
          icon: "timer-outline",
          gradient: ['#FF9800', '#F57C00']
        };
      case "in_progress":
        return { 
          color: "#3F51B5", 
          icon: "trending-up",
          gradient: ['#3F51B5', '#303F9F']
        };
      case "closed":
        return { 
          color: "#4CAF50", 
          icon: "checkmark-circle-outline",
          gradient: ['#4CAF50', '#388E3C']
        };
      default:
        return { 
          color: "#9E9E9E", 
          icon: "help-circle-outline",
          gradient: ['#9E9E9E', '#757575']
        };
    }
  };

  // Format date for a more friendly display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // If it's today
    if (date >= today) {
      return translations[language]?.complaints?.today || 'Today';
    }
    
    // If it's yesterday
    if (date >= yesterday) {
      return translations[language]?.complaints?.yesterday || 'Yesterday';
    }
    
    // Otherwise return the formatted date
    return date.toLocaleDateString(language, { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <View style={styles.overlay}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color="#4361EE" />
          <Text style={styles.loadingText}>
            {translations[language]?.complaints.loading || 'Loading...'}
          </Text>
        </View>
      </View>
    );
  }

  const renderComplaintCard = (item) => {
    const statusInfo = getStatusInfo(item.status);
    
    return (
      <View style={styles.cardWrapper}>
        <Pressable
          onLongPress={() => {
            if (["admin", "manager", "support_agent"].includes(user.role) && item.status !== "closed") {
              setSelectedComplaint(item);
              setShowControl(true);
            }
          }}
          style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
          android_ripple={{ color: 'rgba(0, 0, 0, 0.05)' }}
        >
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: `/(complaints)/complaint`,
                params: { complaintId: item.complaint_id }
              })
            }
          >
            <View style={[styles.cardHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.complaintInfo, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                <Text style={[styles.subject, { textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>
                  {item.subject}
                </Text>
                <View style={[styles.complaintMeta, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <View style={[styles.metaItem, { marginRight: isRTL ? 0 : 14, marginLeft: isRTL ? 14 : 0 }, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                    <Feather name="hash" size={14} color="#64748B" style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }} />
                    <Text style={styles.metaText}>{item.complaint_id}</Text>
                  </View>
                  <View style={[styles.metaItem, { marginRight: isRTL ? 0 : 14, marginLeft: isRTL ? 14 : 0 }, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                    <Feather name="package" size={14} color="#64748B" style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }} />
                    <Text style={styles.metaText}>#{item.order_case_id}</Text>
                  </View>
                  <View style={[styles.metaItem, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                    <Feather name="calendar" size={14} color="#64748B" style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }} />
                    <Text style={styles.metaText}>{formatDate(item.created_at)}</Text>
                  </View>
                </View>
              </View>
              <LinearGradient
                colors={statusInfo.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.statusBadge}
              >
                <Ionicons name={statusInfo.icon} size={14} color="white" style={{ marginRight: 4 }} />
                <Text style={styles.statusText}>{item.status}</Text>
              </LinearGradient>
            </View>
            
            <Text style={[styles.description, { textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>
              {item.description}
            </Text>
            
            <View style={[styles.footer, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              {item.created_by && (
                <View style={[styles.userInfo, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <View style={styles.userIconContainer}>
                    <Feather name="user" size={14} color="#4361EE" />
                  </View>
                  <Text style={styles.userName}>{item.created_by}</Text>
                </View>
              )}
              <View style={[styles.viewDetailsContainer, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Text style={styles.viewDetails}>
                  {translations[language]?.complaints?.viewDetails || 'View Details'}
                </Text>
                <MaterialIcons 
                  name={isRTL ? "chevron-left" : "chevron-right"} 
                  size={20} 
                  color="#4361EE" 
                />
              </View>
            </View>
          </TouchableOpacity>
        </Pressable>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={""} 
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>
        {translations[language]?.complaints?.noComplaints || 'No Complaints Found'}
      </Text>
      <Text style={styles.emptyText}>
        {translations[language]?.complaints?.noComplaintsDesc || 'There are no complaints matching your filters.'}
      </Text>
      
      <TouchableOpacity
        style={styles.newComplaintButton}
        onPress={() => router.push("/(complaints)/open_complaint")}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#4361EE', '#3A0CA3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.newComplaintGradient}
        >
          <Feather 
            name="plus" 
            size={18} 
            color="#FFFFFF" 
            style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }} 
          />
          <Text style={styles.newComplaintText}>
            {translations[language]?.complaints?.newComplaint || 'New Complaint'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
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
      
      <View style={styles.listContainer}>
        {complaints?.data?.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatListData
            list={complaints?.data || []}
            loadMoreData={loadMoreData}
            loadingMore={loadingMore}
            contentContainerStyle={styles.list}
            renderEmpty={renderEmptyState}
            children={renderComplaintCard}
          />
        )}
      </View>
      
      {/* Floating Action Button for new complaint */}
      {user.role === "business" && complaints?.data?.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { right: isRTL ? null : 20, left: isRTL ? 20 : null }]}
          onPress={() => router.push("/(complaints)/open_complaint")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4361EE', '#3A0CA3']}
            style={styles.fabGradient}
          >
            <Feather name="plus" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
      
      {/* Modal for actions */}
      {showControl && selectedComplaint && (
        <ModalPresentation
          showModal={showControl}
          setShowModal={setShowControl}
          customStyles={{ bottom: 15 }}
        >
          <View style={styles.controlModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {translations[language]?.complaints?.actions || 'Actions'}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowControl(false)}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Feather name="x" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.actionButton, { flexDirection: isRTL ? "row-reverse" : "row" }]}
              onPress={() => handleChangeStatus(selectedComplaint)}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="checkmark-done-circle-outline" size={22} color="#4361EE" />
              </View>
              <Text style={styles.actionText}>
                {translations[language]?.complaints?.markAsResolved || 'Mark as Resolved'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { flexDirection: isRTL ? "row-reverse" : "row" }]}
              onPress={() => {
                setShowControl(false);
                router.push({
                  pathname: `/(complaints)/complaint`,
                  params: { complaintId: selectedComplaint.complaint_id }
                });
              }}
            >
              <View style={styles.actionIconContainer}>
                <Feather name="message-square" size={22} color="#4361EE" />
              </View>
              <Text style={styles.actionText}>
                {translations[language]?.complaints?.respond || 'Respond to Complaint'}
              </Text>
            </TouchableOpacity>
          </View>
        </ModalPresentation>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  listContainer: {
    flex: 1,
    paddingTop: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cardWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  cardPressable: {
    borderRadius: 16,
  },
  cardPressed: {
    opacity: 0.9,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  complaintInfo: {
    flex: 1,
    marginRight: 12,
  },
  subject: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  complaintMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#64748B",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(67, 97, 238, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  userName: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  viewDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetails: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4361EE",
    marginRight: 4,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#4361EE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  spinnerContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
        width: 0,
        height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#4B5563",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyImage: {
    width: 140,
    height: 140,
    marginBottom: 24,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    color: "#64748B",
    marginBottom: 24,
  },
  newComplaintButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#4361EE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  newComplaintGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  newComplaintText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  controlModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(67, 97, 238, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
});