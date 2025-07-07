import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Pressable, StatusBar, Image, Platform } from "react-native";
import ModalPresentation from "../../components/ModalPresentation";
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import { useAuth } from "../../RootLayout";
import { router } from "expo-router";
import Search from "../../components/search/Search";
import FlatListData from "../../components/FlatListData";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useSocket } from '../../utils/socketContext';
import { getToken } from "../../utils/secureStore";
import { LinearGradient } from 'expo-linear-gradient';
import { useRTLStyles } from '../../utils/RTLWrapper';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';

export default function ComplaintsScreen() {
  const socket = useSocket();
  const { language } = useLanguage();
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
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
  const rtl = useRTLStyles();
  
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
      // const token = await getToken("userToken");
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
            // "Cookie": token ? `token=${token}` : ""
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
      }
    }
  };

  useEffect(() => {
    setPage(1);
    fetchComplaints(1, false);
  }, [searchValue, activeFilter, activeDate, language]);

  const handleChangeStatus = async (item) => {
    try {
      // const token = await getToken("userToken");
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/complaints/${item.complaint_id}?language_code=${language}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          // "Cookie": token ? `token=${token}` : ""
        },
        body: JSON.stringify({ status: "closed" }),
      });
      // Refresh the list after updating the status
      fetchComplaints(1, false);
      setShowControl(false);
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
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(26, 26, 26, 0.9)' : 'rgba(255, 255, 255, 0.9)' }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.statusBarBg} />
        <View style={[styles.spinnerContainer, { backgroundColor: colors.card }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
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
          style={({ pressed }) => [
            styles.cardPressable, 
            pressed && styles.cardPressed
          ]}
          android_ripple={{ color: 'rgba(0, 0, 0, 0.05)' }}
        >
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card }]}
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: `/(complaints)/complaint`,
                params: { complaintId: item.complaint_id }
              })
            }
          >
            <View style={[styles.cardHeader]}>
              <View style={[
                styles.complaintInfo,
                {
                  ...Platform.select({
                    ios: {
                      flexDirection: "column",
                      alignItems: rtl.isRTL ? "flex-start" : ""
                    }
                  }),
                }
              ]}>
                <Text style={[styles.subject, { color: colors.text }]} numberOfLines={1}>
                  {item.subject}
                </Text>
                <View style={[styles.complaintMeta]}>
                  <View style={[styles.metaItem]}>
                    <Feather name="hash" size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.complaint_id}</Text>
                  </View>
                  <View style={[styles.metaItem]}>
                    <Feather name="package" size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>#{item.order_case_id}</Text>
                  </View>
                  <View style={[styles.metaItem]}>
                    <Feather name="calendar" size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatDate(item.created_at)}</Text>
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
            
            <Text style={[
              styles.description,
              { color: colors.textSecondary },
              {
                ...Platform.select({
                  ios: {
                    flexDirection: "column",
                    textAlign: rtl.isRTL ? "left" : ""
                  }
                }),
              }
            ]} numberOfLines={2}>
              {item.description}
            </Text>
            
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              {item.created_by && (
                <View style={[styles.userInfo]}>
                  <View style={[styles.userIconContainer, { backgroundColor: isDark ? 'rgba(108, 142, 255, 0.15)' : 'rgba(67, 97, 238, 0.1)' }]}>
                    <Feather name="user" size={14} color={colors.primary} />
                  </View>
                  <Text style={[styles.userName, { color: colors.textSecondary }]}>{item.created_by}</Text>
                </View>
              )}
              <View style={[styles.viewDetailsContainer]}>
                <Text style={[styles.viewDetails, { color: colors.primary }]}>
                  {translations[language]?.complaints?.viewDetails || 'View Details'}
                </Text>
                <MaterialIcons 
                  name={rtl.isRTL ? "chevron-left" : "chevron-right"} 
                  size={20} 
                  color={colors.primary} 
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
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {translations[language]?.complaints?.noComplaints || 'No Complaints Found'}
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {translations[language]?.complaints?.noComplaintsDesc || 'There are no complaints matching your filters.'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.statusBarBg} />
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
      
      {/* Modal for actions */}
      {showControl && selectedComplaint && (
        <ModalPresentation
          showModal={showControl}
          setShowModal={setShowControl}
          customStyles={{ bottom: 15 }}
        >
          <View style={[styles.controlModal, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {translations[language]?.complaints?.actions || 'Actions'}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowControl(false)}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Feather name="x" size={22} color={colors.iconDefault} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.actionButton]}
              onPress={() => handleChangeStatus(selectedComplaint)}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(108, 142, 255, 0.15)' : 'rgba(67, 97, 238, 0.1)' }]}>
                <Ionicons name="checkmark-done-circle-outline" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>
                {translations[language]?.complaints?.markAsResolved || 'Mark as Resolved'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton]}
              onPress={() => {
                setShowControl(false);
                router.push({
                  pathname: `/(complaints)/complaint`,
                  params: { complaintId: selectedComplaint.complaint_id }
                });
              }}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(108, 142, 255, 0.15)' : 'rgba(67, 97, 238, 0.1)' }]}>
                <Feather name="message-square" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>
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
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 10
  },
  complaintInfo: {
    flex: 1
  },
  subject: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  complaintMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 4
  },
  metaText: {
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4
  },
  statusText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
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
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  userName: {
    fontSize: 13,
    fontWeight: "500",
  },
  viewDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetails: {
    fontSize: 13,
    fontWeight: "600",
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
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  spinnerContainer: {
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
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
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
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "500",
  },
});