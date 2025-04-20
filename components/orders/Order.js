import { View,StyleSheet,Text, TouchableOpacity, Pressable, TextInput} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCallback, useState } from 'react';
import ModalPresentation from '../ModalPresentation';
import AntDesign from '@expo/vector-icons/AntDesign';
import { router } from 'expo-router';
import PickerModal from "../pickerModal/PickerModal";
import { useAuth } from '../../app/_layout';
import UserBox from "./userBox/UserBox";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';

export default function Order({user,order}){
    const { language } = useLanguage();
    const {user:authUser} = useAuth();
    const [showControl,setShowControl] = useState(false);
    const [showStatusUpdateModal,setShowStatusUpdateModal] = useState(false);
    const [showConfirmStatusChangeUpdateModal,setShowConfirmStatusChangeUpdateModal] = useState(false);
    const [selectedValue,setSelectedValue] = useState({});
    const [UpdatedStatusNote,setUpdatedStatusNote] = useState("");

    const statusOptions = authUser.role === "driver" ? [{
        label:translations[language].tabs.orders.order.states.pickedUp, value:"on_the_way"
    },{
        label:translations[language].tabs.orders.order.states.deliveredToDestinationBranch, value:"in_branch"
    },{
        label:translations[language].tabs.orders.order.states.reschedule, value:"reschedule"
    },{
        label:translations[language].tabs.orders.order.states.returnBeforeDeliveredInitiated, value:"return_before_delivered_initiated"
    },{
        label:translations[language].tabs.orders.order.states.returnAfterDeliveredInitiated, value:"return_after_delivered_initiated"
    },{
        label:translations[language].tabs.orders.order.states.returned, value:"returned"
    },{
        label:translations[language].tabs.orders.order.states.delivered, value:"delivered"
    },{
        label:translations[language].tabs.orders.order.states.received, value:"received"
    },{
        label:translations[language].tabs.orders.order.states.delivered_received, value:"delivered/received"
    }]
    :
    [{
        label:translations[language].tabs.orders.order.states.waiting, value:"waiting"
    },{
        label:translations[language].tabs.orders.order.states.inBranch, value:"in_branch"
    },{
        label:translations[language].tabs.orders.order.states.inProgress, value:"in_progress"
    },{
        label:translations[language].tabs.orders.order.states.rejected, value:"rejected"
    },{
        label:translations[language].tabs.orders.order.states.stuck, value:"stuck"
    },{
        label:translations[language].tabs.orders.order.states.delayed, value:"delayed"
    }]

    const handleStatusUpdate = (newStatus) => {
        setSelectedValue(newStatus);
        setShowConfirmStatusChangeUpdateModal(true)
    };

    const changeStatusHandler = async ()=>{
            const updates = {
                order_id:order.order_id,
                status:selectedValue.status.value,
                note_content:UpdatedStatusNote
            }
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/status`,{
                method:"PUT",
                headers:{
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials:"include",
                body:JSON.stringify({updates})
            });
            if(!res.error){
                setShowConfirmStatusChangeUpdateModal(false);
            }
        }

    return <>
        <Pressable onPress={()=> router.push({
            pathname:"(track)",
            params:{orderId:order.order_id}
        })} onLongPress={()=> setShowControl(true)}>
            <View style={styles.order}>
        <View style={[styles.head,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
            <View style={styles.box}>
                <Text style={{textAlign:"center"}}># {order.order_id}</Text>
            </View>
            <TouchableOpacity onPress={()=> authUser.role !== "business" && setShowStatusUpdateModal(true)} style={[styles.box,styles.status,{borderWidth:0,backgroundColor:
                            order.status_key === "waiting" && "#E4E6EF" ||
                            order.status_key === "in_branch" && "#E4E6EF" ||
                            order.status_key === "in_progress" && "#E4E6EF" ||
                            order.status_key === "rejected" && "#E66430" ||
                            order.status_key === "stuck" && "#FAB500" ||
                            order.status_key === "delayed" && "#FAB500" ||
                            order.status_key === "on_the_way" && "#634FD2" ||
                            order.status_key === "reschedule" && "FAB500" ||
                            order.status_key === "return_before_delivered_initiated" && "#E66430" ||
                            order.status_key === "return_after_delivered_initiated" && "#E66430" ||
                            order.status_key === "returned" && "#4C95DD" ||
                            order.status_key === "returned_in_branch" && "#4C95DD" ||
                            order.status_key === "returned_out" && "#4C95DD" ||
                            order.status_key === "business_returned_delivered" && "#3AB075" ||
                            order.status_key === "delivered" && "#4C95DD" ||
                            order.status_key === "money_in_branch" && "#4C95DD" ||
                            order.status_key === "money_out" && "#4C95DD" ||
                            order.status_key === "business_paid" && "#4C95DD" ||
                            order.status_key === "completed" && "#3AB075"
                        }]}>
                {authUser.role !== "business" && <MaterialIcons name="published-with-changes" size={24} color="white" />}
                <Text style={{color:"white"}}>{order.status}</Text>
            </TouchableOpacity>
        </View>
        {authUser.role !== "business" && <UserBox styles={styles} box={{label:translations[language].tabs.orders.order.userSenderBoxLabel,userName:order.sender,phone:order.sender_mobile}} />}
        <UserBox styles={styles} box={{label:translations[language].tabs.orders.order.userClientBoxLabel,userName:order.receiver_name,phone:order.receiver_mobile}} />
        <View style={styles.sec}>
            <View style={[styles.in,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                <View style={[styles.flexIn,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                    <Ionicons name="location-outline" size={24} color="#F8C332" />
                    <View style={styles.info}>
                        <Text style={[styles.h2,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{order.receiver_city}</Text>
                        <Text style={[styles.p,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{order.receiver_area}{order.receiver_address ? `, ${order.receiver_address}` : null}</Text>
                    </View>
                </View>
            </View>
        </View>
        {!["driver","business"].includes(authUser.role) && <UserBox styles={styles} box={{label:translations[language].tabs.orders.order.userDriverBoxLabel,userName:order.driver ? order.driver : translations[language].tabs.orders.order.unknown,phone:order.driver_mobile ? order.driver_mobile : ""}} />}
        <View style={styles.sec}>
            <View style={[styles.in,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                <View style={[styles.flexIn,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                    <MaterialCommunityIcons name="package-variant" size={24} color="#F8C332" />
                    <View style={styles.info}>
                        <Text style={[styles.h2,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{translations[language].tabs.orders.order.orderType}</Text>
                        <Text style={[styles.p,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{order.order_type}</Text>
                    </View>
                </View>
            </View>
        </View>
        <View style={styles.flexSec}>
            <View style={[styles.in,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                <View style={[styles.cost,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                    <Feather name="package" size={20} color="#F8C332" />
                    <Text style={styles.costText}>{order.cod_value} {order.currency}</Text>
                </View>
                <View style={[styles.cost,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                    <Feather name="truck" size={20} color="#F8C332" />
                    <Text style={styles.costText}>{order.delivery_fee} {order.currency}</Text>
                </View>
                <View style={[styles.cost,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                    <FontAwesome name="money" size={20} color="#F8C332" />
                    <Text style={styles.costText}>{order.net_value} {order.currency}</Text>
                </View>
            </View>
        </View>
        {order.checks_value > 0 && <Pressable onPress={()=> router.push({
            pathname:"(order_checks)",
            params:{orderId:order.order_id}
        })}>
            <View style={[styles.checks,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                <Text style={{width:"90%",textAlign:["he", "ar"].includes(language) ? "right" : "left"}}>This Order contains checks of total amount: {order.checks_value} {order.currency}</Text>
            </View>
        </Pressable>}
        {order.note && <View style={[styles.note,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
            <FontAwesome name="sticky-note-o" size={24} color="black" />
            <Text style={{width:"90%",textAlign:["he", "ar"].includes(language) ? "right" : "left"}}>{order.note}</Text>
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
        <View style={[styles.control,{alignItems:["he", "ar"].includes(language) ? "flex-end" : "flex-start"}]}>
            {["delivered","returned","business_returned_delivered","received","delivered/received","money_in_branch","money_out","business_paid","completed","returned_out","returned_in_branch"].includes(order.status_key) || <TouchableOpacity style={[styles.modalItem,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]} onPress={()=> router.push({
                pathname: "(create)",
                params: { orderId: order.order_id }
              })}>
                <Feather name="edit" size={20} color="black" />
                <Text style={{fontWeight:"bold"}}>{translations[language].tabs.orders.order.edit}</Text>
            </TouchableOpacity>}
            {authUser.role === "business" || <TouchableOpacity style={[styles.modalItem,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]} onPress={()=> setShowStatusUpdateModal(true)}>
                <MaterialIcons name="published-with-changes" size={20} color="black" />
                <Text style={{fontWeight:"bold"}}>{translations[language].tabs.orders.order.changeStatus}</Text>
            </TouchableOpacity>}
            {/* {authUser.role === "business" || <TouchableOpacity style={[styles.modalItem,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                <AntDesign name="printer" size={20} color="black" />
                <Text style={{fontWeight:"bold"}}>{translations[language].tabs.orders.order.print}</Text>
            </TouchableOpacity>} */}
        </View>

    </ModalPresentation>}

    {showStatusUpdateModal
    &&
    <PickerModal
        list={statusOptions}
        setSelectedValue={handleStatusUpdate}
        showPickerModal={showStatusUpdateModal}
        setShowPickerModal={setShowStatusUpdateModal}
        field={{
            name: 'status',
            label: 'Status',
            showSearchBar: false
        }}
    />}

{showConfirmStatusChangeUpdateModal
    &&
    <ModalPresentation
     showModal={showConfirmStatusChangeUpdateModal}
     setShowModal={setShowConfirmStatusChangeUpdateModal}
     customStyles={{bottom:15}}
    >
        <View style={{padding:15}}>
            <Text style={{fontSize:14,fontWeight:"bold",lineHeight:24,textAlign:["he", "ar"].includes(language) ? "right" : "left"}}>{translations[language].tabs.orders.order.changeStatusAlert} <Text style={{color:"#F8C332",textTransform:"capitalize"}}>{selectedValue.status.label}</Text></Text>
            <TextInput
                style={{borderWidth:1,borderColor:"(rgba(0,0,0,.1)",marginTop:15,textAlign:["he", "ar"].includes(language) ? "right" : "left"}}
                placeholder={translations[language].tabs.orders.order.changeStatusAlertNote}
                value={UpdatedStatusNote}
                onChangeText={(input) => setUpdatedStatusNote(input)}
            />
            <View style={{marginTop:25,flexDirection:"row",justifyContent:"flex-end",gap:25}}>
                <TouchableOpacity onPress={changeStatusHandler}>
                    <Text style={{color:"#F8C332",fontWeight:"bold"}}>{translations[language].tabs.orders.order.changeStatusAlertConfirm}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={()=> setShowConfirmStatusChangeUpdateModal(false)}>
                    <Text style={{fontWeight:"bold"}}>{translations[language].tabs.orders.order.changeStatusAlertCancel}</Text>
                </TouchableOpacity>
            </View>
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
        fontWeight:"bold"
    },
    contorl:{
        width:"100%"
    },
    sec:{
        marginTop:15,
        paddingVertical:5,
        borderBottomColor:"rgba(0,0,0,.1)",
        borderBottomWidth:1
    },
    in:{
        display:"flex",
        flexDirection:"row",
        alignItems:"center",
        gap:15,
        justifyContent:"space-between",
    },
    flexIn:{
        display:"flex",
        flexDirection:"row",
        alignItems:"center",
        gap:15,
    },
    icons:{
        display:"flex",
        flexDirection:"row",
        gap:20
    },
    flexSec:{
        marginTop:20,
    },
    cost:{
        display:"flex",
        flexDirection:"row",
        alignItems:"center",
        gap:7,
    },
    costText:{
        fontSize:13
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
    checks:{
        flexDirection:"row",
        alignItems:"center",
        gap:15,
        marginTop:15,
        borderColor:"red",
        borderWidth:1,
        borderRadius:15,
        padding:15,
    },
    modalItem:{
        padding:15,
        flexDirection:"row",
        alignItems:"center",
        gap:10,
        borderBottomColor:"rgba(0,0,0,.1)",
        borderBottomWidth:1,
        width:"100%"
    }

})