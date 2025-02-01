import { View,StyleSheet,SafeAreaView,Image,Text } from "react-native";
import avatar from "../assets/images/avatar2.jpg"
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Header(){
    return <SafeAreaView style={styles.main}>
        <View style={styles.avatarContainer}>
            <Image style={styles.avatar} source={avatar} />
        </View>
        <View style={styles.welcome}>
          <Text style={styles.h2}>Hello,</Text>
          <Text style={styles.p}>Wael Abuawad</Text>
        </View>
        <View style={styles.notification}>
            <Ionicons name="notifications" size={24} />
        </View>
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

    },
    welcome:{
        display:"flex",
        justifyContent:"center",
        alignItems:"center"
    }
})