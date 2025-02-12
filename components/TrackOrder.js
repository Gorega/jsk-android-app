import { View,Text,TextInput,TouchableOpacity,StyleSheet } from "react-native"
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from "expo-router";
import { useState } from "react";
import { useCameraPermissions } from 'expo-camera';
import { translations } from '../utils/languageContext';
import { useLanguage } from '../utils/languageContext';


export default function TrackOrder(){
    const [value,setValue] = useState("");
    const [permission,requestPermission] = useCameraPermissions();
    const { language } = useLanguage();


    return <View style={styles.track}>
        <Text style={[styles.h2,{fontWeight:["he", "ar"].includes(language) ? "600" : "500",textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{translations[language].track.title}</Text>
        <Text style={[styles.p,{fontWeight:["he", "ar"].includes(language) && "500",textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{translations[language].track.desc}</Text>
        <View style={[styles.flex,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
            <View style={[styles.inputBox,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                <Feather name="package" size={24} color="black" />
                <TextInput
                    style={[styles.input,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}
                    placeholder={translations[language].track.placeholder} 
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
                router.push("(camera)/lookupOrder")
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
        fontWeight:"500"
    },
    p:{
        fontSize:13,
        marginTop:5,
    },
    flex:{
        flexDirection:"row",
        justifyContent:"center",
        flexWrap:"nowrap",
        alignItems:"center",
        gap:15,
        marginTop:10,
    },
    inputBox:{
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