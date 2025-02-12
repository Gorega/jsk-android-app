import { View,StyleSheet,Text, TouchableOpacity, Pressable} from 'react-native';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import ModalPresentation from '../ModalPresentation';
import { router } from 'expo-router';
import UserBox from "../orders/userBox/UserBox";


export default function User({user}){
    const { language } = useLanguage();
    const [showControl,setShowControl] = useState(false);

    return <>
        <Pressable onLongPress={()=> setShowControl(true)}>
            <View style={styles.user}>
                <View style={[styles.head,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                    <View style={styles.box}>
                        <Text style={{textAlign:"center"}}># {user?.user_id}</Text>
                    </View>
                    <View style={[styles.status,{borderWidth:0,backgroundColor:"green",flexDirection:"row-reverse"}]}>
                        <Text style={{color:"white"}}>{user.activeStatus}</Text>
                    </View>
                </View>
                <UserBox styles={styles} box={{label:translations[language].users.user.name,userName:user?.name,phone:user?.phone}} />
                <View style={styles.sec}>
                    <View style={[styles.in,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                        <View style={[styles.flexIn,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                            <Ionicons name="location-outline" size={24} color="#F8C332" />
                            <View style={styles.info}>
                                <Text style={[styles.h2,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{user?.city}</Text>
                                <Text style={[styles.p,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{user.area}{user.address ? `, ${user.address}` : null}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.sec}>
                    <View style={[styles.in,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                        <View style={[styles.flexIn,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                            <MaterialIcons name="admin-panel-settings" size={24} color="#F8C332" />
                            <View style={styles.info}>
                                <Text style={[styles.h2,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{translations[language].users.user.role}</Text>
                                <Text style={[styles.p,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{user?.role}</Text>
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
        <View style={[styles.control,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
            <TouchableOpacity style={[styles.modalItem,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]} onPress={()=> router.push({
                pathname: "(create_user)",
                params: { userId: user.user_id }
              })}>
                <Feather name="edit" size={20} color="black" />
                <Text style={{fontWeight:"500"}}>{translations[language].users.user.edit}</Text>
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
        flexDirection:"row-reverse",
        alignItems:"center",
        gap:10,
        marginBottom:15,
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
        gap:15,
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
    h2:{
        fontWeight:"500"
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