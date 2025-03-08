import { View,StyleSheet,SafeAreaView,Image,Text, TouchableOpacity } from "react-native";
import avatar from "../assets/images/avatar2.jpg"
import Ionicons from '@expo/vector-icons/Ionicons';
import Notifications from "./Notifications";
import { router } from "expo-router";
import { useAuth } from "@/app/_layout";
import { useEffect, useState } from "react";
import { translations } from '../utils/languageContext';
import { useLanguage } from '../utils/languageContext';

export default function Header(){
    const {user} = useAuth();
    const { language } = useLanguage();
    const [greetingMsg, setGreetingMsg] = useState("");
    const [showNotifications, setShowNotifications] = useState(false);


    useEffect(() => {
        const currentHour = new Date().getHours();
    
        if (currentHour >= 5 && currentHour < 12) {
            setGreetingMsg(translations[language].greeting.morning);
        } else if (currentHour >= 12 && currentHour < 18) {
            setGreetingMsg(translations[language].greeting.afternoon);
        } else {
            setGreetingMsg(translations[language].greeting.evening);
        }
    }, [language]);

    return <SafeAreaView style={[styles.main,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
        <TouchableOpacity
            style={styles.avatarContainer}
            onPress={()=> router.push({pathname: "(create_user)",params: { userId: user.userId }})}>
            <Image style={styles.avatar} source={avatar} />
        </TouchableOpacity>
        <View style={styles.welcome}>
          <Text style={styles.h2}>{greetingMsg}</Text>
          <Text style={styles.p}>{user?.name}</Text>
        </View>
        <TouchableOpacity style={styles.notification} onPress={() => setShowNotifications(!showNotifications)}>
            <Ionicons name="notifications" size={24} color={"#F8C332"} />
        </TouchableOpacity>

        <Notifications 
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
      />
    </SafeAreaView>
}

const styles = StyleSheet.create({
    main:{
        backgroundColor:"white",
        height:100,
        boxShadow:"rgba(0, 0, 0, 0.16) 0px 1px 4px",
        display:"flex",
        flexDirection:"row",
        justifyContent:"space-between",
        alignItems:"flex-end",
        padding:15
    },
    avatarContainer:{
    },
    avatar:{
        borderColor:"rgba(0,0,0,.1)",
        borderWidth:1,
        borderRadius:50,
        width:40,
        height:40,
    },
    notification:{
        position:"relative",
        top:-7
    },  
    h2:{
        fontWeight:"500"
    },
    p:{
      textTransform:"capitalize"
    },
    welcome:{
        display:"flex",
        justifyContent:"center",
        alignItems:"center"
    }
})