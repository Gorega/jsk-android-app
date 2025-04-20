import { StyleSheet,View,Text, ScrollView, TouchableOpacity,RefreshControl } from "react-native";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import TrackOrder from "../../components/TrackOrder";
import Feather from '@expo/vector-icons/Feather';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Octicons from '@expo/vector-icons/Octicons';
import { useCallback, useEffect, useState } from "react";
import useFetch from "../../utils/useFetch";
import { router } from "expo-router";
import { useAuth } from "../_layout";
import { useSocket } from "../../utils/socketContext"


export default function HomeScreen(){
  const socket = useSocket();
  const {data:{data},getRequest} = useFetch();
  const {user} = useAuth();
  const { language } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);


  const onRefresh = useCallback(async () => {
    try {
        setRefreshing(true);
        await getRequest("/api/orders/status/totals");
    } catch (error) {
        console.error('Error refreshing data:', error);
    } finally {
        setRefreshing(false);
    }
}, [language]);

  const columnBoxes = [{
    label:translations[language].tabs.index.boxes.todayOrders,
    icon:<Feather name="package" size={24} color="white" />,
    numberOfOrders:data?.today_orders?.count,
    money:data?.today_orders?.cod_value,
    orderIds:data?.today_orders?.order_ids
  },{
    label:user.role === "business" ? translations[language].tabs.index.boxes.readyMoney : translations[language].tabs.index.boxes.moneyInBranches,
    icon:<MaterialIcons name="attach-money" size={24} color="white" />,
    numberOfOrders:data?.money_in_branch_orders?.count,
    money:data?.money_in_branch_orders?.cod_value,
    orderIds:data?.money_in_branch_orders?.order_ids
  },user.role === "business" ? {
    label:translations[language].tabs.index.boxes.readyOrders,
    icon:<Octicons name="package-dependencies" size={24} color="white" />,
    numberOfOrders:data?.returned_in_branch_orders?.count,
    money:data?.returned_in_branch_orders?.cod_value,
    orderIds:data?.returned_in_branch_orders?.order_ids
  } : {
    label:user.role === "driver" ? translations[language].tabs.index.boxes.moneyWithDriver : translations[language].tabs.index.boxes.moneyWithDrivers,
    icon:<Feather name="truck" size={24} color="white" />,
    numberOfOrders:data?.delivered_orders?.count,
    money:data?.delivered_orders?.cod_value,
    orderIds:data?.delivered_orders?.order_ids
  }]


  const boxes = [user.role === "driver" ? {visibility:"hidden"} : {
    label:translations[language].tabs.index.boxes.inWaiting,
    icon:<MaterialIcons name="pending-actions" size={24} color="#F8C332" />,
    numberOfOrders:data?.waiting_orders?.count,
    money:data?.waiting_orders?.cod_value,
    orderIds:data?.waiting_orders?.order_ids
  },user.role === "driver" ? {visibility:"hidden"} : {
    label:translations[language].tabs.index.boxes.inBranch,
    icon:<Entypo name="flow-branch" size={24} color="#F8C332" />,
    numberOfOrders:data?.in_branch_orders?.count,
    money:data?.in_branch_orders?.cod_value,
    orderIds:data?.in_branch_orders?.order_ids
  },{
    label:translations[language].tabs.index.boxes.onTheWay,
    icon:<Feather name="truck" size={24} color="#F8C332" />,
    numberOfOrders:data?.on_the_way_orders?.count,
    money:data?.on_the_way_orders?.cod_value,
    orderIds:data?.on_the_way_orders?.order_ids
  },{
    label:translations[language].tabs.index.boxes.delivered,
    icon:<FontAwesome5 name="user-check" size={24} color="#F8C332" />,
    numberOfOrders:data?.delivered_orders?.count,
    money:data?.delivered_orders?.cod_value,
    orderIds:data?.delivered_orders?.order_ids
  },{
    label:translations[language].tabs.index.boxes.returned,
    icon:<Octicons name="package-dependencies" size={24} color="#F8C332" />,
    numberOfOrders:data?.returned_orders?.count,
    money:data?.returned_orders?.cod_value,
    orderIds:data?.returned_orders?.order_ids
  },{
    label:translations[language].tabs.index.boxes.rescheduled,
    icon:<MaterialIcons name="update" size={24} color="#F8C332" />,
    numberOfOrders:data?.reschedule_orders?.count,
    money:data?.reschedule_orders?.cod_value,
    orderIds:data?.reschedule_orders?.order_ids
  },{
    label:translations[language].tabs.index.boxes.stuck,
    icon:<MaterialIcons name="running-with-errors" size={24} color="#F8C332" />,
    numberOfOrders:data?.stuck_orders?.count,
    money:data?.stuck_orders?.cod_value,
    orderIds:data?.stuck_orders?.order_ids
  },user.role === "driver" ? {visibility:"hidden"} : {
    label:translations[language].tabs.index.boxes.rejected,
    icon:<MaterialIcons name="error-outline" size={24} color="#F8C332" />,
    numberOfOrders:data?.rejected_orders?.count,
    money:data?.rejected_orders?.cod_value,
    orderIds:data?.rejected_orders?.order_ids
  }]

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
          console.log('Unhandled notification type:', notification.type);
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

  useEffect(()=>{
    getRequest("/api/orders/status/totals");
  },[])

  return <View style={styles.main} >
      <ScrollView
       showsVerticalScrollIndicator={false}
       refreshControl={
        <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#F8C332"]} // Android
            tintColor="#F8C332" // iOS
        />}
      >
      <TrackOrder />
      <View style={styles.section}>
            <View style={styles.ColumnBoxes}>
                {columnBoxes?.map((box,index)=>{
                  return <TouchableOpacity key={index} onPress={()=> router.push({pathname:"/(tabs)/orders",params:{orderIds:box.orderIds.length > 0 ? box.orderIds : "0"}})}>
                      <View style={[styles.ColumnBox,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                        <View style={styles.icon}>
                          {box.icon}
                        </View>
                        <View>
                          <Text style={{fontWeight:"600",textAlign:["he", "ar"].includes(language) ? "right" : "left"}}>{box.label}</Text>
                          <Text style={{textAlign:["he", "ar"].includes(language) ? "right" : "left"}}>{box.numberOfOrders} {translations[language].tabs.index.boxes.ofOrders}</Text>
                          <Text style={{textAlign:["he", "ar"].includes(language) ? "right" : "left"}}>{box.money}₪</Text>
                        </View>
                     </View>
                  </TouchableOpacity>
                })}
            </View>
      </View>
      <View style={styles.section}>
          <ScrollView style={[styles.scrollView,["he", "ar"].includes(language) && {transform: [{ scaleX: -1 }]}]} horizontal={true} showsHorizontalScrollIndicator={false}>
            <View style={[styles.boxes,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row",justifyContent: ["he", "ar"].includes(language) ? 'flex-end' : 'flex-start',transform: ["he", "ar"].includes(language) ? [{ scaleX: -1 }] : [{ scaleX: 1 }]}]}>
                {boxes?.map((box,index)=>{
                  return <TouchableOpacity style={{display:box.visibility === "hidden" ? "none" : ""}} key={index} onPress={()=> router.push({pathname:"/(tabs)/orders",params:{orderIds:box.orderIds.length > 0 ? box.orderIds : "0"}})}>
                      <View style={[styles.box]}>
                        <View style={[styles.boxHead,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                          {box.icon}
                          <Text style={[styles.boxHeadH2,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{box.label}</Text>
                        </View>
                        <Text style={styles.h2}>{box.numberOfOrders}</Text>
                        <Text style={styles.p}>{box.money}₪</Text>
                    </View>
                  </TouchableOpacity>
                })}
            </View>
          </ScrollView>
      </View>
      </ScrollView>
  </View>
}

const styles = StyleSheet.create({
  main:{
    padding:15
  },
  welcome:{
    
  },
  section:{
    marginTop:25
  },
  scrollView:{
    width:"100%",
    height:130,
    display:"flex",
    flexDirection:"row"
  },
  boxes:{
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center",
    gap:10,
  },
  box:{
    justifyContent:"center",
    borderRadius:15,
    boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
    backgroundColor:"white",
    padding:7,
    minHeight:120,
    gap:10,
    width:170
  },
  boxHead:{
    flexDirection:"row",
    alignItems:"center",
    gap:15
  },
  boxHeadH2:{
    fontWeight:"600",
    width:120,
  },
  h2:{
    fontSize:25,
    fontWeight:500,
    textAlign:"center",
    fontWeight:"bold"
  },
  p:{
    fontSize:16,
    fontWeight:500
  },
  ColumnBoxes:{
    flexDirection:"column",
    gap:15
  },
  ColumnBox:{
    flexDirection:"row",
    alignItems:"center",
    gap:15,
    borderRadius:15,
    backgroundColor:"white",
    padding:12,
    boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
  },
  icon:{
    backgroundColor:"#F8C332",
    borderRadius:50,
    width:40,
    height:40,
    display:"flex",
    justifyContent:"center",
    alignItems:"center"
  }

})