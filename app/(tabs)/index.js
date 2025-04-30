import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl, StatusBar, Image, I18nManager, ActivityIndicator } from "react-native";
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
import { useAuth } from "../_layout";
import { useSocket } from "../../utils/socketContext";
import { LinearGradient } from 'expo-linear-gradient';
import { getToken } from "@/utils/secureStore";

export default function HomeScreen() {
  const socket = useSocket();
  const { data: { data }, getRequest, isLoading } = useFetch();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [userBalances, setUserBalances] = useState(null);
  
  const isRTL = language === 'ar' || language === 'he';
  const scrollViewRef = useRef(null);

  const fetchUserBalance = async () => {
    try {
      const token = await getToken("userToken");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${user.userId}/balances`, {
        method: "GET",
        credentials: "include",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
            "Cookie": token ? `token=${token}` : ""
        }
    });
    const data = await res.json();
    setUserBalances(data.data);
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        getRequest("/api/orders/status/totals"),
        fetchUserBalance()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [language]);

  function formatMoney(codValue) {
    if (!codValue || typeof codValue !== 'object') return '';
    const parts = [];
    if ('ILS' in codValue) parts.push(`₪${codValue.ILS}`);
    if ('JOD' in codValue) parts.push(`JD${codValue.JOD}`);
    if ('USD' in codValue) parts.push(`$${codValue.USD}`);
    return parts.join(' | ');
  }

  const columnBoxes = [{
    label: translations[language].tabs.index.boxes.todayOrders,
    icon: <Feather name="package" size={24} color="white" />,
    gradientColors: ['#4361EE', '#3A0CA3'],
    numberOfOrders: data?.today_orders?.count,
    money: formatMoney(data?.today_orders?.cod_value),
    orderIds: data?.today_orders?.order_ids
  }, {
    label: user.role === "business" ? translations[language].tabs.index.boxes.readyMoney : translations[language].tabs.index.boxes.moneyInBranches,
    icon: <MaterialIcons name="attach-money" size={24} color="white" />,
    gradientColors: ['#3A0CA3', '#480CA8'],
    numberOfOrders: data?.money_in_branch_orders?.count,
    money: formatMoney(data?.money_in_branch_orders?.cod_value),
    orderIds: data?.money_in_branch_orders?.order_ids
  }, user.role === "business" ? {
    label: translations[language].tabs.index.boxes.readyOrders,
    icon: <Octicons name="package-dependencies" size={24} color="white" />,
    gradientColors: ['#7209B7', '#F72585'],
    numberOfOrders: data?.returned_in_branch_orders?.count,
    money: formatMoney(data?.returned_in_branch_orders?.cod_value),
    orderIds: data?.returned_in_branch_orders?.order_ids
  } : {
    label: user.role === "driver" ? translations[language].tabs.index.boxes.moneyWithDriver : translations[language].tabs.index.boxes.moneyWithDrivers,
    icon: <Feather name="truck" size={24} color="white" />,
    gradientColors: ['#7209B7', '#F72585'],
    numberOfOrders: data?.delivered_orders?.count,
    money: formatMoney(data?.delivered_orders?.cod_value),
    orderIds: data?.delivered_orders?.order_ids
  }];

  const boxes = [user.role === "driver" ? { visibility: "hidden" } : {
    label: translations[language].tabs.index.boxes.inWaiting,
    icon: <MaterialIcons name="pending-actions" size={22} color="white" />,
    gradientColors: ['#4CC9F0', '#4361EE'],
    numberOfOrders: data?.waiting_orders?.count,
    money: formatMoney(data?.waiting_orders?.cod_value),
    orderIds: data?.waiting_orders?.order_ids
  }, user.role === "driver" ? { visibility: "hidden" } : {
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
  }, []);


  useEffect(() => {
    // Force RTL layout for the component
    const originalRTL = I18nManager.isRTL;
    if (isRTL && !I18nManager.isRTL) {
      I18nManager.forceRTL(true);
    }
    
    return () => {
      // Restore original RTL setting when component unmounts
      if (I18nManager.isRTL !== originalRTL) {
        I18nManager.forceRTL(originalRTL);
      }
    };
  }, [isRTL]);

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

        {/* Balance Section */}
        <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
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
                <View style={[styles.balanceHeader, isRTL && {flexDirection:"row-reverse"}]}>
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
                    <AntDesign name={isRTL ? "arrowleft" : "arrowright"} size={16} color="white" />
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
                <View style={[styles.balanceHeader,isRTL && {flexDirection:"row-reverse"}]}>
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
                    <AntDesign name={isRTL ? "arrowleft" : "arrowright"} size={16} color="white" />
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
                <View style={[styles.balanceHeader,isRTL && {flexDirection:"row-reverse"}]}>
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
                    <AntDesign name={isRTL ? "arrowleft" : "arrowright"} size={16} color="white" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Summary Section */}
        <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
            {translations[language]?.tabs.index.summaryTitle || 'Order Summary'}
          </Text>
        </View>
        
        <View style={styles.cardsSection}>
          {columnBoxes?.map((box, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.cardTouchable}
              onPress={() => router.push({
                pathname: "/(tabs)/orders",
                params: {orderIds: box.orderIds?.length > 0 ? box.orderIds : "0"}
              })}
              activeOpacity={0.85}
            >
              <View style={[
                styles.card, 
                isRTL ? styles.cardRTL : styles.cardLTR
              ]}>
                <LinearGradient
                  colors={box.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.iconContainer,
                    isRTL && styles.iconContainerRTL
                  ]}
                >
                  {box.icon}
                </LinearGradient>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, isRTL && styles.textRTL]}>
                    {box.label}
                  </Text>
                  <View style={[styles.statsContainer, isRTL && styles.statsContainerRTL]}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, isRTL && styles.textRTL]}>
                        {box.numberOfOrders || 0}
                      </Text>
                      <Text style={[styles.statLabel, isRTL && styles.textRTL]}>
                        {translations[language].tabs.index.boxes.ofOrders}
                      </Text>
                    </View>
                    {box.money && (
                      <Text style={[styles.moneyText, isRTL && styles.textRTL]}>
                        {box.money}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Status Section */}
        <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
            {translations[language]?.tabs.index.statusTitle || 'Status Overview'}
          </Text>
        </View>
        
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.horizontalScrollContent,
            { alignItems: 'flex-start' }
          ]}
          contentOffset={{ x: isRTL ? 10000 : 0, y: 0 }}
          onContentSizeChange={(width) => {
            if (isRTL && scrollViewRef.current) {
              scrollViewRef.current.scrollTo({ x: width, animated: false });
            }
          }}
          ref={scrollViewRef}
        >
          {(isRTL ? [...boxes].reverse() : boxes)?.map((box, index) => {
            if (box.visibility === "hidden") return null;
            
            return (
              <TouchableOpacity 
                key={index}
                style={styles.statusCard}
                onPress={() => router.push({
                  pathname: "/(tabs)/orders",
                  params: {orderIds: box.orderIds?.length > 0 ? box.orderIds : "0"}
                })}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={box.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.statusIconContainer}
                >
                  {box.icon}
                </LinearGradient>
                <Text style={[styles.statusTitle, isRTL && styles.textRTL]} numberOfLines={2}>
                  {box.label}
                </Text>
                <Text style={styles.statusCount}>{box.numberOfOrders || 0}</Text>
                {box.money && (
                  <Text style={[styles.statusMoney, isRTL && styles.textRTL]} numberOfLines={1}>
                    {box.money}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  textRTL: {
    textAlign: 'right',
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
    marginTop: 20,
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
  sectionHeaderRTL: {
    flexDirection: 'row-reverse',
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
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardRTL: {
    flexDirection: 'row-reverse',
  },
  cardLTR: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  iconContainerRTL: {
    marginRight: 0,
    marginLeft: 18,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsContainerRTL: {
    flexDirection: 'row-reverse',
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
  statusCard: {
    width: 180,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
    height: 200,
    justifyContent: 'center',
    marginBottom: 5,
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    height: 25,
  },
  statusCount: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  statusMoney: {
    fontSize: 13,
    color: '#4361EE',
    textAlign: 'center',
    fontWeight: '500',
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
});