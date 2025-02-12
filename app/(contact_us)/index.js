import {View,Text,StyleSheet, TouchableOpacity} from "react-native";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { router } from "expo-router";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useEffect, useState } from "react";

export default function HomeScreen(){
    const { language } = useLanguage();
    const [isOpen, setIsOpen] = useState("");

    useEffect(() => {
        const currentHour = new Date().getHours();
    
        // Open from 9 AM (09:00) to 10 PM (22:00)
        if (currentHour >= 9 && currentHour < 22) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, []);

    return <View style={styles.container}>
        <View style={styles.main}>
            <Text style={{fontWeight:"600",textAlign:["he", "ar"].includes(language) ? "right" : "left"}}>{translations[language].contact.weAre} <Text style={{color:isOpen ? "green" : "red"}}>{isOpen ? translations[language].contact.open : translations[language].contact.closed}</Text></Text>
            <Text style={{textAlign:["he", "ar"].includes(language) ? "right" : "left"}}>{translations[language].contact.weAre} {isOpen ? translations[language].contact.open : translations[language].contact.closed} {translations[language].contact.now}</Text>
        </View>
        <View style={styles.section}>
            <View style={[styles.sec,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row",justifyContent:"space-between",paddingHorizontal:10}]}>
                <Text>+970593686817</Text>
                <Text>{translations[language].contact.local}</Text>
            </View>
            <View style={[styles.sec,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                <TouchableOpacity style={styles.item} onPress={()=> router.push("https://www.facebook.com/TAIAR.Palestine/?locale=ar_AR")}>
                    <FontAwesome name="facebook-square" size={24} color="#0B66FF" />
                    <Text style={{fontSize:12}}>{translations[language].contact.facebook}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.item} onPress={()=> router.push("")}>
                    <FontAwesome5 name="facebook-messenger" size={24} color="#0B66FF" />
                    <Text style={{fontSize:12}}>{translations[language].contact.messenger}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.item} onPress={()=> router.push("")}>
                    <FontAwesome name="whatsapp" size={24} color="green" />
                    <Text style={{fontSize:12}}>{translations[language].contact.whatsapp}</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity>
                <Text style={{textAlign:"center",marginTop:25,color:"#F8C332"}}>{translations[language].contact.visitSite}</Text>
            </TouchableOpacity>
        </View>
    </View>
}

const styles = StyleSheet.create({
    container:{
        height:"100%",
        backgroundColor:"white",
        boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
        padding:15,
        paddingTop:25
    },
    main:{
        borderBottomColor:"rgba(0,0,0,.1)",
        borderBottomWidth:1,
        paddingVertical:25,
        marginBottom:25
    },
    sec:{
        flexDirection:"row",
        justifyContent:"space-around",
        alignItems:"center",
        borderBottomColor:"rgba(0,0,0,.1)",
        borderBottomWidth:1,
        paddingVertical:25,
    },
    item:{
        alignItems:"center",
        justifyContent:"center"
    }
})