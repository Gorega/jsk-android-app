import { TouchableOpacity, Text, StyleSheet, ScrollView } from "react-native";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from "expo-router";
import ModalPresentation from "../../components/ModalPresentation";
import { useState } from "react";
import {deleteToken} from "../../utils/secureStore";
import { useAuth } from "../_layout";


export default function Settings(){

    const [showLanguageModal,setShowLanguageModal] = useState(false);
    const { setIsAuthenticated,user } = useAuth();


    const settings = [(["admin","manager"].includes(user.role)) ? {
        label:"Users",
        onPress:()=> router.push("(users)"),
        icon:<FontAwesome name="user-o" size={24} color="#F8C332" />
    } : {visibility:"hidden"},{
        label:"Language",
        onPress:()=> setShowLanguageModal(true),
        icon:<MaterialIcons name="language" size={24} color="#F8C332" />
    },{
        label:"Change Password",
        onPress:()=> router.push("(change_password)"),
        icon:<AntDesign name="unlock" size={24} color="#F8C332" />
    },{
        label:"Contact Us",
        onPress:()=> router.push("(contact_us)"),
        icon:<Entypo name="phone" size={24} color="#F8C332" />
    },{
        label:"About Us",
        onPress:()=> router.push("(info)"),
        icon:<MaterialCommunityIcons name="vector-arrange-above" size={24} color="#F8C332" />
    },{
        label:"Locations",
        onPress:()=> router.push("(locations)"),
        icon:<Ionicons name="location-outline" size={24} color="#F8C332" />
    },{
        label:"Logout",
        onPress:async ()=> {
            await deleteToken("userToken");
            setIsAuthenticated(false);
            router.replace("(auth)");
        },
        icon:<MaterialIcons name="logout" size={24} color="#F8C332" />
    }]

    return <>
        <ScrollView contentContainerStyle={styles.container}>
            {settings?.map((item,index)=>{
                return <TouchableOpacity key={index} style={[styles.item,{display:item.visibility === "hidden" && "none"}]} onPress={item.onPress}>
                    {item.icon}
                    <Text style={{fontWeight:500}}>{item.label}</Text>
                </TouchableOpacity>
            })}
        </ScrollView>

        {showLanguageModal && <ModalPresentation
            customStyles={{bottom:15}}
            showModal={showLanguageModal}
            setShowModal={setShowLanguageModal}
            >
            <TouchableOpacity>
                <Text style={styles.lang}>Arabic</Text>
            </TouchableOpacity>
            <TouchableOpacity>
                <Text style={styles.lang}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity>
                <Text style={[styles.lang,{borderBottomWidth:0}]}>Hebrew</Text>
            </TouchableOpacity>
        </ModalPresentation>}
    </>
}

const styles = StyleSheet.create({
    container:{
        backgroundColor:"white",
        boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
        height:"100%"
    },
    item:{
        borderBottomColor:"rgba(0,0,0,.1)",
        borderBottomWidth:1,
        flexDirection:"row",
        alignItems:"center",
        gap:10,
        padding:25,
        paddingVertical:32
    },
    lang:{
        padding:15,
        borderBottomColor:"rgba(0,0,0,.1)",
        borderBottomWidth:1,
        fontWeight:"500"
    }
})