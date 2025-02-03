import { View,StyleSheet,Text, TouchableOpacity, Pressable} from 'react-native';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';
import ModalPresentation from '../ModalPresentation';
import AntDesign from '@expo/vector-icons/AntDesign';
import { router } from 'expo-router';

export default function Order({user,order}){

    const [showControl,setShowControl] = useState(false);

    return <>
        <Pressable onPress={()=> router.push("(track)")} onLongPress={()=> setShowControl(true)}>
            <View style={styles.order}>
        <View style={styles.head}>
            <View style={styles.box}>
                <Text style={{textAlign:"center"}}># {order.order_id}</Text>
            </View>
            <View style={[styles.box,styles.status,{borderWidth:0,backgroundColor:
                            order.status === "waiting" && "#E4E6EF" ||
                            order.status === "in_branch" && "#E4E6EF" ||
                            order.status === "in_progress" && "#E4E6EF" ||
                            order.status === "rejected" && "#E66430" ||
                            order.status === "stuck" && "#FAB500" ||
                            order.status === "delayed" && "#FAB500" ||
                            order.status === "on_the_way" && "#634FD2" ||
                            order.status === "reschedule" && "FAB500" ||
                            order.status === "return_before_delivered_initiated" && "#E66430" ||
                            order.status === "return_after_delivered_initiated" && "#E66430" ||
                            order.status === "returned" && "##4C95DD" ||
                            order.status === "returned_in_branch" && "#4C95DD" ||
                            order.status === "returned_out" && "#4C95DD" ||
                            order.status === "business_returned_delivered" && "#3AB075" ||
                            order.status === "delivered" && "#4C95DD" ||
                            order.status === "money_in_branch" && "#4C95DD" ||
                            order.status === "money_out" && "#4C95DD" ||
                            order.status === "business_paid" && "#4C95DD" ||
                            order.status === "completed" && "#3AB075"
                        }]}>
                <MaterialIcons name="update" size={24} color="white" />
                <Text style={{color:"white"}}>{order.status}</Text>
            </View>
        </View>
        {(user?.user_role !== "business") && <View style={styles.sec}>
            <View style={styles.in}>
                <View style={styles.flexIn}>
                    <SimpleLineIcons name="user" size={24} color="#F8C332" />
                    <View style={styles.info}>
                        <Text style={styles.h2}>Sender</Text>
                        <Text style={styles.p}>{order.sender}</Text>
                    </View>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity>
                        <Entypo name="phone" size={20} color="green" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Feather name="message-square" size={20} color="green" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>}
        <View style={styles.sec}>
            <View style={styles.in}>
                <View style={styles.flexIn}>
                    <SimpleLineIcons name="user" size={24} color="#F8C332" />
                    <View style={styles.info}>
                        <Text style={styles.h2}>Client</Text>
                        <Text style={styles.p}>{order.receiver_name}</Text>
                    </View>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity>
                        <Entypo name="phone" size={20} color="green" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Feather name="message-square" size={20} color="green" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
        <View style={styles.sec}>
            <View style={styles.in}>
                <View style={styles.flexIn}>
                    <Ionicons name="location-outline" size={24} color="#F8C332" />
                    <View style={styles.info}>
                        <Text style={styles.h2}>{order.receiver_city}</Text>
                        <Text style={styles.p}>{order.receiver_area}{order.receiver_address ? `, ${order.receiver_address}` : null}</Text>
                    </View>
                </View>
            </View>
        </View>
        <View style={styles.sec}>
            <View style={styles.in}>
                <View style={styles.flexIn}>
                    <SimpleLineIcons name="user" size={24} color="#F8C332" />
                    <View style={styles.info}>
                        <Text style={styles.h2}>Driver</Text>
                        <Text style={styles.p}>{order.driver ? order.driver : "Unknown"}</Text>
                    </View>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity>
                        <Entypo name="phone" size={20} color="green" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Feather name="message-square" size={20} color="green" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
        <View style={styles.flexSec}>
            <View style={styles.in}>
                <View style={styles.cost}>
                    <Feather name="package" size={24} color="#F8C332" />
                    <Text>{order.cod_value}₪</Text>
                </View>
                <View style={styles.cost}>
                    <Feather name="truck" size={24} color="#F8C332" />
                    <Text>{order.delivery_fee}₪</Text>
                </View>
                <View style={styles.cost}>
                    <FontAwesome name="money" size={24} color="#F8C332" />
                    <Text>{order.net_value}₪</Text>
                </View>
            </View>
        </View>
        {order.note && <View style={styles.note}>
            <FontAwesome name="sticky-note-o" size={24} color="black" />
            <Text style={{width:"90%"}}>{order.note}</Text>
        </View>}
    </View>
    </Pressable>

    {showControl
    &&
    <ModalPresentation
     showModal={showControl}
     setShowModal={setShowControl}
     customStyles={{bottom:15}}
    >
        <View style={styles.control}>
            <TouchableOpacity style={styles.modalItem} onPress={()=> router.push({
                pathname: "(create)",
                params: { orderId: order.order_id }
              })}>
                <Feather name="edit" size={20} color="black" />
                <Text style={{fontWeight:"500"}}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalItem,{borderBottomWidth:0}]}>
                <AntDesign name="printer" size={20} color="black" />
                <Text style={{fontWeight:"500"}}>Print</Text>
            </TouchableOpacity>
        </View>

    </ModalPresentation>}
    
    </>
}

const styles = StyleSheet.create({
    main:{
        height:"100%"
    },
    section:{
        marginTop:15,
        flex:1
    },
    scrollView:{
        flex:1
    },
    orders:{
        padding:15,
    },
    order:{
        boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
        backgroundColor:"white",
        padding:15
    },
    status:{
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"center",
        gap:7
    },
    head:{
        display:"flex",
        flexDirection:"row",
        justifyContent:"space-between",
        alignItems:"center",
        gap:10
    },
    box:{
        borderRadius:15,
        boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
        paddingHorizontal:15,
        paddingVertical:10,
        minWidth:130,
        borderColor:"#F8C332",
        borderWidth:1
    },
    h2:{
        fontWeight:"500"
    },
    sec:{
        marginTop:15,
        paddingVertical:10,
        borderBottomColor:"rgba(0,0,0,.1)",
        borderBottomWidth:1
    },
    in:{
        display:"flex",
        flexDirection:"row",
        alignItems:"center",
        gap:15,
        justifyContent:"space-between"
    },
    flexIn:{
        display:"flex",
        flexDirection:"row",
        alignItems:"center",
        gap:15
    },
    icons:{
        display:"flex",
        flexDirection:"row",
        gap:15
    },
    flexSec:{
        marginTop:20,
    },
    cost:{
        display:"flex",
        flexDirection:"row",
        alignItems:"center",
        gap:7
    },
    note:{
        flexDirection:"row",
        alignItems:"center",
        gap:15,
        marginTop:15,
        borderColor:"rgba(0,0,0,.1)",
        borderWidth:1,
        borderRadius:15,
        padding:15
    },
    modalItem:{
        padding:15,
        flexDirection:"row",
        alignItems:"center",
        gap:10,
        borderBottomColor:"rgba(0,0,0,.1)",
        borderBottomWidth:1
    }

})