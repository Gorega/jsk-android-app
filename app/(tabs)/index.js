import { StyleSheet,View,Text, ScrollView, TouchableOpacity } from "react-native";
import TrackOrder from "../../components/TrackOrder";
import Feather from '@expo/vector-icons/Feather';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Octicons from '@expo/vector-icons/Octicons';
import { useEffect } from "react";
import useFetch from "../../utils/useFetch";
import { router } from "expo-router";


export default function HomeScreen(){

  const {data:{data},getRequest} = useFetch();

  const columnBoxes = [{
    label:"Today Orders",
    icon:<Feather name="package" size={24} color="white" />,
    numberOfOrders:data?.today_orders?.count,
    money:data?.today_orders?.cod_value,
    orderIds:data?.today_orders?.order_ids
  },{
    label:"Money In Branches",
    icon:<MaterialIcons name="attach-money" size={24} color="white" />,
    numberOfOrders:data?.money_in_branch_orders?.count,
    money:data?.money_in_branch_orders?.cod_value,
    orderIds:data?.money_in_branch_orders?.order_ids
  },{
    label:"Money With Drivers",
    icon:<Feather name="truck" size={24} color="white" />,
    numberOfOrders:data?.delivered_orders?.count,
    money:data?.delivered_orders?.cod_value,
    orderIds:data?.delivered_orders?.order_ids
  }]


  const boxes = [{
    label:"In Waiting",
    icon:<MaterialIcons name="pending-actions" size={24} color="#F8C332" />,
    numberOfOrders:data?.waiting_orders?.count,
    money:data?.waiting_orders?.cod_value,
    orderIds:data?.waiting_orders?.order_ids
  },{
    label:"In Branch",
    icon:<Entypo name="flow-branch" size={24} color="#F8C332" />,
    numberOfOrders:data?.in_branch_orders?.count,
    money:data?.in_branch_orders?.cod_value,
    orderIds:data?.in_branch_orders?.order_ids
  },{
    label:"On The Way",
    icon:<Feather name="truck" size={24} color="#F8C332" />,
    numberOfOrders:data?.on_the_way_orders?.count,
    money:data?.on_the_way_orders?.cod_value,
    orderIds:data?.on_the_way_orders?.order_ids
  },{
    label:"Delivered",
    icon:<FontAwesome5 name="user-check" size={24} color="#F8C332" />,
    numberOfOrders:data?.delivered_orders?.count,
    money:data?.delivered_orders?.cod_value,
    orderIds:data?.delivered_orders?.order_ids
  },{
    label:"Returned",
    icon:<Octicons name="package-dependencies" size={24} color="#F8C332" />,
    numberOfOrders:data?.returned_orders?.count,
    money:data?.returned_orders?.cod_value,
    orderIds:data?.returned_orders?.order_ids
  },{
    label:"Rescheduled",
    icon:<MaterialIcons name="update" size={24} color="#F8C332" />,
    numberOfOrders:data?.reschedule_orders?.count,
    money:data?.reschedule_orders?.cod_value,
    orderIds:data?.reschedule_orders?.order_ids
  },{
    label:"Stuck",
    icon:<MaterialIcons name="running-with-errors" size={24} color="#F8C332" />,
    numberOfOrders:data?.stuck_orders?.count,
    money:data?.stuck_orders?.cod_value,
    orderIds:data?.stuck_orders?.order_ids
  },{
    label:"Rejected",
    icon:<MaterialIcons name="error-outline" size={24} color="#F8C332" />,
    numberOfOrders:data?.rejected_orders?.count,
    money:data?.rejected_orders?.cod_value,
    orderIds:data?.rejected_orders?.order_ids
  }]

  useEffect(()=>{
    getRequest("/api/orders/status/totals");
  },[])

  return <View style={styles.main}>
      <ScrollView showsVerticalScrollIndicator={false}>
      <TrackOrder />
      <View style={styles.section}>
            <View style={styles.ColumnBoxes}>
                {columnBoxes?.map((box,index)=>{
                  return <TouchableOpacity key={index} onPress={()=> router.push({pathname:"/(tabs)/orders",params:{orderIds:box.orderIds.length > 0 ? box.orderIds : "0"}})}>
                      <View style={styles.ColumnBox}>
                        <View style={styles.icon}>
                          {box.icon}
                        </View>
                        <View>
                          <Text>{box.label}</Text>
                          <Text>{box.numberOfOrders} of Orders</Text>
                          <Text>{box.money}₪</Text>
                        </View>
                     </View>
                  </TouchableOpacity>
                })}
            </View>
      </View>
      <View style={styles.section}>
          <ScrollView style={styles.scrollView} horizontal={true} showsHorizontalScrollIndicator={false}>
            <View style={styles.boxes}>
                {boxes?.map((box,index)=>{
                  return <TouchableOpacity key={index} onPress={()=> router.push({pathname:"/(tabs)/orders",params:{orderIds:box.orderIds.length > 0 ? box.orderIds : "0"}})}>
                      <View style={styles.box}>
                        <View style={styles.boxHead}>
                          {box.icon}
                          <Text style={styles.boxHeadH2}>{box.label}</Text>
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
    height:150,
    display:"flex",
    flexDirection:"row"
  },
  boxes:{
    display:"flex",
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center",
    gap:10,
  },
  box:{
    display:"flex",
    justifyContent:"center",
    borderRadius:15,
    boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
    backgroundColor:"white",
    padding:7,
    minHeight:140,
    gap:10,
    width:170
  },
  boxHead:{
    display:"flex",
    flexDirection:"row",
    alignItems:"center",
    gap:15
  },
  boxHeadH2:{
    fontWeight:500,
    width:120,
  },
  h2:{
    fontSize:25,
    fontWeight:500,
    textAlign:"center"
  },
  p:{
    fontSize:16,
    fontWeight:500
  },
  ColumnBoxes:{
    display:"flex",
    flexDirection:"column",
    gap:15
  },
  ColumnBox:{
    display:"flex",
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