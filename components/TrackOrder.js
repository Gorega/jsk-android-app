import { View,Text,TextInput,TouchableOpacity,StyleSheet, Pressable } from "react-native"
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from "expo-router";
import { useState } from "react";
import { useCameraPermissions } from 'expo-camera';


export default function TrackOrder(){
    const [value,setValue] = useState("");
    const [permission,requestPermission] = useCameraPermissions();


    return <View style={styles.track}>
        <Text style={styles.h2}>Track Your Package</Text>
        <Text style={styles.p}>Enter Order Number to Start Tracking</Text>
        <View style={styles.flex}>
            <View style={styles.inputBox}>
                <Feather name="package" size={24} color="black" />
                <TextInput
                    style={styles.input}
                    placeholder="for ex:12321411"
                    value={value}
                    onChangeText={(input)=> setValue(input)}
                    returnKeyType="done"
                    onSubmitEditing={()=> {
                        router.push({pathname:"/(tabs)/orders",params:{orderId:value}})
                        setValue("")
                    }}
                />
            </View>
            <TouchableOpacity style={styles.button} onPress={()=> {
              if(permission){
                router.push("(camera)")
              }else{
                requestPermission()
              }
            }}>
                <Ionicons name="scan" size={24} color="white" />
            </TouchableOpacity>
        </View>
    </View>
}

const styles = StyleSheet.create({
    track:{
    },
    h2:{
        fontSize:17,
        fontWeight:500
    },
    p:{
        fontSize:12,
        marginTop:5
    },
    flex:{
        display:"flex",
        flexDirection:"row",
        justifyContent:"center",
        flexWrap:"nowrap",
        alignItems:"center",
        gap:15,
        marginTop:10,
    },
    inputBox:{
        display:"flex",
        flexDirection:"row",
        justifyContent:"flex-start",
        alignItems:"center",
        gap:7,
        backgroundColor:"white",
        width:"80%",
        height:45,
        paddingHorizontal:7
    },
    input:{
        width:"85%",
        textAlign:"left"
    },
    button:{
        backgroundColor:"#F8C332",
        padding:10
    }

    
})