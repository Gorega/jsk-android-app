import { View,StyleSheet,SafeAreaView,Image,Text, TouchableOpacity } from "react-native";
import avatar from "../assets/images/avatar2.jpg"
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from "expo-router";
import { useAuth } from "@/app/_layout";
import { useEffect, useState } from "react";

export default function Header(){
    const {user} = useAuth();

    const [greetingMsg, setGreetingMsg] = useState("");

    useEffect(() => {
        const currentHour = new Date().getHours();
    
        if (currentHour >= 5 && currentHour < 12) {
            setGreetingMsg("Good Morning! ☀️");
        } else if (currentHour >= 12 && currentHour < 18) {
            setGreetingMsg("Good Afternoon! 🌤️");
        } else {
            setGreetingMsg("Good Evening! 🌙");
        }
    }, []);

    return <SafeAreaView style={styles.main}>
        <TouchableOpacity
            style={styles.avatarContainer}
            onPress={()=> router.push({pathname: "(create_user)",params: { userId: user.userId }})}>
            <Image style={styles.avatar} source={avatar} />
        </TouchableOpacity>
        <View style={styles.welcome}>
          <Text style={styles.h2}>{greetingMsg}</Text>
          <Text style={styles.p}>{user?.name}</Text>
        </View>
        <TouchableOpacity style={styles.notification}>
            <Ionicons name="notifications" size={24} color={"#F8C332"} />
        </TouchableOpacity>
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