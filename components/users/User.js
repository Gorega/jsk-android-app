import { View,StyleSheet,Text, TouchableOpacity, Pressable} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {useAuth} from "../../app/_layout";
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import ModalPresentation from '../ModalPresentation';
import { router } from 'expo-router';


export default function User({user}){
    const [showControl,setShowControl] = useState(false);

    const {userRoleId} = useAuth();

    return <>
        <Pressable onLongPress={()=> setShowControl(true)}>
            <View style={styles.user}>
                <View style={styles.head}>
                    <View style={styles.box}>
                        <Text># {user?.user_id}</Text>
                    </View>
                    <View style={[styles.status,{borderWidth:0,backgroundColor:
                            "green"
                        }]}>
                        <Text style={{color:"white"}}>{user.activeStatus}</Text>
                    </View>
                </View>
                <View style={styles.sec}>
                    <View style={styles.in}>
                        <View style={styles.flexIn}>
                            <FontAwesome name="user-o" size={24} color="#F8C332" />
                            <View style={styles.info}>
                                <Text style={styles.h2}>Name</Text>
                                <Text style={styles.p}>{user?.name}</Text>
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
                                <Text style={styles.h2}>{user?.city}</Text>
                                <Text style={styles.p}>{user.area}{user.address ? `, ${user.address}` : null}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.sec}>
                    <View style={styles.in}>
                        <View style={styles.flexIn}>
                            <MaterialIcons name="admin-panel-settings" size={24} color="#F8C332" />
                            <View style={styles.info}>
                                <Text style={styles.h2}>Role</Text>
                                <Text style={styles.p}>{user?.role}</Text>
                            </View>
                        </View>
                    </View>
                </View>
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
                pathname: "(create_user)",
                params: { userId: user.user_id }
              })}>
                <Feather name="edit" size={20} color="black" />
                <Text style={{fontWeight:"500"}}>Edit</Text>
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
    users:{
        padding:15,
    },
    user:{
        boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
        backgroundColor:"white",
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
        width:20,
        height:20,
        borderRadius:"50%"
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
    },
    control:{
        width:"100%"
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