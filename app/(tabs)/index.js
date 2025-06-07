import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl,Platform, StatusBar, ActivityIndicator, Alert } from "react-native";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import TrackOrder from "../../components/TrackOrder";
import Feather from '@expo/vector-icons/Feather';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Octicons from '@expo/vector-icons/Octicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useCallback, useEffect, useState, useRef } from "react";
import useFetch from "../../utils/useFetch";
import { router } from "expo-router";
import { useAuth } from "../../RootLayout";
import { useSocket } from "../../utils/socketContext";
import { LinearGradient } from 'expo-linear-gradient';
import { getToken } from "@/utils/secureStore";
import ModalPresentation from "../../components/ModalPresentation";
import { RTLWrapper, useRTLStyles } from '../../utils/RTLWrapper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';


export default function HomeScreen() {
  const socket = useSocket();
  const { data: { data }, getRequest, isLoading } = useFetch();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [userBalances, setUserBalances] = useState(null);
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [hasWaitingOrders, setHasWaitingOrders] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedType, setSelectedType] = useState('money');
  const [moneyCollections, setMoneyCollections] = useState([]);
  const [packageCollections, setPackageCollections] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  
  
  const rtl = useRTLStyles();
  const scrollViewRef = useRef(null);

  const fetchUserBalance = async () => {
    try {
      // const token = await getToken("userToken");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${user.userId}/balances`, {
        method: "GET",
        credentials: "include",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
            // "Cookie": token ? `token=${token}` : ""
        }
    });
    const data = await res.json();
    setUserBalances(data.data);
    } catch (error) {
    }
  };

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        getRequest("/api/orders/status/totals"),
        fetchUserBalance(),
        checkWaitingOrders()
      ]);
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  }, [language,user]);


  function formatMoney(codValue) {
    if (!codValue || typeof codValue !== 'object') return '';
    const parts = [];
    if ('ILS' in codValue) parts.push(`₪${codValue.ILS}`);
    if ('JOD' in codValue && codValue.JOD !== 0) parts.push(`JD${codValue.JOD}`);
    if ('USD' in codValue && codValue.USD !== 0) parts.push(`$${codValue.USD}`);
    return parts.join(' | ');
  }


  const columnBoxes = [{
    label: translations[language].tabs.index.boxes.todayOrders,
    icon: <Feather name="package" size={24} color="white" />,
    gradientColors: ['#4361EE', '#3A0CA3'],
    numberOfOrders: data?.today_orders?.count,
    money: formatMoney(data?.today_orders?.cod_value),
    orderIds: data?.today_orders?.order_ids
  }, (user.role !== "driver" && user.role !== "delivery_company") ? {
    label: user.role === "business" ? translations[language].tabs.index.boxes.readyMoney : translations[language].tabs.index.boxes.moneyInBranches,
    icon: <MaterialIcons name="attach-money" size={24} color="white" />,
    gradientColors: ['#3A0CA3', '#480CA8'],
    numberOfOrders: data?.money_in_branch_orders?.count,
    money: formatMoney(data?.money_in_branch_orders?.cod_value),
    orderIds: data?.money_in_branch_orders?.order_ids
  } : null, user.role === "business" ? {
    label: translations[language].tabs.index.boxes.readyOrders,
    icon: <Octicons name="package-dependencies" size={24} color="white" />,
    gradientColors: ['#7209B7', '#F72585'],
    numberOfOrders: data?.returned_in_branch_orders?.count,
    orderIds: data?.returned_in_branch_orders?.order_ids
  } : null];

  const boxes = [user.role === "driver" || user.role === "delivery_company" ? { visibility: "hidden" } : {
    label: translations[language].tabs.index.boxes.inWaiting,
    icon: <MaterialIcons name="pending-actions" size={22} color="white" />,
    gradientColors: ['#4CC9F0', '#4361EE'],
    numberOfOrders: data?.waiting_orders?.count,
    money: formatMoney(data?.waiting_orders?.cod_value),
    orderIds: data?.waiting_orders?.order_ids
  }, user.role === "driver" || user.role === "delivery_company" ? { visibility: "hidden" } : {
    label: translations[language].tabs.index.boxes.inBranch,
    icon: <Entypo name="flow-branch" size={22} color="white" />,
    gradientColors: ['#4361EE', '#3A0CA3'],
    numberOfOrders: data?.in_branch_orders?.count,
    money: formatMoney(data?.in_branch_orders?.cod_value),
    orderIds: data?.in_branch_orders?.order_ids
  }, {
    label: translations[language].tabs.index.boxes.onTheWay,
    icon: <Feather name="truck" size={22} color="white" />,
    gradientColors: ['#3A0CA3', '#480CA8'],
    numberOfOrders: data?.on_the_way_orders?.count,
    money: formatMoney(data?.on_the_way_orders?.cod_value),
    orderIds: data?.on_the_way_orders?.order_ids
  }, {
    label: translations[language].tabs.index.boxes.delivered,
    icon: <FontAwesome5 name="user-check" size={22} color="white" />,
    gradientColors: ['#480CA8', '#7209B7'],
    numberOfOrders: data?.delivered_orders?.count,
    money: formatMoney(data?.delivered_orders?.cod_value),
    orderIds: data?.delivered_orders?.order_ids
  }, {
    label: translations[language].tabs.index.boxes.returned,
    icon: <Octicons name="package-dependencies" size={22} color="white" />,
    gradientColors: ['#7209B7', '#F72585'],
    numberOfOrders: data?.returned_orders?.count,
    money: formatMoney(data?.returned_orders?.cod_value),
    orderIds: data?.returned_orders?.order_ids
  }, {
    label: translations[language].tabs.index.boxes.rescheduled,
    icon: <MaterialIcons name="update" size={22} color="white" />,
    gradientColors: ['#4CC9F0', '#4361EE'],
    numberOfOrders: data?.reschedule_orders?.count,
    money: formatMoney(data?.reschedule_orders?.cod_value),
    orderIds: data?.reschedule_orders?.order_ids
  }, {
    label: translations[language].tabs.index.boxes.stuck,
    icon: <MaterialIcons name="running-with-errors" size={22} color="white" />,
    gradientColors: ['#4361EE', '#3A0CA3'],
    numberOfOrders: data?.stuck_orders?.count,
    money: formatMoney(data?.stuck_orders?.cod_value),
    orderIds: data?.stuck_orders?.order_ids
  }, user.role === "driver" ? { visibility: "hidden" } : {
    label: translations[language].tabs.index.boxes.rejected,
    icon: <MaterialIcons name="error-outline" size={22} color="white" />,
    gradientColors: ['#B5179E', '#F72585'],
    numberOfOrders: data?.rejected_orders?.count,
    money: formatMoney(data?.rejected_orders?.cod_value),
    orderIds: data?.rejected_orders?.order_ids
  }];

  useEffect(() => {
    if (!socket) return;
  
    const handleOrderUpdate = (notification) => {
      switch (notification.type) {
        case 'ORDER_CREATED':
        case 'ORDER_UPDATED':
        case 'COLLECTION_CREATED':
        case 'COLLECTION_UPDATED':
        case 'COLLECTION_DELETED':
        case 'STATUS_UPDATED':
          getRequest("/api/orders/status/totals");
          break;
        default:
          break;
      }
    };
  
    socket.on('orderUpdate', handleOrderUpdate);
    socket.on('collectionUpdate', handleOrderUpdate);
  
    return () => {
      socket.off('orderUpdate', handleOrderUpdate);
      socket.off('collectionUpdate', handleOrderUpdate);
    };
  }, [socket]);

  useEffect(() => {
    getRequest("/api/orders/status/totals");
    fetchUserBalance();
  }, [user]);

  const handleGeneralCollectRequest = async (type, action) => {
    setIsProcessing(true);
    try {
      // const token = await getToken("userToken");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/collections/collect/request?requestType=${type}`, {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Language': language,
          // "Cookie": token ? `token=${token}` : ""
        },
        credentials: "include",
        body: JSON.stringify({
          action
        })
      });
      const data = await res.json();
      Alert.alert(data.message);
    } catch (err) {
      Alert.alert(err.message || "Something went wrong");
    } finally {
      setIsProcessing(false);
      setShowMoneyModal(false);
      setShowPackageModal(false);
    }
  };

  // Long press handler for money card
  const handleMoneyLongPress = () => {
    if (user.role === "business") {
      setShowMoneyModal(true);
    }
  };

  // Long press handler for package card
  const handlePackageLongPress = () => {
    if (user.role === "business") {
      setShowPackageModal(true);
    }
  };

  const checkWaitingOrders = async () => {
    try {
      // const token = await getToken("userToken");
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/orders?status_key=waiting&sender_id=${user.userId}`,
        {
          credentials: "include",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            // "Cookie": token ? `token=${token}` : ""
          },
        }
      );
      const response = await res.json();
      if (response.data && response?.data?.length > 0) {
        setHasWaitingOrders(true);
      }
    } catch (error) {
    }
  };

  const fetchDrivers = async () => {
    try {
      // const token = await getToken("userToken");
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/users/business/drivers?business_ids=${user.userId}`,
        {
          credentials: "include",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            // "Cookie": token ? `token=${token}` : ""
          },
        }
      );
      const response = await res.json();
      if (response.status === "success") {
        const currentBusiness = response.data.find(
          biz => biz.business_id === user.userId
        );
        if (currentBusiness) setDrivers(currentBusiness.drivers || []);
      }
    } catch (error) {
    }
  };

  const showDriversModal = () => {
    setShowDriverModal(true);
  };

  const handleDriverSelect = (driverId) => {
    setSelectedDrivers(prev => {
      if (prev.includes(driverId)) {
        return prev.filter(id => id !== driverId);
      } else {
        return [...prev, driverId];
      }
    });
  };

  const handleSendNotification = async () => {
    if (selectedDrivers?.length === 0) {
      Alert.alert(
        translations[language]?.driverNotification?.selectDrivers,
        translations[language]?.driverNotification?.selectDriversMessage
      );
      return;
    }

    setSendingNotification(true);
    try {
      // const token = await getToken("userToken");
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/users/notify/drivers`,
        {
          method: 'POST',
          credentials: "include",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            // "Cookie": token ? `token=${token}` : ""
          },
          body: JSON.stringify({
            business_id: user.userId,
            driver_ids: selectedDrivers,
          }),
        }
      );
      const data = await res.json();

      if (data.message && data.notified_drivers) {
        Alert.alert(
          translations[language]?.driverNotification?.success,
          translations[language]?.driverNotification?.notificationSent
        );
        setShowDriverModal(false);
        setSelectedDrivers([]);
      } else {
        Alert.alert(
          translations[language]?.driverNotification?.error,
          data.message || translations[language]?.driverNotification?.errorMessage
        );
      }
    } catch (error) {
      Alert.alert(
        translations[language]?.driverNotification?.error,
        translations[language]?.driverNotification?.errorMessage
      );
    } finally {
      setSendingNotification(false);
    }
  };

  useEffect(() => {
    if (user.role === "business") {
      checkWaitingOrders();
      fetchDrivers();
    }
  }, [user]);

  const fetchCollections = async () => {
    try {
      setIsLoadingCollections(true);
      // const token = await getToken("userToken");
      const [moneyRes, packageRes] = await Promise.all([
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/collections/business_money?status_key=money_out`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            // "Cookie": token ? `token=${token}` : ""
          }
        }),
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/collections/business_returned?status_key=returned_out`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            // "Cookie": token ? `token=${token}` : ""
          }
        })
      ]);

      const moneyData = await moneyRes.json();
      const packageData = await packageRes.json();

      setMoneyCollections(moneyData.data || []);
      setPackageCollections(packageData.data || []);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to fetch collections");
    } finally {
      setIsLoadingCollections(false);
    }
  };

  const handleCollectionSelect = (collectionId) => {
    setSelectedCollections(prev => {
      if (prev.includes(collectionId)) {
        return prev.filter(id => id !== collectionId);
      } else {
        return [...prev, collectionId];
      }
    });
  };

  const handleCollectionConfirm = async () => {
    if (selectedCollections?.length === 0) {
      Alert.alert(
        translations[language]?.collections?.collection?.error || "Error",
        translations[language]?.collections?.collection?.selectCollections || "Please select collections to confirm"
      );
      return;
    }

    setIsConfirming(true);
    try {
      // const token = await getToken("userToken");
      const updates = {
        collection_ids: selectedCollections,
        status: selectedType === 'money' ? 'paid' : 'returned_delivered',
        note_content: null
      };

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/collections/status`, {
        method: "PUT",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Language': language,
          // "Cookie": token ? `token=${token}` : ""
        },
        credentials: "include",
        body: JSON.stringify({ updates })
      });

      const data = await res.json();

      if (data.failures?.length > 0 && data.successes?.length > 0) {
        Alert.alert(
          translations[language]?.collections?.collection?.partialSuccess,
          `${translations[language]?.collections?.collection?.updatedCollections}: ${data.successes.join(', ')}\n\n${translations[language]?.collections?.collection?.failedCollections}: ${data.failures.map(f => `#${f.collectionId}: ${f.error}`).join('\n')}`
        );
      } else if (data.failures?.length > 0) {
        Alert.alert(
          translations[language]?.collections?.collection?.error,
          data.failures.map(f => `#${f.collectionId}: ${f.error}`).join('\n')
        );
      } else {
        Alert.alert(
          translations[language]?.collections?.collection?.success,
          `${translations[language]?.collections?.collection?.statusUpdated}: ${data.successes.join(', ')}`
        );
      }

      // Reset selections and refresh data
      setSelectedCollections([]);
      fetchCollections();
      onRefresh();
    } catch (err) {
      Alert.alert(
        translations[language]?.collections?.collection?.error,
        err.message || translations[language]?.collections?.collection?.tryAgainLater
      );
    } finally {
      setIsConfirming(false);
    }
  };

  useEffect(() => {
    if (showCollectionsModal) {
      fetchCollections();
    }
  }, [showCollectionsModal]);

  if (isLoading && !data && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4361EE" />
        <Text style={styles.loadingText}>
          {translations[language]?.loading || 'Loading data...'}
        </Text>
      </View>
    );
  }

  return (
    <RTLWrapper>
      <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4361EE"]}
            tintColor="#4361EE"
          />
        }
      >
        {/* Track Order */}
        <View style={styles.trackOrderContainer}>
          <TrackOrder />
        </View>

        {/* Driver Notification Button - Only show for business users with waiting orders */}
        {user.role === "business" && hasWaitingOrders && (
          <View style={styles.driverNotificationContainer}>
            <TouchableOpacity
              style={styles.driverNotificationButton}
              onPress={showDriversModal}
              disabled={sendingNotification}
            >
              <LinearGradient
                colors={['#4361EE', '#3A0CA3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.driverNotificationGradient}
              >
                <Feather name="bell" size={20} color="white" />
                <Text style={styles.driverNotificationText}>
                  {translations[language]?.driverNotification?.title || "Notify Drivers"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary Section */}
        {!["entery","sales_representative","support_agent","warehouse_admin","warehouse_staff"].includes(user.role) && <View style={[styles.sectionHeader]}>
          <Text style={[styles.sectionTitle]}>
            {translations[language]?.tabs.index.summaryTitle || 'Order Summary'}
          </Text>
        </View>}
        
        {!["entery","sales_representative","support_agent","warehouse_admin","warehouse_staff"].includes(user.role) && <View style={styles.cardsSection}>
          {columnBoxes?.filter(box => box !== null).map((box, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.cardTouchable}
              onPress={() => router.push({
                pathname: "/(tabs)/orders",
                params: {
                  orderIds: box?.orderIds?.length > 0 ? box?.orderIds : {}
                }
              })}
              onLongPress={() => {
                // Handle long press based on which card it is
                if (index === 1 && user.role === "business") {  // Money in branch card
                  handleMoneyLongPress();
                } else if (index === 2 && user.role === "business") {  // Returned in branch card
                  handlePackageLongPress();
                }
              }}
              delayLongPress={500}
              activeOpacity={0.85}
            >
              <View style={[
                styles.card, 
              ]}>
                <LinearGradient
                  colors={box.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.iconContainer
                  ]}
                >
                  {box.icon}
                </LinearGradient>
                <View style={styles.cardContent}>
                  <Text style={[[styles.cardTitle,{
                    ...Platform.select({
                      ios: {
                          textAlign:rtl.isRTL ? "left" : "right"
                      }
                  })
                  }]]}>
                    {box.label}
                  </Text>
                  <View style={[styles.statsContainer]}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber,{
                        ...Platform.select({
                          ios: {
                              textAlign:rtl.isRTL ? "left" : "right"
                          }
                      })
                      }]}>
                        {box.numberOfOrders || 0}
                      </Text>
                      <Text style={[styles.statLabel]}>
                        {translations[language].tabs.index.boxes.ofOrders}
                      </Text>
                    </View>
                    {box.money && (
                      <Text style={[styles.moneyText]}>
                        {box.money}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>}

        {/* Balance Section */}
        <View style={[styles.sectionHeader]}>
          <Text style={[styles.sectionTitle]}>
            {translations[language]?.tabs.index.balanceTitle || 'Your Balance'}
          </Text>
        </View>

        <View style={[styles.balanceContainer]}>
          {userBalances?.ILS !== undefined && (
            <TouchableOpacity
              style={styles.balanceCardStretch}
              activeOpacity={0.8}
              onPress={() => router.push({
                pathname: "/(balance)",
                params: { currency: 'ILS',value:userBalances?.ILS }
              })}
            >
              <LinearGradient
                colors={['#4CC9F0', '#4361EE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceGradient}
              >
                <View style={[styles.balanceHeader]}>
                  <View style={styles.currencyIconContainer}>
                    <FontAwesome name="shekel" size={24} color="white" />
                  </View>
                  <Text style={styles.balanceCurrencyText}>ILS</Text>
                </View>
                <Text style={styles.balanceAmount}>₪{userBalances?.ILS || 0}</Text>
                <View style={styles.balanceFooter}>
                  <Text style={styles.balanceLabel}>
                    {translations[language]?.tabs?.index?.balance?.available || 'Available Balance'}
                  </Text>
                  <View style={styles.arrowContainer}>
                    <AntDesign name={rtl ? "arrowleft" : "arrowright"} size={16} color="white" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          {userBalances?.USD !== undefined && (
            <TouchableOpacity
              style={styles.balanceCard}
              activeOpacity={0.8}
              onPress={() => router.push({
                pathname: "/(balance)",
                params: { currency: 'USD',value:userBalances?.USD }
              })}
            >
              <LinearGradient
                colors={['#3A0CA3', '#480CA8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceGradient}
              >
                <View style={[styles.balanceHeader]}>
                  <View style={styles.currencyIconContainer}>
                    <FontAwesome name="dollar" size={24} color="white" />
                  </View>
                  <Text style={styles.balanceCurrencyText}>USD</Text>
                </View>
                <Text style={styles.balanceAmount}>${userBalances?.USD || 0}</Text>
                <View style={styles.balanceFooter}>
                  <Text style={styles.balanceLabel}>
                    {translations[language]?.tabs?.index?.balance?.available || 'Available Balance'}
                  </Text>
                  <View style={styles.arrowContainer}>
                    <AntDesign name={rtl.isRTL ? "arrowleft" : "arrowright"} size={16} color="white" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          {userBalances?.JOD !== undefined && (
            <TouchableOpacity
              style={styles.balanceCard}
              activeOpacity={0.8}
              onPress={() => router.push({
                pathname: "/(balance)",
                params: { currency: 'JOD',value:userBalances?.JOD }
              })}
            >
              <LinearGradient
                colors={['#7209B7', '#F72585']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceGradient}
              >
                <View style={[styles.balanceHeader]}>
                  <View style={styles.currencyIconContainer}>
                    <Text style={styles.currencyCustomText}>JD</Text>
                  </View>
                  <Text style={styles.balanceCurrencyText}>JOD</Text>
                </View>
                <Text style={styles.balanceAmount}>JD{userBalances?.JOD || 0}</Text>
                <View style={styles.balanceFooter}>
                  <Text style={styles.balanceLabel}>
                    {translations[language]?.tabs?.index?.balance?.available || 'Available Balance'}
                  </Text>
                  <View style={styles.arrowContainer}>
                    <AntDesign name={rtl.isRTL ? "arrowleft" : "arrowright"} size={16} color="white" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Collections Section */}
        {user.role === "business" && (
          <>
            <View style={[styles.sectionHeader]}>
              <Text style={[styles.sectionTitle]}>
                {translations[language]?.collections?.collection?.confirmTitle}
              </Text>
            </View>

            <View style={styles.collectionsContainer}>
              <TouchableOpacity
                style={styles.collectionCard}
                onPress={() => setShowCollectionsModal(true)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#4361EE', '#3A0CA3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.collectionGradient}
                >
                  <View style={styles.collectionIconContainer}>
                    <FontAwesome6 name="money-bill-trend-up" size={24} color="white" />
                  </View>
                  <View style={styles.collectionArrow}>
                    <Text style={styles.collectionSubtitle}>
                      {translations[language]?.collections?.collection?.actions}
                    </Text>
                    <AntDesign name={"arrowleft"} size={20} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <ModalPresentation
              showModal={showCollectionsModal}
              setShowModal={setShowCollectionsModal}
              position="bottom"
              customStyles={{ maxHeight: '90%' }}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderText}>
                    {translations[language]?.collections?.collection?.pendingConfirmations}
                  </Text>
                </View>

                <View style={styles.tabsContainer}>
                  <TouchableOpacity
                    style={[styles.tab, selectedType === 'money' && styles.activeTab]}
                    onPress={() => {
                      setSelectedType('money');
                      setSelectedCollections([]);
                    }}
                  >
                    <Text style={[styles.tabText, selectedType === 'money' && styles.activeTabText]}>
                      {translations[language]?.collections?.collection?.moneyCollections}
                    </Text>
                    {moneyCollections?.length > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{moneyCollections?.length}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, selectedType === 'package' && styles.activeTab]}
                    onPress={() => {
                      setSelectedType('package');
                      setSelectedCollections([]);
                    }}
                  >
                    <Text style={[styles.tabText, selectedType === 'package' && styles.activeTabText]}>
                      {translations[language]?.collections?.collection?.packageCollections}
                    </Text>
                    {packageCollections?.length > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{packageCollections?.length}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {isLoadingCollections ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4361EE" />
                  </View>
                ) : (
                  <ScrollView style={styles.collectionsScroll}>
                    {(selectedType === 'money' ? moneyCollections : packageCollections)?.length === 0 ? (
                      <View style={styles.noDataContainer}>
                        <Ionicons name="information-circle-outline" size={48} color="#64748B" />
                        <Text style={styles.noDataText}>
                          {translations[language]?.collections?.collection?.noCollectionsToConfirm}
                        </Text>
                      </View>
                    ) : (
                      (selectedType === 'money' ? moneyCollections : packageCollections).map((collection) => (
                        <TouchableOpacity
                          key={collection.collection_id}
                          style={[
                            styles.collectionItem,
                            selectedCollections.includes(collection.collection_id) && styles.selectedCollectionItem
                          ]}
                          onPress={() => handleCollectionSelect(collection.collection_id)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.collectionItemHeader}>
                            <View style={styles.collectionIdContainer}>
                              <Text style={styles.collectionIdLabel}>
                                {translations[language]?.collections?.collection?.collectionId}:
                              </Text>
                              <Text style={styles.collectionId}>#{collection.collection_id}</Text>
                            </View>
                            <View style={styles.orderCountContainer}>
                              <Text style={styles.orderCount}>
                                {collection.number_of_orders} {translations[language]?.collections?.collection?.orders}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.collectionItemBody}>
                            <View style={styles.orderIdsContainer}>
                              <Text style={styles.orderIdsLabel}>
                                {translations[language]?.collections?.collection?.orderIds}:
                              </Text>
                              <Text style={styles.orderIds}>
                                {Array.isArray(collection.order_ids) ? collection.order_ids.join(', ') : collection.order_ids || '-'}
                              </Text>
                            </View>
                            <View style={styles.valueContainer}>
                              <Text style={styles.valueLabel}>
                                {translations[language]?.collections?.collection?.totalNetValue}:
                              </Text>
                              <Text style={styles.value}>{collection.total_net_value}</Text>
                            </View>
                          </View>

                          {selectedCollections.includes(collection.collection_id) && (
                            <View style={styles.checkmarkContainer}>
                              <Ionicons name="checkmark-circle" size={24} color="#4361EE" />
                            </View>
                          )}
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                )}

                {(selectedType === 'money' ? moneyCollections : packageCollections)?.length > 0 && (
                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={[styles.confirmButton, selectedCollections?.length === 0 && styles.disabledButton]}
                      onPress={handleCollectionConfirm}
                      disabled={isConfirming || selectedCollections?.length === 0}
                    >
                      {isConfirming ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <>
                          <MaterialIcons name="cloud-done" size={20} color="white" />
                          <Text style={styles.confirmButtonText}>
                            {selectedType === 'money'
                              ? translations[language]?.collections?.collection?.confirmPayment
                              : translations[language]?.collections?.collection?.confirmDelivery}
                            {selectedCollections.length > 0 && ` (${selectedCollections.length})`}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ModalPresentation>
          </>
        )}

        {/* Status Section */}
        {!["entery","sales_representative","support_agent","warehouse_admin","warehouse_staff"].includes(user.role) && <View style={[styles.sectionHeader]}>
          <Text style={[styles.sectionTitle]}>
            {translations[language]?.tabs.index.statusTitle || 'Status Overview'}
          </Text>
        </View>}
        
        {!["entery","sales_representative","support_agent","warehouse_admin","warehouse_staff"].includes(user.role) && <View style={styles.statusRowsContainer}>
          {(boxes)?.map((box, index) => {
            if (box.visibility === "hidden") return null;
            
            // Calculate progress percentage (capped at 100%)
            const totalOrders = data?.total_orders?.count || 100;
            const progressPercentage = Math.min(((box.numberOfOrders || 0) / totalOrders) * 100, 100);
            
            return (
              <TouchableOpacity 
                key={index}
                style={[styles.statusRow]}
                onPress={() => router.push({
                  pathname: "/(tabs)/orders",
                  params: {
                    orderIds: box?.orderIds?.length > 0 ? box?.orderIds : {}
                  }
                })}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={box.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.rowIconContainer}
                >
                  {box.icon}
                </LinearGradient>
                
                <View style={styles.rowContent}>
                  <View style={styles.rowTitleContainer}>
                    <Text style={styles.rowTitle}>{box.label}</Text>
                    <Text style={styles.rowCount}>{box.numberOfOrders || 0}</Text>
                  </View>
                  
                  {/* Progress bar */}
                  <View style={styles.progressContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { width: `${progressPercentage}%` }
                      ]} 
                    >
                      <LinearGradient
                        colors={box.gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.progressGradient}
                      />
                    </View>
                  </View>
                  
                  {box.money && (
                    <Text style={styles.rowMoney}>{box.money}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>}
      </ScrollView>
      
      {/* Money Request Modal */}
      <ModalPresentation 
        showModal={showMoneyModal} 
        setShowModal={setShowMoneyModal}
        position="bottom"
      >
        <View style={styles.modalHeader}>
          <Text style={[styles.modalHeaderText]}>
            {translations[language]?.collections?.collection?.actions}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.modalOption]}
          onPress={() => handleGeneralCollectRequest("money", "prepare")}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#4361EE" size="small" />
          ) : (
            <>
              <View style={[
                styles.modalIconContainer,
                { backgroundColor: '#4361EE' }
              ]}>
                <MaterialIcons name="payments" size={18} color="#ffffff" />
              </View>
              <Text style={[styles.modalOptionText]}>
                {translations[language]?.collections?.collection?.prepare_money || 'Prepare Money'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.modalOption]}
          onPress={() => handleGeneralCollectRequest("money", "send")}
          disabled={isProcessing}
        >
          <View style={[
            styles.modalIconContainer,
            { backgroundColor: '#F72585' }
          ]}>
            <Feather name="send" size={18} color="#ffffff" />
          </View>
          <Text style={[styles.modalOptionText]}>
            {translations[language]?.collections?.collection?.send_money || 'Send Money'}
          </Text>
        </TouchableOpacity>
      </ModalPresentation>
      
      {/* Package Request Modal */}
      <ModalPresentation 
        showModal={showPackageModal} 
        setShowModal={setShowPackageModal}
        position="bottom"
      >
        <View style={styles.modalHeader}>
          <Text style={[styles.modalHeaderText]}>
            {translations[language]?.collections?.collection?.actions}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.modalOption]}
          onPress={() => handleGeneralCollectRequest("package", "prepare")}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#4361EE" size="small" />
          ) : (
            <>
              <View style={[
                styles.modalIconContainer,
                { backgroundColor: '#4361EE' }
              ]}>
                <MaterialIcons name="inventory" size={18} color="#ffffff" />
              </View>
              <Text style={[styles.modalOptionText]}>
                {translations[language]?.collections?.collection?.prepare_package || 'Prepare Package'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.modalOption]}
          onPress={() => handleGeneralCollectRequest("package", "send")}
          disabled={isProcessing}
        >
          <View style={[
            styles.modalIconContainer,
            { backgroundColor: '#F72585' }
          ]}>
            <Feather name="send" size={18} color="#ffffff" />
          </View>
          <Text style={[styles.modalOptionText]}>
            {translations[language]?.collections?.collection?.send_package || 'Send Package'}
          </Text>
        </TouchableOpacity>
      </ModalPresentation>

      {/* Driver Selection Modal */}
      <ModalPresentation 
        showModal={showDriverModal} 
        setShowModal={setShowDriverModal}
        position="bottom"
      >
        <View style={styles.modalHeader}>
          <Text style={[styles.modalHeaderText]}>
            {translations[language]?.driverNotification?.title || "Notify Drivers"}
          </Text>
        </View>

        <ScrollView style={styles.driversList}>
          {drivers.map((driver) => (
            <TouchableOpacity
              key={driver.driver_id}
              style={[
                styles.driverItem
              ]}
              onPress={() => handleDriverSelect(driver.driver_id)}
            >
              <View style={[
                styles.checkboxContainer,
                selectedDrivers.includes(driver.driver_id) && styles.checkboxSelected
              ]}>
                {selectedDrivers.includes(driver.driver_id) && (
                  <Feather name="check" size={16} color="white" />
                )}
              </View>
              <View style={styles.driverInfo}>
                <Text style={[styles.driverName]}>
                  {driver.name}
                </Text>
                <Text style={[styles.driverPhone]}>
                  {driver.phone}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => {
              setShowDriverModal(false);
              setSelectedDrivers([]);
            }}
          >
            <Text style={styles.cancelButtonText}>
              {translations[language]?.driverNotification?.cancel || "Cancel"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.sendButton]}
            onPress={handleSendNotification}
            disabled={sendingNotification}
          >
            {sendingNotification ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>
                {translations[language]?.driverNotification?.send || "Send"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ModalPresentation>
    </View>
    </RTLWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 110,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4B5563',
  },
  headerWrapper: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 8,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 15,
    color: '#64748B',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4361EE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  trackOrderContainer: {
    marginHorizontal: 20,
    marginTop: 32,
    marginBottom: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 25,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  cardsSection: {
    paddingHorizontal: 20,
  },
  cardTouchable: {
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    gap:10,
    borderRadius: 20,
    paddingHorizontal:10,
    paddingVertical:12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'column',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  moneyText: {
    fontSize: 14,
    color: '#4361EE',
    fontWeight: '600',
  },
  statusGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  statusGridCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  statusCardHeader: {
    padding: 16,
    paddingBottom: 14,
  },
  statusHeaderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    marginTop: 8,
  },
  statusCardContent: {
    padding: 16,
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusCount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  statusMoney: {
    fontSize: 14,
    color: '#4361EE',
    fontWeight: '600',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    marginTop: 4,
  },
  balanceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  balanceCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceCardStretch:{
    width: '100%',
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceGradient: {
    padding: 16,
    minHeight: 150,
    justifyContent: 'space-between',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyCustomText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  balanceCurrencyText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 10,
    textAlign:"center"
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  modalHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    gap: 10,
  },
  modalIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  driverNotificationContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  driverNotificationButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  driverNotificationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  driverNotificationText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  driversList: {
    maxHeight: 400,
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4361EE',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4361EE',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 14,
    color: '#64748B',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#4361EE',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusRowsContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    overflow: 'hidden',
    height: 65,
  },
  rowIconContainer: {
    width: 50,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rowTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  rowMoney: {
    fontSize: 12,
    color: '#4361EE',
    fontWeight: '500',
    marginTop: 2,
  },
  rowCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    marginBottom: 6,
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressGradient: {
    height: '100%',
    width: '100%',
  },
  collectionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  collectionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  collectionGradient: {
    padding: 20,
    minHeight: 140,
  },
  collectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  collectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  collectionSubtitle: {
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color:"#fff",
    borderRadius: 18,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  collectionArrow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 36,
  },
  modalContent: {
    maxHeight: '90%',
    backgroundColor: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    gap:7
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap:5
  },
  activeTab: {
    backgroundColor: '#EEF2FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#4361EE',
  },
  badge: {
    backgroundColor: '#4361EE',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  collectionsScroll: {
    maxHeight: 400,
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  collectionItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCollectionItem: {
    borderColor: '#4361EE',
    backgroundColor: '#EEF2FF',
  },
  collectionItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  collectionIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collectionIdLabel: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 4,
  },
  collectionId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  orderCountContainer: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderCount: {
    fontSize: 12,
    color: '#4361EE',
    fontWeight: '500',
  },
  collectionItemBody: {
    gap: 8,
  },
  orderIdsContainer: {
    marginBottom: 8,
  },
  orderIdsLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  orderIds: {
    fontSize: 14,
    color: '#1F2937',
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4361EE',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  confirmButton: {
    backgroundColor: '#4361EE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#A5B4FC',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});