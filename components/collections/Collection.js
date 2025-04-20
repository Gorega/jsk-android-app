import { View,StyleSheet,Text, TouchableOpacity, Alert, ActivityIndicator} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {useAuth} from "../../app/_layout";
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import UserBox from "../orders/userBox/UserBox";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import ModalPresentation from "../ModalPresentation";
import { useState } from 'react';

export default function Collection({type,collection}){
    const { language } = useLanguage();
    const {user} = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);


    const handleCollectNotification = async (type, action) => {
        setIsLoading(true);
        try {
          const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/collections/collect/request?requestType=${type}`, {
            method: "POST",
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Accept-Language': language
            },
            credentials: "include",
            body: JSON.stringify({
              action,
              collection_id: collection.collection_id
            })
          });
          const data = await res.json();
          Alert.alert(
            data.message
          )
        } catch (err) {
          Alert.alert(
            err.message
          )
        } finally {
          setIsLoading(false);
          setShowModal(false);
        }
      };

      const handleCollectionStatusConfirm = async (status) => {
        // Show confirmation prompt
        Alert.alert(
            // Title
            status === "paid" ? 
            translations[language].collections.collection.confirmPaymentTitle : 
            translations[language].collections.collection.confirmReturnedTitle,
        // Message
        status === "paid" ? 
            translations[language].collections.collection.confirmPaymentMessage : 
            translations[language].collections.collection.confirmReturnedMessage,  // Added comma here
        // Buttons array
            [
                {
                    text: translations[language].collections.collection.cancel || "Cancel",
                    style: "cancel"
                },
                {
                    text: translations[language].collections.collection.confirm || "Confirm",
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const updates = {
                                collection_ids: [collection.collection_id],
                                status: status,
                                note_content: null
                            };

                            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/collections/status`, {
                                method: "PUT",
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json'
                                },
                                credentials: "include",
                                body: JSON.stringify({ updates })
                            });

                            const data = await res.json();

                            if (data.failures?.length > 0 && data.successes?.length > 0) {
                                return;
                            }
                        } catch(err) {
                            Alert.alert(err.message);
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderCollectionUser = ()=>{
        if((type === "business_money" || type === "business_returned") && user.role !== "business"){
            return <UserBox
                styles={styles}
                box=
                {{  label:translations[language].tabs.orders.order.userSenderBoxLabel,
                    userName:collection.business_name,
                    phone:""
                }}
            />
        }
        if((type === "sent" || type === "dispatched") && user.role !== "driver"){
            return <UserBox
                styles={styles}
                box=
                {{  label:translations[language].tabs.orders.order.userDriverBoxLabel,
                    userName:collection.driver_name,
                    phone:""
                }}
            />
        }
    }

    
    return <View style={styles.order}>
        <View style={[styles.head,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
            <View style={styles.box}>
                <Text style={{textAlign:"center"}}># {collection.collection_id}</Text>
            </View>
            <View style={[styles.box,styles.status,{borderWidth:0,backgroundColor:
                            collection.status_key === "returned_in_branch" && "#634FD2" ||
                            collection.status_key === "money_in_branch" && "#634FD2" ||
                            collection.status_key === "deleted" && "#E66430" ||
                            collection.status_key === "returned_out" && "#2896F3" ||
                            collection.status_key === "money_out" && "#2896F3" ||
                            collection.status_key === "returned_delivered" && "#2896F3" ||
                            collection.status_key === "paid" && "#2896F3" ||
                            collection.status_key === "completed" && "#3DA643" ||
                            collection.status_key === "pending" && "#634FD2" ||
                            collection.status_key === "in_dispatched_to_branch" && "#634FD2" ||
                            collection.status_key === "partial" && "#634FD2"
                        }]}>
                <Text style={{color:"white"}}>{collection.status}</Text>
            </View>
    </View>
    {renderCollectionUser()}
    <View style={styles.sec}>
        <View style={[styles.in,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
            <View style={[styles.flexIn,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                <Feather name="package" size={24} color="#F8C332" />
                <View style={styles.info}>
                    <Text style={[styles.h2,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{type === "driver" ? translations[language].collections.collection.numberOfCollections : translations[language].collections.collection.numberOfOrders}</Text>
                    <Text style={[styles.p,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{type === "driver" ? collection.number_of_collections : collection.number_of_orders}</Text>
                </View>
            </View>
        </View>
    </View>
    {type !== "returned" && <View style={styles.sec}>
        <View style={[styles.in,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
            <View style={[styles.flexIn,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                <MaterialIcons name="attach-money" size={24} color="#F8C332" />
                <View style={styles.info}>
                    <Text style={[styles.h2,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{type === "driver" ? translations[language].collections.collection.moneyToDeliver : translations[language].collections.collection.moneyToCollect}</Text>
                    <Text style={[styles.p,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{type === "driver" ? collection.total_money_amount : collection.total_net_value}</Text>
                </View>
            </View>
        </View>
    </View>}
    {type === "driver" && <View style={styles.sec}>
        <View style={[styles.in,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
            <View style={[styles.flexIn,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                <MaterialIcons name="attach-money" size={24} color="#F8C332" />
                <View style={styles.info}>
                    <Text style={[styles.h2,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{translations[language].collections.collection.checksToDeliver}</Text>
                    <Text style={[styles.p,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{collection.total_checks_amount}</Text>
                </View>
            </View>
        </View>
    </View>}
    {(type === "returned" || type === "dispatched") && <View style={styles.sec}>
        <View style={[styles.in,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
            <View style={[styles.flexIn,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                <Ionicons name="git-branch-outline" size={24} color="#F8C332" />
                <View style={styles.info}>
                    <Text style={[styles.h2,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{translations[language].collections.collection.currentBranch}</Text>
                    <Text style={[styles.p,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{collection.current_branch_name}</Text>
                </View>
            </View>
        </View>
    </View>}
    {type === "dispatched" && <View style={styles.sec}>
        <View style={[styles.in,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
            <View style={[styles.flexIn,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                <Ionicons name="git-branch-outline" size={24} color="#F8C332" />
                <View style={styles.info}>
                    <Text style={[styles.h2,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{translations[language].collections.collection.toBranch}</Text>
                    <Text style={[styles.p,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{collection.to_branch_name}</Text>
                </View>
            </View>
        </View>
    </View>}
    <View style={styles.flexSec}>
        <View style={[styles.in,styles.narrow]}>
            {/* <TouchableOpacity style={[styles.action,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                 <AntDesign name="printer" size={20} color="#F8C332" />
                <Text>{translations[language].collections.collection.print}</Text>
            </TouchableOpacity> */}
            {type === "driver"
            ?
            <TouchableOpacity style={[styles.action,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]} onPress={()=> router.push({pathname:"/(collection)?type=money",params:{collectionIds:collection.collection_ids}})}>
                <MaterialCommunityIcons name="package-variant" size={24} color="#F8C332" />
                <Text>{translations[language].collections.collection.collections}</Text>
            </TouchableOpacity>
            :
            <TouchableOpacity style={[styles.action,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]} onPress={()=> router.push({pathname:"/(tabs)/orders",params:{orderIds:collection.order_ids}})}>
                <MaterialCommunityIcons name="package-variant" size={24} color="#F8C332" />
                <Text>{translations[language].collections.collection.orders}</Text>
            </TouchableOpacity>}
            {(user.role === "business" && collection.status_key === "returned_in_branch") &&
                <>
                    <TouchableOpacity 
                        style={[styles.action,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]} 
                        onPress={() => setShowModal(true)}
                    >
                        <FontAwesome6 name="money-bill-trend-up" size={24} color="#F8C332" />
                        <Text>{translations[language].collections.collection.request_package}</Text>
                    </TouchableOpacity>
                    <ModalPresentation customStyles={{bottom:15}} showModal={showModal} setShowModal={setShowModal}>
                        <TouchableOpacity
                         style={[styles.modalField,{borderTopWidth:0}]}
                         onPress={() => handleCollectNotification("package","prepare")}
                         disabled={isLoading}
                         >
                            {isLoading ? (
                                <ActivityIndicator color="#F8C332" />
                            ) : (
                                <Text>{translations[language].collections.collection.prepare_package}</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                         style={styles.modalField}
                         onPress={() => handleCollectNotification("package","send")}
                         >
                            <Text>{translations[language].collections.collection.send_package}</Text>
                        </TouchableOpacity>
                    </ModalPresentation>
                </>
            }
            {(user.role === "business" && collection.status_key === "money_in_branch") &&
                <>
                    <TouchableOpacity 
                        style={[styles.action,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]} 
                        onPress={() => setShowModal(true)}
                    >
                        <FontAwesome6 name="money-bill-trend-up" size={24} color="#F8C332" />
                        <Text>{translations[language].collections.collection.request_money}</Text>
                    </TouchableOpacity>
                    <ModalPresentation customStyles={{bottom:15}} showModal={showModal} setShowModal={setShowModal}>
                        <TouchableOpacity
                         style={[styles.modalField,{borderTopWidth:0}]}
                         onPress={() => handleCollectNotification("money","prepare")}
                         disabled={isLoading}
                         >
                            {isLoading ? (
                                <ActivityIndicator color="#F8C332" />
                            ) : (
                                <Text>{translations[language].collections.collection.prepare_money}</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                         style={styles.modalField}
                         onPress={() => handleCollectNotification("money","send")}
                         >
                            <Text>{translations[language].collections.collection.send_money}</Text>
                        </TouchableOpacity>
                    </ModalPresentation>
                </>
            }
        </View>
    </View>
    {collection.status_key === "money_out" && user.role === "business" && (
        <TouchableOpacity 
            style={styles.confirmPaymentButton}
            onPress={()=> handleCollectionStatusConfirm("paid")}
            disabled={isLoading}
        >
            {isLoading ? (
                <ActivityIndicator color="white" />
            ) : (
                <>
                    <MaterialIcons name="cloud-done" size={24} color="white" />
                    <Text style={styles.confirmPaymentText}>
                        {translations[language].collections.collection.confirmPaymentTitle}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    )}
     {collection.status_key === "returned_out" && user.role === "business" && (
        <TouchableOpacity 
            style={styles.confirmPaymentButton}
            onPress={()=> handleCollectionStatusConfirm("returned_delivered")}
        >
            <MaterialIcons name="cloud-done" size={24} color="white" />
            <Text style={styles.confirmPaymentText}>
                {translations[language].collections.collection.confirmReturnedTitle}
            </Text>
        </TouchableOpacity>
    )}
</View>
}

const styles = StyleSheet.create({
    main:{
        height:"100%",
    },
    section:{
        marginTop:15,
        flex:1
    },
    order:{
        boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
        backgroundColor:"white",
        padding:15,
    },
    control:{
        display:"flex",
        flexDirection:"row-reverse",
        alignItems:"center",
        gap:10,
        marginBottom:15,
    },
    cont:{
        display:"flex",
        flexDirection:"row",
        gap:15
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
    sec:{
        marginTop:15,
        paddingVertical:10,
        borderBottomColor:"rgba(0,0,0,.1)",
        borderBottomWidth:1
    },
    in:{
        flexDirection:"row",
        alignItems:"center",
        gap:25,
        justifyContent:"space-between"
    },
    narrow:{
        justifyContent:"center",
    },
    flexIn:{
        flexDirection:"row",
        alignItems:"center",
        gap:15
    },
    icons:{
        flexDirection:"row",
        gap:15
    },
    flexSec:{
        marginTop:20,
    },
    action:{
        flexDirection:"row",
        alignItems:"center",
        gap:5,
    },
    h2:{
        fontWeight:"500"
    }, confirmPaymentButton: {
        marginTop: 15,
        backgroundColor: 'green',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent:"center",
        flexDirection:"row",
        gap:7
    },
    confirmPaymentText: {
        color: 'white',
        fontWeight: '500',
        alignItems:"center",
        justifyContent:"center"
    },
    modalField:{
        padding:15,
        borderTopColor:"rgba(0,0,0,.1)",
        borderTopWidth:1
    }

})