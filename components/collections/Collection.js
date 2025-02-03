import { View,StyleSheet,Text, TouchableOpacity} from 'react-native';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {useAuth} from "../../app/_layout";
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Collection({type,collection}){

    const {user} = useAuth();

    const renderCollectionUser = ()=>{
        if((type === "money" || type === "returned") && user.role !== "business"){
            return <View style={styles.in}>
            <View style={styles.flexIn}>
                <SimpleLineIcons name="user" size={24} color="#F8C332" />
                <View style={styles.info}>
                    <Text style={styles.h2}>Sender</Text>
                    <Text style={styles.p}>{collection.business_name}</Text>
                </View>
            </View>
            <View style={styles.icons}>
                <Entypo name="phone" size={24} color="green" />
                <Feather name="message-square" size={24} color="green" />
            </View>
        </View>
        }
        if((type === "driver" || type === "dispatched") && user.role !== "driver"){
            return <View style={styles.in}>
            <View style={styles.flexIn}>
                <SimpleLineIcons name="user" size={24} color="#F8C332" />
                <View style={styles.info}>
                    <Text style={styles.h2}>Driver</Text>
                    <Text style={styles.p}>{collection.driver_name}</Text>
                </View>
            </View>
            <View style={styles.icons}>
                <Entypo name="phone" size={24} color="green" />
                <Feather name="message-square" size={24} color="green" />
            </View>
        </View>
        }
    }
    
    return <View style={styles.order}>
        <View style={styles.head}>
            <View style={styles.box}>
                <Text># {collection.collection_id}</Text>
            </View>
            <View style={[styles.box,styles.status,{borderWidth:0,backgroundColor:
                            collection.status === "returned_in_branch" && "#634FD2" ||
                            collection.status === "money_in_branch" && "#634FD2" ||
                            collection.status === "deleted" && "#E66430" ||
                            collection.status === "returned_out" && "#2896F3" ||
                            collection.status === "money_out" && "#2896F3" ||
                            collection.status === "returned_delivered" && "#2896F3" ||
                            collection.status === "paid" && "#2896F3" ||
                            collection.status === "completed" && "#3DA643" ||
                            collection.status === "pending" && "#634FD2" ||
                            collection.status === "in_dispatched_to_branch" && "#634FD2" ||
                            collection.status === "partial" && "#634FD2"
                        }]}>
                <MaterialIcons name="update" size={24} color="white" />
                <Text style={{color:"white"}}>{collection.status}</Text>
            </View>
    </View>
    <View style={styles.sec}>
        {renderCollectionUser()}
    </View>
    <View style={styles.sec}>
        <View style={styles.in}>
            <View style={styles.flexIn}>
                <Feather name="package" size={24} color="#F8C332" />
                <View style={styles.info}>
                    <Text style={styles.h2}>{type === "driver" ? "Number of Collections" : "Number of Orders"}</Text>
                    <Text style={styles.p}>{type === "driver" ? collection.number_of_collections : collection.number_of_orders}</Text>
                </View>
            </View>
        </View>
    </View>
    {type !== "returned" && <View style={styles.sec}>
        <View style={styles.in}>
            <View style={styles.flexIn}>
                <MaterialIcons name="attach-money" size={24} color="#F8C332" />
                <View style={styles.info}>
                    <Text style={styles.h2}>{type === "driver" ? "Money to Deliver" : "Money to Collect"}</Text>
                    <Text style={styles.p}>{type === "driver" ? collection.total_money_amount : collection.total_net_value}</Text>
                </View>
            </View>
        </View>
    </View>}
    {type === "driver" && <View style={styles.sec}>
        <View style={styles.in}>
            <View style={styles.flexIn}>
                <MaterialIcons name="attach-money" size={24} color="#F8C332" />
                <View style={styles.info}>
                    <Text style={styles.h2}>Checks to Deliver</Text>
                    <Text style={styles.p}>{collection.total_checks_amount}</Text>
                </View>
            </View>
        </View>
    </View>}
    {(type === "returned" || type === "dispatched") && <View style={styles.sec}>
        <View style={styles.in}>
            <View style={styles.flexIn}>
                <Ionicons name="git-branch-outline" size={24} color="#F8C332" />
                <View style={styles.info}>
                    <Text style={styles.h2}>Current Branch</Text>
                    <Text style={styles.p}>{collection.current_branch_name}</Text>
                </View>
            </View>
        </View>
    </View>}
    {type === "dispatched" && <View style={styles.sec}>
        <View style={styles.in}>
            <View style={styles.flexIn}>
                <Ionicons name="git-branch-outline" size={24} color="#F8C332" />
                <View style={styles.info}>
                    <Text style={styles.h2}>To Branch</Text>
                    <Text style={styles.p}>{collection.to_branch_name}</Text>
                </View>
            </View>
        </View>
    </View>}
    <View style={styles.flexSec}>
        <View style={[styles.in,styles.narrow]}>
            <TouchableOpacity style={styles.action}>
                 <AntDesign name="printer" size={20} color="#F8C332" />
                <Text>Print</Text>
            </TouchableOpacity>
            <View>
                <Text>|</Text>
            </View>
            {type === "driver"
            ?
            <TouchableOpacity style={styles.action} onPress={()=> router.push({pathname:"/(collection)?type=money",params:{collectionIds:collection.collection_ids}})}>
                <MaterialCommunityIcons name="package-variant" size={24} color="#F8C332" />
                <Text>Collections</Text>
            </TouchableOpacity>
            :
            <TouchableOpacity style={styles.action} onPress={()=> router.push({pathname:"/(tabs)/orders",params:{orderIds:collection.order_ids}})}>
                <MaterialCommunityIcons name="package-variant" size={24} color="#F8C332" />
                <Text>Orders</Text>
            </TouchableOpacity>}
        </View>
    </View>
</View>
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
        marginBottom:30,
        padding:15
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
        display:"flex",
        flexDirection:"row",
        alignItems:"center",
        gap:15,
        justifyContent:"space-between"
    },
    narrow:{
        justifyContent:"center",
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
    action:{
        display:"flex",
        flexDirection:"row",
        alignItems:"center",
        gap:5,
    },
    h2:{
        fontWeight:"500"
    }

})